import {
  Body,
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
  Logger,
  Request,
} from '@nestjs/common';
import { execSync, execFileSync, spawn } from 'child_process';
import { join } from 'path';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Permissions } from '../auth/decorators/roles.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

interface DeployRecord {
  id: string;
  timestamp: string;
  commit: string;
  version: string;
  deployedBy: string;
  status: 'success' | 'pending' | 'rollback';
}

// Ordered by preference: data volume first (Docker, always a directory mount → reliable),
// then legacy paths, then local-dev fallback
const HISTORY_PATHS = [
  '/app/data/deploy-history.json',           // Docker: ./data volume (persistent directory mount)
  '/app/deploy-history.json',                // Docker: legacy file-level mount
  '/app/album-manager/deploy-history.json',  // legacy
  join(__dirname, '..', '..', 'deploy-history.json'), // local dev (server/dist/ or server/src/)
  join(process.cwd(), 'deploy-history.json'), // last-resort fallback
  '/tmp/deploy-history.json',
];

const historyLogger = new Logger('DeployHistory');

function findHistoryPath(): string {
  // Prefer an existing file
  for (const p of HISTORY_PATHS) {
    if (existsSync(p)) return p;
  }
  // Otherwise pick the first writable directory
  const { mkdirSync } = require('fs') as typeof import('fs');
  for (const p of HISTORY_PATHS) {
    try {
      mkdirSync(join(p, '..'), { recursive: true });
      return p;
    } catch { /* try next */ }
  }
  return HISTORY_PATHS[HISTORY_PATHS.length - 1]; // /tmp always writable
}

function loadHistory(): DeployRecord[] {
  try {
    const p = findHistoryPath();
    if (!existsSync(p)) return [];
    return JSON.parse(readFileSync(p, 'utf8')) as DeployRecord[];
  } catch (e) {
    historyLogger.warn(`Could not load history: ${e}`);
    return [];
  }
}

function saveHistory(records: DeployRecord[]): void {
  try {
    const p = findHistoryPath();
    writeFileSync(p, JSON.stringify(records.slice(0, 50), null, 2));
    historyLogger.debug(`History saved to ${p}`);
  } catch (e) {
    historyLogger.error(`Could not save history: ${e}`);
  }
}

function getCurrentCommit(cwd: string): string {
  if (process.env.GIT_COMMIT) return process.env.GIT_COMMIT;
  try {
    return execSync('git log -1 --format="%h - %s"', { encoding: 'utf8', cwd }).trim();
  } catch {
    return 'unknown';
  }
}

function findGitDir(): string | null {
  const dirs = [process.cwd(), join(process.cwd(), '..'), '/app/album-manager', '/app'];
  for (const dir of dirs) {
    if (existsSync(join(dir, '.git'))) return dir;
  }
  return null;
}

function findScriptPath(): string | null {
  const paths = [
    join(__dirname, '..', '..', 'deploy.sh'),
    join(process.cwd(), 'deploy.sh'),
    join(process.cwd(), '..', 'deploy.sh'),
  ];
  return paths.find(existsSync) ?? null;
}

@ApiTags('deploy')
@ApiBearerAuth()
@Controller('deploy')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DeployController {
  private readonly logger = new Logger(DeployController.name);

  @Post()
  @Permissions('manage:deploy')
  @ApiOperation({ summary: 'Executa el script de desplegament' })
  deploy(@Request() req: { user: { username: string } }) {
    const scriptPath = findScriptPath();
    if (!scriptPath) {
      throw new InternalServerErrorException('Script de desplegament no trobat.');
    }

    // Save history record before deploying
    const gitDir = findGitDir();
    const commit = gitDir ? getCurrentCommit(gitDir) : 'unknown';
    let version = 'unknown';
    try {
      const pkgPath = [
        join(process.cwd(), 'package.json'),
        join(__dirname, '..', '..', 'package.json'),
      ].find(existsSync);
      if (pkgPath) {
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as { version?: string };
        version = pkg.version ?? 'unknown';
      }
    } catch { /* ignore */ }

    const record: DeployRecord = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      commit,
      version,
      deployedBy: req.user?.username ?? 'unknown',
      status: 'pending',
    };
    const history = loadHistory();
    history.unshift(record);
    saveHistory(history);

    this.logger.log(`Iniciant desplegament en segon pla: ${scriptPath}`);
    const scriptDir = join(scriptPath, '..');

    setTimeout(() => {
      const subprocess = spawn('bash', [scriptPath], {
        cwd: scriptDir,
        detached: true,
        stdio: 'ignore',
      });
      subprocess.unref();

      // Mark as success (optimistic — script runs detached)
      const updated = loadHistory();
      const rec = updated.find((r) => r.id === record.id);
      if (rec) { rec.status = 'success'; saveHistory(updated); }
    }, 500);

    return {
      message: "El desplegament s'ha iniciat correctament. El servidor es reiniciarà en breu.",
    };
  }

  @Post('rollback/:commitHash')
  @Permissions('manage:deploy')
  @ApiOperation({ summary: 'Reverteix al commit especificat i redeploy' })
  rollback(
    @Param('commitHash') commitHash: string,
    @Request() req: { user: { username: string } },
  ) {
    // Validar la forma del hash ABANS d'usar-lo: només hex (7-40 chars).
    // Evita injecció de comandes (p.ex. "abc;rm -rf /") al subprocés git.
    if (!/^[0-9a-f]{7,40}$/i.test(commitHash)) {
      throw new BadRequestException('Hash de commit no vàlid.');
    }

    const scriptPath = findScriptPath();
    if (!scriptPath) {
      throw new InternalServerErrorException('Script de desplegament no trobat.');
    }

    const gitDir = findGitDir();
    if (!gitDir) {
      throw new NotFoundException('Repositori git no trobat.');
    }

    // Validate commit exists (execFileSync: sense shell, sense interpolació)
    try {
      execFileSync('git', ['cat-file', '-t', commitHash], { cwd: gitDir, stdio: 'pipe' });
    } catch {
      throw new NotFoundException(`Commit "${commitHash}" no trobat al repositori.`);
    }

    const record: DeployRecord = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      commit: commitHash,
      version: 'rollback',
      deployedBy: req.user?.username ?? 'unknown',
      status: 'rollback',
    };
    const history = loadHistory();
    history.unshift(record);
    saveHistory(history);

    this.logger.log(`Iniciant rollback al commit ${commitHash}`);
    const scriptDir = join(scriptPath, '..');

    setTimeout(() => {
      try {
        execFileSync('git', ['checkout', commitHash], { cwd: gitDir, stdio: 'pipe' });
      } catch (e) {
        this.logger.error(`Error fent git checkout: ${e}`);
      }
      const subprocess = spawn('bash', [scriptPath], {
        cwd: scriptDir,
        detached: true,
        stdio: 'ignore',
      });
      subprocess.unref();
    }, 500);

    return {
      message: `Rollback al commit ${commitHash} iniciat. El servidor es reiniciarà en breu.`,
    };
  }

  @Get('history')
  @Permissions('manage:deploy')
  @ApiOperation({ summary: 'Historial de desplegaments' })
  getHistory() {
    return { history: loadHistory() };
  }

  @Get('logs')
  @Permissions('manage:deploy')
  @ApiOperation({ summary: 'Obté els logs del darrer desplegament' })
  getLogs() {
    const pathsToTry = [
      join(process.cwd(), 'deploy.log'),
      '/app/album-manager/deploy.log',
      '/app/deploy.log',
      join(__dirname, '..', '..', 'deploy.log'),
      join(process.cwd(), '..', 'deploy.log'),
      '/tmp/deploy.log',
    ];
    const logPath = pathsToTry.find(existsSync) ?? null;
    if (!logPath) {
      return { logs: 'No hi ha logs disponibles encara. Inicia un desplegament per generar-los.' };
    }
    try {
      return { logs: readFileSync(logPath, 'utf8') };
    } catch (error) {
      throw new InternalServerErrorException('Error llegint el fitxer de logs');
    }
  }

  @Get('version')
  @Permissions('manage:deploy')
  @ApiOperation({ summary: 'Obté la versió actual del sistema' })
  getVersion() {
    const pkgPaths = [
      '/app/album-manager/server/package.json',
      '/app/server/package.json',
      join(process.cwd(), 'server', 'package.json'),
      join(process.cwd(), 'package.json'),
      join(__dirname, '..', '..', 'package.json'),
    ];
    const pkgPath = pkgPaths.find(existsSync) ?? null;

    let version = 'unknown';
    let name = 'unknown';
    if (pkgPath) {
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as { version?: string; name?: string };
        version = pkg.version ?? 'unknown';
        name = pkg.name ?? 'unknown';
      } catch { /* ignore */ }
    }

    const gitDir = findGitDir();
    const lastCommit = gitDir ? getCurrentCommit(gitDir) : 'N/A';

    return { version, name, lastCommit, environment: process.env.NODE_ENV ?? 'development' };
  }
}

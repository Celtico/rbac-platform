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
import { execSync, execFileSync } from 'child_process';
import { join, dirname } from 'path';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
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

// Writable locations only (the host repo is now mounted read-only, so it must
// NOT be a write target). The ./data volume is the canonical store.
const HISTORY_PATHS = [
  '/app/data/deploy-history.json',                    // Docker: ./data volume
  join(process.cwd(), 'data', 'deploy-history.json'), // dev: <repo>/data
  join(__dirname, '..', '..', 'data', 'deploy-history.json'),
  join(process.cwd(), 'deploy-history.json'),         // last-resort fallback
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

// The web app has NO Docker access. A deploy is requested by writing this file
// to the shared ./data volume; deploy-watcher.sh on the HOST consumes it and
// performs the privileged build/restart from git origin. See DEPLOY.md.
const DEPLOY_REQUEST_PATHS = [
  '/app/data/deploy-request.json',
  join(__dirname, '..', '..', 'data', 'deploy-request.json'),
  join(process.cwd(), 'data', 'deploy-request.json'),
  '/tmp/deploy-request.json',
];

function writeDeployRequest(payload: {
  type: 'deploy' | 'rollback';
  commit?: string;
  requestedBy: string;
}): string {
  const body = JSON.stringify(
    { ...payload, requestedAt: new Date().toISOString() },
    null,
    2,
  );
  for (const p of DEPLOY_REQUEST_PATHS) {
    try {
      mkdirSync(dirname(p), { recursive: true });
      writeFileSync(p, body);
      return p;
    } catch {
      /* try next location */
    }
  }
  throw new InternalServerErrorException(
    'No s\'ha pogut registrar la sol·licitud de desplegament.',
  );
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

@ApiTags('deploy')
@ApiBearerAuth()
@Controller('deploy')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DeployController {
  private readonly logger = new Logger(DeployController.name);

  @Post()
  @Permissions('manage:deploy')
  @ApiOperation({ summary: 'Sol·licita un desplegament (el processa el host)' })
  deploy(@Request() req: { user: { username: string } }) {
    // Save history record (kept as "pending" — the host watcher does the work;
    // we no longer optimistically report success from here).
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

    const requestPath = writeDeployRequest({
      type: 'deploy',
      requestedBy: req.user?.username ?? 'unknown',
    });
    this.logger.log(`Sol·licitud de desplegament registrada a ${requestPath}`);

    return {
      message:
        "Sol·licitud de desplegament registrada. El host la processarà en breu i el servidor es reiniciarà.",
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

    // Best-effort existence check if the repo is readable from here; the host
    // watcher re-validates the hash and performs the authoritative checkout.
    const gitDir = findGitDir();
    if (gitDir) {
      try {
        execFileSync('git', ['cat-file', '-t', commitHash], { cwd: gitDir, stdio: 'pipe' });
      } catch {
        throw new NotFoundException(`Commit "${commitHash}" no trobat al repositori.`);
      }
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

    const requestPath = writeDeployRequest({
      type: 'rollback',
      commit: commitHash,
      requestedBy: req.user?.username ?? 'unknown',
    });
    this.logger.log(`Sol·licitud de rollback a ${commitHash} registrada a ${requestPath}`);

    return {
      message: `Sol·licitud de rollback al commit ${commitHash} registrada. El host la processarà en breu.`,
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
      '/app/data/deploy.log', // shared volume — where deploy-watcher.sh writes
      join(process.cwd(), 'data', 'deploy.log'),
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

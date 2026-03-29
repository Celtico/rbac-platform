import {
  Controller,
  Post,
  Get,
  UseGuards,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { exec, execSync } from 'child_process';
import { join } from 'path';
import { existsSync, readFileSync } from 'fs';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('deploy')
@ApiBearerAuth()
@Controller('deploy')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DeployController {
  private readonly logger = new Logger(DeployController.name);

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Executa el script de desplegament' })
  deploy() {
    // Intentem localitzar el script a l'arrel o a la carpeta pare segons on s'executi
    let scriptPath = join(__dirname, '..', '..', 'deploy.sh');
    if (!existsSync(scriptPath)) {
      scriptPath = join(process.cwd(), 'deploy.sh');
    }
    if (!existsSync(scriptPath)) {
      scriptPath = join(process.cwd(), '..', 'deploy.sh');
    }

    if (!existsSync(scriptPath)) {
      this.logger.error(
        `No s'ha trobat el script de desplegament a cap de les rutes provades.`,
      );
      throw new InternalServerErrorException(
        'Script de desplegament no trobat.',
      );
    }

    this.logger.log(`Iniciant desplegament en segon pla: ${scriptPath}`);

    // Executem en segon pla per evitar tallar la connexió abans de respondre
    // i perquè el script pugui reiniciar el contenidor sense que el client vegi un error de xarxa.
    const scriptDir = join(scriptPath, '..');
    setTimeout(() => {
      this.logger.log(`Executant: bash ${scriptPath} des de ${scriptDir}`);
      exec(
        `bash ${scriptPath}`,
        { cwd: scriptDir },
        (error, stdout, stderr) => {
          if (error) {
            this.logger.error(
              `Error en el desplegament (segon pla): ${error.message}`,
            );
            this.logger.error(`Stdout: ${stdout}`);
            this.logger.error(`Stderr: ${stderr}`);
            return;
          }
          this.logger.log(`Desplegament completat amb èxit.`);
          this.logger.log(`Stdout: ${stdout}`);
        },
      );
    }, 1000);

    return {
      message:
        "El desplegament s'ha iniciat correctament. El servidor es reiniciarà en breu.",
    };
  }

  @Get('logs')
  @Roles('admin')
  @ApiOperation({ summary: 'Obté els logs del darrer desplegament' })
  getLogs() {
    const pathsToTry = [
      join(__dirname, '..', '..', 'deploy.log'),
      join(process.cwd(), 'deploy.log'),
      join(process.cwd(), '..', 'deploy.log'),
      '/app/deploy.log',
      '/tmp/deploy.log',
    ];

    let logPath: string | null = null;
    for (const p of pathsToTry) {
      if (existsSync(p)) {
        logPath = p;
        break;
      }
    }

    if (!logPath) {
      return {
        logs: 'No hi ha logs disponibles encara. Inicia un desplegament per generar-los.',
      };
    }

    try {
      const logs = readFileSync(logPath, 'utf8');
      return { logs };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Error llegint els logs: ${errorMessage}`);
      throw new InternalServerErrorException('Error llegint el fitxer de logs');
    }
  }

  @Get('version')
  @Roles('admin')
  @ApiOperation({ summary: 'Obté la versió actual del sistema' })
  getVersion() {
    const pkgPaths = [
      join(__dirname, '..', '..', 'package.json'),
      join(process.cwd(), 'package.json'),
      '/app/server/package.json',
      '/app/package.json',
    ];

    let pkgPath: string | null = null;
    for (const p of pkgPaths) {
      if (existsSync(p)) {
        pkgPath = p;
        break;
      }
    }

    let version = 'unknown';
    let name = 'unknown';

    if (pkgPath) {
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as {
          version?: string;
          name?: string;
        };
        version = pkg.version || 'unknown';
        name = pkg.name || 'unknown';
      } catch (e) {
        this.logger.error(
          `Error parsejant package.json: ${
            e instanceof Error ? e.message : String(e)
          }`,
        );
      }
    }

    // Intentar obtenir el darrer commit si git està disponible
    let lastCommit = 'N/A';
    try {
      lastCommit = execSync('git log -1 --format=%h - %s', {
        encoding: 'utf8',
      }).trim();
    } catch (e) {
      this.logger.warn(
        `No s'ha pogut obtenir el darrer commit de Git: ${
          e instanceof Error ? e.message : String(e)
        }`,
      );
    }

    return {
      version,
      name,
      lastCommit,
      environment: process.env.NODE_ENV || 'development',
    };
  }
}

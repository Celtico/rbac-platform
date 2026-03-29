import {
  Controller,
  Post,
  Get,
  UseGuards,
  InternalServerErrorException,
  Logger,
  NotFoundException,
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
  async deploy() {
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
      exec(scriptPath, { cwd: scriptDir }, (error, stdout, stderr) => {
        if (error) {
          this.logger.error(
            `Error en el desplegament (segon pla): ${error.message}`,
          );
          this.logger.error(`Stderr: ${stderr}`);
          return;
        }
        this.logger.log(`Desplegament completat amb èxit.`);
      });
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
    let logPath = join(__dirname, '..', '..', 'deploy.log');
    if (!existsSync(logPath)) {
      logPath = join(process.cwd(), 'deploy.log');
    }
    if (!existsSync(logPath)) {
      logPath = join(process.cwd(), '..', 'deploy.log');
    }

    if (!existsSync(logPath)) {
      throw new NotFoundException('Fitxer de logs no trobat.');
    }

    try {
      const logs = readFileSync(logPath, 'utf8');
      return { logs };
    } catch (error) {
      this.logger.error(`Error llegint els logs: ${error.message}`);
      throw new InternalServerErrorException('Error llegint el fitxer de logs');
    }
  }

  @Get('version')
  @Roles('admin')
  @ApiOperation({ summary: 'Obté la versió actual del sistema' })
  getVersion() {
    let pkgPath = join(__dirname, '..', '..', 'package.json');
    if (!existsSync(pkgPath)) {
      pkgPath = join(process.cwd(), 'package.json');
    }

    let version = 'unknown';
    let name = 'unknown';

    if (existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as {
          version?: string;
          name?: string;
        };
        version = pkg.version || 'unknown';
        name = pkg.name || 'unknown';
      } catch (e) {
        this.logger.error(`Error parsejant package.json: ${e.message}`);
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
        `No s'ha pogut obtenir el darrer commit de Git: ${e.message}`,
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

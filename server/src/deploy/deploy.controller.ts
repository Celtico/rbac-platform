import {
  Controller,
  Post,
  UseGuards,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { exec } from 'child_process';
import { join } from 'path';
import { existsSync } from 'fs';
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
    let scriptPath = join(process.cwd(), 'deploy.sh');
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

    this.logger.log(`Iniciant desplegament: ${scriptPath}`);

    // Nota: L'execució pot trigar. En un entorn real potser voldríem un
    // sistema de cues, però per ara ho fem directe.
    return new Promise((resolve, reject) => {
      exec(scriptPath, (error, stdout, stderr) => {
        if (error) {
          this.logger.error(`Error en el desplegament: ${error.message}`);
          this.logger.error(`Stderr: ${stderr}`);
          return reject(
            new InternalServerErrorException(
              `Error en el desplegament: ${error.message}`,
            ),
          );
        }

        this.logger.log(`Desplegament completat amb èxit.`);
        this.logger.debug(`Stdout: ${stdout}`);

        resolve({
          message: 'Desplegament iniciat i completat amb èxit',
          output: stdout,
        });
      });
    });
  }
}

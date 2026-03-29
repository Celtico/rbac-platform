import {
  Controller,
  Post,
  UseGuards,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { exec } from 'child_process';
import { join } from 'path';
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
    const scriptPath = join(process.cwd(), 'deploy.sh');

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

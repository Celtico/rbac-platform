import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'API de RESTful para gestionar usuarios, roles y permisos';
  }
}

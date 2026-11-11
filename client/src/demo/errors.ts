/** Error HTTP de la demo, amb la mateixa forma que les respostes d'error de NestJS. */
export class DemoHttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "DemoHttpError";
    this.status = status;
  }

  body(): { statusCode: number; message: string } {
    return { statusCode: this.status, message: this.message };
  }
}

export const badRequest = (message: string) => new DemoHttpError(400, message);
export const unauthorized = (message = "Unauthorized") => new DemoHttpError(401, message);
export const forbidden = (message = "Forbidden resource") => new DemoHttpError(403, message);
export const notFound = (message: string) => new DemoHttpError(404, message);

import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { AppLoggerService } from '../logging/app-logger.service';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: AppLoggerService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { user?: { sub?: string } }>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Erreur interne du serveur';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      message = typeof res === 'string' ? res : (res as any).message || message;
    }

    // Toutes les erreurs sont journalisées, y compris les 4xx : ce sont elles
    // qui révèlent les blocages vécus par les utilisateurs (crédits épuisés,
    // validation refusée, session expirée). La pile n'est utile que sur les 5xx.
    this.logger.write({
      kind: 'log',
      level: status >= 500 ? 'error' : 'warn',
      context: 'HttpException',
      message: Array.isArray(message) ? message.join(' | ') : String(message),
      status,
      method: request.method,
      path: request.url,
      userId: request.user?.sub,
      requestId: response.getHeader('X-Request-Id') as string | undefined,
      stack: status >= 500 && exception instanceof Error ? exception.stack : undefined,
    });

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}

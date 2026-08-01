import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import type { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { AppLoggerService } from './app-logger.service';

/**
 * Journalise chaque requête HTTP : verbe, chemin, statut, durée, utilisateur.
 *
 * C'est la brique qui manquait pour répondre à « où les utilisateurs
 * bloquent-ils ? » — sans elle, les logs ne contiennent que des traces
 * techniques éparses, sans trace des appels réellement passés.
 */
@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: AppLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();

    const req = context.switchToHttp().getRequest<Request & { user?: { sub?: string } }>();
    const res = context.switchToHttp().getResponse<Response>();
    const start = Date.now();

    // Identifiant de corrélation : relie la requête à ses erreurs éventuelles.
    const requestId = (req.headers['x-request-id'] as string) || randomUUID();
    res.setHeader('X-Request-Id', requestId);

    const finish = (status: number) => {
      this.logger.write({
        kind: 'http',
        level: status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info',
        context: 'HTTP',
        requestId,
        method: req.method,
        // `route.path` évite de faire exploser la cardinalité avec les ids.
        path: (req as any).route?.path ?? req.path,
        status,
        durationMs: Date.now() - start,
        userId: req.user?.sub,
        ua: req.headers['user-agent'],
      });
    };

    return next.handle().pipe(
      tap({
        complete: () => finish(res.statusCode),
        // Une exception remonte au filtre global, qui journalise le détail :
        // ici on ne trace que l'issue de la requête.
        error: (err: { status?: number }) => finish(err?.status ?? 500),
      }),
    );
  }
}

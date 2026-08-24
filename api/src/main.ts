import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { AppLoggerService } from './common/logging/app-logger.service';
import { RequestLoggingInterceptor } from './common/logging/request-logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true, bufferLogs: true });

  // Journalisation structurée, persistée hors du conteneur (cf. LOG_DIR).
  // Remplace le logger par défaut de Nest : les traces des dépendances passent
  // donc aussi par lui — notamment nest-keycloak-connect, dont le niveau
  // `verbose` recrache le JWT complet à chaque requête et n'est jamais relayé.
  const logger = app.get(AppLoggerService);
  app.useLogger(logger);
  app.useGlobalInterceptors(new RequestLoggingInterceptor(logger));

  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:4200',
    credentials: true,
    // `X-Session-Id` porte l'identifiant de visite anonyme (cf. FunnelService) :
    // sans lui dans cette liste, le navigateur bloque la requête au préalable.
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-Id'],
  });

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  app.useGlobalFilters(new AllExceptionsFilter(logger));

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

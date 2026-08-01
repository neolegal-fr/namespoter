import { Global, Module } from '@nestjs/common';
import { AppLoggerService } from './app-logger.service';

/**
 * Global : n'importe quel service peut injecter AppLoggerService pour émettre
 * un événement métier, sans avoir à l'importer module par module.
 */
@Global()
@Module({
  providers: [AppLoggerService],
  exports: [AppLoggerService],
})
export class LoggingModule {}

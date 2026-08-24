import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FunnelService } from './funnel.service';
import { VisitorSession } from './visitor-session.entity';

/**
 * Global, comme la journalisation : les étapes de l'entonnoir se marquent
 * depuis quatre modules différents (events, users, domain, brand-report), et
 * les faire tous importer un module de statistiques n'apprendrait rien à
 * personne.
 */
@Global()
@Module({
  imports: [TypeOrmModule.forFeature([VisitorSession])],
  providers: [FunnelService],
  exports: [FunnelService],
})
export class FunnelModule {}

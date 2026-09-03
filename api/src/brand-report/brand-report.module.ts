import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BrandReportController } from './brand-report.controller';
import { BrandReportService } from './brand-report.service';
import { BrandReportStore } from './brand-report.store';
import { BrandReportRecord } from './entities/brand-report-record.entity';
import { SocialCheckService } from './social/social-check.service';
import { TrademarkService } from './trademark/trademark.service';
import { NameVariantsService } from './trademark/name-variants.service';
import { RdapService } from '../domain/rdap.service';
import { DomainService } from '../domain/domain.service';
import { UsersModule } from '../users/users.module';
import { ProjectsModule } from '../projects/projects.module';
import { MailModule } from '../mail/mail.module';
import { ReportMailService } from './report-mail.service';

/**
 * Épic « Rapport de disponibilité de marque » (US-050→055).
 * Réutilise RdapService (domaine), DomainService (qualité IA), UsersService
 * (crédits) et MailService (livraison), et ajoute la vérif sociale, la
 * pré-vérif marque et la mise en cache des rapports (pas de re-débit).
 */
@Module({
  imports: [UsersModule, MailModule, ProjectsModule, TypeOrmModule.forFeature([BrandReportRecord])],
  providers: [
    BrandReportService,
    BrandReportStore,
    SocialCheckService,
    TrademarkService,
    NameVariantsService,
    ReportMailService,
    RdapService,
    DomainService,
  ],
  controllers: [BrandReportController],
})
export class BrandReportModule {}

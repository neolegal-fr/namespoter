import { Module } from '@nestjs/common';
import { BrandReportController } from './brand-report.controller';
import { BrandReportService } from './brand-report.service';
import { SocialCheckService } from './social/social-check.service';
import { TrademarkService } from './trademark/trademark.service';
import { RdapService } from '../domain/rdap.service';
import { UsersModule } from '../users/users.module';
import { MailModule } from '../mail/mail.module';
import { ReportMailService } from './report-mail.service';

/**
 * Épic « Rapport de disponibilité de marque » (US-050→055).
 * Réutilise RdapService (disponibilité domaine), UsersService (crédits) et
 * MailService (livraison), et ajoute la vérif sociale et la pré-vérif marque.
 */
@Module({
  imports: [UsersModule, MailModule],
  providers: [BrandReportService, SocialCheckService, TrademarkService, ReportMailService, RdapService],
  controllers: [BrandReportController],
})
export class BrandReportModule {}

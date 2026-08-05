import { Module } from '@nestjs/common';
import { BrandReportController } from './brand-report.controller';
import { BrandReportService } from './brand-report.service';
import { SocialCheckService } from './social/social-check.service';
import { TrademarkService } from './trademark/trademark.service';
import { RdapService } from '../domain/rdap.service';
import { UsersModule } from '../users/users.module';

/**
 * Épic « Rapport de disponibilité de marque » (US-050→055).
 * Réutilise RdapService (disponibilité domaine) et UsersService (crédits), et
 * ajoute la vérif sociale et la pré-vérif marque. PDF/email suivront (US-053).
 */
@Module({
  imports: [UsersModule],
  providers: [BrandReportService, SocialCheckService, TrademarkService, RdapService],
  controllers: [BrandReportController],
})
export class BrandReportModule {}

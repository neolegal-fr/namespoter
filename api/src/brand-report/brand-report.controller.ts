import { Controller, Post, Body, Logger } from '@nestjs/common';
import { AuthenticatedUser, Public } from 'nest-keycloak-connect';
import { BrandReportService } from './brand-report.service';
import { BrandReportRequestDto } from './dto/brand-report.dto';
import { AppLoggerService } from '../common/logging/app-logger.service';

@Controller('brand-report')
export class BrandReportController {
  private readonly logger = new Logger(BrandReportController.name);

  constructor(
    private readonly brandReport: BrandReportService,
    private readonly events: AppLoggerService,
  ) {}

  /**
   * Aperçu public bridé (US-055) : domaine phare + quelques réseaux, sans marque.
   * Sert de démonstration sur la landing avant l'achat du rapport complet.
   */
  @Public()
  @Post('preview')
  async preview(@Body() dto: BrandReportRequestDto) {
    return this.brandReport.generate(dto.name, { preview: true });
  }

  /**
   * Rapport complet (authentifié). Le débit de 300 crédits, l'export PDF et
   * l'envoi par email arrivent avec US-052/US-053.
   */
  @Post()
  async full(
    @Body() dto: BrandReportRequestDto,
    @AuthenticatedUser() keycloakUser: { sub: string },
  ) {
    // TODO US-052 : débiter 300 crédits (atomique) avant génération ; 402 si insuffisant.
    // TODO US-053 : générer le PDF et l'envoyer par email (avec consentement RGPD).
    this.events.event('brand_report_requested', { sub: keycloakUser.sub });
    return this.brandReport.generate(dto.name, { extensions: dto.extensions });
  }
}

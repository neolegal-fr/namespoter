import { Controller, Post, Body, Logger, ForbiddenException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AuthenticatedUser, Public } from 'nest-keycloak-connect';
import { BrandReportService, BRAND_REPORT_COST } from './brand-report.service';
import { BrandReportRequestDto } from './dto/brand-report.dto';
import { UsersService } from '../users/users.service';
import { AppLoggerService } from '../common/logging/app-logger.service';

@Controller('brand-report')
export class BrandReportController {
  private readonly logger = new Logger(BrandReportController.name);

  constructor(
    private readonly brandReport: BrandReportService,
    private readonly usersService: UsersService,
    @InjectDataSource() private readonly dataSource: DataSource,
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
   * Rapport complet (authentifié), facturé {@link BRAND_REPORT_COST} crédits.
   *
   * La génération (I/O externe : domaines, réseaux, INPI) se fait AVANT le
   * débit : un échec ne consomme donc aucun crédit. Le débit lui-même est
   * atomique (transaction + `decrementCredits`, sûr face aux accès concurrents).
   */
  @Post()
  async full(
    @Body() dto: BrandReportRequestDto,
    @AuthenticatedUser() keycloakUser: { sub: string },
  ) {
    const user = await this.usersService.findOrCreate(keycloakUser.sub);
    if (user.totalCredits < BRAND_REPORT_COST) {
      this.events.event('brand_report_blocked_no_credits', { sub: keycloakUser.sub, cost: BRAND_REPORT_COST });
      throw new ForbiddenException('Crédits insuffisants');
    }

    const report = await this.brandReport.generate(dto.name, { extensions: dto.extensions });

    let remainingCredits = user.totalCredits - BRAND_REPORT_COST;
    await this.dataSource.transaction(async (manager) => {
      const newTotal = await this.usersService.decrementCredits(keycloakUser.sub, BRAND_REPORT_COST, manager);
      // -1 = crédits devenus insuffisants entre-temps : on annule (rollback).
      if (newTotal < 0) throw new ForbiddenException('Crédits insuffisants');
      remainingCredits = newTotal;
    });

    this.events.event('brand_report_generated', {
      sub: keycloakUser.sub,
      cost: BRAND_REPORT_COST,
      score: report.score,
    });
    // TODO US-053 : générer le PDF et l'envoyer par email (avec consentement RGPD).
    return { ...report, remainingCredits };
  }
}

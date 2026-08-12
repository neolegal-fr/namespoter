import { Controller, Post, Get, Param, Body, Query, Logger, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AuthenticatedUser, Public } from 'nest-keycloak-connect';
import { BrandReportService, BRAND_REPORT_COST } from './brand-report.service';
import { BrandReportStore } from './brand-report.store';
import { ReportMailService } from './report-mail.service';
import { BrandReportRequestDto } from './dto/brand-report.dto';
import { UsersService } from '../users/users.service';
import { AppLoggerService } from '../common/logging/app-logger.service';

@Controller('brand-report')
export class BrandReportController {
  private readonly logger = new Logger(BrandReportController.name);

  constructor(
    private readonly brandReport: BrandReportService,
    private readonly store: BrandReportStore,
    private readonly reportMail: ReportMailService,
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

  /** Rapport partagé en lecture seule (public, via jeton). */
  @Public()
  @Get('shared/:token')
  async shared(@Param('token') token: string) {
    const report = await this.store.findByToken(token);
    if (!report) throw new NotFoundException('Rapport introuvable');
    return report;
  }

  /** Noms pour lesquels ce compte a déjà un rapport (le front affiche « Voir le rapport »). */
  @Get('mine')
  async mine(@AuthenticatedUser() keycloakUser: { sub: string }) {
    return { names: await this.store.listNames(keycloakUser.sub) };
  }

  /**
   * Rapport déjà généré pour ce (compte, nom) — permet au front de proposer un
   * lien « voir le rapport » plutôt que de refacturer 500 crédits.
   */
  @Get('existing')
  async existing(
    @Query('name') name: string,
    @AuthenticatedUser() keycloakUser: { sub: string },
  ) {
    const report = name ? await this.store.find(keycloakUser.sub, name) : null;
    return report ? { exists: true, report } : { exists: false };
  }

  /**
   * Rapport complet (authentifié), facturé {@link BRAND_REPORT_COST} crédits.
   *
   * Idempotent : si un rapport existe déjà pour ce (compte, nom), il est renvoyé
   * SANS débit (`cached: true`). Sinon, la génération (I/O externe) se fait AVANT
   * le débit — un échec ne consomme aucun crédit — et le débit est atomique.
   */
  @Post()
  async full(
    @Body() dto: BrandReportRequestDto,
    @AuthenticatedUser() keycloakUser: { sub: string; email?: string },
  ) {
    const user = await this.usersService.findOrCreate(keycloakUser.sub);

    // Déjà généré → on le renvoie tel quel, sans refacturer (sauf régénération forcée).
    // Protégé : un souci de cache ne doit jamais faire échouer la génération.
    let cached: Awaited<ReturnType<typeof this.store.find>> = null;
    if (!dto.force) {
      cached = await this.store.find(keycloakUser.sub, dto.name).catch((e) => {
        this.logger.error('Lecture du cache de rapport échouée', e);
        return null;
      });
    }
    if (cached) {
      this.events.event('brand_report_cache_hit', { sub: keycloakUser.sub });
      return { ...cached, remainingCredits: user.totalCredits, emailed: false, cached: true };
    }

    if (user.totalCredits < BRAND_REPORT_COST) {
      this.events.event('brand_report_blocked_no_credits', { sub: keycloakUser.sub, cost: BRAND_REPORT_COST });
      throw new ForbiddenException('Crédits insuffisants');
    }

    const report = await this.brandReport.generate(dto.name, {
      extensions: dto.extensions,
      withQuality: true,
    });

    let remainingCredits = user.totalCredits - BRAND_REPORT_COST;
    await this.dataSource.transaction(async (manager) => {
      const newTotal = await this.usersService.decrementCredits(keycloakUser.sub, BRAND_REPORT_COST, manager);
      // -1 = crédits devenus insuffisants entre-temps : on annule (rollback).
      if (newTotal < 0) throw new ForbiddenException('Crédits insuffisants');
      remainingCredits = newTotal;
    });

    // Mémoriser pour éviter tout re-débit ultérieur (best-effort).
    await this.store.save(keycloakUser.sub, dto.name, report).catch((e) =>
      this.logger.error('Échec de la mémorisation du rapport', e),
    );

    this.events.event('brand_report_generated', {
      sub: keycloakUser.sub,
      cost: BRAND_REPORT_COST,
      score: report.score,
    });

    // Destinataires : la liste fournie, sinon l'email du compte.
    // Envoi en tâche de fond : ne bloque jamais la réponse (best-effort, borné
    // par les timeouts SMTP). Le rapport s'affiche immédiatement.
    const recipients = dto.emails?.length ? dto.emails : keycloakUser.email;
    void this.reportMail.sendReport(recipients, report).catch((e) =>
      this.logger.error('Envoi email du rapport échoué', e),
    );
    const willEmail = Array.isArray(recipients) ? recipients.length > 0 : !!recipients;
    return { ...report, remainingCredits, emailed: willEmail, cached: false };
  }
}

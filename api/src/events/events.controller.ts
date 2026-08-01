import { Body, Controller, HttpCode, Post, Req } from '@nestjs/common';
import { Public } from 'nest-keycloak-connect';
import type { Request } from 'express';
import { TrackEventDto } from './dto/track-event.dto';
import { AppLoggerService } from '../common/logging/app-logger.service';

/**
 * Collecte des étapes de parcours envoyées par le front.
 *
 * Pourquoi ne pas se reposer sur Google Analytics seul : la mesure y est
 * conditionnée au consentement cookies, donc aveugle sur une partie du trafic —
 * précisément celle qui abandonne le plus tôt. Ces événements-ci sont
 * anonymes (aucun cookie, identifiant de session éphémère côté navigateur) et
 * servent au diagnostic produit : où s'arrête un utilisateur, et pourquoi.
 */
@Controller('events')
export class EventsController {
  /** Garde-fou : au-delà, on tronque plutôt que de polluer les logs. */
  private readonly MAX_META_KEYS = 20;
  private readonly MAX_VALUE_LENGTH = 300;

  constructor(private readonly logger: AppLoggerService) {}

  @Public()
  @Post()
  @HttpCode(204)
  track(@Body() dto: TrackEventDto, @Req() req: Request & { user?: { sub?: string } }) {
    this.logger.event(dto.name, {
      sessionId: dto.sessionId,
      userId: req.user?.sub,
      path: (req.headers['referer'] as string) ?? undefined,
      ...this.sanitize(dto.meta),
    });
  }

  /**
   * Le corps vient du navigateur : on borne la taille et on aplatit les valeurs
   * pour qu'une ligne de log reste lisible et qu'on ne stocke rien d'imprévu.
   */
  private sanitize(meta?: Record<string, unknown>): Record<string, unknown> {
    if (!meta) return {};
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(meta).slice(0, this.MAX_META_KEYS)) {
      if (value === null || value === undefined) continue;
      if (typeof value === 'number' || typeof value === 'boolean') {
        out[key] = value;
      } else {
        out[key] = String(value).slice(0, this.MAX_VALUE_LENGTH);
      }
    }
    return out;
  }
}

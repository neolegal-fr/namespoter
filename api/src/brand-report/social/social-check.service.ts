import { Injectable } from '@nestjs/common';
import { AppLoggerService } from '../../common/logging/app-logger.service';
import type { SocialAvailability } from '../dto/brand-report.types';
import { ACTIVE_PLATFORMS, type PlatformAdapter, type SocialHttp } from './platforms';

const REQUEST_TIMEOUT_MS = 8000;

/** UA « navigateur » : sans lui, plusieurs réseaux répondent différemment (spike). */
const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36';

/**
 * Vérifie la disponibilité d'un pseudo sur les réseaux sociaux.
 *
 * Chaque plateforme est traitée par son propre adaptateur (cf. `platforms.ts`).
 * Best-effort : une plateforme en échec renvoie `unknown` et ne fait jamais
 * échouer l'ensemble.
 */
@Injectable()
export class SocialCheckService {
  private readonly http: SocialHttp = {
    status: (url, opts) => this.fetchStatus(url, opts?.redirect ?? 'follow'),
    text: (url) => this.fetchText(url),
  };

  constructor(private readonly events: AppLoggerService) {}

  /** Vérifie toutes les plateformes en parallèle pour un pseudo donné. */
  async check(handle: string): Promise<SocialAvailability[]> {
    const results = await Promise.all(
      // ACTIVE_PLATFORMS et non PLATFORM_ADAPTERS : une plateforme non
      // interrogée ne figure pas dans un rapport payé — voir platforms.ts.
      ACTIVE_PLATFORMS.map((adapter) => this.checkOne(adapter, handle)),
    );
    return results;
  }

  private async checkOne(adapter: PlatformAdapter, handle: string): Promise<SocialAvailability> {
    const base: SocialAvailability = {
      platform: adapter.platform,
      handle,
      url: adapter.profileUrl(handle),
      status: 'unknown',
      planned: adapter.planned,
    };
    if (adapter.planned) return base;

    try {
      const status = await adapter.check(handle, this.http);
      return { ...base, status };
    } catch (err) {
      // Échec réseau/anti-bot : `unknown` honnête, jamais un faux « libre ».
      this.events.event('social_check_failed', {
        platform: adapter.platform,
        reason: err instanceof Error ? err.name : 'unknown',
      });
      return base;
    }
  }

  private async fetchStatus(url: string, redirect: 'follow' | 'manual'): Promise<number> {
    const res = await this.timedFetch(url, { redirect });
    return res.status;
  }

  private async fetchText(url: string): Promise<string> {
    const res = await this.timedFetch(url, { redirect: 'follow' });
    return res.text();
  }

  private async timedFetch(
    url: string,
    opts: { redirect: 'follow' | 'manual' },
  ): Promise<Response> {
    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), REQUEST_TIMEOUT_MS);
    try {
      return await fetch(url, {
        signal: abort.signal,
        redirect: opts.redirect,
        headers: { 'User-Agent': BROWSER_UA, Accept: 'text/html,application/json' },
      });
    } finally {
      clearTimeout(timer);
    }
  }
}

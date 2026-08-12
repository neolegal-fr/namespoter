import { Injectable } from '@nestjs/common';
import { RdapService } from '../domain/rdap.service';
import { DomainService } from '../domain/domain.service';
import { AppLoggerService } from '../common/logging/app-logger.service';
import { SocialCheckService } from './social/social-check.service';
import { TrademarkService } from './trademark/trademark.service';
import type {
  Availability,
  BrandReport,
  DomainAvailability,
  NameQuality,
  SocialAvailability,
} from './dto/brand-report.types';

/** Coût d'un rapport complet, en crédits. Source unique (pas de nombre magique). */
export const BRAND_REPORT_COST = 500;

/** Extensions vérifiées par défaut (les plus signifiantes pour une marque). */
const DEFAULT_EXTENSIONS = ['com', 'fr', 'io', 'net', 'app'];

/** Sous-ensemble « aperçu » public bridé (US-055) : domaine phare + 3 réseaux. */
const PREVIEW_EXTENSIONS = ['com'];
const PREVIEW_SOCIALS = ['GitHub', 'LinkedIn', 'TikTok'];

/** Pondération du score de synthèse. Documentée et unique source de vérité. */
const WEIGHTS = { domains: 0.4, socials: 0.3, trademark: 0.3 };

const DISCLAIMER =
  "Signal indicatif de disponibilité. Ne remplace pas une recherche d'antériorité " +
  "ni l'avis d'un conseil en propriété industrielle. Vérifiez auprès de l'INPI avant tout dépôt.";

export interface BrandReportOptions {
  extensions?: string[];
  /** Version bridée pour la landing publique (US-055). */
  preview?: boolean;
  /** Ajoute l'analyse de qualité du nom (IA) — rapport complet uniquement. */
  withQuality?: boolean;
  /** Locale pour l'analyse de qualité. */
  locale?: string;
}

@Injectable()
export class BrandReportService {
  constructor(
    private readonly rdap: RdapService,
    private readonly social: SocialCheckService,
    private readonly trademark: TrademarkService,
    private readonly domain: DomainService,
    private readonly events: AppLoggerService,
  ) {}

  /**
   * Compose le rapport : domaines, réseaux sociaux et marque en parallèle.
   * Best-effort par source — aucune source défaillante ne fait échouer le tout.
   */
  async generate(name: string, options: BrandReportOptions = {}): Promise<BrandReport> {
    const preview = options.preview ?? false;
    const handle = this.toHandle(name);
    const extensions = options.extensions ?? (preview ? PREVIEW_EXTENSIONS : DEFAULT_EXTENSIONS);

    const wantQuality = !!options.withQuality && !preview;
    const [domains, socialsAll, trademark, quality] = await Promise.all([
      this.checkDomains(name, extensions),
      this.social.check(handle),
      preview ? this.trademark.check(name).then(() => null) : this.trademark.check(name),
      wantQuality ? this.analyzeQuality(name, options.locale) : Promise.resolve(undefined),
    ]);

    // Aperçu public : on masque la marque et on limite les réseaux affichés.
    const socials = preview
      ? socialsAll.filter((s) => PREVIEW_SOCIALS.includes(s.platform))
      : socialsAll;
    const trademarkResult =
      trademark ?? { office: 'INPI' as const, match: 'unknown' as const, hits: [], deepLink: this.trademark.deepLink(name) };

    const report: BrandReport = {
      name,
      handle,
      domains,
      socials,
      trademark: trademarkResult,
      quality,
      score: this.score(domains, socials, preview ? null : trademarkResult.match),
      generatedAt: new Date().toISOString(),
      disclaimer: DISCLAIMER,
    };

    this.events.event('brand_report_built', {
      preview,
      domains: extensions.length,
      socials: socials.length,
      score: report.score,
    });
    return report;
  }

  /**
   * Qualité intrinsèque du nom via l'analyse IA existante (5 critères 1-5).
   * Best-effort : en cas d'échec/parse invalide, le rapport n'a pas de section
   * qualité plutôt que d'échouer.
   */
  private async analyzeQuality(name: string, locale?: string): Promise<NameQuality | undefined> {
    try {
      const raw = await this.domain.analyzeNameWithAI(name, locale ?? 'fr');
      const json = JSON.parse(raw.replace(/^```json\s*|\s*```$/g, '').trim());
      const scores: Record<string, number> = json.scores ?? {};
      const values = Object.values(scores).filter((n): n is number => typeof n === 'number');
      if (!values.length) return undefined;
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      return {
        score: Math.round((avg / 5) * 100),
        scores,
        strengths: typeof json.strengths === 'string' ? json.strengths : undefined,
        watchout: typeof json.watchout === 'string' ? json.watchout : undefined,
      };
    } catch {
      return undefined;
    }
  }

  private async checkDomains(name: string, extensions: string[]): Promise<DomainAvailability[]> {
    const root = this.toDomainRoot(name);
    return Promise.all(
      extensions.map(async (ext) => {
        const domain = `${root}.${ext}`;
        // RdapService : true = libre, false = pris, null = indéterminé.
        const verdict = await this.rdap.lookup(domain).catch(() => null);
        const status: Availability = verdict === true ? 'free' : verdict === false ? 'taken' : 'unknown';
        return { extension: ext, domain, status };
      }),
    );
  }

  /**
   * Score 0-100 : moyenne pondérée par catégorie de la fraction d'items « free ».
   * Un item `taken` ou `unknown` compte 0 — donc `unknown` n'améliore JAMAIS le
   * score (règle du spike). Une catégorie sans item (ex. marque en aperçu) est
   * exclue et sa pondération redistribuée sur les catégories présentes.
   */
  private score(
    domains: DomainAvailability[],
    socials: SocialAvailability[],
    trademarkMatch: string | null,
  ): number {
    const parts: { weight: number; value: number }[] = [];

    if (domains.length) parts.push({ weight: WEIGHTS.domains, value: freeFraction(domains) });
    if (socials.length) parts.push({ weight: WEIGHTS.socials, value: freeFraction(socials) });
    if (trademarkMatch !== null) {
      // « none » = aucun dépôt trouvé (favorable) ; sinon 0 (dépôt existant ou doute).
      parts.push({ weight: WEIGHTS.trademark, value: trademarkMatch === 'none' ? 1 : 0 });
    }

    const totalWeight = parts.reduce((s, p) => s + p.weight, 0);
    if (!totalWeight) return 0;
    const weighted = parts.reduce((s, p) => s + p.weight * p.value, 0);
    return Math.round((weighted / totalWeight) * 100);
  }

  /** Racine de domaine : minuscules, alphanumérique uniquement. */
  private toDomainRoot(name: string): string {
    return name.toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g, '');
  }

  /** Pseudo social candidat dérivé du nom (mêmes caractères que la racine). */
  private toHandle(name: string): string {
    return this.toDomainRoot(name);
  }
}

/** Fraction d'items « free » (taken et unknown comptent 0). */
function freeFraction(items: { status: Availability }[]): number {
  if (!items.length) return 0;
  const free = items.filter((i) => i.status === 'free').length;
  return free / items.length;
}

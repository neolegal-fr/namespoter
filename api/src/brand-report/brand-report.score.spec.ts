import { BrandReportService } from './brand-report.service';
import type { DomainAvailability, SocialAvailability } from './dto/brand-report.types';

/**
 * Le score est la seule note affichée à l'utilisateur : une pénalité constante
 * y est invisible mais universelle. Ces tests fixent la règle des plateformes
 * non mesurables (Instagram/Facebook, `planned`).
 */
describe('BrandReportService — score (plateformes non mesurables)', () => {
  const svc = new BrandReportService({} as any, {} as any, {} as any, {} as any, {} as any);
  // `score` est privée : on l'appelle via un accès typé, comme le ferait le
  // flux de génération, sans exposer la méthode publiquement pour un test.
  const score = (d: DomainAvailability[], s: SocialAvailability[], t: string | null) =>
    (svc as any).score(d, s, t) as number;

  const social = (platform: string, status: string, planned?: boolean): SocialAvailability =>
    ({ platform, handle: 'x', url: 'u', status, planned }) as SocialAvailability;
  const domain = (status: string): DomainAvailability => ({ domain: 'x.com', status }) as DomainAvailability;

  it('exclut les plateformes planned du dénominateur', () => {
    const socials = [
      social('GitHub', 'free'),
      social('LinkedIn', 'free'),
      social('Instagram', 'unknown', true),
      social('Facebook', 'unknown', true),
    ];
    // 2 libres sur 2 mesurables = 1, et non 2/4 = 0,5.
    expect(score([], socials, null)).toBe(100);
  });

  it('compte toujours 0 pour un unknown accidentel (doute sur le nom)', () => {
    const socials = [social('GitHub', 'free'), social('TikTok', 'unknown')];
    expect(score([], socials, null)).toBe(50);
  });

  it('reproduit le rapport de production « navorae » sans les planned', () => {
    const domains = [domain('free'), domain('free'), domain('free'), domain('free'), domain('taken')];
    const socials = [
      social('GitHub', 'taken'),
      social('LinkedIn', 'free'),
      social('Telegram', 'free'),
      social('TikTok', 'free'),
      social('X', 'taken'),
      social('YouTube', 'taken'),
      social('Instagram', 'unknown', true),
      social('Facebook', 'unknown', true),
    ];
    // 0,4×0,8 + 0,3×(3/6) + 0,3×1 = 0,77. L'ancien calcul (3/8) donnait 73.
    expect(score(domains, socials, 'none')).toBe(77);
  });

  it('ignore la catégorie réseaux si toutes les plateformes sont planned', () => {
    const socials = [social('Instagram', 'unknown', true), social('Facebook', 'unknown', true)];
    // Seuls les domaines pèsent : 1 libre sur 1 → 100, la pondération réseaux
    // étant redistribuée plutôt que comptée à 0.
    expect(score([domain('free')], socials, null)).toBe(100);
  });
});

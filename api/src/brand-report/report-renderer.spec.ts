import { renderReportHtml, reportFileName } from './report-renderer';
import type { BrandReport } from './dto/brand-report.types';

const report: BrandReport = {
  name: 'Qonto',
  handle: 'qonto',
  domains: [{ extension: 'com', domain: 'qonto.com', status: 'taken' }],
  socials: [{ platform: 'GitHub', handle: 'qonto', url: 'https://github.com/qonto', status: 'free' }],
  trademark: {
    office: 'INPI',
    match: 'exact',
    hits: [{ name: 'Qonto', classes: [36, 42], collection: 'FR', applicationNumber: '4837847', status: 'Marque enregistrée', noticeUrl: 'https://x/notice' }],
    deepLink: 'https://data.inpi.fr/search?q=Qonto&type=brands',
  },
  score: 42,
  generatedAt: '2026-08-05T12:00:00.000Z',
  disclaimer: 'Signal indicatif.',
};

describe('report-renderer', () => {
  it('produit un document HTML complet reprenant les faits clés', () => {
    const html = renderReportHtml(report);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('Qonto');
    expect(html).toContain('qonto.com');
    expect(html).toContain('classes 36, 42');
    expect(html).toContain('data.inpi.fr'); // CTA recherche officielle
    expect(html).toContain('Signal indicatif.'); // disclaimer présent
  });

  it('échappe le HTML pour éviter toute injection via le nom', () => {
    const html = renderReportHtml({ ...report, name: '<script>x</script>' });
    expect(html).not.toContain('<script>x</script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('slugifie le nom de fichier', () => {
    expect(reportFileName(report)).toBe('rapport-complet-qonto.html');
  });
});

describe("le document envoyé est le même que la page", () => {
  const base: any = {
    name: 'Qonto',
    handle: 'qonto',
    domains: [{ extension: 'com', domain: 'qonto.com', status: 'free' }],
    socials: [{ platform: 'GitHub', handle: 'qonto', url: 'https://github.com/qonto', status: 'taken' }],
    trademark: { office: 'INPI', match: 'none', hits: [], deepLink: 'https://data.inpi.fr/x' },
    score: 70,
    generatedAt: '2026-08-20T10:00:00.000Z',
    disclaimer: 'Indicatif.',
  };

  it('emploie le vocabulaire de verdict du produit, en bas de casse', () => {
    const html = renderReportHtml(base);
    expect(html).toContain('>libre<');
    expect(html).toContain('>pris<');
    expect(html).not.toContain('>Libre<');
  });

  it("suit l'ordre de la page : marques AVANT réseaux", () => {
    const html = renderReportHtml(base);
    expect(html.indexOf('Marques françaises')).toBeGreaterThan(html.indexOf('Noms de domaine'));
    expect(html.indexOf('Réseaux sociaux')).toBeGreaterThan(html.indexOf('Marques françaises'));
  });

  it('nomme les trois offices, comme la page', () => {
    expect(renderReportHtml(base)).toContain('(OMPI)');
  });

  it('porte le projet et le public cible quand ils ont été fournis', () => {
    const html = renderReportHtml({
      ...base,
      context: { description: 'Livraison de repas vegan', audience: [{ label: 'Marché', value: 'local — FR' }] },
    });
    expect(html).toContain('Livraison de repas vegan');
    expect(html).toContain('local — FR');
  });

  it("n'invente rien quand le contexte est absent", () => {
    const html = renderReportHtml(base);
    expect(html).not.toContain('Public cible');
    expect(html).not.toContain('Le projet');
  });
});

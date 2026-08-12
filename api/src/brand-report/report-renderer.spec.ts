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
    expect(reportFileName(report)).toBe('rapport-disponibilite-qonto.html');
  });
});

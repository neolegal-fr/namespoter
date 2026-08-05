import type { Availability, BrandReport, SocialAvailability, DomainAvailability } from './dto/brand-report.types';

/**
 * Rendu du rapport en document HTML autonome — sert à la fois de corps d'email
 * et de pièce jointe (imprimable en PDF depuis le navigateur). Pur et sans
 * dépendance : pas de moteur PDF ajouté (cf. décision US-053).
 */

const STATUS_LABEL: Record<Availability, string> = { free: 'Libre', taken: 'Pris', unknown: '?' };
const STATUS_COLOR: Record<Availability, string> = { free: '#16a34a', taken: '#dc2626', unknown: '#9ca3af' };
const COLLECTION_LABEL: Record<string, string> = { FR: 'INPI (FR)', EU: 'EUIPO (UE)', WO: 'OMPI (int.)' };

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
}

function badge(status: Availability): string {
  return `<span style="display:inline-block;padding:2px 10px;border-radius:9999px;font-size:12px;font-weight:600;color:#fff;background:${STATUS_COLOR[status]}">${STATUS_LABEL[status]}</span>`;
}

function domainsRows(domains: DomainAvailability[]): string {
  return domains
    .map((d) => `<tr><td style="padding:6px 0">${esc(d.domain)}</td><td style="text-align:right">${badge(d.status)}</td></tr>`)
    .join('');
}

function socialsRows(socials: SocialAvailability[]): string {
  return socials
    .map((s) => {
      const label = s.planned ? `${esc(s.platform)} <span style="color:#9ca3af;font-size:11px">(bientôt)</span>` : esc(s.platform);
      return `<tr><td style="padding:6px 0">${label} · <a href="${esc(s.url)}" style="color:#6366f1">@${esc(s.handle)}</a></td><td style="text-align:right">${badge(s.status)}</td></tr>`;
    })
    .join('');
}

function trademarkBlock(report: BrandReport): string {
  const tm = report.trademark;
  const head: Record<string, string> = {
    none: `<span style="color:#16a34a;font-weight:600">Aucun dépôt identique trouvé</span> dans les bases INPI / EUIPO / OMPI.`,
    exact: `<span style="color:#dc2626;font-weight:600">Une marque identique existe déjà.</span>`,
    similar: `<span style="color:#d97706;font-weight:600">Des marques proches existent.</span>`,
    unknown: `<span style="color:#9ca3af;font-weight:600">Vérification marque indisponible.</span> ${esc(tm.note ?? '')}`,
  };
  const hits = tm.hits
    .slice(0, 8)
    .map((h) => {
      const coll = h.collection ? COLLECTION_LABEL[h.collection] ?? h.collection : '—';
      const classes = h.classes.length ? ` · classes ${h.classes.join(', ')}` : '';
      const status = h.status ? ` · ${esc(h.status)}` : '';
      const link = h.noticeUrl ? `<a href="${esc(h.noticeUrl)}" style="color:#6366f1">notice</a>` : '';
      return `<li style="margin:4px 0">${esc(h.name)} <span style="color:#6b7280">(${coll}${classes}${status})</span> ${link}</li>`;
    })
    .join('');
  return `<p style="margin:0 0 8px">${head[tm.match]}</p>${hits ? `<ul style="margin:8px 0;padding-left:18px">${hits}</ul>` : ''}
    <p style="font-size:12px"><a href="${esc(tm.deepLink)}" style="color:#6366f1">Recherche officielle INPI →</a></p>`;
}

function section(title: string, inner: string): string {
  return `<h2 style="font-size:15px;margin:24px 0 8px;color:#111827">${title}</h2><table style="width:100%;border-collapse:collapse;font-size:14px">${inner}</table>`;
}

/** Document HTML complet du rapport. */
export function renderReportHtml(report: BrandReport): string {
  const scoreColor = report.score >= 66 ? '#16a34a' : report.score >= 33 ? '#d97706' : '#dc2626';
  const date = new Date(report.generatedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Rapport de disponibilité — ${esc(report.name)}</title></head>
<body style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;max-width:640px;margin:0 auto;padding:32px 20px;color:#1f2937;background:#fff">
  <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
    <div>
      <div style="font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:.05em">Rapport de disponibilité de marque</div>
      <h1 style="font-size:26px;margin:4px 0 0">${esc(report.name)}</h1>
    </div>
    <div style="text-align:center">
      <div style="font-size:34px;font-weight:800;color:${scoreColor};line-height:1">${report.score}<span style="font-size:16px;color:#9ca3af">/100</span></div>
      <div style="font-size:11px;color:#6b7280">score de disponibilité</div>
    </div>
  </div>

  ${section('Noms de domaine', domainsRows(report.domains))}
  ${section('Réseaux sociaux', socialsRows(report.socials))}
  <h2 style="font-size:15px;margin:24px 0 8px;color:#111827">Marque déposée</h2>
  ${trademarkBlock(report)}

  <p style="margin:28px 0 8px;padding:12px 14px;background:#f3f4f6;border-radius:8px;font-size:12px;color:#6b7280">
    ${esc(report.disclaimer)}
  </p>
  <p style="font-size:11px;color:#9ca3af">Généré le ${date} par Namorama.</p>
</body></html>`;
}

/** Nom de fichier de la pièce jointe. */
export function reportFileName(report: BrandReport): string {
  const slug = report.name.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'marque';
  return `rapport-disponibilite-${slug}.html`;
}

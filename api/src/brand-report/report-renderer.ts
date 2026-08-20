import type { Availability, BrandReport, SocialAvailability, DomainAvailability } from './dto/brand-report.types';

/**
 * Rendu du rapport en document HTML autonome — corps d'email et pièce jointe.
 * Pur et sans dépendance : pas de moteur PDF ajouté (cf. décision US-053).
 *
 * ⚠ Ce document doit être LE MÊME que la page, pas un cousin.
 *
 * Il en divergeait sur tout ce qui se remarque : un autre titre (« rapport de
 * disponibilité » contre « rapport complet »), un autre ordre (réseaux avant
 * marques), un autre vocabulaire (« Libre » / « Pris » / « ? » contre
 * « libre » / « pris » / « non vérifiable »), et des pastilles pleines à texte
 * blanc que la charte proscrit. Recevoir par mail un document qui ne ressemble
 * pas à celui qu'on vient de lire fait douter que ce soit le même.
 *
 * Les couleurs sont donc celles des jetons clairs du produit, écrites en dur :
 * un client de messagerie ignore les variables CSS.
 */

const STATUS_LABEL: Record<Availability, string> = { free: 'libre', taken: 'pris', unknown: 'non vérifiable' };
/** Paires fond + texte des verdicts, reprises de `--nm-app-verdict-*` clair. */
const STATUS_BG: Record<Availability, string> = { free: '#e8f7ef', taken: '#fdeaea', unknown: '#fdf3e3' };
const STATUS_FG: Record<Availability, string> = { free: '#0b6b45', taken: '#a32020', unknown: '#8a5a12' };
const COLLECTION_LABEL: Record<string, string> = { FR: 'INPI (FR)', EU: 'EUIPO (UE)', WO: 'OMPI (int.)' };

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
}

function badge(status: Availability): string {
  return `<span style="display:inline-block;padding:3px 9px;border-radius:6px;font-size:12px;font-weight:500;color:${STATUS_FG[status]};background:${STATUS_BG[status]}">${STATUS_LABEL[status]}</span>`;
}

function domainsRows(domains: DomainAvailability[]): string {
  return domains
    .map((d) => `<tr><td style="padding:6px 0">${esc(d.domain)}</td><td style="text-align:right">${badge(d.status)}</td></tr>`)
    .join('');
}

function socialsRows(socials: SocialAvailability[]): string {
  return socials
    .map((s) => {
      // Aucune ligne « bientôt » : une plateforme non interrogée ne figure pas
      // dans un rapport payé, page comme email.
      return `<tr><td style="padding:6px 0">${esc(s.platform)} · <a href="${esc(s.url)}" style="color:#0d7a4e">@${esc(s.handle)}</a></td><td style="text-align:right">${badge(s.status)}</td></tr>`;
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
      const link = h.noticeUrl ? `<a href="${esc(h.noticeUrl)}" style="color:#0d7a4e">notice</a>` : '';
      return `<li style="margin:4px 0">${esc(h.name)} <span style="color:#6b7280">(${coll}${classes}${status})</span> ${link}</li>`;
    })
    .join('');
  return `<p style="margin:0 0 8px">${head[tm.match]}</p>${hits ? `<ul style="margin:8px 0;padding-left:18px">${hits}</ul>` : ''}
    <p style="font-size:12px"><a href="${esc(tm.deepLink)}" style="color:#0d7a4e">Consulter la base INPI →</a></p>`;
}

const QUALITY_CRITERIA: Record<string, string> = {
  memorability: 'Mémorabilité',
  pronunciation: 'Prononciation',
  international: 'International',
  seo: 'SEO',
  distinctiveness: 'Distinctivité',
};

function qualityBlock(report: BrandReport): string {
  const q = report.quality;
  if (!q) return '';
  const rows = Object.entries(q.scores)
    .map(([k, v]) => `<tr><td style="padding:4px 0">${esc(QUALITY_CRITERIA[k] ?? k)}</td><td style="text-align:right;color:#6b7280">${v}/5</td></tr>`)
    .join('');
  const strengths = q.strengths ? `<p style="margin:6px 0 0;font-size:13px"><strong style="color:#16a34a">Forces :</strong> ${esc(q.strengths)}</p>` : '';
  const watchout = q.watchout ? `<p style="margin:4px 0 0;font-size:13px"><strong style="color:#d97706">Vigilance :</strong> ${esc(q.watchout)}</p>` : '';
  const origine = q.origin ? `<p style="margin:0 0 10px;font-size:14px;line-height:1.55">${esc(q.origin)}</p>` : '';
  return `<h2 style="font-size:15px;margin:24px 0 8px;color:#111827">Qualité du nom <span style="color:#6a7470;font-weight:400">— ${q.score}/100</span></h2>${origine}
    <table style="width:100%;border-collapse:collapse;font-size:14px">${rows}</table>${strengths}${watchout}`;
}

function section(title: string, inner: string): string {
  return `<h2 style="font-size:15px;margin:24px 0 8px;color:#111827">${title}</h2><table style="width:100%;border-collapse:collapse;font-size:14px">${inner}</table>`;
}

/** Document HTML complet du rapport, dans l'ordre exact de la page. */
export function renderReportHtml(report: BrandReport): string {
  const date = new Date(report.generatedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  const ctx = report.context;
  const projet = ctx?.description
    ? `<h2 style="font-size:15px;margin:24px 0 8px;color:#111827">Le projet</h2>
       <p style="margin:0;padding-left:12px;border-left:3px solid #c9e9d8;font-size:14px;line-height:1.6;white-space:pre-line">${esc(ctx.description)}</p>`
    : '';
  const cible = ctx?.audience?.length
    ? `<h2 style="font-size:15px;margin:24px 0 8px;color:#111827">Public cible</h2>
       <table style="width:100%;border-collapse:collapse;font-size:14px">` +
      ctx.audience
        .map((a) => `<tr><td style="padding:4px 0;color:#5c6663">${esc(a.label)}</td><td style="text-align:right;font-weight:600">${esc(a.value)}</td></tr>`)
        .join('') +
      `</table>`
    : '';

  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Rapport complet — ${esc(report.name)}</title></head>
<body style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;max-width:640px;margin:0 auto;padding:32px 20px;color:#2c3532;background:#fff">
  <div style="font-size:12px;color:#6a7470;text-transform:uppercase;letter-spacing:.05em">Rapport complet · ${date}</div>
  <h1 style="font-size:30px;margin:4px 0 0;letter-spacing:-.01em">${esc(report.name)}</h1>

  ${projet}
  ${cible}
  ${qualityBlock(report)}
  ${section('Noms de domaine', domainsRows(report.domains))}
  <h2 style="font-size:15px;margin:24px 0 8px;color:#111827">Marques françaises (INPI), de l'Union européenne (EUIPO) et internationales (OMPI)</h2>
  ${trademarkBlock(report)}
  ${report.socials.length ? section('Réseaux sociaux', socialsRows(report.socials)) : ''}

  <p style="margin:28px 0 8px;padding:12px 14px;background:#f4f6f5;border-radius:8px;font-size:12px;color:#5c6663">
    ${esc(report.disclaimer)}
  </p>
  <p style="font-size:11px;color:#6a7470">Généré le ${date} par Namorama.</p>
</body></html>`;
}

/** Nom de fichier de la pièce jointe. */
export function reportFileName(report: BrandReport): string {
  const slug = report.name.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'marque';
  return `rapport-complet-${slug}.html`;
}

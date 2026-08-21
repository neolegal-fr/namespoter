import { inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';

const ORIGIN = 'https://namorama.com';

export interface ContentSeo {
  /** Titre de l'onglet / SERP (sans le suffixe « — Namorama », ajouté ici). */
  title: string;
  /** Meta description (≈ 150-160 caractères). */
  description: string;
  /** Chemin canonique, ex. '/guides/trouver-nom-de-marque'. */
  path: string;
  /**
   * Versions de cette page dans d'autres langues, pour les balises `hreflang`
   * réciproques. Clé = code langue, valeur = chemin. Inclure la page
   * elle-même. `x-default` est posé automatiquement sur la version française,
   * qui est la racine du site. Absent ⇒ page monolingue, aucune balise émise.
   */
  alternates?: Record<string, string>;
  /** Langue de la page — pose `<html lang>`. Défaut : fr. */
  lang?: string;
  /** `og:type` — 'website' pour l'accueil, 'article' (défaut) pour le contenu. */
  ogType?: 'website' | 'article';
  /**
   * Données structurées PROPRES À CETTE PAGE (schema.org), sérialisées dans un
   * `<script type="application/ld+json">`.
   *
   * À réserver à ce que la page montre vraiment : un balisage `FAQPage` sur
   * une page sans FAQ visible contrevient aux règles de Google et expose à ce
   * que l'ensemble des données structurées du site soit ignoré. Le balisage
   * d'identité du site (`WebApplication`) reste, lui, dans `index.html`.
   */
  jsonLd?: unknown;
}

/**
 * Applique titre, meta description, canonical et Open Graph pour une page de
 * contenu. S'exécute aussi bien au prerender (SSG) qu'au runtime navigateur :
 * `Title`/`Meta` et `DOCUMENT` sont disponibles dans les deux contextes, donc
 * le HTML statique généré contient déjà les bonnes balises pour Google.
 */
export function applyContentSeo(seo: ContentSeo): void {
  const title = inject(Title);
  const meta = inject(Meta);
  const doc = inject(DOCUMENT);

  const fullTitle = `${seo.title} — Namorama`;
  const url = `${ORIGIN}${seo.path}`;

  title.setTitle(fullTitle);
  meta.updateTag({ name: 'description', content: seo.description });
  meta.updateTag({ property: 'og:title', content: fullTitle });
  meta.updateTag({ property: 'og:description', content: seo.description });
  meta.updateTag({ property: 'og:url', content: url });
  meta.updateTag({ property: 'og:type', content: seo.ogType ?? 'article' });
  meta.updateTag({ name: 'twitter:title', content: fullTitle });
  meta.updateTag({ name: 'twitter:description', content: seo.description });

  // Canonical : pas de service Angular dédié, on manipule le <head> via DOCUMENT.
  let link = doc.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = doc.createElement('link');
    link.setAttribute('rel', 'canonical');
    doc.head.appendChild(link);
  }
  link.setAttribute('href', url);

  // Langue de la page : `<html lang>` vit hors de l'application Angular, on le
  // pose directement. Indispensable sur la version anglaise — index.html porte
  // `lang="fr"` en dur, et Google lirait la page anglaise comme du français.
  doc.documentElement.setAttribute('lang', seo.lang ?? 'fr');

  // hreflang réciproques. On retire d'abord celles d'une navigation précédente :
  // au runtime, le <head> survit d'une route à l'autre, et une page monolingue
  // hériterait sinon des alternates de l'accueil.
  doc.querySelectorAll('link[rel="alternate"][hreflang]').forEach((l) => l.remove());
  if (seo.alternates) {
    const add = (hreflang: string, path: string) => {
      const l = doc.createElement('link');
      l.setAttribute('rel', 'alternate');
      l.setAttribute('hreflang', hreflang);
      l.setAttribute('href', `${ORIGIN}${path}`);
      doc.head.appendChild(l);
    };
    for (const [lang, path] of Object.entries(seo.alternates)) add(lang, path);
    // x-default : la version française, racine du site.
    if (seo.alternates['fr']) add('x-default', seo.alternates['fr']);
  }

  // Données structurées de la page. Comme les hreflang, on retire d'abord
  // celles de la route précédente : le <head> survit à la navigation.
  doc.querySelectorAll('script[data-page-schema]').forEach((s) => s.remove());
  if (seo.jsonLd) {
    const script = doc.createElement('script');
    script.setAttribute('type', 'application/ld+json');
    script.setAttribute('data-page-schema', '');
    script.textContent = JSON.stringify(seo.jsonLd);
    doc.head.appendChild(script);
  }
}

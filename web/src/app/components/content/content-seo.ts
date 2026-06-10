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
  meta.updateTag({ property: 'og:type', content: 'article' });
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
}

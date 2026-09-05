#!/usr/bin/env node
/**
 * Rend ABSOLUES les URL d'actifs des pages prérendues.
 *
 * Angular émet ses balises en relatif — `<script src="main-XXXX.js">`,
 * `<link href="styles-XXXX.css">` — et compte sur `<base href="/">` pour les
 * résoudre. C'est correct au sens de la norme, et c'est ce que font les
 * navigateurs. Mais les vingt-cinq pages prérendues ne vivent pas toutes à la
 * racine : `/guides/trouver-nom-de-marque` est servi depuis un sous-répertoire,
 * et tout agent qui ignore `<base>` y résout le chemin contre le répertoire de
 * la page.
 *
 * Relevé en production le 05/09/2026 : GPTBot demandait
 * `/guides/main-CRXNHNPF.js`, `/guides/styles-FCJEBA4K.css` et jusqu'à
 * `/verifier-disponibilite-nom-de-marquefavicon.svg` (concaténation pure) —
 * tous en 404. Une page de contenu SEO servie sans sa feuille de style ni son
 * script à un robot d'indexation, c'est précisément ce que le prérendu était
 * censé éviter.
 *
 * Le correctif tient en une barre oblique. Ce script la pose sur ce que le
 * build génère lui-même ; ce que nous écrivons à la main (favicons dans
 * `index.html`, logo dans `app.ts`) est déjà absolu à la source.
 *
 * Prudence volontaire : une référence n'est réécrite que si le fichier visé
 * existe RÉELLEMENT à la racine de la sortie. Une URL qu'on ne sait pas
 * résoudre est laissée telle quelle plutôt que transformée en lien mort.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const RACINE = 'dist/namorama-web/browser';

/** Tous les fichiers sous `dir`, chemins relatifs à `dir`. */
function fichiers(dir, base = dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const chemin = join(dir, e.name);
    return e.isDirectory() ? fichiers(chemin, base) : [relative(base, chemin)];
  });
}

let racineExiste = true;
try {
  statSync(RACINE);
} catch {
  racineExiste = false;
}
if (!racineExiste) {
  console.error(`absolutiser-les-assets : ${RACINE} introuvable — le build a-t-il tourné ?`);
  process.exit(1);
}

const tous = fichiers(RACINE);
// Les seules cibles autorisées : les fichiers posés à la RACINE de la sortie,
// ceux-là mêmes que `<base href="/">` désignait implicitement.
const aLaRacine = new Set(tous.filter((f) => !f.includes('/')));
const pages = tous.filter((f) => f.endsWith('.html'));

// Une valeur d'attribut qui ne commence ni par `/`, ni par un schéma, ni par
// `#` ou `?` : la seule forme que le répertoire de la page peut détourner.
const RELATIF = /\b(src|href)="(?!\/|#|\?|[a-zA-Z][a-zA-Z0-9+.-]*:)([^"]+)"/g;

let pagesModifiees = 0;
let refsModifiees = 0;

for (const page of pages) {
  const chemin = join(RACINE, page);
  const avant = readFileSync(chemin, 'utf8');
  let n = 0;
  const apres = avant.replace(RELATIF, (tout, attr, cible) =>
    aLaRacine.has(cible) ? (n++, `${attr}="/${cible}"`) : tout,
  );
  if (n > 0) {
    writeFileSync(chemin, apres);
    pagesModifiees++;
    refsModifiees += n;
  }
}

console.log(
  `absolutiser-les-assets : ${refsModifiees} référence(s) rendue(s) absolue(s)`
  + ` dans ${pagesModifiees} page(s) sur ${pages.length}.`,
);

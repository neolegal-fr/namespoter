# Handoff : refonte namorama.com

## Overview

Refonte de la landing page et des écrans clés de **namorama.com** (générateur de noms de marque avec vérification de disponibilité). Objectifs : montrer le produit dès la home, repositionner l'accroche sur le différenciant payant (recherche d'antériorité INPI/EUIPO + réseaux sociaux) et rendre le modèle de crédits lisible à chaque étape.

Écrans couverts : accueil, résultats de recherche, rapport approfondi (états avant/après achat), 3 maquettes mobile, et une page interne de notes d'acquisition (non destinée à la production).

## About the Design Files

Le fichier `Namorama - Refonte.dc.html` de ce bundle est une **référence de design créée en HTML** : un prototype qui montre l'apparence et le comportement attendus. **Ce n'est pas du code de production à copier.**

La tâche est de **recréer ces écrans dans l'environnement existant de l'application** : Angular 20 (standalone components, signals), PrimeNG avec le thème Aura, Tailwind CSS v4 et PrimeIcons — en respectant les patterns déjà en place dans `web/src/app`. Le prototype utilise des styles inline et un petit runtime de rendu : ni l'un ni l'autre ne doit être transposé tel quel. Il faut traduire les valeurs (couleurs, tailles, espacements) en classes Tailwind et en composants PrimeNG.

Pour ouvrir le prototype : `Namorama - Refonte.dc.html` et `support.js` doivent rester dans le même dossier, puis ouvrir le HTML dans un navigateur. La barre grise en haut de page permet de naviguer entre les écrans — **elle fait partie de l'outil de présentation, pas du design à implémenter.**

## Fidelity

**Haute fidélité (hifi).** Couleurs, typographies, espacements et rayons sont définitifs et doivent être reproduits fidèlement, en utilisant les composants PrimeNG et les utilitaires Tailwind existants. Les données affichées (noms, verdicts, prix) sont des exemples : elles doivent venir de l'API.

## Repository & branche

- Dépôt : `neolegal-fr/namorama`, branche par défaut `main`
- Branche de travail suggérée : `feat/refonte-landing`
- Front-end concerné : `web/src/app`

Ordre de travail recommandé (un commit par étape, tout dans la même branche) :

1. **Design tokens** — déclarer les couleurs et fontes ci-dessous dans la configuration Tailwind / les CSS custom properties, avant tout écran.
2. **Accueil** (`components/landing/`) — le plus gros gain, et la seule route indexée par Google.
3. **Résultats** (`components/results/` ou équivalent) — cartes de noms + bandeau de crédits.
4. **Rapport approfondi** — nouveau composant, avec ses deux états.
5. **Responsive** — vérifier chaque écran à 390 px.
6. **Thème Keycloak** (`infra/keycloak/themes/namorama/`) — login et account à retoucher, thème e-mail à créer. Voir la section dédiée.
7. **Logo unifié** — une seule marque pour le site, le favicon, Keycloak, les e-mails et l'image Open Graph. Voir la section dédiée.
8. **Multilingue et SEO** — URLs et métadonnées par langue. Voir la section dédiée ; c'est le chantier au plus fort effet sur le trafic.
9. **Rapport offert mensuel** — évolution back-end, ticket séparé. Voir la section dédiée.

## Design Tokens

### Couleurs

| Rôle | Hex |
| --- | --- |
| Fond sombre (principal) | `#0b0e10` |
| Surface sombre (cartes) | `#12171a` |
| Surface sombre alternative | `#0e1315` |
| Bordure sombre | `#232b2f` |
| Bordure sombre (interactive) | `#2a3236` |
| Bordure sombre (survol) | `#3a4448` |
| Séparateur sombre | `#1b2225`, `#1e2528`, `#263033` |
| Texte sombre principal | `#f2f5f3` |
| Texte sombre secondaire | `#9aa5a0` |
| Texte sombre tertiaire | `#6d7873` |
| Texte sombre appuyé | `#c9d3ce` |
| Accent (vert) | `#3ddc91` |
| Accent survol / texte accent | `#6ee7a8` |
| Accent sur fond clair | `#0d9a63` |
| Accent sur fond clair (survol) | `#0b8355` |
| Texte sur accent | `#062018` |
| Surface accent sombre | `#0f1b1c` |
| Bordure accent sombre | `#23474b` |
| Bouton accent discret (fond / survol) | `#1c2b26` / `#24382f` |
| Fond clair (sections) | `#f4f6f5` |
| Surface claire (cartes) | `#fff` |
| Surface claire alternative | `#fbfcfb` |
| Bordure claire | `#e3e7e5`, `#dde2e0` |
| Séparateur clair | `#eef1f0`, `#f2f4f3` |
| Texte clair principal | `#0b0e10` |
| Texte clair secondaire | `#5c6663` |
| Texte clair tertiaire | `#8a938f` |
| Texte clair sur carte | `#2c3532` |
| Verdict « libre » (sombre) | texte `#6ee7a8` sur `#0f1b1c` |
| Verdict « pris » (sombre) | texte `#e08a8a` sur `#1a1416` |
| Verdict « invérifiable » (sombre) | texte `#e0b96e` sur `#1c1810` |
| Verdict « libre » (clair) | texte `#0d7a4e` sur `#e8f7ef` |
| Verdict « pris » (clair) | texte `#a33b3b` sur `#fbecec` |
| Verdict « à surveiller » (clair) | texte `#9a6a12` sur `#fdf3e3` |
| Badge note SEO | texte `#3b5aa3` sur `#eef2fb` |
| Badge note monétisation | texte `#5b46a3` sur `#f0ecfb` |

### Typographie

- **Titres, chiffres, noms de marque** : Space Grotesk (400/500/600/700)
- **Texte courant, UI** : IBM Plex Sans (400/500/600)
- Chargées depuis Google Fonts. Si le projet doit rester autonome, les auto-héberger.

Échelle utilisée :

| Usage | Taille | Graisse | Interlignage | Interlettrage |
| --- | --- | --- | --- | --- |
| H1 accueil | `clamp(36px, 4.8vw, 60px)` | 700 | 1.03 | -0.035em |
| H1 mobile | 33px | 700 | 1.06 | -0.03em |
| H1 écran (résultats) | 34px | 700 | — | -0.03em |
| Nom de marque (rapport) | 46px | 700 | — | -0.03em |
| H2 section | `clamp(28px, 3.6vw, 42px)` | 700 | 1.05 | -0.03em |
| H2 secondaire | `clamp(24px, 3vw, 34px)` | 700 | — | -0.025em |
| H3 carte | 18px | 700 | — | -0.01em |
| Nom sur carte résultat | 22px | 700 | — | -0.02em |
| Chapô | 18.5px | 400 | 1.55 | — |
| Corps de texte | 15px – 16.5px | 400 | 1.55 – 1.6 | — |
| UI / labels | 13px – 14.5px | 400–600 | — | — |
| Sur-titre (majuscules) | 11px – 12.5px | 500–600 | — | 0.08em – 0.14em |

### Espacements, rayons, ombres

- Rayons : 6px (badges, puces de verdict), 8px – 10px (boutons, champs), 12px – 14px (cartes), 16px – 18px (grands blocs), 24px – 34px (écran de téléphone), 999px (pilules)
- Padding de carte : 20px – 26px ; padding de section : 52px – 88px vertical, 28px horizontal
- Largeur maximale de contenu : 1200px (accueil, résultats), 920px (rapport), 800px (notes)
- Gouttières de grille : 14px (cartes de résultats), 20px (cartes d'arguments), 56px (héros)
- Ombre portée (encart produit et téléphones) : `0 40px 80px -40px rgba(0,0,0,.8)` (téléphones : `.9`)
- Hauteur minimale des cibles tactiles sur mobile : 44px, 46px pour les boutons de carte, 52px pour les CTA principaux

## Screens / Views

### 1. Accueil (`/`)

**Purpose** : convertir un visiteur en première recherche, et faire comprendre en un écran que Namorama va plus loin que le domaine.

**Layout** : fond `#0b0e10`. En-tête pleine largeur (max 1200px, padding 22px/28px) : logo à gauche (carré 24px, rayon 6px, `#3ddc91` + mot-symbole 18px/700), navigation à droite (Guides, Comparatifs, Tarifs, puis bouton Connexion contouré). Puis un héros en `grid-template-columns: repeat(auto-fit, minmax(420px, 1fr))`, gap 56px, aligné au centre — il se replie donc en une colonne sous ~900px. Les sections suivantes sont sur fond clair `#f4f6f5`.

**Composants du héros (colonne gauche)** :

- Pilule d'accroche : bordure `#23474b`, fond `#0f1b1c`, texte `#6ee7a8` 12.5px, rayon 999px, padding 7px/14px, point 6px `#3ddc91` à gauche. Texte : « Registres, INPI et réseaux interrogés en direct ».
- H1 : « Trouvez un nom de **produit** vraiment libre », où le mot en accent (`#3ddc91`) **alterne toutes les 2 secondes** entre `produit`, `marque`, `société`. Largeur max 21ch.
- Chapô 18.5px `#9aa5a0`, max 47ch : « Domaine, réseaux sociaux, et aucune marque déposée. Les générateurs de noms s'arrêtent au .com — Namorama vérifie aussi l'INPI et l'EUIPO, pour que vous choisissiez un nom que vous pourrez vraiment garder. »
- CTA primaire : fond `#3ddc91`, texte `#062018`, Space Grotesk 16px/700, padding 16px/28px, rayon 10px, survol `#6ee7a8`. Libellé « Trouver mon nom ». Mène à la recherche.
- CTA secondaire contouré `#2a3236`, survol bordure `#4a5459`. Libellé « Voir un rapport de marque ».
- Trois mentions 13.5px `#6d7873` : « 100 crédits offerts chaque mois », « ≈ 50 suggestions vérifiées + 1 rapport », « Sans abonnement ».

**Composants du héros (colonne droite — encart démo)** :

Cadre de navigateur factice : fond `#12171a`, bordure `#232b2f`, rayon 18px, padding 8px, trois points 9px `#2f3a3e` et l'URL `namorama.com/app` en 12px. À l'intérieur, un panneau `#0b0e10` bordé `#1e2528`, rayon 12px, padding 22px/20px.

C'est une **démonstration figée, pas un formulaire fonctionnel** — décision explicite du client. Elle contient :

- Un fil d'étapes en 4 segments (`Décrire`, `Cadrer`, `Domaines`, `Rapport`), chacun = puce ronde 26px + libellé 13px + trait de liaison 1px `#232b2f`. Étape active : fond `#3ddc91`, texte `#062018`. Inactive : fond `#12171a`, texte `#6d7873`, bordure `#232b2f`. Les segments sont cliquables et changent le contenu du panneau. `flex-wrap: wrap` avec `row-gap: 10px`.
- Un sur-titre qui reprend l'étape : « Étape 3 — suggestions retenues · 1 crédit chacune », « Étape 4 — rapport approfondi · 50 crédits », etc.
- Une zone de contenu de `min-height: 300px` (évite tout saut de mise en page au changement d'étape) :
  - **Étape 1** : la phrase de projet dans un bloc `#12171a`, une explication, et 4 pilules de mots-clés dont une « + ajouter » en accent.
  - **Étape 2** : 5 pilules de critères (certaines en accent = sélectionnées), une ligne « Déjà pris dans votre secteur — l'IA les évite : … », puis une ligne « Classes INPI surveillées : 12 · 35 · 37 ».
  - **Étape 3** (affichée par défaut) : 6 lignes `nom.tld` + puce de verdict. Mention finale : « 1 crédit par suggestion retenue, quel que soit le nombre d'extensions vérifiées. »
  - **Étape 4** : un bloc en accent avec le nom, le prix « 50 crédits », les 4 contrôles approfondis (INPI, EUIPO, réseaux, X) et la mention « Facturé une seule fois par nom. Le rapport reste dans votre projet, exportable en PDF. »

**Sections sur fond clair** :

1. **Les 4 contrôles** — H2 « Le .com est libre. La marque, elle, est déposée depuis 2019. » + chapô, puis 4 cartes blanches (`grid`, `minmax(230px, 1fr)`, gap 20px). Chaque carte : un sur-titre numéroté en `#0d9a63` (`01 — DOMAINE`, `02 — INPI`, `03 — RÉSEAUX`, `04 — EUROPE`), un H3, un paragraphe.
2. **Tableau comparatif** — pilotable par la propriété `showCompare`. Grille `minmax(140px,1.6fr) repeat(3, minmax(72px,1fr))`. Colonnes : critère, Namorama (en `#0d9a63`, 600), Générateurs IA, Registrars. 6 lignes, dont « Antériorité de marque INPI / EUIPO », « Pseudos réseaux sociaux », « État "invérifiable" signalé ».
3. **Guides de naming** — pilotable par `showGuides`. 10 liens en pilules blanches, hauteur minimale 44px. Ce sont les futures pages SEO ; chacune doit être une vraie route indexable.
4. **CTA final** — bloc `#0b0e10`, rayon 18px, padding 52px/44px : H2 « Votre nom est encore libre » + « 100 crédits offerts chaque mois : environ 50 suggestions vérifiées, et un rapport approfondi. » + bouton accent.

### 2. Résultats de recherche

**Purpose** : présenter les noms vérifiés, rendre le débit de crédits incontestable, et vendre le rapport approfondi.

**Layout** : fond `#0b0e10`, max 1200px, padding 28px/28px/80px.

**Composants** :

- En-tête : sur-titre « Recherche · vélos reconditionnés », H1 34px « 9 suggestions retenues ». À droite : solde « 91 crédits restants », bouton « Exporter » contouré, bouton accent « Générer 12 de plus ».
- **Bandeau de crédits** (élément clé du modèle économique) : `#12171a`, bordure `#232b2f`, rayon 12px, padding 14px/18px. Trois mentions séparées par des filets verticaux 1px×16px `#2a3236` : « **9 crédits** débités — 1 par suggestion retenue » (le chiffre en `#6ee7a8`), « Quel que soit le nombre d'extensions », « Rapport approfondi : 50 crédits par nom ».
- Filtres : 4 pilules — `Tout libre`, `.com + .fr libres`, `Rapport acheté`, `Favoris`. Actif : fond `#0f1b1c`, texte `#6ee7a8`, bordure `#23474b`. **Ne pas proposer de filtre sur une donnée payante** (INPI, réseaux) : elle n'existe pas sur les résultats non achetés.
- Grille de cartes : `repeat(auto-fill, minmax(280px, 1fr))`, gap 14px. Chaque carte (`#12171a`, rayon 14px, padding 20px, survol bordure `#3a4448`) contient :
  - Le nom (22px/700) et, en dessous, sa justification en 13px `#6d7873` (« roue + suffixe latin »).
  - Un badge de coût en haut à droite : toujours « 1 crédit ». Le badge et la bordure passent en accent uniquement quand TOUTES les extensions demandées sont libres (`.rg-card--strong` / `.rg-cost--accent`) ; sinon paire neutre.
  - **Uniquement les verdicts de domaines** (4 lignes `label` / `valeur` colorée) — jamais INPI ni réseaux.
  - Un séparateur `1px dashed #2a3236`, puis la ligne du palier payant : « 🔒 Réseaux + INPI — 50 crédits », ou « Rapport approfondi acheté » en accent si déjà payé.
  - Deux boutons : « Approfondir » (ou « Ouvrir le rapport ») et « Réserver » (fond `#1c2b26`, texte `#6ee7a8`).

La première carte du jeu de données est volontairement dans l'état « déjà acheté » pour montrer les deux traitements côte à côte.

### 3. Rapport approfondi

**Purpose** : justifier 50 crédits, et servir de document partageable (c'est le levier viral identifié).

**Layout** : fond clair `#f4f6f5`, colonne centrée max 920px.

Le sélecteur « Aperçu : Avant achat / Après achat » en haut de page est un **outil de présentation** : en production, l'état dépend de l'achat.

**État verrouillé (avant achat)** :

- Carte blanche, rayon 18px. En-tête : sur-titre « Rapport approfondi · non débloqué », nom 46px, et un paragraphe qui rappelle ce qui est déjà payé : « Cette suggestion a déjà été retenue et vérifiée (1 crédit). Le rapport approfondi ajoute la recherche d'antériorité INPI et EUIPO, et les pseudos sur 4 réseaux. »
- 4 lignes verrouillées. Chacune **nomme le contrôle en clair** (« Marques françaises — INPI », « X · @roulio »…) et affiche, à la place du verdict, une **barre grise de largeur variable** (11px de haut, rayon 6px, dégradé `#e8ebea` → `#dfe3e2`, largeurs 88 à 148px) suivie d'un cadenas. C'est le ressort de conversion : montrer la forme de la réponse, pas la réponse.

  🔒 **Impératif de sécurité.** Ces barres sont des **placeholders décoratifs générés côté client**. Ne jamais rendre le vrai verdict pour le masquer ensuite en CSS : un `filter: blur()`, un `user-select: none`, un texte en blanc sur blanc ou un `display: none` sont purement visuels — la donnée reste lisible dans le DOM, dans le code source et dans les devtools, et le paywall à 50 crédits devient contournable en deux clics. Seuls les **libellés** des contrôles viennent de l'API ; les verdicts n'atteignent le navigateur qu'après achat effectif. Les barres ne doivent pas non plus encoder d'information : leur largeur est arbitraire et fixe, elle ne reflète ni la longueur ni la nature du verdict, et elles portent `aria-hidden="true"`.
- Pied de carte `#fbfcfb` : « **50 crédits** — offert ce mois-ci » + « Un rapport approfondi offert chaque mois. Ensuite, 50 crédits par nom. » + bouton « Débloquer le rapport » (`#0d9a63`).

**État débloqué (après achat)** :

- En-tête : sur-titre « Rapport approfondi · 50 crédits · <date, heure> », nom 46px, badge de synthèse « Aucun blocage identifié » (`#e8f7ef` / `#0d7a4e`), bouton « PDF ».
- 4 sections — **Noms de domaine** (méta « RDAP · 18:22:04 »), **Marques françaises — INPI** (méta « classes 12, 35, 37 »), **Marques européennes — EUIPO**, **Réseaux sociaux** (méta « 4 plateformes »). Chaque section : titre 17px, méta 12.5px à droite, puis des lignes `libellé` / `note` / badge de verdict (`LIBRE`, `AUCUN DÉPÔT`, `SANS RISQUE`, `À SURVEILLER`, `PRIS`, `NON VÉRIFIABLE`).
- Pied de carte : avertissement obligatoire « Ce rapport est une recherche d'antériorité automatisée, pas un avis juridique. Il couvre les marques identiques et proches sur les classes sélectionnées. » + CTA « Réserver roulio.com — 13 € ».

### 4. Mobile (3 maquettes, 390px)

Les cadres de téléphone du prototype sont un décor de présentation : seul leur contenu est à implémenter, en responsive.

- **Accueil** : pilule d'accroche, H1 33px avec le mot qui alterne, chapô, CTA pleine largeur 52px, mention « 100 crédits / mois · 50 suggestions + 1 rapport », puis un encart « Exemple de verdict » à 3 lignes de domaines suivi d'une ligne verrouillée « 🔒 Réseaux + INPI — 50 crédits ».
- **Recherche** : le fil d'étapes horizontal devient un sur-titre « Étape n sur 4 — <libellé> » + une barre de progression en 4 segments de 4px (segments franchis en `#3ddc91`). **Une seule étape visible à la fois**, zone de `min-height: 150px`, et un bouton d'action de 52px en bas dont le libellé change : « Continuer », « Chercher les domaines », « Approfondir un nom », « Recommencer ».
- **Résultats** : titre « 9 suggestions retenues », sous-titre « 9 crédits débités · 91 restants », filtres en rangée (à rendre scrollable horizontalement en production), cartes empilées (nom, badge de coût, 3 verdicts de domaine en ligne, bouton « 🔒 Approfondir — 50 crédits » de 46px), et une barre d'onglets basse de 56px (Rechercher / Projets / Compte).

### 5. Notes & acquisition

Page interne de recommandations (positionnement, conversion, SEO, produit, monétisation) présentée en cartes à badge coloré. **À ne pas implémenter** — c'est de la documentation pour l'équipe. Contenu à conserver comme feuille de route.

## Interactions & Behavior

- **Mot qui alterne dans le H1** : rotation `produit → marque → société` toutes les 2000 ms, via un intervalle démarré au montage et nettoyé au démontage. Aucune transition dans le prototype ; un fondu court (150 ms) serait un plus légitime. Prévoir `prefers-reduced-motion: reduce` pour figer le mot.
- **Fil d'étapes de la démo** : clic sur un segment = affichage du volet correspondant. Aucune saisie réelle.
- **Wizard mobile** : le bouton bas avance d'une étape et boucle de 4 vers 1.
- **Cartes de résultats** : « Approfondir » ouvre le rapport verrouillé ; si déjà acheté, « Ouvrir le rapport » va directement au rapport complet. « Réserver » part vers le registrar.
- **Débloquage du rapport** : « Débloquer le rapport » débite les crédits (ou consomme le rapport offert du mois) et bascule à l'état complet. Prévoir un état de chargement pendant l'interrogation INPI/EUIPO/réseaux, et une confirmation explicite du débit à 50 crédits.
- **États à couvrir, absents du prototype** : chargement (interrogation registre), solde de crédits insuffisant, aucun résultat, échec d'API. Le verdict « non vérifiable » existe déjà et doit rester **distinct de « libre »** dans tous les cas.
- **Survols** : boutons accent `#3ddc91` → `#6ee7a8` ; boutons contourés `#2a3236` → `#3ddc91` ou `#4a5459` ; cartes de résultats bordure → `#3a4448` ; lignes de tableau clair → `#fcfcfa`.
- **Responsive** : le héros se replie en une colonne sous ~900px (`auto-fit` / `minmax(420px, 1fr)`). Le fil d'étapes passe à la ligne. Le tableau comparatif garde des colonnes minimales de 72px. À implémenter en Tailwind, pas en `auto-fit` si le design system impose des points de rupture explicites.

## Évolution fonctionnelle : le rapport offert mensuel

⚠️ **Ce n'est pas qu'un changement d'interface.** L'offre gratuite passe de « 100 crédits par mois » à « 100 crédits par mois **+ un rapport approfondi offert** ». Le rapport coûtant 50 crédits, l'offrir revient à doubler la valeur perçue du palier gratuit sans distribuer de crédits supplémentaires — il faut donc le compter séparément.

### Règle métier — recherche

Le coût de la recherche est de **1 crédit par suggestion retenue**, c'est-à-dire par nom qui remplit les critères de l'utilisateur. Le nombre d'extensions vérifiées n'entre jamais dans le calcul : qu'il ait demandé une extension ou cinq, en mode « au moins une libre » ou « toutes libres », une suggestion retenue coûte 1 crédit. Les candidats écartés parce qu'ils ne remplissent pas les critères ne sont pas facturés.

Conséquence sur l'interface, à ne pas perdre : ajouter une extension ne coûte rien à l'utilisateur. C'est un argument à énoncer près du sélecteur d'extensions, pas seulement dans les mentions de crédits — il lève l'autocensure qui pousse à ne vérifier que le .com.

### Règle métier — rapport approfondi

- Chaque compte dispose de **un (1) rapport approfondi gratuit par mois calendaire**, indépendant du solde de crédits.
- Le premier rapport débloqué dans le mois consomme ce droit et **ne débite aucun crédit**.
- Les rapports suivants dans le même mois coûtent **50 crédits** chacun.
- Le droit **n'est pas cumulable** : non utilisé, il est perdu à la fin du mois. *(Décidé côté produit.)*
- Un rapport déjà payé reste consultable indéfiniment, sans nouveau débit. Ré-ouvrir un rapport n'a jamais de coût.
- **Le rafraîchissement est gratuit, sans limite de temps.** *(Décidé côté produit.)* Les registres évoluent et une marque peut se déposer à tout moment : facturer la mise à jour aurait transformé le rapport en photo périmée que personne ne rouvre. Gratuit, il devient un document vivant qu'on garde dans son projet et qu'on rouvre avant de signer — et c'est ce qui rend le partage défendable : un lien qui reste juste vaut mieux qu'un PDF daté. Prévoir un bouton « Actualiser — gratuit » sur la carte vérifiée et dans le rapport, et une limite technique de fréquence (anti-abus) plutôt qu'un mur tarifaire.

### Vérification à la demande depuis les cartes

Parcours arrêté après revue (maquette : `Cartes — palier payant.dc.html`, option 2A). Il remplace l'affichage flouté sur la grille.

**Sur une carte non vérifiée**, les trois contrôles payants apparaissent **comme lignes, au même endroit et dans le même ordre que les verdicts obtenus** : « Marque INPI », « Marque EUIPO », chacune avec la mention « 🔒 non vérifié » à droite, puis une ligne « Réseaux » qui **nomme les quatre plateformes** sous forme de pastilles compactes — `IG`, `in`, `X`, `TT`, avec le nom complet en infobulle. En dessous, **un seul bouton** : « Vérifier marque et réseaux » — court, parce que les trois lignes juste au-dessus nomment déjà les registres et les plateformes ; le bouton n'a pas à les répéter. Puis « Rapport complet » en action secondaire. **Aucune barre grise, aucun verdict simulé.**

Le détail par réseau compte : un produit B2B se soucie de LinkedIn, une marque grand public de TikTok. L'utilisateur doit pouvoir arbitrer sur *le* réseau qui lui importe, pas sur un décompte agrégé. D'où le choix des pastilles plutôt que d'une ligne par plateforme : quatre lignes de plus × neuf cartes feraient un mur, alors qu'une ligne de pastilles donne la même information — chaque plateforme nommée, chaque état visible — et préserve la règle d'alignement entre les deux états.

**Les étoiles d'analyse sont une ligne libellée, pas un ornement flottant.** Dans `results-grid.css`, `.rg-stars` est un bouton nu posé sous les verdicts : rien ne dit à quoi les étoiles se rapportent, et un utilisateur y lit spontanément une note de disponibilité ou un avis d'autres utilisateurs. Les remettre dans la grammaire des lignes — libellé « Analyse du nom » à gauche, `★★★★☆ ▾` à droite — les explique sans texte supplémentaire, et le chevron garde l'affordance de dépliage. Cible tactile portée à 44px. La maquette emploie des abréviations (`IG`, `in`, `X`, `TT`) : je ne redessine pas des marques déposées, et une approximation serait pire que rien. En production, prendre les **glyphes officiels monochromes** dans les ressources de marque de chaque plateforme, et les teinter avec la couleur du verdict. Ne jamais utiliser les logos en couleurs d'origine : le rose d'Instagram et le cyan de TikTok entreraient en conflit avec le code couleur libre/pris, qui est l'information utile.

**Les logos des plateformes, oui — mais en glyphes monochromes.** La maquette emploie des abréviations (`IG`, `in`, `X`, `TT`) : je ne redessine pas des marques déposées, et une approximation serait pire que rien. En production, prendre les **glyphes officiels monochromes** dans les ressources de marque de chaque plateforme, et les teinter avec la couleur du verdict. Ne jamais utiliser les logos en couleurs d'origine : le rose d'Instagram et le cyan de TikTok entreraient en conflit avec le code couleur libre/pris, qui est l'information utile.

Trois exigences d'accessibilité sur cette ligne, valables logos comme abréviations : la couleur ne porte jamais l'information seule — chaque pastille affiche aussi un symbole (`✓`, `✗`, `🔒`) ; le nom complet et l'état sont dans l'attribut `title` (« Instagram — libre ») ; le symbole est en `aria-hidden`, l'information passant par le `title` pour les lecteurs d'écran.

⚠️ **Aucun prix sur le bouton.** Le libellé nomme ce qui sera vérifié, jamais le tarif : à ce stade l'utilisateur ne sait pas encore ce que la vérification lui apporte, donc un prix ne peut que l'arrêter. Le prix appartient à la popup, après le contexte — et c'est le même endroit où l'on met en avant la **vérification offerte chaque mois**, qui se perdrait totalement sur un bouton de carte. Le pied de popup annonce donc « Offert ce mois-ci — 50 crédits ensuite », et non l'inverse.

C'est la règle d'alignement : les six lignes de la carte (trois domaines, INPI, EUIPO, réseaux) existent dans les deux états, dans le même ordre. Seule la colonne de droite change — de « non vérifié » au verdict réel. **Rien ne se déplace après l'achat**, ce qui rend la comparaison entre un nom vérifié et un nom qui ne l'est pas immédiatement lisible.

Un seul bouton, pas un par ligne : un seul achat couvre les trois lignes verrouillées, donc trois boutons promettraient trois produits. Les boutons de notation (pouces) sont **à droite du nom**, dans l'en-tête de la carte, et non dans la barre d'action : ils portent sur le nom, pas sur le rapport — les placer près du bouton d'achat rendait leur objet ambigu.

**La popup** porte la pédagogie que la carte ne peut pas porter : deux phrases sur le risque réel (« un domaine libre ne garantit rien : la marque peut être déposée depuis des années »), puis la liste exacte de ce qui est couvert — INPI avec les classes retenues, EUIPO et sa portée sur les 27 États, les 4 réseaux, et la gratuité des mises à jour. Pied de popup : prix, mention du rapport offert s'il est disponible, « Annuler » et « Vérifier maintenant ». Confirmation systématique dès que des crédits sont réellement débités.

**Sur une carte vérifiée**, la colonne de droite passe aux verdicts réels et le bouton d'achat disparaît, remplacé par la date de vérification et « Actualiser — gratuit ». Un badge de synthèse (« aucun blocage » / « à surveiller » / « 2 obstacles ») s'ajoute en haut à droite.

**C'est le gain principal** : plusieurs noms vérifiés côte à côte deviennent comparables dans la grille. Nommer, c'est arbitrer entre trois ou quatre candidats ; jusqu'ici l'arbitrage exigeait d'ouvrir des rapports séparément. Le badge de synthèse est ce qui rend la comparaison lisible d'un coup d'œil — ne pas le supprimer au profit des seules lignes.

**Le rapport complet** devient l'agrégation des vérifications achetées, avec un appel à l'action pour celles qui manquent.

### Deux règles de comportement de la grille

**Vérifier vaut approbation.** Dépenser 50 crédits sur un nom est le signal d'intérêt le plus fort du produit — bien plus fiable qu'un clic sur un pouce. Le déclenchement d'une vérification **active donc implicitement le « j'aime »** sur ce nom, et l'IA en tient compte pour les suggestions suivantes. Le pouce reste cliquable pour se dédire. Sur une carte vérifiée, il s'affiche à l'état actif (`aria-pressed="true"`, fond `--nm-app-accent-surface`).

**L'ordre d'affichage suit l'engagement**, et non l'ordre de génération :

1. les noms dont la vérification a été faite ;
2. les noms aimés (explicitement, ou par effet de la règle ci-dessus) ;
3. les autres, dans l'ordre de génération.

Les noms rejetés restent masqués tant que le filtre correspondant est actif (`showDisliked` dans `wizard.ts`). La grille remonte ainsi d'elle-même la liste courte : après deux vérifications, les finalistes sont les deux premières cartes, sans tri manuel. Ce tri doit être **stable** — deux noms de même rang gardent leur ordre de génération — sinon les cartes se réordonnent sous le curseur à chaque notation.

⚠️ **Tension à arbitrer côté produit, non tranchée.** Comparer trois noms coûte 150 crédits, soit une fois et demie l'allocation mensuelle gratuite : le tarif décourage l'usage que cet écran encourage. Trois pistes — rapports suivants d'un même projet moins chers, vérification légère « réseaux seuls » à bas prix, ou lot de trois. C'est du modèle économique, pas du design, mais ça conditionne la valeur de tout ce parcours.

### Modèle de données

Sur le compte utilisateur, prévoir :

- `freeReportPeriod` — le mois de référence (`2026-08`)
- `freeReportUsedAt` — horodatage de consommation, ou nul
- Un enregistrement de rapport par (compte, nom) avec sa date, son coût réellement débité (`0` ou `50`) et son contenu figé

La bascule de période doit être **calculée à la lecture** (comparer le mois courant à `freeReportPeriod`), pas par une tâche planifiée mensuelle : plus simple, et sans risque de compte oublié.

### Contrat d'API

L'endpoint qui décrit un nom doit exposer de quoi afficher le bon libellé **sans que le front devine** :

- `deepReport.purchased` — booléen
- `deepReport.priceCredits` — `50`
- `deepReport.freeThisMonth` — booléen : le droit gratuit est-il encore disponible
- `account.credits` — solde, pour détecter le cas « solde insuffisant »

**Le serveur ne renvoie aucun verdict approfondi tant que le rapport n'est pas acquis.** Avant achat, la réponse contient les libellés des contrôles qui *seront* effectués, le prix et la disponibilité du droit gratuit — jamais les résultats INPI, EUIPO ou réseaux, ni sous forme partielle, ni sous forme agrégée (un simple compteur « 3 contrôles favorables » suffit à déduire l'essentiel : ne pas l'exposer non plus). Après acquisition, la même route renvoie le rapport complet. Contrôler cette règle par un test automatisé : la réponse pré-achat ne doit contenir aucun champ de verdict.

Le débloquage doit être une opération **serveur, idempotente et transactionnelle** : consommer le droit gratuit ou débiter 50 crédits, puis produire le rapport. Ne jamais laisser le front décider du prix.

### Conséquences sur l'interface

- **Pied de l'écran verrouillé** — deux libellés :
  - droit disponible : « **50 crédits** — offert ce mois-ci » + « Un rapport approfondi offert chaque mois. Ensuite, 50 crédits par nom. »
  - droit consommé : « **50 crédits** » + « Votre rapport offert de <mois> a été utilisé. Prochain rapport offert le 1er <mois suivant>. »
- **Solde insuffisant** (moins de 50 crédits et droit consommé) : le bouton devient « Recharger pour débloquer » et mène aux packs. Ne pas afficher un bouton qui échouera.
- **Confirmation de débit** : quand 50 crédits sont réellement débités, une confirmation explicite est nécessaire (la moitié de la réserve mensuelle part en un clic). Quand le rapport est offert, **pas de confirmation** — la friction n'a aucune valeur là.
- **Accueil** : la mention « ≈ 50 suggestions vérifiées + 1 rapport » est le principal argument d'inscription. Elle doit rester visible dans le héros et dans le CTA final.

## Keycloak : aligner l'authentification et les e-mails

L'authentification passe par Keycloak, thème `namorama` dans `infra/keycloak/themes/namorama/`. **Sans cette étape, le parcours casse visuellement au moment le plus sensible** : le visiteur quitte une page sombre en Space Grotesk pour une page claire en police système, dans un vert différent. Trois sous-thèmes sont concernés — `login`, `account`, `email` — et leur état actuel diffère beaucoup.

### État constaté

| Sous-thème | État | Action |
| --- | --- | --- |
| `login` | Existe, soigné (`login.v3.css`, 14.7 ko, sélecteurs PatternFly 4 vérifiés sur KC 22). Mais **ancienne palette** `#10b981` / `#059669`, polices système, et l'en-tête du fichier porte encore l'ancien nom « NameSpotter ». | Retoucher les valeurs, ne pas réécrire |
| `account` | Existe (`account.v3.css`, `parent=keycloak.v3`, `darkMode=false`), même ancienne palette. `logo.svg` = texte en `#10b981`, police `system-ui`. | Retoucher + refaire le logo |
| `email` | **Vide** : `theme.properties` contient seulement `parent=base`. Aucun template, aucune traduction. Les mails partent donc au format Keycloak par défaut. | **À créer entièrement** |

⚠️ Le CSS de login existant est un travail précis : ses sélecteurs ont été validés contre le HTML réel de Keycloak 22 (voir ses commentaires), il masque le sélecteur de langue natif qui casse la mise en page, et il réordonne les fournisseurs SSO avant le formulaire avec une pastille « ou ». **Ne pas repartir de zéro** : remplacer les valeurs de couleur et de police, conserver la structure et les commentaires.

### Correspondance des couleurs (login + account)

Le thème Keycloak est sur **fond clair**. L'accent sombre du site (`#3ddc91`) est trop clair pour du texte ou un aplat de bouton sur blanc — utiliser la variante claire `#0d9a63`, qui est déjà celle du design pour les fonds clairs.

| Ancienne valeur | Nouvelle valeur | Usage |
| --- | --- | --- |
| `#10b981` | `#0d9a63` | Accent principal : bouton, liens, focus, `accent-color` |
| `#059669` | `#0b8355` | Survol de l'accent |
| `#047857` | `#0b8355` | Accent appuyé (fusionner) |
| `#f3f4f6` | `#f4f6f5` | Fond de page |
| `#111827` | `#0b0e10` | Texte principal |
| `#374151` | `#2c3532` | Texte secondaire, labels |
| `#6b7280` | `#5c6663` | Texte tertiaire |
| `#9ca3af` | `#8a938f` | Texte discret (pastille « ou ») |
| `#d1d5db` | `#dde2e0` | Bordure d'input, bouton SSO |
| `#e5e7eb` | `#e3e7e5` | Séparateurs, bordure de carte |
| `#f9fafb` | `#fbfcfb` | Survol de bouton SSO |
| `rgba(16,185,129,…)` | `rgba(13,154,99,…)` | Halos de focus |

Alertes : reprendre les paires du design plutôt que celles de Tailwind — erreur `#fbecec` / `#a33b3b`, avertissement `#fdf3e3` / `#9a6a12`, succès `#e8f7ef` / `#0d7a4e`.

Rayons : la carte passe de `0.75rem` à `1rem` (18px du design), les inputs et boutons restent à `0.5rem` (10px).

### Typographie

Remplacer la pile système par celle du site : **Space Grotesk** pour `#kc-page-title`, `#kc-header-wrapper` et les titres ; **IBM Plex Sans** pour les labels, inputs, boutons et textes.

**Auto-héberger les polices** dans `login/resources/fonts/` et `account/resources/fonts/` (woff2, graisses 400/500/600/700), avec des `@font-face` en tête du CSS. Ne pas appeler Google Fonts depuis une page de login : requête tierce sur un écran d'authentification, dépendance externe, et la CSP par défaut de Keycloak la bloquera. Prévoir un `font-display: swap` et une pile de repli.

### Logo

Le `logo.svg` actuel est du texte tracé en `system-ui` — donc rendu différemment selon la machine — dans l'ancien vert. Le refaire : soit le vrai logo vectorisé (idéal), soit reproduire le mot-symbole du design (carré arrondi `#0d9a63` de 24px, rayon 6px, + « Namorama » en Space Grotesk 700, `#0b0e10`) avec le **texte converti en tracés** pour ne pas dépendre d'une police disponible. Le mettre à jour dans `account/resources/` **et** l'ajouter au thème login (le CSS actuel dessine une pastille verte en `::before` sur `#kc-header-wrapper` avec une icône générique — la remplacer par le logo réel).

### Thème e-mail — à créer

C'est le plus gros manque. Structure à créer sous `infra/keycloak/themes/namorama/email/` :

```
email/
  theme.properties          → parent=keycloak (et non base)
  messages/
    messages_fr.properties  → objets et corps des mails, en français
    messages_en.properties
  html/
    template.ftl            → gabarit commun (en-tête, pied, styles)
    email-verification.ftl
    password-reset.ftl
    executeActions.ftl
    email-test.ftl
  text/
    (les mêmes en version texte brut)
```

Règles de conception pour les mails — elles diffèrent de celles du site :

- **Styles en ligne uniquement**, dans une table de largeur maximale 600px. Pas de flex, pas de grid, pas de variables CSS, pas de `@font-face` : la plupart des clients mail les ignorent ou les cassent.
- **Polices système en repli assumé** : `font-family: 'IBM Plex Sans', Helvetica, Arial, sans-serif`. Space Grotesk ne s'affichera pas chez la majorité des destinataires — n'en dépendre pour aucune information, et ne pas mettre le logo en texte.
- **Fond clair** (`#f4f6f5`), carte blanche, bordure `#e3e7e5`, rayon 12px. Ne jamais reprendre le fond sombre du site : il passe mal en mode sombre de messagerie et coûte cher à l'impression.
- **Bouton d'action** : un `<a>` stylé en aplat `#0d9a63`, texte blanc, padding 14px/26px, rayon 8px — et **toujours doublé de l'URL en clair** en dessous, car de nombreux clients dégradent les boutons.
- **Logo en PNG** hébergé (pas de SVG, mal supporté), avec `alt` renseigné, ou à défaut le mot-symbole en texte simple.
- **Version texte obligatoire** pour chaque template : Keycloak l'envoie en multipart, et son absence dégrade fortement la délivrabilité.
- Objets en français, sans emoji, explicites : « Vérifiez votre adresse e-mail », « Réinitialisez votre mot de passe ».
- Pied de page : nom de l'expéditeur, mention que le message est automatique, et le rappel que le lien expire (Keycloak fournit la durée).

### Cohérence de discours

Le vocabulaire des écrans d'authentification doit reprendre celui du site : on parle de **crédits**, de **rapport approfondi**, de **noms libres**. Un utilisateur qui crée un compte le fait pour ses 100 crédits mensuels — le rappeler sur l'écran d'inscription (via `messages_fr.properties`) est un gain de conversion mesurable. Le fichier `login/messages/messages_fr.properties` ne contient aujourd'hui qu'une seule clé (`identity-provider-login-label`) : c'est le bon endroit pour poser ces libellés.

### Vérification

- Rejouer chaque écran : connexion, inscription, mot de passe oublié, vérification d'e-mail, page d'erreur, et la console `account`.
- Tester la connexion SSO Google et Microsoft — le CSS actuel injecte leurs logos en `::before` / `background-image`, à ne pas casser.
- Vérifier à 390px (le CSS a déjà un point de rupture à 480px).
- Envoyer chaque mail en réel et le contrôler dans au moins Gmail web, Gmail iOS et Outlook — c'est le trio qui casse les mises en page.
- Contrôler le contraste : `#0d9a63` sur blanc passe le AA pour du texte ; `#3ddc91` **ne passe pas** — d'où la substitution.

Le déploiement passe par `infra/keycloak/deploy.sh` et `docker-compose.yml` ; les thèmes sont montés dans le conteneur. Penser à désactiver le cache de thèmes de Keycloak en développement, sinon les modifications de CSS n'apparaissent pas.

## Multilingue : des traductions invisibles pour Google

L'application dispose de **19 langues** de chaînes d'interface dans `web/public/assets/i18n/` — mais elles ne rapportent aucun visiteur. C'est un investissement déjà payé qui ne produit rien.

### Le problème

`web/src/index.html` est **entièrement en français, en dur** : `<html lang="fr">`, `<title>`, `meta description`, Open Graph, Twitter Card, `link rel="canonical"` vers `https://namorama.com/`, et deux blocs JSON-LD (`WebApplication` + `FAQPage`) dont toutes les questions sont en français. Les traductions sont chargées **au moment de l'exécution**, côté client, après l'indexation.

Conséquences concrètes :

- Google ne voit **qu'une seule page, en français**. Une recherche allemande (`markenname generator`) ou espagnole ne peut pas vous trouver, quelle que soit la qualité de `de.json`.
- Il n'existe **aucune URL par langue** : pas de `/de/`, pas de `?lang=de` indexable, donc rien à référencer, rien à partager, rien à mettre en `hreflang`.
- Le `sitemap.xml` ne peut lister que la version française.
- Les partages sur les réseaux sociaux affichent toujours le titre et la description français, même à un lecteur allemand.

### Couverture réelle des traductions

Les volumes de fichiers révèlent une couverture très inégale : `fr.json` 17,5 ko, `en.json` 16,1 ko, **toutes les autres langues autour de 9 ko** — soit environ la moitié des clés. Et certaines valeurs « traduites » sont restées en anglais : dans `de.json`, la section `APP` contient encore `"DELETE_ACCOUNT": "Delete my account"`, `"DELETE_ACCOUNT_TITLE": "Delete account"`, `"CANCEL": "Cancel"`. Un utilisateur allemand voit donc un mélange allemand/anglais.

Par ailleurs, les nouveaux libellés introduits par cette refonte (bandeau de crédits, rapport approfondi, verrou, états d'erreur) n'existent dans **aucun** fichier de langue : ils doivent être ajoutés en clés i18n dès l'implémentation, jamais en texte littéral dans les gabarits.

**Combien de langues méritent d'être vraiment soutenues ?** Question tranchée : **les 19**.

### Décision : les 19 langues sont soutenues

**Décidé côté produit : toutes les langues présentes sont maintenues** (fr, en, de, es, it, pt, nl, pl, cs, da, fi, hu, ja, no, ro, ru, sv, tr, zh). Cela change la nature du chantier : il ne s'agit plus de choisir, mais d'organiser.

À lire comme un avertissement de charge, pas comme une objection : 19 langues signifient 19 jeux de métadonnées, 19 `hreflang` réciproques par page, et 19 versions de chaque guide sectoriel. **Traiter en deux temps** :

1. **Mécanique, pour les 19 d'un coup** — URLs par langue, métadonnées et JSON-LD pré-rendus à partir des fichiers i18n, `hreflang`, sitemap, parité des clés en CI. Le coût est quasi identique pour 4 ou 19 langues : c'est du code, pas de la rédaction. Compléter au passage les clés manquantes (les fichiers non-fr/en font environ la moitié de la taille des fichiers français) et corriger les valeurs restées en anglais.
2. **Rédactionnel, par vagues** — les guides SEO et les textes longs, dans l'ordre du potentiel : d'abord fr, en, de, es ; ensuite it, pt, nl, pl ; le reste au fur et à mesure. Une langue sans guides reste utile (interface complète + landing indexable), simplement moins performante en acquisition. Ne pas bloquer la mise en production des 19 interfaces en attendant les 19 traductions de contenu.

La traduction automatique est acceptable pour l'interface (chaines courtes, contexte clair) à condition d'une relecture humaine des écrans qui vendent : landing, tarifs, verrou du rapport. Elle ne l'est pas pour les guides, qui doivent viser des requêtes réelles dans chaque langue — or les requêtes ne se traduisent pas, elles se recherchent.

### Ce qu'il faut mettre en place

1. **Une URL par langue**, en préfixe de chemin : `namorama.com/fr/`, `/en/`, `/de/`, `/es/`. Configurer le `<base href>` Angular en conséquence et rediriger `/` vers la langue détectée (en `302`, jamais `301` — la racine ne doit pas être figée sur une langue).
2. **Des métadonnées par langue, présentes dans le HTML servi** — c'est le point critique. Deux options :
   - *Pré-rendu* (recommandé) : Angular propose un pré-rendu statique par route et par langue. Chaque page sort avec ses `title`, `description`, Open Graph et JSON-LD déjà traduits, sans SSR à maintenir. C'est le meilleur rapport effort/gain ici.
   - *SSR* : nécessaire seulement si du contenu dépend de l'utilisateur connecté. La landing et les guides n'en ont pas besoin.

   Injecter les métadonnées côté client avec le service `Title`/`Meta` d'Angular **ne suffit pas** : Google peut les lire, mais les autres moteurs et surtout les aperçus de partage (LinkedIn, X, WhatsApp, Slack) ne les verront jamais.
3. **Balises `hreflang` réciproques** dans chaque page, avec `x-default` pointant vers la version anglaise ou le sélecteur, et un `canonical` propre à chaque langue.
4. **Sitemap par langue** (ou un sitemap unique avec les alternates `xhtml:link`), et mise à jour de `robots.txt`.
5. **Sélecteur de langue visible**, avec l'URL qui change réellement. Il existe déjà côté application, avec les drapeaux `flag-icons` chargés depuis jsDelivr — **remplacer ce CDN par un asset local** : une dépendance externe bloquante en `<head>` sur la landing coûte du temps de chargement et pose un problème RGPD (requête vers un tiers avant consentement). N'utiliser un drapeau pour désigner une langue est par ailleurs discutable : préférer le nom de la langue dans sa propre langue (`Deutsch`, `Español`).
6. **Test de parité des clés** en intégration continue : échec du build si une langue déclarée « soutenue » a une clé manquante ou identique à l'anglais alors qu'elle ne devrait pas l'être. C'est ce qui empêche la dérive de revenir.
7. **Les guides SEO par secteur doivent être traduits par langue soutenue**, pas seulement l'interface. C'est là que se trouve le trafic : « générateur de nom d'entreprise » et « firmennamen generator » sont deux marchés distincts, et le second est nettement moins disputé.

### Décision : périmètre INPI + EUIPO, affiché explicitement

Le contrôle de marque est **juridiquement national**. Un utilisateur allemand cherche une antériorité au **DPMA**, un espagnol à l'**OEPM**. **Décidé côté produit : le rapport reste sur l'INPI et l'EUIPO**, et le périmètre est affiché explicitement plutôt que sous-entendu — la marque de l'Union européenne couvrant les 27 États membres, c'est une promesse honnête et utile dans toute l'UE.

Exigences d'implémentation qui en découlent :

- Le rapport et la page qui le vend doivent **nommer les registres interrogés** (INPI, EUIPO) dans chaque langue, et non parler de « dépôt de marque » en général. Une clé i18n dédiée, pas une reformulation par langue.
- Ajouter une phrase de périmètre au pied du rapport, à côté de l'avertissement juridique existant : le rapport couvre les marques françaises (INPI) et de l'Union européenne (EUIPO), **pas les registres nationaux des autres États membres**.
- Ne jamais laisser une traduction suggérer une couverture nationale locale. C'est le seul endroit du produit où une approximation de traduction crée un risque juridique pour l'utilisateur, pas seulement une gêne.
- Les registres nationaux supplémentaires (DPMA, OEPM…) sont une évolution ultérieure possible, hors périmètre de cette refonte.

## Thème clair / sombre suivant le système

Demandé après l'implémentation : un thème qui suit la préférence de l'OS, avec bascule manuelle. Maquette de référence : `Thème — clair, sombre, système.dc.html`.

### Conflit à résoudre d'abord

`tokens.css` pose explicitement que « la refonte n'est pas un thème clair et un thème sombre » : les jetons sont nommés par **surface** (`-dark` / `-light`), et `darkModeSelector` est désactivé côté PrimeNG. Cette décision reste juste — un `.nm-hero` est sombre par intention éditoriale, pas parce qu'un mode est actif. **Ne pas renommer les jetons existants, ne pas les supprimer.**

La solution est une **couche de rôles au-dessus de la palette** : des jetons `--nm-app-*` qui pointent, selon le mode actif, vers les valeurs claires ou sombres déjà définies. Les composants n'utilisent plus que les rôles ; la palette reste la source des valeurs.

### Ce qui bascule, ce qui ne bascule pas

C'est la décision de conception la plus importante, plus que le choix des couleurs.

| Suit le mode | Reste sombre toujours | Reste clair toujours |
| --- | --- | --- |
| Wizard (3 étapes), champs | Héros de l'accueil | Rapport exporté en PDF |
| Grille de résultats | Bloc d'appel à l'action final | E-mails transactionnels |
| Tiroir des projets | Encart de démonstration produit | Écrans Keycloak |
| Dialogues (choix assisté, achat, crédits) | | |
| Rapport approfondi, verrouillé et complet | | |
| Guides et contenu SEO | | |

⚠️ **La grille de résultats demande un arbitrage explicite.** `results-grid.css` pose aujourd'hui `background: var(--nm-bg-dark)` sur son `:host`, avec ce commentaire assumé : « elle se présente comme un panneau de résultats plutôt que de dépendre d'un parent qu'il aurait fallu retourner en entier ». Le composant est donc **sombre en permanence**, y compris dans un wizard clair — c'est la rupture visuelle la plus forte de l'écran. Deux issues cohérentes, une seule à choisir :

1. **La grille suit le mode** (recommandé) : elle abandonne son aplat propre et passe aux jetons de rôle. Les résultats sont du contenu applicatif, pas une signature de marque. C'est aussi ce qui règle l'incohérence signalée par l'utilisateur.
2. **La grille reste sombre** : elle devient une exception documentée, et le reste du wizard doit alors passer en sombre avec elle — sinon le contraste noir/blanc au milieu du formulaire subsiste dans les deux modes.

Le `brand-report-locked` est en revanche déjà sur les surfaces claires (`--nm-surface-light`), avec ce commentaire juste : « même surface claire que l'état débloqué : c'est la même carte, avant achat ». Il doit suivre le mode, mais **les deux états ensemble** — jamais l'un clair et l'autre sombre.

Les surfaces sombres de l'accueil sont une signature de marque : un visiteur en préférence claire doit voir le même héros que les autres. Le PDF sombre est inimprimable ; les clients de messagerie ignorent les variables CSS ; Keycloak est servi hors de l'application et ne connaît ni le `localStorage` ni le choix de l'utilisateur.

### Jetons de rôle à ajouter

Une seule couche nouvelle, 20 jetons. Correspondances complètes dans la maquette ; les principaux :

| Rôle | Clair | Sombre |
| --- | --- | --- |
| `--nm-app-bg` | `#f4f6f5` | `#0b0e10` |
| `--nm-app-surface` | `#ffffff` | `#12171a` |
| `--nm-app-surface-alt` | `#fbfcfb` | `#0e1315` |
| `--nm-app-border` | `#e3e7e5` | `#232b2f` |
| `--nm-app-border-strong` | `#dde2e0` | `#2a3236` |
| `--nm-app-divider` | `#eef1f0` | `#1b2225` |
| `--nm-app-text` | `#0b0e10` | `#f2f5f3` |
| `--nm-app-text-2` | `#5c6663` | `#9aa5a0` |
| `--nm-app-text-3` | `#8a938f` | `#6d7873` |
| `--nm-app-accent` | `#0d9a63` | `#3ddc91` |
| `--nm-app-accent-hover` | `#0b8355` | `#6ee7a8` |
| `--nm-app-on-accent` | `#ffffff` | `#062018` |
| `--nm-app-accent-surface` | `#e8f7ef` | `#0f1b1c` |
| `--nm-app-accent-border` | `#c9e9d8` | `#23474b` |
| `--nm-app-badge-bg` / `-fg` | `#eef1f0` / `#8a938f` | `#263033` / `#6d7873` |
| `--nm-app-verdict-*-fg` / `-bg` | paires `*-light-*` | paires `*-dark-*` |

⚠️ **Il manque un jeton de remplissage accentué pour le mode clair — et c'est le CTA payant qui en souffre.** `--nm-accent-on-light` (`#0d9a63`) est employé à la fois comme couleur de **texte** et comme **fond de bouton avec texte blanc** (voir `.rl-btn` dans `brand-report-locked.css`). Or blanc sur `#0d9a63` mesure **3,61:1** : tous les boutons primaires du mode clair échouent au AA, y compris « Débloquer le rapport » et « Vérifier maintenant ».

La correction est dans la couche de jetons, pas dans les composants :

| Usage | Valeur | Contraste |
| --- | --- | --- |
| Texte et bordures accentués sur fond clair | `#0d7a4e` | 4,85:1 sur blanc ✓ |
| **Fond de bouton primaire**, texte blanc | `#0d7a4e` | 4,85:1 ✓ |
| Survol du bouton primaire | `#0a6b44` | ✓ |
| ~~Ancien fond de bouton~~ | ~~`#0d9a63`~~ | 3,61:1 ✗ |

`#0d9a63` reste utilisable pour un aplat **sans texte** (barre de progression, point d'état). Dès qu'un libellé se pose dessus, c'est `#0d7a4e`.

⚠️ **La paire ambre est limite.** `#9a6a12` sur `#fdf3e3` mesure **4,3:1** à 12px, juste sous le seuil. Utiliser `#8a5a12` pour les libellés de verdict « à surveiller ». Le pendant sombre (`#e0b96e` sur `#1c1810`) n'est pas concerné.

⚠️ **L'ambre des étoiles d'analyse a besoin d'un pendant clair.** `results-grid.css` utilise `#f59e0b` pour `.rg-stars` — correct tant que la grille est sombre, où cet ambre passe confortablement. Sur une carte claire, le même ambre mesure **2,15:1**. Or ces étoiles portent le score d'analyse du nom : du contenu que l'utilisateur doit lire et comparer d'une carte à l'autre. Prévoir la même scission que pour l'accent : `#f59e0b` sur sombre, `#b45309` sur clair (≈4,9:1 sur blanc). L'étoile vide suit `--nm-app-text-2`.

⚠️ **`--nm-app-text-3` ne porte jamais de texte informatif — sur aucune des deux surfaces.** Mesuré : `#8a938f` sur `#fbfcfb` donne **3,07:1** à 12px, et son pendant sombre `#6d7873` échoue aussi — **4,23:1** sur `#0b0e10`, **3,94:1** sur `#12171a`, donc pire sur la surface de carte que sur le fond. Le AA exige 4,5:1. Tout texte qu'un utilisateur doit lire passe à `--nm-app-text-2` : `#5c6663` sur clair (5,94:1), `#9aa5a0` sur sombre (7,62:1). `--nm-app-text-3` est réservé aux bordures, aux séparateurs et aux états désactivés. C'est une règle **symétrique** : ne pas la traiter comme un problème de mode clair.

⚠️ **La bordure accentuée porte du sens, ce n'est pas un habillage.** `.rg-card--strong` et `.rg-cost--accent` signifient, dans `results-grid.css`, « nom dont TOUTES les extensions demandées sont libres » — le signal que l'utilisateur cherche du regard. Ne jamais appliquer `--nm-app-accent-border` à une carte aux verdicts mixtes : la carte ordinaire prend `--nm-app-border`, et le badge de coût prend la paire neutre `--nm-app-badge-*`.

⚠️ **Un jeton manque à la palette actuelle** : la bordure d'une carte accentuée sur fond clair. `#c9e9d8` est employé dans les maquettes, dérivé de `--nm-verdict-free-light-bg`. À nommer (`--nm-accent-border-light`) plutôt qu'à recopier dans les composants.

### Le sélecteur : trois états

`Système` · `Clair` · `Sombre`, avec **Système par défaut**. Une bascule à deux états force un choix, puis cesse de suivre l'OS quand celui-ci passe en mode nuit. Emplacement : le menu du compte, à côté de la langue — ce n'est pas une action fréquente. L'état actif utilise l'accent du mode courant (`#0d9a63` sur clair, `#3ddc91` sur sombre) : deux jetons distincts, non interchangeables.

### Les cinq pièges

1. **Le flash blanc au chargement.** Si le mode est lu après le rendu, l'utilisateur en préférence sombre voit un éclair blanc à chaque navigation. Il faut un script **synchrone** minuscule dans le `<head>`, avant tout style : il lit le choix stocké, sinon `prefers-color-scheme`, et pose l'attribut sur `<html>`. Aucun framework ne peut le faire assez tôt, Angular compris.
2. **Trois valeurs stockées, pas deux.** Ne stocker que `light`, `dark`, ou **rien** — « Système » est l'absence de valeur. Enregistrer le mode *résolu* au moment du choix ferait cesser le suivi de l'OS sans que l'utilisateur l'ait demandé. Écouter aussi les changements de `prefers-color-scheme` en direct : l'OS bascule le soir, la page ouverte doit suivre.
3. **`color-scheme`, pas seulement les couleurs.** Déclarer la propriété CSS `color-scheme` sur la racine. Sans elle, champs de formulaire, barres de défilement et menus natifs restent clairs — des rectangles blancs dans une interface sombre, sur les écrans qui comptent le plus de champs.
4. **PrimeNG doit basculer aussi.** `darkModeSelector` est désactivé dans `app.config.ts`. Sans lui, `p-select`, `p-dialog`, `p-drawer`, `p-chip` et les tooltips restent clairs quoi que fassent vos jetons : deux thèmes superposés. L'activer sur le **même attribut de racine** que le vôtre.
5. **Impression et e-mails.** Forcer le rapport en surfaces claires dans une `@media print`, et n'utiliser aucun jeton de rôle dans les e-mails (styles en ligne, figés). Keycloak reste clair : un cookie partagé pour un gain nul n'en vaut pas le coût.

### Ordre de travail

Cette étape vient **après** la migration du wizard vers les jetons (étape 6 bis) : basculer un écran qui contient encore de l'indigo en dur et des `var(--p-surface-*)` ne produirait qu'un mode sombre à moitié cassé. Migrer d'abord, thématiser ensuite.

## State Management

| État | Portée | Rôle |
| --- | --- | --- |
| `word` (0–2) | Accueil | Index du mot qui alterne dans le H1. Piloté par un intervalle de 2 s. |
| `step` (1–4) | Accueil, mobile | Étape affichée dans la démo et le wizard mobile. |
| `filter` | Résultats | Filtre actif sur les cartes. |
| `unlocked` | Rapport | Rapport approfondi acheté ou non. En production : dérivé des données serveur, pas d'un état local. |
| `screen` | — | **Artefact du prototype uniquement** : sert la barre de navigation entre maquettes. À remplacer par le routeur Angular. |

Données à récupérer côté API : suggestions de noms + justification, verdicts par domaine (libre / pris / non vérifiable), et le coût de la recherche : 1 crédit par suggestion retenue, solde de crédits et rapport offert du mois, contenu du rapport approfondi (INPI, EUIPO, réseaux), horodatage d'interrogation des registres.

## Assets

### Logo et favicon — à unifier

Il existe aujourd'hui **trois marques différentes** dans le dépôt :

| Fichier | Contenu actuel | Problème |
| --- | --- | --- |
| `web/public/favicon.svg` | Une **boussole** (cercle + aiguille) en `#10b981` | Sans lien avec le mot-symbole |
| `infra/keycloak/themes/namorama/account/resources/favicon.svg` | Un **carré vert arrondi avec un « N »** en `sans-serif` | Autre marque, autre concept |
| `infra/keycloak/themes/namorama/account/resources/logo.svg` | « Namo » en `#10b981` + « rama » en `#111827`, police `system-ui` | Texte non vectorisé : rendu différent selon la machine |
| `login.v3.css` | Une pastille verte + icône générique dessinée en `::before` | Quatrième variante |
| `web/public/assets/og-image.png` | 344 ko | À refaire avec la nouvelle marque et à compresser |

Trois pistes de logo ont été proposées en amont (fichier `Logo — propositions.dc.html`). **Décision arrêtée : la boussole existante est conservée** — tracé inchangé, palette et typographie mises à jour (piste 1D du fichier). Le problème n'était pas la forme mais la coexistence de trois marques.

Ce qui change exactement :

- Le tracé SVG de `web/public/favicon.svg` est repris **à l'identique** (les deux `path` : aiguille et cercle). Ne pas le redessiner.
- **Deux tons au lieu d'un aplat vert** : aiguille `#0d9a63`, cercle `#0b0e10`. Sur fond sombre : aiguille `#3ddc91`, cercle `#f2f5f3`. C'est ce contraste qui rend la boussole lisible à 16px — l'aplat monochrome `#10b981` ne l'était pas.
- Version **monochrome** : les deux `path` en `#0b0e10` (ou en blanc sur fond sombre).
- Mot-symbole refait en **Space Grotesk 700, bas de casse**, `#0b0e10` (ou `#f2f5f3`), interlettrage `-0.035em`, texte **converti en tracés**.
- **Suppression** des deux marques concurrentes : le carré vert à « N » (`account/resources/favicon.svg`) et la pastille dessinée en `::before` dans `login.v3.css` — remplacées par la boussole.

Livrables attendus :

- Mot-symbole SVG, **texte converti en tracés** (aucune dépendance à une police installée), en version fond clair et fond sombre
- Icône seule SVG, tracé intégral, pour les tailles **au-delà de 24px**
- **Variante 16px simplifiée, obligatoire** : le tracé d'origine ne tient pas à 16px (son cercle ne fait que 1,5 unité sur 24 et se brouille). Épaissir le cercle à ~2,8 unités et agrandir l'aiguille d'environ 34% autour du centre. Elle sert au `favicon.svg` affiché en petit, au `favicon.ico` et au 32px. Ne pas se contenter de réduire le grand format — c'est le défaut du favicon actuel.
- `favicon.svg`, `favicon-32.png`, `favicon.ico`, `apple-touch-icon` — les quatre sont déjà référencés dans `index.html`
- PNG du mot-symbole pour les e-mails (le SVG y est mal supporté)
- Version monochrome
- Nouvelle `og-image.png`, en 1200×630, compressée

Remplacer les fichiers dans `web/public/` **et** dans les deux sous-thèmes Keycloak : ce sont des copies distinctes, elles divergent dès qu'on en oublie une.

### Autres assets

Aucun autre asset binaire dans le prototype. Les cadenas sont des emoji `🔒` : **les remplacer par une icône PrimeIcons** (`pi-lock`). Les seules dépendances externes du prototype sont les deux polices Google Fonts ; côté application, `flag-icons` est chargé depuis jsDelivr et doit être internalisé (voir la section multilingue).

## Files

- `Namorama - Refonte.dc.html` — le prototype complet (tous les écrans)
- `support.js` — runtime nécessaire à l'ouverture du prototype dans un navigateur ; **pas une dépendance de production**

Côté dépôt, les fichiers concernés : `web/src/app/components/landing/`, `web/src/styles.css`, `web/src/index.html`, les composants de recherche/résultats sous `web/src/app/components/`, et le thème d'authentification sous `infra/keycloak/themes/namorama/` (`login/resources/css/login.v3.css`, `account/resources/css/account.v3.css`, `account/resources/logo.svg`, et le dossier `email/` à construire).

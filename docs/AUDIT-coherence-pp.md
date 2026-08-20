# Audit de cohérence — application Namorama (post-handoff)

Revue de six écrans réels de `localhost:4200` : accueil, tiroir des projets, description de projet (étape 1), configuration (étape 2), résultats (étape 3), rapport de marque.

Le handoff a été appliqué **écran par écran** : chaque écran est correct isolément, mais les mêmes objets (verdict, bouton primaire, contrôle segmenté, en-tête, état inconnu) sont dessinés différemment d'un écran à l'autre. Ce document liste les écarts et la correction attendue pour chacun. Il complète `README.md`, il ne le remplace pas : toutes les valeurs citées viennent de la section **Design Tokens** et de la section **Thème clair / sombre**.

**Règle de travail** : ne pas rouvrir de décision produit ici. Chaque point ci-dessous est un alignement sur une décision déjà prise. Un point marqué « à trancher » est le seul type qui remonte au produit.

---

## P0 — incohérences qui trompent l'utilisateur

### 1. Trois systèmes de verdict coexistent

| Écran | Rendu actuel |
| --- | --- |
| Grille de résultats | pastille pâle, texte coloré, bas de casse : `libre`, `pris`, `non vérifiable` |
| Rapport de marque | **aplat saturé, texte blanc, capitale initiale** : `Libre` (vert vif), `Pris` (rouge vif) |
| Rapport — domaines/réseaux inconnus | **rond gris avec un `?`** |
| Carte — réseaux | pastille `IG ?` / `TT ✓` / `in ✗` |
| Carte — INPI non acheté | `🔒 non vérifié` |

Un même fait (« ce nom est libre ») a deux couleurs de vert et deux typographies selon l'écran, et l'état inconnu a **trois** représentations.

**Correction.** Un seul composant de verdict, une seule échelle, utilisé partout — grille, rapport, encart de démonstration de l'accueil :

- `libre` → `--nm-app-verdict-free-fg/-bg` (clair : `#0d7a4e` sur `#e8f7ef`)
- `pris` → `--nm-app-verdict-taken-fg/-bg` (clair : `#a33b3b` sur `#fbecec`)
- `à surveiller` → `#8a5a12` sur `#fdf3e3` (valeur corrigée du README, pas `#9a6a12`)
- `non vérifiable` → même paire ambre, libellé **toujours** « non vérifiable »
- `non vérifié` (= non acheté) → paire neutre `--nm-app-badge-bg/-fg` + `pi-lock`

Interdits : aplat vert ou rouge saturé avec texte blanc pour un verdict ; le rond `?` ; l'emoji 🔒 (utiliser `pi-lock`, cf. README § Assets).
Casse : bas de casse partout. Deux états qui ne se confondent jamais : **« non vérifiable » = le registre n'a pas répondu**, **« non vérifié » = vous ne l'avez pas encore acheté**. Ils ne partagent ni couleur ni icône.

Fichiers : `components/results/results-grid.css`, `components/brand-report/brand-report-view.*`, `brand-report-locked.css`, `components/landing/landing.css`.

### 2. Le parcours annoncé sur l'accueil n'est pas le parcours réel

L'encart de démonstration annonce **4 étapes** : `Décrire · Cadrer · Domaines · Rapport`. Le wizard en a **3**, nommées autrement : `Description · Configuration · Domaines`. L'utilisateur qui clique « Trouver mon nom » ne retrouve ni le nombre d'étapes, ni les mots.

**Correction.** Aligner la démonstration sur le wizard réel : trois segments, mêmes libellés exacts que le wizard (`Description`, `Configuration`, `Domaines`). Le rapport n'est pas une étape du wizard — c'est une action depuis une carte : le retirer du fil et le présenter, s'il faut le montrer, comme un volet supplémentaire hors fil. Les libellés viennent des **mêmes clés i18n** que le wizard, pas de chaînes dupliquées dans la landing.

### 3. Quatre verts de bouton primaire, dont un qui échoue au contraste

Relevés : `#3ddc91` (accueil), un vert vif (« Continuer vers la configuration »), un vert plus foncé (« Réserver » du rapport), un vert pâle pour l'état désactivé, plus le vert saturé des badges `Libre`.

**Correction** — un seul jeu, celui du README :

- Fond de bouton primaire **sur surface claire** : `#0d7a4e`, texte blanc, survol `#0a6b44`. (`#0d9a63` avec du texte blanc mesure 3,61:1 : proscrit dès qu'un libellé est posé dessus.)
- Fond de bouton primaire **sur surface sombre** : `#3ddc91`, texte `#062018`, survol `#6ee7a8`.
- Désactivé : **pas** un vert éclairci. Surface `--nm-app-badge-bg`, texte `--nm-app-text-2`, `cursor: not-allowed`. Un bouton désactivé ne doit pas ressembler à un bouton actif décoloré.

Corollaire à appliquer partout : aucune couleur de bouton en dur dans un composant, uniquement les jetons de rôle.

### 4. Le bouton « Reformuler avec l'IA » est en indigo

C'est l'indigo en dur déjà signalé au dernier sync ; il survit sur l'étape 1, à côté du bouton vert. Deux couleurs de marque concurrentes sur la seule ligne d'action de l'écran, et l'indigo attire davantage l'œil que l'action principale.

**Correction.** Bouton **secondaire contouré** : bordure `--nm-app-border-strong`, texte `--nm-app-text`, survol bordure `--nm-app-accent`. L'IA n'est pas une marque à part dans ce produit. Supprimer toute valeur indigo restante de `wizard.css` et des composants.

### 5. Le rapport n'affiche pas ce que la carte a promis

La carte liste `Marque INPI` **et** `Marque EUIPO` et quatre réseaux. Le rapport affiche un seul bloc « Marque déposée » (INPI uniquement, EUIPO absent) et **huit** réseaux (GitHub, Telegram, YouTube, Facebook « bientôt »…).

**Correction.**

- Le rapport comporte les quatre sections du README, dans l'ordre : **Noms de domaine**, **Marques françaises — INPI**, **Marques européennes — EUIPO**, **Réseaux sociaux**. EUIPO ne peut pas manquer : c'est la moitié de la promesse de périmètre.
- **Même liste de réseaux partout : huit plateformes** (décision produit). GitHub, Instagram, LinkedIn, Telegram, TikTok, X, YouTube, Facebook. La carte, la popup de vérification et la landing doivent donc vendre huit réseaux, pas quatre — voir le point 5 bis.
- **Aucune ligne « bientôt » dans un rapport payé** : une plateforme non interrogée dévalue les sept autres. Tant qu'Instagram et Facebook ne sont pas branchés, ils sortent du rapport, de la carte et du décompte annoncé — le rapport en affiche six et l'offre en annonce six. Ils réapparaissent partout le jour où ils répondent.
- Ajouter le pied de rapport manquant : phrase de périmètre (INPI + EUIPO, pas les registres nationaux des autres États membres) et avertissement « recherche d'antériorité automatisée, pas un avis juridique ».
- Ajouter « Actualiser — gratuit » (décision produit déjà prise) et l'horodatage complet : `Généré le 20 août 2026 à 18:22` — la date seule ne suffit pas pour une donnée de registre.

### 5 bis. Huit réseaux sur la carte : la ligne de pastilles doit être repensée

La maquette `Cartes — palier payant.dc.html` supposait quatre plateformes ; à huit, une seule rangée de pastilles déborde d'une carte de 280–380px et devient illisible.

**Correction.** Conserver la ligne unique `Réseaux` (l'alignement entre carte vérifiée et non vérifiée reste la règle), mais :

- pastilles en **grille de 4 colonnes sur deux rangées** à l'intérieur de la cellule de droite, taille 22px, gap 6px — pas de retour à la ligne libre qui déplacerait les lignes suivantes ;
- glyphes officiels monochromes teintés par la couleur du verdict, jamais les logos en couleurs d'origine (le rose Instagram et le cyan TikTok entrent en conflit avec le code libre/pris) ;
- chaque pastille porte aussi un symbole (`✓`, `✗`, `🔒`) : la couleur ne porte jamais l'information seule ;
- `title` = « Instagram — libre », symbole en `aria-hidden` ;
- sur carte non vérifiée : les huit pastilles en paire neutre + cadenas, jamais masquées ni floutées.

Si la grille de 8 s'avère trop dense en dessous de 320px de carte, replier en **une pastille de synthèse « 6/8 libres »** ouvrant le détail au survol et au clic — mais seulement à ce point de rupture, et jamais comme rendu par défaut : le détail par plateforme est l'argument (un B2B regarde LinkedIn, une marque grand public TikTok).

### 6. Les cartes de la grille ne sont pas alignées entre elles

Sur le même écran : la carte 1 a une ligne « Analyse du nom ★★★★☆ », les cartes 2 et 3 ne l'ont pas ; la carte 2 affiche des verdicts de réseaux sans être vérifiée ; la carte 3 est verrouillée. Les lignes ne tombent pas au même niveau, donc les noms ne sont pas comparables — ce qui est **l'objet même** de cet écran.

**Correction** — appliquer la règle d'alignement du README sans exception : toute carte affiche les mêmes lignes, dans le même ordre, quel que soit son état :

```
<extensions demandées, une ligne chacune>
Analyse du nom            ★★★★☆ ▾
Marque INPI               <verdict | 🔒 non vérifié>
Marque EUIPO              <verdict | 🔒 non vérifié>
Réseaux                   <8 pastilles, grille 4×2>
```

Seule la colonne de droite change entre non vérifié et vérifié. Aucune ligne ne se crée ni ne disparaît après l'achat.

### 7. Le badge en haut de carte porte deux informations différentes

`obstacles` (rouge) sur une carte, `1 crédit` (vert) sur une autre, **au même emplacement**. Coût et synthèse de verdict ne peuvent pas partager un slot.

**Correction.**

- Emplacement de gauche, sous le nom : **badge de synthèse**, uniquement sur carte vérifiée — `aucun blocage` / `à surveiller` / `2 obstacles`, paires de verdict.
- Emplacement de droite, dans l'en-tête : **badge de coût** `1 crédit`, toujours présent, accentué seulement si **toutes** les extensions demandées sont libres (règle `.rg-card--strong`).
- `obstacles` sans chiffre n'est pas un libellé : toujours `n obstacle(s)`.

---

## P1 — cohérence de système

### 8. Cinq styles de contrôle segmenté

Sur trois écrans : le sélecteur de thème (pilule pleine), `International / Local / Régional` (cadre gris, onglet blanc), `Au moins une extension / Toutes les extensions` (autre cadre, autre hauteur), `≥5 / ≥6 / ≥7` (boutons carrés), les filtres `Tous / Tout libre / …` (pilules détachées).

**Correction.** Deux composants, pas cinq :

- **Segmenté** (choix exclusif dans un formulaire) : conteneur `--nm-app-surface-alt`, bordure `--nm-app-border`, rayon 10px, hauteur 40px (44px en tactile), segment actif `--nm-app-surface` + texte `--nm-app-text` + ombre légère. Utilisé pour : public cible, mode d'extension, longueur de nom.
- **Filtres en pilules** (filtrage d'une liste) : pilules détachées, rayon 999px, actif = `--nm-app-accent-surface` / `--nm-app-accent` / bordure `--nm-app-accent-border`. Utilisé pour : `Tous / Tout libre / …`, et le sélecteur de thème.

### 9. L'état actif du fil d'étapes change d'un écran à l'autre

Étape 1 : puce blanche, bordure et chiffre verts. Étapes 2 et 3 : puce verte pleine, chiffre blanc. C'est le même composant, dans le même parcours.

**Correction.** Un seul rendu, celui des étapes 2–3 (puce pleine `--nm-app-accent`, chiffre `--nm-app-on-accent`, libellé `--nm-app-accent` en 600). Franchie : puce contourée `--nm-app-accent`, chiffre accent, libellé `--nm-app-text-2`. À venir : bordure `--nm-app-border-strong`, chiffre et libellé `--nm-app-text-2` (jamais `text-3` : le AA échoue, cf. README).

### 10. L'en-tête de projet apparaît, disparaît, et rivalise avec le titre d'étape

`REPRO` en capitales vertes ~40px est présent aux étapes 2 et 3, absent à l'étape 1 (même projet, même URL). Là où il est présent, il est plus gros que le titre de l'écran, et l'accent vert sur un texte non cliquable détourne le sens de la couleur.

**Correction.** En-tête de projet **constant sur les trois étapes**, en `--nm-app-text` et non en accent, casse d'origine (`Repro`, pas `REPRO` — les capitales forcées cassent les noms accentués et les noms courts), taille 24px, au-dessus du fil d'étapes. Le titre d'étape (`Votre projet`, `Configuration`, `Domaines…`) reste la seule hiérarchie 1 de la zone de contenu. L'accent vert reste réservé aux éléments actionnables et aux verdicts.

### 11. Titres en Title Case

`Mes Projets`, `Votre Projet` : capitalisation anglaise. Le reste du produit est en casse française (`Configuration`, `Domaines disponibles`, tous les libellés de la landing).

**Correction.** Casse française partout : `Mes projets`, `Votre projet`. Corriger dans les clés i18n `fr.json`, et vérifier au passage que les langues déjà traduites n'ont pas hérité de la casse anglaise.

### 12. Largeur de contenu variable au sein du même wizard

Étapes 1 et 2 : carte centrée ~880px. Étape 3 : carte ~1400px. La page « saute » entre deux étapes du même parcours.

**Correction.** Un conteneur unique de 1200px (valeur du README) pour tout le wizard. La grille de résultats occupe la largeur du conteneur, les formulaires gardent une colonne de lecture de 720px **à l'intérieur** de ce conteneur. La carte blanche ne change jamais de largeur d'une étape à l'autre.

### 13. Le tiroir des projets

Constats : pas de voile d'assombrissement sur le fond, le tiroir recouvre le logo de l'en-tête, la corbeille rouge est l'élément le plus visible de chaque ligne, cibles < 44px, doublons de noms sans distinction, aucune recherche ni compte.

**Correction.**

- Voile `rgba(11,14,16,.45)` cliquable pour fermer, `Échap` pour fermer, focus piégé dans le tiroir.
- Le tiroir démarre **sous** l'en-tête ou masque l'en-tête entièrement — pas un recouvrement partiel qui coupe le logo.
- La corbeille passe en icône discrète `--nm-app-text-2`, rouge `--nm-app-verdict-taken-fg` **au survol seulement**, cible 44×44, `aria-label` explicite, et confirmation avant suppression (aucune suppression d'un projet en un clic).
- Ligne de projet : nom en `--nm-app-text`, puis date **et** un second niveau qui distingue les homonymes (nombre de noms retenus, ou début de la description). Trois « Bidora » identiques ne sont pas choisissables.
- Chevron `>` supprimé : la ligne entière est le lien.

### 14. Encart « Signalez un bug… » et traitement des liens

Le bloc de signalement est un pavé bordé dont le texte est **entièrement souligné en gras vert** ; les liens du pied de page sont tous soulignés en gris. Deux traitements de lien lourds, et un encart plus visible que l'action principale de l'écran.

**Correction.** Style de lien unique : `--nm-app-accent`, `text-decoration` en survol et au focus uniquement, jamais de gras. Le bloc de signalement devient une ligne discrète sous la carte : texte `--nm-app-text-2` + un seul segment en lien (« Signalez un bug ou proposez une amélioration » / « et gagnez jusqu'à 500 crédits » en texte courant). Pas d'encadré.

### 15. Trois styles pour trois actions de même rang sur les résultats

`Aide-moi à choisir` (bouton encadré + icône ampoule ambre), `Afficher aussi les noms rejetés` (lien + icône entonnoir), `Copier les résultats` (lien + icône). Aucune hiérarchie ne justifie l'écart, et l'ampoule ambre introduit une quatrième couleur d'accent.

**Correction.** Trois boutons **tertiaires** identiques (texte `--nm-app-text-2`, icône PrimeIcons monochrome de même taille, hauteur 40px, survol `--nm-app-surface-alt`), alignés sur une même ligne. Si « Aide-moi à choisir » doit ressortir, il devient secondaire contouré — pas une couleur nouvelle. Supprimer l'ambre décoratif : l'ambre est une couleur de **verdict** dans ce produit.

### 16. Étoiles d'analyse

Rendues « 5 étoiles vides » sur la carte 1 — donc lisibles comme note nulle — et présentes sur une seule carte.

**Correction.** Ligne libellée `Analyse du nom` à gauche, `★★★★☆ ▾` à droite, sur **toutes** les cartes (`—` si l'analyse n'est pas encore calculée, jamais cinq étoiles vides). Étoile pleine `#b45309` sur surface claire, `#f59e0b` sur surface sombre ; étoile vide `--nm-app-text-2`. Le score chiffré (`4/5`) accompagne les étoiles pour les lecteurs d'écran.

---

## P2 — finitions

17. **Sélecteur de thème** — libellé `Auto` à remplacer par `Système` (vocabulaire arrêté au handoff), et vérifier que « Système » est bien l'**absence** de valeur stockée, pas un `light`/`dark` résolu.
18. **Sélecteur de langue** — drapeau seul : à remplacer par le nom de la langue dans sa langue (`Français`, `Deutsch`), cf. README § Multilingue. Et internaliser `flag-icons` s'il reste utilisé ailleurs.
19. **Pastille de crédits** — `⚡ 915` : l'éclair n'a aucun rapport avec la notion de crédit et n'est pas dans le jeu d'icônes. Utiliser une icône PrimeIcons neutre, ou le seul chiffre suivi de « crédits » en écran large.
20. **Champ d'ajout d'extension** — le placeholder `.io .fr net` contient une valeur mal formée ; écrire `.io, .app, .co`. Le bouton `+` carré vert reprend la forme du bouton primaire : le passer en bouton icône secondaire, cohérent avec le `+` des mots-clés.
21. **Zone de saisie de description** — hauteur fixe qui coupe le texte en milieu de ligne et impose un défilement interne, avec poignée de redimensionnement native. Passer en auto-agrandissement (min 5 lignes, max ~16) et supprimer la poignée.
22. **Chips de mots-clés** — zone à défilement imbriqué dans la carte : afficher toutes les chips (la carte défile), croix de suppression portée à 24px de cible dans une ligne de 44px.
23. **Pouces sur les inspirations** — les icônes pouce servent ici d'étiquettes de champ (`aimés` / `à éviter`) alors qu'elles sont des **boutons de notation** sur les cartes. Mettre des libellés texte sur les champs d'inspiration et réserver les pouces à la notation.
24. **Vide sous la carte** — l'étape 1 laisse une grande carte blanche presque vide puis un long fond gris jusqu'au pied de page. Faire remonter le pied de page (`min-height` de la zone de contenu plutôt que carte étirée), ou occuper la carte avec l'aide contextuelle prévue.
25. **Deux sorties dans le rapport** — `← Retour aux noms` et `✕` font la même chose. Garder `← Retour aux noms` seul ; le `✕` n'a de sens que si le rapport est une modale, ce qu'il n'est pas.
26. **Souligné dans un bouton** — `Recherche officielle INPI` a son libellé souligné à l'intérieur d'un bouton plein. Supprimer le soulignement.
27. **Scores du rapport** — `39/100` et `76/100` en deux couleurs ad hoc. Utiliser `--nm-app-text` pour le chiffre et coder l'appréciation par une pastille de verdict sous le libellé, pas par la couleur du chiffre.

---

## Vocabulaire à figer

Le produit emploie aujourd'hui, pour la même chose : « rapport approfondi », « rapport complet », « rapport acheté », « vérification », « recherche officielle INPI ».

Nomenclature arrêtée, à appliquer dans `fr.json` puis à propager :

| Notion | Terme unique |
| --- | --- |
| Achat des trois contrôles depuis une carte | **vérifier** / « Vérifier marque et réseaux » |
| Document consolidé pour un nom | **rapport de marque** |
| Filtre correspondant sur la grille | « Noms vérifiés » (et non « Rapport acheté ») |
| Registre non joignable | **non vérifiable** |
| Contrôle pas encore acheté | **non vérifié** |

Aucun libellé nouveau en texte littéral dans un gabarit : clés i18n uniquement, y compris pour la landing.

---

## Ordre d'exécution suggéré

1. Jetons : vert de bouton primaire `#0d7a4e`, ambre corrigé, pendants clairs des étoiles, jeton de bordure accentuée claire — un commit, aucun écran touché.
2. Composants partagés : verdict, bouton, segmenté/filtre, fil d'étapes, lien. Points 1, 3, 8, 9, 14.
3. Wizard : indigo, en-tête de projet, largeur, tiroir, champs. Points 4, 10, 12, 13, 21–24.
4. Grille : alignement des lignes, badges, actions, étoiles. Points 6, 7, 15, 16.
5. Rapport : EUIPO, réseaux, pied de page, actualisation, sorties. Points 5, 25–27.
6. Landing : fil d'étapes de la démonstration aligné sur le wizard réel. Point 2.
7. i18n : casse française, nomenclature, clés manquantes. Points 11 et § Vocabulaire.

## Périmètre réseaux — tranché

**Huit réseaux** : GitHub, Instagram, LinkedIn, Telegram, TikTok, X, YouTube, Facebook. À propager partout où le nombre est énoncé — pastilles de carte (point 5 bis), popup de vérification, section « 03 — RÉSEAUX » de la landing, mention « 4 plateformes » du rapport (devient « 8 plateformes »), clés i18n. Le README parle encore de quatre plateformes en plusieurs endroits : le corriger dans la même passe.

Seule réserve maintenue : **une plateforme non interrogée ne s'affiche pas**. Instagram et Facebook restent hors rapport et hors décompte annoncé tant qu'ils sont « bientôt ».


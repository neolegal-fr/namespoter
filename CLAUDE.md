# Namespoter

SaaS pour trouver des noms de marque et domaines disponibles à partir d'une description produit, via IA + vérification de disponibilité réelle (RDAP, repli WHOIS).

## Stack

- **Frontend** : Angular 21, PrimeNG 21 (Aura theme), Tailwind CSS 4
- **Backend** : NestJS, TypeORM, MariaDB 10.6
- **Auth** : Keycloak SSO (realm `namorama`, auto-importé depuis `infra/keycloak/realm-export.json`)
- **IA** : OpenAI GPT-3.5 Turbo
- **Infra** : Docker Compose (`infra/docker-compose.yml`), orchestration via `justfile`

## Commandes

- `just start` : lance Docker + API + Web en dev
- `just stop` : arrête tout
- `just build` : compile API + Web
- `just clean` : supprime node_modules, dist, volumes Docker

## Architecture

```
web/src/
├── app/
│   ├── app.ts                  # Composant racine (menubar, routing, dialog crédits)
│   ├── app.config.ts           # Providers Angular (Keycloak, i18n, PrimeNG)
│   ├── app.routes.ts           # Routes (/ et /projects/:id)
│   ├── components/wizard/      # Wizard 3 étapes (Description → Mots-clés → Domaines)
│   └── services/               # domain.ts, project.ts, user.ts
├── styles.css                  # Tailwind + styles globaux
└── index.html
api/src/
├── domain/                     # Recherche domaines, disponibilité (rdap.service.ts + repli whois)
├── projects/                   # CRUD projets
├── users/                      # Crédits, profil
└── common/                     # Guards, DTOs, utilitaires
```

## Conventions importantes

### CSS / Styles
- **PrimeNG écrase les classes Tailwind** dans ses composants (Card, Table, Drawer, Dialog, etc.). Utiliser des **inline styles** pour les propriétés de layout critiques (`display`, `flex-direction`, `align-items`, `justify-content`, `gap`, `text-align`, `margin`, `max-width`).
- Tailwind reste utilisable pour les éléments hors PrimeNG et pour les propriétés décoratives.
- Les hover effects nécessitent des classes CSS dans `styles.css` (pas d'inline styles possibles).

### Angular
- Composants standalone avec **signals** (`signal()`, `.set()`, `.update()`)
- Services utilisent RxJS Observables (convention suffixe `$`)
- i18n : FR/EN via `@ngx-translate`, fichiers dans `web/public/assets/i18n/`
- Auth Keycloak avec bearer token via interceptor HTTP

### Schéma de base de données

`synchronize` est un **opt-in explicite** (`DB_SYNCHRONIZE=true`), pas un défaut. Non
définie, la variable vaut « non » : la production ne synchronise donc jamais.

Le garde ne peut pas reposer sur `NODE_ENV` — il n'est défini nulle part dans ce projet,
donc un test `NODE_ENV !== 'production'` laisserait la synchronisation active en prod,
c'est-à-dire précisément là où elle est dangereuse.

> Conséquence : **un changement d'entité ne se propage plus tout seul en production.**
> Toute colonne ajoutée ou retypée demande un `ALTER` appliqué à la main, ou une
> migration TypeORM. Ne jamais « débloquer » un déploiement en activant
> `DB_SYNCHRONIZE` sur le serveur : la base y porte des comptes et des paiements, et la
> synchronisation supprime ou retype des colonnes sans relecture.

Les scripts SQL à appliquer vivent dans `api/migrations/`, datés, idempotents
(`ADD COLUMN IF NOT EXISTS`), avec la commande d'application et le retour arrière en
en-tête. **Ordre impératif : appliquer le SQL avant de déployer l'image qui en dépend.**

### Rapport approfondi offert mensuel

Chaque compte a droit à **un rapport approfondi gratuit par mois calendaire**,
indépendamment du solde. Le premier rapport du mois ne débite rien ; les suivants coûtent
`BRAND_REPORT_COST`. Non cumulable : un droit non utilisé est perdu à la fin du mois.

- La bascule est **calculée à la lecture** (`UsersService.isFreeReportAvailable`), pas par
  une tâche planifiée — même principe que `lastFreeReset` pour les crédits.
- La consommation se fait **sous verrou pessimiste, dans la transaction** de génération
  (`consumeFreeReport`) : deux requêtes simultanées ne peuvent pas obtenir chacune le
  rapport offert.
- `GET /brand-report/offer?name=` décrit l'offre sans verdict : `deepReport.purchased`,
  `priceCredits`, `freeThisMonth`, `account.credits`. Le front ne devine rien.
- `brand_report_record.costCredits` porte le débit **réel** (0 si offert) : l'historique
  reste juste après un changement de tarif, et `analyze-logs.py rapports` somme les `cost`
  portés par les événements.
- Côté front : confirmation explicite quand 50 crédits partent vraiment, **aucune** quand
  le rapport est offert — la friction n'y a aucune valeur.

### Système de crédits
- 1 suggestion de domaine = 1 crédit
- Crédits initiaux : 100
- Vérification de disponibilité : **RDAP d'abord, WHOIS en repli**

### Disponibilité des domaines

La disponibilité a **trois états** : libre, pris, et **non vérifiable** (`null`). Le troisième n'est pas un raffinement : sans lui, une panne de registre se déguise en verdict — c'est ainsi que `.app` a été déclaré pris pendant des semaines (serveur port 43 retiré), et que `.de`, `.it`, `.ch`, `.nl` ont été déclarés libres alors qu'ils étaient pris (aucun motif reconnu ⇒ ancien repli « libre »).

- **RDAP** (`RdapService`) est la source primaire : le verdict est un code HTTP — **404 = libre, 200 = pris** — au lieu d'un texte à interpréter registre par registre. Serveur découvert via l'annuaire IANA (`data.iana.org/rdap/dns.json`), mis en cache 24 h, rechargement retenté au plus une fois par minute en cas de panne.
- **WHOIS** reste le repli pour les TLD sans serveur RDAP déclaré — les ccTLD n'y sont pas obligés (`.de`, `.it`, `.be`, `.at`, `.io`, `.co`, `.jp`…). `readWhois()` normalise les alignements (espaces, tabulations, points de conduite) avant de chercher les motifs.
- Ce qu'aucune des deux sources ne couvre reste `null` : `.es` (aucun serveur WHOIS), `.ch` (le registre refuse nos requêtes), et ponctuellement `.nl`/`.hu`/`.shop` (quota dépassé). L'interface affiche « ? », et `search_completed` porte un décompte `unresolved` par extension.
- Le mode « toutes les extensions » ne porte que sur celles réellement vérifiées : un registre en panne ne doit pas vider une recherche.

> Ne jamais faire retomber un doute sur `true` ou `false` : « pris » masque des noms libres, « libre » fait payer un crédit pour un domaine inachetable.

## Déploiement en production

Le serveur de prod est accessible via SSH à `192.168.1.95` (user `nicolas`) **depuis le LAN uniquement**.
Depuis l'extérieur : `namorama.com` port `12345`. Un alias `namorama-prod` est défini dans `~/.ssh/config`
et fonctionne dans les deux cas — préférer `ssh namorama-prod` à l'IP en dur.

Les images Docker sont buildées automatiquement par **GitHub Actions** et poussées sur le registry `git.neolegal.fr/neolegal/`.

Le docker-compose de prod est dans `/var/snap/docker/common/namorama/docker-compose.yml`.

### Mettre à jour la prod (après un push sur `main`)

```bash
ssh nicolas@192.168.1.95 "cd /var/snap/docker/common/namorama && docker compose pull api web && docker compose up -d api web"
```

> Attendre que GitHub Actions ait terminé le build avant de lancer cette commande.

### Vérifier l'état des conteneurs

```bash
ssh nicolas@192.168.1.95 "docker compose -f /var/snap/docker/common/namorama/docker-compose.yml ps"
```

## Logs et observabilité

### Principe

Les logs servent à répondre à deux questions : **quelle erreur un utilisateur a-t-il rencontrée ?** et **où s'est-il arrêté ?** Tout ce qui ne sert ni à l'une ni à l'autre est du bruit.

### Format et destination

- Format **NDJSON** : une ligne = un objet JSON (`ts`, `kind`, `level`, `context`, …). Grepable tel quel, analysable avec `scripts/analyze-logs.py`, importable dans n'importe quel outil.
- Trois types (`kind`) : `http` (une par requête), `log` (trace technique ou erreur), `event` (étape de parcours ou fait métier).
- Écriture simultanée sur **stdout** (pour `docker logs`) et dans **`LOG_DIR`** (défaut `/app/logs` en prod, monté depuis l'hôte).
- **Pourquoi le fichier est indispensable** : `docker compose up -d` après un `pull` recrée le conteneur, et le journal `json-file` de Docker vit dans le répertoire du conteneur — il disparaît donc à **chaque déploiement**. Sans `LOG_DIR`, aucun historique ne survit à une mise à jour.
- Rétention : `LOG_RETENTION_DAYS` (défaut 30), purge automatique quotidienne. Rotation Docker configurée en prod (20 Mo × 5 fichiers).

### Règles d'écriture

- Utiliser `AppLoggerService` (module global) : `logger.event('nom_evenement', { … })` pour le métier, `logger.error(...)` pour les erreurs.
- **Ne jamais journaliser de secret** : jeton JWT, mot de passe, clé API, contenu de token. Le niveau `verbose` est volontairement muet, car `nest-keycloak-connect` y recrache le JWT complet à chaque requête — un jeton en clair dans un log est rejouable jusqu'à son expiration.
- Journaliser les **4xx autant que les 5xx** : ce sont les 4xx qui révèlent les blocages vécus (crédits épuisés, validation refusée, session expirée).
- Pas de données personnelles au-delà de l'identifiant Keycloak (`sub`). Jamais d'e-mail ni de description de projet en clair.
- Borner ce qui vient du navigateur (taille, nombre de clés) avant de l'écrire.
- Un log ne doit **jamais** faire échouer une requête : toute écriture est best-effort.

### Nommage des événements

`snake_case`, verbe au passé, préfixé par le domaine : `search_started`, `search_completed`, `search_blocked_no_credits`, `wizard_step_viewed`, `login_required_before_search`, `client_error`. Ajouter un événement quand il répond à une question qu'on se pose vraiment — pas « au cas où ».

### Parcours utilisateur

Deux canaux complémentaires :

- **`POST /events`** (public, anonyme) : appelé systématiquement, sans cookie, avec un identifiant de session éphémère en `sessionStorage`. C'est le seul canal qui mesure ceux qui refusent les cookies — donc ceux qui abandonnent le plus tôt.
- **Google Analytics** : uniquement si consentement (Consent Mode v2), pour les tableaux de bord d'audience.

Côté front, passer par `AnalyticsService.track()`, qui alimente les deux et n'échoue jamais.

### Consulter les logs en prod

Le serveur n'a **pas** `jq`, mais il a python3. Un script d'analyse est fourni et s'envoie par stdin :

```bash
# Tunnel de conversion : volumétrie par étape, taux d'aboutissement, abandons
ssh namorama-prod "python3 - funnel" < scripts/analyze-logs.py

# Erreurs et avertissements, regroupés par fréquence
ssh namorama-prod "python3 - errors" < scripts/analyze-logs.py

# Rapports de marque : demandes, issues, et détail par compte (sub)
ssh namorama-prod "python3 - rapports" < scripts/analyze-logs.py

# Requêtes les plus lentes / codes de statut par route / lignes brutes
ssh namorama-prod "python3 - slow"   < scripts/analyze-logs.py
ssh namorama-prod "python3 - http"   < scripts/analyze-logs.py
ssh namorama-prod "python3 - raw"    < scripts/analyze-logs.py
```

Les fichiers appartiennent à root (écrits par le conteneur) mais sont lisibles par tous : pas besoin de `sudo`, qui échouerait d'ailleurs en SSH non interactif.

> Le `docker-compose.yml` de prod n'est pas versionné dans ce dépôt. Toute modification (volume de logs, rotation) est à reporter à la main sur le serveur, et une sauvegarde datée est créée avant chaque changement.

## Fonctionnalités

- Wizard : Description → Reformulation IA → Mots-clés → Recherche domaines
- Tableau matriciel de disponibilité par extension
- Favoris (coups de cœur) avec tri prioritaire
- Projets : sauvegarde, historique, restauration via drawer
- Persistence état wizard avant redirection login (localStorage)
- Accès hybride : public pour le test, connexion requise pour les résultats
- Rapport de marque complet (domaines + réseaux + INPI), facturé `BRAND_REPORT_COST` crédits

### Suivi des rapports de marque

Deux sources, volontairement distinctes — elles ne mesurent pas la même chose :

- **Logs** (`python3 - rapports`) : toutes les **demandes**, y compris celles qui n'ont produit aucun rapport. `brand_report_requested` est émis avant tout traitement, puis exactement une issue : `brand_report_generated`, `brand_report_cache_hit`, `brand_report_blocked_no_credits` ou `brand_report_failed`. Détail par `sub`, crédits débités sommés depuis le `cost` porté par chaque événement — donc juste même après un changement de tarif.
- **Admin de l'app** : les rapports **produits**, lus en base (`brand_report_record`). KPI période + total, et une colonne « Rapports » par utilisateur. Un compte supprimé ne compte plus (jointure sur le `sub`).

> L'admin affichera toujours un chiffre ≤ celui des logs : un rapport bloqué faute de crédits est une demande, pas un rapport.

# Namespoter

SaaS pour trouver des noms de marque et domaines disponibles à partir d'une description produit, via IA + vérification Whois réelle.

## Stack

- **Frontend** : Angular 21, PrimeNG 21 (Aura theme), Tailwind CSS 4
- **Backend** : NestJS, TypeORM, PostgreSQL
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
├── domain/                     # Recherche domaines, vérification Whois
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

### Système de crédits
- 1 suggestion de domaine = 1 crédit
- Crédits initiaux : 100
- Vérification Whois via commande système `whois` (Linux)

## Déploiement en production

Le serveur de prod est accessible via SSH à `192.168.1.95` (user `nicolas`).

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
ssh nicolas@192.168.1.95 "sudo python3 - funnel" < scripts/analyze-logs.py

# Erreurs et avertissements, regroupés par fréquence
ssh nicolas@192.168.1.95 "sudo python3 - errors" < scripts/analyze-logs.py

# Requêtes les plus lentes / codes de statut par route / lignes brutes
ssh nicolas@192.168.1.95 "sudo python3 - slow"   < scripts/analyze-logs.py
ssh nicolas@192.168.1.95 "sudo python3 - http"   < scripts/analyze-logs.py
ssh nicolas@192.168.1.95 "sudo python3 - raw"    < scripts/analyze-logs.py
```

Les fichiers sont écrits par le conteneur (qui tourne en root), d'où le `sudo`.

> Le `docker-compose.yml` de prod n'est pas versionné dans ce dépôt. Toute modification (volume de logs, rotation) est à reporter à la main sur le serveur, et une sauvegarde datée est créée avant chaque changement.

## Fonctionnalités

- Wizard : Description → Reformulation IA → Mots-clés → Recherche domaines
- Tableau matriciel de disponibilité par extension
- Favoris (coups de cœur) avec tri prioritaire
- Projets : sauvegarde, historique, restauration via drawer
- Persistence état wizard avant redirection login (localStorage)
- Accès hybride : public pour le test, connexion requise pour les résultats

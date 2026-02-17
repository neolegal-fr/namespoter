# Namespoter - Mémoire du Projet

## Vision
Namespoter est un outil SaaS permettant de trouver des noms de marque et des domaines disponibles (.com, .net, .fr, etc.) à partir d'une simple description de produit, en utilisant l'IA pour la sémantique et des outils système pour la vérification de disponibilité réelle.

## Stack Technologique
- **Frontend** : Angular 21, PrimeNG 21 (Aura theme), Tailwind CSS 4.
- **Backend** : NestJS (Node.js), TypeORM.
- **Base de données** : PostgreSQL.
- **Authentification** : Keycloak (SSO).
- **IA** : OpenAI (GPT-3.5 Turbo) pour la reformulation et le naming.
- **Infrastructure** : Docker Compose (Postgres + Keycloak).
- **Orchestration** : Justfile.

## Fonctionnalités Implémentées
- [x] Wizard étape par étape (Description -> Mots-clés -> Domaines).
- [x] Reformulation de description par l'IA.
- [x] Génération de 20+ mots-clés sémantiques.
- [x] Sélection manuelle d'extensions multiples (.com, .net, .fr, .io, etc.).
- [x] Vérification Whois système (avec gestion des timeouts et batching).
- [x] Système de crédits utilisateur (1 domaine suggéré = 1 crédit).
- [x] Gestion de projets (sauvegarde, historique, restauration).
- [x] Coups de cœur (favoris) avec tri prioritaire.
- [x] Internationalisation (FR/EN) avec détection auto de la langue.
- [x] Accès hybride (Public pour le test, Connexion requise pour les résultats).

## User Stories Implémentées
1. **Naming Marketing** : L'IA utilise des techniques de naming expertes (Portmanteaux, évocateurs, etc.).
2. **Persistence Just-in-Time** : Sauvegarde automatique de l'état du Wizard avant redirection login.
3. **Tableau Comparatif** : Affichage matriciel des disponibilités par extension.
4. **Highlights Visuels** : Surlignage vert pour les domaines dont toutes les extensions sont libres.

## User Stories en Attente (Backlog)
1. **Modèle Freemium** : Rechargement mensuel automatique de 100 crédits gratuits.
2. **Packs de Crédits** : Achat ponctuel de 1000 crédits pour 10€ via Stripe.
3. **Abonnement PRO** : Abonnement 5€/mois pour 1000 crédits/mois via Stripe.
4. **Intégration Stripe Webhooks** : Automatisation du crédit après paiement.

## Notes Techniques Importantes
- **Z-Index** : Le bouton "Mes projets" a un z-index de 9999 pour contrer les masques fantômes de PrimeNG.
- **Whois** : Utilise la commande `whois` système (Linux).
- **Keycloak** : Le realm `namespoter` est importé automatiquement via `infra/keycloak/realm-export.json`.

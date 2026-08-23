-- Comptes internes : les vôtres, ceux des démonstrations, ceux des tests.
--
-- Pourquoi un drapeau explicite plutôt qu'une règle : RIEN ne les distingue.
-- Relevé sur les 47 comptes de production — aucun alias `+`, et 28 des 47 sont
-- chez gmail.com, comptes de test compris. Aucun motif d'adresse ne peut les
-- reconnaître, et une liste d'adresses en dur dans le code vieillirait mal.
--
-- `isAdmin` ne suffisait pas : il ne couvre qu'un compte, celui qui porte le
-- rôle realm. Un compte de test sans rôle admin gonflait donc tous les
-- agrégats — inscriptions, projets, suggestions, crédits.
--
-- NOT NULL DEFAULT 0 : un compte n'est interne que si on l'a dit. Le défaut
-- « mesuré » est le bon — oublier de cocher fausse les chiffres à la hausse,
-- ce qui se voit ; cocher par défaut les viderait en silence.
--
-- Appliquer AVANT de déployer l'image qui en dépend :
--   mysql -u<user> -p<pass> namorama < 2026-08-23-comptes-internes.sql
--
-- Retour arrière :
--   ALTER TABLE user DROP COLUMN isInternal;

ALTER TABLE user
  ADD COLUMN IF NOT EXISTS isInternal TINYINT(1) NOT NULL DEFAULT 0;

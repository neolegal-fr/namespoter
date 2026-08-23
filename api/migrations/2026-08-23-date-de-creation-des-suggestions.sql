-- Date de création d'une suggestion de domaine.
--
-- Pourquoi : le tableau de bord compte les suggestions — donc les crédits
-- consommés — par semaine. Faute de date propre, l'agrégat les rattachait à
-- `project.createdAt`, la date du PROJET. Or `addSuggestion()` en ajoute à des
-- projets anciens : une recherche relancée aujourd'hui sur un projet de mars
-- était comptée en mars, et la semaine en cours paraissait vide.
--
-- Nullable, sans reprise de l'existant : les suggestions antérieures à cette
-- colonne n'ont pas de date de création, et leur attribuer celle du projet
-- reviendrait à graver l'approximation dans la base. Les agrégats font le
-- repli explicitement (`COALESCE(ds.createdAt, p.createdAt)`), ce qui les rend
-- de plus en plus justes à mesure que les lignes datées remplacent les autres.
--
-- Appliquer AVANT de déployer l'image qui en dépend :
--   mysql -u<user> -p<pass> namorama < 2026-08-23-date-de-creation-des-suggestions.sql
--
-- Retour arrière :
--   ALTER TABLE domain_suggestion DROP COLUMN createdAt;

ALTER TABLE domain_suggestion
  ADD COLUMN IF NOT EXISTS createdAt DATETIME NULL;

-- Les agrégats hebdomadaires balaient six mois en groupant sur cette date.
CREATE INDEX IF NOT EXISTS idx_domain_suggestion_createdAt
  ON domain_suggestion (createdAt);

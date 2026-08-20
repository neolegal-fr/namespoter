-- Date du dernier contrôle de disponibilité, par suggestion.
--
-- Pourquoi : les registres bougent. Un nom libre hier peut être déposé
-- aujourd'hui, et la carte présentait son verdict comme intemporel. Elle
-- annonce désormais depuis quand il tient, et propose de le réactualiser.
--
-- Nullable à dessein : les suggestions antérieures à cette colonne n'ont pas de
-- date, et leur en inventer une leur donnerait une fraîcheur qu'elles n'ont
-- pas. L'interface affiche alors « date inconnue » plutôt qu'une date fausse.
--
-- Appliquer AVANT de déployer l'image qui en dépend :
--   mysql -u<user> -p<pass> namorama < 2026-08-20-date-de-controle-des-domaines.sql
--
-- Retour arrière :
--   ALTER TABLE domain_suggestion DROP COLUMN checkedAt;

ALTER TABLE domain_suggestion
  ADD COLUMN IF NOT EXISTS checkedAt DATETIME NULL;

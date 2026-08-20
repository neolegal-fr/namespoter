-- Coût réellement débité par rapport de marque.
--
-- À appliquer À LA MAIN en production AVANT de déployer l'image qui en dépend :
-- depuis la PR #58, `synchronize` est désarmé en prod, et cette colonne ne se
-- créera plus toute seule au démarrage.
--
-- Pourquoi la colonne : le tarif peut changer, et une actualisation de rapport
-- ne redébite rien. Multiplier un nombre de rapports par le tarif COURANT
-- donnerait donc un total faux. Le débit réel est mémorisé sur chaque
-- enregistrement, une fois pour toutes.
--
-- Nullable : les rapports antérieurs à la colonne n'ont pas gardé leur coût.
-- L'affichage retient alors le tarif courant, faute de mieux, et le dit.
--
-- Cette migration portait aussi `user.freeReportPeriod` et
-- `user.freeReportUsedAt`, pour le rapport offert mensuel. Cette
-- fonctionnalité a été retirée le 20/08/2026 avant tout déploiement : les deux
-- colonnes n'ont jamais existé en production, elles sont donc simplement
-- retirées d'ici plutôt que supprimées par un ALTER.
--
-- Application :
--   mysql -u<user> -p<pass> namorama < 2026-08-19-cout-reel-des-rapports.sql
--
-- Retour arrière :
--   ALTER TABLE brand_report_record DROP COLUMN costCredits;

ALTER TABLE `brand_report_record`
  ADD COLUMN IF NOT EXISTS `costCredits` INT NULL;

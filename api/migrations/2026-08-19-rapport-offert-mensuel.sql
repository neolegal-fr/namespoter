-- Rapport approfondi offert mensuel — étape 9 de la refonte.
--
-- À appliquer À LA MAIN en production AVANT de déployer l'image qui porte ce
-- changement : depuis la PR #58, `synchronize` est désarmé en prod, et ces
-- colonnes ne se créeront plus toutes seules au démarrage. Sans elles, la
-- première requête GET /brand-report/offer échoue sur « colonne inconnue ».
--
-- Idempotent : `ADD COLUMN IF NOT EXISTS` est supporté par MariaDB 10.6.
-- Sans effet sur les lignes existantes : tout est nullable, aucune valeur
-- par défaut à recalculer. Un compte existant est donc éligible au rapport
-- offert dès le mois courant (freeReportPeriod NULL ⇒ disponible), ce qui
-- est le comportement voulu.
--
-- Application :
--   ssh nicolas@192.168.1.95 'cd /var/snap/docker/common/namorama \
--     && set -a && . ./.env && set +a \
--     && mysql -h 192.168.1.95 -u "$MARIADB_USER" -p"$MARIADB_PASSWORD" namorama' \
--     < api/migrations/2026-08-19-rapport-offert-mensuel.sql
--
-- Retour arrière, si besoin :
--   ALTER TABLE `user` DROP COLUMN freeReportPeriod, DROP COLUMN freeReportUsedAt;
--   ALTER TABLE brand_report_record DROP COLUMN costCredits;

ALTER TABLE `user`
  ADD COLUMN IF NOT EXISTS `freeReportPeriod` VARCHAR(7) NULL,
  ADD COLUMN IF NOT EXISTS `freeReportUsedAt` DATETIME NULL;

ALTER TABLE `brand_report_record`
  ADD COLUMN IF NOT EXISTS `costCredits` INT NULL;

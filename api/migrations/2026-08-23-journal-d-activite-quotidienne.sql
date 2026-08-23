-- Journal d'activité : un compte, un jour où il s'est servi du produit.
--
-- Pourquoi : `user.lastLogin` est un scalaire ÉCRASÉ à chaque passage. Il ne
-- retient que la dernière fois, si bien qu'un compte actif en semaine 33 ET en
-- semaine 34 n'apparaît qu'en semaine 34. « Comptes actifs » est donc juste
-- pour une fenêtre qui se termine maintenant — et faux pour toute autre :
-- période précédente, semaine passée, plage personnalisée. Le tableau de bord
-- comparait deux périodes avec une mesure qui sous-estime systématiquement la
-- plus ancienne, c'est-à-dire qui flatte toujours la plus récente.
--
-- Une ligne par (compte, jour), écrite au premier appel authentifié de la
-- journée. À 47 comptes, c'est au pire quelques dizaines de lignes par jour.
--
-- L'HISTORIQUE COMMENCE AU DÉPLOIEMENT : les mois passés ne sont pas
-- reconstituables. Les semaines antérieures sont rendues « non mesurées »
-- (trou dans la courbe), jamais zéro — un zéro se lirait « personne ne s'en
-- est servi en mars ».
--
-- `ON DELETE CASCADE` : la suppression d'un compte emporte son journal, comme
-- pour ses projets.
--
-- Appliquer AVANT de déployer l'image qui en dépend :
--   mysql -u<user> -p<pass> namorama < 2026-08-23-journal-d-activite-quotidienne.sql
--
-- Retour arrière :
--   DROP TABLE user_activity_day;

CREATE TABLE IF NOT EXISTS user_activity_day (
  userId INT NOT NULL,
  day    DATE NOT NULL,
  PRIMARY KEY (userId, day),
  CONSTRAINT fk_user_activity_day_user
    FOREIGN KEY (userId) REFERENCES user (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- La clé primaire commence par `userId` : elle ne sert pas un balayage par
-- date, qui est la lecture du tableau de bord.
CREATE INDEX IF NOT EXISTS idx_user_activity_day_day
  ON user_activity_day (day);

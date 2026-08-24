-- Journal des visites : le dénominateur qui manquait au tableau de bord.
--
-- Le produit savait compter ses comptes, ses projets et ses rapports. Il ne
-- savait pas sur COMBIEN DE VISITEURS, faute d'une seule mesure du trafic :
--
--   * Google Analytics est conditionné au consentement (Consent Mode par
--     défaut « denied ») : il ne voit pas ceux qui repartent tout de suite,
--     c'est-à-dire précisément la population qu'un entonnoir mesure ;
--   * les logs NDJSON tournent sur 30 jours, et AUCUN événement n'était émis
--     au simple affichage d'une page — un visiteur qui lisait et s'en allait
--     ne laissait aucune trace ;
--   * les journaux nginx de l'hôte tournent sur 14 jours et ne distinguaient
--     pas les vhosts.
--
-- Une ligne par session de navigateur (`sessionStorage`, éphémère, sans
-- cookie), créée au premier affichage et complétée au fil des étapes. Des
-- DRAPEAUX, pas des compteurs : la question est « cette visite a-t-elle lancé
-- une recherche », pas « combien de fois » — compter les répétitions ferait
-- dire au taux de conversion ce qu'il ne dit pas.
--
-- `loggedInAtStart` mérite sa colonne : sans elle, le taux « visiteur →
-- inscription » serait dilué par ceux qui avaient déjà un compte et ne
-- pouvaient donc pas en créer un.
--
-- `keycloakId` ne sert qu'à ÉCARTER les visites des comptes admin et internes,
-- comme le fait déjà chaque agrégat. Il est renseigné par un appel authentifié
-- (le `sub` du jeton), jamais par une valeur déclarée par le navigateur.
--
-- Rien de rétroactif : les visites d'avant cette table n'existent nulle part.
-- L'interface affiche « mesuré depuis le … » plutôt qu'un zéro trompeur.
--
-- Appliquer AVANT de déployer l'image qui en dépend :
--   mysql -u<user> -p<pass> namorama < 2026-08-24-journal-des-visites.sql
--
-- Retour arrière :
--   DROP TABLE visitor_session;

-- ⚠ LA COLLATION DE `keycloakId` DOIT SUIVRE CELLE DE `user.keycloakId`.
--
-- Les agrégats joignent les deux (`LEFT JOIN user u ON u.keycloakId =
-- v.keycloakId`), et MariaDB REFUSE de comparer deux collations différentes :
-- « Illegal mix of collations … for operation '=' ». La requête ne renvoie pas
-- un résultat faux, elle échoue — le tableau de bord entier retourne 500.
--
-- Le piège est qu'il ne se voit pas en développement. `DEFAULT CHARSET=utf8mb4`
-- sans `COLLATE` prend la collation de la BASE quand le jeu de caractères est
-- le même : `utf8mb4_unicode_ci` en local (base créée par `synchronize`),
-- `utf8mb4_general_ci` en production. Même script, deux résultats, et l'erreur
-- n'apparaît que là où elle coûte.
--
-- D'où l'alignement DYNAMIQUE plus bas, plutôt qu'une collation écrite en dur :
-- la règle est « la même que `user` », quelle qu'elle soit ici.

CREATE TABLE IF NOT EXISTS visitor_session (
  sessionId       VARCHAR(64)  NOT NULL,
  firstSeenAt     DATETIME     NOT NULL,
  loggedInAtStart TINYINT(1)   NOT NULL DEFAULT 0,
  searched        TINYINT(1)   NOT NULL DEFAULT 0,
  accountCreated  TINYINT(1)   NOT NULL DEFAULT 0,
  reportRequested TINYINT(1)   NOT NULL DEFAULT 0,
  keycloakId      VARCHAR(64)  NULL,
  PRIMARY KEY (sessionId),
  -- Tous les agrégats filtrent sur la fenêtre de temps, et seulement sur elle.
  INDEX IDX_visitor_session_firstSeenAt (firstSeenAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Aligne `keycloakId` sur la colonne à laquelle il est joint. Sans effet si
-- c'est déjà le cas : ce fichier reste rejouable, et l'est d'ailleurs sur toute
-- base créée avant cet ajout.
SET @collation := (
  SELECT COLLATION_NAME FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user' AND COLUMN_NAME = 'keycloakId'
);
SET @sql := CONCAT(
  'ALTER TABLE visitor_session MODIFY keycloakId VARCHAR(64) CHARACTER SET utf8mb4 COLLATE ',
  @collation, ' NULL'
);
PREPARE aligner FROM @sql;
EXECUTE aligner;
DEALLOCATE PREPARE aligner;

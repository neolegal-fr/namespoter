-- Partage d'un projet avec une autre personne, par adresse e-mail.
--
-- À appliquer À LA MAIN en production AVANT de déployer l'image qui en dépend :
-- `synchronize` est désarmé en prod, cette table ne se créera pas au démarrage.
--
--   mysql -u<user> -p<pass> namorama < 2026-08-21-partage-de-projet.sql
--
-- Retour arrière :
--   DROP TABLE IF EXISTS project_share;
--
-- La cible est une ADRESSE, pas un compte : on partage avec quelqu'un qui n'a
-- pas encore de compte, et le rapprochement se fait ensuite par l'e-mail — qui
-- est aussi l'identifiant de connexion du realm.
--
-- `ON DELETE CASCADE` sur le projet : un projet supprimé emporte ses partages,
-- sans quoi une ligne survivante donnerait accès à un identifiant réattribué.

CREATE TABLE IF NOT EXISTS project_share (
  id            VARCHAR(36)  NOT NULL PRIMARY KEY,
  projectId     VARCHAR(36)  NOT NULL,
  email         VARCHAR(255) NOT NULL,
  permission    VARCHAR(16)  NOT NULL DEFAULT 'read',
  message       TEXT         NULL,
  invitedBySub  VARCHAR(255) NOT NULL,
  createdAt     DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  acceptedAt    DATETIME     NULL,
  CONSTRAINT fk_project_share_project FOREIGN KEY (projectId)
    REFERENCES project (id) ON DELETE CASCADE,
  CONSTRAINT uq_project_share UNIQUE (projectId, email),
  INDEX idx_project_share_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- `COLLATE` explicite, et non le défaut du serveur : une clé étrangère exige
-- que les DEUX colonnes partagent la même collation. `project.id` est en
-- `utf8mb4_unicode_ci` (posée par TypeORM à la création) ; sans cette ligne,
-- MariaDB 11 crée `projectId` avec sa collation par défaut et refuse la
-- contrainte — « errno: 150, Foreign key constraint is incorrectly formed »,
-- rencontré tel quel en production.

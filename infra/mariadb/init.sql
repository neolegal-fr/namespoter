CREATE DATABASE IF NOT EXISTS namorama CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS keycloak CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

GRANT ALL ON namorama.* TO 'admin'@'%';
GRANT ALL ON keycloak.* TO 'admin'@'%';

FLUSH PRIVILEGES;

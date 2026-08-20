# Justfile pour Namorama

# Démarrer l'infrastructure et les serveurs de développement
start:
    docker-compose -f infra/docker-compose.yml up -d
    @echo "Attente du démarrage des bases de données..."
    sleep 5
    (cd api && npm run start:dev) & (cd web && npm start)

# Arrêter tous les services (Docker et processus Node)
# Le motif [n] évite que pkill ne se tue lui-même : sa propre ligne de commande
# contient « [n]est »/« [n]g serve », qui ne correspond pas au motif « nest »/« ng serve ».
stop:
    docker-compose -f infra/docker-compose.yml stop
    @bash -c 'pkill -f "[n]est" 2>/dev/null; pkill -f "[n]g serve" 2>/dev/null; true'

# Redémarrer l'écosystème
restart: stop start

# Compiler les applications pour la production
build:
    @echo "Compilation de l'API (NestJS)..."
    cd api && npm run build
    @echo "Compilation du Web (Angular)..."
    cd web && npm run build

# Installer les dépendances Node (legacy-peer-deps requis pour nest-keycloak-connect)
install:
    cd api && npm install --legacy-peer-deps
    cd web && npm install

# Nettoyer les dépendances, les builds et les volumes Docker
clean:
    docker-compose -f infra/docker-compose.yml down -v
    rm -rf api/node_modules api/dist web/node_modules web/dist web/.angular
    @echo "Nettoyage terminé."

# ─── Développement sous WSL ────────────────────────────────────────────────
#
# Le navigateur tourne sous Windows, l'API dans la distribution : `localhost`
# n'y désigne pas la même machine, et `web/public/assets/config.json` doit
# porter l'IP de la distribution pour que le front joigne l'API.
#
# Cette IP ne doit PAS être versionnée — elle change à chaque redémarrage de
# WSL et ne vaut que pour ce poste. `--skip-worktree` retire donc le fichier
# du diff tant que l'adresse locale est posée : plus de modification à écarter
# à chaque commit, et plus d'IP privée partie en production par mégarde.
dev-api-url:
    @bash -c 'ip=$(hostname -I | awk "{print \$1}"); \
      git update-index --no-skip-worktree web/public/assets/config.json 2>/dev/null || true; \
      printf "{\n  \"apiUrl\": \"http://%s:3001\",\n  \"keycloakUrl\": \"http://localhost:8080\"\n}\n" "$ip" > web/public/assets/config.json; \
      git update-index --skip-worktree web/public/assets/config.json; \
      echo "config.json → http://$ip:3001 (masqué du suivi Git)"'

# Revenir à l'état versionné et réarmer le suivi du fichier.
dev-api-url-reset:
    @bash -c 'git update-index --no-skip-worktree web/public/assets/config.json 2>/dev/null || true; \
      git checkout -- web/public/assets/config.json; \
      echo "config.json → localhost:3001 (suivi Git réarmé)"'

#!/usr/bin/env bash
#
# Ajoute le nom d'hôte au journal d'accès nginx de l'HÔTE (pas du conteneur).
#
# Pourquoi : ce serveur sert vingt-trois vhosts dans UN seul access.log, au
# format `combined`, qui ne contient pas `$host`. Impossible, donc, de dire si
# un « GET / » visait namorama.com ou l'un des autres — la seule attribution
# possible passait par des chemins d'actifs propres à l'application, ce qui
# n'est ni robuste ni durable.
#
# Le nom d'hôte est ajouté EN FIN de ligne, pas au début : les positions des
# champs existants restent inchangées, et tout ce qui lit déjà ce fichier
# continue de fonctionner.
#
# Idempotent : relancer ne fait rien de plus. Une sauvegarde datée est créée
# avant toute modification.
#
# À exécuter sur le serveur, en root :
#     ssh namorama-prod
#     sudo bash journaliser-le-vhost.sh
#
# Retour arrière : restaurer la sauvegarde annoncée par le script, puis
#     nginx -t && systemctl reload nginx

set -euo pipefail

CONF=/etc/nginx/nginx.conf

if grep -q 'log_format vhost' "$CONF"; then
  echo "Déjà en place : rien à faire."
  exit 0
fi

SAUVEGARDE="${CONF}.bak-$(date +%Y-%m-%d-%H%M%S)"
cp -a "$CONF" "$SAUVEGARDE"
echo "Sauvegarde : $SAUVEGARDE"

python3 - "$CONF" <<'PY'
import sys, pathlib

conf = pathlib.Path(sys.argv[1])
texte = conf.read_text()

ancien = "\taccess_log /var/log/nginx/access.log;"
nouveau = (
    "\t# `combined` + le nom d'hôte, ajouté EN FIN de ligne pour ne déplacer\n"
    "\t# aucun champ existant. Sans lui, les vingt-trois vhosts de ce serveur\n"
    "\t# se mélangent dans un seul fichier sans moyen de les distinguer.\n"
    "\tlog_format vhost '$remote_addr - $remote_user [$time_local] \"$request\" '\n"
    "\t                 '$status $body_bytes_sent \"$http_referer\" '\n"
    "\t                 '\"$http_user_agent\" \"$host\"';\n"
    "\n"
    "\taccess_log /var/log/nginx/access.log vhost;"
)

if ancien not in texte:
    sys.exit("Ligne `access_log` attendue introuvable : modifier à la main.")

conf.write_text(texte.replace(ancien, nouveau, 1))
PY

nginx -t
systemctl reload nginx
echo "Fait. Les nouvelles lignes portent le vhost en dernier champ."

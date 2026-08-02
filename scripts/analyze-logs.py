#!/usr/bin/env python3
"""
Analyse des logs NDJSON de production.

Conçu pour être exécuté sur le serveur, qui n'a pas `jq` mais bien python3 :

    ssh nicolas@192.168.1.95 "sudo python3 - errors" < scripts/analyze-logs.py
    ssh nicolas@192.168.1.95 "sudo python3 - funnel" < scripts/analyze-logs.py
    ssh nicolas@192.168.1.95 "sudo python3 - slow" < scripts/analyze-logs.py

Modes :
  errors  — erreurs et avertissements, les plus fréquents d'abord
  funnel  — tunnel de conversion : volumétrie par événement et taux de chute
  slow    — requêtes les plus lentes
  http    — répartition des codes de statut par route
  raw     — dernières lignes, brutes
"""
import json
import sys
from collections import Counter, defaultdict
from glob import glob

LOG_GLOB = "/var/snap/docker/common/namorama/logs/api/app-*.ndjson"

# Ordre du tunnel : chaque étape suppose la précédente franchie.
FUNNEL = [
    ("wizard_step_viewed", "Étape du wizard vue"),
    ("login_required_before_search", "Redirigé vers la connexion"),
    ("search_blocked_validation", "Refusé avant départ : saisie invalide"),
    ("search_started", "Recherche lancée"),
    ("search_completed", "Recherche terminée"),
    ("search_blocked_no_credits", "Bloqué : crédits épuisés"),
    ("search_cancelled_by_user", "Recherche interrompue"),
    ("search_failed", "Recherche en échec"),
    ("no_result_relax_clicked", "A assoupli la longueur"),
    ("client_error", "Erreur JavaScript subie"),
]


def load(pattern=LOG_GLOB):
    rows = []
    for path in sorted(glob(pattern)):
        with open(path, encoding="utf-8", errors="replace") as fh:
            for line in fh:
                line = line.strip()
                if not line:
                    continue
                try:
                    rows.append(json.loads(line))
                except json.JSONDecodeError:
                    continue  # ligne tronquée par une rotation : sans importance
    return rows


def errors(rows):
    bad = [r for r in rows if r.get("level") in ("error", "warn")]
    print(f"{len(bad)} erreurs / avertissements\n")
    grouped = Counter(
        (r.get("context"), str(r.get("message"))[:110], r.get("status")) for r in bad
    )
    for (ctx, msg, status), n in grouped.most_common(25):
        print(f"  {n:5}×  [{ctx}] {status or ''} {msg}")


def funnel(rows):
    events = Counter(r.get("context") for r in rows if r.get("kind") == "event")
    print("Volumétrie des étapes\n")
    for name, label in FUNNEL:
        print(f"  {events.get(name, 0):6}  {label}  ({name})")

    autres = {k: v for k, v in events.items() if k not in dict(FUNNEL)}
    if autres:
        print("\n  Autres événements :")
        for k, v in sorted(autres.items(), key=lambda kv: -kv[1]):
            print(f"  {v:6}  {k}")

    started = events.get("search_started", 0)
    completed = events.get("search_completed", 0)
    blocked = events.get("search_blocked_validation", 0)
    # Le dénominateur compte les tentatives, pas les départs : une recherche
    # refusée par la validation n'atteint jamais le contrôleur, donc n'émet
    # aucun `search_started`. L'ignorer afficherait 100 % de réussite sur un
    # parcours où l'utilisateur s'est heurté à un mur.
    tentatives = started + blocked
    if tentatives:
        print(f"\n  Recherches abouties : {completed}/{tentatives} ({100*completed/tentatives:.0f} %)")
    if blocked:
        print(f"  Refusées avant même de démarrer : {blocked}/{tentatives} ({100*blocked/tentatives:.0f} %)")
        motifs = Counter(
            str(r.get("reason"))[:70]
            for r in rows if r.get("context") == "search_blocked_validation"
        )
        for motif, n in motifs.most_common(5):
            print(f"      {n:4}×  {motif}")

    vides = sum(1 for r in rows if r.get("context") == "search_completed" and r.get("emptyResult"))
    if completed:
        print(f"  Recherches sans aucun résultat : {vides}/{completed} ({100*vides/completed:.0f} %)")

    # Sessions ayant vu une étape mais n'ayant jamais lancé de recherche.
    vues, lancees = set(), set()
    for r in rows:
        sid = r.get("sessionId")
        if not sid:
            continue
        if r.get("context") == "wizard_step_viewed":
            vues.add(sid)
        if r.get("context") in ("search_started", "login_required_before_search"):
            lancees.add(sid)
    if vues:
        perdus = len(vues - lancees)
        print(f"  Sessions entrées dans le wizard sans aller jusqu'à la recherche : "
              f"{perdus}/{len(vues)} ({100*perdus/len(vues):.0f} %)")


def slow(rows):
    http = [r for r in rows if r.get("kind") == "http" and isinstance(r.get("durationMs"), int)]
    http.sort(key=lambda r: -r["durationMs"])
    print("Requêtes les plus lentes\n")
    for r in http[:25]:
        print(f"  {r['durationMs']:7} ms  {r['method']:5} {r.get('path')}  → {r.get('status')}")


def http(rows):
    by_route = defaultdict(Counter)
    for r in rows:
        if r.get("kind") == "http":
            by_route[f"{r['method']} {r.get('path')}"][r.get("status")] += 1
    print("Codes de statut par route\n")
    for route, statuses in sorted(by_route.items(), key=lambda kv: -sum(kv[1].values())):
        detail = "  ".join(f"{s}:{n}" for s, n in sorted(statuses.items(), key=lambda kv: str(kv[0])))
        print(f"  {sum(statuses.values()):6}  {route:42} {detail}")


def raw(rows):
    for r in rows[-30:]:
        print(json.dumps(r, ensure_ascii=False)[:220])


MODES = {"errors": errors, "funnel": funnel, "slow": slow, "http": http, "raw": raw}

if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else "funnel"
    if mode not in MODES:
        print(f"Mode inconnu. Disponibles : {', '.join(MODES)}")
        sys.exit(1)
    data = load()
    if not data:
        print(f"Aucun log trouvé dans {LOG_GLOB}")
        sys.exit(0)
    print(f"— {len(data)} lignes analysées —\n")
    MODES[mode](data)

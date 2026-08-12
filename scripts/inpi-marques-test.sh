#!/usr/bin/env bash
#
# Spike US-050/US-051 — test d'authentification et de recherche sur l'API PI
# « diffusion » de l'INPI (base Marques).
#
# Les identifiants sont ceux du COMPTE TECHNIQUE généré à l'activation de
# « Accès API PI » sur data.inpi.fr → « Mes accès API / SFTP » — PAS le login
# du portail. Ils sont lus depuis l'environnement pour ne jamais être commités.
#
# Usage :
#   INPI_USERNAME='email-technique@…' INPI_PASSWORD='…' ./scripts/inpi-marques-test.sh [terme]
#
set -euo pipefail

BASE="https://api-gateway.inpi.fr"
TERM="${1:-qonto}"
JAR="$(mktemp)"
trap 'rm -f "$JAR"' EXIT

: "${INPI_USERNAME:?Définir INPI_USERNAME (email du compte technique PI)}"
: "${INPI_PASSWORD:?Définir INPI_PASSWORD (mot de passe du compte technique PI)}"

echo "1) Récupération du cookie XSRF…"
curl -s -o /dev/null -k --tlsv1.2 -c "$JAR" "$BASE/services/uaa/api/authenticate"
XSRF="$(awk '/XSRF-TOKEN/ {print $7}' "$JAR" | tail -1)"
[ -n "$XSRF" ] && echo "   XSRF-TOKEN obtenu (${XSRF:0:12}…)" || { echo "   ✗ pas de cookie XSRF"; exit 1; }

echo "2) Login du compte technique…"
LOGIN_CODE="$(curl -s -o /dev/null -w '%{http_code}' -k --tlsv1.2 -b "$JAR" -c "$JAR" \
  -H "Content-Type: application/json" -H "Accept: application/json, text/plain, */*" \
  -H "X-XSRF-TOKEN: $XSRF" \
  -d "{\"username\":\"$INPI_USERNAME\",\"password\":\"$INPI_PASSWORD\"}" \
  "$BASE/auth/login")"
echo "   POST /auth/login → HTTP $LOGIN_CODE"
[ "$LOGIN_CODE" = "200" ] || { echo "   ✗ login refusé — vérifier le compte TECHNIQUE (≠ login portail)"; exit 1; }

echo "3) Découverte du contrat — spécification OpenAPI/Swagger (chemins 'marque')…"
FOUND_SPEC=""
for spec in \
  "/services/apidiffusion/v3/api-docs" \
  "/services/apidiffusion/v2/api-docs" \
  "/services/apidiffusion/swagger-resources" \
  "/v3/api-docs" "/v2/api-docs" "/swagger-resources" ; do
  code="$(curl -s -o /tmp/inpi_spec.json -w '%{http_code}' -k --tlsv1.2 -b "$JAR" -c "$JAR" \
    -H "Accept: application/json" "$BASE$spec")"
  echo "   $code  $spec"
  if [ "$code" = "200" ] && grep -qi 'marque\|brand\|paths' /tmp/inpi_spec.json 2>/dev/null; then
    FOUND_SPEC="$spec"
    echo "   → chemins contenant 'marque' :"
    grep -oiE '"/[^"]*marque[^"]*"' /tmp/inpi_spec.json | sort -u | sed 's/^/       /'
    break
  fi
done

echo
echo "4) Schéma du corps attendu par POST /api/marques/search (depuis la spec)…"
curl -s -o /tmp/inpi_spec.json -k --tlsv1.2 -b "$JAR" -c "$JAR" \
  -H "Accept: application/json" "$BASE/services/apidiffusion/v2/api-docs"
python3 - <<'PY' 2>/dev/null || echo "   (python indisponible — voir /tmp/inpi_spec.json)"
import json
s=json.load(open('/tmp/inpi_spec.json'))
op=s.get('paths',{}).get('/api/marques/search',{})
print("   méthodes:", ", ".join(op.keys()))
post=op.get('post',{})
print("   consumes:", post.get('consumes'))
def resolve(ref):
    d=s
    for p in ref.lstrip('#/').split('/'): d=d[p]
    return d
for prm in post.get('parameters',[]):
    print(f"   param: name={prm.get('name')} in={prm.get('in')} required={prm.get('required')} type={prm.get('type')}")
    sch=prm.get('schema',{})
    ref=sch.get('$ref') or sch.get('items',{}).get('$ref')
    if ref:
        d=resolve(ref)
        print("     schéma:", ref.split('/')[-1])
        props=d.get('properties',{})
        for k,v in props.items():
            print(f"       - {k}: {v.get('type',v.get('$ref',''))} {('['+v['enum'][0]+' …]') if v.get('enum') else ''}")
PY

echo
echo "4b) Détail du champ 'collections' + valeurs par défaut (spec)…"
python3 - <<'PY' 2>/dev/null
import json
s=json.load(open('/tmp/inpi_spec.json'))
d=s.get('definitions',{}).get('TrademarkQuery',{})
print("   TrademarkQuery.example:", json.dumps(d.get('example'), ensure_ascii=False) if d.get('example') else "(aucun)")
for k,v in d.get('properties',{}).items():
    extra=""
    if v.get('enum'): extra=" enum="+str(v['enum'])
    if 'items' in v and isinstance(v['items'],dict) and v['items'].get('enum'): extra=" items.enum="+str(v['items']['enum'])
    if v.get('example') is not None: extra+=" ex="+json.dumps(v['example'],ensure_ascii=False)
    print(f"   - {k}: {v.get('type','')}{extra}")
PY

echo
echo "4c) GET /api/marques/metadata (collections & champs valides)…"
curl -s -k --tlsv1.2 -b "$JAR" -c "$JAR" -H "Accept: application/json" \
  "$BASE/services/apidiffusion/api/marques/metadata" | head -c 700
echo

echo
echo "5) Recherche POST /api/marques/search  (query DSL [Mark=…], collections FMARK/CTMARK/TMINT)…"
# Le token XSRF tourne à CHAQUE requête → le relire dans le jar avant chaque appel.
try_search () {
  local label="$1" body="$2"
  local xsrf; xsrf="$(awk '/XSRF-TOKEN/ {print $7}' "$JAR" | tail -1)"
  local out; out="$(curl -s -o /tmp/inpi_search.json -w '%{http_code}' \
    -k --tlsv1.2 -b "$JAR" -c "$JAR" \
    -H "Content-Type: application/json" -H "Accept: application/json" -H "X-XSRF-TOKEN: $xsrf" \
    -d "$body" "$BASE/services/apidiffusion/api/marques/search")"
  echo "   [$label] HTTP $out"
  python3 -c "import json,sys; d=json.load(open('/tmp/inpi_search.json')); print('     total:', d.get('totalCount', d.get('total','?')), '| clés:', list(d.keys())[:8])" 2>/dev/null \
    || echo "     ↳ $(head -c 500 /tmp/inpi_search.json | tr '\n' ' ')"
}
try_search "toutes collections" "{\"query\":\"[Mark=$TERM]\",\"size\":5,\"collections\":[\"FMARK\",\"CTMARK\",\"TMINT\"]}"
echo
echo "   Aperçu structuré du 1er résultat :"
python3 - <<'PY' 2>/dev/null || echo "   (voir /tmp/inpi_search.json)"
import json
d=json.load(open('/tmp/inpi_search.json'))
print("   totalCount:", d.get('totalCount'))
res=d.get('result') or d.get('results') or d.get('marques') or []
if isinstance(res,dict): res=list(res.values())
if res:
    print("   1er résultat (clés):", list(res[0].keys()))
    print("   extrait:", json.dumps(res[0], ensure_ascii=False)[:600])
PY
echo "— fin —  (réponse complète : /tmp/inpi_search.json | spec : /tmp/inpi_spec.json)"

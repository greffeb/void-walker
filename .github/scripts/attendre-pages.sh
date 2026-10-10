#!/usr/bin/env bash
# Attend que GitHub Pages serve vraiment la version publiée, avant d'en annoncer le lien.
# Usage : attendre-pages.sh <adresse de version.txt> <commit attendu>
set -euo pipefail

adresse="$1"
attendu="$2"
for essai in $(seq 1 60); do
  # Paramètre changeant à chaque essai : une réponse 404 gardée en cache ne compte pas.
  servi="$(curl -fsS -H 'Cache-Control: no-cache' "${adresse}?essai=${essai}" 2>/dev/null || true)"
  if [[ "$servi" == "$attendu" ]]; then
    echo "En ligne après ${essai} essai(s) : ${adresse%version.txt}"
    exit 0
  fi
  sleep 5
done
echo "Version publiée toujours pas servie après 5 minutes : ${adresse}" >&2
exit 1

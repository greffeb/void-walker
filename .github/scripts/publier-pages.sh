#!/usr/bin/env bash
# Publie un dossier construit sur gh-pages (AP-05).
# Usage : publier-pages.sh <destination> <dossier construit> [dossier de captures]
#   destination vide : version principale à la racine, les dossiers pr-* sont conservés ;
#   destination pr-<numéro> : version de test de cette PR, remplacée en entier.
set -euo pipefail
# shellcheck source=pages-commun.sh
source "$(dirname "$0")/pages-commun.sh"

destination="$1"
construit="$(realpath "$2")"
captures="${3:+$(realpath "$3")}"
if [[ -n "$destination" && ! "$destination" =~ ^pr-[0-9]+$ ]]; then
  echo "Destination invalide : ${destination}" >&2
  exit 1
fi

identite
for essai in 1 2 3 4 5; do
  preparer_site
  if [[ -z "$destination" ]]; then
    find "$site" -mindepth 1 -maxdepth 1 ! -name .git ! -name 'pr-*' -exec rm -rf {} +
    cible="$site"
  else
    rm -rf "${site:?}/${destination}"
    cible="${site}/${destination}"
    mkdir -p "$cible"
  fi
  cp -R "${construit}/." "${cible}/"
  if [[ -n "$captures" ]]; then
    mkdir -p "${cible}/captures"
    cp -R "${captures}/." "${cible}/captures/"
  fi
  touch "${site}/.nojekyll"
  git -C "$site" add -A
  if git -C "$site" diff --cached --quiet; then
    echo "Rien de nouveau à publier."
    exit 0
  fi
  git -C "$site" commit -q -m "Publication ${destination:-principale} (${GITHUB_SHA:-local})"
  if pousser_site; then
    echo "Publié : /${destination}"
    exit 0
  fi
  echo "Envoi refusé (publication concurrente ?), essai ${essai} sur 5." >&2
  sleep $((essai * 5))
done
exit 1

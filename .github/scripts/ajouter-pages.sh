#!/usr/bin/env bash
# Ajoute des fichiers à une version de test déjà publiée sur gh-pages, sans retirer le reste (#180) : état de la
# vérification et captures, à la fin de la CI, à côté de la version publiée au début.
# Usage : ajouter-pages.sh <pr-numéro> <dossier dont le contenu est copié dans /pr-numéro/>
set -euo pipefail
# shellcheck source=pages-commun.sh
source "$(dirname "$0")/pages-commun.sh"

destination="$1"
ajout="$(realpath "$2")"
if [[ ! "$destination" =~ ^pr-[0-9]+$ ]]; then
  echo "Destination invalide : ${destination}" >&2
  exit 1
fi

identite
for essai in 1 2 3 4 5; do
  preparer_site
  mkdir -p "${site}/${destination}"
  cp -R "${ajout}/." "${site}/${destination}/"
  git -C "$site" add -A
  if git -C "$site" diff --cached --quiet; then
    echo "Rien de nouveau à publier."
    exit 0
  fi
  git -C "$site" commit -q -m "Ajout à ${destination} (${GITHUB_SHA:-local})"
  if pousser_site; then
    echo "Ajouté à /${destination}"
    exit 0
  fi
  echo "Envoi refusé (publication concurrente ?), essai ${essai} sur 5." >&2
  sleep $((essai * 5))
done
exit 1

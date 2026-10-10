#!/usr/bin/env bash
# Retire la version de test d'une PR fusionnée ou fermée (D-131).
# Usage : retirer-pages.sh pr-<numéro>
set -euo pipefail
# shellcheck source=pages-commun.sh
source "$(dirname "$0")/pages-commun.sh"

destination="$1"
if [[ ! "$destination" =~ ^pr-[0-9]+$ ]]; then
  echo "Destination invalide : ${destination}" >&2
  exit 1
fi

identite
for essai in 1 2 3 4 5; do
  preparer_site
  if [[ ! -e "${site}/${destination}" ]]; then
    echo "Aucune version de test à retirer pour ${destination}."
    exit 0
  fi
  git -C "$site" rm -rq -- "$destination"
  git -C "$site" commit -q -m "Retrait de la version de test ${destination}"
  if pousser_site; then
    echo "Retiré : /${destination}/"
    exit 0
  fi
  echo "Envoi refusé, essai ${essai} sur 5." >&2
  sleep $((essai * 5))
done
exit 1

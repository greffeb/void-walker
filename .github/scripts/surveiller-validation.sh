#!/usr/bin/env bash
# Signale toute modification de la clé publique de validation et du code qui la vérifie (C-10 §5, PR-10).
# La clé n'est changée que par le porteur du projet : la CI échoue pour qu'il le voie, sans bloquer la fusion.
# Usage : surveiller-validation.sh <commit de départ> <commit d'arrivée>
set -euo pipefail

depart="$1"
arrivee="$2"
if [[ "$depart" =~ ^0+$ ]] || ! git cat-file -e "${depart}^{commit}" 2>/dev/null; then
  echo "Pas de commit de départ comparable : rien à comparer."
  exit 0
fi

surveilles=(
  "docs/validation-key.json"
  "app/validation.ts"
  "tools/reconnaitre-validation.ts"
  ".github/workflows/validation.yml"
  ".github/scripts/surveiller-validation.sh"
)

modifies="$(git diff --name-only "$(git merge-base "$depart" "$arrivee")" "$arrivee")"
alerte=0
for fichier in "${surveilles[@]}"; do
  if grep -qxF "$fichier" <<<"$modifies"; then
    alerte=1
    if [[ "$fichier" == "docs/validation-key.json" ]]; then
      echo "::error file=${fichier}::Clé publique de validation modifiée. Réservé au porteur du projet (C-10 §5) : vérifiez que c'est vous."
    else
      echo "::error file=${fichier}::Code de reconnaissance des validations modifié (C-10 §4) : à relire par le porteur du projet."
    fi
  fi
done

if [[ "$alerte" == 1 ]]; then
  exit 1
fi
echo "Clé de validation et code de vérification inchangés."

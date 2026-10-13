#!/usr/bin/env bash
# Signale toute modification de la clé publique de validation et du code qui la vérifie (C-10 §5, PR-10).
# La clé n'est changée que par le porteur du projet : la CI le signale par un avertissement et, dans une PR, par un
# commentaire du robot ; elle ne bloque rien et reste verte.
# Usage : surveiller-validation.sh <commit de départ> <commit d'arrivée> [fichier markdown du commentaire à écrire]
set -euo pipefail

depart="$1"
arrivee="$2"
commentaire="${3:-}"
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
lignes=()
for fichier in "${surveilles[@]}"; do
  if grep -qxF "$fichier" <<<"$modifies"; then
    if [[ "$fichier" == "docs/validation-key.json" ]]; then
      message="Clé publique de validation modifiée. Réservé au porteur du projet (C-10 §5) : vérifiez que c'est vous."
    else
      message="Code de reconnaissance des validations modifié (C-10 §4) : à relire par le porteur du projet."
    fi
    echo "::warning file=${fichier}::${message}"
    lignes+=("- \`${fichier}\` : ${message}")
  fi
done

if [[ "${#lignes[@]}" == 0 ]]; then
  echo "Clé de validation et code de vérification inchangés."
  exit 0
fi
if [[ -n "$commentaire" ]]; then
  {
    echo "<!-- void-walker:cle-validation -->"
    echo "**⚠ Clé de validation** (PR-10) : cette PR touche à la reconnaissance des validations sur téléphone."
    echo
    printf '%s\n' "${lignes[@]}"
  } >"$commentaire"
fi

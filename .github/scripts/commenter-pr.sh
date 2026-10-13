#!/usr/bin/env bash
# Poste ou met à jour, dans la PR, un commentaire du robot reconnu par son marqueur (par défaut : la version de test).
# Usage : commenter-pr.sh <numéro de PR> <fichier markdown> [marqueur]
set -euo pipefail

numero="$1"
fichier="$2"
marqueur="${3:-<!-- void-walker:version-de-test -->}"
if [[ ! "$numero" =~ ^[0-9]+$ ]]; then
  echo "Numéro de PR invalide : ${numero}" >&2
  exit 1
fi

existant="$(gh api "repos/${GITHUB_REPOSITORY}/issues/${numero}/comments" --paginate \
  --jq ".[] | select(.user.login == \"github-actions[bot]\" and (.body | startswith(\"${marqueur}\"))) | .id" | tail -n 1)"
if [[ -n "$existant" ]]; then
  gh api -X PATCH "repos/${GITHUB_REPOSITORY}/issues/comments/${existant}" -F "body=@${fichier}" >/dev/null
  echo "Commentaire mis à jour."
else
  gh api -X POST "repos/${GITHUB_REPOSITORY}/issues/${numero}/comments" -F "body=@${fichier}" >/dev/null
  echo "Commentaire posté."
fi

# Fonctions communes de publication sur la branche gh-pages (AP-05), sourcées par publier-pages.sh et retirer-pages.sh.
# Le jeton n'est jamais écrit dans la configuration git : il passe en en-tête, le temps d'une commande.

depot="${DEPOT_PAGES:-https://github.com/${GITHUB_REPOSITORY:?GITHUB_REPOSITORY requis}.git}"

git_auth() {
  local entete
  entete="AUTHORIZATION: basic $(printf 'x-access-token:%s' "${GH_TOKEN:?GH_TOKEN requis}" | base64 | tr -d '\n')"
  git -c "http.https://github.com/.extraheader=${entete}" "$@"
}

identite() {
  git config --global user.name "github-actions[bot]"
  git config --global user.email "41898282+github-actions[bot]@users.noreply.github.com"
}

# Prépare "$site" : contenu actuel de gh-pages, ou dépôt vide si la branche n'existe pas encore.
preparer_site() {
  site="$(mktemp -d)"
  git init -q "$site"
  if git_auth ls-remote --exit-code --heads "$depot" gh-pages >/dev/null; then
    git_auth -C "$site" fetch -q --depth=1 "$depot" gh-pages
    git -C "$site" checkout -q --detach FETCH_HEAD
  fi
}

pousser_site() {
  git_auth -C "$site" push -q "$depot" HEAD:refs/heads/gh-pages
}

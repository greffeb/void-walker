# Service de rapports

Worker Cloudflare qui reçoit « Signaler un bug » et « Envoyer ma partie » et les publie sur GitHub (C-10 §3, AP-06, D-134). Les agents le mettent à jour et le déploient eux-mêmes, dans le même travail que la fonctionnalité du jeu qui en a besoin (D-125, D-127).

- **Adresse :** `https://void-walker-rapports.greffe-b.workers.dev/rapports` (POST, JSON dans le corps). Le jeu la reçoit à la construction (`SERVICE_RAPPORTS` dans `vite.config.ts`).
- **Version publique :** une issue, étiquette `rapport-bug` ou `rapport-partie`.
- **Version de test d'une PR :** un commentaire sur cette PR (D-132) ; une PR fermée reçoit une issue qui la cite.
- **Anti-abus (RP-03) :** dans l'objet durable `GardeRapports`. Il applique un délai, un nombre par heure, par jour et pour tout le service, et refuse les doublons (`src/garde.ts`). Une adresse IP n'y entre que hachée avec un sel que l'objet tire lui-même ; tout s'efface en un jour au plus.
- **Origines admises :** la version publiée, les versions de test et les essais locaux (`vars.ORIGINES` de `wrangler.jsonc`).

## Code et vérification

Le code est dans `src/`. Il n'importe rien d'autre que `report-service/` : il tourne seul sur Cloudflare. Il est vérifié avec le reste du dépôt par `npm run verify` (types, lint, règles d'import, tests). `tools/rapports.test.ts` le teste de bout en bout : le jeu compose le rapport, le service le publie, le rejoueur le rejoue.

## Déployer

Ce dossier a son propre `package.json`, pour que l'installation du dépôt ne tire pas `wrangler`.

```bash
npm install --prefix report-service
```

```bash
npm run deployer --prefix report-service
```

`wrangler` utilise la connexion OAuth du PC du porteur du projet, faite une fois avec des droits limités aux Workers :

```bash
npm run connexion --prefix report-service
```

Pour suivre les appels en direct (statuts seulement, jamais la clé ni le contenu des rapports) :

```bash
npm run journal --prefix report-service
```

Changer une limite, un texte d'issue ou le format attendu se fait dans `src/`, avec ses tests, puis un déploiement. Une nouvelle classe d'objet durable demande une nouvelle étiquette dans `migrations`.

## Clé GitHub (porteur du projet seulement)

Le secret `GITHUB_JETON` est une clé GitHub à grain fin :

- limitée au dépôt `greffeb/void-walker` ;
- avec seulement **Issues : lecture et écriture** et **Pull requests : lecture et écriture** ;
- les métadonnées en lecture sont ajoutées d'office.

Elle est stockée comme secret du Worker : Cloudflare ne la rend jamais, elle n'est ni dans le dépôt, ni dans le jeu, ni dans une issue (C-10 §5). Pour la poser ou la remplacer :

```bash
npm run secret --prefix report-service
```

Puis coller la clé quand la commande la demande. Une clé expirée fait répondre au service « échec » : le jeu garde alors les rapports et les renvoie plus tard.

## Rejouer un rapport

```bash
npm run rejouer -- https://github.com/greffeb/void-walker/issues/<numéro>
```

L'adresse d'un commentaire de PR (`…/pull/<n>#issuecomment-<id>`) marche aussi. Le rejoueur lit le texte avec `gh`, en extrait la partie et la rejoue à la version courante du dépôt. Pour la même version que le joueur, se placer d'abord sur le commit indiqué dans le rapport.

# Portes en ligne (D-267) — plan d'implémentation

> **Pour les agents :** exécution native (le porteur a demandé le mode autonome) ; les étapes se cochent `- [ ]`.

**But :** « Se déplacer vers » devient une ligne par salle voisine : le nom fait passer d'un toucher, la commande d'état ouvre ou ferme la porte d'un toucher, avec les repères VIDE, FEU et BRUIT ; plus de bulle de passage.

**Architecture :** le rangement reste dans `app/ecran.ts` (pur, testé sans React) : `Deplacement` gagne l'option jouée par le nom (`passer`), la manœuvre de la porte (`manoeuvre`) et ses repères. `app/EcranJeu.tsx` rend la ligne ; `tools/captures.ts` touche les lignes au lieu d'ouvrir des bulles. Le moteur ne change pas.

**Technique :** React 19, TypeScript strict, Vitest (`npm test`), Playwright (`npm run captures`), ESLint (`npm run lint`), `tsc -b` (`npm run typecheck`).

**Spécification :** [D-267](../../03-decisions.md), [12 §3.4 à §3.6](../../12-interface-ecrans.md), maquette [portes.html](../../maquette/portes.html).

## Contraintes globales

- Aucun aperçu ni confirmation pour aller, dériver, ouvrir et fermer une porte (D-267) ; prendre et poser gardent la règle de D-182.
- Toucher le nom d'une salle où l'on ne peut pas passer joue l'option telle quelle : le moteur la refuse sans coût, le récit dit la raison, le son est « refus ».
- Sans gravité, loin du passage, le nom joue « dériver » ; au bord, « aller ».
- Repères : `vide` (`RefPassage.vide`), `feu` (`RefPassage.feu`, donc porte ouverte seulement), `bruit` (événement `bruit_creature` du dernier pas, `partie.derniers`). Pas de repère pour l'huile.
- Passage sans ouvrir ni fermer au menu : pas de commande, nom sur toute la largeur.
- Chaque option du menu moteur garde une seule place à l'écran (test existant), sauf l'écoutille au pupitre (D-266).

## Points d'attention (non couverts par les parcours témoins)

1. Double toucher sur un nom : un seul déplacement (anti double toucher existant, `unToucher` vrai pour aller).
2. Toucher un nom bloqué ne compte pas d'action et n'écrit rien dans la sauvegarde.
3. BRUIT disparaît après l'action suivante, mais pas après un refus (la partie n'a pas avancé).
4. Commande indisponible (hors de portée) : rien ne se joue, ni au toucher ni au clavier.
5. Texte agrandi à 22 px sur 320 px : la commande et le nom tiennent sans débordement horizontal.

---

### Tâche 1 : rangement des lignes (`app/ecran.ts`)

**Fichiers :** `app/ecran.ts`, `app/ecran.test.ts`.

**Produit :**
- `type Repere = 'vide' | 'feu' | 'bruit'` ;
- `interface Deplacement extends Groupe { cible: RefPassage; aller: OptionMenu; passer: OptionMenu; manoeuvre: OptionMenu | undefined; reperes: readonly Repere[] }` ;
- `composerDock(observation, ouverts = [], entendus = [])` ;
- `passagesEntendus(partie: Partie): string[]` ;
- `unToucher` : vrai pour `aller`, `deriver`, `ouvrir`, `fermer` disponibles ; risque vérifié seulement pour `prendre` et `poser`.

- [ ] Tests d'abord : au départ du monde de test, la porte a `passer` = aller indisponible, `manoeuvre` = ouvrir, aucun repère ; après « ouvrir la porte », repère `bruit` (événement `bruit_creature` sur la porte) ; une fixture sans gravité (copie réduite de `GRAVITE`, engine/morceaux.test.ts) donne `passer` = dériver loin du passage, aller au bord ; `unToucher` vrai pour ouvrir la porte grippée (coût bruyant).
- [ ] Les voir échouer (`npx vitest run app/ecran.test.ts`).
- [ ] Implémenter, les voir passer ; mettre à jour les tests D-229 qui listaient les options de la bulle.

### Tâche 2 : lignes de salle à l'écran (`app/EcranJeu.tsx`, `app/styles.css`)

**Fichiers :** `app/EcranJeu.tsx`, `app/styles.css`, `app/EcranJeu.test.tsx`.

- [ ] Tests d'abord (rendu serveur) : texte du dock au départ `… Se déplacer vers → atelier Fermée → soute Fermée` ; nom bloqué sans `aria-haspopup`, `data-son="refus"`, nom accessible « atelier, La porte de l’atelier est fermée. » ; commande `aria-label="Porte de l’atelier, fermée"`, `data-son="confirmer"` ; après « ouvrir », repère BRUIT lu « atelier, bruit » ; un passage sans manœuvre n'a pas de commande ; pendant l'enregistrement, noms et commandes désactivés.
- [ ] `LigneSalle` remplace `BoutonDeplacement` : nom → `jouer(passer)` ; commande → `jouer(manoeuvre)` si disponible, sinon inerte (`aria-disabled`, son refus) ; plus de bulle de passage (`groupeOuvert` ne cherche que dans `dock.piece`).
- [ ] CSS : une colonne, ligne en grille `1fr auto`, commande 112 px × échelle, témoin plein/vide, repère encadré, filet gauche danger.
- [ ] Revoir les tests de la bulle de passage : supprimer ceux qui n'ont plus d'objet, garder ceux de l'aperçu (D-187) sur une bulle d'objet.

### Tâche 3 : captures (`tools/captures.ts`)

- [ ] `Geste` d'un passage : `bouton` = nom accessible du bouton de la ligne (nom ou commande), `direct` vrai ; `rejouer` le touche dans `.dock .deplacements` sans bulle.
- [ ] Vérification « sans effet » : seulement les puces d'objet ; toucher un nom bloqué au départ : 0 action, récit de refus.
- [ ] Double toucher et clavier sur le nom d'un passage ouvert : un seul déplacement.
- [ ] Formes d'aperçu : celles qui restent (les portes n'en ont plus) ; plus d'exigence de quatre formes.
- [ ] `npm run build && npm run captures` sans erreur ; regarder les captures du dock.

### Tâche 4 : vérification et PR

- [ ] `npm run verify` (tests, lint, typecheck, contrôles).
- [ ] Essai dans le navigateur à 390 px : passer une porte fermée en 2 touchers.
- [ ] Pousser `ux/portes-lignes`, ouvrir la PR (validation sur téléphone à faire par le porteur).

# 16 — Proposer l'installation de la PWA (investigation #174)

> **Statut :** investigation, puis première livraison (§8) : l'étape A, avec les aides d'iPhone et de Firefox Android. Aucune décision prise ; tout ce qui suit est **[Proposé]** et seul le porteur du projet valide (zone orange pour `app/`, C-10 §6).
> **Source :** [issue #174](https://github.com/greffeb/void-walker/issues/174).

## 1. Réponse courte

Oui, c'est faisable et peu coûteux, avec une limite : un vrai bouton « Installer » n'existe que sur les navigateurs Chromium (Chrome, Edge, Samsung Internet, Opera, sur Android et ordinateur). Sur iPhone, aucun navigateur ne peut déclencher l'installation : on ne peut qu'expliquer le geste (Partager → Sur l'écran d'accueil). Sur Firefox et Safari macOS, rien à proposer.

Le jeu est **déjà éligible** : il n'y a rien à corriger dans le manifeste ni dans le service worker pour que Chrome propose l'installation.

## 2. Ce qui a été vérifié

Construction de `main` (`npm run build`, `vite preview`), ouverte dans le Chromium de l'environnement (profil persistant, Playwright + protocole DevTools) :

| Contrôle | Résultat |
| --- | --- |
| `Page.getInstallabilityErrors` | liste vide |
| `Page.getAppManifest` | aucune erreur, manifeste lu à `/manifest.webmanifest` |
| `beforeinstallprompt` | **déclenché** au chargement, avec `prompt()` disponible |
| Service worker | enregistré (precache de 13 fichiers) |
| `display-mode: standalone` / `navigator.standalone` | `false` / `undefined` dans l'onglet (attendu) |

Dans un contexte Playwright sans profil (navigation privée), la seule erreur est `in-incognito` : un navigateur en navigation privée ne propose jamais l'installation, c'est normal.

Ce qui est en place dans le dépôt : manifeste `display: standalone` avec icônes 192 et 512 (dont une `maskable`, le « V_ » tient largement dans la zone sûre), `<link rel="manifest">` injecté, `apple-touch-icon`, `theme-color`, service worker Workbox (`registerType: 'prompt'`, mise à jour pilotée par `app/miseAJour.ts`, D-227).

Non vérifié ici : tout ce qui n'est pas Chromium (§3, colonne « Statut »), et le comportement sur un vrai téléphone. Ces points sont à confirmer sur appareil avant de s'y fier.

## 3. Comportement par navigateur

| Navigateur | Installer depuis la page | Comment l'utilisateur installe sans nous | Statut |
| --- | --- | --- | --- |
| Chrome, Edge, Samsung Internet, Opera (Android, ordinateur) | **Oui** : `beforeinstallprompt` puis `prompt()` depuis un geste ; `userChoice` donne `accepted` / `dismissed` ; `appinstalled` confirme | Menu ⋮ → « Installer l'application » ; icône dans la barre d'adresse sur ordinateur | Événement constaté dans Chromium ; reste à voir sur téléphone |
| Safari iPhone / iPad | **Non** | Bouton Plus (•••) → « Partager » → « Sur l’écran d’accueil » → « Ajouter » | **Libellés vérifiés** dans le guide Apple en français (§3.1) |
| Chrome, Edge, Firefox sur iPhone (moteur WebKit) | **Non** | Même geste via le menu Partager du navigateur (iOS 16.4 et suivants) ; libellés non vérifiés | Documenté, à confirmer |
| Firefox Android | **Non** (pas d'événement) | Menu ⋮ → « Plus » → « Ajouter l’application à l’écran d’accueil » → « Ajouter » | Chemin donné par le porteur, cohérent avec la source de Firefox (§3.1) ; libellé français non vérifié |
| Firefox ordinateur | **Non** | Installation des PWA non prise en charge | Documenté, à confirmer |
| Safari macOS | **Non** | Fichier → « Ajouter au Dock » | Documenté, à confirmer |

Points d'attention :

- **Chromium :** l'événement n'est pas déclenché si l'appli est déjà installée. Il peut arriver avant que React ne soit monté : il faut l'écouter dès `main.tsx`, comme `piloterMiseAJour`, et le garder. `prompt()` ne marche que dans un geste du joueur et une seule fois par événement ; après un refus, Chrome tarde à en renvoyer un.
- **Mini-barre de Chrome sur Android :** `preventDefault()` sur l'événement reprend la main sur l'invite du navigateur. À constater sur téléphone.
- **iOS :** ni événement, ni API pour savoir si le jeu est installé depuis Safari. On détecte « iPhone ou iPad » (l'iPad récent se présente comme un Mac : `navigator.maxTouchPoints > 1`) et « pas en mode appli ».
- **Détection « déjà installé » :** `matchMedia('(display-mode: standalone)')` (et `fullscreen`, `minimal-ui`) plus `navigator.standalone` pour iOS. Un onglet ordinaire ouvert par quelqu'un qui a déjà installé n'est pas en mode appli : sur Chromium l'absence d'événement le trahit, sur iOS non ; on garde donc aussi un drapeau « installée » (`appinstalled`, ou premier lancement en mode appli) dans `localStorage`.

### 3.1 Libellés vérifiés pour les bulles d'aide

**iPhone, Safari (iOS 26 et 27), français.** Source : [Transformer un site web en app dans Safari sur l'iPhone](https://support.apple.com/fr-ch/guide/iphone/iphea86e5236/26/ios/26) et [Ajouter un signet à un site web dans Safari](https://support.apple.com/fr-fr/guide/iphone/iph42ab2f3a7/ios), guides d'Apple lus en entier. Les étapes, mot pour mot :

1. « Touchez [le bouton Plus ⋯], puis touchez « Partager ». » Si la disposition des onglets est « En bas » ou « En haut », on touche directement [le bouton Partager].
2. « Faites défiler la liste des options, puis touchez « Sur l’écran d’accueil ». » Si l'option manque : « touchez « Modifier les actions », puis touchez « Sur l’écran d’accueil » » en bas de la liste.
3. « Activez « Ouvrir comme app web ». » (le guide d'iOS 26 ; celui d'iOS 27 dit « Vous pouvez choisir »).
4. « Touchez Ajouter. »

Selon la disposition des onglets, Partager est derrière le bouton Plus (•••) ou directement dans la barre : la bulle nomme les deux.

**Firefox Android.** Source : fichier des textes de Firefox ([`strings.xml`](https://github.com/mozilla-firefox/firefox/blob/main/mobile/android/fenix/app/src/main/res/values/strings.xml), version actuelle, anglais) : le groupe replié du menu s'appelle « More » ; il contient « Add to Home screen » (raccourci) et « Add app to Home screen » (application web) ; le bouton de la fenêtre de confirmation est « Add ». Le chemin donné par le porteur correspond : menu ⋮ → « Plus » → « Ajouter l'application à l'écran d'accueil » → « Ajouter ». **La traduction française exacte n'a pas pu être lue** : les pages d'aide de Mozilla ont refusé le téléchargement et le fichier des traductions n'a pas été trouvé. Le libellé français vient du porteur ; à confirmer sur un téléphone. D'après un résumé de recherche du support de Mozilla (non relu), ce menu avec « Plus » date de Firefox 141 ; avant, l'entrée est directement dans le menu ⋮. La bulle ne vise que le menu actuel.

## 4. Particularités du dépôt à respecter

- **Versions de test :** chaque PR publiée sous `/void-walker/pr-<n>/` a son propre manifeste et sa propre portée, donc elle est « installable » elle aussi. Ne **jamais** proposer l'installation dans une version de test (`VITE_PR_NUMERO` non vide) : on installerait une version jetable.
- **`localStorage` est commun à toutes les versions :** même origine pour `/void-walker/` et `/void-walker/pr-<n>/` (déjà le cas des réglages et des rapports, `app/rapports.ts`). Une clé `void-walker:installation` n'aurait de sens que pour la version principale, que la version de test n'écrit pas.
- **Accueil figé :** 12 §4.1 est **Validé** (« seulement le titre et trois boutons, pas de sous-titre »). Tout ajout à l'accueil est une dérogation à demander.
- **Fin de partie :** 12 §4.11 est « récit seulement » (D-086). Un bouton d'installation y casserait le ton.
- **Précédent :** la section « MISE À JOUR » des options (D-227) est le modèle : un module sans React et testable avec de faux navigateurs (`app/miseAJour.ts`), un `useSyncExternalStore`, une ligne `ligne-option` avec son état en `role="status"`.

## 5. Proposition de design

### 5.1 Où et quand

| Étape | Où | Quand | Dérogation à une règle validée ? |
| --- | --- | --- | --- |
| **A. Toujours disponible** | Options, nouvelle section « INSTALLATION », juste avant « MISE À JOUR » | Dès que l'installation est possible (événement reçu) ou que l'appareil est un iPhone / iPad hors mode appli | Non (12 §4.10 s'étend d'une section, comme D-227) |
| **B. Un rappel discret, une seule fois** | Accueil, une ligne de texte-bouton sous OPTIONS : « ▸ Installer le jeu » | Après une première partie terminée **ou** à la 2ᵉ visite, jamais pendant une partie, jamais au premier chargement ; refusé, redemandé au plus tôt après 90 jours | **Oui** (12 §4.1) |
| ~~C. Écran de fin~~ | — | — | Déconseillé (D-086, ton du récit) |

Recommandation : livrer A seul d'abord. Il ne harcèle personne, ne touche à aucun écran validé et couvre le besoin « je ne trouve pas où installer ». B est une deuxième livraison, soumise au porteur.

### 5.2 Comportement

- Chromium : le bouton appelle `prompt()` ; `accepted` → drapeau « installée », bouton retiré ; `dismissed` → bouton retiré aussi, retour « Installation refusée. Le menu du navigateur permet de la relancer. » : un événement ne sert qu'une fois, le bouton ne pourrait plus rien ouvrir. Si le navigateur en renvoie un autre plus tard, le bouton revient.
- iPhone / iPad : le bouton ouvre une bulle (modèle `app/bulle.tsx`, croix et Échap) avec les quatre étapes de §3.1 ; pas d'effet sur le drapeau (rien ne confirme l'installation).
- Firefox Android : même bulle, avec le chemin de §3.1 ; détection par `Android` et `Firefox` dans l'agent utilisateur, sans événement `beforeinstallprompt`.
- Ailleurs (Firefox ordinateur, Safari macOS, navigation privée, version de test, déjà installée) : la section n'existe pas, comme « MISE À JOUR » sans service worker.
- Mémoire : `localStorage` `void-walker:installation` = `{ installee: true }`, lue et écrite défensivement comme `app/reglages.ts` (navigation privée, quota). Les visites et la date d'un refus ne servent qu'au rappel de l'étape B (§5.1) : elles ne sont pas gardées tant qu'il n'existe pas.

### 5.3 Accessibilité et textes

- Vrais `<button>`, atteignables au clavier ; retour d'état dans une zone `role="status"` ; la bulle iOS se ferme à la croix, à Échap et au voile (même contrat que les autres bulles, 12 §3.6). Pas de focus volé : aucune invite n'apparaît d'elle-même.
- Le jeu n'existe qu'en français (manifeste `lang: fr`, textes écrits à la main, vouvoiement, C-07) : pas de traduction à prévoir. Libellés proposés : « ▸ Installer le jeu », sous-texte « s'ouvre en plein écran, sans la barre du navigateur ».

## 6. Estimation et issues d'implémentation proposées

Ordres de grandeur pour un agent, vérification complète comprise ; pas de dates, comme dans la roadmap (02).

| Issue | Contenu | Taille |
| --- | --- | --- |
| **I1 — Installation depuis les options (Chromium)** | `app/installation.ts` (événement gardé dès le départ, `prompt()`, `userChoice`, `appinstalled`, détection mode appli, mémoire) avec tests à faux navigateur ; câblage dans `main.tsx` ; section « INSTALLATION » des options ; cas « version de test » et « déjà installée » ; captures par événement simulé | moyenne (environ la taille de D-227) |
| **I2 — Aide iPhone, iPad et Firefox Android** | détection iOS et Firefox Android hors mode appli ; bulle d'explication à deux textes ; captures | petite |
| **I3 — Rappel à l'accueil** (si le porteur l'accepte) | compteur de visites, fin d'une première partie, délai de 90 jours, ligne discrète à l'accueil | petite, plus une décision sur 12 §4.1 |
| **I4 — Manifeste (facultatif)** | `id` explicite (stabilise l'identité de l'appli si l'adresse change) ; `screenshots` pour la fenêtre d'installation enrichie de Chrome ; icône maskable séparée si le graphisme change | petite |

Preuves que ces issues ne pourront pas fournir seules : l'installation réelle sur un Android avec Chrome et sur un iPhone avec Safari. Playwright ne les fait pas ; une validation humaine sur téléphone est requise (D-098), comme pour D-227.

## 7. Questions pour le porteur du projet

1. Voulez-vous un simple bouton « Installer le jeu » dans les options (A), ou aussi un rappel discret à l'accueil après une première partie (B), ce qui change l'accueil validé ?
2. Si rappel il y a : après une partie terminée, à la 2ᵉ visite, ou les deux ? Combien de temps sans le reproposer après un refus (90 jours proposés) ?
3. Sur iPhone et Firefox Android, une bulle d'explication à la demande suffit-elle ? C'est tout ce qui est possible techniquement.
4. On crée I1 à I4 telles quelles ?

## 8. Première livraison (#174)

Livré : **I1** (module `app/installation.ts`, section « INSTALLATION » des options, invite de Chromium) et **I2** (bulles d'aide de Safari sur iPhone et de Firefox sur Android). Mesuré dans Chromium par `npm run captures` : événement simulé, un seul `prompt()` par toucher, réponse acceptée ou refusée, aides à quatre étapes, fermeture par Échap, voile et ✕ avec retour du focus sur le bouton, aide d'iPhone en 320 px de large et texte « très grand ».

Pas livré : **I3** (rappel à l'accueil, il déroge à 12 §4.1 : question 1 de §7) et **I4** (manifeste). Pas non plus : la reconnaissance de Chrome, Edge et Firefox sur iPhone (leurs libellés ne sont pas vérifiés, §3.1).

**Validation humaine requise** : aucune de ces aides n'a été essayée sur un téléphone. À constater sur un Android avec Chrome (boîte du navigateur), sur un iPhone avec Safari (étapes et noms des boutons) et sur un Android avec Firefox (chemin et libellé français « Ajouter l’application à l’écran d’accueil », que seul le porteur a donné).

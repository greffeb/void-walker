# 16 — Proposer l'installation de la PWA (investigation #174)

> **Statut :** investigation, aucune décision prise, aucun code d'appli changé. Tout ce qui suit est **[Proposé]** ; seul le porteur du projet valide (zone orange pour `app/`, C-10 §6).
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
| Safari iPhone / iPad | **Non** | Partager → « Sur l'écran d'accueil » | Documenté, à confirmer |
| Chrome, Edge, Firefox sur iPhone (moteur WebKit) | **Non** | Même geste via le menu Partager du navigateur (iOS 16.4 et suivants) | Documenté, à confirmer |
| Firefox Android | **Non** | Menu → « Installer » | Documenté, à confirmer |
| Firefox ordinateur | **Non** | Installation des PWA non prise en charge | Documenté, à confirmer |
| Safari macOS | **Non** | Fichier → « Ajouter au Dock » | Documenté, à confirmer |

Points d'attention :

- **Chromium :** l'événement n'est pas déclenché si l'appli est déjà installée. Il peut arriver avant que React ne soit monté : il faut l'écouter dès `main.tsx`, comme `piloterMiseAJour`, et le garder. `prompt()` ne marche que dans un geste du joueur et une seule fois par événement ; après un refus, Chrome tarde à en renvoyer un.
- **Mini-barre de Chrome sur Android :** `preventDefault()` sur l'événement reprend la main sur l'invite du navigateur. À constater sur téléphone.
- **iOS :** ni événement, ni API pour savoir si le jeu est installé depuis Safari. On détecte « iPhone ou iPad » (l'iPad récent se présente comme un Mac : `navigator.maxTouchPoints > 1`) et « pas en mode appli ». Depuis iOS 26, ajouter un site à l'écran d'accueil l'ouvre par défaut comme une appli, ce qui ne change rien au geste à expliquer.
- **Détection « déjà installé » :** `matchMedia('(display-mode: standalone)')` (et `fullscreen`, `minimal-ui`) plus `navigator.standalone` pour iOS. Un onglet ordinaire ouvert par quelqu'un qui a déjà installé n'est pas en mode appli : sur Chromium l'absence d'événement le trahit, sur iOS non ; on garde donc aussi un drapeau « installée » (`appinstalled`, ou premier lancement en mode appli) dans `localStorage`.

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

- Chromium : le bouton appelle `prompt()` ; `accepted` → drapeau « installée », entrée masquée ; `dismissed` → date du refus gardée, retour « Installation refusée. Vous pouvez la relancer depuis les options. » (le bouton des options reste actif : un geste explicite n'est pas du harcèlement).
- iPhone / iPad : le bouton ouvre une bulle (modèle `app/bulle.tsx`, croix et Échap) : « Touchez Partager, puis Sur l'écran d'accueil. » ; pas d'effet sur le drapeau (rien ne confirme l'installation).
- Ailleurs (Firefox, Safari macOS, navigation privée, version de test, déjà installée) : la section n'existe pas, comme « MISE À JOUR » sans service worker.
- Mémoire : `localStorage` `void-walker:installation` = `{ visites, refus?, installee? }`, lue et écrite défensivement comme `app/reglages.ts` (navigation privée, quota).

### 5.3 Accessibilité et textes

- Vrais `<button>`, atteignables au clavier ; retour d'état dans une zone `role="status"` ; la bulle iOS se ferme à la croix, à Échap et au voile (même contrat que les autres bulles, 12 §3.6). Pas de focus volé : aucune invite n'apparaît d'elle-même.
- Le jeu n'existe qu'en français (manifeste `lang: fr`, textes écrits à la main, vouvoiement, C-07) : pas de traduction à prévoir. Libellés proposés : « ▸ Installer le jeu », sous-texte « s'ouvre en plein écran, sans la barre du navigateur ».

## 6. Estimation et issues d'implémentation proposées

Ordres de grandeur pour un agent, vérification complète comprise ; pas de dates, comme dans la roadmap (02).

| Issue | Contenu | Taille |
| --- | --- | --- |
| **I1 — Installation depuis les options (Chromium)** | `app/installation.ts` (événement gardé dès le départ, `prompt()`, `userChoice`, `appinstalled`, détection mode appli, mémoire) avec tests à faux navigateur ; câblage dans `main.tsx` ; section « INSTALLATION » des options ; cas « version de test » et « déjà installée » ; captures par événement simulé | moyenne (environ la taille de D-227) |
| **I2 — Aide iPhone / iPad** | détection iOS hors mode appli ; bulle d'explication ; captures | petite |
| **I3 — Rappel à l'accueil** (si le porteur l'accepte) | compteur de visites, fin d'une première partie, délai de 90 jours, ligne discrète à l'accueil | petite, plus une décision sur 12 §4.1 |
| **I4 — Manifeste (facultatif)** | `id` explicite (stabilise l'identité de l'appli si l'adresse change) ; `screenshots` pour la fenêtre d'installation enrichie de Chrome ; icône maskable séparée si le graphisme change | petite |

Preuves que ces issues ne pourront pas fournir seules : l'installation réelle sur un Android avec Chrome et sur un iPhone avec Safari. Playwright ne les fait pas ; une validation humaine sur téléphone est requise (D-098), comme pour D-227.

## 7. Questions pour le porteur du projet

1. Voulez-vous un simple bouton « Installer le jeu » dans les options (A), ou aussi un rappel discret à l'accueil après une première partie (B), ce qui change l'accueil validé ?
2. Si rappel il y a : après une partie terminée, à la 2ᵉ visite, ou les deux ? Combien de temps sans le reproposer après un refus (90 jours proposés) ?
3. Sur iPhone, une bulle d'explication à la demande suffit-elle ? C'est tout ce qui est possible techniquement.
4. On crée I1 à I4 telles quelles ?

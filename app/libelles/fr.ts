// Libellés de l'interface en français (#239) : tout ce que l'appli affiche ou fait lire au lecteur d'écran, hors textes du
// monde, qui vivent dans content/. Une autre langue reprend le type `Libelles` (./index.ts) : une clé oubliée ne compile pas.
// Les textes sont ceux des écrans validés (12), recopiés sans changement.

export const FR = {
  commun: {
    annuler: 'Annuler',
    fermer: 'Fermer',
    options: 'Options',
    nouvellePartie: 'Nouvelle partie',
    reprendrePartie: 'Reprendre la partie',
    menuPrincipal: 'Menu principal',
    chargement: 'Chargement…',
    lecture: 'lecture…',
    abandonRefuse: 'L’abandon n’a pas pu être enregistré. La partie est toujours en cours.',
    signalerBug: 'Signaler un bug',
    envoyerPartie: 'Envoyer ma partie',
    station: (numero: number | string): string => `Station ${numero}`,
    /** Nom accessible d'une commande visible mais inerte (12 §3.7) : « Ouvrir, indisponible : … ». */
    indisponible: (libelle: string, raison: string): string => `${libelle}, indisponible : ${raison}`,
    pourcentage: (valeur: number): string => `${valeur} %`,
  },

  /** Accueil et refus d'une station forcée (12 §4.1). */
  accueil: {
    confirmation: 'Confirmation de nouvelle partie',
    remplacement: 'Une partie est en cours. La nouvelle partie la remplacera.',
    commencer: 'Commencer',
    repriseImpossible: 'La partie enregistrée ne peut pas être reprise. Vous pouvez commencer une nouvelle partie.',
    stationRefusee: (motif: string): string => `Station refusée : ${motif}`,
  },

  /** Intro du tirage (D-309, textes d'exemple validés sur maquette). */
  intro: {
    nomAccessible: 'Tirage de la station',
    surTotal: (total: number): string => ` sur ${total}`,
    demarrer: 'Démarrer',
    passer: 'Toucher pour passer',
    /** Démarrage du terminal, tel que le porteur l'a écrit (D-309), en anglais. */
    commandeBoot: 'boot -a --v',
    chargement: ['Loading terminal system...', 'ready'] as readonly [string, string],
    commandeCampagne: 'campaign_mode; console_log(01);',
    avant: ['Section de départ', 'Sections de passage', 'Section finale'],
    apres: ['Arrimage de la capsule', 'Vérification de la sortie'],
    ambiance: {
      pressurisation: 'Pressurisation des coursives',
      eclairage: 'Éclairage de secours',
      purge: 'Purge des conduits',
      recyclage: 'Recyclage de l’air',
      calibrage: 'Calibrage des capteurs',
      joints: 'Contrôle des joints',
      horloge: 'Horloge de bord',
      rechauffage: 'Réchauffage du vestibule',
      survivants: 'Recherche de survivants',
      balise: 'Balise de détresse',
      gravite: 'Gravité artificielle',
      journal: 'Journal de bord',
      equipage: 'Équipage à bord',
    },
    valeurs: { ok: 'ok', derive: 'dérive', muette: 'muette', illisible: 'illisible' },
    menace: 'ERREUR : Menace détectée',
    suite: 'La prochaine partie en tirera une autre.',
    tirage: (total: number): string => `Tirage parmi ${total} stations…`,
    prete: (numero: number): string => `Station ${numero} prête`,
    nonPubliee: (composition: string): string => `Station ${composition} non publiée.`,
  },

  /** Écran de jeu et réveil (12 §3, §4.2). */
  jeu: {
    regarderAutour: 'Regarder autour de vous',
    /** Suffixe du nom accessible d'un bouton qui joue l'action sans aperçu. */
    sansConfirmation: ', sans confirmation',
    sansSortie: '[ plus aucune sortie possible ]',
    continuer: 'Continuer',
    navigation: 'Navigation',
    inventaire: 'Inventaire',
    carte: 'Carte',
    carteNouveauSignal: 'Carte, nouveau signal du capteur',
    iaStation: 'IA Station',
    iaNouveauMessage: 'IA Station, nouveau message',
    /** Libellés de la navigation : en texte agrandi sur un écran étroit, ils se coupent à la syllabe, avec un trait d'union (12 §7). */
    boutonsNavigation: { inventaire: 'Inven\u00adtaire', ia: 'IA Sta\u00adtion', carte: 'Carte' },
    informationSansSortie: {
      etiquette: 'Information du jeu',
      titre: 'Plus aucune sortie possible.',
      texte: 'Plus aucun chemin ne mène à une capsule de secours. Vous pouvez continuer à jouer et explorer la station.',
      continuer: 'Continuer à jouer',
      terminer: 'Terminer la partie',
      note: 'la partie s’arrête ici',
    },
    dansLaPiece: 'Dans la pièce',
    seDeplacerVers: 'Se déplacer vers',
    question: 'Où ?',
    apercu: { risque: 'Risque', cout: 'Coût', savoir: 'Savoir' },
    confirmer: 'Confirmer',
    porte: { ouverte: 'Ouverte', fermee: 'Fermée', bruyante: 'Bruyante' },
    /** Nom accessible de la commande d'une porte : « Porte de l'atelier, fermée », « …, bruyante » (D-267, D-348). */
    porteLue: (nom: string, ouverte: boolean, bruyante: boolean): string => `${nom}, ${ouverte ? 'ouverte' : 'fermée'}${bruyante ? ', bruyante' : ''}`,
    /** Repères écrits sur la ligne d'une salle (D-267) ; le lecteur d'écran les lit en minuscules après le nom. */
    reperes: { vide: 'Vide', feu: 'Feu', bruit: 'Bruit' },
    /** Sens de la flèche d'une ligne de salle, lu après le nom : où s'ouvre la porte sur la carte (D-349). */
    sens: {
      haut: 'en haut',
      'haut-droite': 'en haut à droite',
      droite: 'à droite',
      'bas-droite': 'en bas à droite',
      bas: 'en bas',
      'bas-gauche': 'en bas à gauche',
      gauche: 'à gauche',
      'haut-gauche': 'en haut à gauche',
    },
    attention: 'Attention',
    sante: { blesse: '! BLESSÉ', critique: '!! CRITIQUE', blesseLu: 'État : blessé', critiqueLu: 'État : critique' },
    sauvegardeEchouee: 'La sauvegarde a échoué. Vous pouvez continuer : elle sera retentée à la prochaine action.',
  },

  /** Fenêtre et paroles d'IA Station (12 §3.9, D-186). */
  ia: {
    entete: '[ IA STATION ]',
    sousTitre: 'messages reçus dans l’écouteur',
    aucunMessage: 'Aucun message reçu.',
    nouveau: 'nouveau',
    parole: 'Parole d’IA Station',
    citation: (texte: string): string => `«\u00a0${texte}\u00a0»`,
  },

  bulle: { etapePrecedente: 'Étape précédente' },

  /** Écran de fin (12 §4.11). */
  fin: {
    entete: '> Fin de la partie_',
    rejouer: 'Rejouer cette station',
  },

  /** Options (12 §4.10, D-287). */
  options: {
    enPause: 'le jeu est en pause',
    sousMenus: { son_texte: 'Son et texte', rapports: 'Rapports', application: 'Application' },
    details: {
      sonTexte: 'taille du texte, son, affichage',
      sonTexteTest: 'taille du texte, son, affichage, carte révélée',
      telecharger: 'télécharger ma partie',
      rapportsEnCours: 'signaler un bug, envoyer ou télécharger ma partie',
      rapportsEnregistree: 'signaler un bug, envoyer ma partie',
      rapportsSansPartie: 'signaler un bug',
      applicationInstallable: 'installation, mise à jour, version',
      application: 'mise à jour, version',
    },
    abandon: {
      confirmation: 'Confirmation d’abandon',
      question: 'Abandonner ? Cette partie ne pourra pas être reprise.',
      abandonner: 'Abandonner',
      bouton: 'Abandonner la partie en cours',
    },
    tailleTexte: 'Taille du texte',
    tailles: { standard: 'Standard', grande: 'Grande', tres_grande: 'Très grande' },
    /** Phrase d'exemple sous le choix de la taille. */
    apercuTaille: 'Un voyant clignote au-dessus de la porte. Rien d’autre ne bouge.',
    son: 'Son',
    general: 'Général',
    effets: 'Effets sonores',
    effetsDetail: 'bips et clics du terminal',
    ambiance: 'Ambiance',
    ambianceDetail: 'bruit brun et carlingue',
    /** Valeur d'un rail à 0, accordée au réglage : le son général, l'ambiance (féminin) ou les effets (pluriel). */
    coupee: 'COUPÉE',
    coupes: 'COUPÉS',
    affichage: 'Affichage',
    balayage: 'Lignes de balayage',
    machineAEcrire: 'Effet machine à écrire',
    carteRevelee: 'Carte révélée (test)',
    oui: '[OUI]',
    non: '[NON]',
    reglagesNonGardes: 'Cet appareil ne garde pas les réglages : ils valent jusqu’à la fermeture du jeu.',
    telecharger: 'Télécharger ma partie',
    telechargerDetail: 'fichier enregistré sur le téléphone',
    fichierPret: (nom: string): string => `Fichier prêt : ${nom}`,
    telechargementEchoue: 'Le téléchargement a échoué. Vous pouvez réessayer.',
    versionTest: (pr: string): string => ` · test PR #${pr}`,
  },

  /** Rapports : lignes des options, panneau et retours (D-142, D-231). */
  rapport: {
    details: {
      partieEnCoursJointe: 'la partie en cours est jointe',
      partieJointe: 'la partie est jointe',
      aucunePartie: 'aucune partie à joindre',
      partie: 'partie et commentaire',
    },
    enAttente: (nombre: number): string =>
      nombre === 1 ? 'Un rapport attend le réseau pour partir.' : `${nombre} rapports attendent le réseau pour partir.`,
    /** Texte montré après ENVOYER. */
    retours: {
      envoye: 'Merci, le rapport est envoyé.',
      garde: 'Pas de réseau. Le rapport est gardé sur le téléphone et partira tout seul à la prochaine connexion.',
      trop: 'Trop d’envois rapprochés. Le rapport est gardé sur le téléphone et partira plus tard.',
      refuse: 'Le service n’a pas accepté ce rapport. Vous pouvez télécharger la partie à la place.',
      perdu: 'Pas de réseau, et ce téléphone ne peut pas garder le rapport. Réessayez plus tard.',
      patience: 'Un rapport vient de partir. Réessayez dans un instant.',
    },
    invites: { bug: 'Ce qui s’est passé, ce que vous attendiez…', partie: 'Votre avis sur la partie…' },
    commentaire: 'Votre commentaire, facultatif',
    joint: {
      partieEnCours: 'Joint : la partie jusqu’ici et l’écran affiché.',
      sansPartie: 'Aucune partie en cours : seul le commentaire part.',
      partieFinie: 'Joint : la partie complète et où elle en est.',
    },
    jeValide: 'Je valide cette aventure',
    signature: (pr: string): string => `signé par ce téléphone · version de test PR #${pr}`,
    cleTelephone: 'Clé de ce téléphone :',
    cleCreeeAEnvoi: 'créée à cet envoi',
    envoyer: 'Envoyer',
    envoi: 'Envoi…',
  },

  /** Clé de validation et vérification automatique d'une version de test (C-10 §4, #180). */
  validation: {
    titre: 'Validation',
    cle: 'Clé de ce téléphone',
    cleIllisible: 'illisible sur ce téléphone : « je valide » partira sans signature',
    cleAbsente: 'pas encore créée : elle le sera au premier « je valide » envoyé',
    cleAComparer: 'à comparer avec celle citée dans la PR',
    verification: 'Vérification automatique :',
    etats: { en_cours: 'en cours', verte: 'verte', echec: 'en échec', inconnue: 'inconnue' },
    enCours: ' — une validation envoyée maintenant ne comptera que si elle finit verte',
    echec: ' — une validation de cette version ne comptera pas',
  },

  /** Installation sur l'écran d'accueil (#174) ; noms des boutons des navigateurs : docs/16 §3.1. */
  installation: {
    titre: 'Installation',
    installer: 'Installer le jeu',
    detail: 's’ouvre en plein écran, sans la barre du navigateur',
    guides: {
      guide_ios: {
        detail: 'marche à suivre pour iPhone et iPad',
        etapes: [
          'Touchez ••• (le bouton « Plus »), puis « Partager ».',
          'Faites défiler la liste, puis touchez « Sur l’écran d’accueil ».',
          'Activez « Ouvrir comme app web ».',
          'Touchez « Ajouter ».',
        ],
        note: 'Onglets en bas ou en haut ? Touchez directement « Partager ». Pas de « Sur l’écran d’accueil » dans la liste ? Touchez « Modifier les actions », en bas, puis « Sur l’écran d’accueil ».',
      },
      guide_firefox: {
        detail: 'marche à suivre pour Firefox',
        etapes: [
          'Touchez ⋮, le menu de Firefox.',
          'Touchez « Plus ».',
          'Touchez « Ajouter l’application à l’écran d’accueil ».',
          'Touchez « Ajouter », puis encore une fois si Android le demande.',
        ],
        note: 'Le jeu s’ouvrira ensuite en plein écran, comme une appli.',
      },
    },
    retours: {
      installee: 'Jeu installé. Cherchez-le sur votre écran d’accueil.',
      refusee: 'Installation refusée. Le menu du navigateur permet de la relancer.',
    },
  },

  /** Mise à jour (D-227). */
  miseAJour: {
    titre: 'Mise à jour',
    installer: 'Installer la nouvelle version',
    chercher: 'Chercher une mise à jour',
    detailEnCours: 'le jeu redémarre, la partie est gardée',
    detail: 'le jeu redémarre s’il en trouve une',
    recherche: 'Recherche en cours…',
    aJour: 'Le jeu est à jour.',
    prete: 'Une nouvelle version est prête.',
    installation: 'Installation de la nouvelle version…',
    echec: 'Impossible de vérifier. Le téléphone est-il connecté ?',
  },
};

"""
Void Walker - Loading Spinner.

Futuristic animated spinner for long-running operations.
"""

import random
import sys
import threading
import time
from typing import Optional


class Colors:
    """ANSI color codes matching the Void Walker color palette."""
    CYAN = "\033[38;2;68;255;255m"      # Info color
    GREEN = "\033[38;2;68;255;68m"      # Success color
    YELLOW = "\033[38;2;255;255;68m"    # Highlight color
    RED = "\033[38;2;255;68;68m"        # Danger color
    GRAY = "\033[38;2;68;68;68m"        # Dim color
    DIM = "\033[2m"                     # Dim text
    BOLD = "\033[1m"                    # Bold text
    RESET = "\033[0m"                   # Reset formatting


class CPUSpinner:
    """Futuristic animated spinner with visualizer."""

    # Futuristic spinner frames
    SPINNER_FRAMES = ["⢿", "⣻", "⣽", "⣾", "⣷", "⣯", "⣟", "⡿"]

    # Braille characters for sound visualizer (bottom-heavy only, no floating dots)
    BRAILLE_CHARS = '⡀⡄⡆⡇⢀⢠⢰⢸⣀⣄⣆⣇⣠⣤⣦⣧⣰⣴⣶⣷⣸⣼⣾⣿'

    # Atmospheric sci-fi flavor texts
    FLAVOR_TEXTS = [
        "Calibration des scanners de l'espace profond",
        "Sondage de signatures stellaires inconnues",
        "Traçage des signaux de vaisseaux épaves",
        "Examen des balises de détresse cryptiques",
        "Vérification des microfissures de la coque",
        "Exécution des protocoles d'isolation",
        "Filtrage des bavardages comm anormaux",
        "Cartographie des distorsions gravitationnelles",
        "Écoute des mouvements dans les conduits",
        "Confirmation de l'intégrité du support-vie",
        "Détection d'une respiration faible",
        "Reconstruction de la télémétrie perdue",
        "Effacement des cartes stellaires corrompues",
        "Suivi des sources de chaleur non identifiées",
        "Alignement des télescopes longue portée",
        "Étude de la turbulence de matière noire",
        "Référencement des signatures aliens",
        "Relecture de l'audio du cockpit brouillé",
        "Vérification de la stabilité des capsules cryo",
        "Grattage des anciens journaux de bord",
        "Analyse de toxicité atmosphérique",
        "Test du blindage contre les radiations",
        "Analyse des marques de griffes sur la cloison",
        "Examen des fragments de boîte noire",
        "Détection d'irrégularités cardiaques",
        "Décryptage de communiqués chiffrés",
        "Scan de résidus biologiques",
        "Recherche de survivants",
        "Vérification de la pureté de l'oxygène",
        "Évaluation de spécimen non classifié",
        "Échantillonnage de spores inconnues",
        "Surveillance du pouls du réacteur",
        "Interprétation des pics du détecteur de mouvement",
        "Vérification des drones de maintenance",
        "Inspection des anomalies du conduit d'air",
        "Examen des logs d'avant-poste abandonné",
        "Suivi des capsules de sauvetage dérivantes",
        "Vérifications du mode furtif",
        "Observation d'anomalies stellaires instables",
        "Neutralisation d'infections potentielles",
        "Examen des profils psychologiques de l'équipage",
        "Recherche de données de recherche cryptées",
        "Interrogation des sous-systèmes d'IA voyous",
        "Écoute de pas métalliques",
        "Estimation du risque d'effondrement structurel",
        "Enquête sur les ID d'équipage manquants",
        "Ajustement des valves de pression cryogénique",
        "Observation de mouvement dans la baie zéro-G",
        "Régulation des grilles d'alimentation d'urgence",
        "Notation des baisses de température",
        "Détection de murmures électromagnétiques",
        "Filtrage des voix fantômes",
        "Vérification des systèmes d'armes dormants",
        "Évaluation de l'activité des nanobots",
        "Reconnaissance d'empreintes inconnues",
        "Marquage de formes de vie non autorisées",
        "Examen des données de quarantaine",
        "Stabilisation des générateurs de gravité",
        "Examen des motifs d'éclaboussures de sang",
        "Analyse des toxines biologiques",
        "Visionnage des flux vidéo corrompus",
        "Accès aux secteurs mémoire restreints",
        "Diagnostic d'exposition au vide",
        "Mesure des tremblements atmosphériques",
        "Vérification d'infestation parasitaire",
        "Détection de bruits de grattage de coque",
        "Examen des dernières trajectoires connues",
        "Enregistrement des fluctuations du sous-espace",
        "Filtrage des boucles de code de détresse",
        "Scan de contamination de l'infirmerie",
        "Comparaison des signatures thermiques",
        "Simulation des voies d'évacuation",
        "Interprétation des runes aliens",
        "Analyse des événements de décompression",
        "Écoute de tapotements lointains",
        "Cartographie des chambres cachées",
        "Suivi des mouvements non autorisés",
        "Renforcement des joints de cloison",
        "Détection de rythmes cardiaques rapides",
        "Traitement d'interférences neuro-lien",
        "Lecture des ordres de mission dégradés",
        "Stabilisation des lignes de refroidissement défaillantes",
        "Notation des lectures environnementales erratiques",
        "Évaluation d'échantillons xéno-biologiques",
        "Projection de scénarios de rupture de coque",
        "Observation d'anomalies de chambre cryo",
        "Ajustement du réseau comm longue portée",
        "Détection d'ombres faibles",
        "Revisite des archives de données fantômes",
        "Surveillance de contamination du liquide de refroidissement",
        "Décryptage de fichiers de mission corrompus",
        "Suivi de biomatière dérivante",
        "Vérifications du système furtif",
        "Prédiction des schémas de mouvement de créature",
        "Notation d'incohérences gravitationnelles",
        "Analyse des logs d'implants neuraux",
        "Décodage de notes de recherche interdites",
        "Surveillance des boucles de balise d'urgence",
        "Révision de la taxonomie des formes de vie hostiles",
        "Examen des surtensions du réseau électrique",
        "Vérification de l'intégrité des trappes d'évacuation",
        "Observation des lumières vacillantes",
        "Enquête sur les empreintes fantômes",
        "Nettoyage des capteurs environnementaux",
        "Détection de vibrations structurelles",
        "Surveillance des couloirs non cartographiés",
        "Scan de substances corrosives",
        "Surveillance de battements cardiaques inconnus",
        "Vérification du silence inquiétant",
        "Traitement des données d'alerte de proximité",
        "Examen des derniers logs audio de l'équipage",
        "Identification de rayures faibles",
        "Traçage des balises d'implants sous-cutanés",
        "Balayage de contamination",
        "Interprétation de bio-schémas aliens",
        "Observation de la détérioration du flux d'oxygène",
        "Écoute des perturbations de conduit",
        "Détection de mouvement masqué",
        "Calcul des métriques d'indice de panique",
        "Localisation des bots de maintenance manquants",
        "Examen des câbles rompus",
        "Surveillance des changements de pression inattendus",
        "Vérification des portes de laboratoire scellées",
        "Vérification croisée des alertes d'intrusion",
        "Détection d'organiques faibles dans l'air",
        "Enquête sur les traces de fluide",
        "Analyse des logs de stase d'urgence",
        "Écoute des impulsions statiques comm",
        "Reconstruction des datapads détruits",
        "Étude de la croissance de tissu synthétique",
        "Prédiction des points de fusion du réacteur",
        "Ajustement du modèle de probabilité de survie",
        "Test d'antidotes non identifiés",
        "Cartographie des zones froides",
        "Détection de respiration non autorisée",
        "Examen des artefacts xénotech",
        "Vérification de l'état des tourelles de sécurité",
        "Traçage des dossiers de spécimen manquants",
        "Relecture de sifflements atmosphériques",
        "Examen des données de labo de clonage",
        "Neutralisation des pathogènes à bord",
        "Journalisation d'odeurs chimiques non identifiées",
        "Observation des logs de rupture de confinement",
        "Surveillance du scintillement des champs de force",
        "Détection des trajectoires d'approche",
        "Enquête sur les niveaux de pont scellés",
        "Traitement des anomalies d'élimination des déchets",
        "Confirmation des signes de vie du sous-pont",
        "Examen du bruit du capteur de vide",
        "Lecture des holo-cartes corrompues",
        "Écoute des échos de vibration",
        "Examen des casques brisés",
        "Étude de fragments squelettiques inconnus",
        "Suivi du comportement d'essaim de nanites",
        "Examen des logs de téléportation échoués",
        "Surveillance des réveils d'unités cryo",
        "Vérification de l'alimentation de navette abandonnée",
        "Interprétation des réverbérations de l'espace profond",
        "Traçage des chemins de migration de formes de vie",
        "Simulation des menaces du pire scénario",
        "Enquête sur les bruits de baie de chargement",
        "Notation des variations de pouls atmosphérique",
        "Cartographie des clusters organiques",
        "Scan de toxines dans les conduits",
        "Surveillance de vibration de réservoir de spécimen",
        "Détection de mouvement dans les zones sombres",
        "Lecture des fluctuations de température",
        "Mise à jour de l'indice de menace interne",
        "Analyse de résidus de phéromones aliens",
        "Suivi des logs de conscience corrompus",
        "Vérification des niveaux d'oxygène de canot",
        "Examen des triangulations de balise",
        "Enquête sur les échos métalliques creux",
        "Mesure des pics de radiation du vide",
        "Séquençage de souches d'ADN inconnues",
        "Notation de schémas de pas erratiques",
        "Surveillance des défaillances de pompe atmosphérique",
        "Examen de combinaisons pressurisées déchiquetées",
        "Détection de clusters de cellules mutées",
        "Interprétation de pings de détresse silencieux",
        "Observation de moniteurs remplis de statique",
        "Scan de poches d'air glacial",
        "Lecture de plaques de coque fracturées",
        "Vérification des logs de drones épaves",
        "Analyse de biomasse pulsante",
        "Suivi de traces luminescentes faibles",
        "Examen d'enregistrements aliens anciens",
        "Surveillance du vide extérieur",
        "Test des lumières de couloir d'évacuation",
        "Observation de tubes de confinement percés",
        "Enquête sur les schémas de souffle froid",
        "Mesure des lectures de dérive chronal",
        "Détection d'entités non enregistrées",
        "Évaluation de signatures de masse cachées",
        "Scan de boucles de battement cardiaque irrégulier",
        "Vérification des coins d'ingénierie non éclairés",
        "Lecture des logs environnementaux dégradés",
        "Capture d'harmoniques vocales inconnues",
        "Enquête sur les vibrations du sous-pont",
        "Vérification de votre position actuelle",
    ]

    def __init__(self, message: str = None):
        """
        Initialize the spinner.

        Args:
            message: Message to display with the spinner (if None, uses random flavor texts)
        """
        self.use_flavor_texts = (message is None)
        self.message = message or random.choice(self.FLAVOR_TEXTS)
        self.running = False
        self.thread: Optional[threading.Thread] = None
        self._frame_index = 0
        self._message_timer = 0
        self._message_change_interval = 40  # Change every 4 seconds (40 * 0.1s)

        # Sound visualizer state
        self.viz_bars = [random.random() for _ in range(12)]
        self.viz_velocities = [(random.random() - 0.5) * 0.05 for _ in range(12)]

    def _get_sound_visualizer(self) -> str:
        """
        Generate an animated Braille sound visualizer.

        Returns:
            String of Braille characters representing sound waves
        """
        output = ""
        for i in range(len(self.viz_bars)):
            # Update bar positions
            self.viz_bars[i] += self.viz_velocities[i]

            # Bounce at edges
            if self.viz_bars[i] > 1 or self.viz_bars[i] < 0:
                self.viz_velocities[i] *= -1
                self.viz_bars[i] = max(0, min(1, self.viz_bars[i]))

            # Random velocity changes for organic movement
            if random.random() < 0.02:
                self.viz_velocities[i] += (random.random() - 0.5) * 0.03
                self.viz_velocities[i] = max(-0.08, min(0.08, self.viz_velocities[i]))

            # Map bar value to Braille character
            idx = int(self.viz_bars[i] * (len(self.BRAILLE_CHARS) - 1))
            output += self.BRAILLE_CHARS[idx]

        return f"{Colors.GREEN}[{output}]{Colors.RESET}"

    def _animate(self) -> None:
        """Animation loop running in separate thread."""
        max_line_length = 0

        while self.running:
            # Change flavor text every 4 seconds if using flavor texts
            if self.use_flavor_texts:
                self._message_timer += 1
                if self._message_timer >= self._message_change_interval:
                    self.message = random.choice(self.FLAVOR_TEXTS)
                    self._message_timer = 0

            frame = self.SPINNER_FRAMES[self._frame_index % len(self.SPINNER_FRAMES)]
            sound_viz = self._get_sound_visualizer()

            # Build the output line with colors
            output = f"{Colors.CYAN}{frame}{Colors.RESET} {Colors.DIM}{self.message}…{Colors.RESET} {sound_viz}"

            # Track the longest line to ensure proper clearing
            # Account for ANSI codes by measuring visible characters
            visible_length = len(frame) + len(self.message) + 2 + len(sound_viz)  # +2 for "… "
            max_line_length = max(max_line_length, visible_length)

            # Clear the line completely and write new output
            sys.stdout.write("\r" + " " * (max_line_length + 50) + "\r")
            sys.stdout.write(output)
            sys.stdout.flush()

            self._frame_index += 1
            time.sleep(0.1)

    def start(self) -> None:
        """Start the spinner animation."""
        if not self.running:
            self.running = True
            self.thread = threading.Thread(target=self._animate, daemon=True)
            self.thread.start()

    def stop(self) -> None:
        """Stop the spinner animation and clear the line."""
        if self.running:
            self.running = False
            if self.thread:
                self.thread.join(timeout=0.5)
            # Clear the spinner line completely
            sys.stdout.write("\r" + " " * 200 + "\r")
            sys.stdout.flush()

    def __enter__(self):
        """Context manager entry."""
        self.start()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit."""
        self.stop()
        return False

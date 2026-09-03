// ---------------------------------------------------------------------------
// src/content/templates/actionCoverage.ts — Dedicated templates for verbs that
// previously fell through to the category-level fallbacks
// ---------------------------------------------------------------------------
// P2 (variété narrative). These verbs show up in real play but had no
// verb-specific text, so every attempt produced the same generic sentence for
// its whole category. Each cell carries two variants.
//
// Auto verbs (DROP, EQUIP, DRINK, TOUCH) only ever resolve to 'auto_success'.
// Non-auto verbs cover the outcomes the resolver can actually produce; missing
// tension tiers are absorbed by the composer's relaxed fallback.
//
// Never start a sentence with {def_target} — it renders lowercase ("le sas").
// ---------------------------------------------------------------------------

import type { VerbId } from '../../engine/verbs';
import type { ActionTemplate, Outcome, TensionTier, VerbCategory } from '../../narration/types';

type CoverageSpec = readonly [
  outcome: Outcome,
  tension: TensionTier,
  texts: readonly [string, string],
];

function coverage(
  verb: VerbId,
  category: VerbCategory,
  specs: readonly CoverageSpec[],
): readonly ActionTemplate[] {
  return specs.flatMap(([outcome, tension, texts]) =>
    texts.map((fr, i): ActionTemplate => ({
      id: `${category}_${verb}_any_${outcome}_${tension}_c${i + 1}`,
      verb,
      targetType: null,
      outcome,
      tension,
      category,
      text: { fr, en: '' },
    })),
  );
}

// ============================================================================
// PUSH — physical (FOR)
// ============================================================================

const PUSH_TEMPLATES = coverage('PUSH', 'physical', [
  ['crit_success', 'mid', [
    '{actor} placez l\'épaule au bon endroit et poussez{?tool_used: en vous appuyant sur {def_tool}|} : {def_target} glisse bien plus loin que nécessaire et dégage tout le passage.',
    'Le levier idéal, l\'angle idéal{?tool_used:, {def_tool} calée dessous|}. Une seule poussée déplace {def_target} comme s\'il ne pesait rien.',
  ]],
  ['success', 'low', [
    '{actor} poussez {def_target}{?tool_used: en prenant appui sur {def_tool}|}. Ça racle, ça grince, ça avance.',
    'Un effort régulier suffit : {def_target} recule de quelques dizaines de centimètres, assez pour passer.',
  ]],
  ['success', 'mid', [
    '{actor} vous arc-boutez contre {def_target}{?tool_used: avec {def_tool}|} et poussez jusqu\'à ce que ça bouge. Le raclement s\'entend jusqu\'au bout du couloir.',
    'Vous poussez, vous soufflez, vous recommencez{?tool_used:, {def_tool} en renfort|}, et {def_target} finit par céder du terrain.',
  ]],
  ['success', 'high', [
    '{actor} jetez tout votre poids contre {def_target}{?tool_used: et {def_tool}|}. Ça bouge — pas élégamment, mais ça bouge.',
    'Pas le temps de calculer l\'angle : vous poussez de toutes vos forces et {def_target} s\'écarte assez pour vous laisser passer.',
  ]],
  ['partial', 'mid', [
    '{actor} déplacez {def_target} de quelques centimètres à peine{?tool_used: malgré {def_tool}|}. L\'ouverture existe ; elle est trop étroite.',
    'La masse glisse, puis se coince sur quelque chose. La poussée s\'arrête net{?tool_used: et {def_tool} ripe|}.',
  ]],
  ['failure', 'low', [
    '{actor} poussez {def_target} sans obtenir le moindre déplacement{?tool_used:, y compris avec {def_tool}|}. Trop lourd, ou fixé au pont.',
    'La masse ne bouge pas d\'un millimètre. Vos semelles glissent, et c\'est tout ce que vous obtenez.',
  ]],
  ['failure', 'mid', [
    '{actor} vous arc-boutez encore une fois{?tool_used:, {def_tool} pliant sous l\'effort|}. Rien à faire : {def_target} est ancré plus solidement que vous ne l\'êtes.',
    'Impossible. La friction est trop forte, ou le blocage vient de l\'autre côté{?tool_used: — {def_tool} n\'y peut rien|}.',
  ]],
  ['crit_failure', 'mid', [
    '{actor} poussez et {def_target} bascule dans le mauvais sens. Le fracas est considérable ; le silence qui suit, pire encore.',
    'Votre appui lâche. Vous partez en avant, le genou contre le pont{?tool_used:, {def_tool} filant sous {def_target}|} — et rien n\'a bougé.',
  ]],
]);

// ============================================================================
// PULL — physical (FOR)
// ============================================================================

const PULL_TEMPLATES = coverage('PULL', 'physical', [
  ['crit_success', 'mid', [
    '{actor} tirez d\'un mouvement continu, sans à-coup{?tool_used:, {def_tool} bien calée|} : {def_target} vient d\'un bloc, proprement, sans rien casser.',
    'Un point de traction parfait, et tout le reste suit. Vous dégagez {def_target}{?tool_used: à l\'aide de {def_tool}|} en un seul geste maîtrisé.',
  ]],
  ['success', 'low', [
    '{actor} tirez sur {def_target}{?tool_used: avec {def_tool}|}. Ça vient lentement, dans un raclement de métal fatigué.',
    'La traction demande de la patience plus que de la force, mais {def_target} finit par suivre.',
  ]],
  ['success', 'mid', [
    '{actor} tirez à deux mains{?tool_used:, {def_tool} enroulée autour|}, et {def_target} se déplace par à-coups pendant que vos épaules protestent.',
    'Il faut trois tentatives et beaucoup de jurons{?tool_used: avant que {def_tool} ne trouve prise|}, mais la traction finit par payer.',
  ]],
  ['success', 'high', [
    '{actor} tirez comme si votre vie en dépendait — c\'est peut-être le cas{?tool_used:, {def_tool} mordant enfin|}. Ça vient.',
    'Un arrachement brutal, sans finesse{?tool_used: ; {def_tool} tient bon|} : {def_target} suit, et vous ne regardez pas dans quel état.',
  ]],
  ['partial', 'mid', [
    '{actor} déplacez {def_target} de moitié avant que la prise ne lâche{?tool_used:, {def_tool} glissant de vos doigts|}. Il faudra recommencer.',
    'La traction arrache une partie de {def_target} et laisse le reste en place. Résultat mitigé, mais pas nul.',
  ]],
  ['failure', 'low', [
    '{actor} tirez sans résultat{?tool_used:, malgré {def_tool}|}. La prise est mauvaise, l\'ancrage excellent.',
    'Rien ne vient. Vos mains glissent sur une surface trop lisse pour offrir quoi que ce soit.',
  ]],
  ['failure', 'mid', [
    '{actor} tirez jusqu\'à voir des points noirs{?tool_used:, {def_tool} vibrant dans vos paumes|}. Sans effet : {def_target} n\'a pas bougé.',
    'L\'effort ne mène nulle part et se paie en douleurs d\'épaule. Il faut une autre approche.',
  ]],
  ['crit_failure', 'mid', [
    '{actor} tirez trop fort, la prise cède, et vous partez en arrière. La nuque contre une console, le souffle coupé{?tool_used:, {def_tool} perdue quelque part|}.',
    'Quelque chose se déchire — dans votre dos, pas dans {def_target}. La douleur vous plie en deux.',
  ]],
]);

// ============================================================================
// ACTIVATE — technical (INT)
// ============================================================================

const ACTIVATE_TEMPLATES = coverage('ACTIVATE', 'technical', [
  ['crit_success', 'mid', [
    '{actor} lancez la séquence exacte du premier coup{?tool_used:, {def_tool} servant de relais|} : {def_target} s\'éveille en pleine puissance, sans le moindre défaut.',
    'L\'initialisation est parfaite. Non seulement {def_target} démarre, mais il vous ouvre des fonctions que personne n\'avait activées depuis des années.',
  ]],
  ['success', 'low', [
    '{actor} mettez {def_target} en marche{?tool_used: via {def_tool}|}. Les voyants s\'allument un à un, dans le bon ordre.',
    'La séquence de démarrage prend son temps, puis aboutit. Le système est opérationnel.',
  ]],
  ['success', 'mid', [
    '{actor} activez {def_target}{?tool_used: en dérivant l\'alimentation par {def_tool}|}. Le système démarre en toussant, mais il démarre.',
    'Deux tentatives, un contact nettoyé{?tool_used: avec {def_tool}|}, et {def_target} se met en route dans un ronronnement inquiétant.',
  ]],
  ['success', 'high', [
    '{actor} enfoncez la commande sans lire les avertissements{?tool_used:, {def_tool} coincée dans le boîtier|}, et {def_target} s\'allume. C\'est déjà ça.',
    'Le démarrage se fait dans l\'urgence, à l\'arrache{?tool_used: grâce à {def_tool}|}. Les protocoles de sécurité, eux, restent en rade.',
  ]],
  ['partial', 'mid', [
    '{actor} obtenez un démarrage partiel de {def_target}{?tool_used: via {def_tool}|}. La moitié des fonctions répondent ; l\'autre reste noire.',
    'Le système s\'éveille, hésite, retombe en veille. Il manque une alimentation, ou une autorisation.',
  ]],
  ['failure', 'low', [
    '{actor} pressez la commande de {def_target} sans le moindre effet{?tool_used:, y compris via {def_tool}|}. Aucun courant n\'arrive jusqu\'ici.',
    'Rien ne s\'allume. Le circuit est coupé bien en amont de ce que vous pouvez atteindre.',
  ]],
  ['failure', 'mid', [
    '{actor} tentez toutes les séquences que vous connaissez{?tool_used: en passant par {def_tool}|}. Sans succès : {def_target} refuse obstinément de s\'éveiller.',
    'L\'écran affiche un code d\'erreur que vous ne connaissez pas. Trois fois de suite, le même.',
  ]],
  ['crit_failure', 'mid', [
    '{actor} activez {def_target} et déclenchez autre chose en même temps. Une alarme, une porte qui se verrouille, un bruit lointain qui se rapproche.',
    'La mise sous tension provoque un court-circuit{?tool_used: qui remonte par {def_tool}|}. L\'odeur d\'isolant brûlé envahit la pièce.',
  ]],
]);

// ============================================================================
// DEACTIVATE — technical (INT)
// ============================================================================

const DEACTIVATE_TEMPLATES = coverage('DEACTIVATE', 'technical', [
  ['crit_success', 'mid', [
    '{actor} coupez {def_target} proprement, dans l\'ordre prévu par le manuel{?tool_used:, {def_tool} en appui|}. Aucun sursaut, aucune alarme.',
    'L\'extinction est nette et réversible. Vous pourrez le rallumer plus tard — un détail qui pourrait tout changer.',
  ]],
  ['success', 'low', [
    '{actor} éteignez {def_target}{?tool_used: à l\'aide de {def_tool}|}. Les voyants s\'effacent un à un, et le bourdonnement cesse.',
    'La procédure d\'arrêt fonctionne. Le silence qui remplace le bruit paraît soudain très épais.',
  ]],
  ['success', 'mid', [
    '{actor} interrompez {def_target}{?tool_used: en débranchant avec {def_tool}|}. Le système proteste brièvement avant de céder.',
    'Vous coupez l\'alimentation à la source, et {def_target} s\'éteint — non sans laisser un voyant de secours allumé.',
  ]],
  ['success', 'high', [
    '{actor} arrachez l\'alimentation de {def_target}{?tool_used: avec {def_tool}|}. Pas propre, mais efficace : ça s\'arrête.',
    'Le temps manque pour la procédure : vous coupez tout d\'un coup{?tool_used: grâce à {def_tool}|} et espérez que ça suffise.',
  ]],
  ['partial', 'mid', [
    '{actor} réduisez {def_target} au silence sans l\'éteindre complètement{?tool_used: malgré {def_tool}|}. Une partie tourne encore, quelque part.',
    'L\'arrêt est partiel. Les fonctions principales s\'éteignent, mais quelque chose continue de veiller.',
  ]],
  ['failure', 'low', [
    '{actor} cherchez comment couper {def_target} et ne trouvez aucun interrupteur{?tool_used:, {def_tool} inutile ici|}.',
    'Le système ignore votre commande d\'arrêt. Il n\'était pas prévu qu\'on l\'éteigne.',
  ]],
  ['failure', 'mid', [
    '{actor} tentez de couper {def_target}{?tool_used: via {def_tool}|} sans y parvenir. L\'alimentation est redondante, et vous ne la maîtrisez pas.',
    'Chaque coupure est immédiatement compensée. Quelque chose, ailleurs, tient à ce que ça continue de tourner.',
  ]],
  ['crit_failure', 'mid', [
    '{actor} coupez le mauvais circuit. Les lumières s\'éteignent — toutes{?tool_used:, et {def_tool} disparaît dans le noir|}. Le vaisseau devient très silencieux.',
    'L\'arrêt brutal déclenche un protocole de sécurité : {def_target} se verrouille, et un signal part vers un endroit que vous ne connaissez pas.',
  ]],
]);

// ============================================================================
// SCAN — perception (PER)
// ============================================================================

const SCAN_TEMPLATES = coverage('SCAN', 'perception', [
  ['crit_success', 'mid', [
    '{actor} passez {def_target} au crible{?tool_used: avec {def_tool}|}. La lecture est complète : composition, anomalies, et une signature qui n\'aurait pas dû être là.',
    'Le relevé est parfait. Tout ce que {def_target} cachait apparaît d\'un coup, jusqu\'aux détails que vous n\'aviez pas pensé chercher.',
  ]],
  ['success', 'low', [
    '{actor} scannez {def_target}{?tool_used: à l\'aide de {def_tool}|}. Les données arrivent lentement, mais elles arrivent.',
    'Le balayage donne un profil correct : densité, température, absence de mouvement. Rien d\'alarmant.',
  ]],
  ['success', 'mid', [
    '{actor} obtenez un relevé exploitable de {def_target}{?tool_used: via {def_tool}|}. Deux valeurs sortent de la normale — retenez-les.',
    'Le scan traverse les interférences et rapporte l\'essentiel. Ce qui manque, vous le devinerez.',
  ]],
  ['success', 'high', [
    '{actor} lancez un balayage en marchant{?tool_used:, {def_tool} tenue à bout de bras|}. Les données sont sales, mais suffisantes.',
    'Une passe rapide, un résultat partiel qui suffit à décider. Bougez avant la fin du relevé.',
  ]],
  ['partial', 'mid', [
    '{actor} obtenez un relevé brouillé de {def_target}{?tool_used: — {def_tool} peine|}. Les grandes lignes seulement ; le reste est du bruit.',
    'Le scan revient incomplet. Quelque chose dans l\'environnement perturbe la lecture, et vous ne savez pas quoi.',
  ]],
  ['failure', 'low', [
    '{actor} balayez {def_target} sans obtenir de données exploitables{?tool_used:, {def_tool} affichant une erreur de calibrage|}.',
    'Le relevé ne donne rien : trop de parasites, trop de métal, trop de tout.',
  ]],
  ['failure', 'mid', [
    '{actor} insistez{?tool_used: avec {def_tool}|} et n\'obtenez qu\'un écran de neige. L\'analyse ne passera pas ici.',
    'Aucune lecture cohérente. Le matériel est à bout, ou l\'objet refuse d\'être lu.',
  ]],
  ['crit_failure', 'mid', [
    '{actor} lancez le balayage à pleine puissance. L\'émission attire quelque chose : vous entendez la réponse avant de lire le résultat.',
    'Le scanner surchauffe et s\'éteint{?tool_used: — {def_tool} est hors service|}. Vous êtes désormais aveugle sur ce point.',
  ]],
]);

// ============================================================================
// LISTEN — perception (PER)
// ============================================================================

const LISTEN_TEMPLATES = coverage('LISTEN', 'perception', [
  ['crit_success', 'mid', [
    '{actor} vous immobilisez complètement et écoutez. Sous le ronronnement des recycleurs, vous isolez un son qui n\'appartient à aucune machine.',
    'L\'oreille contre la cloison, vous cartographiez le vaisseau par le bruit. Ce que vous entendez vous dit exactement où ne pas aller.',
  ]],
  ['success', 'low', [
    '{actor} tendez l\'oreille. Le vaisseau craque, souffle, goutte — la routine d\'une épave.',
    'Quelques secondes d\'écoute suffisent à situer les sons habituels. Rien de neuf, et c\'est déjà une information.',
  ]],
  ['success', 'mid', [
    '{actor} écoutez en retenant votre souffle. Un son revient périodiquement, régulier, et il ne vient pas de la ventilation.',
    'Le silence n\'est jamais complet ici. Vous y distinguez un frottement lointain, sans pouvoir le situer précisément.',
  ]],
  ['success', 'high', [
    '{actor} vous figez une seconde pour écouter. C\'est proche. Plus proche que la dernière fois.',
    'Un instant d\'écoute, une certitude désagréable : ce qui bouge dans le couloir n\'est pas de la tuyauterie.',
  ]],
  ['partial', 'mid', [
    '{actor} percevez quelque chose sans pouvoir l\'identifier. Un son organique, peut-être. Peut-être pas.',
    'L\'écoute donne une direction approximative et rien de plus. Le vaisseau brouille tout.',
  ]],
  ['failure', 'low', [
    '{actor} écoutez longuement et n\'entendez que le bourdonnement des systèmes de survie.',
    'Rien. Le silence est complet, et ce n\'est pas nécessairement rassurant.',
  ]],
  ['failure', 'mid', [
    '{actor} tentez d\'isoler un son utile dans le vacarme des machines. Peine perdue.',
    'Le bruit de fond couvre tout. Vous perdez de précieuses secondes à écouter du vide.',
  ]],
  ['crit_failure', 'mid', [
    '{actor} vous concentrez tellement sur les sons lointains que vous manquez le plus proche. Il est derrière vous.',
    'L\'écoute vous immobilise trop longtemps. Quand vous rouvrez les yeux, quelque chose a changé de place dans la pièce.',
  ]],
]);

// ============================================================================
// SMELL — perception (PER)
// ============================================================================

const SMELL_TEMPLATES = coverage('SMELL', 'perception', [
  ['crit_success', 'mid', [
    '{actor} identifiez l\'odeur immédiatement : réactif, précis, dangereux. Vous savez ce qui a fui, et depuis combien de temps.',
    'Le nez ne ment pas. Sous la pourriture, une note chimique vous indique la nature du problème — et sa source.',
  ]],
  ['success', 'low', [
    '{actor} reniflez prudemment. Métal froid, poussière, huile — l\'odeur d\'un vaisseau à l\'arrêt.',
    'L\'air porte une odeur de vieux filtre et de renfermé. Désagréable, sans plus.',
  ]],
  ['success', 'mid', [
    '{actor} percevez une odeur qui n\'a rien à faire ici. Douceâtre, organique, insistante.',
    'Sous l\'air recyclé perce quelque chose de fermenté. Ce n\'est pas une fuite technique.',
  ]],
  ['success', 'high', [
    '{actor} inspirez une fois et le regrettez immédiatement. Ça sent le sang, et il est frais.',
    'L\'odeur vous saute au visage : brûlé, acide, vivant. Ne restez pas là.',
  ]],
  ['partial', 'mid', [
    '{actor} distinguez une odeur inhabituelle sans parvenir à la nommer. Elle vous met mal à l\'aise, et c\'est tout ce qu\'elle vous dit.',
    'Quelque chose flotte dans l\'air, à la limite du perceptible. Une trace, pas une information.',
  ]],
  ['failure', 'low', [
    '{actor} ne sentez rien de particulier. L\'air recyclé a depuis longtemps effacé les nuances.',
    'Les filtres ont fait leur travail : il ne reste aucune odeur exploitable.',
  ]],
  ['failure', 'mid', [
    '{actor} cherchez une piste olfactive et n\'obtenez que l\'âcreté des conduits. Votre nez sature.',
    'Trop de fumée, trop de désinfectant. Impossible de distinguer quoi que ce soit d\'utile.',
  ]],
  ['crit_failure', 'mid', [
    '{actor} inspirez profondément et le regrettez aussitôt. Quelque chose de volatil vous brûle les sinus, et la toux qui suit s\'entend loin.',
    'L\'odeur est un avertissement que vous comprenez trop tard. Vos yeux pleurent, votre gorge se serre, et vous devez reculer.',
  ]],
]);

// ============================================================================
// JUMP — physical (AGI)
// ============================================================================

const JUMP_TEMPLATES = coverage('JUMP', 'physical', [
  ['crit_success', 'mid', [
    '{actor} prenez votre appel au millimètre et franchissez la distance sans même y penser. Réception parfaite, silencieuse.',
    'L\'élan, la détente, la retombée : tout s\'enchaîne comme à l\'entraînement. Vous atterrissez plus loin que nécessaire.',
  ]],
  ['success', 'low', [
    '{actor} sautez sans difficulté. La distance était courte, la gravité clémente.',
    'Un appel, un saut, une réception un peu lourde. Rien de cassé.',
  ]],
  ['success', 'mid', [
    '{actor} franchissez l\'obstacle d\'un bond mal assuré. Vous vous rattrapez de justesse au bord.',
    'Le saut passe, avec quelques centimètres de marge. Vos genoux encaissent le reste.',
  ]],
  ['success', 'high', [
    '{actor} sautez sans regarder ce qu\'il y a en dessous. Vous atterrissez, vous continuez.',
    'L\'élan de la peur ajoute un mètre à votre détente. Vous êtes de l\'autre côté avant d\'avoir décidé de sauter.',
  ]],
  ['partial', 'mid', [
    '{actor} atteignez l\'autre bord de justesse, mais la réception est catastrophique. Vous êtes passé ; vous boitez.',
    'Le saut est trop court. Vous vous rattrapez au rebord, les jambes dans le vide, et remontez à la force des bras.',
  ]],
  ['failure', 'low', [
    '{actor} évaluez la distance et renoncez à mi-élan. Ça ne passera pas comme ça.',
    'L\'appel est mauvais, le saut avorte. Vous revenez à votre point de départ, un peu ridicule.',
  ]],
  ['failure', 'mid', [
    '{actor} sautez trop court et retombez du mauvais côté. L\'obstacle est toujours là, et vous avez mal partout.',
    'La distance était surévaluée. Vous n\'avez pas les jambes pour ça — pas dans cet état.',
  ]],
  ['crit_failure', 'mid', [
    '{actor} glissez au moment de l\'appel. La chute est courte et brutale, et quelque chose craque dans votre cheville.',
    'Le saut se termine dans les débris. Le bruit de votre atterrissage résonne dans tout le module.',
  ]],
]);

// ============================================================================
// DODGE — physical (AGI)
// ============================================================================

const DODGE_TEMPLATES = coverage('DODGE', 'physical', [
  ['crit_success', 'mid', [
    '{actor} lisez le mouvement avant qu\'il ne parte et vous effacez complètement. Rien ne vous touche — et vous êtes déjà en position de riposte.',
    'Un pas de côté au moment exact. Ce qui devait vous atteindre percute la cloison derrière vous.',
  ]],
  ['success', 'low', [
    '{actor} vous écartez sans difficulté. La menace était lente, prévisible.',
    'Un simple pas suffit à éviter le contact. Rien de spectaculaire.',
  ]],
  ['success', 'mid', [
    '{actor} esquivez de justesse, l\'épaule contre le montant. Ça passe à quelques centimètres.',
    'Vous vous jetez sur le côté au dernier instant. La douleur du choc au sol vaut mieux que l\'alternative.',
  ]],
  ['success', 'high', [
    '{actor} plongez sans réfléchir. Quelque chose passe là où vous étiez une demi-seconde plus tôt.',
    'L\'esquive est un réflexe, pas une décision. Vous êtes vivant, c\'est le principal.',
  ]],
  ['partial', 'mid', [
    '{actor} évitez l\'essentiel du contact, pas la totalité. Une éraflure profonde le long du bras.',
    'L\'esquive arrive une fraction de seconde trop tard. Vous encaissez de biais et perdez l\'équilibre.',
  ]],
  ['failure', 'low', [
    '{actor} anticipez mal et vous décalez du mauvais côté. Rien de grave, mais rien d\'utile non plus.',
    'L\'esquive part trop tôt. Vous êtes hors position quand il aurait fallu être ailleurs.',
  ]],
  ['failure', 'mid', [
    '{actor} ne bougez pas assez vite. L\'impact vous cueille de plein fouet et vous plaque contre la cloison.',
    'Les jambes ne suivent plus. Ce que vous vouliez éviter vous atteint sans difficulté.',
  ]],
  ['crit_failure', 'mid', [
    '{actor} vous jetez de côté et percutez une console. Le souffle coupé, au sol, à découvert — la pire position possible.',
    'L\'esquive vous envoie exactement là où il ne fallait pas aller. Vous comprenez votre erreur en atterrissant.',
  ]],
]);

// ============================================================================
// DISTRACT — social (CHA)
// ============================================================================

const DISTRACT_TEMPLATES = coverage('DISTRACT', 'social', [
  ['crit_success', 'mid', [
    '{actor} créez exactement le bon leurre au bon endroit, et {def_target} se détourne complètement. Il ne vous cherchera pas de ce côté.',
    'Un bruit lancé au loin, une lumière au mauvais endroit : {def_target} part dans la direction opposée et n\'en revient pas de sitôt.',
  ]],
  ['success', 'low', [
    '{actor} détournez brièvement l\'attention de {def_target}. Quelques secondes, c\'est peu, mais c\'est acquis.',
    'Le stratagème fonctionne à moitié : {def_target} regarde ailleurs assez longtemps pour que vous bougiez.',
  ]],
  ['success', 'mid', [
    '{actor} obtenez de {def_target} qu\'il regarde ailleurs. La fenêtre est courte — utilisez-la maintenant.',
    'Un objet lancé, un son au bon moment, et l\'attention de {def_target} se déplace. Ça ne durera pas.',
  ]],
  ['success', 'high', [
    '{actor} improvisez une diversion en pleine panique. Contre toute attente, {def_target} mord.',
    'Le leurre est grossier, mais il tient trois secondes. Trois secondes, c\'est parfois tout ce qu\'il faut.',
  ]],
  ['partial', 'mid', [
    '{actor} attirez l\'attention de {def_target} à moitié. Il hésite, se tourne, puis revient sur vous.',
    'La diversion marche, mais pas assez longtemps : {def_target} reprend sa surveillance avant que vous n\'ayez fini.',
  ]],
  ['failure', 'low', [
    '{actor} tentez une diversion que {def_target} ignore complètement. Le leurre était trop évident.',
    'Rien ne se passe : {def_target} ne détourne même pas la tête.',
  ]],
  ['failure', 'mid', [
    '{actor} lancez votre diversion trop tôt, et {def_target} identifie la manœuvre. Son attention se resserre sur vous.',
    'Le stratagème tombe à plat. Pire : {def_target} sait maintenant qu\'il y a quelqu\'un.',
  ]],
  ['crit_failure', 'mid', [
    '{actor} attirez l\'attention — la vôtre, précisément : {def_target} vient droit sur la source du bruit, et c\'est vous.',
    'La diversion se retourne complètement : ce que vous vouliez éloigner se trouve maintenant entre vous et la sortie.',
  ]],
]);

// ============================================================================
// DECEIVE — social (CHA)
// ============================================================================

const DECEIVE_TEMPLATES = coverage('DECEIVE', 'social', [
  ['crit_success', 'mid', [
    '{actor} construisez un mensonge si cohérent qu\'il devient plus crédible que la vérité : {def_target} y croit, et agira en conséquence.',
    'Le ton, le détail, l\'hésitation calculée : {def_target} ne doute pas une seconde. Vous venez de gagner bien plus qu\'un répit.',
  ]],
  ['success', 'low', [
    '{actor} mentez avec assez d\'aplomb pour que {def_target} laisse passer. Ce n\'est pas de la confiance, c\'est du désintérêt.',
    'L\'histoire tient debout : {def_target} l\'accepte sans enthousiasme et passe à autre chose.',
  ]],
  ['success', 'mid', [
    '{actor} racontez ce qu\'il faut, dans l\'ordre qu\'il faut, et {def_target} vous croit — pour l\'instant.',
    'Le mensonge passe, à condition de ne pas insister. Changez de sujet maintenant.',
  ]],
  ['success', 'high', [
    '{actor} improvisez une version des faits qui vous arrange. Dans la panique, {def_target} n\'a ni le temps ni l\'envie de vérifier.',
    'La peur rend crédule : {def_target} avale votre histoire sans la questionner, et ça vous laisse une ouverture.',
  ]],
  ['partial', 'mid', [
    '{actor} obtenez un doute plutôt qu\'une adhésion : {def_target} ne vous croit pas vraiment, mais n\'agit pas contre vous.',
    'Le mensonge est à moitié acheté : {def_target} garde ses distances sans vous démentir.',
  ]],
  ['failure', 'low', [
    '{actor} mentez mal. Rien n\'est dit, mais quelque chose s\'est refermé dans le regard de {def_target}.',
    'L\'histoire ne tient pas : {def_target} vous laisse finir par politesse, sans y croire une seconde.',
  ]],
  ['failure', 'mid', [
    '{actor} vous contredisez en deux phrases, {def_target} le relève, et le silence qui suit est très inconfortable.',
    'Le mensonge s\'effondre sous son propre poids. Vous auriez mieux fait de vous taire.',
  ]],
  ['crit_failure', 'mid', [
    '{actor} racontez précisément ce que {def_target} sait être faux. La confiance disparaît d\'un coup, et l\'hostilité prend sa place.',
    'Votre version des faits se heurte à ce que {def_target} a vu de ses propres yeux. Vous venez de vous désigner vous-même.',
  ]],
]);

// ============================================================================
// AUTO VERBS — a single outcome, three tension tiers
// ============================================================================

const DROP_TEMPLATES = coverage('DROP', 'interaction', [
  ['auto_success', 'low', [
    '{actor} laissez tomber {def_target} au sol. Le bruit se perd dans le silence de la pièce.',
    'Vous posez {def_target} à terre sans regret. Un poids en moins.',
  ]],
  ['auto_success', 'mid', [
    '{actor} vous débarrassez de {def_target}. L\'objet roule un peu avant de s\'immobiliser contre une cloison.',
    'Un geste, et {def_target} rejoint le sol. Vous notez mentalement l\'endroit, au cas où.',
  ]],
  ['auto_success', 'high', [
    '{actor} lâchez {def_target} sans ralentir. Le bruit de la chute est le cadet de vos soucis.',
    'L\'objet vous encombrait. Il tombe derrière vous et vous continuez à courir.',
  ]],
]);

const EQUIP_TEMPLATES = coverage('EQUIP', 'interaction', [
  ['auto_success', 'low', [
    '{actor} équipez {def_target}. Le poids se répartit, la prise se cale — ça change immédiatement quelque chose.',
    'Vous mettez {def_target} en position d\'usage. Prêt, pour ce que ça vaut.',
  ]],
  ['auto_success', 'mid', [
    '{actor} passez {def_target} à portée immédiate. Mieux vaut l\'avoir en main que dans un sac.',
    'L\'équipement se met en place en quelques gestes, et {def_target} devient une extension de vous.',
  ]],
  ['auto_success', 'high', [
    '{actor} empoignez {def_target} sans ralentir. Si ça doit servir, ce sera maintenant.',
    'Pas le temps d\'ajuster quoi que ce soit : {def_target} est en main, et ça devra suffire.',
  ]],
]);

const DRINK_TEMPLATES = coverage('DRINK', 'interaction', [
  ['auto_success', 'low', [
    '{actor} buvez {def_target}. Le goût est infect ; l\'effet, réel.',
    'Quelques gorgées suffisent. La gorge se dénoue, et le monde redevient légèrement supportable.',
  ]],
  ['auto_success', 'mid', [
    '{actor} avalez {def_target} d\'un trait, sans respirer. On ne savoure pas dans un endroit pareil.',
    'Le liquide descend, tiède et métallique. Vous essuyez votre bouche d\'un revers de manche.',
  ]],
  ['auto_success', 'high', [
    '{actor} buvez en marchant, la moitié se répandant sur votre combinaison. L\'essentiel passe.',
    'Trois gorgées volées entre deux couloirs. Ce sera tout ce que vous obtiendrez avant longtemps.',
  ]],
]);

const TOUCH_TEMPLATES = coverage('TOUCH', 'interaction', [
  ['auto_success', 'low', [
    '{actor} posez la main sur {def_target}. Froid, lisse, rien d\'inattendu.',
    'Du bout des doigts, vous suivez la surface de {def_target}. La texture vous en dit plus qu\'un regard.',
  ]],
  ['auto_success', 'mid', [
    '{actor} effleurez {def_target}. Il y a une vibration là-dedans, faible et régulière — quelque chose fonctionne encore.',
    'Le contact est bref et désagréable : {def_target} est humide là où rien ne devrait l\'être.',
  ]],
  ['auto_success', 'high', [
    '{actor} touchez {def_target} sans réfléchir, et retirez la main aussitôt. Ce n\'était pas la bonne idée.',
    'Une seconde de contact suffit. Ce que vous sentez sous vos doigts ne ressemble à rien de connu.',
  ]],
]);

// ============================================================================
// COMBINED EXPORT
// ============================================================================

/** Verb-specific templates for verbs that previously had none. */
export const ACTION_COVERAGE_TEMPLATES: readonly ActionTemplate[] = [
  ...PUSH_TEMPLATES,
  ...PULL_TEMPLATES,
  ...ACTIVATE_TEMPLATES,
  ...DEACTIVATE_TEMPLATES,
  ...SCAN_TEMPLATES,
  ...LISTEN_TEMPLATES,
  ...SMELL_TEMPLATES,
  ...JUMP_TEMPLATES,
  ...DODGE_TEMPLATES,
  ...DISTRACT_TEMPLATES,
  ...DECEIVE_TEMPLATES,
  ...DROP_TEMPLATES,
  ...EQUIP_TEMPLATES,
  ...DRINK_TEMPLATES,
  ...TOUCH_TEMPLATES,
];

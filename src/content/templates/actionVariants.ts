// ---------------------------------------------------------------------------
// src/content/templates/actionVariants.ts — Extra variants for the core verbs
// ---------------------------------------------------------------------------
// P2 (variété narrative). actionTemplates.ts holds exactly one text per
// (verb × targetType × outcome × tension) cell, which leaves NarrationMemory
// nothing to choose from. This file adds two more variants for every cell of
// the twelve most-played verbs, bringing each pool to three.
//
// Cell layout mirrors actionTemplates.ts — a cell listed here must already
// exist there, otherwise the average per cell drops instead of rising.
//
// Slot syntax: {actor}, {def_target}, {def_tool}, {?tool_used:yes|no}.
// Never start a sentence with {def_target} — it renders lowercase ("le sas").
// ---------------------------------------------------------------------------

import type { PropertyId } from '../../engine/properties';
import type { VerbId } from '../../engine/verbs';
import type { ActionTemplate, Outcome, TensionTier, VerbCategory } from '../../narration/types';

/** One cell plus the two extra texts filling it. */
type VariantSpec = readonly [
  targetType: PropertyId | null,
  outcome: Outcome,
  tension: TensionTier,
  texts: readonly [string, string],
];

function variants(
  verb: VerbId,
  category: VerbCategory,
  specs: readonly VariantSpec[],
): readonly ActionTemplate[] {
  return specs.flatMap(([targetType, outcome, tension, texts]) =>
    texts.map((fr, i): ActionTemplate => ({
      id: `${category}_${verb}_${targetType ?? 'any'}_${outcome}_${tension}_v${i + 2}`,
      verb,
      targetType,
      outcome,
      tension,
      category,
      text: { fr, en: '' },
    })),
  );
}

// ============================================================================
// STRIKE — physical (FOR)
// ============================================================================

const STRIKE_VARIANTS = variants('STRIKE', 'physical', [
  [null, 'auto_success', 'low', [
    '{actor} frappez {def_target}{?tool_used: avec {def_tool}|}. Aucune résistance — le geste part tout seul, presque désinvolte.',
    'Un coup sec, sans élan, contre {def_target}{?tool_used:, {def_tool} bien en main|}. Le silence du pont avale le bruit avant qu\'il ne rebondisse.',
  ]],
  [null, 'auto_success', 'mid', [
    '{actor} cognez {def_target}{?tool_used: du plat de {def_tool}|}. Contact franc, sans surprise. Le vaisseau encaisse et oublie.',
    'Votre poing trouve {def_target} sans effort{?tool_used:, prolongé par {def_tool}|}. Un bruit mat, court, aussitôt étouffé par les cloisons.',
  ]],
  [null, 'crit_success', 'low', [
    '{actor} placez le coup exactement où il fallait{?tool_used: — {def_tool} fait le reste|}. Un point de rupture, et {def_target} lâche d\'un seul coup.',
    'Le geste est presque paresseux, et pourtant parfait : {def_target} encaisse{?tool_used: {def_tool}|} et se fend dans un claquement propre.',
  ]],
  [null, 'crit_success', 'mid', [
    '{actor} frappez au défaut de la structure{?tool_used: avec {def_tool}|}. Quelque chose cède à l\'intérieur de {def_target} — un craquement humide, définitif.',
    'Timing parfait. Le coup traverse {def_target}{?tool_used: à travers {def_tool}|} et l\'onde de choc remonte jusqu\'à votre épaule. Vous avez tenu. Pas {def_target}.',
  ]],
  [null, 'crit_success', 'high', [
    'Tout ce qui vous reste part dans ce coup{?tool_used:, canalisé par {def_tool}|}. Il ne subsiste de {def_target} que des morceaux qui glissent sur le pont froid.',
    '{actor} frappez comme on hurle — sans réfléchir. L\'impact déforme {def_target}{?tool_used: et tord {def_tool} au passage|}, et le couloir entier renvoie l\'écho de la rupture.',
  ]],
  [null, 'success', 'low', [
    '{actor} frappez {def_target}{?tool_used: avec {def_tool}|}. Le coup porte, sans éclat. Un bruit sourd, puis plus rien.',
    'Vous cognez posément contre {def_target}{?tool_used:, {def_tool} en appui|}. L\'effet est réel, modeste — assez pour marquer, pas pour convaincre.',
  ]],
  [null, 'success', 'mid', [
    '{actor} appuyez le coup sur {def_target}{?tool_used: en vous servant de {def_tool}|}. La structure vibre, encaisse, garde la trace.',
    'Le poing part, corrigé à mi-course{?tool_used: par {def_tool}|}. Sous l\'impact, {def_target} recule d\'un cran — c\'est déjà quelque chose.',
  ]],
  [null, 'success', 'high', [
    '{actor} frappez comme si le temps manquait — parce qu\'il manque{?tool_used:, {def_tool} serrée à s\'en blanchir les doigts|}. Le coup porte. Suffisamment.',
    'Pas de style, pas de garde : juste de la force jetée contre {def_target}{?tool_used: à travers {def_tool}|}. Ça tient encore, mais ça a bougé.',
  ]],
  [null, 'partial', 'low', [
    '{actor} frappez {def_target}{?tool_used: avec {def_tool}|} — le coup dévie au dernier moment. Une éraflure, un bruit, rien de décisif.',
    'L\'angle était mauvais. Le poing glisse le long de {def_target}{?tool_used:, {def_tool} avec lui|} et n\'emporte qu\'une écaille de peinture.',
  ]],
  [null, 'partial', 'mid', [
    '{actor} touchez {def_target}{?tool_used: avec {def_tool}|}, mais l\'énergie se disperse. Une fissure court sur la surface, puis s\'arrête net.',
    'Le coup passe à moitié{?tool_used: — {def_tool} ripe|}. Quelque chose a bougé dans {def_target}, pas assez pour que ça compte encore.',
  ]],
  [null, 'partial', 'high', [
    '{actor} frappez à l\'aveugle{?tool_used:, {def_tool} en travers|}. L\'impact arrache un morceau de {def_target} et vous laisse le poignet en feu.',
    'Sous la panique, le coup part trop tôt et {def_target} encaisse de biais{?tool_used:, {def_tool} vibrant dans votre paume|} — entamé, toujours debout.',
  ]],
  [null, 'failure', 'low', [
    '{actor} frappez {def_target}{?tool_used: avec {def_tool}|}. Rien. La surface absorbe tout et vous rend l\'onde dans les articulations.',
    'Le coup part, atterrit, meurt — et {def_target} n\'a même pas la politesse de faire du bruit.',
  ]],
  [null, 'failure', 'mid', [
    '{actor} cognez encore{?tool_used:, {def_tool} claquant contre le métal|}. Rien ne bouge. Vos phalanges, elles, commencent à protester.',
    'Trois fois. Quatre. Rien ne cède{?tool_used:, malgré {def_tool}|}, et chaque coup vous coûte plus qu\'il ne rapporte.',
  ]],
  [null, 'crit_failure', 'mid', [
    '{actor} frappez de toutes vos forces et manquez complètement{?tool_used: — {def_tool} vous échappe et rebondit au sol|}. Le fracas voyage bien plus loin que vous ne le voudriez.',
    'Le poing rate {def_target} et percute la cloison derrière. Un craquement — le vôtre{?tool_used:, et {def_tool} qui roule hors de portée|}.',
  ]],
  [null, 'crit_failure', 'high', [
    'Le coup part mal, très mal{?tool_used: : {def_tool} se retourne contre vous|}. Vous perdez l\'équilibre à l\'instant précis où il aurait fallu le garder.',
    '{actor} frappez dans le vide, emporté par votre élan. Le pont vient à votre rencontre{?tool_used: et {def_tool} disparaît sous une grille|}. Quelque chose, quelque part, a entendu.',
  ]],
]);

// ============================================================================
// BREAK — physical (FOR)
// ============================================================================

const BREAK_VARIANTS = variants('BREAK', 'physical', [
  [null, 'auto_success', 'low', [
    '{actor} brisez {def_target}{?tool_used: d\'un coup de {def_tool}|}. La structure était déjà morte — vous n\'avez fait qu\'acter le constat.',
    'Une pression, un craquement, c\'est fini : {def_target} n\'opposait pas plus de résistance qu\'une coquille vide.',
  ]],
  [null, 'auto_success', 'mid', [
    '{actor} rompez {def_target}{?tool_used: en levier avec {def_tool}|}. Le métal fatigué cède sans discuter. Le bruit, lui, va voyager.',
    'Il suffit d\'appuyer au bon endroit{?tool_used: — {def_tool} y suffit|} pour que {def_target} rende les armes en deux morceaux inégaux.',
  ]],
  [null, 'crit_success', 'mid', [
    '{actor} trouvez la ligne de rupture du premier coup{?tool_used:, {def_tool} placée pile dessus|}, et {def_target} s\'ouvre proprement en livrant ce qu\'il cachait.',
    'Un seul point d\'appui, tout le poids du corps{?tool_used: à travers {def_tool}|} : la rupture est nette, chirurgicale, et rien d\'utile ne se perd dans l\'opération.',
  ]],
  [null, 'crit_success', 'high', [
    '{actor} détruisez {def_target}{?tool_used: avec {def_tool}|} dans un fracas qui couvre tout le reste — y compris ce qui approchait dans votre dos.',
    'La panique donne une force qu\'on ne s\'imagine pas : {def_target} explose littéralement sous le coup{?tool_used: de {def_tool}|}, et la voie est libre.',
  ]],
  [null, 'success', 'low', [
    '{actor} brisez {def_target}{?tool_used: à l\'aide de {def_tool}|}. Ça prend le temps qu\'il faut, mais la structure finit par lâcher.',
    'Coup après coup, la fatigue du métal fait le travail{?tool_used: — {def_tool} accélère juste la fin|}, et {def_target} se rompt sans spectacle.',
  ]],
  [null, 'success', 'mid', [
    '{actor} forcez jusqu\'à la rupture{?tool_used:, {def_tool} tordue par l\'effort|}. Le craquement se répercute plus loin que vous ne l\'auriez voulu.',
    'Deux tentatives, puis la bonne : {def_target} cède{?tool_used: sous {def_tool}|} dans un gémissement de métal. Reste à savoir qui a entendu.',
  ]],
  [null, 'success', 'high', [
    '{actor} attaquez {def_target} sans mesure{?tool_used:, {def_tool} en travers|}. Ça casse — ce qui reste ne bloquera plus rien.',
    'Le temps manque, alors on casse : {def_target} lâche{?tool_used: sous {def_tool}|} dans un vacarme que vous n\'avez plus les moyens d\'éviter.',
  ]],
  [null, 'partial', 'mid', [
    '{actor} entamez {def_target}{?tool_used: avec {def_tool}|} sans le rompre. Une fêlure court sur toute la longueur — la prochaine fois suffira peut-être.',
    'La structure plie, grince, tient. Vous arrachez un morceau de {def_target}{?tool_used: et abîmez {def_tool} au passage|}, sans obtenir l\'ouverture espérée.',
  ]],
  [null, 'partial', 'high', [
    '{actor} frappez jusqu\'à ce que quelque chose cède — mais c\'est un fragment, pas l\'ensemble : {def_target} tient encore{?tool_used:, et {def_tool} montre des signes de fatigue|}.',
    'Sous l\'urgence, la casse reste partielle : une brèche trop étroite dans {def_target}{?tool_used:, {def_tool} coincée dedans|}. Il faudra recommencer.',
  ]],
  [null, 'failure', 'low', [
    '{actor} vous acharnez sur {def_target}{?tool_used: avec {def_tool}|}. La structure est plus saine qu\'elle n\'en a l\'air — rien ne bouge.',
    'Le matériau encaisse tout ce que vous lui donnez{?tool_used:, y compris {def_tool}|}. Il faudra autre chose que de la force brute.',
  ]],
  [null, 'failure', 'mid', [
    '{actor} cognez, tirez, forcez — {def_target} ne cède pas{?tool_used: et {def_tool} commence à souffrir|}. Le bruit, lui, se propage très bien.',
    'Rien à faire : l\'assemblage tient, et chaque tentative vous coûte du souffle{?tool_used: et de l\'usure sur {def_tool}|}. Le temps passe.',
  ]],
  [null, 'crit_failure', 'mid', [
    '{actor} y mettez trop de force. Quelque chose se déchire — pas dans {def_target}, dans votre épaule{?tool_used:, et {def_tool} part en vrille|}.',
    'Le coup ricoche. Un éclat vous ouvre l\'avant-bras{?tool_used: pendant que {def_tool} claque au sol|}, et {def_target} reste parfaitement intact.',
  ]],
  [null, 'crit_failure', 'high', [
    '{actor} frappez à l\'aveugle et déclenchez exactement ce qu\'il ne fallait pas : une alarme, un effondrement, un regard qui se tourne vers vous{?tool_used: — {def_tool} n\'y survit pas|}.',
    'La rupture arrive — du mauvais côté. Une conduite cède près de {def_target}{?tool_used: quand {def_tool} ripe|} et le couloir se remplit d\'un sifflement de mauvais augure.',
  ]],
  ['breakable', 'crit_success', 'low', [
    '{actor} repérez la soudure fatiguée et appuyez pile dessus{?tool_used: avec {def_tool}|} : {def_target} s\'ouvre comme une boîte, sans un éclat perdu.',
    'Ce genre d\'objet a toujours un point faible. Vous le trouvez du premier coup{?tool_used:, {def_tool} en main|}, et la rupture est si propre qu\'on croirait un démontage.',
  ]],
]);

// ============================================================================
// CUT — physical (FOR)
// ============================================================================

const CUT_VARIANTS = variants('CUT', 'physical', [
  [null, 'auto_success', 'low', [
    '{actor} tranchez {def_target}{?tool_used: d\'un passage de {def_tool}|}. La matière s\'ouvre sans opposer la moindre résistance.',
    'Un geste, une ligne nette, et {def_target} se sépare en deux{?tool_used: le long de {def_tool}|}. Aussi simple que ça.',
  ]],
  [null, 'auto_success', 'mid', [
    '{actor} entaillez {def_target}{?tool_used: avec {def_tool}|} d\'un mouvement continu. La coupe est franche ; l\'odeur qui s\'en échappe, beaucoup moins.',
    'La lame trouve son chemin sans effort : {def_target} s\'ouvre{?tool_used: sous {def_tool}|} et laisse voir ce qu\'il valait mieux ne pas voir.',
  ]],
  [null, 'crit_success', 'low', [
    '{actor} coupez pile dans l\'axe{?tool_used:, {def_tool} parfaitement guidée|}. La section est si nette qu\'elle en paraît industrielle.',
    'Un seul passage suffit. La coupe traverse {def_target} de part en part{?tool_used: sans que {def_tool} ne marque|}, et vous récupérez les deux moitiés intactes.',
  ]],
  [null, 'crit_success', 'high', [
    '{actor} tranchez dans l\'urgence et pourtant parfaitement{?tool_used: — {def_tool} chante en sortant|}. Ce qui bloquait tombe au sol en deux morceaux.',
    'Le geste est vif, désespéré, exact : {def_target} cède d\'un coup{?tool_used: devant {def_tool}|} et le passage s\'ouvre juste à temps.',
  ]],
  [null, 'success', 'low', [
    '{actor} entamez {def_target}{?tool_used: avec {def_tool}|} en plusieurs passages. Ce n\'est pas élégant, mais c\'est coupé.',
    'La matière résiste un peu, puis s\'ouvre. Vous suivez la ligne jusqu\'au bout{?tool_used:, {def_tool} chauffant dans votre paume|}.',
  ]],
  [null, 'success', 'mid', [
    '{actor} sciez {def_target}{?tool_used: avec {def_tool}|} en appuyant plus que nécessaire. La coupe est irrégulière, mais elle traverse.',
    'Fibre après fibre, {def_target} lâche{?tool_used: sous {def_tool}|}. Vos avant-bras brûlent ; le passage est ouvert.',
  ]],
  [null, 'success', 'high', [
    '{actor} taillez dans {def_target} sans regarder ce que vous faites{?tool_used:, {def_tool} glissante de sang ou de graisse|}. Ça passe. C\'est tout ce qui compte.',
    'Pas le temps de faire propre : vous ouvrez {def_target} d\'un travers brutal{?tool_used: avec {def_tool}|} et vous vous engouffrez dans la brèche.',
  ]],
  [null, 'partial', 'mid', [
    '{actor} entaillez {def_target}{?tool_used: avec {def_tool}|} sans le trancher. La coupe s\'arrête sur quelque chose de plus dur que prévu.',
    'La lame progresse, puis coince. Il reste une bande intacte au milieu de {def_target}{?tool_used:, et {def_tool} refuse d\'aller plus loin|}.',
  ]],
  [null, 'partial', 'high', [
    '{actor} tranchez à moitié{?tool_used: avant que {def_tool} ne dérape|}. L\'ouverture existe, trop étroite pour vous — pas pour ce qui vous suit.',
    'Sous la panique, la coupe part de travers : {def_target} pend, à demi séparé{?tool_used:, {def_tool} plantée dedans|}, et le temps file.',
  ]],
  [null, 'failure', 'low', [
    '{actor} passez et repassez sur {def_target}{?tool_used: avec {def_tool}|} sans laisser autre chose qu\'une rayure. Mauvais outil, mauvaise matière, ou les deux.',
    'La surface est plus dure qu\'elle n\'en a l\'air. Rien ne s\'ouvre{?tool_used:, et {def_tool} s\'émousse pour rien|}.',
  ]],
  [null, 'failure', 'mid', [
    '{actor} forcez la coupe et n\'obtenez qu\'un crissement insupportable{?tool_used: — {def_tool} ripe une fois de plus|}. Le bruit porte loin dans les coursives.',
    'Impossible d\'attaquer {def_target} correctement : l\'angle est mauvais, la prise aussi{?tool_used:, et {def_tool} n\'est pas faite pour ça|}.',
  ]],
  [null, 'crit_failure', 'mid', [
    '{actor} appuyez trop fort ; la lame ripe et vous ouvre la main{?tool_used: — {def_tool} tombe, poisseuse|}. Le sang goutte sur le pont.',
    'Le geste dérape. Vous vous entaillez profondément{?tool_used: pendant que {def_tool} se plante ailleurs|}, et {def_target} n\'a pas bougé d\'un millimètre.',
  ]],
  [null, 'crit_failure', 'high', [
    'La lame casse net{?tool_used: — {def_tool} se brise en deux|} au pire moment possible, et le morceau qui vous revient dans la figure ne fait pas semblant.',
    '{actor} tranchez à l\'aveugle et coupez ce qu\'il ne fallait pas : une conduite, une amarre, un doigt. Le sifflement qui suit couvre votre juron.',
  ]],
  ['cuttable', 'crit_success', 'mid', [
    '{actor} suivez la fibre plutôt que de la combattre{?tool_used:, {def_tool} au bon angle|}. La séparation se fait d\'elle-même, sans un accroc.',
    'Ce matériau est fait pour être coupé, et vous le coupez bien : un passage, une ligne parfaite{?tool_used: laissée par {def_tool}|}, et {def_target} s\'ouvre en livrant plus que prévu.',
  ]],
]);

// ============================================================================
// SHOOT — physical (AGI)
// ============================================================================

const SHOOT_VARIANTS = variants('SHOOT', 'physical', [
  [null, 'auto_success', 'low', [
    '{actor} tirez sur {def_target}{?tool_used: avec {def_tool}|}. À cette distance, rater relèverait de l\'exploit.',
    'Une pression sur la détente{?tool_used: de {def_tool}|}, et le projectile trouve {def_target} sans discussion. La détonation, elle, reste dans les cloisons.',
  ]],
  [null, 'auto_success', 'mid', [
    '{actor} alignez, expirez, tirez{?tool_used: — {def_tool} recule contre votre épaule|}. Impact confirmé.',
    'Le coup part et touche. Rien d\'héroïque : de la mécanique{?tool_used:, {def_tool} faisant son travail|} dans un couloir qui renvoie l\'écho trois fois.',
  ]],
  [null, 'crit_success', 'low', [
    '{actor} touchez exactement le point faible{?tool_used: — {def_tool} n\'a jamais aussi bien servi|}. Un seul projectile, et le problème n\'en est plus un.',
    'Le tir est chirurgical. Là où il fallait, quand il fallait{?tool_used:, {def_tool} parfaitement stable|} — et {def_target} cesse d\'être un obstacle.',
  ]],
  [null, 'crit_success', 'high', [
    '{actor} tirez sans viser vraiment, et pourtant le coup part pile là où il devait{?tool_used:, {def_tool} brûlante entre vos mains|}. La chance, ou autre chose.',
    'Un tir dans l\'urgence absolue, et un impact parfait : {def_target} s\'effondre{?tool_used: devant {def_tool} encore fumante|} avant même d\'avoir compris.',
  ]],
  [null, 'success', 'low', [
    '{actor} tirez sur {def_target}{?tool_used: avec {def_tool}|}. Le coup porte, sans plus. Il faudra probablement recommencer.',
    'Le projectile atteint {def_target} un peu à côté de l\'idéal{?tool_used:, {def_tool} tirant légèrement à droite|}. Ça compte quand même.',
  ]],
  [null, 'success', 'mid', [
    '{actor} tirez posément malgré les mains qui tremblent{?tool_used:, {def_tool} calée contre la cloison|}. L\'impact marque {def_target}.',
    'Deux respirations, un coup, et {def_target} encaisse{?tool_used: la charge de {def_tool}|} — quelque chose change dans sa posture.',
  ]],
  [null, 'success', 'high', [
    '{actor} tirez en reculant{?tool_used:, {def_tool} claquant à chaque pas|}. Le coup touche. Ce n\'est pas fini, mais vous respirez encore.',
    'Une salve précipitée, un impact confirmé sur {def_target}{?tool_used: — {def_tool} vous répond dans l\'épaule|}. Continuez à bouger.',
  ]],
  [null, 'partial', 'mid', [
    '{actor} touchez {def_target} en périphérie{?tool_used:, {def_tool} déviant au dernier instant|}. Assez pour marquer, pas assez pour arrêter.',
    'Le projectile ricoche avant d\'atteindre sa cible : {def_target} est éraflé{?tool_used:, et {def_tool} n\'a plus beaucoup à donner|}.',
  ]],
  [null, 'partial', 'high', [
    '{actor} tirez trop vite ; le coup effleure {def_target}{?tool_used: malgré {def_tool}|}. Assez pour l\'énerver, pas pour l\'arrêter.',
    'Sous l\'adrénaline, la visée part. Une moitié du tir touche {def_target}{?tool_used:, {def_tool} sautant dans vos mains|} — l\'autre se perd dans le noir.',
  ]],
  [null, 'failure', 'low', [
    '{actor} tirez et manquez{?tool_used: — {def_tool} tire plus haut que prévu|}. Le projectile va se perdre quelque part dans la structure.',
    'Le coup part à côté de {def_target}. Un impact sur la cloison, une étincelle{?tool_used:, et {def_tool} qui refroidit pour rien|}.',
  ]],
  [null, 'failure', 'mid', [
    '{actor} tirez ; rien ne touche, et {def_target} n\'a même pas changé de position{?tool_used: pendant que {def_tool} chauffe|}.',
    'Le recul vous surprend{?tool_used: — {def_tool} n\'est pas ce que vous croyiez|}. Le tir se perd, et le bruit annonce votre position à tout le pont.',
  ]],
  [null, 'crit_failure', 'mid', [
    'Le mécanisme s\'enraye{?tool_used: : {def_tool} se bloque, culasse ouverte|}. Vous perdez de longues secondes à comprendre ce qui vient de se passer.',
    '{actor} tirez et le projectile ricoche vers vous. Une brûlure le long de la cuisse{?tool_used:, {def_tool} presque lâchée|} — la leçon coûte cher.',
  ]],
  [null, 'crit_failure', 'high', [
    '{actor} pressez la détente et rien ne part{?tool_used: — {def_tool} vient de rendre l\'âme|}. Le silence qui suit est le pire son du vaisseau.',
    'Le coup part dans une conduite. Le sifflement, la vapeur, l\'alarme{?tool_used: — et {def_tool} qui vous glisse des mains|} : vous venez d\'aggraver tout ce qui pouvait l\'être.',
  ]],
  ['hostile', 'crit_success', 'mid', [
    '{actor} placez le tir exactement où l\'anatomie cède{?tool_used:, {def_tool} tenue à deux mains|}. La créature s\'effondre sans un cri.',
    'Un seul projectile, et {def_target} apprend la mortalité{?tool_used: par l\'intermédiaire de {def_tool}|}. Le silence revient, provisoire.',
  ]],
]);

// ============================================================================
// HACK — technical (INT)
// ============================================================================

const HACK_VARIANTS = variants('HACK', 'technical', [
  [null, 'auto_success', 'low', [
    '{actor} parcourez l\'interface de {def_target}{?tool_used: via {def_tool}|}. Aucun verrou digne de ce nom — le système s\'ouvre comme une porte laissée entrebâillée.',
    'Trois commandes, un mot de passe par défaut jamais changé{?tool_used:, {def_tool} branchée au port de service|}. L\'accès est à vous.',
  ]],
  [null, 'crit_success', 'low', [
    '{actor} comprenez l\'architecture avant même de la lire{?tool_used:, {def_tool} affichant le schéma complet|}. Vous ne forcez rien : vous entrez par la porte prévue pour les administrateurs.',
    'Le protocole est ancien, et vous connaissez ses défauts. En quelques frappes{?tool_used: relayées par {def_tool}|}, {def_target} vous ouvre plus que ce que vous cherchiez.',
  ]],
  [null, 'crit_success', 'high', [
    '{actor} tapez sans regarder l\'écran, l\'oreille tournée vers le couloir{?tool_used: — {def_tool} fait le reste|}. L\'accès tombe à la seconde où vous en aviez besoin.',
    'Une intuition, une seule ligne de commande{?tool_used: poussée par {def_tool}|}, et tout le système de {def_target} vous appartient. Le hasard n\'a rien à voir là-dedans.',
  ]],
  [null, 'success', 'low', [
    '{actor} contournez la sécurité de {def_target}{?tool_used: avec {def_tool}|}. Lent, méthodique, sans élégance particulière — mais l\'accès est ouvert.',
    'Le chiffrement est standard. Vous le démontez couche par couche{?tool_used:, {def_tool} en soutien|} jusqu\'à ce que la console cède.',
  ]],
  [null, 'success', 'mid', [
    '{actor} forcez l\'accès de {def_target}{?tool_used: en dérivant par {def_tool}|}. Le journal système garde une trace de votre passage — problème pour plus tard.',
    'Deux impasses, puis une brèche{?tool_used: repérée par {def_tool}|}. L\'interface s\'ouvre en grinçant, et un voyant passe à l\'orange quelque part.',
  ]],
  [null, 'success', 'high', [
    '{actor} piratez {def_target} les doigts tremblants{?tool_used:, {def_tool} calée contre la console|}. L\'accès s\'ouvre au moment où le couloir derrière vous se met à résonner.',
    'Vous tapez trop vite, vous vous trompez, vous recommencez{?tool_used: — {def_tool} rattrape ce qui peut l\'être|}. Le verrou lâche. Bougez.',
  ]],
  [null, 'partial', 'mid', [
    '{actor} obtenez un accès partiel à {def_target}{?tool_used: via {def_tool}|}. Les journaux sont lisibles ; les commandes, non.',
    'La première couche cède, la seconde tient. Vous voyez ce que fait {def_target} sans pouvoir le contredire{?tool_used:, {def_tool} bloquée sur une erreur d\'authentification|}.',
  ]],
  [null, 'partial', 'high', [
    '{actor} arrachez un fragment d\'accès à {def_target}{?tool_used: avec {def_tool}|} avant que la session ne se referme d\'elle-même. C\'est peu, et c\'est déjà ça.',
    'Le système vous laisse entrer, puis se rétracte. Une fenêtre de quelques secondes{?tool_used:, {def_tool} déconnectée de force|} — assez pour lire, pas pour agir.',
  ]],
  [null, 'failure', 'low', [
    '{actor} sondez {def_target}{?tool_used: avec {def_tool}|} sans trouver la moindre ouverture. L\'interface répond poliment qu\'elle ne vous connaît pas.',
    'Chaque tentative se solde par le même refus{?tool_used:, malgré {def_tool}|}. Le protocole est plus récent que vos habitudes.',
  ]],
  [null, 'failure', 'mid', [
    '{actor} vous heurtez à une authentification que rien ne contourne{?tool_used: — {def_tool} n\'a pas les bons certificats|}. Le compteur de tentatives, lui, monte.',
    'L\'accès est refusé, encore. Quelque part dans {def_target}, un journal enregistre votre insistance{?tool_used: et l\'empreinte de {def_tool}|}.',
  ]],
  [null, 'crit_failure', 'mid', [
    '{actor} déclenchez un contre-verrouillage : {def_target} se referme complètement{?tool_used: et éjecte {def_tool}|}, et une alerte discrète part vers un destinataire inconnu.',
    'Mauvaise commande, mauvais moment. Le système riposte{?tool_used: — une décharge remonte par {def_tool} jusqu\'à vos doigts|} et les lumières du secteur virent au rouge.',
  ]],
  [null, 'crit_failure', 'high', [
    '{actor} lancez la routine sans la relire, et {def_target} interprète tout de travers{?tool_used:, {def_tool} grillée dans l\'échange|}. Les portes du secteur se verrouillent une à une.',
    'L\'intrusion est détectée à l\'instant précis où vous n\'aviez aucune marge{?tool_used: ; {def_tool} fume|}. Une alarme hurle, et vous savez exactement ce qu\'elle appelle.',
  ]],
  ['electronic', 'auto_success', 'mid', [
    '{actor} vous branchez sur {def_target}{?tool_used: par {def_tool}|}. Le circuit répond immédiatement — il attendait quelqu\'un depuis longtemps.',
    'La console s\'illumine sous vos doigts{?tool_used:, {def_tool} négociant la poignée de main|}. Ce genre de matériel ne sait pas dire non.',
  ]],
  ['programmable', 'crit_success', 'mid', [
    '{actor} réécrivez la routine de {def_target} au lieu de la contourner{?tool_used:, {def_tool} compilant à la volée|}. Le système obéit désormais à vos règles.',
    'Il ne s\'agit plus d\'entrer : vous reprogrammez {def_target}{?tool_used: à travers {def_tool}|} pour qu\'il vous serve. Élégant, et beaucoup plus utile.',
  ]],
]);

// ============================================================================
// REPAIR — technical (INT)
// ============================================================================

const REPAIR_VARIANTS = variants('REPAIR', 'technical', [
  [null, 'auto_success', 'low', [
    '{actor} remettez {def_target} en état{?tool_used: avec {def_tool}|}. Un connecteur mal enfoncé, rien de plus — le genre de panne qui insulte l\'ingénieur.',
    'Deux gestes suffisent{?tool_used:, {def_tool} à peine sortie|} pour que {def_target} redémarre en clignotant comme si de rien n\'était.',
  ]],
  [null, 'auto_success', 'mid', [
    '{actor} réparez {def_target}{?tool_used: avec {def_tool}|} sans avoir besoin d\'y réfléchir. Les mains savent, même quand le reste doute.',
    'La panne est évidente une fois le panneau ouvert{?tool_used: — {def_tool} fait le reste en quelques secondes|}. Le système revient à la vie.',
  ]],
  [null, 'crit_success', 'low', [
    '{actor} ne réparez pas seulement {def_target} : vous l\'améliorez{?tool_used: avec {def_tool}|}. Il fonctionnera mieux qu\'à sa sortie de chaîne.',
    'Le diagnostic tombe juste du premier coup{?tool_used:, {def_tool} exactement au bon calibre|}. Remis en état, recalibré, silencieux.',
  ]],
  [null, 'crit_success', 'high', [
    '{actor} réparez {def_target} en aveugle, dans le noir, avec quelque chose qui approche{?tool_used: et {def_tool} qui glisse|}. Et ça marche. Parfaitement.',
    'Les doigts font le travail que la tête n\'a plus le temps de faire{?tool_used:, {def_tool} guidée par pure habitude|}. Le système repart, plus fiable qu\'avant.',
  ]],
  [null, 'success', 'low', [
    '{actor} remettez {def_target} en marche{?tool_used: à l\'aide de {def_tool}|}. La réparation tiendra — un moment.',
    'Un contact nettoyé, une soudure refaite{?tool_used: par {def_tool}|}. Ce n\'est pas beau, mais c\'est fonctionnel.',
  ]],
  [null, 'success', 'mid', [
    '{actor} réparez {def_target}{?tool_used: avec {def_tool}|} en improvisant sur deux pièces manquantes. Ça tient, tant qu\'on ne regarde pas de trop près.',
    'La remise en service prend plus longtemps que prévu{?tool_used:, {def_tool} chauffant dans votre main|}. Le voyant finit par passer au vert.',
  ]],
  [null, 'success', 'high', [
    '{actor} bricolez {def_target} dans l\'urgence{?tool_used:, {def_tool} coincée entre vos dents une seconde de trop|}. Ça fonctionne. Ne demandez pas pour combien de temps.',
    'Pas de diagnostic, pas de propreté : vous rebranchez ce qui doit l\'être{?tool_used: avec {def_tool}|} et {def_target} redémarre en toussant.',
  ]],
  [null, 'partial', 'mid', [
    '{actor} rendez à {def_target} une partie de ses fonctions{?tool_used: grâce à {def_tool}|}. L\'essentiel marche ; le reste clignote en rouge.',
    'La réparation tient sur un fil{?tool_used: et sur {def_tool}|} : {def_target} fonctionne à charge réduite, et vous le sentez à chaque vibration.',
  ]],
  [null, 'partial', 'high', [
    '{actor} obtenez un demi-fonctionnement{?tool_used:, {def_tool} maintenue en place par vos genoux|}. Ce sera suffisant si rien ne s\'aggrave — et quelque chose s\'aggrave toujours.',
    'Sous la pression, vous colmatez au lieu de réparer{?tool_used: — {def_tool} n\'était pas prévue pour ça|}, et {def_target} tiendra le temps qu\'il tiendra.',
  ]],
  [null, 'failure', 'low', [
    '{actor} ouvrez, inspectez, refermez{?tool_used:, {def_tool} inutile|}. La panne est ailleurs, et vous ne savez pas où.',
    'Rien ne repart. Le composant fautif n\'est pas accessible{?tool_used:, et {def_tool} n\'y changera rien|}.',
  ]],
  [null, 'failure', 'mid', [
    '{actor} vous acharnez sur {def_target}{?tool_used: avec {def_tool}|} sans résultat. Il manque une pièce que ce vaisseau n\'a plus depuis longtemps.',
    'Chaque tentative éteint un voyant et en allume deux autres{?tool_used:, {def_tool} n\'ayant plus rien à proposer|}. Le temps file, la panne reste.',
  ]],
  [null, 'crit_failure', 'mid', [
    '{actor} inversez deux connexions. Un arc électrique jaillit{?tool_used: le long de {def_tool}|} et ce qui fonctionnait encore cesse de fonctionner.',
    'La réparation aggrave la panne : quelque chose fond à l\'intérieur de {def_target}{?tool_used:, emportant {def_tool} au passage|}. Odeur de plastique brûlé.',
  ]],
  [null, 'crit_failure', 'high', [
    '{actor} forcez une pièce qui refusait d\'entrer, et tout le module lâche d\'un coup{?tool_used: — {def_tool} se brise dans le logement|}. Il n\'y aura pas de seconde chance.',
    'Le circuit se décharge dans vos mains{?tool_used: à travers {def_tool}|}. Douleur, noir complet une seconde, puis une alarme qui n\'était pas là avant.',
  ]],
  ['broken', 'crit_success', 'mid', [
    '{actor} redonnez vie à ce que tout le monde aurait jeté{?tool_used:, {def_tool} employée bien au-delà de sa notice|} : {def_target} tourne de nouveau, presque neuf.',
    'L\'épave rend l\'âme, puis se ravise. Vous avez trouvé la seule séquence de remontage qui fonctionne{?tool_used:, {def_tool} au millimètre|} — et {def_target} repart pour de bon.',
  ]],
]);

// ============================================================================
// EXAMINE — perception (PER)
// ============================================================================

const EXAMINE_VARIANTS = variants('EXAMINE', 'perception', [
  [null, 'auto_success', 'low', [
    '{actor} détaillez {def_target} sans vous presser. Rien d\'anormal : formes, matériaux, usure conforme.',
    'Un regard suffit : {def_target} n\'a rien à cacher, du moins rien qui se voie d\'ici.',
  ]],
  [null, 'auto_success', 'mid', [
    '{actor} observez {def_target} en gardant un œil sur le couloir. L\'essentiel se lit tout de suite ; le reste attendra.',
    'Le faisceau de votre lampe balaie {def_target}. Contours, textures, et une tache qu\'il vaudrait mieux ne pas identifier.',
  ]],
  [null, 'crit_success', 'low', [
    '{actor} remarquez ce que personne n\'aurait vu : une marque d\'outil, un numéro de série gratté, une réparation faite dans l\'urgence.',
    'Vous prenez le temps de vraiment regarder, et {def_target} finit par parler. Un détail change tout le contexte.',
  ]],
  [null, 'crit_success', 'mid', [
    '{actor} recoupez trois détails insignifiants et obtenez une certitude. Ce qui s\'est passé ici, vous commencez à le comprendre.',
    'Un défaut d\'alignement, une poussière absente, un reflet de travers : {def_target} livre son secret à qui sait le lire.',
  ]],
  [null, 'crit_success', 'high', [
    '{actor} balayez {def_target} d\'un regard et enregistrez tout d\'un coup — la faille, l\'issue, le piège. L\'instinct fait le travail de l\'analyse.',
    'Dans l\'urgence, votre attention se fige sur le seul détail qui compte. Il était là depuis le début, et il vient de vous sauver.',
  ]],
  [null, 'success', 'low', [
    '{actor} inspectez {def_target} méthodiquement. Rien de spectaculaire, mais votre inventaire mental s\'enrichit.',
    'L\'examen ne révèle pas de miracle : un état d\'usure, une fonction probable, une origine incertaine. C\'est déjà utile.',
  ]],
  [null, 'success', 'mid', [
    '{actor} identifiez la fonction de {def_target} et deux détails qui ne collent pas ensemble. Notez-les ; ils resserviront.',
    'L\'observation paie : {def_target} porte des traces récentes, et elles ne sont pas les vôtres.',
  ]],
  [null, 'success', 'high', [
    '{actor} accordez à {def_target} les trois secondes que vous n\'aviez pas. Vous en tirez l\'essentiel, et vous repartez.',
    'Un coup d\'œil rapide, mais bien placé. Ce que vous retenez de {def_target} suffira à décider de la suite.',
  ]],
  [null, 'partial', 'mid', [
    '{actor} distinguez la forme générale de {def_target} sans en saisir le détail. Trop sombre, trop encrassé, trop étrange.',
    'L\'examen reste incomplet : quelque chose vous échappe dans {def_target}, et cette impression ne part pas.',
  ]],
  [null, 'partial', 'high', [
    '{actor} volez un regard à {def_target} entre deux respirations. Vous en retenez une impression, pas une information.',
    'L\'urgence brouille tout : {def_target} ne vous laisse qu\'un souvenir flou et le sentiment d\'avoir raté l\'essentiel.',
  ]],
  [null, 'failure', 'low', [
    '{actor} scrutez {def_target} sans rien en tirer. La lumière est mauvaise, votre patience aussi.',
    'Vous regardez longtemps et ne voyez que ce que vous saviez déjà : {def_target} garde ce qu\'il a.',
  ]],
  [null, 'failure', 'mid', [
    '{actor} cherchez un détail utile sur {def_target} et n\'en trouvez aucun. Peut-être qu\'il n\'y en a pas. Peut-être que vous ne savez pas quoi chercher.',
    'L\'examen ne donne rien. Pire : il vous a coûté du temps, et le vaisseau n\'attend pas.',
  ]],
  [null, 'crit_failure', 'mid', [
    '{actor} vous penchez trop près de {def_target}. Ce qui s\'en dégage vous brûle les yeux, et vous reculez sans rien avoir compris.',
    'En manipulant {def_target} pour mieux voir, vous déclenchez quelque chose. Un déclic, puis un silence beaucoup trop long.',
  ]],
  [null, 'crit_failure', 'high', [
    '{actor} fixez {def_target} une seconde de trop. Quand vous relevez la tête, le couloir n\'est plus tout à fait le même.',
    'L\'attention que vous accordez à {def_target} est exactement celle que vous n\'accordez pas à votre dos. Erreur classique. Erreur coûteuse.',
  ]],
  ['openable', 'success', 'low', [
    '{actor} suivez le contour de {def_target} : gonds, joint, mécanisme. Ça s\'ouvre, à condition de trouver par où.',
    'L\'inspection révèle un panneau d\'accès et une commande manuelle sous une plaque : {def_target} n\'est pas scellé, seulement fermé.',
  ]],
  ['openable', 'success', 'mid', [
    '{actor} repérez le point de saisie de {def_target} et l\'état de son verrou. Ouvrable — pas sans effort.',
    'Le mécanisme est visible sous la crasse. Un cran forcé, une charnière tordue : {def_target} cédera à qui insiste.',
  ]],
  ['openable', 'success', 'high', [
    '{actor} évaluez {def_target} en une fraction de seconde : verrou simple, ouverture rapide, une sortie derrière. Bougez.',
    'Un regard, une décision : {def_target} s\'ouvre depuis ce côté, et c\'est tout ce que vous aviez besoin de savoir.',
  ]],
  ['openable', 'failure', 'low', [
    '{actor} cherchez une prise sur {def_target} sans en trouver. Surface lisse, mécanisme interne, rien à saisir.',
    'L\'ouverture existe forcément quelque part, mais {def_target} ne vous montre ni gond ni commande.',
  ]],
  ['openable', 'failure', 'mid', [
    '{actor} inspectez {def_target} sous tous les angles : le verrou est interne, invisible, inatteignable d\'ici.',
    'Aucune faille apparente. Ce qui ferme {def_target} n\'est pas de ce côté de la cloison.',
  ]],
  ['openable', 'failure', 'high', [
    '{actor} passez les mains sur {def_target} en cherchant n\'importe quoi. Rien. Et le temps que vous perdez, quelque chose d\'autre le gagne.',
    'L\'urgence ne rend pas plus perspicace : {def_target} reste hermétique, et vous ne savez toujours pas pourquoi.',
  ]],
]);

// ============================================================================
// OPEN — interaction
// ============================================================================

const OPEN_VARIANTS = variants('OPEN', 'interaction', [
  [null, 'auto_success', 'low', [
    '{actor} ouvrez {def_target}{?tool_used: d\'un geste de {def_tool}|}. Le mécanisme obéit sans un bruit — ou presque.',
    'Une poignée, une pression, et le panneau coulisse : {def_target} n\'attendait que ça.',
  ]],
  [null, 'auto_success', 'mid', [
    '{actor} faites coulisser {def_target}{?tool_used: en vous aidant de {def_tool}|}. L\'air de l\'autre côté est plus froid. Toujours plus froid.',
    'Le verrou n\'était pas engagé : {def_target} s\'ouvre{?tool_used: sous {def_tool}|} sur un espace que personne n\'a visité depuis longtemps.',
  ]],
  [null, 'crit_success', 'mid', [
    '{actor} trouvez le point de libération du premier coup{?tool_used:, {def_tool} pile au bon endroit|}. L\'ouverture est totale, silencieuse, parfaite.',
    'Un déclic net, et {def_target} s\'ouvre en grand{?tool_used: grâce à {def_tool}|} — sans forcer, sans bruit, sans laisser de trace.',
  ]],
  [null, 'crit_success', 'high', [
    '{actor} ouvrez {def_target} à la seconde où il le fallait{?tool_used:, {def_tool} déjà en position|}. Le passage se dégage juste devant vous.',
    'La panique aurait dû tout gâcher. À la place, le mécanisme cède au premier essai{?tool_used: sous {def_tool}|} et vous êtes déjà de l\'autre côté.',
  ]],
  [null, 'success', 'low', [
    '{actor} ouvrez {def_target}{?tool_used: en forçant avec {def_tool}|} après quelques tentatives. Les rails sont encrassés, mais ça passe.',
    'Le mécanisme résiste, puis consent{?tool_used: sous la pression de {def_tool}|}. L\'ouverture est étroite ; elle suffira.',
  ]],
  [null, 'success', 'mid', [
    '{actor} dégagez {def_target}{?tool_used: en faisant levier avec {def_tool}|}. Le grincement est long, sonore, et parfaitement inévitable.',
    'Il faut y mettre l\'épaule{?tool_used: et {def_tool}|}, mais {def_target} finit par s\'écarter assez pour vous laisser passer.',
  ]],
  [null, 'success', 'high', [
    '{actor} arrachez l\'ouverture plus que vous ne l\'obtenez{?tool_used:, {def_tool} coincée dans l\'interstice|}. Le passage est libre. Courez.',
    'Un coup d\'épaule, un juron, et {def_target} cède{?tool_used: avec l\'aide de {def_tool}|}. Ce n\'était pas le moment de discuter.',
  ]],
  [null, 'partial', 'mid', [
    '{actor} entrouvrez {def_target}{?tool_used: à l\'aide de {def_tool}|}. Quelques centimètres, pas davantage — de quoi voir, pas de quoi entrer.',
    'Le panneau se bloque à mi-course{?tool_used:, {def_tool} en travers du rail|}. L\'interstice laisse passer une odeur, et rien d\'autre.',
  ]],
  [null, 'partial', 'high', [
    '{actor} forcez {def_target} juste assez pour glisser un bras{?tool_used: et {def_tool}|}. Le reste refuse de suivre, et le temps manque.',
    'L\'ouverture se fait à moitié avant de se figer{?tool_used:, {def_tool} coincée dedans|}. Il faudra choisir : insister, ou fuir.',
  ]],
  [null, 'failure', 'low', [
    '{actor} tirez sur {def_target}{?tool_used: avec {def_tool}|} sans le moindre résultat. Verrouillé, bloqué, ou simplement plus lourd que vous.',
    'Rien ne bouge. Le mécanisme est mort, ou verrouillé de l\'autre côté{?tool_used:, et {def_tool} n\'y peut rien|}.',
  ]],
  [null, 'failure', 'mid', [
    '{actor} vous acharnez sur {def_target}{?tool_used: avec {def_tool}|}. Le panneau ne bouge pas d\'un millimètre, et le bruit que vous faites, si.',
    'Le verrou tient. Il faudra une clé, un code, ou beaucoup plus de force que ce dont vous disposez{?tool_used: — {def_tool} n\'est pas la solution|}.',
  ]],
  [null, 'crit_failure', 'mid', [
    '{actor} forcez le mauvais côté du mécanisme. Quelque chose casse à l\'intérieur de {def_target}{?tool_used:, emportant {def_tool} au passage|} — il ne s\'ouvrira plus jamais.',
    'Le panneau se rétracte d\'un coup, puis se rescelle. Un joint hermétique claque{?tool_used: sur {def_tool}|}, et un voyant rouge s\'allume au-dessus.',
  ]],
  [null, 'crit_failure', 'high', [
    '{actor} ouvrez {def_target} en grand — et ce qui attendait derrière n\'attend plus{?tool_used:, tandis que {def_tool} vous échappe des mains|}.',
    'Le sas cède au mauvais moment. Une bourrasque, une pression qui chute{?tool_used:, {def_tool} aspirée dans le noir|} : vous venez de faire exactement ce qu\'il ne fallait pas.',
  ]],
  ['locked', 'crit_success', 'low', [
    '{actor} lisez le verrou plutôt que de le combattre{?tool_used:, {def_tool} glissée dans la gorge du mécanisme|}. Trois crans, un déclic, et c\'est ouvert.',
    'Ce modèle de serrure a un défaut connu. Vous l\'exploitez sans hésiter{?tool_used: avec {def_tool}|}, et {def_target} s\'ouvre comme s\'il vous appartenait.',
  ]],
]);

// ============================================================================
// TAKE — interaction
// ============================================================================

const TAKE_VARIANTS = variants('TAKE', 'interaction', [
  [null, 'auto_success', 'low', [
    '{actor} ramassez {def_target} sans y penser. Le poids est négligeable ; l\'utilité, à voir.',
    'Un geste machinal, et {def_target} passe du sol à votre poche. Ça ne coûtait rien d\'essayer.',
  ]],
  [null, 'auto_success', 'mid', [
    '{actor} empochez {def_target} en gardant les yeux ailleurs. On ne laisse rien derrière soi sur un vaisseau mort.',
    'L\'objet vient sans résistance{?tool_used:, {def_tool} servant juste à le décoller|}. Vous rangez {def_target} et reprenez votre progression.',
  ]],
  [null, 'crit_success', 'low', [
    '{actor} soulevez {def_target} et découvrez qu\'il en cachait un autre. Deux fois plus d\'utilité pour le même geste.',
    'En prenant {def_target}, vous remarquez une inscription sous la base. Ce n\'est pas seulement un objet — c\'est une piste.',
  ]],
  [null, 'crit_success', 'mid', [
    '{actor} récupérez {def_target}{?tool_used: en le libérant avec {def_tool}|} dans un état bien meilleur que ce que la poussière laissait croire.',
    'L\'objet se détache proprement{?tool_used: sous {def_tool}|}, complet, avec ses accessoires. Une trouvaille comme il n\'y en aura pas deux.',
  ]],
  [null, 'crit_success', 'high', [
    '{actor} attrapez {def_target} au passage sans ralentir{?tool_used:, {def_tool} dans l\'autre main|}. Exactement ce qu\'il fallait, exactement quand il le fallait.',
    'Un mouvement, une prise, et {def_target} est à vous{?tool_used: — {def_tool} a servi de crochet|}. Vous ne savez pas encore que ça vous sauvera.',
  ]],
  [null, 'success', 'low', [
    '{actor} détachez {def_target} de son support{?tool_used: avec {def_tool}|} et le rangez. Rien de compliqué, juste un peu de patience.',
    'L\'objet vient après quelques secousses{?tool_used:, {def_tool} en appui|}. Sale, mais entier.',
  ]],
  [null, 'success', 'mid', [
    '{actor} récupérez {def_target}{?tool_used: en forçant légèrement avec {def_tool}|}. Le support garde une marque de votre passage.',
    'Il faut tirer plus fort que prévu{?tool_used: et s\'aider de {def_tool}|}, mais {def_target} finit dans votre inventaire.',
  ]],
  [null, 'success', 'high', [
    '{actor} embarquez {def_target} sans vérifier son état{?tool_used:, {def_tool} coincée sous le bras|}. On triera plus tard — s\'il y a un plus tard.',
    'Le geste est brusque, presque violent{?tool_used:, {def_tool} servant de levier|} : {def_target} est à vous, et vous êtes déjà reparti.',
  ]],
  [null, 'partial', 'mid', [
    '{actor} arrachez {def_target} à son logement{?tool_used: avec {def_tool}|}, mais une pièce reste derrière. Ça fonctionnera peut-être quand même.',
    'L\'objet vient, abîmé{?tool_used: par {def_tool}|}. Une fissure court sur toute sa longueur — utilisable une fois, pas deux.',
  ]],
  [null, 'partial', 'high', [
    '{actor} tirez d\'un coup sec et n\'emportez qu\'une partie de {def_target}{?tool_used:, {def_tool} restée coincée|}. Il faudra faire avec.',
    'Dans la précipitation, la prise glisse. Vous récupérez un fragment de {def_target} et laissez le reste derrière vous.',
  ]],
  [null, 'failure', 'low', [
    '{actor} tirez sur {def_target} sans le déplacer d\'un millimètre{?tool_used:, malgré {def_tool}|}. Soudé, boulonné, ou simplement trop bien fixé.',
    'L\'objet fait partie de la structure. Rien à emporter ici{?tool_used:, quoi qu\'en dise {def_tool}|}.',
  ]],
  [null, 'failure', 'mid', [
    '{actor} vous escrimez sur {def_target}{?tool_used: avec {def_tool}|}. Le support tient bon et vous perdez un temps que vous n\'avez pas.',
    'Impossible à déloger. Il faudra revenir avec un outil adapté — ou renoncer{?tool_used: ; {def_tool} n\'est pas cet outil|}.',
  ]],
  [null, 'crit_failure', 'mid', [
    '{actor} arrachez {def_target} et déclenchez ce qui le maintenait en place. Un contact s\'ouvre, une lumière s\'éteint, et le silence change de qualité.',
    'La prise cède d\'un coup et vous partez en arrière{?tool_used:, {def_tool} projetée contre la cloison|}. Le fracas se propage dans tout le pont.',
  ]],
  [null, 'crit_failure', 'high', [
    '{actor} attrapez {def_target} au mauvais endroit. Quelque chose se rompt, quelque chose coule{?tool_used:, et {def_tool} devient inutilisable|}. Vos mains brûlent.',
    'Le geste précipité fait tomber {def_target} dans une grille de ventilation. Vous l\'entendez rebondir longtemps, très longtemps.',
  ]],
]);

// ============================================================================
// USE — interaction
// ============================================================================

const USE_VARIANTS = variants('USE', 'interaction', [
  [null, 'auto_success', 'low', [
    '{actor} vous servez de {def_target} comme prévu. L\'objet fait ce pour quoi il a été conçu, sans histoire.',
    'Une commande, un déclic{?tool_used:, {def_tool} en appui|} : {def_target} s\'exécute et vous rend le résultat attendu.',
  ]],
  [null, 'auto_success', 'mid', [
    '{actor} activez {def_target}{?tool_used: à l\'aide de {def_tool}|}. Le mécanisme répond du premier coup, plus bruyamment que vous ne l\'espériez.',
    'L\'objet fonctionne encore. Vous l\'employez sans cérémonie{?tool_used:, {def_tool} dans l\'autre main|} et l\'effet est immédiat.',
  ]],
  [null, 'crit_success', 'low', [
    '{actor} tirez de {def_target} bien plus que sa fonction affichée{?tool_used:, {def_tool} servant d\'appoint|}. L\'objet avait une seconde utilité — vous venez de la trouver.',
    'L\'utilisation est parfaite : rendement maximal, aucune usure{?tool_used:, {def_tool} parfaitement adaptée|}. Ce genre de moment ne se paie pas deux fois.',
  ]],
  [null, 'crit_success', 'high', [
    '{actor} employez {def_target} exactement au bon instant{?tool_used: avec {def_tool}|}. L\'effet dépasse tout ce que vous en attendiez, et il arrive à temps.',
    'Dans l\'urgence, le geste juste : {def_target} donne tout ce qu\'il avait{?tool_used:, {def_tool} amplifiant l\'effet|} et le rapport de force bascule.',
  ]],
  [null, 'success', 'low', [
    '{actor} utilisez {def_target}{?tool_used: avec {def_tool}|}. L\'effet est celui prévu — modeste, mais réel.',
    'L\'objet répond après une hésitation{?tool_used:, {def_tool} corrigeant le contact|}. Ça marche, sans plus.',
  ]],
  [null, 'success', 'mid', [
    '{actor} mettez {def_target} en œuvre{?tool_used: en vous aidant de {def_tool}|}. Le résultat arrive, accompagné d\'un bruit que vous auriez préféré éviter.',
    'Deux essais, puis le bon : {def_target} s\'active{?tool_used: sous {def_tool}|} et fait ce qu\'on lui demande.',
  ]],
  [null, 'success', 'high', [
    '{actor} déclenchez {def_target} sans prendre le temps de vérifier{?tool_used:, {def_tool} coincée dessous|}. Ça fonctionne. C\'est tout ce qui compte.',
    'L\'objet part au quart de tour dans vos mains fébriles{?tool_used:, {def_tool} en renfort|}. L\'effet est là, brut, suffisant.',
  ]],
  [null, 'partial', 'mid', [
    '{actor} obtenez de {def_target} la moitié de ce que vous vouliez{?tool_used: malgré {def_tool}|}. L\'objet peine, hoquette, s\'arrête trop tôt.',
    'L\'effet se produit puis retombe : {def_target} n\'a plus assez de charge, ou plus assez d\'envie.',
  ]],
  [null, 'partial', 'high', [
    '{actor} arrachez à {def_target} un dernier sursaut de fonctionnement{?tool_used:, {def_tool} maintenue de force|}. Ce sera court. Faites-en quelque chose.',
    'Dans la précipitation, l\'utilisation est bâclée : un résultat partiel, un voyant qui clignote, et pas de seconde tentative possible.',
  ]],
  [null, 'failure', 'low', [
    '{actor} manipulez {def_target} sans obtenir la moindre réaction{?tool_used:, y compris avec {def_tool}|}. Vide, mort, ou pas prévu pour ça.',
    'Rien ne se passe. L\'objet est peut-être intact, mais il ne vous servira pas ici{?tool_used: — {def_tool} n\'y change rien|}.',
  ]],
  [null, 'failure', 'mid', [
    '{actor} insistez sur {def_target}{?tool_used: avec {def_tool}|} sans résultat. Il manque une pièce, une charge, ou une autorisation.',
    'L\'objet refuse obstinément de fonctionner. Chaque tentative coûte du temps, et le temps est ce que vous avez de plus rare.',
  ]],
  [null, 'crit_failure', 'mid', [
    '{actor} déclenchez {def_target} de travers{?tool_used: via {def_tool}|}. Un claquement, une odeur de brûlé, et l\'objet ne servira plus jamais.',
    'L\'utilisation tourne mal : quelque chose se décharge dans le mauvais sens{?tool_used:, emportant {def_tool}|} et vous laisse les mains engourdies.',
  ]],
  [null, 'crit_failure', 'high', [
    '{actor} employez {def_target} à l\'aveugle et provoquez exactement l\'inverse de ce que vous vouliez{?tool_used: — {def_tool} n\'y survit pas|}. Le module entier réagit.',
    'L\'objet vous explose à moitié dans les mains{?tool_used:, entraînant {def_tool}|}. Le bruit, la lumière, la douleur — tout arrive en même temps.',
  ]],
  ['usable', 'crit_success', 'mid', [
    '{actor} employez {def_target} exactement comme son concepteur l\'avait rêvé{?tool_used:, {def_tool} en complément|}. Rendement parfait, aucune perte.',
    'L\'objet est fait pour ça, et vous le faites bien : un seul geste, un résultat net, et une réserve intacte pour la prochaine fois.',
  ]],
  ['alive', 'auto_success', 'low', [
    '{actor} nettoyez la plaie de {def_target} et refermez proprement. Les gestes reviennent tout seuls.',
    'Compresse, pression, bandage : {def_target} vous laisse faire sans un mot, les yeux rivés au plafond.',
  ]],
  ['alive', 'auto_success', 'mid', [
    '{actor} stabilisez {def_target} avec ce que vous avez sous la main. Ce n\'est pas de la médecine, c\'est du colmatage — mais ça tient.',
    'Vous travaillez vite et bien sur {def_target}. La respiration se régularise ; le regard, moins.',
  ]],
  ['alive', 'crit_success', 'mid', [
    '{actor} trouvez la source du saignement là où personne ne l\'aurait cherchée, et {def_target} reprend des couleurs en quelques secondes.',
    'Garrot, suture, immobilisation — les gestes s\'enchaînent sans une hésitation, et {def_target} tiendra bien plus longtemps que prévu.',
  ]],
  ['alive', 'success', 'low', [
    '{actor} soignez {def_target} du mieux possible. La plaie est propre, le pansement tient. Le reste ne dépend plus de vous.',
    'Les soins font effet lentement : {def_target} desserre les mâchoires et vous adresse un regard qui vaut un merci.',
  ]],
  ['alive', 'success', 'mid', [
    '{actor} arrêtez l\'hémorragie de {def_target} après deux tentatives. Ça tiendra le temps qu\'il faudra.',
    'Le pansement est grossier mais efficace, et {def_target} se redresse, pâle, vivant.',
  ]],
  ['alive', 'success', 'high', [
    '{actor} bandez {def_target} en trois gestes et le remettez sur ses jambes. On soignera correctement plus tard — ou jamais.',
    'Pas de désinfectant, pas de temps : vous comprimez, vous serrez, et vous tirez {def_target} debout.',
  ]],
  ['alive', 'partial', 'mid', [
    '{actor} ralentissez le saignement de {def_target} sans le stopper. Le sang continue de perler à travers le tissu.',
    'Les soins prennent, à moitié : {def_target} respire mieux, mais quelque chose ne va toujours pas.',
  ]],
  ['alive', 'failure', 'low', [
    '{actor} tentez de soigner {def_target} sans y parvenir. Vos moyens sont dérisoires face à ce genre de blessure.',
    'Le pansement glisse, le sang revient, et {def_target} secoue la tête : inutile.',
  ]],
  ['alive', 'failure', 'mid', [
    '{actor} vous acharnez sur les plaies de {def_target} sans rien améliorer. Il faudrait du matériel que ce vaisseau n\'a plus.',
    'Rien ne prend. La blessure de {def_target} est plus profonde qu\'elle n\'en avait l\'air, et vous le savez tous les deux.',
  ]],
  ['alive', 'failure', 'high', [
    '{actor} travaillez sur {def_target} pendant que tout s\'effondre autour. Le pouls continue de faiblir, et vos mains ne suffisent pas.',
    'Trop de sang, trop peu de temps : {def_target} vous regarde échouer sans vous en vouloir, et c\'est le pire.',
  ]],
  ['alive', 'crit_failure', 'mid', [
    '{actor} appuyez au mauvais endroit. Quelque chose cède sous vos doigts et {def_target} pousse un cri qui va porter loin.',
    'Le geste rate complètement : le bandage comprime ce qu\'il ne fallait pas, et l\'état de {def_target} empire à vue d\'œil.',
  ]],
]);

// ============================================================================
// TALK — social (CHA)
// ============================================================================

const TALK_VARIANTS = variants('TALK', 'social', [
  [null, 'auto_success', 'low', [
    '{actor} adressez la parole à {def_target}. Les mots sortent plus facilement que prévu dans ce silence.',
    'Quelques phrases échangées, rien de décisif. Mais le son d\'une voix, ici, vaut déjà quelque chose.',
  ]],
  [null, 'success', 'mid', [
    '{actor} obtenez de {def_target} plus qu\'une réponse polie. La conversation ouvre une porte.',
    'L\'échange trouve son rythme, et {def_target} finit par lâcher un détail qui n\'était pas destiné à vos oreilles.',
  ]],
  [null, 'failure', 'mid', [
    '{actor} parlez ; personne ne répond vraiment. Les mots tombent dans le vide, comme le reste.',
    'L\'échange tourne court. Ce que vous cherchiez à obtenir reste de l\'autre côté du silence.',
  ]],
  ['sentient', 'auto_success', 'low', [
    '{actor} engagez la conversation avec {def_target}. Le ton reste neutre, presque cordial — un luxe par les temps qui courent.',
    'Vous parlez, {def_target} écoute. Rien d\'important ne se dit, et c\'est presque reposant.',
  ]],
  ['sentient', 'auto_success', 'mid', [
    '{actor} échangez quelques mots avec {def_target} en surveillant le couloir. La discussion est brève, utile, tendue.',
    'La conversation se tient à voix basse : {def_target} répond par phrases courtes, l\'oreille ailleurs.',
  ]],
  ['sentient', 'auto_success', 'high', [
    '{actor} lancez trois mots à {def_target} entre deux respirations. Ce n\'est pas une conversation, c\'est une coordination.',
    'Pas le temps de discuter : vous criez l\'essentiel à {def_target} et espérez que ça suffise.',
  ]],
  ['sentient', 'crit_success', 'low', [
    '{actor} trouvez exactement le ton qu\'il fallait : {def_target} se détend et raconte beaucoup plus qu\'il ne le voulait.',
    'Une remarque anodine, un silence bien placé, et la confiance s\'installe — {def_target} vous parle désormais comme à un allié.',
  ]],
  ['sentient', 'crit_success', 'mid', [
    '{actor} désamorcez la méfiance de {def_target} en une phrase. Ce que vous obtenez ensuite change la donne.',
    'L\'échange bascule : {def_target} cesse de calculer et se met à parler franchement. Écoutez bien, ça ne durera pas.',
  ]],
  ['sentient', 'crit_success', 'high', [
    '{actor} dites la seule chose capable de traverser la panique de {def_target}. Le regard se stabilise. Vous avez récupéré un allié.',
    'Au milieu du chaos, votre voix porte, et {def_target} vous suit désormais sans discuter. Vous ne saurez jamais pourquoi.',
  ]],
  ['sentient', 'success', 'low', [
    '{actor} obtenez de {def_target} des réponses correctes, sans chaleur excessive. C\'est un début.',
    'La conversation reste prudente des deux côtés : {def_target} livre ce qu\'il juge sans risque.',
  ]],
  ['sentient', 'success', 'mid', [
    '{actor} maintenez le dialogue malgré la tension, et {def_target} accepte de coopérer — sous conditions.',
    'Il faut insister, reformuler, promettre un peu avant que {def_target} ne cède sur l\'essentiel.',
  ]],
  ['sentient', 'success', 'high', [
    '{actor} arrachez une réponse à {def_target} entre deux détonations. C\'est court, c\'est utile, ça suffira.',
    'La discussion tient sur un fil, et pourtant {def_target} vous donne ce dont vous avez besoin. Continuez à avancer.',
  ]],
  ['sentient', 'failure', 'low', [
    '{actor} parlez à {def_target} sans obtenir autre chose que des évidences. La méfiance reste entière.',
    'L\'échange est poli et parfaitement stérile : {def_target} ne dira rien de plus aujourd\'hui.',
  ]],
  ['sentient', 'failure', 'mid', [
    '{actor} insistez ; {def_target} se referme un peu plus à chaque question. Mauvaise approche, mauvais moment.',
    'Les mots ne prennent pas : {def_target} vous écoute jusqu\'au bout, puis détourne les yeux.',
  ]],
  ['sentient', 'failure', 'high', [
    '{actor} criez pour être entendu, mais {def_target} n\'écoute plus personne. La peur a pris toute la place.',
    'Votre voix se perd dans le vacarme, et {def_target} agit à sa manière — pas la vôtre.',
  ]],
  ['sentient', 'crit_failure', 'low', [
    '{actor} dites exactement le mot qu\'il ne fallait pas, et {def_target} se ferme définitivement. Il s\'en souviendra.',
    'Une maladresse suffit. Ce que {def_target} vous accordait de confiance vient de disparaître.',
  ]],
  ['sentient', 'crit_failure', 'mid', [
    '{actor} touchez un sujet interdit, et {def_target} recule d\'un pas — la main quelque part où elle ne devrait pas être.',
    'La conversation dérape en quelques secondes : {def_target} vous considère désormais comme une partie du problème.',
  ]],
  ['sentient', 'crit_failure', 'high', [
    '{actor} hurlez ce qu\'il ne fallait surtout pas crier, et {def_target} panique. Sa panique fait beaucoup de bruit.',
    'Vos mots achèvent ce que la peur avait commencé : {def_target} s\'enfuit, ou pire, se retourne contre vous.',
  ]],
]);

// ============================================================================
// MOVE_TO — interaction (auto verb; auto_success cells already have three)
// ============================================================================

const MOVE_TO_VARIANTS = variants('MOVE_TO', 'interaction', [
  [null, 'success', 'low', [
    '{actor} contournez les débris et gagnez {def_target}. Rien de compliqué, juste long.',
    'Le passage demande de se baisser, de ramper, de jurer un peu. Vous atteignez {def_target} en un seul morceau.',
  ]],
  [null, 'success', 'mid', [
    '{actor} vous frayez un chemin jusqu\'à {def_target} en enjambant ce qu\'il vaut mieux ne pas regarder.',
    'Le trajet est plus difficile que la carte ne le laissait croire, mais {def_target} finit par apparaître devant vous.',
  ]],
  [null, 'failure', 'mid', [
    '{actor} tentez de rejoindre {def_target} et butez sur un effondrement. Ce chemin n\'existe plus.',
    'Le passage vers {def_target} est obstrué par des débris que vous ne déplacerez pas seul. Il faut une autre route.',
  ]],
  [null, 'failure', 'high', [
    '{actor} vous élancez vers {def_target} et devez faire demi-tour immédiatement. Quelque chose bloque — ou attend.',
    'La route vers {def_target} se referme sous vos yeux. Trouvez autre chose, vite.',
  ]],
]);

// ============================================================================
// COMBINED EXPORT
// ============================================================================

/** Extra variants for the most-played verbs — merged into ACTION_TEMPLATES. */
export const ACTION_VARIANT_TEMPLATES: readonly ActionTemplate[] = [
  ...STRIKE_VARIANTS,
  ...BREAK_VARIANTS,
  ...CUT_VARIANTS,
  ...SHOOT_VARIANTS,
  ...HACK_VARIANTS,
  ...REPAIR_VARIANTS,
  ...EXAMINE_VARIANTS,
  ...OPEN_VARIANTS,
  ...TAKE_VARIANTS,
  ...USE_VARIANTS,
  ...TALK_VARIANTS,
  ...MOVE_TO_VARIANTS,
];

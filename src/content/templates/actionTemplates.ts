// ---------------------------------------------------------------------------
// src/content/templates/actionTemplates.ts — Action narrative templates (Layer 1)
// ---------------------------------------------------------------------------
// Comprehensive templates for the 15 core verbs, category-level fallbacks,
// absurd/creative action templates, and generic outcome fallbacks.
//
// French text is atmospheric space horror. English text is placeholder.
// Slot syntax: {actor}, {def_target}, {indef_target}, {target}, {def_tool},
// {tool_used}, {target_adj:adj}, {?slot:if present|if absent}, {npc_name},
// {sound}, {location}, {emotion}.
// ---------------------------------------------------------------------------

import type { ActionTemplate } from '../../narration/types';
import type { Outcome } from '../../narration/types';

// ============================================================================
// STRIKE — physical (FOR)
// ============================================================================

const STRIKE_TEMPLATES: readonly ActionTemplate[] = [
  // --- auto_success ---
  {
    id: 'physical_STRIKE_any_auto_success_low',
    verb: 'STRIKE',
    targetType: null,
    outcome: 'auto_success',
    tension: 'low',
    category: 'physical',
    text: {
      fr: '{actor} frappez {def_target}{?tool_used: avec {def_tool}|}. Le coup porte sans effort, un geste presque machinal dans le silence du vaisseau.',
      en: '',
    },
  },
  {
    id: 'physical_STRIKE_any_auto_success_mid',
    verb: 'STRIKE',
    targetType: null,
    outcome: 'auto_success',
    tension: 'mid',
    category: 'physical',
    text: {
      fr: '{actor} abattez votre poing sur {def_target}{?tool_used: en brandissant {def_tool}|}. Contact immédiat. Pas de résistance.',
      en: '',
    },
  },
  // --- crit_success ---
  {
    id: 'physical_STRIKE_any_crit_success_low',
    verb: 'STRIKE',
    targetType: null,
    outcome: 'crit_success',
    tension: 'low',
    category: 'physical',
    text: {
      fr: '{actor} frappez {def_target}{?tool_used: avec {def_tool}|} avec une précision chirurgicale. L\'impact résonne dans le couloir désert, net et définitif.',
      en: '',
    },
  },
  {
    id: 'physical_STRIKE_any_crit_success_mid',
    verb: 'STRIKE',
    targetType: null,
    outcome: 'crit_success',
    tension: 'mid',
    category: 'physical',
    text: {
      fr: 'Un coup parfait. {actor} frappez {def_target}{?tool_used: avec {def_tool}|} et un craquement satisfaisant confirme la violence de l\'impact. Des fragments tournoyent dans l\'air recyclé.',
      en: '',
    },
  },
  {
    id: 'physical_STRIKE_any_crit_success_high',
    verb: 'STRIKE',
    targetType: null,
    outcome: 'crit_success',
    tension: 'high',
    category: 'physical',
    text: {
      fr: 'Dans un élan désespéré, {actor} abattez toute votre force sur {def_target}{?tool_used: à travers {def_tool}|}. L\'impact est dévastateur — {target} cède dans une gerbe d\'éclats qui ricochent sur les cloisons métalliques.',
      en: '',
    },
  },
  // --- success ---
  {
    id: 'physical_STRIKE_any_success_low',
    verb: 'STRIKE',
    targetType: null,
    outcome: 'success',
    tension: 'low',
    category: 'physical',
    text: {
      fr: '{actor} frappez {def_target}{?tool_used: avec {def_tool}|}. Le coup atteint sa cible avec un bruit sourd qui se perd dans les coursives.',
      en: '',
    },
  },
  {
    id: 'physical_STRIKE_any_success_mid',
    verb: 'STRIKE',
    targetType: null,
    outcome: 'success',
    tension: 'mid',
    category: 'physical',
    text: {
      fr: '{actor} assénez un coup solide à {def_target}{?tool_used: en utilisant {def_tool}|}. L\'impact fait vibrer vos articulations, mais {target} encaisse le choc.',
      en: '',
    },
  },
  {
    id: 'physical_STRIKE_any_success_high',
    verb: 'STRIKE',
    targetType: null,
    outcome: 'success',
    tension: 'high',
    category: 'physical',
    text: {
      fr: '{actor} frappez avec la force du désespoir. {def_target} absorbe l\'impact{?tool_used: de {def_tool}|} — pas assez pour le détruire, mais suffisamment pour faire la différence.',
      en: '',
    },
  },
  // --- partial ---
  {
    id: 'physical_STRIKE_any_partial_low',
    verb: 'STRIKE',
    targetType: null,
    outcome: 'partial',
    tension: 'low',
    category: 'physical',
    text: {
      fr: '{actor} frappez {def_target}{?tool_used: avec {def_tool}|}, mais le coup dévie légèrement. L\'impact est amorti, à peine suffisant.',
      en: '',
    },
  },
  {
    id: 'physical_STRIKE_any_partial_mid',
    verb: 'STRIKE',
    targetType: null,
    outcome: 'partial',
    tension: 'mid',
    category: 'physical',
    text: {
      fr: 'Le coup touche {def_target}{?tool_used: via {def_tool}|}, mais pas là où {actor} visiez. Un impact oblique — des dégâts superficiels, rien de décisif.',
      en: '',
    },
  },
  {
    id: 'physical_STRIKE_any_partial_high',
    verb: 'STRIKE',
    targetType: null,
    outcome: 'partial',
    tension: 'high',
    category: 'physical',
    text: {
      fr: '{actor} lancez un coup rageur vers {def_target}{?tool_used: avec {def_tool}|}. Le choc est réel mais insuffisant — {target} résiste encore, et le temps presse.',
      en: '',
    },
  },
  // --- failure ---
  {
    id: 'physical_STRIKE_any_failure_low',
    verb: 'STRIKE',
    targetType: null,
    outcome: 'failure',
    tension: 'low',
    category: 'physical',
    text: {
      fr: '{actor} tentez de frapper {def_target}{?tool_used: avec {def_tool}|}, mais le coup passe dans le vide. Le silence qui suit est presque moqueur.',
      en: '',
    },
  },
  {
    id: 'physical_STRIKE_any_failure_mid',
    verb: 'STRIKE',
    targetType: null,
    outcome: 'failure',
    tension: 'mid',
    category: 'physical',
    text: {
      fr: 'Votre coup rate {def_target}{?tool_used: malgré {def_tool}|}. L\'énergie gaspillée vous laisse un instant vulnérable dans le couloir baigné de lumière rouge.',
      en: '',
    },
  },
  // --- crit_failure ---
  {
    id: 'physical_STRIKE_any_crit_failure_mid',
    verb: 'STRIKE',
    targetType: null,
    outcome: 'crit_failure',
    tension: 'mid',
    category: 'physical',
    text: {
      fr: '{actor} frappez avec toute votre force — et ratez complètement. L\'élan vous déséquilibre{?tool_used: et {def_tool} vous échappe des mains|}. Une douleur vive irradie dans votre bras.',
      en: '',
    },
  },
  {
    id: 'physical_STRIKE_any_crit_failure_high',
    verb: 'STRIKE',
    targetType: null,
    outcome: 'crit_failure',
    tension: 'high',
    category: 'physical',
    text: {
      fr: 'Le coup manque {def_target} et votre poing s\'écrase contre la cloison métallique{?tool_used: — {def_tool} heurte la paroi avec un bruit sourd|}. La douleur remonte jusqu\'à l\'épaule. Mauvais moment pour perdre l\'équilibre.',
      en: '',
    },
  },
];

// ============================================================================
// BREAK — physical (FOR)
// ============================================================================

const BREAK_TEMPLATES: readonly ActionTemplate[] = [
  // --- auto_success ---
  {
    id: 'physical_BREAK_any_auto_success_low',
    verb: 'BREAK',
    targetType: null,
    outcome: 'auto_success',
    tension: 'low',
    category: 'physical',
    text: {
      fr: '{def_target} cède sans résistance sous vos mains{?tool_used:, aidé par {def_tool}|}. Les morceaux tombent au sol avec un tintement métallique.',
      en: '',
    },
  },
  {
    id: 'physical_BREAK_any_auto_success_mid',
    verb: 'BREAK',
    targetType: null,
    outcome: 'auto_success',
    tension: 'mid',
    category: 'physical',
    text: {
      fr: '{actor} brisez {def_target}{?tool_used: avec {def_tool}|}. L\'objet se disloque comme s\'il n\'attendait que ça, fragile vestige d\'un vaisseau qui agonise.',
      en: '',
    },
  },
  // --- crit_success ---
  {
    id: 'physical_BREAK_breakable_crit_success_low',
    verb: 'BREAK',
    targetType: 'breakable',
    outcome: 'crit_success',
    tension: 'low',
    category: 'physical',
    text: {
      fr: '{def_target} éclate en fragments sous votre impact{?tool_used: amplifié par {def_tool}|}. Des débris scintillent brièvement dans la lumière d\'urgence avant de retomber.',
      en: '',
    },
  },
  {
    id: 'physical_BREAK_any_crit_success_mid',
    verb: 'BREAK',
    targetType: null,
    outcome: 'crit_success',
    tension: 'mid',
    category: 'physical',
    text: {
      fr: 'Un unique coup{?tool_used: de {def_tool}|}. {def_target} vole en éclats comme du verre spatial. Le bruit de la destruction résonne dans {location}, suivi d\'un silence inquiétant.',
      en: '',
    },
  },
  {
    id: 'physical_BREAK_any_crit_success_high',
    verb: 'BREAK',
    targetType: null,
    outcome: 'crit_success',
    tension: 'high',
    category: 'physical',
    text: {
      fr: '{actor} fracassez {def_target}{?tool_used: avec {def_tool}|} en un geste primitif et furieux. L\'explosion de débris projette des éclats contre les parois. Le passage est ouvert. Il était temps.',
      en: '',
    },
  },
  // --- success ---
  {
    id: 'physical_BREAK_any_success_low',
    verb: 'BREAK',
    targetType: null,
    outcome: 'success',
    tension: 'low',
    category: 'physical',
    text: {
      fr: 'Après quelques coups{?tool_used: de {def_tool}|}, {def_target} cède avec un craquement sec. Des fragments glissent sur le plancher métallique.',
      en: '',
    },
  },
  {
    id: 'physical_BREAK_any_success_mid',
    verb: 'BREAK',
    targetType: null,
    outcome: 'success',
    tension: 'mid',
    category: 'physical',
    text: {
      fr: '{actor} forcez sur {def_target}{?tool_used: avec {def_tool}|}. La structure résiste un instant, puis se rompt. Un courant d\'air froid s\'engouffre par l\'ouverture.',
      en: '',
    },
  },
  {
    id: 'physical_BREAK_any_success_high',
    verb: 'BREAK',
    targetType: null,
    outcome: 'success',
    tension: 'high',
    category: 'physical',
    text: {
      fr: '{def_target} cède enfin{?tool_used: sous les assauts de {def_tool}|}. L\'effort vous a coûté de précieuses secondes, mais c\'est fait — le chemin est dégagé.',
      en: '',
    },
  },
  // --- partial ---
  {
    id: 'physical_BREAK_any_partial_mid',
    verb: 'BREAK',
    targetType: null,
    outcome: 'partial',
    tension: 'mid',
    category: 'physical',
    text: {
      fr: '{def_target} se fissure{?tool_used: sous les coups de {def_tool}|}, mais tient encore. Des craquelures parcourent la surface — il faudra un autre essai pour en venir à bout.',
      en: '',
    },
  },
  {
    id: 'physical_BREAK_any_partial_high',
    verb: 'BREAK',
    targetType: null,
    outcome: 'partial',
    tension: 'high',
    category: 'physical',
    text: {
      fr: '{actor} frappez {def_target}{?tool_used: avec {def_tool}|} de toutes vos forces. Des fissures apparaissent — mais {target} résiste encore. Quelque chose approche dans le couloir derrière vous.',
      en: '',
    },
  },
  // --- failure ---
  {
    id: 'physical_BREAK_any_failure_low',
    verb: 'BREAK',
    targetType: null,
    outcome: 'failure',
    tension: 'low',
    category: 'physical',
    text: {
      fr: '{actor} frappez {def_target}{?tool_used: avec {def_tool}|}, mais la structure refuse de céder. Vos mains vibrent sous le choc — {target} est plus solide que prévu.',
      en: '',
    },
  },
  {
    id: 'physical_BREAK_any_failure_mid',
    verb: 'BREAK',
    targetType: null,
    outcome: 'failure',
    tension: 'mid',
    category: 'physical',
    text: {
      fr: 'L\'impact ne suffit pas. {def_target} absorbe le choc{?tool_used: malgré la force de {def_tool}|} sans montrer la moindre fissure. {actor} reculez, essoufflé.',
      en: '',
    },
  },
  // --- crit_failure ---
  {
    id: 'physical_BREAK_any_crit_failure_mid',
    verb: 'BREAK',
    targetType: null,
    outcome: 'crit_failure',
    tension: 'mid',
    category: 'physical',
    text: {
      fr: 'Le coup rebondit violemment sur {def_target}, envoyant une onde de choc dans votre bras{?tool_used:. {def_tool} se déforme sous l\'impact|}. Un engourdissement douloureux envahit vos doigts.',
      en: '',
    },
  },
  {
    id: 'physical_BREAK_any_crit_failure_high',
    verb: 'BREAK',
    targetType: null,
    outcome: 'crit_failure',
    tension: 'high',
    category: 'physical',
    text: {
      fr: 'L\'impact contre {def_target} vous renvoie en arrière{?tool_used: et {def_tool} vous échappe|}. Le retour de force déchire quelque chose dans votre épaule. L\'alarme continue de hurler, indifférente.',
      en: '',
    },
  },
];

// ============================================================================
// CUT — physical (FOR)
// ============================================================================

const CUT_TEMPLATES: readonly ActionTemplate[] = [
  // --- auto_success ---
  {
    id: 'physical_CUT_any_auto_success_low',
    verb: 'CUT',
    targetType: null,
    outcome: 'auto_success',
    tension: 'low',
    category: 'physical',
    text: {
      fr: '{actor} tranchez {def_target}{?tool_used: avec {def_tool}|}. La lame glisse sans résistance, propre et nette.',
      en: '',
    },
  },
  {
    id: 'physical_CUT_any_auto_success_mid',
    verb: 'CUT',
    targetType: null,
    outcome: 'auto_success',
    tension: 'mid',
    category: 'physical',
    text: {
      fr: '{def_target} se sépare en deux sous votre lame{?tool_used:, {def_tool} rendant le travail trivial|}. Les sections tombent de chaque côté avec un bruit mou.',
      en: '',
    },
  },
  // --- crit_success ---
  {
    id: 'physical_CUT_any_crit_success_low',
    verb: 'CUT',
    targetType: null,
    outcome: 'crit_success',
    tension: 'low',
    category: 'physical',
    text: {
      fr: 'Une coupe parfaite. {actor} tranchez {def_target}{?tool_used: avec {def_tool}|} en un seul geste fluide. Les deux moitiés s\'écartent doucement dans le silence du module.',
      en: '',
    },
  },
  {
    id: 'physical_CUT_cuttable_crit_success_mid',
    verb: 'CUT',
    targetType: 'cuttable',
    outcome: 'crit_success',
    tension: 'mid',
    category: 'physical',
    text: {
      fr: '{def_tool} tranche à travers {def_target} comme dans du beurre. La section tombe, exposant l\'intérieur — fils, conduites, et cette substance sombre qui suinte toujours.',
      en: '',
    },
  },
  {
    id: 'physical_CUT_any_crit_success_high',
    verb: 'CUT',
    targetType: null,
    outcome: 'crit_success',
    tension: 'high',
    category: 'physical',
    text: {
      fr: 'D\'un mouvement désespéré mais précis, {actor} tailladez {def_target}{?tool_used: avec {def_tool}|}. La coupure est nette, profonde, définitive. Pas le temps d\'admirer — il faut bouger.',
      en: '',
    },
  },
  // --- success ---
  {
    id: 'physical_CUT_any_success_low',
    verb: 'CUT',
    targetType: null,
    outcome: 'success',
    tension: 'low',
    category: 'physical',
    text: {
      fr: '{actor} entaillez {def_target}{?tool_used: avec {def_tool}|}. La coupure est franche, le travail accompli.',
      en: '',
    },
  },
  {
    id: 'physical_CUT_any_success_mid',
    verb: 'CUT',
    targetType: null,
    outcome: 'success',
    tension: 'mid',
    category: 'physical',
    text: {
      fr: 'La lame{?tool_used: de {def_tool}|} mord dans {def_target} et traverse. Un filet de fluide s\'écoule de la section — hydraulique, espérez-vous.',
      en: '',
    },
  },
  {
    id: 'physical_CUT_any_success_high',
    verb: 'CUT',
    targetType: null,
    outcome: 'success',
    tension: 'high',
    category: 'physical',
    text: {
      fr: '{actor} taillez dans {def_target}{?tool_used: avec {def_tool}|} en y mettant toute votre urgence. La coupure cède — un nouveau passage s\'ouvre devant vous.',
      en: '',
    },
  },
  // --- partial ---
  {
    id: 'physical_CUT_any_partial_mid',
    verb: 'CUT',
    targetType: null,
    outcome: 'partial',
    tension: 'mid',
    category: 'physical',
    text: {
      fr: '{actor} entamez {def_target}{?tool_used: avec {def_tool}|}, mais la coupure reste superficielle. La surface résiste plus que prévu — il faudra insister.',
      en: '',
    },
  },
  {
    id: 'physical_CUT_any_partial_high',
    verb: 'CUT',
    targetType: null,
    outcome: 'partial',
    tension: 'high',
    category: 'physical',
    text: {
      fr: 'La lame racle {def_target}{?tool_used: — {def_tool} peine à trancher|}. Une entaille partielle. Pas suffisant, pas encore. Le temps file.',
      en: '',
    },
  },
  // --- failure ---
  {
    id: 'physical_CUT_any_failure_low',
    verb: 'CUT',
    targetType: null,
    outcome: 'failure',
    tension: 'low',
    category: 'physical',
    text: {
      fr: '{actor} tentez de couper {def_target}{?tool_used: avec {def_tool}|}, mais la surface refuse de se laisser entamer. Pas une éraflure.',
      en: '',
    },
  },
  {
    id: 'physical_CUT_any_failure_mid',
    verb: 'CUT',
    targetType: null,
    outcome: 'failure',
    tension: 'mid',
    category: 'physical',
    text: {
      fr: 'La lame glisse sur {def_target} sans l\'entamer{?tool_used:. {def_tool} n\'est pas assez tranchant pour ce matériau|}. Le temps perdu pèse sur vos épaules.',
      en: '',
    },
  },
  // --- crit_failure ---
  {
    id: 'physical_CUT_any_crit_failure_mid',
    verb: 'CUT',
    targetType: null,
    outcome: 'crit_failure',
    tension: 'mid',
    category: 'physical',
    text: {
      fr: 'La lame dérape sur {def_target}{?tool_used: — {def_tool} vous échappe et|} vous entaille la main. Du sang perle entre vos doigts, sombre dans la lumière rouge des urgences.',
      en: '',
    },
  },
  {
    id: 'physical_CUT_any_crit_failure_high',
    verb: 'CUT',
    targetType: null,
    outcome: 'crit_failure',
    tension: 'high',
    category: 'physical',
    text: {
      fr: '{actor} taillez frénétiquement dans {def_target}, mais la lame ricoche et mord votre propre chair{?tool_used:. {def_tool} est maintenant maculé de votre sang|}. La douleur est immédiate, la situation pire qu\'avant.',
      en: '',
    },
  },
];

// ============================================================================
// HACK — technical (INT)
// ============================================================================

const HACK_TEMPLATES: readonly ActionTemplate[] = [
  // --- auto_success ---
  {
    id: 'technical_HACK_any_auto_success_low',
    verb: 'HACK',
    targetType: null,
    outcome: 'auto_success',
    tension: 'low',
    category: 'technical',
    text: {
      fr: '{actor} accédez au système de {def_target}{?tool_used: via {def_tool}|}. Sécurité minimale — le mot de passe par défaut n\'a jamais été changé.',
      en: '',
    },
  },
  {
    id: 'technical_HACK_electronic_auto_success_mid',
    verb: 'HACK',
    targetType: 'electronic',
    outcome: 'auto_success',
    tension: 'mid',
    category: 'technical',
    text: {
      fr: 'Le pare-feu de {def_target} est obsolète. {actor} le contournez en quelques commandes{?tool_used: grâce à {def_tool}|}. Accès total.',
      en: '',
    },
  },
  // --- crit_success ---
  {
    id: 'technical_HACK_any_crit_success_low',
    verb: 'HACK',
    targetType: null,
    outcome: 'crit_success',
    tension: 'low',
    category: 'technical',
    text: {
      fr: 'Les défenses numériques de {def_target} s\'effondrent sous vos doigts{?tool_used:, assisté par {def_tool}|}. Accès root. Tous les logs, données et contrôles s\'offrent à vous.',
      en: '',
    },
  },
  {
    id: 'technical_HACK_programmable_crit_success_mid',
    verb: 'HACK',
    targetType: 'programmable',
    outcome: 'crit_success',
    tension: 'mid',
    category: 'technical',
    text: {
      fr: '{actor} percez les protocoles de sécurité de {def_target}{?tool_used: en injectant via {def_tool}|} comme un chirurgien. L\'architecture s\'ouvre — vous avez un contrôle total sur le système.',
      en: '',
    },
  },
  {
    id: 'technical_HACK_any_crit_success_high',
    verb: 'HACK',
    targetType: null,
    outcome: 'crit_success',
    tension: 'high',
    category: 'technical',
    text: {
      fr: 'Les doigts tremblants, {actor} exécutez la séquence d\'intrusion sur {def_target}{?tool_used: avec {def_tool}|}. Le système capitule instantanément. Un accès providentiel — chaque seconde compte.',
      en: '',
    },
  },
  // --- success ---
  {
    id: 'technical_HACK_any_success_low',
    verb: 'HACK',
    targetType: null,
    outcome: 'success',
    tension: 'low',
    category: 'technical',
    text: {
      fr: '{actor} infiltrez {def_target}{?tool_used: via {def_tool}|}. Les couches de sécurité tombent une à une, révélant l\'interface de contrôle.',
      en: '',
    },
  },
  {
    id: 'technical_HACK_any_success_mid',
    verb: 'HACK',
    targetType: null,
    outcome: 'success',
    tension: 'mid',
    category: 'technical',
    text: {
      fr: 'Après plusieurs tentatives, {actor} trouvez la faille dans {def_target}{?tool_used: grâce à {def_tool}|}. L\'écran clignote et affiche l\'accès — vous êtes dedans.',
      en: '',
    },
  },
  {
    id: 'technical_HACK_any_success_high',
    verb: 'HACK',
    targetType: null,
    outcome: 'success',
    tension: 'high',
    category: 'technical',
    text: {
      fr: '{actor} forcez l\'accès à {def_target}{?tool_used: via {def_tool}|} juste avant que l\'alarme ne se déclenche. Le système est sous votre contrôle — pour combien de temps, impossible à dire.',
      en: '',
    },
  },
  // --- partial ---
  {
    id: 'technical_HACK_any_partial_mid',
    verb: 'HACK',
    targetType: null,
    outcome: 'partial',
    tension: 'mid',
    category: 'technical',
    text: {
      fr: '{actor} percez partiellement les défenses de {def_target}{?tool_used: avec {def_tool}|}. Accès limité — lecture seule. Les commandes critiques restent verrouillées.',
      en: '',
    },
  },
  {
    id: 'technical_HACK_any_partial_high',
    verb: 'HACK',
    targetType: null,
    outcome: 'partial',
    tension: 'high',
    category: 'technical',
    text: {
      fr: 'L\'intrusion dans {def_target} stagne{?tool_used: malgré {def_tool}|}. {actor} obtenez un accès fragmentaire — assez pour lire quelques données, pas assez pour prendre le contrôle.',
      en: '',
    },
  },
  // --- failure ---
  {
    id: 'technical_HACK_any_failure_low',
    verb: 'HACK',
    targetType: null,
    outcome: 'failure',
    tension: 'low',
    category: 'technical',
    text: {
      fr: '{def_target} rejette chaque tentative d\'intrusion{?tool_used: malgré l\'aide de {def_tool}|}. Le prompt de sécurité clignote — « ACCÈS REFUSÉ » en lettres rouges.',
      en: '',
    },
  },
  {
    id: 'technical_HACK_any_failure_mid',
    verb: 'HACK',
    targetType: null,
    outcome: 'failure',
    tension: 'mid',
    category: 'technical',
    text: {
      fr: 'Le chiffrement de {def_target} est trop robuste{?tool_used:, même pour {def_tool}|}. {actor} reculez, frustré. L\'écran affiche un compte à rebours de verrouillage.',
      en: '',
    },
  },
  // --- crit_failure ---
  {
    id: 'technical_HACK_any_crit_failure_mid',
    verb: 'HACK',
    targetType: null,
    outcome: 'crit_failure',
    tension: 'mid',
    category: 'technical',
    text: {
      fr: 'Votre tentative d\'intrusion déclenche un protocole de contre-mesure. {def_target} se verrouille{?tool_used: et {def_tool} affiche un écran bleu|}, une alarme silencieuse pulse dans le réseau du vaisseau.',
      en: '',
    },
  },
  {
    id: 'technical_HACK_any_crit_failure_high',
    verb: 'HACK',
    targetType: null,
    outcome: 'crit_failure',
    tension: 'high',
    category: 'technical',
    text: {
      fr: 'Le piratage échoue catastrophiquement. {def_target} déclenche une purge de données{?tool_used: qui frit les circuits de {def_tool}|} et une alerte se propage dans tous les systèmes du vaisseau. Quelque chose vient de vous remarquer.',
      en: '',
    },
  },
];

// ============================================================================
// REPAIR — technical (INT)
// ============================================================================

const REPAIR_TEMPLATES: readonly ActionTemplate[] = [
  // --- auto_success ---
  {
    id: 'technical_REPAIR_any_auto_success_low',
    verb: 'REPAIR',
    targetType: null,
    outcome: 'auto_success',
    tension: 'low',
    category: 'technical',
    text: {
      fr: '{actor} remettez {def_target} en état{?tool_used: grâce à {def_tool}|}. Une réparation de routine, presque rassurante dans sa normalité.',
      en: '',
    },
  },
  {
    id: 'technical_REPAIR_any_auto_success_mid',
    verb: 'REPAIR',
    targetType: null,
    outcome: 'auto_success',
    tension: 'mid',
    category: 'technical',
    text: {
      fr: 'Quelques ajustements{?tool_used: avec {def_tool}|} et {def_target} reprend vie. Un voyant passe du rouge au vert — un rare motif d\'espoir ici.',
      en: '',
    },
  },
  // --- crit_success ---
  {
    id: 'technical_REPAIR_any_crit_success_low',
    verb: 'REPAIR',
    targetType: null,
    outcome: 'crit_success',
    tension: 'low',
    category: 'technical',
    text: {
      fr: '{actor} réparez {def_target}{?tool_used: avec {def_tool}|} avec une efficacité remarquable. Le système redémarre — mieux que son état d\'origine, dirait-on.',
      en: '',
    },
  },
  {
    id: 'technical_REPAIR_broken_crit_success_mid',
    verb: 'REPAIR',
    targetType: 'broken',
    outcome: 'crit_success',
    tension: 'mid',
    category: 'technical',
    text: {
      fr: 'Vos mains{?tool_used: armées de {def_tool}|} travaillent avec une précision presque surnaturelle. {def_target} reprend vie dans un bourdonnement satisfaisant. Tous les indicateurs sont au vert.',
      en: '',
    },
  },
  {
    id: 'technical_REPAIR_any_crit_success_high',
    verb: 'REPAIR',
    targetType: null,
    outcome: 'crit_success',
    tension: 'high',
    category: 'technical',
    text: {
      fr: 'Les mains qui tremblaient il y a un instant deviennent miraculeusement stables. {actor} réparez {def_target}{?tool_used: avec {def_tool}|} en un temps record. L\'appareil ronronne — un miracle technique sous la pression.',
      en: '',
    },
  },
  // --- success ---
  {
    id: 'technical_REPAIR_any_success_low',
    verb: 'REPAIR',
    targetType: null,
    outcome: 'success',
    tension: 'low',
    category: 'technical',
    text: {
      fr: '{actor} remettez {def_target} en état de marche{?tool_used: grâce à {def_tool}|}. Ce n\'est pas élégant, mais ça fonctionne.',
      en: '',
    },
  },
  {
    id: 'technical_REPAIR_any_success_mid',
    verb: 'REPAIR',
    targetType: null,
    outcome: 'success',
    tension: 'mid',
    category: 'technical',
    text: {
      fr: 'Après avoir identifié le problème, {actor} effectuez la réparation{?tool_used: avec {def_tool}|}. {def_target} cliquète, siffle, puis redémarre. Fonctionnel, au moins.',
      en: '',
    },
  },
  {
    id: 'technical_REPAIR_any_success_high',
    verb: 'REPAIR',
    targetType: null,
    outcome: 'success',
    tension: 'high',
    category: 'technical',
    text: {
      fr: '{actor} travaillez sous pression, les doigts agiles malgré la peur. {def_target} reprend vie{?tool_used: sous les soins de {def_tool}|} — juste à temps.',
      en: '',
    },
  },
  // --- partial ---
  {
    id: 'technical_REPAIR_any_partial_mid',
    verb: 'REPAIR',
    targetType: null,
    outcome: 'partial',
    tension: 'mid',
    category: 'technical',
    text: {
      fr: '{def_target} repart partiellement{?tool_used: après intervention avec {def_tool}|}. Le système fonctionne, mais de façon intermittente — des ratés toutes les quelques secondes.',
      en: '',
    },
  },
  {
    id: 'technical_REPAIR_any_partial_high',
    verb: 'REPAIR',
    targetType: null,
    outcome: 'partial',
    tension: 'high',
    category: 'technical',
    text: {
      fr: '{actor} parvenez à remettre {def_target} en marche{?tool_used: avec {def_tool}|}, mais le système est instable. Ça tiendra — quelques minutes, peut-être. Peut-être pas.',
      en: '',
    },
  },
  // --- failure ---
  {
    id: 'technical_REPAIR_any_failure_low',
    verb: 'REPAIR',
    targetType: null,
    outcome: 'failure',
    tension: 'low',
    category: 'technical',
    text: {
      fr: '{actor} tentez de réparer {def_target}{?tool_used: avec {def_tool}|}, mais le problème est plus grave que prévu. Les composants internes sont irrécupérables dans leur état actuel.',
      en: '',
    },
  },
  {
    id: 'technical_REPAIR_any_failure_mid',
    verb: 'REPAIR',
    targetType: null,
    outcome: 'failure',
    tension: 'mid',
    category: 'technical',
    text: {
      fr: 'Les connexions internes de {def_target} sont un labyrinthe corrodé{?tool_used:. Même {def_tool} ne peut rien|}. La réparation échoue, laissant {target} dans son état lamentable.',
      en: '',
    },
  },
  // --- crit_failure ---
  {
    id: 'technical_REPAIR_any_crit_failure_mid',
    verb: 'REPAIR',
    targetType: null,
    outcome: 'crit_failure',
    tension: 'mid',
    category: 'technical',
    text: {
      fr: 'Un court-circuit jaillit de {def_target} pendant la réparation{?tool_used:, envoyant une décharge à travers {def_tool}|}. L\'odeur de câble brûlé envahit l\'air. C\'est pire qu\'avant.',
      en: '',
    },
  },
  {
    id: 'technical_REPAIR_any_crit_failure_high',
    verb: 'REPAIR',
    targetType: null,
    outcome: 'crit_failure',
    tension: 'high',
    category: 'technical',
    text: {
      fr: '{def_target} explose en une gerbe d\'étincelles pendant votre tentative de réparation{?tool_used:. {def_tool} prend feu|}. Les lumières du module clignotent. {actor} avez aggravé la situation de façon spectaculaire.',
      en: '',
    },
  },
];

// ============================================================================
// EXAMINE — perception (PER)
// ============================================================================

const EXAMINE_TEMPLATES: readonly ActionTemplate[] = [
  // --- auto_success ---
  {
    id: 'perception_EXAMINE_any_auto_success_low',
    verb: 'EXAMINE',
    targetType: null,
    outcome: 'auto_success',
    tension: 'low',
    category: 'perception',
    text: {
      fr: '{actor} examinez {def_target}{?tool_used: à l\'aide de {def_tool}|}. Les détails sont évidents, clairement visibles dans la lumière tamisée du module.',
      en: '',
    },
  },
  {
    id: 'perception_EXAMINE_any_auto_success_mid',
    verb: 'EXAMINE',
    targetType: null,
    outcome: 'auto_success',
    tension: 'mid',
    category: 'perception',
    text: {
      fr: 'Un coup d\'œil suffit. {def_target} n\'a aucun secret que vos yeux{?tool_used:, assistés par {def_tool},|} ne puissent percer.',
      en: '',
    },
  },
  // --- crit_success ---
  {
    id: 'perception_EXAMINE_any_crit_success_low',
    verb: 'EXAMINE',
    targetType: null,
    outcome: 'crit_success',
    tension: 'low',
    category: 'perception',
    text: {
      fr: '{actor} étudiez {def_target}{?tool_used: avec {def_tool}|} avec une attention méticuleuse. Chaque détail se révèle — des marques, des indices que personne d\'autre n\'aurait remarqués.',
      en: '',
    },
  },
  {
    id: 'perception_EXAMINE_any_crit_success_mid',
    verb: 'EXAMINE',
    targetType: null,
    outcome: 'crit_success',
    tension: 'mid',
    category: 'perception',
    text: {
      fr: 'Votre regard perçant analyse {def_target}{?tool_used: à travers {def_tool}|}. Là — un détail crucial que vous seul pouviez voir. L\'information change tout.',
      en: '',
    },
  },
  {
    id: 'perception_EXAMINE_any_crit_success_high',
    verb: 'EXAMINE',
    targetType: null,
    outcome: 'crit_success',
    tension: 'high',
    category: 'perception',
    text: {
      fr: 'Malgré l\'urgence, {actor} prenez le temps d\'examiner {def_target}{?tool_used: avec {def_tool}|}. Un éclat de lucidité dans le chaos — vous percevez ce qui aurait dû rester caché.',
      en: '',
    },
  },
  // --- success ---
  {
    id: 'perception_EXAMINE_any_success_low',
    verb: 'EXAMINE',
    targetType: null,
    outcome: 'success',
    tension: 'low',
    category: 'perception',
    text: {
      fr: '{actor} inspectez {def_target}{?tool_used: avec {def_tool}|}. L\'examen révèle des informations utiles sur son état et sa fonction.',
      en: '',
    },
  },
  {
    id: 'perception_EXAMINE_any_success_mid',
    verb: 'EXAMINE',
    targetType: null,
    outcome: 'success',
    tension: 'mid',
    category: 'perception',
    text: {
      fr: 'L\'examen de {def_target}{?tool_used: assisté par {def_tool}|} porte ses fruits. Les détails se précisent — vous comprenez mieux à quoi vous avez affaire.',
      en: '',
    },
  },
  {
    id: 'perception_EXAMINE_any_success_high',
    verb: 'EXAMINE',
    targetType: null,
    outcome: 'success',
    tension: 'high',
    category: 'perception',
    text: {
      fr: 'Un examen rapide mais efficace de {def_target}{?tool_used: via {def_tool}|}. Dans cette situation, même quelques secondes d\'observation valent de l\'or.',
      en: '',
    },
  },
  // --- partial ---
  {
    id: 'perception_EXAMINE_any_partial_mid',
    verb: 'EXAMINE',
    targetType: null,
    outcome: 'partial',
    tension: 'mid',
    category: 'perception',
    text: {
      fr: '{actor} examinez {def_target}{?tool_used: à travers {def_tool}|}, mais la lumière est faible et les détails se dérobent. Quelques indices, rien de concluant.',
      en: '',
    },
  },
  {
    id: 'perception_EXAMINE_any_partial_high',
    verb: 'EXAMINE',
    targetType: null,
    outcome: 'partial',
    tension: 'high',
    category: 'perception',
    text: {
      fr: 'L\'examen de {def_target} est interrompu par le bruit dans les conduits{?tool_used:. {def_tool} ne capte que des données fragmentaires|}. Quelques indices, pas assez pour tout comprendre.',
      en: '',
    },
  },
  // --- failure ---
  {
    id: 'perception_EXAMINE_any_failure_low',
    verb: 'EXAMINE',
    targetType: null,
    outcome: 'failure',
    tension: 'low',
    category: 'perception',
    text: {
      fr: '{actor} inspectez {def_target}{?tool_used: avec {def_tool}|}, mais rien de significatif ne se dégage. Soit il n\'y a rien à trouver, soit vous passez à côté.',
      en: '',
    },
  },
  {
    id: 'perception_EXAMINE_any_failure_mid',
    verb: 'EXAMINE',
    targetType: null,
    outcome: 'failure',
    tension: 'mid',
    category: 'perception',
    text: {
      fr: '{def_target} reste opaque à votre examen{?tool_used: malgré l\'aide de {def_tool}|}. La surface ne révèle rien — ou peut-être que vos yeux refusent de voir.',
      en: '',
    },
  },
  // --- crit_failure ---
  {
    id: 'perception_EXAMINE_any_crit_failure_mid',
    verb: 'EXAMINE',
    targetType: null,
    outcome: 'crit_failure',
    tension: 'mid',
    category: 'perception',
    text: {
      fr: 'En examinant {def_target}{?tool_used: avec {def_tool}|}, vous tirez une conclusion erronée. L\'information que vous croyez avoir trouvée est trompeuse — dangereusement trompeuse.',
      en: '',
    },
  },
  {
    id: 'perception_EXAMINE_any_crit_failure_high',
    verb: 'EXAMINE',
    targetType: null,
    outcome: 'crit_failure',
    tension: 'high',
    category: 'perception',
    text: {
      fr: '{actor} vous penchez pour examiner {def_target}{?tool_used: avec {def_tool}|} — et quelque chose jaillit. Un mécanisme, un piège, ou pire. L\'examen vous a coûté plus que du temps.',
      en: '',
    },
  },
];

// ============================================================================
// PERSUADE — social (CHA)
// ============================================================================

const PERSUADE_TEMPLATES: readonly ActionTemplate[] = [
  // --- auto_success ---
  {
    id: 'social_PERSUADE_any_auto_success_low',
    verb: 'PERSUADE',
    targetType: null,
    outcome: 'auto_success',
    tension: 'low',
    category: 'social',
    text: {
      fr: '{actor} exposez vos arguments à {npc_name}. La raison l\'emporte sans peine — la proposition était irrésistible.',
      en: '',
    },
  },
  {
    id: 'social_PERSUADE_any_auto_success_mid',
    verb: 'PERSUADE',
    targetType: null,
    outcome: 'auto_success',
    tension: 'mid',
    category: 'social',
    text: {
      fr: '{npc_name} n\'avait besoin que d\'un mot. {actor} trouvez le bon, et la résistance fond comme neige.',
      en: '',
    },
  },
  // --- crit_success ---
  {
    id: 'social_PERSUADE_sentient_crit_success_low',
    verb: 'PERSUADE',
    targetType: 'sentient',
    outcome: 'crit_success',
    tension: 'low',
    category: 'social',
    text: {
      fr: 'Vos mots portent une conviction absolue. {npc_name} hoche la tête, convaincu — non, rallié. Vous avez gagné bien plus qu\'un accord.',
      en: '',
    },
  },
  {
    id: 'social_PERSUADE_any_crit_success_mid',
    verb: 'PERSUADE',
    targetType: null,
    outcome: 'crit_success',
    tension: 'mid',
    category: 'social',
    text: {
      fr: '{actor} parlez avec une autorité qui surprend même vous. {npc_name} se tait, puis acquiesce lentement. « D\'accord. On fait comme vous dites. »',
      en: '',
    },
  },
  {
    id: 'social_PERSUADE_any_crit_success_high',
    verb: 'PERSUADE',
    targetType: null,
    outcome: 'crit_success',
    tension: 'high',
    category: 'social',
    text: {
      fr: 'Dans le chaos ambiant, {actor} trouvez les mots justes. {npc_name} attrape votre regard — et choisit de vous croire. Un acte de foi dans l\'enfer.',
      en: '',
    },
  },
  // --- success ---
  {
    id: 'social_PERSUADE_any_success_low',
    verb: 'PERSUADE',
    targetType: null,
    outcome: 'success',
    tension: 'low',
    category: 'social',
    text: {
      fr: '{actor} argumentez avec calme et {npc_name} finit par accepter. Pas d\'enthousiasme, mais une coopération sincère.',
      en: '',
    },
  },
  {
    id: 'social_PERSUADE_any_success_mid',
    verb: 'PERSUADE',
    targetType: null,
    outcome: 'success',
    tension: 'mid',
    category: 'social',
    text: {
      fr: 'Après un échange tendu, {npc_name} se range à votre avis. Un soupir, un regard détourné — mais un accord. C\'est tout ce qui compte.',
      en: '',
    },
  },
  {
    id: 'social_PERSUADE_any_success_high',
    verb: 'PERSUADE',
    targetType: null,
    outcome: 'success',
    tension: 'high',
    category: 'social',
    text: {
      fr: '{actor} parlez vite, avec urgence. {npc_name} hésite une fraction de seconde — puis accepte. Pas le temps de tergiverser.',
      en: '',
    },
  },
  // --- partial ---
  {
    id: 'social_PERSUADE_any_partial_mid',
    verb: 'PERSUADE',
    targetType: null,
    outcome: 'partial',
    tension: 'mid',
    category: 'social',
    text: {
      fr: '{npc_name} est à moitié convaincu. « Peut-être, » concède-t-il, « mais j\'ai mes conditions. » Un compromis, pas une victoire.',
      en: '',
    },
  },
  {
    id: 'social_PERSUADE_any_partial_high',
    verb: 'PERSUADE',
    targetType: null,
    outcome: 'partial',
    tension: 'high',
    category: 'social',
    text: {
      fr: '{actor} plaidez votre cause auprès de {npc_name} entre deux sirènes d\'alarme. La réponse est incertaine — ni oui ni non. Il faudra plus pour le convaincre.',
      en: '',
    },
  },
  // --- failure ---
  {
    id: 'social_PERSUADE_any_failure_low',
    verb: 'PERSUADE',
    targetType: null,
    outcome: 'failure',
    tension: 'low',
    category: 'social',
    text: {
      fr: '{npc_name} écoute poliment, puis secoue la tête. « Non. » Le refus est calme mais définitif.',
      en: '',
    },
  },
  {
    id: 'social_PERSUADE_any_failure_mid',
    verb: 'PERSUADE',
    targetType: null,
    outcome: 'failure',
    tension: 'mid',
    category: 'social',
    text: {
      fr: 'Vos arguments tombent à plat. {npc_name} vous regarde avec une lassitude glaciale. « Vous perdez votre temps et le mien. »',
      en: '',
    },
  },
  // --- crit_failure ---
  {
    id: 'social_PERSUADE_any_crit_failure_mid',
    verb: 'PERSUADE',
    targetType: null,
    outcome: 'crit_failure',
    tension: 'mid',
    category: 'social',
    text: {
      fr: 'Vos paroles déclenchent une hostilité que vous n\'aviez pas anticipée. {npc_name} recule, le visage fermé. « Ne me parlez plus. Jamais. » Vous venez de brûler un pont.',
      en: '',
    },
  },
  {
    id: 'social_PERSUADE_any_crit_failure_high',
    verb: 'PERSUADE',
    targetType: null,
    outcome: 'crit_failure',
    tension: 'high',
    category: 'social',
    text: {
      fr: '{npc_name} se retourne violemment. « Vous mentez ! » Le ton monte, les poings se serrent. Votre tentative de persuasion a déclenché une réaction dangereuse.',
      en: '',
    },
  },
];

// ============================================================================
// INTIMIDATE — social (CHA)
// ============================================================================

const INTIMIDATE_TEMPLATES: readonly ActionTemplate[] = [
  // --- auto_success ---
  {
    id: 'social_INTIMIDATE_any_auto_success_low',
    verb: 'INTIMIDATE',
    targetType: null,
    outcome: 'auto_success',
    tension: 'low',
    category: 'social',
    text: {
      fr: 'Un regard suffit. {npc_name} baisse les yeux et recule d\'un pas. Votre réputation vous précède.',
      en: '',
    },
  },
  {
    id: 'social_INTIMIDATE_any_auto_success_mid',
    verb: 'INTIMIDATE',
    targetType: null,
    outcome: 'auto_success',
    tension: 'mid',
    category: 'social',
    text: {
      fr: '{actor} n\'avez même pas besoin de parler{?tool_used:. {def_tool} dans votre main dit tout ce qu\'il faut|}. {npc_name} obéit, tremblant.',
      en: '',
    },
  },
  // --- crit_success ---
  {
    id: 'social_INTIMIDATE_any_crit_success_low',
    verb: 'INTIMIDATE',
    targetType: null,
    outcome: 'crit_success',
    tension: 'low',
    category: 'social',
    text: {
      fr: '{actor} marchez vers {npc_name}{?tool_used: en brandissant {def_tool}|} sans un mot. La terreur dans ses yeux est palpable — il fera tout ce que vous voulez.',
      en: '',
    },
  },
  {
    id: 'social_INTIMIDATE_any_crit_success_mid',
    verb: 'INTIMIDATE',
    targetType: null,
    outcome: 'crit_success',
    tension: 'mid',
    category: 'social',
    text: {
      fr: 'Votre voix est basse, presque un murmure. Mais chaque syllabe fait reculer {npc_name} d\'un pas{?tool_used: — {def_tool} ajoutant un argument muet|}. La soumission est totale.',
      en: '',
    },
  },
  {
    id: 'social_INTIMIDATE_any_crit_success_high',
    verb: 'INTIMIDATE',
    targetType: null,
    outcome: 'crit_success',
    tension: 'high',
    category: 'social',
    text: {
      fr: 'Couvert de sang et de suie, {actor} fixez {npc_name}. Pas de mots nécessaires. L\'épouvante inscrite sur son visage vaut tous les discours. Il s\'exécute immédiatement.',
      en: '',
    },
  },
  // --- success ---
  {
    id: 'social_INTIMIDATE_any_success_low',
    verb: 'INTIMIDATE',
    targetType: null,
    outcome: 'success',
    tension: 'low',
    category: 'social',
    text: {
      fr: '{actor} durcissez le regard{?tool_used: en faisant peser {def_tool}|}. {npc_name} déglutit et obtempère, sans conviction mais sans résistance.',
      en: '',
    },
  },
  {
    id: 'social_INTIMIDATE_any_success_mid',
    verb: 'INTIMIDATE',
    targetType: null,
    outcome: 'success',
    tension: 'mid',
    category: 'social',
    text: {
      fr: '« Vous ne voulez pas me forcer à insister, » murmurez-vous à {npc_name}{?tool_used:, {def_tool} bien visible|}. Le message passe. Les mains levées en signe de reddition.',
      en: '',
    },
  },
  {
    id: 'social_INTIMIDATE_any_success_high',
    verb: 'INTIMIDATE',
    targetType: null,
    outcome: 'success',
    tension: 'high',
    category: 'social',
    text: {
      fr: 'Dans l\'urgence, {actor} saisissez {npc_name} par le col{?tool_used:. {def_tool} brille sous les lumières d\'alarme|}. Le regard dit tout. La coopération est immédiate.',
      en: '',
    },
  },
  // --- partial ---
  {
    id: 'social_INTIMIDATE_any_partial_mid',
    verb: 'INTIMIDATE',
    targetType: null,
    outcome: 'partial',
    tension: 'mid',
    category: 'social',
    text: {
      fr: '{npc_name} pâlit mais tient bon. « D\'accord, d\'accord, » lâche-t-il — mais ses yeux cherchent une sortie. Compliance temporaire, pas soumission.',
      en: '',
    },
  },
  {
    id: 'social_INTIMIDATE_any_partial_high',
    verb: 'INTIMIDATE',
    targetType: null,
    outcome: 'partial',
    tension: 'high',
    category: 'social',
    text: {
      fr: '{actor} tentez d\'imposer votre volonté à {npc_name}{?tool_used: en montrant {def_tool}|}. Un recul, mais pas de capitulation. La peur est là — insuffisante cependant.',
      en: '',
    },
  },
  // --- failure ---
  {
    id: 'social_INTIMIDATE_any_failure_low',
    verb: 'INTIMIDATE',
    targetType: null,
    outcome: 'failure',
    tension: 'low',
    category: 'social',
    text: {
      fr: '{npc_name} soutient votre regard{?tool_used: sans même jeter un œil à {def_tool}|}. « Vous ne me faites pas peur. » Le ton est plat, sincère.',
      en: '',
    },
  },
  {
    id: 'social_INTIMIDATE_any_failure_mid',
    verb: 'INTIMIDATE',
    targetType: null,
    outcome: 'failure',
    tension: 'mid',
    category: 'social',
    text: {
      fr: 'Votre tentative d\'intimidation se heurte au silence de {npc_name}. Un silence qui en dit long — ce n\'est pas la première fois qu\'on le menace ici. Et il est toujours debout.',
      en: '',
    },
  },
  // --- crit_failure ---
  {
    id: 'social_INTIMIDATE_any_crit_failure_mid',
    verb: 'INTIMIDATE',
    targetType: null,
    outcome: 'crit_failure',
    tension: 'mid',
    category: 'social',
    text: {
      fr: '{npc_name} éclate d\'un rire nerveux. « C\'est tout ? » La moquerie cache mal une colère montante{?tool_used:. {def_tool} ne l\'impressionne visiblement pas|}. Vous venez de vous faire un ennemi.',
      en: '',
    },
  },
  {
    id: 'social_INTIMIDATE_any_crit_failure_high',
    verb: 'INTIMIDATE',
    targetType: null,
    outcome: 'crit_failure',
    tension: 'high',
    category: 'social',
    text: {
      fr: 'Votre menace provoque l\'effet inverse. {npc_name} se redresse, les yeux brûlants de rage. « Vous allez le regretter. » La situation vient de déraper sérieusement.',
      en: '',
    },
  },
];

// ============================================================================
// THROW — physical (AGI)
// ============================================================================

const THROW_TEMPLATES: readonly ActionTemplate[] = [
  // --- auto_success ---
  {
    id: 'physical_THROW_any_auto_success_low',
    verb: 'THROW',
    targetType: null,
    outcome: 'auto_success',
    tension: 'low',
    category: 'physical',
    text: {
      fr: '{actor} lancez{?tool_used: {def_tool}|} vers {def_target}. Le projectile atteint sa cible sans effort particulier.',
      en: '',
    },
  },
  {
    id: 'physical_THROW_any_auto_success_mid',
    verb: 'THROW',
    targetType: null,
    outcome: 'auto_success',
    tension: 'mid',
    category: 'physical',
    text: {
      fr: 'Un lancer naturel. {?tool_used:{def_tool} vole vers|L\'objet vole vers} {def_target} et l\'atteint. Simple. Efficace.',
      en: '',
    },
  },
  // --- crit_success ---
  {
    id: 'physical_THROW_any_crit_success_low',
    verb: 'THROW',
    targetType: null,
    outcome: 'crit_success',
    tension: 'low',
    category: 'physical',
    text: {
      fr: 'Un lancer parfait. {?tool_used:{def_tool} frappe {def_target}|L\'objet frappe {def_target}} en plein centre avec un impact satisfaisant qui résonne dans la coursive.',
      en: '',
    },
  },
  {
    id: 'physical_THROW_any_crit_success_mid',
    verb: 'THROW',
    targetType: null,
    outcome: 'crit_success',
    tension: 'mid',
    category: 'physical',
    text: {
      fr: '{actor} lancez{?tool_used: {def_tool}|} avec une précision mortelle. Le projectile percute {def_target} — un impact dévastateur qui envoie des débris dans l\'air recyclé.',
      en: '',
    },
  },
  {
    id: 'physical_THROW_any_crit_success_high',
    verb: 'THROW',
    targetType: null,
    outcome: 'crit_success',
    tension: 'high',
    category: 'physical',
    text: {
      fr: 'Un geste instinctif, désespéré. {?tool_used:{def_tool} fend|L\'objet fend} l\'air et s\'écrase sur {def_target} avec la force de la survie pure. Impact critique — le temps ralentit une fraction de seconde.',
      en: '',
    },
  },
  // --- success ---
  {
    id: 'physical_THROW_any_success_low',
    verb: 'THROW',
    targetType: null,
    outcome: 'success',
    tension: 'low',
    category: 'physical',
    text: {
      fr: '{?tool_used:{def_tool} atteint|Votre projectile atteint} {def_target} avec un bruit sourd. Pas spectaculaire, mais ça fait le travail.',
      en: '',
    },
  },
  {
    id: 'physical_THROW_any_success_mid',
    verb: 'THROW',
    targetType: null,
    outcome: 'success',
    tension: 'mid',
    category: 'physical',
    text: {
      fr: '{actor} lancez{?tool_used: {def_tool}|} vers {def_target}. Le projectile touche sa cible et fait mouche — un impact net dans la pénombre.',
      en: '',
    },
  },
  {
    id: 'physical_THROW_any_success_high',
    verb: 'THROW',
    targetType: null,
    outcome: 'success',
    tension: 'high',
    category: 'physical',
    text: {
      fr: 'Le lancer atteint {def_target}{?tool_used: — {def_tool} percute la cible|}. Pas le temps de célébrer, mais l\'impact est réel.',
      en: '',
    },
  },
  // --- partial ---
  {
    id: 'physical_THROW_any_partial_mid',
    verb: 'THROW',
    targetType: null,
    outcome: 'partial',
    tension: 'mid',
    category: 'physical',
    text: {
      fr: '{?tool_used:{def_tool} effleure|Le projectile effleure} {def_target} — un lancer imprécis. L\'impact est amoindri, à peine un grattement sur la surface.',
      en: '',
    },
  },
  {
    id: 'physical_THROW_any_partial_high',
    verb: 'THROW',
    targetType: null,
    outcome: 'partial',
    tension: 'high',
    category: 'physical',
    text: {
      fr: '{actor} lancez{?tool_used: {def_tool}|} dans la précipitation. Le projectile touche {def_target} de biais — un impact partiel. Mieux que rien, pas assez pour changer la donne.',
      en: '',
    },
  },
  // --- failure ---
  {
    id: 'physical_THROW_any_failure_low',
    verb: 'THROW',
    targetType: null,
    outcome: 'failure',
    tension: 'low',
    category: 'physical',
    text: {
      fr: 'Le lancer manque {def_target} de peu{?tool_used:. {def_tool} rebondit sur la cloison avec un clang métallique|}. Le silence qui suit est embarrassant.',
      en: '',
    },
  },
  {
    id: 'physical_THROW_any_failure_mid',
    verb: 'THROW',
    targetType: null,
    outcome: 'failure',
    tension: 'mid',
    category: 'physical',
    text: {
      fr: '{?tool_used:{def_tool} passe|Le projectile passe} à côté de {def_target} et se perd dans l\'obscurité du couloir. Le bruit de l\'impact lointain résonne — quelque part, quelque chose a entendu.',
      en: '',
    },
  },
  // --- crit_failure ---
  {
    id: 'physical_THROW_any_crit_failure_mid',
    verb: 'THROW',
    targetType: null,
    outcome: 'crit_failure',
    tension: 'mid',
    category: 'physical',
    text: {
      fr: 'Le lancer dévie grotesquement. {?tool_used:{def_tool} ricoche|Le projectile ricoche} contre une conduite et revient vers vous. La gravité artificielle a des opinions bien à elle dans ce module.',
      en: '',
    },
  },
  {
    id: 'physical_THROW_any_crit_failure_high',
    verb: 'THROW',
    targetType: null,
    outcome: 'crit_failure',
    tension: 'high',
    category: 'physical',
    text: {
      fr: '{actor} lancez{?tool_used: {def_tool}|} avec trop de force. Le projectile manque {def_target}, fracasse un panneau de contrôle derrière, et une gerbe d\'étincelles illumine le module. Situation aggravée.',
      en: '',
    },
  },
];

// ============================================================================
// SHOOT — physical (AGI)
// ============================================================================

const SHOOT_TEMPLATES: readonly ActionTemplate[] = [
  // --- auto_success ---
  {
    id: 'physical_SHOOT_any_auto_success_low',
    verb: 'SHOOT',
    targetType: null,
    outcome: 'auto_success',
    tension: 'low',
    category: 'physical',
    text: {
      fr: '{actor} visez {def_target}{?tool_used: avec {def_tool}|} et tirez. Le tir touche sans effort — cible stationnaire, pas de chance nécessaire.',
      en: '',
    },
  },
  {
    id: 'physical_SHOOT_any_auto_success_mid',
    verb: 'SHOOT',
    targetType: null,
    outcome: 'auto_success',
    tension: 'mid',
    category: 'physical',
    text: {
      fr: 'À cette distance, c\'est un tir facile. {?tool_used:{def_tool} crache|Votre arme crache} une salve. {def_target} absorbe l\'impact sans mystère.',
      en: '',
    },
  },
  // --- crit_success ---
  {
    id: 'physical_SHOOT_any_crit_success_low',
    verb: 'SHOOT',
    targetType: null,
    outcome: 'crit_success',
    tension: 'low',
    category: 'physical',
    text: {
      fr: 'Un tir parfait{?tool_used: de {def_tool}|}. Le projectile atteint {def_target} en plein centre vital. Le point d\'impact fume dans l\'air glacé.',
      en: '',
    },
  },
  {
    id: 'physical_SHOOT_hostile_crit_success_mid',
    verb: 'SHOOT',
    targetType: 'hostile',
    outcome: 'crit_success',
    tension: 'mid',
    category: 'physical',
    text: {
      fr: '{?tool_used:{def_tool} rugit|Votre arme rugit} dans le couloir étroit. Le tir atteint {def_target} avec une violence chirurgicale — un impact dévastateur qui l\'arrête net.',
      en: '',
    },
  },
  {
    id: 'physical_SHOOT_any_crit_success_high',
    verb: 'SHOOT',
    targetType: null,
    outcome: 'crit_success',
    tension: 'high',
    category: 'physical',
    text: {
      fr: 'Le temps ralentit. {actor} pressez la détente{?tool_used: de {def_tool}|}. Le tir traverse le chaos et trouve {def_target} — pile entre les yeux. Le silence après le coup est assourdissant.',
      en: '',
    },
  },
  // --- success ---
  {
    id: 'physical_SHOOT_any_success_low',
    verb: 'SHOOT',
    targetType: null,
    outcome: 'success',
    tension: 'low',
    category: 'physical',
    text: {
      fr: '{actor} tirez sur {def_target}{?tool_used: avec {def_tool}|}. Le tir touche — pas au centre, mais suffisamment pour faire mal.',
      en: '',
    },
  },
  {
    id: 'physical_SHOOT_any_success_mid',
    verb: 'SHOOT',
    targetType: null,
    outcome: 'success',
    tension: 'mid',
    category: 'physical',
    text: {
      fr: 'La détonation{?tool_used: de {def_tool}|} déchire le silence. Le projectile mord {def_target} — un bon tir dans cette lumière défaillante.',
      en: '',
    },
  },
  {
    id: 'physical_SHOOT_any_success_high',
    verb: 'SHOOT',
    targetType: null,
    outcome: 'success',
    tension: 'high',
    category: 'physical',
    text: {
      fr: '{actor} tirez{?tool_used: avec {def_tool}|} à travers la fumée. Le projectile trouve {def_target} — un impact sourd, un hurlement, ou peut-être les deux.',
      en: '',
    },
  },
  // --- partial ---
  {
    id: 'physical_SHOOT_any_partial_mid',
    verb: 'SHOOT',
    targetType: null,
    outcome: 'partial',
    tension: 'mid',
    category: 'physical',
    text: {
      fr: 'Le tir{?tool_used: de {def_tool}|} érafle {def_target}. Un sillon de métal arraché — des dégâts, mais pas suffisants pour neutraliser.',
      en: '',
    },
  },
  {
    id: 'physical_SHOOT_any_partial_high',
    verb: 'SHOOT',
    targetType: null,
    outcome: 'partial',
    tension: 'high',
    category: 'physical',
    text: {
      fr: '{actor} tirez{?tool_used: avec {def_tool}|} mais la cible bouge. Le projectile touche {def_target} de biais — un impact oblique, de la chair ou du métal arraché, rien de définitif.',
      en: '',
    },
  },
  // --- failure ---
  {
    id: 'physical_SHOOT_any_failure_low',
    verb: 'SHOOT',
    targetType: null,
    outcome: 'failure',
    tension: 'low',
    category: 'physical',
    text: {
      fr: 'Le tir{?tool_used: de {def_tool}|} manque {def_target}. Le projectile s\'enfonce dans la cloison avec un bruit sec. La marque d\'impact fume doucement.',
      en: '',
    },
  },
  {
    id: 'physical_SHOOT_any_failure_mid',
    verb: 'SHOOT',
    targetType: null,
    outcome: 'failure',
    tension: 'mid',
    category: 'physical',
    text: {
      fr: '{actor} pressez la détente{?tool_used: de {def_tool}|} — le recul, la détonation, et... rien. {def_target} est toujours là, intact. Le projectile a manqué sa cible dans la pénombre.',
      en: '',
    },
  },
  // --- crit_failure ---
  {
    id: 'physical_SHOOT_any_crit_failure_mid',
    verb: 'SHOOT',
    targetType: null,
    outcome: 'crit_failure',
    tension: 'mid',
    category: 'physical',
    text: {
      fr: '{?tool_used:{def_tool} s\'enraye|Votre arme s\'enraye} au pire moment. Un déclic mortifiant au lieu de la détonation attendue. {def_target} est toujours là — et vous, désarmé.',
      en: '',
    },
  },
  {
    id: 'physical_SHOOT_any_crit_failure_high',
    verb: 'SHOOT',
    targetType: null,
    outcome: 'crit_failure',
    tension: 'high',
    category: 'physical',
    text: {
      fr: 'Le tir dévie et ricoche sur la paroi blindée. L\'écho de la détonation{?tool_used: de {def_tool}|} couvre un bruit de vitre qui se fissure — vous venez de toucher un hublot. L\'alarme de dépressurisation hurle.',
      en: '',
    },
  },
];

// ============================================================================
// CLIMB — physical (AGI)
// ============================================================================

const CLIMB_TEMPLATES: readonly ActionTemplate[] = [
  // --- auto_success ---
  {
    id: 'physical_CLIMB_any_auto_success_low',
    verb: 'CLIMB',
    targetType: null,
    outcome: 'auto_success',
    tension: 'low',
    category: 'physical',
    text: {
      fr: '{actor} grimpez sur {def_target}{?tool_used: en vous aidant de {def_tool}|}. Les prises sont évidentes, l\'ascension aisée.',
      en: '',
    },
  },
  {
    id: 'physical_CLIMB_any_auto_success_mid',
    verb: 'CLIMB',
    targetType: null,
    outcome: 'auto_success',
    tension: 'mid',
    category: 'physical',
    text: {
      fr: '{def_target} offre des prises naturelles. {actor} escaladez sans difficulté{?tool_used:, {def_tool} en main pour assurer la montée|}.',
      en: '',
    },
  },
  // --- crit_success ---
  {
    id: 'physical_CLIMB_climbable_crit_success_low',
    verb: 'CLIMB',
    targetType: 'climbable',
    outcome: 'crit_success',
    tension: 'low',
    category: 'physical',
    text: {
      fr: '{actor} escaladez {def_target}{?tool_used: avec l\'aide de {def_tool}|} avec une fluidité surprenante. On dirait que vous avez fait ça toute votre vie, même en gravité artificielle.',
      en: '',
    },
  },
  {
    id: 'physical_CLIMB_any_crit_success_mid',
    verb: 'CLIMB',
    targetType: null,
    outcome: 'crit_success',
    tension: 'mid',
    category: 'physical',
    text: {
      fr: 'Mouvement après mouvement, {actor} grimpez {def_target}{?tool_used: en plantant {def_tool} pour assurance|} avec une efficacité remarquable. En quelques secondes, vous surplombez le module.',
      en: '',
    },
  },
  {
    id: 'physical_CLIMB_any_crit_success_high',
    verb: 'CLIMB',
    targetType: null,
    outcome: 'crit_success',
    tension: 'high',
    category: 'physical',
    text: {
      fr: 'L\'adrénaline fait le travail. {actor} escaladez {def_target}{?tool_used: avec {def_tool}|} à une vitesse presque inhumaine. Le vertige n\'existe plus — il n\'y a que la survie.',
      en: '',
    },
  },
  // --- success ---
  {
    id: 'physical_CLIMB_any_success_low',
    verb: 'CLIMB',
    targetType: null,
    outcome: 'success',
    tension: 'low',
    category: 'physical',
    text: {
      fr: '{actor} escaladez {def_target}{?tool_used: en crochetant {def_tool} aux aspérités|}. L\'ascension est lente mais sûre.',
      en: '',
    },
  },
  {
    id: 'physical_CLIMB_any_success_mid',
    verb: 'CLIMB',
    targetType: null,
    outcome: 'success',
    tension: 'mid',
    category: 'physical',
    text: {
      fr: 'Prise après prise, {actor} grimpez le long de {def_target}{?tool_used: avec {def_tool}|}. Les muscles brûlent, mais vous progressez — le sommet se rapproche.',
      en: '',
    },
  },
  {
    id: 'physical_CLIMB_any_success_high',
    verb: 'CLIMB',
    targetType: null,
    outcome: 'success',
    tension: 'high',
    category: 'physical',
    text: {
      fr: '{actor} grimpez {def_target}{?tool_used: aidé de {def_tool}|} sans regarder en bas. Chaque seconde compte — le métal vibre sous vos doigts, comme si quelque chose approchait par en dessous.',
      en: '',
    },
  },
  // --- partial ---
  {
    id: 'physical_CLIMB_any_partial_mid',
    verb: 'CLIMB',
    targetType: null,
    outcome: 'partial',
    tension: 'mid',
    category: 'physical',
    text: {
      fr: '{actor} parvenez à monter à mi-hauteur de {def_target}{?tool_used: avec {def_tool}|}, puis les prises deviennent rares. Coincé entre deux niveaux, ni en haut ni en bas.',
      en: '',
    },
  },
  {
    id: 'physical_CLIMB_any_partial_high',
    verb: 'CLIMB',
    targetType: null,
    outcome: 'partial',
    tension: 'high',
    category: 'physical',
    text: {
      fr: 'L\'ascension de {def_target} s\'arrête net. {actor} êtes bloqué{?tool_used:, {def_tool} coincé dans une fissure|}. Plus de prises — et quelque chose gratte en dessous.',
      en: '',
    },
  },
  // --- failure ---
  {
    id: 'physical_CLIMB_any_failure_low',
    verb: 'CLIMB',
    targetType: null,
    outcome: 'failure',
    tension: 'low',
    category: 'physical',
    text: {
      fr: '{actor} tentez d\'escalader {def_target}{?tool_used: avec {def_tool}|}, mais la surface est trop lisse. Vos doigts glissent, et vous retombez à votre point de départ.',
      en: '',
    },
  },
  {
    id: 'physical_CLIMB_any_failure_mid',
    verb: 'CLIMB',
    targetType: null,
    outcome: 'failure',
    tension: 'mid',
    category: 'physical',
    text: {
      fr: 'La condensation sur {def_target} rend la surface traîtresse{?tool_used: — même {def_tool} ne trouve pas de prise|}. {actor} redescendez, les paumes humides et les bras tremblants.',
      en: '',
    },
  },
  // --- crit_failure ---
  {
    id: 'physical_CLIMB_any_crit_failure_mid',
    verb: 'CLIMB',
    targetType: null,
    outcome: 'crit_failure',
    tension: 'mid',
    category: 'physical',
    text: {
      fr: 'Vos doigts lâchent {def_target}{?tool_used: et {def_tool} tombe avec un fracas métallique|}. La chute est brutale — votre dos heurte le sol avec un impact qui coupe le souffle.',
      en: '',
    },
  },
  {
    id: 'physical_CLIMB_any_crit_failure_high',
    verb: 'CLIMB',
    targetType: null,
    outcome: 'crit_failure',
    tension: 'high',
    category: 'physical',
    text: {
      fr: '{actor} grimpez et une prise cède sous votre poids. La chute du haut de {def_target} est violente{?tool_used:, {def_tool} rebondissant à côté de vous|}. Quelque chose craque dans votre cheville. Le sol tangue.',
      en: '',
    },
  },
];

// ============================================================================
// HIDE — physical (AGI)
// ============================================================================

const HIDE_TEMPLATES: readonly ActionTemplate[] = [
  // --- auto_success ---
  {
    id: 'physical_HIDE_any_auto_success_low',
    verb: 'HIDE',
    targetType: null,
    outcome: 'auto_success',
    tension: 'low',
    category: 'physical',
    text: {
      fr: '{actor} vous dissimulez derrière {def_target}{?tool_used:, {def_tool} plaqué contre vous|}. Le silence revient. Personne ne cherche, de toute façon.',
      en: '',
    },
  },
  {
    id: 'physical_HIDE_any_auto_success_mid',
    verb: 'HIDE',
    targetType: null,
    outcome: 'auto_success',
    tension: 'mid',
    category: 'physical',
    text: {
      fr: 'Les ombres de {location} sont profondes. {actor} vous y fondez{?tool_used:, {def_tool} serré contre vous|}, invisible.',
      en: '',
    },
  },
  // --- crit_success ---
  {
    id: 'physical_HIDE_any_crit_success_low',
    verb: 'HIDE',
    targetType: null,
    outcome: 'crit_success',
    tension: 'low',
    category: 'physical',
    text: {
      fr: '{actor} trouvez une cachette parfaite près de {def_target}{?tool_used:, {def_tool} bien dissimulé|}. Même en connaissant votre position, on ne vous trouverait pas.',
      en: '',
    },
  },
  {
    id: 'physical_HIDE_any_crit_success_mid',
    verb: 'HIDE',
    targetType: null,
    outcome: 'crit_success',
    tension: 'mid',
    category: 'physical',
    text: {
      fr: '{actor} vous coulez dans la pénombre comme un spectre{?tool_used:, {def_tool} ne produisant pas le moindre reflet|}. Votre respiration ralentit. Vous ne faites plus qu\'un avec les ténèbres du vaisseau.',
      en: '',
    },
  },
  {
    id: 'physical_HIDE_any_crit_success_high',
    verb: 'HIDE',
    targetType: null,
    outcome: 'crit_success',
    tension: 'high',
    category: 'physical',
    text: {
      fr: 'Quelque chose passe à un mètre de vous. {actor} ne respirez plus, tassé dans l\'ombre de {def_target}{?tool_used:, {def_tool} silencieux|}. Ça passe. Ça ne vous a pas vu. Votre cœur repart.',
      en: '',
    },
  },
  // --- success ---
  {
    id: 'physical_HIDE_any_success_low',
    verb: 'HIDE',
    targetType: null,
    outcome: 'success',
    tension: 'low',
    category: 'physical',
    text: {
      fr: '{actor} vous accroupissez derrière {def_target}{?tool_used: en dissimulant {def_tool}|}. La cachette n\'est pas idéale, mais elle suffit.',
      en: '',
    },
  },
  {
    id: 'physical_HIDE_any_success_mid',
    verb: 'HIDE',
    targetType: null,
    outcome: 'success',
    tension: 'mid',
    category: 'physical',
    text: {
      fr: '{actor} rampez dans l\'ombre de {def_target}{?tool_used:, {def_tool} contre vous|}. Le bruit de pas s\'éloigne lentement — vous n\'avez pas été repéré.',
      en: '',
    },
  },
  {
    id: 'physical_HIDE_any_success_high',
    verb: 'HIDE',
    targetType: null,
    outcome: 'success',
    tension: 'high',
    category: 'physical',
    text: {
      fr: '{actor} plongez derrière {def_target} juste à temps{?tool_used:, {def_tool} plaqué sous votre corps|}. Ce qui approche passe devant votre cachette sans ralentir. Le danger s\'éloigne — pour l\'instant.',
      en: '',
    },
  },
  // --- partial ---
  {
    id: 'physical_HIDE_any_partial_mid',
    verb: 'HIDE',
    targetType: null,
    outcome: 'partial',
    tension: 'mid',
    category: 'physical',
    text: {
      fr: '{actor} vous cachez près de {def_target}{?tool_used:, mais {def_tool} dépasse légèrement|}. Pas tout à fait invisible — un observateur attentif pourrait vous repérer.',
      en: '',
    },
  },
  {
    id: 'physical_HIDE_any_partial_high',
    verb: 'HIDE',
    targetType: null,
    outcome: 'partial',
    tension: 'high',
    category: 'physical',
    text: {
      fr: '{actor} plongez derrière {def_target}{?tool_used: en traînant {def_tool}|}, mais votre pied racle le sol métallique. Le bruit résonne — quelque chose s\'arrête dans le couloir, écoute...',
      en: '',
    },
  },
  // --- failure ---
  {
    id: 'physical_HIDE_any_failure_low',
    verb: 'HIDE',
    targetType: null,
    outcome: 'failure',
    tension: 'low',
    category: 'physical',
    text: {
      fr: 'La cachette près de {def_target} est trop exposée{?tool_used:, et {def_tool} vous encombre|}. {actor} êtes visible comme un phare dans cette section.',
      en: '',
    },
  },
  {
    id: 'physical_HIDE_any_failure_mid',
    verb: 'HIDE',
    targetType: null,
    outcome: 'failure',
    tension: 'mid',
    category: 'physical',
    text: {
      fr: '{actor} tentez de vous planquer derrière {def_target}{?tool_used:, {def_tool} trahissant votre position|}, mais l\'espace est trop étroit. Vous êtes à découvert — et quelque chose approche.',
      en: '',
    },
  },
  // --- crit_failure ---
  {
    id: 'physical_HIDE_any_crit_failure_mid',
    verb: 'HIDE',
    targetType: null,
    outcome: 'crit_failure',
    tension: 'mid',
    category: 'physical',
    text: {
      fr: 'En cherchant à vous cacher, {actor} heurtez {def_target}{?tool_used: et {def_tool} tombe avec fracas|}. Le vacarme résonne dans tout le module. Si quelque chose ne savait pas où vous étiez — maintenant, c\'est fait.',
      en: '',
    },
  },
  {
    id: 'physical_HIDE_any_crit_failure_high',
    verb: 'HIDE',
    targetType: null,
    outcome: 'crit_failure',
    tension: 'high',
    category: 'physical',
    text: {
      fr: '{actor} plongez vers {def_target} — et quelque chose y est déjà. Des yeux vous fixent dans l\'obscurité{?tool_used:. {def_tool} roule au sol, inutile|}. La cachette se transforme en piège.',
      en: '',
    },
  },
];

// ============================================================================
// OPEN — interaction
// ============================================================================

const OPEN_TEMPLATES: readonly ActionTemplate[] = [
  // --- auto_success ---
  {
    id: 'interaction_OPEN_any_auto_success_low',
    verb: 'OPEN',
    targetType: null,
    outcome: 'auto_success',
    tension: 'low',
    category: 'interaction',
    text: {
      fr: '{actor} ouvrez {def_target}{?tool_used: à l\'aide de {def_tool}|}. Le mécanisme cède sans résistance, bien huilé malgré les années.',
      en: '',
    },
  },
  {
    id: 'interaction_OPEN_any_auto_success_mid',
    verb: 'OPEN',
    targetType: null,
    outcome: 'auto_success',
    tension: 'mid',
    category: 'interaction',
    text: {
      fr: '{def_target} s\'ouvre avec un sifflement pneumatique familier{?tool_used: sous l\'action de {def_tool}|}. Un courant d\'air froid et vicié s\'échappe de l\'ouverture.',
      en: '',
    },
  },
  // --- crit_success ---
  {
    id: 'interaction_OPEN_locked_crit_success_low',
    verb: 'OPEN',
    targetType: 'locked',
    outcome: 'crit_success',
    tension: 'low',
    category: 'interaction',
    text: {
      fr: 'Le verrou de {def_target} cède presque trop facilement{?tool_used: sous {def_tool}|}. L\'ouverture révèle l\'intérieur — intact, préservé. Exactement ce dont vous aviez besoin.',
      en: '',
    },
  },
  {
    id: 'interaction_OPEN_any_crit_success_mid',
    verb: 'OPEN',
    targetType: null,
    outcome: 'crit_success',
    tension: 'mid',
    category: 'interaction',
    text: {
      fr: '{actor} ouvrez {def_target}{?tool_used: grâce à {def_tool}|} en un geste fluide. Le panneau coulisse et l\'air change — une pièce préservée, ou du moins ce qu\'il en reste.',
      en: '',
    },
  },
  {
    id: 'interaction_OPEN_any_crit_success_high',
    verb: 'OPEN',
    targetType: null,
    outcome: 'crit_success',
    tension: 'high',
    category: 'physical',
    text: {
      fr: '{def_target} s\'ouvre brusquement{?tool_used: sous la pression de {def_tool}|} — juste à temps. Le passage s\'ouvre sur un échappatoire que vous n\'espériez plus.',
      en: '',
    },
  },
  // --- success ---
  {
    id: 'interaction_OPEN_any_success_low',
    verb: 'OPEN',
    targetType: null,
    outcome: 'success',
    tension: 'low',
    category: 'interaction',
    text: {
      fr: '{actor} ouvrez {def_target}{?tool_used: avec {def_tool}|}. Le mécanisme grince mais s\'exécute. L\'ouverture laisse entrer un courant d\'air stale.',
      en: '',
    },
  },
  {
    id: 'interaction_OPEN_any_success_mid',
    verb: 'OPEN',
    targetType: null,
    outcome: 'success',
    tension: 'mid',
    category: 'interaction',
    text: {
      fr: 'Après une résistance initiale, {def_target} cède et s\'ouvre{?tool_used: grâce à {def_tool}|}. Au-delà — l\'obscurité, et l\'odeur caractéristique du métal froid.',
      en: '',
    },
  },
  {
    id: 'interaction_OPEN_any_success_high',
    verb: 'OPEN',
    targetType: null,
    outcome: 'success',
    tension: 'high',
    category: 'interaction',
    text: {
      fr: '{def_target} s\'ouvre{?tool_used: sous la force de {def_tool}|} dans un gémissement d\'acier. Pas le temps de réfléchir — {actor} vous engouffrez dans l\'ouverture.',
      en: '',
    },
  },
  // --- partial ---
  {
    id: 'interaction_OPEN_any_partial_mid',
    verb: 'OPEN',
    targetType: null,
    outcome: 'partial',
    tension: 'mid',
    category: 'interaction',
    text: {
      fr: '{def_target} s\'entrouvre de quelques centimètres{?tool_used: sous {def_tool}|} puis se bloque. Assez pour voir, assez pour sentir l\'air vicié, pas assez pour passer.',
      en: '',
    },
  },
  {
    id: 'interaction_OPEN_any_partial_high',
    verb: 'OPEN',
    targetType: null,
    outcome: 'partial',
    tension: 'high',
    category: 'interaction',
    text: {
      fr: '{actor} forcez {def_target}{?tool_used: avec {def_tool}|} — une ouverture partielle, juste assez large pour y glisser un bras, pas le corps. Le temps manque pour faire mieux.',
      en: '',
    },
  },
  // --- failure ---
  {
    id: 'interaction_OPEN_any_failure_low',
    verb: 'OPEN',
    targetType: null,
    outcome: 'failure',
    tension: 'low',
    category: 'interaction',
    text: {
      fr: '{def_target} refuse de s\'ouvrir{?tool_used: malgré l\'utilisation de {def_tool}|}. Le mécanisme est grippé ou verrouillé — impossible à dire sans plus d\'investigation.',
      en: '',
    },
  },
  {
    id: 'interaction_OPEN_any_failure_mid',
    verb: 'OPEN',
    targetType: null,
    outcome: 'failure',
    tension: 'mid',
    category: 'interaction',
    text: {
      fr: '{actor} tirez, poussez, tordez — {def_target} ne bouge pas d\'un millimètre{?tool_used:. Même {def_tool} n\'y fait rien|}. La frustration monte dans le bourdonnement du module.',
      en: '',
    },
  },
  // --- crit_failure ---
  {
    id: 'interaction_OPEN_any_crit_failure_mid',
    verb: 'OPEN',
    targetType: null,
    outcome: 'crit_failure',
    tension: 'mid',
    category: 'interaction',
    text: {
      fr: 'En forçant {def_target}, le mécanisme se bloque définitivement{?tool_used: et {def_tool} reste coincé dans la serrure|}. Plus aucune chance de l\'ouvrir par cette méthode.',
      en: '',
    },
  },
  {
    id: 'interaction_OPEN_any_crit_failure_high',
    verb: 'OPEN',
    targetType: null,
    outcome: 'crit_failure',
    tension: 'high',
    category: 'interaction',
    text: {
      fr: '{def_target} se bloque et l\'alarme de sécurité se déclenche. Le verrouillage d\'urgence s\'active{?tool_used: — {def_tool} est piégé dans le mécanisme|}. La voie est définitivement condamnée.',
      en: '',
    },
  },
];

// ============================================================================
// TAKE — interaction
// ============================================================================

const TAKE_TEMPLATES: readonly ActionTemplate[] = [
  // --- auto_success ---
  {
    id: 'interaction_TAKE_any_auto_success_low',
    verb: 'TAKE',
    targetType: null,
    outcome: 'auto_success',
    tension: 'low',
    category: 'interaction',
    text: {
      fr: '{actor} ramassez {def_target}. L\'objet est léger, compact — il trouve sa place dans votre inventaire sans difficulté.',
      en: '',
    },
  },
  {
    id: 'interaction_TAKE_any_auto_success_mid',
    verb: 'TAKE',
    targetType: null,
    outcome: 'auto_success',
    tension: 'mid',
    category: 'interaction',
    text: {
      fr: '{def_target} passe de la surface froide du sol à vos mains. Un geste rapide{?tool_used:, {def_tool} libérant l\'objet de son support|}.',
      en: '',
    },
  },
  // --- crit_success ---
  {
    id: 'interaction_TAKE_any_crit_success_low',
    verb: 'TAKE',
    targetType: null,
    outcome: 'crit_success',
    tension: 'low',
    category: 'interaction',
    text: {
      fr: '{actor} prenez {def_target}. En le soulevant, vous remarquez quelque chose d\'autre en dessous — une découverte supplémentaire inattendue.',
      en: '',
    },
  },
  {
    id: 'interaction_TAKE_any_crit_success_mid',
    verb: 'TAKE',
    targetType: null,
    outcome: 'crit_success',
    tension: 'mid',
    category: 'interaction',
    text: {
      fr: '{actor} saisissez {def_target}{?tool_used: en le détachant avec {def_tool}|}. L\'objet est en meilleur état que prévu — parfaitement fonctionnel.',
      en: '',
    },
  },
  {
    id: 'interaction_TAKE_any_crit_success_high',
    verb: 'TAKE',
    targetType: null,
    outcome: 'crit_success',
    tension: 'high',
    category: 'interaction',
    text: {
      fr: 'D\'un geste vif, {actor} empoignez {def_target}{?tool_used: en arrachant avec {def_tool}|}. Exactement ce qu\'il vous fallait — une chance en plein cauchemar.',
      en: '',
    },
  },
  // --- success ---
  {
    id: 'interaction_TAKE_any_success_low',
    verb: 'TAKE',
    targetType: null,
    outcome: 'success',
    tension: 'low',
    category: 'interaction',
    text: {
      fr: '{actor} ramassez {def_target}{?tool_used: à l\'aide de {def_tool}|} et le rangez soigneusement. Un ajout à votre équipement.',
      en: '',
    },
  },
  {
    id: 'interaction_TAKE_any_success_mid',
    verb: 'TAKE',
    targetType: null,
    outcome: 'success',
    tension: 'mid',
    category: 'interaction',
    text: {
      fr: '{actor} prenez {def_target}{?tool_used: en le délogeant avec {def_tool}|}. L\'objet est froid au toucher, mais intact. Ça fera l\'affaire.',
      en: '',
    },
  },
  {
    id: 'interaction_TAKE_any_success_high',
    verb: 'TAKE',
    targetType: null,
    outcome: 'success',
    tension: 'high',
    category: 'physical',
    text: {
      fr: '{actor} arrachez {def_target} de son support{?tool_used: avec {def_tool}|} dans un mouvement précipité. Pas le temps d\'être délicat.',
      en: '',
    },
  },
  // --- partial ---
  {
    id: 'interaction_TAKE_any_partial_mid',
    verb: 'TAKE',
    targetType: null,
    outcome: 'partial',
    tension: 'mid',
    category: 'interaction',
    text: {
      fr: '{actor} tentez de prendre {def_target}{?tool_used: avec {def_tool}|}, mais l\'objet est partiellement coincé. Vous l\'extrayez, abîmé — fonctionnel, à peine.',
      en: '',
    },
  },
  {
    id: 'interaction_TAKE_any_partial_high',
    verb: 'TAKE',
    targetType: null,
    outcome: 'partial',
    tension: 'high',
    category: 'interaction',
    text: {
      fr: '{actor} saisissez {def_target}{?tool_used: via {def_tool}|} mais une partie se détache et reste en place. Vous avez un fragment — mieux que rien dans cette situation.',
      en: '',
    },
  },
  // --- failure ---
  {
    id: 'interaction_TAKE_any_failure_low',
    verb: 'TAKE',
    targetType: null,
    outcome: 'failure',
    tension: 'low',
    category: 'interaction',
    text: {
      fr: '{def_target} est fixé au sol, soudé ou boulonné{?tool_used:. Même {def_tool} ne parvient pas à le décrocher|}. Impossible à emporter en l\'état.',
      en: '',
    },
  },
  {
    id: 'interaction_TAKE_any_failure_mid',
    verb: 'TAKE',
    targetType: null,
    outcome: 'failure',
    tension: 'mid',
    category: 'interaction',
    text: {
      fr: '{actor} tirez sur {def_target}{?tool_used: avec {def_tool}|} — rien ne bouge. L\'objet est encastré ou trop lourd. Il faudra trouver un autre moyen.',
      en: '',
    },
  },
  // --- crit_failure ---
  {
    id: 'interaction_TAKE_any_crit_failure_mid',
    verb: 'TAKE',
    targetType: null,
    outcome: 'crit_failure',
    tension: 'mid',
    category: 'interaction',
    text: {
      fr: 'En tirant sur {def_target}{?tool_used: avec {def_tool}|}, un mécanisme de sécurité se déclenche. L\'objet se verrouille et une alarme locale se met à pulser.',
      en: '',
    },
  },
  {
    id: 'interaction_TAKE_any_crit_failure_high',
    verb: 'TAKE',
    targetType: null,
    outcome: 'crit_failure',
    tension: 'high',
    category: 'interaction',
    text: {
      fr: '{actor} arrachez {def_target}{?tool_used: avec {def_tool}|} et un flux toxique jaillit de la cavité. L\'objet est dans vos mains — empoisonné, corrosif, ou pire. Trop tard pour reculer.',
      en: '',
    },
  },
];

// ============================================================================
// USE — interaction
// ============================================================================

const USE_TEMPLATES: readonly ActionTemplate[] = [
  // --- auto_success ---
  {
    id: 'interaction_USE_any_auto_success_low',
    verb: 'USE',
    targetType: null,
    outcome: 'auto_success',
    tension: 'low',
    category: 'interaction',
    text: {
      fr: '{actor} utilisez {def_target}{?tool_used: avec {def_tool}|}. Le mécanisme fonctionne exactement comme prévu — un geste simple dans un monde devenu compliqué.',
      en: '',
    },
  },
  {
    id: 'interaction_USE_any_auto_success_mid',
    verb: 'USE',
    targetType: null,
    outcome: 'auto_success',
    tension: 'mid',
    category: 'interaction',
    text: {
      fr: '{def_target} s\'active sous votre commande{?tool_used:, {def_tool} servant d\'interface|}. Le résultat est immédiat et conforme à vos attentes.',
      en: '',
    },
  },
  // --- crit_success ---
  {
    id: 'interaction_USE_any_crit_success_low',
    verb: 'USE',
    targetType: null,
    outcome: 'crit_success',
    tension: 'low',
    category: 'interaction',
    text: {
      fr: '{actor} utilisez {def_target}{?tool_used: combiné avec {def_tool}|} avec une efficacité inattendue. Le résultat dépasse vos espérances — un effet bonus que vous n\'aviez pas anticipé.',
      en: '',
    },
  },
  {
    id: 'interaction_USE_usable_crit_success_mid',
    verb: 'USE',
    targetType: 'usable',
    outcome: 'crit_success',
    tension: 'mid',
    category: 'interaction',
    text: {
      fr: '{def_target} répond parfaitement à votre manipulation{?tool_used: via {def_tool}|}. Mieux que prévu — le système entre dans un mode avancé que vous n\'espériez pas atteindre.',
      en: '',
    },
  },
  {
    id: 'interaction_USE_any_crit_success_high',
    verb: 'USE',
    targetType: null,
    outcome: 'crit_success',
    tension: 'high',
    category: 'interaction',
    text: {
      fr: 'Les mains tremblantes, {actor} activez {def_target}{?tool_used: avec {def_tool}|}. Contre toute attente, l\'effet est maximal — un miracle mécanique en plein cauchemar.',
      en: '',
    },
  },
  // --- success ---
  {
    id: 'interaction_USE_any_success_low',
    verb: 'USE',
    targetType: null,
    outcome: 'success',
    tension: 'low',
    category: 'interaction',
    text: {
      fr: '{actor} utilisez {def_target}{?tool_used: avec {def_tool}|}. L\'objet remplit sa fonction. Rien de spectaculaire, mais rien d\'inquiétant non plus.',
      en: '',
    },
  },
  {
    id: 'interaction_USE_any_success_mid',
    verb: 'USE',
    targetType: null,
    outcome: 'success',
    tension: 'mid',
    category: 'interaction',
    text: {
      fr: '{def_target} s\'active après un instant d\'hésitation{?tool_used: — {def_tool} fait la connexion|}. Le résultat apparaît : fonctionnel. Vous respirez.',
      en: '',
    },
  },
  {
    id: 'interaction_USE_any_success_high',
    verb: 'USE',
    targetType: null,
    outcome: 'success',
    tension: 'high',
    category: 'interaction',
    text: {
      fr: '{actor} activez {def_target}{?tool_used: via {def_tool}|} dans la précipitation. Ça fonctionne — pas le temps de comprendre comment, mais ça fonctionne.',
      en: '',
    },
  },
  // --- partial ---
  {
    id: 'interaction_USE_any_partial_mid',
    verb: 'USE',
    targetType: null,
    outcome: 'partial',
    tension: 'mid',
    category: 'interaction',
    text: {
      fr: '{def_target} s\'active partiellement{?tool_used: malgré {def_tool}|}. Le résultat est fragmentaire — une brève lueur, un début de fonction, puis l\'arrêt. Pas tout à fait ce que vous espériez.',
      en: '',
    },
  },
  {
    id: 'interaction_USE_any_partial_high',
    verb: 'USE',
    targetType: null,
    outcome: 'partial',
    tension: 'high',
    category: 'interaction',
    text: {
      fr: '{actor} forcez {def_target}{?tool_used: avec {def_tool}|} — l\'activation est incomplète. Quelques fonctions répondent, d\'autres restent mortes. Il faudra faire avec ce demi-résultat.',
      en: '',
    },
  },
  // --- failure ---
  {
    id: 'interaction_USE_any_failure_low',
    verb: 'USE',
    targetType: null,
    outcome: 'failure',
    tension: 'low',
    category: 'interaction',
    text: {
      fr: '{actor} tentez d\'utiliser {def_target}{?tool_used: avec {def_tool}|}, mais rien ne se passe. L\'objet reste inerte, indifférent à votre manipulation.',
      en: '',
    },
  },
  {
    id: 'interaction_USE_any_failure_mid',
    verb: 'USE',
    targetType: null,
    outcome: 'failure',
    tension: 'mid',
    category: 'interaction',
    text: {
      fr: '{def_target} ne répond pas{?tool_used:, que ce soit avec ou sans {def_tool}|}. Un voyant rouge pulse faiblement — batterie morte ou incompatibilité. Dans les deux cas, c\'est un échec.',
      en: '',
    },
  },
  // --- crit_failure ---
  {
    id: 'interaction_USE_any_crit_failure_mid',
    verb: 'USE',
    targetType: null,
    outcome: 'crit_failure',
    tension: 'mid',
    category: 'interaction',
    text: {
      fr: '{def_target} réagit mal à votre tentative{?tool_used: via {def_tool}|}. Un arc électrique jaillit, suivit d\'une fumée âcre. L\'objet est grillé — et vos doigts aussi.',
      en: '',
    },
  },
  {
    id: 'interaction_USE_any_crit_failure_high',
    verb: 'USE',
    targetType: null,
    outcome: 'crit_failure',
    tension: 'high',
    category: 'interaction',
    text: {
      fr: 'L\'activation de {def_target}{?tool_used: via {def_tool}|} déclenche un retour catastrophique. Une surcharge d\'énergie pulse dans le module — les lumières s\'éteignent une seconde avant de revenir en rouge sang.',
      en: '',
    },
  },
];

// ============================================================================
// CATEGORY-LEVEL FALLBACKS (verb = null)
// ============================================================================

const CATEGORY_FALLBACK_TEMPLATES: readonly ActionTemplate[] = [
  // ========== physical ==========
  {
    id: 'physical_fallback_any_auto_success_low',
    verb: null,
    targetType: null,
    outcome: 'auto_success',
    tension: 'low',
    category: 'physical',
    text: {
      fr: '{actor} accomplissez l\'action physique sur {def_target}{?tool_used: avec {def_tool}|} sans effort. Un geste de routine.',
      en: '',
    },
  },
  {
    id: 'physical_fallback_any_auto_success_mid',
    verb: null,
    targetType: null,
    outcome: 'auto_success',
    tension: 'mid',
    category: 'physical',
    text: {
      fr: '{def_target} ne résiste pas à votre effort physique{?tool_used:, amplifié par {def_tool}|}. Rapide, net.',
      en: '',
    },
  },
  {
    id: 'physical_fallback_any_crit_success_low',
    verb: null,
    targetType: null,
    outcome: 'crit_success',
    tension: 'low',
    category: 'physical',
    text: {
      fr: 'Votre geste est d\'une précision presque surnaturelle. {def_target} cède admirablement{?tool_used: sous {def_tool}|}.',
      en: '',
    },
  },
  {
    id: 'physical_fallback_any_crit_success_mid',
    verb: null,
    targetType: null,
    outcome: 'crit_success',
    tension: 'mid',
    category: 'physical',
    text: {
      fr: 'Un effort physique parfait. {actor} dominez {def_target}{?tool_used: avec {def_tool}|} totalement. Le résultat est spectaculaire.',
      en: '',
    },
  },
  {
    id: 'physical_fallback_any_success_low',
    verb: null,
    targetType: null,
    outcome: 'success',
    tension: 'low',
    category: 'physical',
    text: {
      fr: '{actor} appliquez votre force sur {def_target}{?tool_used: via {def_tool}|}. L\'effort porte ses fruits sans complication.',
      en: '',
    },
  },
  {
    id: 'physical_fallback_any_success_mid',
    verb: null,
    targetType: null,
    outcome: 'success',
    tension: 'mid',
    category: 'physical',
    text: {
      fr: 'L\'effort physique sur {def_target}{?tool_used: avec {def_tool}|} réussit. Pas de surprise, pas de grâce — mais le résultat est là.',
      en: '',
    },
  },
  {
    id: 'physical_fallback_any_partial_mid',
    verb: null,
    targetType: null,
    outcome: 'partial',
    tension: 'mid',
    category: 'physical',
    text: {
      fr: 'Votre intervention physique sur {def_target}{?tool_used: avec {def_tool}|} ne produit qu\'un résultat partiel. Suffisant pour progresser, pas pour triompher.',
      en: '',
    },
  },
  {
    id: 'physical_fallback_any_partial_high',
    verb: null,
    targetType: null,
    outcome: 'partial',
    tension: 'high',
    category: 'physical',
    text: {
      fr: '{actor} y mettez toute votre force{?tool_used: à travers {def_tool}|}, mais {def_target} résiste partiellement. Mi-victoire, mi-frustration.',
      en: '',
    },
  },
  {
    id: 'physical_fallback_any_failure_low',
    verb: null,
    targetType: null,
    outcome: 'failure',
    tension: 'low',
    category: 'physical',
    text: {
      fr: '{def_target} ne cède pas{?tool_used: face à {def_tool}|}. Votre effort physique ne suffit pas — il faudra repenser l\'approche.',
      en: '',
    },
  },
  {
    id: 'physical_fallback_any_failure_mid',
    verb: null,
    targetType: null,
    outcome: 'failure',
    tension: 'mid',
    category: 'physical',
    text: {
      fr: 'L\'action échoue. {def_target} reste immobile{?tool_used: malgré {def_tool}|}, et l\'effort vous laisse essoufflé dans l\'air recyclé.',
      en: '',
    },
  },
  {
    id: 'physical_fallback_any_crit_failure_mid',
    verb: null,
    targetType: null,
    outcome: 'crit_failure',
    tension: 'mid',
    category: 'physical',
    text: {
      fr: 'L\'effort physique se retourne contre vous. {def_target}{?tool_used: et {def_tool}|} deviennent source de douleur. Quelque chose s\'est froissé dans votre corps.',
      en: '',
    },
  },
  {
    id: 'physical_fallback_any_crit_failure_high',
    verb: null,
    targetType: null,
    outcome: 'crit_failure',
    tension: 'high',
    category: 'physical',
    text: {
      fr: 'Un craquement sinistre — pas de {def_target}, mais de votre propre corps{?tool_used:. {def_tool} vous échappe|}. La douleur irradie. Mauvais choix, au pire moment.',
      en: '',
    },
  },

  // ========== technical ==========
  {
    id: 'technical_fallback_any_auto_success_low',
    verb: null,
    targetType: null,
    outcome: 'auto_success',
    tension: 'low',
    category: 'technical',
    text: {
      fr: '{actor} effectuez l\'opération technique sur {def_target}{?tool_used: à l\'aide de {def_tool}|}. Procédure standard.',
      en: '',
    },
  },
  {
    id: 'technical_fallback_any_auto_success_mid',
    verb: null,
    targetType: null,
    outcome: 'auto_success',
    tension: 'mid',
    category: 'technical',
    text: {
      fr: 'L\'intervention technique sur {def_target}{?tool_used: via {def_tool}|} se déroule sans accroc. Un rare moment de normalité.',
      en: '',
    },
  },
  {
    id: 'technical_fallback_any_crit_success_low',
    verb: null,
    targetType: null,
    outcome: 'crit_success',
    tension: 'low',
    category: 'technical',
    text: {
      fr: 'Votre expertise technique brille. {def_target} répond parfaitement{?tool_used: à {def_tool}|} — un résultat digne d\'un ingénieur chevronné.',
      en: '',
    },
  },
  {
    id: 'technical_fallback_any_crit_success_mid',
    verb: null,
    targetType: null,
    outcome: 'crit_success',
    tension: 'mid',
    category: 'technical',
    text: {
      fr: '{actor} maîtrisez {def_target}{?tool_used: grâce à {def_tool}|} avec une virtuosité technique impressionnante. Le système obéit au doigt et à l\'œil.',
      en: '',
    },
  },
  {
    id: 'technical_fallback_any_success_low',
    verb: null,
    targetType: null,
    outcome: 'success',
    tension: 'low',
    category: 'technical',
    text: {
      fr: 'L\'intervention technique sur {def_target}{?tool_used: avec {def_tool}|} aboutit. Le système répond correctement.',
      en: '',
    },
  },
  {
    id: 'technical_fallback_any_success_mid',
    verb: null,
    targetType: null,
    outcome: 'success',
    tension: 'mid',
    category: 'technical',
    text: {
      fr: '{actor} finalisez l\'opération sur {def_target}{?tool_used: via {def_tool}|}. Des diodes passent au vert — confirmation technique.',
      en: '',
    },
  },
  {
    id: 'technical_fallback_any_partial_mid',
    verb: null,
    targetType: null,
    outcome: 'partial',
    tension: 'mid',
    category: 'technical',
    text: {
      fr: 'L\'opération sur {def_target}{?tool_used: avec {def_tool}|} ne réussit qu\'à moitié. Des fonctions partielles — le système est instable.',
      en: '',
    },
  },
  {
    id: 'technical_fallback_any_partial_high',
    verb: null,
    targetType: null,
    outcome: 'partial',
    tension: 'high',
    category: 'technical',
    text: {
      fr: '{def_target} répond partiellement{?tool_used: à {def_tool}|}. Des circuits grésillent — le résultat est bancal, temporaire au mieux.',
      en: '',
    },
  },
  {
    id: 'technical_fallback_any_failure_low',
    verb: null,
    targetType: null,
    outcome: 'failure',
    tension: 'low',
    category: 'technical',
    text: {
      fr: '{def_target} reste inerte{?tool_used: malgré {def_tool}|}. L\'opération technique échoue — le problème dépasse apparemment vos compétences.',
      en: '',
    },
  },
  {
    id: 'technical_fallback_any_failure_mid',
    verb: null,
    targetType: null,
    outcome: 'failure',
    tension: 'mid',
    category: 'technical',
    text: {
      fr: 'Erreur technique. {def_target} refuse toute manipulation{?tool_used: par {def_tool}|}. Un message d\'erreur incompréhensible clignote sur l\'écran.',
      en: '',
    },
  },
  {
    id: 'technical_fallback_any_crit_failure_mid',
    verb: null,
    targetType: null,
    outcome: 'crit_failure',
    tension: 'mid',
    category: 'technical',
    text: {
      fr: 'L\'intervention technique tourne au désastre. {def_target} émet une gerbe d\'étincelles{?tool_used: qui remonte à travers {def_tool}|}. Dégâts additionnels.',
      en: '',
    },
  },
  {
    id: 'technical_fallback_any_crit_failure_high',
    verb: null,
    targetType: null,
    outcome: 'crit_failure',
    tension: 'high',
    category: 'technical',
    text: {
      fr: 'Catastrophe technique. {def_target} explose en une pluie de composants{?tool_used: — {def_tool} pris dans la détonation|}. L\'air se charge d\'ozone et de fumée toxique.',
      en: '',
    },
  },

  // ========== social ==========
  {
    id: 'social_fallback_any_auto_success_low',
    verb: null,
    targetType: null,
    outcome: 'auto_success',
    tension: 'low',
    category: 'social',
    text: {
      fr: '{actor} communiquez avec {npc_name}. Le message passe sans effort — la compréhension est immédiate.',
      en: '',
    },
  },
  {
    id: 'social_fallback_any_auto_success_mid',
    verb: null,
    targetType: null,
    outcome: 'auto_success',
    tension: 'mid',
    category: 'social',
    text: {
      fr: 'Vos paroles atteignent {npc_name} sans résistance. L\'échange est fluide, naturel malgré les circonstances.',
      en: '',
    },
  },
  {
    id: 'social_fallback_any_crit_success_low',
    verb: null,
    targetType: null,
    outcome: 'crit_success',
    tension: 'low',
    category: 'social',
    text: {
      fr: 'Vos mots touchent {npc_name} profondément. Une connexion rare dans les profondeurs glacées de l\'espace.',
      en: '',
    },
  },
  {
    id: 'social_fallback_any_crit_success_mid',
    verb: null,
    targetType: null,
    outcome: 'crit_success',
    tension: 'mid',
    category: 'social',
    text: {
      fr: '{actor} trouvez exactement les mots qu\'il fallait. {npc_name} est conquis — entièrement, sincèrement.',
      en: '',
    },
  },
  {
    id: 'social_fallback_any_success_low',
    verb: null,
    targetType: null,
    outcome: 'success',
    tension: 'low',
    category: 'social',
    text: {
      fr: 'L\'échange avec {npc_name} se déroule bien. Pas d\'éclat, mais un accord trouvé.',
      en: '',
    },
  },
  {
    id: 'social_fallback_any_success_mid',
    verb: null,
    targetType: null,
    outcome: 'success',
    tension: 'mid',
    category: 'social',
    text: {
      fr: '{actor} parvenez à communiquer votre intention à {npc_name}. Le dialogue porte ses fruits dans le bourdonnement du vaisseau.',
      en: '',
    },
  },
  {
    id: 'social_fallback_any_partial_mid',
    verb: null,
    targetType: null,
    outcome: 'partial',
    tension: 'mid',
    category: 'social',
    text: {
      fr: '{npc_name} hésite. Vos mots font mouche, mais pas assez. Un demi-accord, un demi-refus.',
      en: '',
    },
  },
  {
    id: 'social_fallback_any_partial_high',
    verb: null,
    targetType: null,
    outcome: 'partial',
    tension: 'high',
    category: 'social',
    text: {
      fr: 'Dans le chaos, {actor} tentez de communiquer avec {npc_name}. Le message passe — en partie seulement. L\'alarme couvre le reste.',
      en: '',
    },
  },
  {
    id: 'social_fallback_any_failure_low',
    verb: null,
    targetType: null,
    outcome: 'failure',
    tension: 'low',
    category: 'social',
    text: {
      fr: '{npc_name} ne répond pas à votre tentative. Un mur de silence, poli mais impénétrable.',
      en: '',
    },
  },
  {
    id: 'social_fallback_any_failure_mid',
    verb: null,
    targetType: null,
    outcome: 'failure',
    tension: 'mid',
    category: 'social',
    text: {
      fr: 'Vos paroles se perdent. {npc_name} détourne le regard — la communication a échoué.',
      en: '',
    },
  },
  {
    id: 'social_fallback_any_crit_failure_mid',
    verb: null,
    targetType: null,
    outcome: 'crit_failure',
    tension: 'mid',
    category: 'social',
    text: {
      fr: 'Vos mots provoquent l\'effet inverse. {npc_name} se ferme, hostile. Le lien est rompu — peut-être définitivement.',
      en: '',
    },
  },
  {
    id: 'social_fallback_any_crit_failure_high',
    verb: null,
    targetType: null,
    outcome: 'crit_failure',
    tension: 'high',
    category: 'social',
    text: {
      fr: '{npc_name} réagit violemment. Les mots que vous avez choisis ont touché un nerf — la situation sociale est désormais critique.',
      en: '',
    },
  },

  // ========== perception ==========
  {
    id: 'perception_fallback_any_auto_success_low',
    verb: null,
    targetType: null,
    outcome: 'auto_success',
    tension: 'low',
    category: 'perception',
    text: {
      fr: '{actor} observez {def_target}{?tool_used: via {def_tool}|}. Les détails sont évidents, limpides dans le silence du module.',
      en: '',
    },
  },
  {
    id: 'perception_fallback_any_auto_success_mid',
    verb: null,
    targetType: null,
    outcome: 'auto_success',
    tension: 'mid',
    category: 'perception',
    text: {
      fr: 'Votre perception capte immédiatement l\'essentiel à propos de {def_target}{?tool_used: grâce à {def_tool}|}.',
      en: '',
    },
  },
  {
    id: 'perception_fallback_any_crit_success_low',
    verb: null,
    targetType: null,
    outcome: 'crit_success',
    tension: 'low',
    category: 'perception',
    text: {
      fr: 'Vos sens sont affûtés comme jamais. Chaque détail de {def_target} se révèle{?tool_used: à travers {def_tool}|}.',
      en: '',
    },
  },
  {
    id: 'perception_fallback_any_crit_success_mid',
    verb: null,
    targetType: null,
    outcome: 'crit_success',
    tension: 'mid',
    category: 'perception',
    text: {
      fr: 'Un éclair de lucidité. {actor} percevez ce qui était invisible à propos de {def_target}{?tool_used: via {def_tool}|}. L\'information est cruciale.',
      en: '',
    },
  },
  {
    id: 'perception_fallback_any_success_low',
    verb: null,
    targetType: null,
    outcome: 'success',
    tension: 'low',
    category: 'perception',
    text: {
      fr: '{actor} percevez des détails utiles à propos de {def_target}{?tool_used: grâce à {def_tool}|}. L\'information s\'ajoute à votre compréhension.',
      en: '',
    },
  },
  {
    id: 'perception_fallback_any_success_mid',
    verb: null,
    targetType: null,
    outcome: 'success',
    tension: 'mid',
    category: 'perception',
    text: {
      fr: 'Vos sens captent l\'essentiel. {def_target} révèle ses secrets{?tool_used: sous l\'analyse de {def_tool}|}.',
      en: '',
    },
  },
  {
    id: 'perception_fallback_any_partial_mid',
    verb: null,
    targetType: null,
    outcome: 'partial',
    tension: 'mid',
    category: 'perception',
    text: {
      fr: 'L\'observation de {def_target}{?tool_used: via {def_tool}|} livre des résultats fragmentaires. Des indices, mais pas l\'image complète.',
      en: '',
    },
  },
  {
    id: 'perception_fallback_any_partial_high',
    verb: null,
    targetType: null,
    outcome: 'partial',
    tension: 'high',
    category: 'perception',
    text: {
      fr: '{actor} captez des bribes d\'information sur {def_target}{?tool_used: malgré {def_tool}|}. Assez pour avancer, pas assez pour être sûr.',
      en: '',
    },
  },
  {
    id: 'perception_fallback_any_failure_low',
    verb: null,
    targetType: null,
    outcome: 'failure',
    tension: 'low',
    category: 'perception',
    text: {
      fr: '{def_target} ne révèle rien à votre observation{?tool_used: ni à {def_tool}|}. Vos sens vous font défaut cette fois.',
      en: '',
    },
  },
  {
    id: 'perception_fallback_any_failure_mid',
    verb: null,
    targetType: null,
    outcome: 'failure',
    tension: 'mid',
    category: 'perception',
    text: {
      fr: 'L\'observation échoue. {def_target} reste illisible{?tool_used: même avec {def_tool}|}, ses secrets intacts.',
      en: '',
    },
  },
  {
    id: 'perception_fallback_any_crit_failure_mid',
    verb: null,
    targetType: null,
    outcome: 'crit_failure',
    tension: 'mid',
    category: 'perception',
    text: {
      fr: '{actor} interprétez mal ce que vos sens perçoivent de {def_target}{?tool_used: via {def_tool}|}. L\'erreur d\'analyse pourrait coûter cher.',
      en: '',
    },
  },
  {
    id: 'perception_fallback_any_crit_failure_high',
    verb: null,
    targetType: null,
    outcome: 'crit_failure',
    tension: 'high',
    category: 'perception',
    text: {
      fr: 'En vous concentrant sur {def_target}{?tool_used: via {def_tool}|}, vous baissez votre garde. L\'information est fausse — et quelque chose a profité de votre distraction.',
      en: '',
    },
  },

  // ========== interaction ==========
  {
    id: 'interaction_fallback_any_auto_success_low',
    verb: null,
    targetType: null,
    outcome: 'auto_success',
    tension: 'low',
    category: 'interaction',
    text: {
      fr: '{actor} interagissez avec {def_target}{?tool_used: via {def_tool}|}. L\'action se déroule naturellement.',
      en: '',
    },
  },
  {
    id: 'interaction_fallback_any_auto_success_mid',
    verb: null,
    targetType: null,
    outcome: 'auto_success',
    tension: 'mid',
    category: 'interaction',
    text: {
      fr: 'L\'interaction avec {def_target} est immédiate{?tool_used: — {def_tool} facilite la manipulation|}. Simple et efficace.',
      en: '',
    },
  },
  {
    id: 'interaction_fallback_any_crit_success_low',
    verb: null,
    targetType: null,
    outcome: 'crit_success',
    tension: 'low',
    category: 'interaction',
    text: {
      fr: '{actor} manipulez {def_target}{?tool_used: avec {def_tool}|} avec une habileté remarquable. Le résultat va au-delà de vos attentes.',
      en: '',
    },
  },
  {
    id: 'interaction_fallback_any_crit_success_mid',
    verb: null,
    targetType: null,
    outcome: 'crit_success',
    tension: 'mid',
    category: 'interaction',
    text: {
      fr: 'L\'interaction avec {def_target}{?tool_used: via {def_tool}|} produit un résultat exceptionnel. Les choses tournent en votre faveur.',
      en: '',
    },
  },
  {
    id: 'interaction_fallback_any_success_low',
    verb: null,
    targetType: null,
    outcome: 'success',
    tension: 'low',
    category: 'interaction',
    text: {
      fr: '{actor} interagissez avec {def_target}{?tool_used: à l\'aide de {def_tool}|}. Le résultat est satisfaisant.',
      en: '',
    },
  },
  {
    id: 'interaction_fallback_any_success_mid',
    verb: null,
    targetType: null,
    outcome: 'success',
    tension: 'mid',
    category: 'interaction',
    text: {
      fr: 'L\'interaction avec {def_target} fonctionne{?tool_used: grâce à {def_tool}|}. Pas de surprise, juste un résultat conforme.',
      en: '',
    },
  },
  {
    id: 'interaction_fallback_any_partial_mid',
    verb: null,
    targetType: null,
    outcome: 'partial',
    tension: 'mid',
    category: 'interaction',
    text: {
      fr: '{def_target} ne répond que partiellement{?tool_used: malgré {def_tool}|}. Un résultat incomplet, frustrant.',
      en: '',
    },
  },
  {
    id: 'interaction_fallback_any_partial_high',
    verb: null,
    targetType: null,
    outcome: 'partial',
    tension: 'high',
    category: 'interaction',
    text: {
      fr: 'L\'interaction rapide avec {def_target}{?tool_used: via {def_tool}|} ne produit qu\'un demi-résultat. Le temps manque pour faire mieux.',
      en: '',
    },
  },
  {
    id: 'interaction_fallback_any_failure_low',
    verb: null,
    targetType: null,
    outcome: 'failure',
    tension: 'low',
    category: 'interaction',
    text: {
      fr: '{def_target} ne répond pas à votre manipulation{?tool_used: ni à {def_tool}|}. L\'interaction échoue.',
      en: '',
    },
  },
  {
    id: 'interaction_fallback_any_failure_mid',
    verb: null,
    targetType: null,
    outcome: 'failure',
    tension: 'mid',
    category: 'interaction',
    text: {
      fr: 'Rien ne se passe. {def_target} reste inerte{?tool_used: face à {def_tool}|}, indifférent à vos efforts.',
      en: '',
    },
  },
  {
    id: 'interaction_fallback_any_crit_failure_mid',
    verb: null,
    targetType: null,
    outcome: 'crit_failure',
    tension: 'mid',
    category: 'interaction',
    text: {
      fr: 'L\'interaction avec {def_target}{?tool_used: via {def_tool}|} tourne mal. Un mécanisme de sécurité se déclenche.',
      en: '',
    },
  },
  {
    id: 'interaction_fallback_any_crit_failure_high',
    verb: null,
    targetType: null,
    outcome: 'crit_failure',
    tension: 'high',
    category: 'interaction',
    text: {
      fr: '{def_target} réagit violemment à votre tentative{?tool_used: via {def_tool}|}. Un retour de force — les conséquences sont immédiates et douloureuses.',
      en: '',
    },
  },

  // ========== creative ==========
  {
    id: 'creative_fallback_any_auto_success_low',
    verb: null,
    targetType: null,
    outcome: 'auto_success',
    tension: 'low',
    category: 'creative',
    text: {
      fr: 'Contre toute logique, votre approche créative fonctionne{?tool_used: — {def_tool} n\'était pas conçu pour ça, mais peu importe|}. {def_target} cède.',
      en: '',
    },
  },
  {
    id: 'creative_fallback_any_auto_success_mid',
    verb: null,
    targetType: null,
    outcome: 'auto_success',
    tension: 'mid',
    category: 'creative',
    text: {
      fr: 'L\'idée est folle. L\'exécution aussi. Et pourtant — {def_target} réagit exactement comme vous l\'espériez{?tool_used: grâce à l\'utilisation peu orthodoxe de {def_tool}|}.',
      en: '',
    },
  },
  {
    id: 'creative_fallback_any_crit_success_low',
    verb: null,
    targetType: null,
    outcome: 'crit_success',
    tension: 'low',
    category: 'creative',
    text: {
      fr: 'La créativité comme arme suprême. Votre approche non conventionnelle sur {def_target}{?tool_used: avec {def_tool}|} produit un résultat que même un ingénieur n\'aurait pas imaginé.',
      en: '',
    },
  },
  {
    id: 'creative_fallback_any_crit_success_mid',
    verb: null,
    targetType: null,
    outcome: 'crit_success',
    tension: 'mid',
    category: 'creative',
    text: {
      fr: 'Génie ou folie — la frontière est mince. {actor} improvisez sur {def_target}{?tool_used: avec {def_tool}|} et le résultat est brillant. Personne ne comprend comment, surtout pas vous.',
      en: '',
    },
  },
  {
    id: 'creative_fallback_any_success_low',
    verb: null,
    targetType: null,
    outcome: 'success',
    tension: 'low',
    category: 'creative',
    text: {
      fr: 'Votre idée créative fonctionne sur {def_target}{?tool_used: via {def_tool}|}. Pas élégant, pas conventionnel — mais fonctionnel.',
      en: '',
    },
  },
  {
    id: 'creative_fallback_any_success_mid',
    verb: null,
    targetType: null,
    outcome: 'success',
    tension: 'mid',
    category: 'creative',
    text: {
      fr: '{actor} appliquez votre solution improvisée sur {def_target}{?tool_used: avec {def_tool}|}. Le système n\'était pas conçu pour ça — mais ça marche.',
      en: '',
    },
  },
  {
    id: 'creative_fallback_any_partial_mid',
    verb: null,
    targetType: null,
    outcome: 'partial',
    tension: 'mid',
    category: 'creative',
    text: {
      fr: 'L\'approche créative ne donne qu\'un résultat partiel sur {def_target}{?tool_used: avec {def_tool}|}. L\'idée était bonne — l\'exécution moins.',
      en: '',
    },
  },
  {
    id: 'creative_fallback_any_partial_high',
    verb: null,
    targetType: null,
    outcome: 'partial',
    tension: 'high',
    category: 'creative',
    text: {
      fr: '{actor} improvisez frénétiquement sur {def_target}{?tool_used: avec {def_tool}|}. Résultat mitigé — la créativité a ses limites quand l\'adrénaline coule à flots.',
      en: '',
    },
  },
  {
    id: 'creative_fallback_any_failure_low',
    verb: null,
    targetType: null,
    outcome: 'failure',
    tension: 'low',
    category: 'creative',
    text: {
      fr: 'L\'approche créative échoue. {def_target} ne réagit pas{?tool_used: malgré l\'utilisation inventive de {def_tool}|}. Retour à la case départ.',
      en: '',
    },
  },
  {
    id: 'creative_fallback_any_failure_mid',
    verb: null,
    targetType: null,
    outcome: 'failure',
    tension: 'mid',
    category: 'creative',
    text: {
      fr: 'La créativité a ses limites. {def_target} reste inchangé{?tool_used: malgré {def_tool}|}. L\'idée semblait brillante — en théorie.',
      en: '',
    },
  },
  {
    id: 'creative_fallback_any_crit_failure_mid',
    verb: null,
    targetType: null,
    outcome: 'crit_failure',
    tension: 'mid',
    category: 'creative',
    text: {
      fr: 'Votre approche non conventionnelle se retourne contre vous. {def_target}{?tool_used: et {def_tool}|} conspirent pour aggraver la situation de manière spectaculaire.',
      en: '',
    },
  },
  {
    id: 'creative_fallback_any_crit_failure_high',
    verb: null,
    targetType: null,
    outcome: 'crit_failure',
    tension: 'high',
    category: 'creative',
    text: {
      fr: 'L\'improvisation tourne au cauchemar. {def_target} réagit de façon inattendue{?tool_used: — {def_tool} amplifie le désastre|}. Les lois de la physique ont le dernier mot.',
      en: '',
    },
  },
];

// ============================================================================
// ABSURD ACTION TEMPLATES (creative, deadpan)
// ============================================================================

const ABSURD_TEMPLATES: readonly ActionTemplate[] = [
  {
    id: 'creative_absurd_any_success_low_1',
    verb: null,
    targetType: null,
    outcome: 'success',
    tension: 'low',
    category: 'creative',
    text: {
      fr: '{actor} exécutez votre plan avec un sérieux imperturbable. {def_target} cède, comme si l\'univers lui-même avait décidé que votre approche absurde méritait d\'être récompensée. Personne ne comprend. Personne ne comprendra jamais.',
      en: '',
    },
  },
  {
    id: 'creative_absurd_any_success_mid_1',
    verb: null,
    targetType: null,
    outcome: 'success',
    tension: 'mid',
    category: 'creative',
    text: {
      fr: 'Les lois de la physique marquent une pause, intriguées. {actor} menez votre action absurde à bien sur {def_target}{?tool_used: avec {def_tool}|}. Le vaisseau émet un grincement qui ressemble presque à un soupir résigné.',
      en: '',
    },
  },
  {
    id: 'creative_absurd_any_failure_low_1',
    verb: null,
    targetType: null,
    outcome: 'failure',
    tension: 'low',
    category: 'creative',
    text: {
      fr: '{actor} essayez avec une conviction admirable. {def_target} reste stoïquement indifférent à votre tentative non conventionnelle{?tool_used:, tout comme {def_tool}|}. Le silence qui suit a la texture d\'un jugement cosmique.',
      en: '',
    },
  },
  {
    id: 'creative_absurd_any_failure_mid_1',
    verb: null,
    targetType: null,
    outcome: 'failure',
    tension: 'mid',
    category: 'creative',
    text: {
      fr: 'Quelque part dans l\'immensité de l\'espace, une intelligence ancienne observe votre tentative sur {def_target}{?tool_used: avec {def_tool}|} et éprouve quelque chose qui ressemble à de la perplexité. L\'action échoue, naturellement.',
      en: '',
    },
  },
  {
    id: 'creative_absurd_any_crit_success_mid_1',
    verb: null,
    targetType: null,
    outcome: 'crit_success',
    tension: 'mid',
    category: 'creative',
    text: {
      fr: 'L\'impensable se produit. Votre action absurde sur {def_target}{?tool_used: avec {def_tool}|} fonctionne au-delà de toute attente. Le tissu de la réalité vacille un instant, puis accepte le fait accompli avec une grâce résignée.',
      en: '',
    },
  },
  {
    id: 'creative_absurd_any_crit_failure_mid_1',
    verb: null,
    targetType: null,
    outcome: 'crit_failure',
    tension: 'mid',
    category: 'creative',
    text: {
      fr: '{def_target}{?tool_used: et {def_tool}|} refusent votre proposition avec une véhémence presque philosophique. La tentative échoue si spectaculairement que même les systèmes d\'urgence semblent embarrassés.',
      en: '',
    },
  },
  {
    id: 'creative_absurd_any_partial_mid_1',
    verb: null,
    targetType: null,
    outcome: 'partial',
    tension: 'mid',
    category: 'creative',
    text: {
      fr: 'L\'univers tergiverse. Votre action sur {def_target}{?tool_used: via {def_tool}|} ne réussit qu\'à moitié — comme si les lois cosmiques ne savaient pas trop comment traiter votre requête.',
      en: '',
    },
  },
  {
    id: 'creative_absurd_any_success_high_1',
    verb: null,
    targetType: null,
    outcome: 'success',
    tension: 'high',
    category: 'creative',
    text: {
      fr: 'Dans un moment de pure démence, {actor} agissez sur {def_target}{?tool_used: avec {def_tool}|}. Et ça fonctionne. L\'adrénaline rend toutes les idées bonnes — ou alors le vaisseau a simplement abandonné toute cohérence.',
      en: '',
    },
  },
  {
    id: 'creative_absurd_any_failure_high_1',
    verb: null,
    targetType: null,
    outcome: 'failure',
    tension: 'high',
    category: 'creative',
    text: {
      fr: '{def_target}{?tool_used: et {def_tool}|} ne daignent pas répondre à votre approche non orthodoxe. Le vaisseau gronde autour de vous. Ce n\'était peut-être pas le moment idéal pour l\'innovation conceptuelle.',
      en: '',
    },
  },
  {
    id: 'creative_absurd_any_auto_success_low_1',
    verb: null,
    targetType: null,
    outcome: 'auto_success',
    tension: 'low',
    category: 'creative',
    text: {
      fr: '{actor} procédez avec l\'assurance tranquille de celui qui a fait la paix avec l\'absurde. {def_target} coopère{?tool_used: — {def_tool} accomplissant un rôle pour lequel il n\'a jamais été conçu|}. L\'univers ne commente pas.',
      en: '',
    },
  },
  {
    id: 'creative_absurd_any_crit_success_high_1',
    verb: null,
    targetType: null,
    outcome: 'crit_success',
    tension: 'high',
    category: 'creative',
    text: {
      fr: 'La folie et le génie partagent une frontière poreuse. {actor} prouvez cette théorie sur {def_target}{?tool_used: avec {def_tool}|} — le résultat est si spectaculaire qu\'il aurait sa place dans un manuel d\'ingénierie. Ou de psychiatrie.',
      en: '',
    },
  },
  {
    id: 'creative_absurd_any_crit_failure_high_1',
    verb: null,
    targetType: null,
    outcome: 'crit_failure',
    tension: 'high',
    category: 'creative',
    text: {
      fr: 'Votre idée créative se retourne contre vous avec un enthousiasme presque vengeur. {def_target}{?tool_used: et {def_tool}|} conspirent dans un échec si complet qu\'il en devient presque artistique. L\'alarme qui se déclenche semble applaudir.',
      en: '',
    },
  },
  {
    id: 'creative_absurd_any_partial_high_1',
    verb: null,
    targetType: null,
    outcome: 'partial',
    tension: 'high',
    category: 'creative',
    text: {
      fr: '{def_target} hésite, comme si même un objet inanimé pouvait être déconcerté{?tool_used: par l\'utilisation créative de {def_tool}|}. Le résultat est... partiel. La réalité négocie avec votre audace.',
      en: '',
    },
  },
  {
    id: 'creative_absurd_any_auto_success_mid_1',
    verb: null,
    targetType: null,
    outcome: 'auto_success',
    tension: 'mid',
    category: 'creative',
    text: {
      fr: 'Avec la gravité d\'un chirurgien, {actor} exécutez votre plan absurde sur {def_target}{?tool_used: à l\'aide de {def_tool}|}. Le succès est automatique, comme si l\'univers avait décidé que cette situation ne méritait même pas un jet de dés.',
      en: '',
    },
  },
  {
    id: 'creative_absurd_any_success_low_2',
    verb: null,
    targetType: null,
    outcome: 'success',
    tension: 'low',
    category: 'creative',
    text: {
      fr: '{actor} considérez {def_target}{?tool_used: et {def_tool}|} avec le regard de qui a cessé de questionner la logique des événements. L\'action réussit. Le vaisseau tourne toujours. Tout est relatif.',
      en: '',
    },
  },
];

// ============================================================================
// GENERIC FALLBACKS (one per outcome)
// ============================================================================

export const GENERIC_FALLBACKS: Record<Outcome, ActionTemplate> = {
  auto_success: {
    id: 'generic_fallback_any_auto_success_mid',
    verb: null,
    targetType: null,
    outcome: 'auto_success',
    tension: 'mid',
    category: 'creative',
    text: {
      fr: '{actor} effectuez l\'action sur {def_target}{?tool_used: avec {def_tool}|}. Aucune difficulté — le résultat est acquis.',
      en: '',
    },
  },
  crit_success: {
    id: 'generic_fallback_any_crit_success_mid',
    verb: null,
    targetType: null,
    outcome: 'crit_success',
    tension: 'mid',
    category: 'creative',
    text: {
      fr: 'Un résultat exceptionnel. {actor} agissez sur {def_target}{?tool_used: avec {def_tool}|} et le succès dépasse toute attente. Un moment de grâce au cœur de l\'horreur.',
      en: '',
    },
  },
  success: {
    id: 'generic_fallback_any_success_mid',
    verb: null,
    targetType: null,
    outcome: 'success',
    tension: 'mid',
    category: 'creative',
    text: {
      fr: '{actor} agissez sur {def_target}{?tool_used: avec {def_tool}|}. L\'action réussit — un résultat solide dans les circonstances.',
      en: '',
    },
  },
  partial: {
    id: 'generic_fallback_any_partial_mid',
    verb: null,
    targetType: null,
    outcome: 'partial',
    tension: 'mid',
    category: 'creative',
    text: {
      fr: 'Le résultat n\'est que partiel. {actor} agissez sur {def_target}{?tool_used: avec {def_tool}|}, mais l\'effet reste limité. Mieux que rien — de justesse.',
      en: '',
    },
  },
  failure: {
    id: 'generic_fallback_any_failure_mid',
    verb: null,
    targetType: null,
    outcome: 'failure',
    tension: 'mid',
    category: 'creative',
    text: {
      fr: 'L\'action échoue. {def_target} ne cède pas{?tool_used: malgré {def_tool}|}. Le vaisseau gronde autour de vous, indifférent à vos efforts.',
      en: '',
    },
  },
  crit_failure: {
    id: 'generic_fallback_any_crit_failure_mid',
    verb: null,
    targetType: null,
    outcome: 'crit_failure',
    tension: 'mid',
    category: 'creative',
    text: {
      fr: 'Un échec catastrophique. L\'action sur {def_target}{?tool_used: avec {def_tool}|} se retourne contre vous. La douleur est immédiate, les conséquences incertaines.',
      en: '',
    },
  },
};

// ============================================================================
// COMBINED EXPORT
// ============================================================================

/** All action templates (verb-specific + category fallbacks + absurd) */
export const ACTION_TEMPLATES: readonly ActionTemplate[] = [
  ...STRIKE_TEMPLATES,
  ...BREAK_TEMPLATES,
  ...CUT_TEMPLATES,
  ...HACK_TEMPLATES,
  ...REPAIR_TEMPLATES,
  ...EXAMINE_TEMPLATES,
  ...PERSUADE_TEMPLATES,
  ...INTIMIDATE_TEMPLATES,
  ...THROW_TEMPLATES,
  ...SHOOT_TEMPLATES,
  ...CLIMB_TEMPLATES,
  ...HIDE_TEMPLATES,
  ...OPEN_TEMPLATES,
  ...TAKE_TEMPLATES,
  ...USE_TEMPLATES,
  ...CATEGORY_FALLBACK_TEMPLATES,
  ...ABSURD_TEMPLATES,
] as const;

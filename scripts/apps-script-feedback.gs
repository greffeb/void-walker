// Paste this into a Google Apps Script project bound to a Google Sheet
// Tools → Script Properties → add GITHUB_PAT = your_pat_with_issues_write
//
// GSheet columns (row 1 = headers):
// A: Timestamp | B: Seed | C: Skeleton | D: Setting | E: Class | F: Difficulty
// G: Turn | H: Location | I: Player Input | J: Parsed Verb | K: Parsed Target
// L: Dice | M: DC | N: Outcome | O: Narration | P: Consequences
// Q: HP | R: O2 | S: Conditions | T: Inventory | U: Scene Items
// V: Scene NPCs | W: Scene Features | X: Scene Exits | Y: Beat
// Z: Comment | AA: App Version | AB: Input History

const GITHUB_OWNER = 'greffeb';
const GITHUB_REPO = 'void-walker';

function doGet(e) {
  try {
    const data = JSON.parse(e.parameter.payload || '{}');

    // 1. Log to Sheet — one row with full reproducibility data
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    sheet.appendRow([
      new Date(data.timestamp),                              // A: Timestamp
      data.seed,                                             // B: Seed
      data.skeletonId || '',                                 // C: Skeleton
      data.settingId || '',                                  // D: Setting
      data.playerClass || '',                                // E: Class
      data.difficulty || '',                                 // F: Difficulty
      data.turn,                                             // G: Turn
      data.locationName || '',                               // H: Location
      data.playerInput || '',                                // I: Player Input
      data.parsedVerb || '',                                 // J: Parsed Verb
      (data.parsedTargetName || data.parsedTarget || ''),    // K: Parsed Target
      data.diceNatural + '+' + data.diceModifier + '=' + data.diceTotal, // L: Dice
      data.dc,                                               // M: DC
      data.outcome || '',                                    // N: Outcome
      (data.narration || '').substring(0, 500),              // O: Narration (truncated)
      (data.consequences || []).join('; '),                  // P: Consequences
      data.characterHp + '/' + data.characterMaxHp,          // Q: HP
      data.characterO2,                                      // R: O2
      (data.conditions || []).join(', '),                    // S: Conditions
      (data.inventory || []).join(', '),                     // T: Inventory
      (data.sceneItems || []).join(', '),                    // U: Scene Items
      (data.sceneNpcs || []).join(', '),                     // V: Scene NPCs
      (data.sceneFeatures || []).join(', '),                 // W: Scene Features
      (data.sceneExits || []).join(', '),                    // X: Scene Exits
      data.currentBeat || '',                                // Y: Beat
      data.comment || '',                                    // Z: Comment
      data.appVersion || '',                                 // AA: App Version
      JSON.stringify(data.inputHistory || []),               // AB: Input History (JSON)
    ]);

    // 2. Create GitHub Issue only for KO (all reports are KO now)
    const token = PropertiesService.getScriptProperties().getProperty('GITHUB_PAT');
    if (token) {
      const title = '[Playtest] ' + (data.parsedVerb || '?') + ' → ' + (data.parsedTargetName || data.parsedTarget || '?') + ' @ ' + (data.locationName || '?') + ' (T' + data.turn + ')';

      // Build input history as numbered list for replay
      var inputHistoryMd = '';
      if (data.inputHistory && data.inputHistory.length > 0) {
        inputHistoryMd = data.inputHistory.map(function(inp, i) {
          return (i + 1) + '. `' + inp + '`';
        }).join('\n');
      }

      var body = [
        '## Bug Report — Playtest Alpha',
        '',
        '### Reproduction',
        '',
        '```typescript',
        '// Paste in a test file to reproduce:',
        'import { createSeededRng } from "@engine/rng";',
        'import { getSkeletonById } from "@content/scenarios";',
        'import { getSettingById } from "@content/settings";',
        'import { ALL_MODULES } from "@content/scenarios/modules";',
        'import { assembleScenario } from "@engine/pacing";',
        'import { initGame } from "@engine/game";',
        'import { getSceneContext } from "@engine/scene";',
        'import { processTurn } from "@engine/processTurn";',
        'import { buildParserLocaleData } from "@content/parserData";',
        '',
        'const rng = createSeededRng(' + data.seed + ');',
        'const skeleton = getSkeletonById("' + (data.skeletonId || '') + '")!;',
        'const setting = getSettingById("' + (data.settingId || '') + '")!;',
        'const scenario = assembleScenario(skeleton, "standard", setting, ALL_MODULES, rng);',
        'let state = initGame(scenario, "' + (data.playerClass || '') + '", "' + (data.difficulty || '') + '", "Joueur", rng);',
        'const parserData = buildParserLocaleData("fr");',
        '',
        '// Replay all turns up to the bug:',
        'const inputs = ' + JSON.stringify(data.inputHistory || []) + ';',
        'const buggyInput = "' + (data.playerInput || '').replace(/"/g, '\\"') + '";',
        'const historyToReplay = inputs.length > 0 && inputs[inputs.length - 1] === buggyInput ? inputs.slice(0, -1) : inputs;',
        'for (const input of historyToReplay) {',
        '  const ctx = getSceneContext(state);',
        '  const result = processTurn(state, input, ctx, parserData, rng);',
        '  state = result.newState;',
        '}',
        '',
        '// Bug occurs at turn ' + data.turn + ' with input: "' + (data.playerInput || '') + '"',
        '// console.log("--- State before bug ---", state);',
        'const bugCtx = getSceneContext(state);',
        'const bugResult = processTurn(state, buggyInput, bugCtx, parserData, rng);',
        '// console.log("Bug result:", bugResult);',
        '```',
        '',
        '### Context',
        '',
        '| Field | Value |',
        '|-------|-------|',
        '| **App Version** | ' + (data.appVersion || 'build-unknown') + ' |',
        '| **Seed** | `' + data.seed + '` |',
        '| **Skeleton** | ' + (data.skeletonId || '?') + ' |',
        '| **Setting** | ' + (data.settingId || '?') + ' |',
        '| **Class** | ' + (data.playerClass || '?') + ' |',
        '| **Difficulty** | ' + (data.difficulty || '?') + ' |',
        '| **Turn** | ' + data.turn + ' |',
        '| **Location** | ' + (data.locationName || '?') + ' (`' + (data.locationId || '') + '`) |',
        '| **Story Beat** | ' + (data.currentBeat || '?') + ' |',
        '| **HP** | ' + data.characterHp + '/' + data.characterMaxHp + ' |',
        '| **O2** | ' + data.characterO2 + '% |',
        '',
        '### Player Action',
        '',
        '| Field | Value |',
        '|-------|-------|',
        '| **Input** | `' + (data.playerInput || '') + '` |',
        '| **Parsed Verb** | ' + (data.parsedVerb || '—') + ' (strategy ' + (data.parseStrategy || '?') + (data.parseCreative ? ', creative' : '') + ') |',
        '| **Parsed Target** | ' + (data.parsedTargetName || data.parsedTarget || '—') + ' |',
        '| **Auto Verb** | ' + (data.isAutoVerb ? 'Yes' : 'No') + ' |',
        '',
        '### Resolution',
        '',
        '| Field | Value |',
        '|-------|-------|',
        '| **Stat** | ' + (data.statId || '—') + ' (' + (data.effectiveStatValue || 0) + ') |',
        '| **Dice** | D20=' + (data.diceNatural || 0) + ' + mod ' + (data.diceModifier || 0) + ' = ' + (data.diceTotal || 0) + ' |',
        '| **DC** | ' + (data.dc || 0) + (data.failsafeActivated ? ' (failsafe: -' + data.failsafeDcReduction + ')' : '') + (data.shipMemoryMod ? ' (ship memory: ' + data.shipMemoryMod + ')' : '') + ' |',
        '| **Outcome** | **' + (data.outcome || '—') + '** |',
        '',
      ];

      if (data.consequences && data.consequences.length > 0) {
        body.push('### Consequences');
        body.push('');
        data.consequences.forEach(function(c) { body.push('- ' + c); });
        body.push('');
      }

      if (data.npcReacted) {
        body.push('### NPC Reaction');
        body.push('');
        body.push('- Attack hit: ' + data.npcAttackHit + ' | Damage: ' + data.npcAttackDamage);
        body.push('');
      }

      body.push('### Scene Snapshot');
      body.push('');
      body.push('- **Items:** ' + ((data.sceneItems || []).join(', ') || 'none'));
      body.push('- **NPCs:** ' + ((data.sceneNpcs || []).join(', ') || 'none'));
      body.push('- **Features:** ' + ((data.sceneFeatures || []).join(', ') || 'none'));
      body.push('- **Exits:** ' + ((data.sceneExits || []).join(', ') || 'none'));
      body.push('- **Conditions:** ' + ((data.sceneConditions || []).join(', ') || 'none'));
      body.push('- **Suggestions:** ' + ((data.sceneSuggestions || []).join(', ') || 'none'));
      body.push('');

      body.push('### Player State');
      body.push('');
      body.push('- **Inventory:** ' + ((data.inventory || []).join(', ') || 'empty'));
      body.push('- **Conditions:** ' + ((data.conditions || []).join(', ') || 'none'));
      body.push('');

      body.push('### Narrative Output');
      body.push('');
      body.push('> ' + ((data.narration || 'No narration').replace(/\n/g, '\n> ')));
      body.push('');

      if (data.comment) {
        body.push('### Player Comment');
        body.push('');
        body.push(data.comment);
        body.push('');
      }

      if (inputHistoryMd) {
        body.push('<details><summary>Full Input History (' + (data.inputHistory || []).length + ' turns)</summary>');
        body.push('');
        body.push(inputHistoryMd);
        body.push('');
        body.push('</details>');
        body.push('');
      }

      body.push('---');
      body.push('*Generated by Void Walker Playtest Alpha*');

      UrlFetchApp.fetch(
        'https://api.github.com/repos/' + GITHUB_OWNER + '/' + GITHUB_REPO + '/issues',
        {
          method: 'post',
          headers: {
            Authorization: 'token ' + token,
            Accept: 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          payload: JSON.stringify({
            title: title.substring(0, 256),
            body: body.join('\n'),
            labels: ['playtest', 'bug'],
          }),
          muteHttpExceptions: true,
        }
      );
    }

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Paste this into a Google Apps Script project bound to a Google Sheet
// Tools → Script Properties → add GITHUB_PAT = your_pat_with_issues_write

const GITHUB_OWNER = 'greffeb';
const GITHUB_REPO = 'void-walker';

function doGet(e) {
  try {
    const data = JSON.parse(e.parameter.payload || '{}');

    // 1. Log every report to the Sheet
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    sheet.appendRow([
      new Date(data.timestamp),
      data.thumbs,
      data.playerClass,
      data.situationType,
      data.locationName,
      data.situationDescription || '',
      data.playerInput,
      data.parsedVerb,
      data.parsedTarget,
      data.diceNatural,
      data.diceTotal,
      data.dc,
      data.outcome,
      data.narration || '',
      data.comment || '',
    ]);

    // 2. Create GitHub Issue only for KO
    if (data.thumbs === 'down') {
      const token = PropertiesService.getScriptProperties().getProperty('GITHUB_PAT');
      const title = `[Playtest] KO: ${data.parsedVerb} → ${data.parsedTarget}`;
      const body = [
        '## Rapport de playtest',
        '',
        `**Classe:** ${data.playerClass}  **Date:** ${new Date(data.timestamp).toISOString()}`,
        '',
        '### Situation',
        `- **Type:** ${data.situationType}`,
        `- **Lieu:** ${data.locationName}`,
        `- **Description:** ${data.situationDescription || ''}`,
        '',
        '### Action du joueur',
        `- **Commande:** \`${data.playerInput}\``,
        `- **Verbe:** ${data.parsedVerb}  **Cible:** ${data.parsedTarget}`,
        '',
        '### Résolution',
        `- **Dé (naturel):** ${data.diceNatural}  **Total:** ${data.diceTotal}  **DC:** ${data.dc}`,
        `- **Résultat:** ${data.outcome}`,
        '',
        data.comment ? `### Commentaire du joueur\n${data.comment}` : '',
        '---',
        '*Généré automatiquement par le système de playtest Void Walker*',
      ].filter(Boolean).join('\n');

      UrlFetchApp.fetch(
        'https://api.github.com/repos/greffeb/void-walker/issues',
        {
          method: 'post',
          headers: {
            Authorization: `token ${token}`,
            Accept: 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          payload: JSON.stringify({ title, body, labels: ['playtest', 'bug'] }),
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

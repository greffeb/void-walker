import { ACTION_TEMPLATES } from '../src/content/templates/actionTemplates';

const cells = new Map<string, number>();
const perVerb = new Map<string, { templates: number; cells: Set<string> }>();

for (const t of ACTION_TEMPLATES) {
  const key = `${t.verb ?? `cat:${t.category}`}|${t.targetType ?? 'any'}|${t.outcome}|${t.tension}`;
  cells.set(key, (cells.get(key) ?? 0) + 1);
  const vk = t.verb ?? `cat:${t.category}`;
  if (!perVerb.has(vk)) perVerb.set(vk, { templates: 0, cells: new Set() });
  const e = perVerb.get(vk)!;
  e.templates += 1;
  e.cells.add(key);
}

const single = [...cells.values()].filter(n => n === 1).length;
console.log(`templates=${ACTION_TEMPLATES.length} cells=${cells.size} single=${single} (${((single / cells.size) * 100).toFixed(0)}%) avg=${(ACTION_TEMPLATES.length / cells.size).toFixed(2)}`);

// STATUS.md §4.1 metric: cells keyed by (verb × outcome × tension) only.
const statusCells = new Map<string, number>();
for (const t of ACTION_TEMPLATES) {
  const key = `${t.verb ?? `cat:${t.category}`}|${t.outcome}|${t.tension}`;
  statusCells.set(key, (statusCells.get(key) ?? 0) + 1);
}
const statusSingle = [...statusCells.values()].filter(n => n === 1).length;
console.log(`STATUS metric (verb x outcome x tension): cells=${statusCells.size} single=${statusSingle} (${((statusSingle / statusCells.size) * 100).toFixed(0)}%) avg=${(ACTION_TEMPLATES.length / statusCells.size).toFixed(2)}`);
console.log(`verbs with dedicated templates: ${new Set(ACTION_TEMPLATES.filter(t => t.verb).map(t => t.verb)).size}`);
console.log('');

const rows = [...perVerb.entries()].map(([v, e]) => ({
  verb: v,
  templates: e.templates,
  cells: e.cells.size,
  avg: e.templates / e.cells.size,
}));
rows.sort((a, b) => a.avg - b.avg || b.templates - a.templates);
for (const r of rows) {
  console.log(`${r.verb.padEnd(22)} templates=${String(r.templates).padStart(4)} cells=${String(r.cells).padStart(3)} avg=${r.avg.toFixed(2)}`);
}

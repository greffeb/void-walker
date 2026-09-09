// ---------------------------------------------------------------------------
// src/narration/secretVerbs.ts — Rendering the Easter-egg verbs
// ---------------------------------------------------------------------------
// Decision W. SECRET_VERB_TEMPLATES was written for phase 5 and never imported:
// the seven verbs it covered did not exist. The engine grades a use, this picks
// the words for that grade.
// ---------------------------------------------------------------------------

import type { VerbId } from '../engine/verbs';
import type { SecretVerbTier } from '../engine/secretVerbs';
import type { Locale } from '../i18n/types';
import type { SecretVerbTemplate } from './types';
import { SECRET_VERB_TEMPLATES } from '../content/templates/secrets';

type Rng = () => number;

const TEMPLATE_TYPE: Readonly<Record<SecretVerbTier, SecretVerbTemplate['type']>> = {
  discovery: 'discovery',
  effect: 'effect',
  annoyed: 'rejection',
  blocked: 'rejection',
};

/**
 * The words for one use of a secret verb.
 *
 * `setting` narrows the pick when the content wrote a variant for it
 * ("alien_ruins"); a template without a context fits anywhere. Returns null when
 * nothing was written for that verb and tier, so the caller can fall back to
 * the ordinary composition rather than print nothing.
 */
export function selectSecretVerbText(
  verb: VerbId,
  tier: SecretVerbTier,
  locale: Locale,
  rng: Rng,
  setting?: string,
): string | null {
  const wantedType = TEMPLATE_TYPE[tier];
  const isRejection = wantedType === 'rejection';

  const matching = SECRET_VERB_TEMPLATES.filter(tpl =>
    tpl.verb === verb
    && tpl.type === wantedType
    && (!isRejection || tpl.rejectionTier === tier),
  );
  if (matching.length === 0) {
    // A tier the content never wrote: a blocked refusal falls back on annoyance.
    if (tier === 'blocked') return selectSecretVerbText(verb, 'annoyed', locale, rng, setting);
    return null;
  }

  const inSetting = setting !== undefined
    ? matching.filter(tpl => tpl.context === setting)
    : [];
  const pool = inSetting.length > 0 ? inSetting : matching.filter(tpl => tpl.context === undefined);
  const chosen = pool.length > 0 ? pool : matching;

  const picked = chosen[Math.floor(rng() * chosen.length)] ?? chosen[0]!;
  const text = locale === 'fr' ? picked.text.fr : (picked.text.en || picked.text.fr);
  return text.length > 0 ? text : null;
}

/**
 * The content check on the fixture set (`tests/fixtures/content/`): it passes clean, and each failure class fires on
 * a planted bad copy. Every planted copy lives in a fresh temp folder.
 */
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';
import { checkContent, type CheckOptions, type CheckResult, type PlausibleInput, type PlausibleProof } from './check.ts';

const FIXTURE = fileURLToPath(new URL('../../tests/fixtures/content/', import.meta.url));

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment,
   @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return -- planted edits reach into the raw fixture JSON */
/** Edits a temp copy of the fixture; each method returns the editor, so a one-line edit is an expression. */
interface Editor {
  json(file: string, edit: (data: any) => any): Editor;
  text(file: string, edit: (text: string) => string): Editor;
  remove(file: string): Editor;
}

/** Checks a copy of the fixture after `edit`; the fixture itself is never changed. */
function planted(edit: (e: Editor) => unknown, options: CheckOptions = {}): CheckResult {
  const dir = mkdtempSync(join(tmpdir(), 'huecut-check-'));
  try {
    cpSync(FIXTURE, dir, { recursive: true });
    const editor: Editor = {
      text: (file, f) => {
        writeFileSync(join(dir, file), f(existsSync(join(dir, file)) ? readFileSync(join(dir, file), 'utf8') : ''));
        return editor;
      },
      json: (file, f) => editor.text(file, (t) => {
        const data: unknown = JSON.parse(t);
        return JSON.stringify(f(data) ?? data, null, 2);
      }),
      remove: (file) => {
        rmSync(join(dir, file));
        return editor;
      },
    };
    edit(editor);
    return checkContent(dir, { complete: false, ...options });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const errors = (r: CheckResult) => r.problems.filter((p) => p.level === 'error');
/** Asserts one error at `file` and `path` whose message contains `text`. */
function expectError(r: CheckResult, file: string, path: string, text: string): void {
  expect(errors(r)).toContainEqual(expect.objectContaining({ file, path, message: expect.stringContaining(text) }));
}
const lock = (id: string) => (t: string) => `${t}${id}\n`;

it('the fixture set passes with no errors and prints a count per file', () => {
  const r = checkContent(FIXTURE, { complete: false });
  expect(errors(r)).toEqual([]);
  expect(r.counts).toEqual(expect.arrayContaining([
    'haircuts/crop.json: 1 cut', 'haircuts/crop.json: 1 variant', 'haircuts/bob.json: 1 cut', 'beards.json: 1 beard',
    'colours/shades.json: 2 shades', 'colours/techniques.json: 2 techniques', 'colours/looks.json: 2 colour looks',
    'rules/cuts.json: 3 rules', 'rules/colours.json: 1 rule', 'rules/beards.json: 1 rule', 'rules/journey.json: 6 journey records',
    'rules/reminders.json: 2 reminders', 'rules/reminders.json: 1 referral', 'questions.json: 3 questions',
    'library-models.json: 2 library models', 'prompts/quick_grid.md: 1 template', 'phrases.json: 3 phrases',
    'bands.json: 1 band', 'pictures.json: 18 pictures', 'ids.lock: 30 ids (1 retired)',
  ]));
  expect(r.notes).toContain('plausible check colour/any: facts of more cautious records that are not core: none');
  expect(r.notes).toContain('plausible check point 3 (reachable with core answers, golden cases) not run: it needs the engine, passed in as plausibleReachable');
});

it('the fixture set in complete mode reports every fact nothing produces, and each missing template and technique', () => {
  const r = checkContent(FIXTURE);
  // Produced in the fixture: hair.texture, hair.chemical_history, safety.dye_reaction and safety.scalp_irritation by
  // questions, face.proportion by its band, colour.last_chemical_service derived from the history, and the two numeric face facts, read straight from the measurement: 91 - 8 = 83.
  expect(errors(r).filter((p) => p.message.startsWith('nothing produces'))).toHaveLength(83);
  expectError(r, 'questions.json', '$', 'nothing produces hair.cowlick_nape');
  expect(errors(r).some((p) => p.message.startsWith('nothing produces hair.texture'))).toBe(false);
  expectError(r, 'prompts/explain_card.md', '$', 'missing template for explain_card');
  expectError(r, 'colours/techniques.json', '$', 'no technique record for "root_shadow" (id "root-shadow")');
});

it('schema: unknown fact key, wrong value, missing field, invalid JSON, missing file', () => {
  const r = planted((e) => {
    e.json('rules/cuts.json', (d) => {
      d[0].when['hair.textur'] = { is: 'curly' };
      d[1].when['hair.texture'] = { in: ['curlyy'] };
    });
    e.json('haircuts/bob.json', (d) => { delete d[0].client; });
    e.text('bands.json', (t) => t.replace('{', '{,'));
    e.remove('rules/beards.json');
  });
  expectError(r, 'rules/cuts.json', '$[0].when', 'unknown fact key: hair.textur');
  expectError(r, 'rules/cuts.json', '$[1].when["hair.texture"].in[0]', 'expected one of');
  expectError(r, 'haircuts/bob.json', '$[0].client', 'expected string');
  expectError(r, 'bands.json', '$', 'not valid JSON');
  expectError(r, 'rules/beards.json', '$', 'missing file');
});

it('ids: unique across kinds, every id in ids.lock, no silent removal, no retired id in use, the lock format', () => {
  const r = planted((e) => {
    e.json('questions.json', (d) => { d.questions[2].id = 'b01'; d.core_sets['colour/any'] = ['chemical-history', 'b01']; });
    e.text('ids.lock', (t) => t.replace('ash-silver\n', '').replace('b02\n', 'b02 retired\n'));
    e.text('ids.lock', lock('ghost-cut'));
    e.text('ids.lock', lock('Bad_Id'));
  });
  expectError(r, 'questions.json', '$.questions[2].id', 'id "b01" is also used at rules/cuts.json $[0]');
  expectError(r, 'colours/shades.json', '$[0].id', '"ash-silver" is not in ids.lock');
  expectError(r, 'rules/cuts.json', '$[1].id', '"b02" is retired in ids.lock');
  // Line numbers after the planted edits: ash-silver's line is gone, so dye-reaction moves from line 27 to 26.
  expectError(r, 'ids.lock', 'line 26', 'no record has the id "dye-reaction"');
  expectError(r, 'ids.lock', 'line 31', 'no record has the id "ghost-cut"');
  expectError(r, 'ids.lock', 'line 32', 'expected "<id>" or "<id> retired"');
});

it('references: shades, techniques and their regions, pairings, models and drafts all resolve', () => {
  const r = planted((e) => {
    e.json('colours/looks.json', (d) => {
      d[0].base.shade = 'copper-autumn';
      d[1].base.on = 'copper-dawn';
    });
    e.json('haircuts/crop.json', (d) => { d[0].pairs_with.beards = ['beard-short-boxed', 'beard-nope']; });
    e.json('haircuts/bob.json', (d) => { d[0].images.model = 'barbering-straight-wavy'; d[0].family = 'lob'; });
    e.json('colours/techniques.json', (d) => { d[1].id = 'balayage-soft'; });
  });
  expectError(r, 'colours/looks.json', '$[0].base.shade', 'unknown shade "copper-autumn"');
  expectError(r, 'colours/looks.json', '$[1].base.on', 'unknown shade "copper-dawn"');
  expectError(r, 'colours/looks.json', '$[1].placements[0].technique', 'unknown technique "balayage"');
  expectError(r, 'haircuts/crop.json', '$[0].pairs_with.beards[0]', 'a checked record cannot use the draft beard "beard-short-boxed"');
  expectError(r, 'haircuts/crop.json', '$[0].pairs_with.beards[1]', 'unknown beard "beard-nope"');
  expectError(r, 'haircuts/bob.json', '$[0].images.model', 'the barbering model "barbering-straight-wavy" does not show a salon record');
  expectError(r, 'haircuts/bob.json', '$[0].family', 'a cut\'s family is its file name');
  expectError(r, 'colours/techniques.json', '$[1].id', '"balayage-soft" is not the kebab-case form of a technique value');
});

it('references: a placement outside its technique regions', () => {
  const r = planted((e) => e.json('colours/looks.json', (d) => { d[1].placements[0].region = 'root'; }));
  expectError(r, 'colours/looks.json', '$[1].placements[0].region', 'balayage may be placed in mids, ends, not root');
});

it('pictures: every checked item has its pictures, and no picture is an orphan', () => {
  const r = planted((e) => e.json('pictures.json', (d) => {
    delete d['salon-straight-wavy/chin-bob-curtain-fringe-side'];
    d['salon-straight-wavy/old-bob-front'] = d['salon-straight-wavy/base-front'];
    // A per-picture AVIF quality is part of the index; an unknown field fails that one entry, not the whole file.
    d['salon-straight-wavy/base-side'].quality = 51;
    d['salon-straight-wavy/base-back'].tint = 1;
  }));
  expectError(r, 'haircuts/bob.json', '$[0].images', 'checked, but pictures.json has no "salon-straight-wavy/chin-bob-curtain-fringe-side"');
  expectError(r, 'pictures.json', '$["salon-straight-wavy/old-bob-front"]', 'orphan picture');
  expectError(r, 'pictures.json', '$["salon-straight-wavy/base-back"]', 'unknown key: tint');
  expectError(r, 'library-models.json', '$[0].base_pictures.back', 'no picture "salon-straight-wavy/base-back" in pictures.json');
  expect(errors(r)).toHaveLength(4);
});

it('illustrations: an option naming one needs public/illustrations/<id>.svg or .avif; the fixture\'s four photos resolve', () => {
  const r = planted((e) => e.json('questions.json', (d) => {
    d.questions[0].options[1].illustration = 'q-texture-nowhere';
    d.questions[0].options[2].illustration = 'q-hairline-m';
  }));
  expect(errors(r).filter((p) => p.path.endsWith('.illustration'))).toEqual([
    { level: 'error', file: 'questions.json', path: '$.questions[0].options[1].illustration', message: 'no file public/illustrations/q-texture-nowhere.svg or .avif' },
  ]);
});

it('banned words: the never-words, em dashes and exclamation marks in any client text, prompts included', () => {
  const r = planted((e) => {
    e.json('haircuts/bob.json', (d) => { d[0].client = 'A bob to fix a round face — and hides the jaw!'; });
    e.json('phrases.json', (d) => { d['lightening.none'] = 'the ideal level'; });
    e.text('prompts/second_opinion.md', (t) => t.replace('second opinion.', 'second opinion. Do not score me.'));
  });
  for (const what of ['banned word "fix"', 'banned word "hides"', 'an em dash', 'an exclamation mark']) expectError(r, 'haircuts/bob.json', '$[0].client', what);
  expectError(r, 'phrases.json', '$["lightening.none"]', 'banned word "ideal"');
  expectError(r, 'prompts/second_opinion.md', 'body', 'banned word "score"');
});

it('follow-ups: resolve and have no follow-up of their own', () => {
  const r = planted((e) => e.json('questions.json', (d) => {
    d.questions[0].options[2].follow_up = 'dye-reaction';
    d.questions[0].options[3].follow_up = 'dye-reaction';
    d.questions[0].options[4].follow_up = 'grey-amount';
    d.questions[2].options[0].follow_up = 'chemical-history';
  }));
  expectError(r, 'questions.json', '$.questions[0].options[2].follow_up', '"dye-reaction" has a follow-up of its own');
  expectError(r, 'questions.json', '$.questions[0].options[4].follow_up', 'unknown question "grey-amount"');
});

it('core sets: each question known, offered for the set and listed once', () => {
  const r = planted((e) => e.json('questions.json', (d) => {
    d.core_sets['cut/salon'] = ['hair-texture', 'chemical-history'];
    d.core_sets['cut/barbering'] = ['hair-texture', 'hair-texture', 'no-such-question'];
  }));
  expectError(r, 'questions.json', '$.core_sets["cut/salon"][1]', '"chemical-history" is not offered for cut/salon');
  expectError(r, 'questions.json', '$.core_sets["cut/barbering"][1]', '"hair-texture" is listed twice');
  expectError(r, 'questions.json', '$.core_sets["cut/barbering"][2]', 'unknown question "no-such-question"');
});

it('core sets: at most 10 questions (11 barbering cuts, 12 Colour, 14 Both, 15 barbering Both), a follow-up counting with its question', () => {
  const r = planted((e) => e.json('questions.json', (d) => {
    for (let i = 0; i < 9; i += 1) {
      d.questions.push({ id: `q-extra-${String(i)}`, fact: 'hair.cowlick_front', type: 'single', goals: ['cut'], collections: ['salon'], prompt: 'Yes or no?',
        options: [{ value: true, label: 'Yes' }, { value: false, label: 'No' }, { value: null, label: 'Not sure' }] });
    }
    d.questions.push({ ...d.questions.at(-1), id: 'q-follow-up' });
    d.questions[0].options[2].follow_up = 'q-follow-up';
    const extras = Array.from({ length: 9 }, (_, i) => `q-extra-${String(i)}`);
    d.core_sets['cut/salon'] = ['hair-texture', ...extras];
    d.core_sets['both/salon'] = ['hair-texture', 'chemical-history', 'dye-reaction', 'q-follow-up', ...extras, 'c-extra-9', 'c-extra-10'];
    d.core_sets['colour/any'] = ['chemical-history', 'dye-reaction', ...Array.from({ length: 11 }, (_, i) => `c-extra-${String(i)}`)];
    for (let i = 0; i < 11; i += 1) d.questions.push({ id: `c-extra-${String(i)}`, fact: 'hair.cowlick_front', type: 'single', goals: ['colour'], collections: ['salon', 'barbering'], prompt: 'Yes or no?', options: [{ value: true, label: 'Yes' }, { value: false, label: 'No' }, { value: null, label: 'Not sure' }] });
  }));
  // cut/salon: 10 listed plus the texture question's follow-up, which counts with its question, so 10: allowed.
  expect(errors(r).some((p) => p.path === '$.core_sets["cut/salon"]')).toBe(false);
  expectError(r, 'questions.json', '$.core_sets["both/salon"]', '15 questions; a core set holds at most 14, a follow-up counting with its question');
  expectError(r, 'questions.json', '$.core_sets["colour/any"]', '13 questions; a core set holds at most 12, a follow-up counting with its question');
});

it('excludes use answered facts only', () => {
  const r = planted((e) => e.json('rules/cuts.json', (d) => { d[2].when = { 'face.proportion': { is: 'longer' }, 'life.tie_back_needed': { is: true } }; }));
  expectError(r, 'rules/cuts.json', '$[2].when["face.proportion"]', 'exclude rules use answered facts only; face.proportion is measured');
  expectError(r, 'rules/cuts.json', '$[2].when["life.tie_back_needed"]', 'life.tie_back_needed is not asked by any question');
});

it('wish gating: every group-A rule has a wish key', () => {
  const r = planted((e) => e.json('rules/cuts.json', (d) => { d[0].group = 'A'; }));
  expectError(r, 'rules/cuts.json', '$[0].when', 'every group-A rule is wish-gated');
});

it('strength: on rank rules only, and weak without a source', () => {
  const r = planted((e) => e.json('rules/cuts.json', (d) => {
    d[1].strength = 'strong';
    delete d[0].sources;
  }));
  expectError(r, 'rules/cuts.json', '$[1]', 'strength belongs on rank rules only');
  expectError(r, 'rules/cuts.json', '$[0].strength', 'a rank rule with no source is weak');
});

it('strength: a ranking policy rule carries its strength without a source, and only a policy rule does', () => {
  const r = planted((e) => e.json('rules/cuts.json', (d) => {
    delete d[0].sources;
    d[0].evidence = 'policy';
  }));
  expect(errors(r)).toEqual([]);
});

it('one match in on: an OR is written as separate records', () => {
  const r = planted((e) => e.json('rules/cuts.json', (d) => { d[1].on = [d[1].on, { tie_back: { is: false } }]; }));
  expectError(r, 'rules/cuts.json', '$[1].on', 'on holds one match; write an OR as separate records with from');
});

it('suppresses: same target, never an exclude, a journey record or the referral, no cycles', () => {
  const r = planted((e) => {
    e.json('rules/cuts.json', (d) => {
      d[0].suppresses = ['b02', 'c80', 'metallic-salts', 'dye-reaction-referral', 'd02', 'zz9'];
      d[1].suppresses = ['b01'];
    });
    e.json('rules/journey.json', (d) => { d[0].suppresses = ['unknown-history']; });
  });
  expectError(r, 'rules/cuts.json', '$[0].suppresses[1]', '"c80" is an exclude; excludes are never suppressed');
  expectError(r, 'rules/cuts.json', '$[0].suppresses[2]', '"metallic-salts" is a journey record; journey records are never suppressed');
  expectError(r, 'rules/cuts.json', '$[0].suppresses[3]', '"dye-reaction-referral" is the referral');
  expectError(r, 'rules/cuts.json', '$[0].suppresses[4]', '"d02" targets beard; suppresses names records of the same target (cut)');
  expectError(r, 'rules/cuts.json', '$[0].suppresses[5]', 'unknown rule "zz9"');
  expectError(r, 'rules/cuts.json', '$[0].suppresses', 'suppresses forms a cycle: b01 -> b02 -> b01');
  expectError(r, 'rules/journey.json', '$[0]', 'journey records and referrals are never suppressed and suppress nothing');
});

it('prompts: placeholders listed both ways, keep-list, kind, word budgets and the header', () => {
  const r = planted((e) => {
    e.text('prompts/quick_grid.md', (t) => t.replace('{{keep_list}}', '{{tile_size}}').replace('word_budget: 150', 'word_budget: 20').replace('keep_list: true', 'keep_list: false'));
    e.text('prompts/second_opinion.md', (t) => t.replace('word_budget: 250', 'word_budget: 331').replace('{{answers}}', '{{hair.textures}}').replace('kind: text', 'kind: image'));
  });
  expectError(r, 'prompts/quick_grid.md', 'body', '{{tile_size}} is not listed in variables');
  expectError(r, 'prompts/quick_grid.md', 'header.keep_list', 'quick_grid carries the keep-list');
  expectError(r, 'prompts/quick_grid.md', 'body', 'words before any placeholder is filled; the budget is 20');
  expectError(r, 'prompts/second_opinion.md', 'header.word_budget', '331 words; second_opinion has at most 330');
  expectError(r, 'prompts/second_opinion.md', 'header.variables', '"answers" is listed but the body never uses {{answers}}');
  expectError(r, 'prompts/second_opinion.md', 'body', '{{hair.textures}} names no fact key');
  expectError(r, 'prompts/second_opinion.md', 'header.kind', 'second_opinion is a text prompt');
});

it('prompts: the longest second opinion must keep every answer and note, and must build at all', () => {
  const tight = planted((e) => e.text('prompts/second_opinion.md', (t) => t.replace('word_budget: 250', 'word_budget: 100')));
  expectError(tight, 'prompts/second_opinion.md', 'body', 'the longest list leaves out ');
  const none = planted((e) => e.text('prompts/second_opinion.md', (t) => t.replace('word_budget: 250', 'word_budget: 35')));
  expectError(none, 'prompts/second_opinion.md', 'body', 'the production builder refuses the longest list: prompt_over_budget');
  expect(checkContent(FIXTURE, { complete: false }).notes).toEqual(expect.arrayContaining([expect.stringMatching(/^prompt check: the longest second opinion is \d+ words of 250$/)]));
});

it('prompts: keep_list true needs {{keep_list}}, the file is named after its template, and the header must parse', () => {
  const r = planted((e) => {
    e.text('prompts/quick_grid.md', (t) => t.replace('{{keep_list}}', ''));
    e.text('prompts/second_opinion.md', (t) => t.replace('template: second_opinion', 'template: explain_card'));
  });
  expectError(r, 'prompts/quick_grid.md', 'body', 'keep_list is true but the body has no {{keep_list}}');
  expectError(r, 'prompts/second_opinion.md', 'header.template', 'the template "explain_card" is in prompts/second_opinion.md');
  const broken = planted((e) => e.text('prompts/quick_grid.md', () => 'no header here'));
  expectError(broken, 'prompts/quick_grid.md', 'header', 'a template starts with a header block');
});

it('coverage: a match that matches no item, a rule fact nothing produces, a favour value without a phrase', () => {
  const r = planted((e) => {
    e.json('rules/cuts.json', (d) => {
      d[1].on = { shrinkage_risk: { is: 'medium' } };
      d[1].when['hair.strand'] = { is: 'fine' };
    });
    e.json('phrases.json', (d) => { delete d['lightening.some']; d['fringe.bangs'] = 'bangs'; });
  });
  expectError(r, 'rules/cuts.json', '$[1].on', 'matches no cut in the library');
  expectError(r, 'rules/cuts.json', '$[1].when["hair.strand"]', 'no question, measurement band or derivation produces hair.strand');
  expectError(r, 'rules/colours.json', '$[0].favour[0].lightening', 'no phrase for the favour value "lightening.some"');
  expectError(r, 'phrases.json', '$["fringe.bangs"]', '"fringe.bangs" is not "<trait>.<value>" over the trait lists');
});

it('coverage: a question whose fact nothing reads, and the warning for trait values no item has', () => {
  const r = planted((e) => e.json('rules/reminders.json', (d) => d.filter((x: any) => x.kind !== 'referral')));
  expectError(r, 'questions.json', '$.questions[2]', 'nothing reads safety.dye_reaction');
  expect(r.problems).toContainEqual(expect.objectContaining({ level: 'warning', message: expect.stringContaining('no cut item has silhouette: pixie') }));
});

it('plausible check point 1: a plausible record needs only facts the set asks', () => {
  const r = planted((e) => e.json('rules/journey.json', (d) => { d[0].on = { lift_levels: { range: [0, 2] } }; }));
  // lift_levels reads colour.current_level_lengths, which derives from hair.chemical_history and colour.natural_level.
  expectError(r, 'rules/journey.json', '$[0]', 'plausible check (colour/any): this plausible record needs colour.current_level_lengths');
  expectError(r, 'rules/journey.json', '$[0]', 'plausible check (both/salon): this plausible record needs colour.natural_level');
  expect(errors(r).some((p) => p.message.includes('needs hair.chemical_history'))).toBe(false);
});

it('plausible check point 2: a cautious fact is asked, derived or offered under "Improve my ideas"', () => {
  const r = planted((e) => {
    e.json('questions.json', (d) => { d.questions[0].goals = ['cut']; });
    e.json('rules/journey.json', (d) => {
      d[4].when = { 'hair.texture': { in: ['curly', 'coily'] } };
      d.push({ ...d[3], id: 'colour-soon-after-chemical', when: { 'colour.last_chemical_service': { is: 'weeks_0_2' } } });
    });
    e.text('ids.lock', lock('colour-soon-after-chemical'));
  });
  expectError(r, 'rules/journey.json', '$[4].when["hair.texture"]', 'plausible check (colour/any): hair.texture is neither asked, derived nor offered');
  expect(errors(r).filter((p) => p.message.includes('neither asked'))).toHaveLength(1);
  expect(r.notes).toContain('plausible check colour/any: facts of more cautious records that are not core: hair.texture, colour.last_chemical_service');
  expect(r.notes).toContain('plausible check both/salon: facts of more cautious records that are not core: colour.last_chemical_service');
});

it('plausible check point 3: the engine hook must prove a surviving witness of core answers per colour set', () => {
  const seen: PlausibleInput[] = [];
  const core = { 'hair.chemical_history': ['none'], 'safety.dye_reaction': 'none', 'safety.scalp_irritation': 'none' };
  // A stand-in for the engine: a sound witness for colour/any, a witness with a non-core answer and an unknown look
  // for both/salon, and no witness plus a broken golden case for both/barbering.
  const proofs: Record<string, PlausibleProof> = {
    'colour/any': { witness: { look: 'copper-with-silver-ends', answers: core }, problems: [] },
    'both/salon': { witness: { look: 'ghost-look', answers: { ...core, 'colour.natural_level': 6 } }, problems: [] },
    'both/barbering': { witness: null, problems: ['golden case g1 is "plausible" with a lift of 3'] },
  };
  const r = checkContent(FIXTURE, {
    complete: false,
    plausibleReachable: (input) => {
      seen.push(input);
      return proofs[input.set] ?? { witness: null, problems: [] };
    },
  });
  expect(seen.map((s) => s.set)).toEqual(['colour/any', 'both/salon', 'both/barbering']);
  expect(seen[2]?.core.map((q) => q.id)).toEqual(['hair-texture', 'chemical-history', 'dye-reaction']);
  expect(seen[0]?.improve.map((q) => q.id)).toEqual(['hair-texture']);
  expect(seen[0]?.looks.map((l) => [l.look.id, l.traits.target_level])).toEqual([['copper-with-silver-ends', 10], ['copper-balayage-prelightened', 9]]);
  expect(r.notes).toContain('plausible check colour/any: point 3 witness copper-with-silver-ends stays "Plausible" with {"hair.chemical_history":["none"],"safety.dye_reaction":"none","safety.scalp_irritation":"none"}');
  expectError(r, 'questions.json', '$.core_sets["both/salon"]', 'the witness look "ghost-look" is not in the library');
  expectError(r, 'questions.json', '$.core_sets["both/salon"]', 'the witness answers colour.natural_level, which the core set does not ask');
  expectError(r, 'questions.json', '$.core_sets["both/barbering"]', 'no profile of core answers alone leaves any library look "Plausible"');
  expectError(r, 'questions.json', '$.core_sets["both/barbering"]', 'golden case g1 is "plausible" with a lift of 3');
  expect(errors(r)).toHaveLength(4);
  expect(r.notes.some((n) => n.includes('not run'))).toBe(false);
});

/** The templates the fixture leaves out, from the real content, so the check runs every builder over a planted copy. */
const REAL_PROMPTS = fileURLToPath(new URL('../../content/prompts/', import.meta.url));
const withTemplates = (e: Editor): Editor => {
  for (const name of ['try_on_cut', 'try_on_colour', 'try_on_both', 'try_on_beard', 'final_card']) e.text(`prompts/${name}.md`, () => readFileSync(join(REAL_PROMPTS, `${name}.md`), 'utf8'));
  return e;
};

it('every look and every cut x colour pair goes through the production builder, and the fixture set builds', () => {
  const r = planted(withTemplates);
  expect(errors(r)).toEqual([]);
  expect(r.notes.some((n) => /^prompt check: \d+ looks and \d+ cut x colour pairs built/.test(n))).toBe(true);
});

it('plant: an over-long spec fails the check, on its own look and on its pairs', () => {
  const long = Array.from({ length: 170 }, () => 'layered').join(' ');
  const r = planted((e) => withTemplates(e).json('haircuts/bob.json', (d) => { d[0].prompt_spec = long; }));
  expect(errors(r)).toContainEqual(expect.objectContaining({ file: 'haircuts/bob.json', path: '$[0].prompt_spec', message: expect.stringContaining('prompt_over_budget') }));
  expect(errors(r)).toContainEqual(expect.objectContaining({ file: 'prompts/try_on_both.md', path: 'body', message: expect.stringContaining('prompt_over_budget') }));
});

it('plant: composite names that pass a budget fail the check on grids and cards', () => {
  const name = Array.from({ length: 60 }, () => 'copper').join(' ');
  const r = planted((e) => withTemplates(e).json('colours/looks.json', (d) => { d[0].name = name; }));
  expect(errors(r)).toContainEqual(expect.objectContaining({ file: 'prompts/final_card.md', message: expect.stringContaining('the longest card of cuts in one colour: prompt_over_budget') }));
  expect(errors(r)).toContainEqual(expect.objectContaining({ file: 'prompts/final_card.md', message: expect.stringContaining('the longest grid of cuts in one colour: prompt_over_budget') }));
});

/** The generated schemas: registry-driven tests per spec type, and the JSON Schema files for editor help. */
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { FILE_SCHEMAS, questionSchema, whenSchema, writeJsonSchemas } from './schema.ts';

it('offers the tests allowed per fact type', () => {
  expect(whenSchema.safeParse({ 'colour.natural_level': { range: [4, 7] }, 'life.headwear': { not: ['helmet'] } }).success).toBe(true);
  expect(whenSchema.safeParse({ 'hair.cowlick_front': { in: [true] } }).success).toBe(false);
  expect(whenSchema.safeParse({ 'hair.texture': { range: [1, 2] } }).success).toBe(false);
  expect(whenSchema.safeParse({ 'colour.natural_level': { range: [4, 11] } }).success).toBe(false);
  expect(whenSchema.safeParse({ 'hair.texture': { is: 'wavy', in: ['curly'] } }).success).toBe(false);
});

it('rejects an exclusive set value combined with others, and "None of these" on a set with a none value', () => {
  const base = { id: 'q', type: 'single', goals: ['colour'], collections: ['salon'], prompt: 'p' };
  const bad = questionSchema.safeParse({ ...base, type: 'single', options: [
    { label: 'x', sets: { 'hair.chemical_history': ['none', 'bleach'] } }, { value: null, label: 'Not sure' },
  ] });
  expect(bad.success).toBe(false);
  expect(bad.error?.issues.map((i) => i.message)).toContain('["none","bleach"] is not a value of hair.chemical_history');
  const none = questionSchema.safeParse({ ...base, fact: 'hair.chemical_history', type: 'multi', options: [
    { none_of_these: true, label: 'None of these' }, { value: null, label: 'Not sure' },
  ] });
  expect(none.error?.issues[0]?.message).toContain('"None of these" belongs on a set without a "none" value');
});

it('writes one JSON Schema per content file, with shared parts as references', () => {
  const dir = mkdtempSync(join(tmpdir(), 'huecut-schema-'));
  try {
    writeJsonSchemas(dir);
    const files = readdirSync(join(dir, 'schema')).sort();
    expect(files).toEqual(Object.keys(FILE_SCHEMAS).map((k) => `${k}.schema.json`).sort());
    const journey = JSON.parse(readFileSync(join(dir, 'schema', 'journey.schema.json'), 'utf8')) as { $defs: object; items: { properties: { when: object } } };
    expect(Object.keys(journey.$defs).length).toBeGreaterThan(10);
    expect(JSON.stringify(journey.items.properties.when)).toContain('"$ref":"#/$defs/');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

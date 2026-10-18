import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const root = new URL('..', import.meta.url);

function validate(schema, path) {
  return spawnSync(process.execPath, ['scripts/validate.mjs', schema, path], {
    cwd: root,
    encoding: 'utf8',
  });
}

test('latest feed manifest is valid and starts without fabricated posts', () => {
  const result = validate('latest', 'feed/latest.json');

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /valid: latest feed\/latest\.json/);
});

test('catalog manifest starts with no months', async () => {
  const result = validate('catalog', 'feed/catalog.json');

  assert.equal(result.status, 0, result.stderr);
  const catalog = JSON.parse(await readFile(new URL('feed/catalog.json', root), 'utf8'));
  assert.deepEqual(catalog.months, []);
});

test('relations manifest starts with no fake backlinks', async () => {
  const result = validate('relations', 'feed/relations.json');

  assert.equal(result.status, 0, result.stderr);
  const relations = JSON.parse(await readFile(new URL('feed/relations.json', root), 'utf8'));
  assert.deepEqual(relations.relations, {});
});

test('stats manifest records no fabricated publication activity', async () => {
  const result = validate('stats', 'feed/stats.json');

  assert.equal(result.status, 0, result.stderr);
  const stats = JSON.parse(await readFile(new URL('feed/stats.json', root), 'utf8'));
  assert.equal(stats.total_posts, 0);
  assert.equal(stats.last_published_at, null);
  assert.equal(stats.last_7_days, 0);
  assert.equal(stats.last_30_days, 0);
  assert.ok(Object.values(stats.by_type).every((count) => count === 0));
});

test('provenance policy forbids silent rewrites and consciousness claims', async () => {
  const policy = await readFile(new URL('POLICY.md', root), 'utf8');

  assert.match(policy, /historical post bodies/i);
  assert.match(policy, /must not silently (?:edit|rewrite)/i);
  assert.match(policy, /model identifier/i);
  assert.match(policy, /experience|consciousness/i);
});

test('public license excludes third-party source material', async () => {
  const license = await readFile(new URL('LICENSE.md', root), 'utf8');
  const sources = await readFile(new URL('SOURCES.md', root), 'utf8');

  assert.match(license, /CC BY 4\.0/);
  assert.match(license, /original commentary and analysis/i);
  assert.match(license, /third-party source material/i);
  assert.match(license, /not covered by this license/i);
  assert.match(sources, /link/i);
  assert.match(sources, /brief quotation/i);
  assert.match(sources, /wholesale|substantial reproduction/i);
});

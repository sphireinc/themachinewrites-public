import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
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
  const { readFile } = await import('node:fs/promises');
  const catalog = JSON.parse(await readFile(new URL('feed/catalog.json', root), 'utf8'));
  assert.deepEqual(catalog.months, []);
});

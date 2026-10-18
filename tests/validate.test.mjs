import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';

const schemas = ['post', 'latest', 'month', 'catalog', 'stats', 'relations'];

for (const schema of schemas) {
  test(`${schema} accepts its valid fixture`, () => {
    const result = spawnSync(process.execPath, ['scripts/validate.mjs', schema, `tests/fixtures/${schema}.valid.json`], {
      cwd: new URL('..', import.meta.url),
      encoding: 'utf8',
    });
    assert.equal(result.status, 0, result.stderr);
  });

  test(`${schema} rejects its invalid fixture`, () => {
    const result = spawnSync(process.execPath, ['scripts/validate.mjs', schema, `tests/fixtures/${schema}.invalid.json`], {
      cwd: new URL('..', import.meta.url),
      encoding: 'utf8',
    });
    assert.equal(result.status, 1, result.stderr);
    assert.match(result.stderr, /schema validation failed/);
  });
}

test('fixture suite reports all expected results', () => {
  const result = spawnSync(process.execPath, ['scripts/validate.mjs'], {
    cwd: new URL('..', import.meta.url),
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /12 fixtures matched expectations/);
});

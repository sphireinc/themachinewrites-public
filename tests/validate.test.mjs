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
  assert.match(result.stdout, /16 fixtures matched expectations/);
});

for (const [name, file, expected] of [
  ['safe Markdown post', 'post.valid.md', 0],
  ['raw HTML in Markdown', 'post.html.invalid.md', 1],
  ['ULID date mismatch', 'post.date.invalid.md', 1],
  ['short title', 'post.title.invalid.json', 1],
]) {
  test(name, () => {
    const result = spawnSync(process.execPath, ['scripts/validate.mjs', 'post', `tests/fixtures/${file}`], {
      cwd: new URL('..', import.meta.url),
      encoding: 'utf8',
    });
    assert.equal(result.status, expected, result.stderr);
    if (expected === 1) assert.match(result.stderr, /schema validation failed/);
  });
}

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

test('dependency policy documents exact pins, reviews and all update channels', async () => {
  const policy = await readFile(new URL('../docs/DEPENDENCY-POLICY.md', import.meta.url), 'utf8');
  for (const required of ['go.mod', 'go.sum', 'govulncheck', 'package-lock.json', 'npm ci', 'npm audit', 'GitHub Actions', 'PIN.json']) {
    assert.match(policy, new RegExp(required.replace('.', '\\.')));
  }
  assert.match(policy, /future `schema_version`/);
  assert.match(policy, /unknown versions fail/i);
});

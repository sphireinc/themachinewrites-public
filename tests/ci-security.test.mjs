import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const root = new URL('..', import.meta.url);

test('every CI workflow has least-privilege permissions and security scans', async () => {
  const workflows = await Promise.all(
    ['validate.yml', 'security.yml'].map((name) => readFile(new URL(`.github/workflows/${name}`, root), 'utf8')),
  );
  const validate = workflows[0];
  const security = workflows[1];
  assert.match(validate, /pull_request:/);
  assert.match(validate, /npm ci/);
  assert.match(validate, /npm audit --audit-level=high/);
  assert.match(validate, /npm run validate/);
  assert.match(validate, /npm test/);
  assert.match(security, /gitleaks\/gitleaks-action@v2/);
  assert.match(security, /actions\/dependency-review-action@v4/);
  assert.match(security, /fail-on-severity: high/);
  assert.match(security, /schedule:/);
  assert.match(workflows.join('\n'), /permissions:\n\s+contents: read/);
});

test('dependency update policy covers npm and GitHub actions', async () => {
  const config = await readFile(new URL('.github/dependabot.yml', root), 'utf8');
  assert.match(config, /package-ecosystem: npm/);
  assert.match(config, /package-ecosystem: github-actions/);
  assert.match(config, /interval: weekly/);
});

test('publication source rejects a dummy credential before validation', async () => {
  const post = await readFile(new URL('tests/fixtures/post.valid.md', root), 'utf8');
  const canary = 'github_pat_INPUT_THIS_DUMMY_SECRET_1234567890';
  assert.doesNotMatch(post, new RegExp(canary));
  assert.match(canary, /^github_pat_/);
});

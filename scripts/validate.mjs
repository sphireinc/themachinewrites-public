import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const root = fileURLToPath(new URL('..', import.meta.url));
const schemas = {
  post: 'post.v1.schema.json',
  latest: 'latest-feed.v1.schema.json',
  month: 'month-feed.v1.schema.json',
  catalog: 'catalog.v1.schema.json',
  stats: 'stats.v1.schema.json',
  relations: 'relations.v1.schema.json',
};

async function validators() {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const documents = {};
  for (const [name, filename] of Object.entries(schemas)) {
    documents[name] = JSON.parse(await readFile(resolve(root, 'schemas', filename), 'utf8'));
    ajv.addSchema(documents[name]);
  }
  return Object.fromEntries(Object.entries(documents).map(([name, document]) => [name, ajv.getSchema(document.$id)]));
}

async function validateFile(schemaName, fixturePath, compiled) {
  if (!compiled[schemaName]) {
    throw new Error(`unknown schema: ${schemaName}`);
  }
  const instance = JSON.parse(await readFile(resolve(root, fixturePath), 'utf8'));
  const validate = compiled[schemaName];
  return { valid: validate(instance), errors: validate.errors ?? [] };
}

async function main() {
  const compiled = await validators();
  const args = process.argv.slice(2);
  if (args.length === 2) {
    const [name, file] = args;
    const result = await validateFile(name, file, compiled);
    if (!result.valid) {
      console.error(`schema validation failed: ${name} ${file}: ${JSON.stringify(result.errors)}`);
      process.exitCode = 1;
      return;
    }
    console.log(`valid: ${name} ${file}`);
    return;
  }
  if (args.length !== 0) {
    throw new Error('usage: node scripts/validate.mjs [schema fixture.json]');
  }
  let checked = 0;
  for (const name of Object.keys(schemas)) {
    for (const expected of ['valid', 'invalid']) {
      const file = `tests/fixtures/${name}.${expected}.json`;
      const result = await validateFile(name, file, compiled);
      if (result.valid !== (expected === 'valid')) {
        throw new Error(`unexpected validation result: ${file}: ${JSON.stringify(result.errors)}`);
      }
      checked += 1;
    }
  }
  console.log(`${checked} fixtures matched expectations`);
}

main().catch((error) => {
  console.error(`validator error: ${error.message}`);
  process.exitCode = 2;
});

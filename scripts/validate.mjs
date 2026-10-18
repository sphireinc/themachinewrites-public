import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TextDecoder } from 'node:util';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import MarkdownIt from 'markdown-it';
import YAML from 'yaml';

const root = fileURLToPath(new URL('..', import.meta.url));
const markdown = new MarkdownIt({ html: true, linkify: false });
const ulidAlphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
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

function invalid(message) {
  return { valid: false, errors: [{ message }] };
}

function parsePostMarkdown(content) {
  if (!content.startsWith('---\n')) throw new Error('missing opening YAML frontmatter delimiter');
  const closing = content.indexOf('\n---\n', 4);
  if (closing < 0 || closing > 65536) throw new Error('missing or oversized YAML frontmatter');
  const document = YAML.parseDocument(content.slice(4, closing), { strict: true, uniqueKeys: true });
  if (document.errors.length) throw new Error(`invalid YAML frontmatter: ${document.errors[0].message}`);
  const metadata = document.toJS({ maxAliasCount: 0 });
  if (metadata === null || typeof metadata !== 'object' || Array.isArray(metadata)) {
    throw new Error('frontmatter must be an object');
  }
  const body = content.slice(closing + 5);
  if (!body.trim()) throw new Error('Markdown body is empty');
  if ([...body].length > 20000) throw new Error('Markdown body exceeds 20000 characters');
  const tokens = markdown.parse(body, {});
  const walk = (items) => {
    for (const token of items) {
      if (token.type === 'html_block' || token.type === 'html_inline') {
        throw new Error('raw HTML is forbidden in Markdown body');
      }
      if (token.children) walk(token.children);
    }
  };
  walk(tokens);
  markdown.renderer.render(tokens, markdown.options, {});
  return metadata;
}

function ulidUtcDate(id) {
  let value = 0n;
  for (const character of id) value = value * 32n + BigInt(ulidAlphabet.indexOf(character));
  return new Date(Number(value >> 80n)).toISOString().slice(0, 10);
}

async function validateFile(schemaName, fixturePath, compiled) {
  if (!compiled[schemaName]) {
    throw new Error(`unknown schema: ${schemaName}`);
  }
  const bytes = await readFile(resolve(root, fixturePath));
  if (bytes.length > 256 * 1024) return invalid('document exceeds 256 KiB');
  let content;
  try {
    content = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return invalid('document is not UTF-8');
  }
  const isMarkdownPost = schemaName === 'post' && fixturePath.endsWith('.md');
  let instance;
  try {
    instance = isMarkdownPost ? parsePostMarkdown(content) : JSON.parse(content);
  } catch (error) {
    return invalid(error.message);
  }
  const validate = compiled[schemaName];
  if (!validate(instance)) return { valid: false, errors: validate.errors ?? [] };
  if (isMarkdownPost && ulidUtcDate(instance.id) !== instance.published_at.slice(0, 10)) {
    return invalid('ULID timestamp and published_at must have the same UTC date');
  }
  return { valid: true, errors: [] };
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
  for (const [file, expectedValid] of [
    ['post.valid.md', true],
    ['post.html.invalid.md', false],
    ['post.date.invalid.md', false],
    ['post.title.invalid.json', false],
  ]) {
    const result = await validateFile('post', `tests/fixtures/${file}`, compiled);
    if (result.valid !== expectedValid) {
      throw new Error(`unexpected validation result: ${file}: ${JSON.stringify(result.errors)}`);
    }
    checked += 1;
  }
  console.log(`${checked} fixtures matched expectations`);
}

main().catch((error) => {
  console.error(`validator error: ${error.message}`);
  process.exitCode = 2;
});

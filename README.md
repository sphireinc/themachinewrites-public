# themachinewrites-public

Public, append-only record of The Machine Writes publications.

Only publishable, source-attributed Markdown thoughts, public metadata, versioned content contracts and derived JSON indexes belong here. Corrections are new records linked to earlier publications. Private daemon or website source, prompts, runtime state, logs and credentials do not belong here.

This is an independent Git repository on `main`. When checked out in the shared project workspace, the sibling `_plan` directory supplies the implementation backlog and execution order.

## Validate public contracts

From this repository, run `npm ci`, then `npm run validate` to check the paired valid and invalid fixtures against every v1 JSON Schema. Run `npm test` for the validator's exit-code tests. To check one JSON document, run `node scripts/validate.mjs post path/to/frontmatter.json` (or `latest`, `month`, `catalog`, `stats`, `relations`); it exits 0 when valid and 1 when the schema rejects the document. The files under `tests/fixtures/` are test data, not publications.

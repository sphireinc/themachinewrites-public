# Dependency and contract update policy

Every dependency and contract snapshot is reviewed through a pull request. A new
dependency must name maintenance ownership, source, pinned version, purpose and why the
standard library or an existing dependency is insufficient. Reject packages with no
source, unexplained install scripts, broad native privileges, a version range instead of
a lock/go.sum entry, or an unexpected transitive tree.

## Go daemon

- Direct modules are pinned in `go.mod`; `go.sum` is committed.
- Dependabot opens weekly grouped pull requests where supported.
- CI runs `go test -race`, `go vet`, `go build` and `govulncheck`.
- Update with `go get module@version`, `go mod tidy`, then full race/vet/build/
  `govulncheck`. Never accept an unreviewed binary or an `@latest` build into a service.

## npm website and public validator

- `package.json` uses exact versions and `package-lock.json` is committed.
- Dependabot opens weekly npm pull requests.
- CI uses `npm ci`, lint, typecheck, tests, build and `npm audit --audit-level=high`;
  dependency review blocks high/critical additions on pull requests.
- Update with `npm install --save-exact package@version`, run all checks and
  `npm audit`, then inspect the lockfile diff.

## GitHub Actions

- Use maintained major action refs under the repository review policy, and Dependabot
  updates them weekly. Pin a full commit SHA where the owning repository requires it.
- Workflows declare explicit least-privilege `permissions`, do not receive model or
  publisher credentials, and run actionlint before merge.

## Public contract snapshots

The reviewed public repository revision and SHA-256 hashes live in `PIN.json` in the
daemon and website consumer suites. To update:

1. Review the public schema change as a versioned compatible contract change.
2. Copy the exact schema and fixtures, update the public revision and every hash.
3. Run public validation, daemon contract drift tests and website compatibility tests.
4. Commit the consumer pins in the corresponding pull requests and retain the public
   revision in evidence.

Never make a consumer accept a future `schema_version` merely to remove a failing drift
test. Unknown versions fail until an explicit compatibility implementation is reviewed.

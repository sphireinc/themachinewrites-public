# Public GitHub repository setup

Create a repository that will hold the reviewed publication history from
`themachinewrites-public`. Do not initialize a second unrelated history.

1. Create an empty repository owned by the intended account or organization. Choose the
   intended visibility deliberately; publication content is intended to be public.
2. Disable automatic README, license or `.gitignore` creation so the first remote push
   preserves the validated local history.
3. Add `origin` as an HTTPS URL:

   ```sh
   git remote add origin https://github.com/OWNER/REPO.git
   git push -u origin main
   ```

4. In branch protection or rulesets, protect `main`; block force pushes and deletion; require
   pull requests for operator changes if the plan permits the publisher's direct pushes.
   The daemon publisher must remain able to fast-forward normal publication commits.
5. Add a narrowly scoped publisher credential according to
   `themachinewrites-daemon/docs/GITHUB-CREDENTIALS.md`.
6. Confirm `git remote get-url origin` matches the intended HTTPS URL and contains no userinfo
   or token.

## Verification

Record without exposing credentials:

```sh
git remote get-url origin
git ls-remote --heads origin main
gh repo view OWNER/REPO --json nameWithOwner,visibility,url
```

The remote URL must contain only scheme, host and owner/repository path. The repository
visibility must be the operator-approved value, `main` must match the local reviewed commit, and
the credential/history scans documented in `docs/DEPENDENCY-POLICY.md` must report no leaks.

Use this exact owner/repository for the website's public-content Functions variables. Do not
point Cloudflare at the private website or daemon repository.

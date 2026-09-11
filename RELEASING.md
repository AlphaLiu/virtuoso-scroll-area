# Releasing

`virtuo-scroll-area` is released through GitHub Actions, and every version is **staged** on npm
for human approval before it becomes installable. Apart from the very first version (see
[First publish](#first-publish)), nothing is published from a developer machine — except the
approval step, which you may run either in CI or locally (see [Approving](#approving)).

## The pipeline

`.github/workflows/release.yml` has two entry points:

| Event                                                 | What it means                                                                                                                        |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Run workflow** (Actions → Release → _Run workflow_) | The normal path: pick a bump, and the workflow commits it, tags it and stages it.                                                    |
| **Push a `v*` tag**                                   | You cut the tag yourself (`git tag v0.3.0 && git push origin v0.3.0`) and the workflow stages it. The tag must match `package.json`. |

Jobs, in order:

1. **Resolve version** — bumps `package.json` with `npm version` (dispatch only, skipped for
   `bump: none`), commits `chore(release): vX.Y.Z`, pushes the commit and the tag, then resolves
   the exact tag/version the rest of the run works on.
2. **Verify** — checks out that tag and runs the shared `.github/actions/verify` action:
   `bun install --frozen-lockfile` → `format:check` → `typecheck` → `test` → `build` →
   `verify:pack` (packs the tarball, installs it into a throwaway consumer and imports every
   entry point over ESM).
3. **Stage on npm** — rebuilds `dist/`, asserts `package.json` matches the release version,
   derives the dist-tag, then runs `npm stage publish --access public --provenance
--ignore-scripts`. This uploads the tarball to npm's stage queue; **the version is not
   installable yet and `latest` does not move.**
4. **Approve** (`.github/workflows/approve-release.yml`, separate run) — you supply a fresh 2FA
   OTP, the workflow approves the stage entry with `npm stage approve`, verifies the version
   actually landed on the registry and carries a provenance attestation, and only then creates
   the GitHub Release from the matching `CHANGELOG.md` section (falling back to generated notes
   with a warning). Prerelease versions are marked as such.

The dist-tag is `latest` for `X.Y.Z` and the prerelease identifier for `X.Y.Z-<id>.N`
(so `1.1.0-beta.1` is staged under `beta`, leaving `latest` alone).

## Approving

A staged version sits in the queue until someone proves presence with a 2FA challenge. Two ways:

**In CI (recommended).** Actions → **Approve staged release** → _Run workflow_:

| Input     | Value                                                                         |
| --------- | ----------------------------------------------------------------------------- |
| `version` | the exact version to approve, e.g. `0.3.0` (empty = `package.json` on `main`) |
| `otp`     | a fresh 6-digit code from your authenticator                                  |

The OTP is short-lived, so generate it immediately before dispatching. Approval is not
retry-safe with a stale code — the workflow prints the `stage-id` and the exact command to run
locally if the password expires mid-run.

**Locally.** Requires an authenticated npm CLI with 2FA:

```bash
bun run stage:list          # find the stage-id for the version you staged
npm stage approve <stage-id>   # prompts for your OTP
```

Then create the GitHub Release by running the CI route with `version` filled in — the approval
step is skipped only if nothing is staged, so re-running it after a local approval still verifies
the registry and creates the Release.

`npm stage reject <stage-id>` discards a staged version without publishing it. The version number
is **consumed either way**: npm refuses to stage a version that was already staged or published,
so a rejected `0.3.0` means the next attempt is `0.3.1`, or you delete the tag and rewind
`package.json` on `main`.

## First publish

npm only lets you configure a trusted publisher for a package that already exists, so the first
version has to go out with a token (or from your machine):

```bash
npm login --registry=https://registry.npmjs.org/
bun run verify        # typecheck + test + build + pack verification
bun run publish:dry   # `npm pack` preview, publishes nothing
bun run publish:npm   # emergency direct publish; the trusted publisher must allow `npm publish`
```

After that, configure authentication for the automated runs below. Note that `publish:npm` is a
direct publish and is rejected whenever the trusted publisher is scoped to `npm stage publish`
only — which is the case for this package.

## Authentication

The staging job supports both npm auth methods and picks whichever is available — it uses the
`NPM_TOKEN` repository secret when that secret is set, and falls back to OIDC trusted publishing
when it is not. Note that the OTP input of the approval workflow is **not** an alternative to
this: it is the 2FA proof of presence on top of whichever auth method applies.

### Trusted publishing (recommended)

Trusted publishing needs no long-lived secret, and npm records provenance for every release. On
npmjs.com, open the package → **Settings** → **Trusted Publisher** → **GitHub Actions** and fill
in:

| Field                | Value                  |
| -------------------- | ---------------------- |
| Organization or user | `AlphaLiu`             |
| Repository           | `virtuoso-scroll-area` |
| Workflow filename    | `release.yml`          |
| Environment          | _(leave empty)_        |
| Permissions          | `npm stage publish`    |

Then make sure the `NPM_TOKEN` secret does **not** exist (or delete it) so the OIDC path is
taken. Trusted publishing needs npm CLI ≥ 11.5.1, and staged publishing needs ≥ 11.15.0, which
the workflows install explicitly rather than trusting the npm bundled with Node 24.

**The Permissions choice matters.** npm exposes two independent switches — `npm publish` and
`npm stage publish` — and they are not additive:

| Permissions setting | `npm publish` from CI | `npm stage publish` from CI |
| ------------------- | --------------------- | --------------------------- |
| `npm publish`       | accepted              | rejected                    |
| `npm stage publish` | **rejected (403)**    | accepted                    |

This repository uses `npm stage publish`, so `release.yml` must call `npm stage publish`. A
`npm publish` under that policy fails with `E403 ... OIDC permission denied for this action`,
which is the error to expect if the permission is ever switched back.

### NPM_TOKEN (alternative)

Create a granular **Automation** access token on npmjs.com with read/write on this package and
add it as the repository secret `NPM_TOKEN`. The workflow prefers it when present.

### Repository permissions

The version job pushes a commit and a tag with `GITHUB_TOKEN`, so **Settings → Actions →
General → Workflow permissions** must allow _Read and write permissions_. Branch protection on
`main` that blocks direct pushes will also block the bump — either relax it for
`github-actions[bot]`, or cut tags by hand and use the tag-push path.

## Cutting a release

1. Land your changes on `main` and add the `## [X.Y.Z] — YYYY-MM-DD` section to `CHANGELOG.md`
   (the exact heading format already used in that file). Without it the GitHub Release gets
   GitHub's generated notes instead.
2. Actions → **Release** → _Run workflow_ → branch `main`, `bump` = `patch` / `minor` /
   `major`, `dry_run` off → **Run workflow**.
3. When that run is green the version is **staged, not published**: a `vX.Y.Z` tag exists, but
   `npm i virtuo-scroll-area@X.Y.Z` still fails and `latest` has not moved.
4. Approve it — Actions → **Approve staged release** → _Run workflow_ with the version and a
   fresh OTP (see [Approving](#approving)). That run publishes the version, then creates the
   GitHub Release from the `CHANGELOG.md` section.

Re-run a failed staging with `bump: none` to stage the version already in `package.json` (its
tag must exist on `origin`). If it fails because the version is _already staged_, do not bump —
approve what is already in the queue (`bun run stage:list`).

Use `dry_run: true` to exercise the pipeline without touching npm. It still bumps, commits and
tags — only the staging and approval steps are skipped — so a dry run of `bump: minor` followed
by a real `bump: none` is a complete rehearsal that publishes nothing until you approve.

### Versioning rules

Keep `CHANGELOG.md` in sync with `package.json`: the tag, the changelog heading and the version
must agree, and CI additionally fails when the tag does not match `package.json`. Anything that
changes the published surface (`exports`, props, class names, `--vsa-*` variables) is at least a
minor bump while the package is `0.x`, and a breaking change once it is `1.x`. Because staging
consumes a version number even when nothing is approved, decide the bump before you dispatch.

## Publishing from your machine

Only needed for the first release or for an emergency, and it requires being logged in:

```bash
bun run verify        # the same gate CI runs
bun run publish:dry   # pack + print what npm would receive
bun run publish:npm   # real publish — rejected while the trusted publisher is stage-only
```

The normal way to touch the registry from your machine is the approval step instead:

```bash
bun run stage:list          # what is queued, with each stage-id
bun run stage:approve <stage-id>   # publishes it after your OTP
```

These pass `--registry=https://registry.npmjs.org/` where relevant because the default registry
in a local `~/.npmrc` may be a read-only mirror. A local `npm publish` cannot attach a provenance
attestation — only CI can, so prefer the approval workflow when provenance matters.

## Troubleshooting

| Symptom                                                          | Cause                                                                                                                                                                                                   |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Tag vX.Y.Z does not match the package.json version`             | The tag and `package.json` disagree; retag or run with `bump: none` after fixing the version.                                                                                                           |
| `Tag vX.Y.Z is not on origin`                                    | `bump: none` with an unpushed tag, or a bump that failed to push.                                                                                                                                       |
| `E403 ... OIDC permission denied for this action`                | Almost always a Permissions mismatch: the trusted publisher allows `npm publish` while the workflow calls `npm stage publish` (or the reverse). Check org, repo, workflow filename and Environment too. |
| `E403 ... cannot publish over the previously published versions` | That version is already on npm — bump again; npm versions are immutable.                                                                                                                                |
| Staging fails with "already staged"                              | A previous run staged this version. Approve or reject it (`bun run stage:list`) instead of re-staging.                                                                                                  |
| Release workflow is green but the install still fails            | Working as intended: the version is staged and needs approval (see [Approving](#approving)).                                                                                                            |
| Approval fails with an OTP error                                 | The 2FA password expired between generating it and running the job. Retry with a fresh code.                                                                                                            |
| `npm stage` is not a command                                     | The npm CLI is older than 11.15.0. The workflows install `npm@^11.15.0` explicitly for this reason.                                                                                                     |
| `provenance` errors                                              | The staging job must keep `id-token: write`, and `package.json` must keep the matching `repository` field.                                                                                              |
| Verify job fails but the branch was green                        | The tag points at a commit that no longer matches the branch, or `bun.lock` drifted from `package.json`.                                                                                                |
| `Can't find 'action.yml' ... .github/actions/verify`             | The tag predates the release automation. Both `.github/workflows/*` and `.github/actions/verify` must be present in the tagged commit.                                                                  |

# Releasing

`virtuo-scroll-area` is published to npm by GitHub Actions. Apart from the very first version
(see [First publish](#first-publish)), nothing is published from a developer machine.

## The pipeline

`.github/workflows/release.yml` has two entry points that end in the same four jobs:

| Event                                                 | What it means                                                                                                                           |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Run workflow** (Actions → Release → _Run workflow_) | The normal path: pick a bump, and the workflow commits it, tags it and publishes.                                                       |
| **Push a `v*` tag**                                   | You cut the tag yourself (`git tag v0.2.0 && git push origin v0.2.0`) and the workflow publishes it. The tag must match `package.json`. |

Jobs, in order:

1. **Resolve version** — bumps `package.json` with `npm version` (dispatch only, skipped for
   `bump: none`), commits `chore(release): vX.Y.Z`, pushes the commit and the tag, then resolves
   the exact tag/version the rest of the run works on.
2. **Verify** — checks out that tag and runs the shared `.github/actions/verify` action:
   `bun install --frozen-lockfile` → `format:check` → `typecheck` → `test` → `build` →
   `verify:pack` (packs the tarball, installs it into a throwaway consumer and imports every
   entry point in ESM and CJS).
3. **Publish to npm** — rebuilds `dist/`, asserts `package.json` matches the release version,
   derives the dist-tag, then runs `npm publish --access public --provenance --ignore-scripts`.
   `--ignore-scripts` skips `prepublishOnly` (a second full `verify`); job 2 already gated this
   exact commit.
4. **GitHub Release** — creates the release for the tag, using the matching `CHANGELOG.md`
   section as the notes (falling back to generated notes with a warning if the version has no
   section). Prerelease versions are marked as such.

The dist-tag is `latest` for `X.Y.Z` and the prerelease identifier for `X.Y.Z-<id>.N`
(so `1.1.0-beta.1` is published under `beta`, leaving `latest` alone).

## First publish

npm only lets you configure a trusted publisher for a package that already exists, so the first
version has to go out with a token (or from your machine):

```bash
npm login --registry=https://registry.npmjs.org/
bun run publish:dry   # full verify + `npm pack` preview, publishes nothing
bun run publish:npm   # prepublishOnly runs `bun run verify`, then publishes 0.1.0
```

After that, configure authentication for the automated runs below.

## Authentication

The publish job supports both npm auth methods and picks whichever is available — it uses the
`NPM_TOKEN` repository secret when that secret is set, and falls back to OIDC trusted publishing
when it is not.

### Trusted publishing (recommended)

No long-lived secret, and npm records provenance for every release. On npmjs.com, open the
package → **Settings** → **Trusted Publisher** → **GitHub Actions** and fill in:

| Field                | Value                  |
| -------------------- | ---------------------- |
| Organization or user | `AlphaLiu`             |
| Repository           | `virtuoso-scroll-area` |
| Workflow filename    | `release.yml`          |
| Environment          | _(leave empty)_        |

Then make sure the `NPM_TOKEN` secret does **not** exist (or delete it) so the OIDC path is
taken. Trusted publishing needs npm CLI ≥ 11.5.1, which the workflow gets from Node 24.

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
3. Watch the four jobs. When the run is green, `virtuo-scroll-area@X.Y.Z` is on npm with
   provenance, a `vX.Y.Z` tag exists and a GitHub Release points at it.

Re-run a failed release with `bump: none` to publish the version that is already in
`package.json` (its tag must exist on `origin`).

Use `dry_run: true` to exercise the whole pipeline — including packing the tarball — without
touching npm or creating a release.

### Versioning rules

Keep `CHANGELOG.md` in sync with `package.json`: the tag, the changelog heading and the version
must agree, and CI additionally fails when the tag does not match `package.json`. Anything that
changes the published surface (`exports`, props, class names, `--vsa-*` variables) is at least a
minor bump while the package is `0.x`, and a breaking change once it is `1.x`.

## Publishing from your machine

Only needed for the first release or for an emergency, and it requires being logged in:

```bash
bun run verify        # the same gate CI runs
bun run publish:dry   # pack + print what npm would receive (runs the full verify first)
bun run publish:npm   # real publish; prepublishOnly re-runs `bun run verify`
```

`publish:npm` and `publish:dry` pass `--registry=https://registry.npmjs.org/` explicitly because
the default registry in a local `~/.npmrc` may be a read-only mirror. They do not add
`--provenance`: provenance attestations can only be generated inside a supported CI provider, and
the workflow is the supported path.

## Troubleshooting

| Symptom                                                                      | Cause                                                                                                                                         |
| ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `Tag vX.Y.Z does not match the package.json version`                         | The tag and `package.json` disagree; retag or run with `bump: none` after fixing the version.                                                 |
| `Tag vX.Y.Z is not on origin`                                                | `bump: none` with an unpushed tag, or a bump that failed to push.                                                                             |
| `403 ... you do not have permission` / trusted publisher mismatch            | The npm trusted-publisher config (org, repo, workflow filename) does not match this repository, or `NPM_TOKEN` is set while OIDC is expected. |
| `EPUBLISHCONFLICT` / `cannot publish over the previously published versions` | That version is already on npm — bump again; npm versions are immutable.                                                                      |
| `provenance` errors                                                          | The publish job must keep `id-token: write`, and `package.json` must keep the matching `repository` field.                                    |
| Verify job fails but the branch was green                                    | The tag points at a commit that no longer matches the branch, or `bun.lock` drifted from `package.json`.                                      |
| `Can't find 'action.yml' ... .github/actions/verify`                         | The tag predates the release automation. Both `.github/workflows/*` and `.github/actions/verify` must be present in the tagged commit.        |

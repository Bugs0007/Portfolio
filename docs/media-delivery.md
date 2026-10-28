# Original media delivery

The travel originals in `public/media/travel/originals/` use Git LFS so their
full-resolution bytes can be versioned without GitHub's regular Git file-size
limit. All application URLs stay the same. No video is resized, recompressed
or transcoded as part of checkout or deployment.

On a developer machine, install Git LFS and run `git lfs pull` after cloning.
The preferred Vercel setup is **Project Settings → Git → Git Large File
Storage**, enabled. Vercel then retrieves the objects before the build; changing
that setting requires a redeployment. See the
[official Git settings documentation](https://vercel.com/docs/project-configuration/git-settings).

`npm run build` also runs `scripts/ensure-lfs-media.mjs` through the `prebuild`
lifecycle. A normal, hydrated checkout returns immediately without network
requests. If a hosting checkout contains LFS pointer files instead of media,
the helper retrieves their objects from this public repository's
[Git LFS Batch API](https://github.com/git-lfs/git-lfs/blob/main/docs/api/batch.md).
It uses three download workers, streams each file to a temporary sibling,
verifies its complete byte length and SHA256, and atomically replaces the
pointer. No credentials or external project-setting changes are required.
Signed download URLs and response headers are never logged.

A failed download or integrity check stops the build, preserving the pointer
for a retry. This prevents publishing pointer text as a playable video. Custom
build commands should use `npm run build`, or run the helper before `next build`.

For isolated verification, import `hydrateLfsMedia` and supply a fixture root
containing `public/media/travel/originals/`, plus an optional `fetch` adapter:

```js
import { hydrateLfsMedia } from "./scripts/ensure-lfs-media.mjs";
await hydrateLfsMedia({ root: fixtureRoot, fetch: fixtureFetch });
```

Vercel's published 100 MB Hobby / 1 GB Pro source-upload limits describe CLI
uploads; they do not establish a per-file ceiling for Git builds. See
[Vercel limits](https://vercel.com/docs/limits). For a future move to dedicated
media storage, public [Vercel Blob](https://vercel.com/docs/vercel-blob) supports
large media directly, but it is not required by this checkout fallback.

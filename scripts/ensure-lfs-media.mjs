import { createHash, randomUUID } from "node:crypto";
import { createWriteStream } from "node:fs";
import { readdir, readFile, rename, rm, stat } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const MEDIA_DIRECTORY = "public/media/travel/originals";
const BATCH_URL = "https://github.com/Bugs0007/Portfolio.git/info/lfs/objects/batch";
const POINTER_VERSION = "version https://git-lfs.github.com/spec/v1";

async function findPointers(directory, root) {
  let entries;
  try { entries = await readdir(directory, { withFileTypes: true }); }
  catch (error) { if (error.code === "ENOENT") return []; throw error; }
  const pointers = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      pointers.push(...await findPointers(path, root));
    } else if (entry.isFile() && (await stat(path)).size <= 4096) {
      const text = await readFile(path, "utf8");
      if (!text.startsWith(POINTER_VERSION)) continue;
      const oid = /^oid sha256:([a-f0-9]{64})\r?$/m.exec(text)?.[1];
      const sizeText = /^size (\d+)\r?$/m.exec(text)?.[1];
      const size = Number(sizeText);
      if (!oid || !sizeText || !Number.isSafeInteger(size) || size < 0) {
        throw new Error(`Invalid Git LFS pointer: ${relative(root, path)}`);
      }
      pointers.push({ path, label: relative(root, path), oid, size });
    }
  }
  return pointers;
}

async function download(pointer, action, fetcher) {
  const temporary = `${pointer.path}.${randomUUID()}.lfs-download`;
  try {
    if (!action?.href || new URL(action.href).protocol !== "https:") {
      throw new Error("Missing HTTPS download action");
    }
    const response = await fetcher(action.href, {
      headers: action.header,
      signal: AbortSignal.timeout(15 * 60 * 1000),
    });
    if (!response.ok || !response.body) throw new Error("Media download failed");
    let bytes = 0;
    const hash = createHash("sha256");
    const verify = new Transform({
      transform(chunk, _encoding, next) {
        bytes += chunk.length;
        if (bytes > pointer.size) return next(new Error("Media exceeds expected size"));
        hash.update(chunk);
        next(null, chunk);
      },
    });
    await pipeline(Readable.fromWeb(response.body), verify, createWriteStream(temporary, { flags: "wx" }));
    if (bytes !== pointer.size || hash.digest("hex") !== pointer.oid) {
      throw new Error("Media integrity check failed");
    }
    // A complete, verified file replaces the pointer in one filesystem operation.
    await rename(temporary, pointer.path);
  } catch {
    // Signed object URLs and response headers must never enter build logs.
    throw new Error(`Could not restore original media: ${pointer.label}. Check Git LFS availability and retry.`);
  } finally {
    await rm(temporary, { force: true });
  }
}

/** No network requests are made when Git LFS has already hydrated the checkout. */
export async function hydrateLfsMedia({ root = PROJECT_ROOT, fetch: fetcher = globalThis.fetch, concurrency = 3 } = {}) {
  const directory = join(resolve(root), MEDIA_DIRECTORY);
  const pointers = await findPointers(directory, root);
  if (!pointers.length) return { hydrated: 0, bytes: 0 };
  console.log(`[media] Restoring ${pointers.length} original media files from Git LFS.`);

  const objects = [...new Map(pointers.map(({ oid, size }) => [oid, { oid, size }])).values()];
  let batch;
  try {
    const response = await fetcher(BATCH_URL, {
      method: "POST",
      headers: { Accept: "application/vnd.git-lfs+json", "Content-Type": "application/vnd.git-lfs+json" },
      body: JSON.stringify({ operation: "download", transfers: ["basic"], objects }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) throw new Error("Batch request failed");
    batch = await response.json();
    if (!Array.isArray(batch.objects)) throw new Error("Invalid batch response");
  } catch {
    throw new Error("Cannot fetch original media from Git LFS. Enable Git LFS in the hosting project's Git settings or retry when GitHub is reachable.");
  }
  const actions = new Map(batch.objects.map((object) => [object.oid, object.error ? null : object.actions?.download]));
  let cursor = 0;
  const workers = Array.from({ length: Math.min(pointers.length, Math.max(1, Math.min(3, Math.trunc(concurrency) || 3))) }, async () => {
    while (cursor < pointers.length) {
      const pointer = pointers[cursor++];
      await download(pointer, actions.get(pointer.oid), fetcher);
    }
  });
  const results = await Promise.allSettled(workers);
  const failure = results.find((result) => result.status === "rejected");
  if (failure) throw failure.reason;
  if ((await findPointers(directory, root)).length) throw new Error("Original media still contains Git LFS pointers; refusing to build.");
  const bytes = pointers.reduce((sum, pointer) => sum + pointer.size, 0);
  console.log(`[media] Verified ${pointers.length} original media files (${bytes.toLocaleString("en-US")} bytes).`);
  return { hydrated: pointers.length, bytes };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { await hydrateLfsMedia(); }
  catch (error) { console.error(`[media] ${error.message}`); process.exitCode = 1; }
}

import { readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";
import { fileURLToPath } from "node:url";

// The SVG is the editable source; generate crisp PNG-backed ICO sizes from it.
const source = await readFile(new URL("../public/brand/b-monogram.svg", import.meta.url));
const sizes = [16, 32, 48, 64, 256];
const images = await Promise.all(sizes.map((size) =>
  sharp(source, { density: 384 }).resize(size, size).png().toBuffer(),
));
const directory = Buffer.alloc(6 + 16 * sizes.length);
directory.writeUInt16LE(1, 2);
directory.writeUInt16LE(sizes.length, 4);
let offset = directory.length;
images.forEach((png, index) => {
  const start = 6 + index * 16;
  directory[start] = sizes[index] === 256 ? 0 : sizes[index];
  directory[start + 1] = directory[start];
  directory.writeUInt16LE(1, start + 4);
  directory.writeUInt16LE(32, start + 6);
  directory.writeUInt32LE(png.length, start + 8);
  directory.writeUInt32LE(offset, start + 12);
  offset += png.length;
});
await writeFile(new URL("../src/app/favicon.ico", import.meta.url), Buffer.concat([directory, ...images]));
await sharp(source, { density: 768 }).resize(512, 512).png().toFile(fileURLToPath(new URL("../src/app/icon.png", import.meta.url)));
console.log("Generated B monogram favicon at 16–512px.");

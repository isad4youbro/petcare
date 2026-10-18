/**
 * Server-side rendering (Node ≥ 20, no native deps): PNG icons for push notifications,
 * e-mails, OpenGraph previews, and sprite sheets for caching.
 */
import { deflateSync } from 'node:zlib';
import { renderFrame, getPoses, SIZE } from './index.js';

const CRC = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc32 = buf => { let c = 0xffffffff; for (const b of buf) c = CRC[(c ^ b) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]); const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
/** Encodes RGBA pixels as PNG */
export function encodePNG(width, height, rgba) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) { raw[y * (width * 4 + 1)] = 0; Buffer.from(rgba.buffer, rgba.byteOffset + y * width * 4, width * 4).copy(raw, y * (width * 4 + 1) + 1); }
  const ih = Buffer.alloc(13); ih.writeUInt32BE(width, 0); ih.writeUInt32BE(height, 4); ih[8] = 8; ih[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ih), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
function scaleUp(rgba, w, h, s, ox = 0, oy = 0, out, ow) {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = (y * w + x) * 4; if (!rgba[i + 3]) continue;
    for (let a = 0; a < s; a++) for (let b = 0; b < s; b++) { const j = ((oy + y * s + a) * ow + ox + x * s + b) * 4; out[j] = rgba[i]; out[j + 1] = rgba[i + 1]; out[j + 2] = rgba[i + 2]; out[j + 3] = rgba[i + 3]; } }
}
/** One frame as a PNG Buffer, upscaled with crisp pixels */
export function renderPNG(config, { pose = 'stand', frame = 0, scale = 4 } = {}) {
  const W = SIZE * scale, out = new Uint8ClampedArray(W * W * 4);
  scaleUp(renderFrame(config, pose, frame).rgba, SIZE, SIZE, scale, 0, 0, out, W);
  return encodePNG(W, W, out);
}
/** All frames of a pose side by side — usable as a CSS `steps()` animation sprite sheet */
export function renderSpriteSheet(config, { pose = 'walk', scale = 2 } = {}) {
  const P = getPoses(config)[pose], W = SIZE * scale * P.frames, H = SIZE * scale, out = new Uint8ClampedArray(W * H * 4);
  for (let f = 0; f < P.frames; f++) scaleUp(renderFrame(config, pose, f).rgba, SIZE, SIZE, scale, f * SIZE * scale, 0, out, W);
  return { png: encodePNG(W, H, out), frames: P.frames, fps: P.fps, frameWidth: SIZE * scale, frameHeight: H };
}
export * from './index.js';

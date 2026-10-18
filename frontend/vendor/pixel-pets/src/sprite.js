/**
 * PetSprite — animates a config on a <canvas>. Framework-agnostic.
 * One shared requestAnimationFrame loop for all sprites; off-screen sprites are paused
 * (IntersectionObserver) and `prefers-reduced-motion` freezes on the first frame.
 *
 *   const s = new PetSprite(canvas, config, { pose: 'walk' });
 *   s.setConfig(newConfig); s.setPose('sleep'); s.destroy();
 */
import { renderFrame, getPoses, SIZE } from './index.js';

const live = new Set();
let raf = 0;
const now = () => performance.now() / 1000;
function loop() { const t = now(); for (const s of live) s._tick(t); raf = live.size ? requestAnimationFrame(loop) : 0; }
const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export class PetSprite {
  constructor(canvas, config, { pose = 'stand', paused = false, highlight = [44, 232, 245] } = {}) {
    this.canvas = canvas; canvas.width = SIZE; canvas.height = SIZE;
    canvas.style.imageRendering = 'pixelated';
    this.ctx = canvas.getContext('2d'); this.img = this.ctx.createImageData(SIZE, SIZE);
    this.config = config; this.pose = pose; this.paused = paused; this.visible = true; this.last = '';
    this.phase = Math.random() * 3; this.flash = null; this.hl = highlight;
    if (typeof IntersectionObserver === 'function') {
      this.io = new IntersectionObserver(es => { this.visible = es[0].isIntersecting; });
      this.io.observe(canvas);
    }
    live.add(this); if (!raf && typeof requestAnimationFrame === 'function') raf = requestAnimationFrame(loop);
    this.draw(0);
  }
  setConfig(config, { flash = false } = {}) {
    if (flash && this.config) this.flash = { from: this.config, until: now() + 1.5 };
    this.config = config; this.last = '';
  }
  setPose(pose) { this.pose = pose; this.last = ''; }
  pause() { this.paused = true; }
  play() { this.paused = false; }
  /** Draws a specific frame (also handy for screenshots / tests) */
  draw(frame, pose = this.pose) {
    const out = renderFrame(this.config, pose, frame).rgba;
    if (this.flash && now() < this.flash.until && Math.floor(now() * 7) % 2 === 0) {
      const before = renderFrame(this.flash.from, pose, frame).rgba;
      for (let i = 0; i < out.length; i += 4) if (out[i] !== before[i] || out[i + 1] !== before[i + 1] || out[i + 2] !== before[i + 2] || out[i + 3] !== before[i + 3]) {
        if (!out[i + 3]) { out[i] = this.hl[0]; out[i + 1] = this.hl[1]; out[i + 2] = this.hl[2]; out[i + 3] = 200; }
        else for (let c = 0; c < 3; c++) out[i + c] = Math.round(out[i + c] * 0.35 + this.hl[c] * 0.65);
      }
    }
    this.img.data.set(out); this.ctx.putImageData(this.img, 0, 0);
  }
  _tick(t) {
    if (this.paused || !this.visible || !this.canvas.isConnected) return;
    const flashing = this.flash && t < this.flash.until;
    const pose = flashing ? 'stand' : this.pose, P = getPoses(this.config)[pose];
    const f = flashing || reducedMotion() ? 0 : Math.floor((t + this.phase) * P.fps) % P.frames;
    const key = pose + f + (flashing ? 'F' + (Math.floor(t * 7) % 2) : '');
    if (key !== this.last) { this.last = key; this.draw(f, pose); }
  }
  destroy() { live.delete(this); if (this.io) this.io.disconnect(); }
}

/** Renders a frame to a PNG data URL in the browser (e.g. for Notification icons) */
export function toDataURL(config, { pose = 'stand', frame = 0, scale = 4 } = {}) {
  const c = document.createElement('canvas'); c.width = SIZE * scale; c.height = SIZE * scale;
  const src = document.createElement('canvas'); src.width = SIZE; src.height = SIZE;
  const sctx = src.getContext('2d'), img = sctx.createImageData(SIZE, SIZE);
  img.data.set(renderFrame(config, pose, frame).rgba); sctx.putImageData(img, 0, 0);
  const ctx = c.getContext('2d'); ctx.imageSmoothingEnabled = false; ctx.drawImage(src, 0, 0, c.width, c.height);
  return c.toDataURL('image/png');
}

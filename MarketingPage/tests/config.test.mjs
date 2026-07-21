import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('public configuration has safe defaults without loading an example env', () => {
  const config = fs.readFileSync(new URL('../src/config/site.ts', import.meta.url), 'utf8');
  assert.match(config, /env\.PUBLIC_CTA_MODE \|\| 'WAITLIST'/);
  assert.match(config, /env\.PUBLIC_CHROME_EXTENSION_AVAILABLE === 'true'/);
});

test('landing page has no placeholder links', () => {
  const page = fs.readFileSync(new URL('../src/pages/index.astro', import.meta.url), 'utf8');
  assert.doesNotMatch(page, /href=["']#["']/);
});

test('landing page uses real product screenshots and keeps the hero uncluttered', () => {
  const page = fs.readFileSync(new URL('../src/pages/index.astro', import.meta.url), 'utf8');
  assert.match(page, /screenshots\/repertorio\.png/);
  assert.match(page, /screenshots\/drum-machine\.png/);
  assert.match(page, /screenshots\/footswitch\.png/);
  assert.doesNotMatch(page, /orbit-note|scroll-cue/);
});

test('dark product and live sections use the full-width treatment', () => {
  const page = fs.readFileSync(new URL('../src/pages/index.astro', import.meta.url), 'utf8');
  const styles = fs.readFileSync(new URL('../src/styles/global.css', import.meta.url), 'utf8');
  assert.match(page, /class="product section-shell dark-section"/);
  assert.match(page, /class="live section-shell dark-section"/);
  assert.match(styles, /\.dark-section\s*\{[^}]*margin-inline:\s*0;[^}]*border-radius:\s*0;/s);
});

test('landing page includes additional Three.js scenes and parallax layers', () => {
  const page = fs.readFileSync(new URL('../src/pages/index.astro', import.meta.url), 'utf8');
  const layout = fs.readFileSync(new URL('../src/layouts/BaseLayout.astro', import.meta.url), 'utf8');
  assert.match(page, /AmbientScene client:visible variant="product"/);
  assert.match(page, /AmbientScene client:visible variant="flow"/);
  assert.match(page, /AmbientScene client:visible variant="lab"/);
  assert.match(page, /AmbientScene client:visible variant="live"/);
  assert.match(page, /data-parallax-speed=/);
  assert.match(layout, /--parallax-shift/);
});

test('three-movement supporting copy is right aligned on desktop', () => {
  const page = fs.readFileSync(new URL('../src/pages/index.astro', import.meta.url), 'utf8');
  const styles = fs.readFileSync(new URL('../src/styles/global.css', import.meta.url), 'utf8');
  assert.match(page, /class="flow-kicker">O caminho inteiro cabe em três movimentos\.<\/p>/);
  assert.match(styles, /\.section-heading\.split > \.flow-kicker\s*\{[^}]*text-align:\s*right;/s);
});

test('mobile experience replaces long stacks with accessible carousels', () => {
  const page = fs.readFileSync(new URL('../src/pages/index.astro', import.meta.url), 'utf8');
  const controls = fs.readFileSync(new URL('../src/components/MobileCarouselControls.astro', import.meta.url), 'utf8');
  const layout = fs.readFileSync(new URL('../src/layouts/BaseLayout.astro', import.meta.url), 'utf8');
  assert.match(page, /id="product-carousel"[^>]*data-mobile-carousel/);
  assert.match(page, /id="tools-carousel"[^>]*data-mobile-carousel/);
  assert.match(page, /id="audience-carousel"[^>]*data-mobile-carousel/);
  assert.match(controls, /aria-label={`Ver item anterior/);
  assert.match(controls, /aria-label={`Ver próximo item/);
  assert.match(layout, /data-carousel-status/);
});

test('mobile motion removes secondary Three.js and parallax layers', () => {
  const styles = fs.readFileSync(new URL('../src/styles/global.css', import.meta.url), 'utf8');
  const mobileStyles = styles.slice(styles.indexOf('@media (max-width: 640px)'));
  assert.match(mobileStyles, /\.parallax-backdrop, \.three-accent\s*\{\s*display:\s*none;/);
  assert.match(mobileStyles, /\[data-mobile-carousel\][^{]*\{[^}]*scroll-snap-type:\s*x mandatory;/s);
});

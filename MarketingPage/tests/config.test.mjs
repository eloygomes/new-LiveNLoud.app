import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('public configuration documents safe defaults', () => {
  const example = fs.readFileSync(new URL('../.env.example', import.meta.url), 'utf8');
  assert.match(example, /PUBLIC_CTA_MODE=WAITLIST/);
  assert.match(example, /PUBLIC_CHROME_EXTENSION_AVAILABLE=false/);
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

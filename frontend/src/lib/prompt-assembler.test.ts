// Run with: npx tsx src/lib/prompt-assembler.test.ts
import assert from 'node:assert/strict';
import {
  assembleImage, assembleVideo, assembleMusic, assembleSpeech, assembleSfx,
  DEFAULT_IMAGE_STATE, DEFAULT_VIDEO_STATE, DEFAULT_MUSIC_STATE,
  DEFAULT_SPEECH_STATE, DEFAULT_SFX_STATE,
} from './prompt-assembler.js';

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try { fn(); console.log(`  ✓ ${name}`); passed++; }
  catch (e) { console.error(`  ✗ ${name}:`, e instanceof Error ? e.message : e); failed++; }
}

console.log('\nPrompt Assembler Tests\n');

// ── Image ──────────────────────────────────────────────────────────────────
console.log('Image:');

test('assembleImage returns non-empty prompt for default state + subject', () => {
  const out = assembleImage({ ...DEFAULT_IMAGE_STATE, subject: 'a red fox' });
  assert.ok(out.prompt.includes('red fox'), `prompt should include subject, got: "${out.prompt}"`);
});

test('assembleImage includes style when set', () => {
  const out = assembleImage({ ...DEFAULT_IMAGE_STATE, subject: 'fox', style: 'Cinematic' });
  assert.ok(out.prompt.includes('cinematic'), `got: "${out.prompt}"`);
});

test('assembleImage includes composition prefix', () => {
  const out = assembleImage({ ...DEFAULT_IMAGE_STATE, subject: 'fox', composition: 'Close-up' });
  assert.ok(out.prompt.startsWith('close-up'), `got: "${out.prompt}"`);
});

test('assembleImage width/height default to 1:1 = 1024x1024', () => {
  const out = assembleImage({ ...DEFAULT_IMAGE_STATE, subject: 'x', aspectRatio: '1:1', width: 1024, height: 1024 });
  assert.equal(out.params.width, 1024);
  assert.equal(out.params.height, 1024);
});

test('assembleImage 16:9 sets correct dims', () => {
  const out = assembleImage({ ...DEFAULT_IMAGE_STATE, subject: 'x', aspectRatio: '16:9', width: 1344, height: 768 });
  assert.equal(out.params.width, 1344);
  assert.equal(out.params.height, 768);
});

test('assembleImage seed null → no seed in params', () => {
  const out = assembleImage({ ...DEFAULT_IMAGE_STATE, subject: 'x', seed: null });
  assert.equal(out.params.seed, undefined);
});

test('assembleImage seed number → included in params', () => {
  const out = assembleImage({ ...DEFAULT_IMAGE_STATE, subject: 'x', seed: 42 });
  assert.equal(out.params.seed, 42);
});

test('assembleImage negativePrompt forwarded', () => {
  const out = assembleImage({ ...DEFAULT_IMAGE_STATE, subject: 'x', negativePrompt: 'blurry' });
  assert.equal(out.negativePrompt, 'blurry');
});

// ── Video ──────────────────────────────────────────────────────────────────
console.log('\nVideo:');

test('assembleVideo includes sceneDescription', () => {
  const out = assembleVideo({ ...DEFAULT_VIDEO_STATE, sceneDescription: 'mountain landscape' });
  assert.ok(out.prompt.includes('mountain landscape'));
});

test('assembleVideo static camera not prepended', () => {
  const out = assembleVideo({ ...DEFAULT_VIDEO_STATE, sceneDescription: 'forest', cameraMovement: 'static' });
  assert.ok(!out.prompt.startsWith('static'), `should not start with 'static', got: "${out.prompt}"`);
});

test('assembleVideo dolly camera prepended', () => {
  const out = assembleVideo({ ...DEFAULT_VIDEO_STATE, sceneDescription: 'forest', cameraMovement: 'Dolly' });
  assert.ok(out.prompt.startsWith('dolly'), `got: "${out.prompt}"`);
});

test('assembleVideo loop in params when true', () => {
  const out = assembleVideo({ ...DEFAULT_VIDEO_STATE, sceneDescription: 'x', loop: true });
  assert.equal(out.params.loop, true);
});

test('assembleVideo loop not in params when false', () => {
  const out = assembleVideo({ ...DEFAULT_VIDEO_STATE, sceneDescription: 'x', loop: false });
  assert.equal(out.params.loop, undefined);
});

// ── Music ──────────────────────────────────────────────────────────────────
console.log('\nMusic:');

test('assembleMusic includes description', () => {
  const out = assembleMusic({ ...DEFAULT_MUSIC_STATE, description: 'upbeat summer pop' });
  assert.ok(out.prompt.includes('upbeat summer pop'));
});

test('assembleMusic includes genres', () => {
  const out = assembleMusic({ ...DEFAULT_MUSIC_STATE, genres: ['Pop', 'EDM'] });
  assert.ok(out.prompt.includes('Pop/EDM'));
});

test('assembleMusic instrumental when vocals=instrumental', () => {
  const out = assembleMusic({ ...DEFAULT_MUSIC_STATE, vocals: 'instrumental' });
  assert.ok(out.prompt.includes('instrumental'));
});

test('assembleMusic custom lyrics in params', () => {
  const out = assembleMusic({ ...DEFAULT_MUSIC_STATE, lyricsMode: 'custom', lyrics: 'la la la' });
  assert.equal(out.params.lyrics, 'la la la');
});

test('assembleMusic no lyrics in params when mode=auto', () => {
  const out = assembleMusic({ ...DEFAULT_MUSIC_STATE, lyricsMode: 'auto', lyrics: 'la la la' });
  assert.equal(out.params.lyrics, undefined);
});

// ── Speech ──────────────────────────────────────────────────────────────────
console.log('\nSpeech:');

test('assembleSpeech uses text as prompt', () => {
  const out = assembleSpeech({ ...DEFAULT_SPEECH_STATE, text: 'Hello world' });
  assert.equal(out.prompt, 'Hello world');
});

test('assembleSpeech speed in params', () => {
  const out = assembleSpeech({ ...DEFAULT_SPEECH_STATE, text: 'hi', speed: 1.5 });
  assert.equal(out.params.speed, 1.5);
});

test('assembleSpeech zero pitch not in params', () => {
  const out = assembleSpeech({ ...DEFAULT_SPEECH_STATE, text: 'hi', pitch: 0 });
  assert.equal(out.params.pitch, undefined);
});

// ── SFX ────────────────────────────────────────────────────────────────────
console.log('\nSFX:');

test('assembleSfx uses description as prompt', () => {
  const out = assembleSfx({ ...DEFAULT_SFX_STATE, description: 'thunder crack' });
  assert.equal(out.prompt, 'thunder crack');
});

test('assembleSfx duration in params', () => {
  const out = assembleSfx({ ...DEFAULT_SFX_STATE, description: 'x', duration: 10 });
  assert.equal(out.params.duration, 10);
});

// ── Summary ────────────────────────────────────────────────────────────────
console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);

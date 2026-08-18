import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');

test('mission 2 hides both port values behind four question marks', () => {
  assert.match(app, /placeholder="\?\?\?\?" aria-label="Port de l'ordinateur"/);
  assert.match(app, /placeholder="\?\?\?\?" aria-label="Port du conteneur"/);
  assert.match(app, /mapping-preview">\?\?\?\?:\?\?\?\?</);
});

test('game has a reusable answer feedback dialog', () => {
  assert.match(html, /id="answer-dialog"/);
  assert.match(html, /id="answer-dialog-title"/);
  assert.match(html, /id="answer-dialog-text"/);
  assert.match(app, /function showAnswerDialog/);
  assert.match(app, /registerWrongAttempt/);
});

test('light theme is the default for daytime readability', () => {
  assert.match(css, /color-scheme:\s*light/);
  assert.match(css, /--bg:\s*#f[0-9a-f]{5}/i);
  assert.match(css, /--text:\s*#[0-4][0-9a-f]{5}/i);
});

test('correct answers explain why before moving on', () => {
  assert.match(app, /Bonne réponse/);
  assert.match(app, /Pourquoi c’est correct/);
});

test('wrong answers explicitly show the minus two point penalty', () => {
  assert.match(app, /-2 points/);
});

test('UV hint text stays readable on the dark UV overlay', () => {
  assert.match(css, /\.uv-content p\s*\{[^}]*color:\s*#f4f1ff/i);
  assert.match(css, /\.uv-content > span\s*\{[^}]*color:\s*#c9bcff/i);
});

test('terminal command input uses high contrast text on dark background', () => {
  assert.match(css, /\.terminal-command input\s*\{[^}]*color:\s*#d9f7e8/i);
  assert.match(css, /\.terminal-command input::placeholder\s*\{[^}]*color:\s*#7f9aaa/i);
});

test('light code blocks use dark readable text', () => {
  assert.match(css, /\.inline-code\s*\{[^}]*color:\s*#18354b/i);
});

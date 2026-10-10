import { expect, test } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('v1 HTML contains checkout-btn and cart-actions', () => {
  const htmlPath = path.resolve(__dirname, '../public/v1/index.html');
  const html = fs.readFileSync(htmlPath, 'utf8');
  expect(html).toContain('id="checkout-btn"');
  expect(html).toContain('class="cart-actions"');
});

test('v2 HTML contains place-order-btn and order-summary', () => {
  const htmlPath = path.resolve(__dirname, '../public/v2/index.html');
  const html = fs.readFileSync(htmlPath, 'utf8');
  expect(html).toContain('id="place-order-btn"');
  expect(html).toContain('class="order-summary"');
});

test('v2 HTML does not contain checkout-btn', () => {
  const htmlPath = path.resolve(__dirname, '../public/v2/index.html');
  const html = fs.readFileSync(htmlPath, 'utf8');
  expect(html).not.toContain('id="checkout-btn"');
});

test('both HTML files contain store name TechMart', () => {
  const v1Path = path.resolve(__dirname, '../public/v1/index.html');
  const v2Path = path.resolve(__dirname, '../public/v2/index.html');
  const v1Html = fs.readFileSync(v1Path, 'utf8');
  const v2Html = fs.readFileSync(v2Path, 'utf8');
  
  expect(v1Html).toContain('TechMart');
  expect(v2Html).toContain('TechMart');
});

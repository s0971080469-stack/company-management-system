import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { transformSync } from 'esbuild';

// Render the actual shared component, not a duplicate of its implementation.
const source = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const component = source.slice(source.indexOf('function StatCard('), source.indexOf('function StatusBadge('));
const { code } = transformSync(component, { loader: 'jsx', jsx: 'transform' });
const theme = new Proxy({}, { get: () => '#123456' });
const StatCard = new Function('React', 'THEME', 'FONT_NUM', `${code}; return StatCard;`)(React, theme, 'monospace');
const icon = () => React.createElement('svg');

test('all statistics card tones render, including payroll hold and fallback', () => {
  for (const tone of ['brass', 'success', 'danger', 'warn', 'ink', 'hold', 'payrollPeople', 'payrollTotal', 'payrollPaid', 'unknown']) {
    const html = renderToStaticMarkup(React.createElement(StatCard, {
      label: '暫時不發金額', value: 'NT$ 95,355', icon, tone,
    }));
    assert.ok(html.includes('NT$ 95,355'));
    if (tone === 'hold') {
      assert.ok(html.includes('#FAF8FC'));
      assert.ok(html.includes('#DDD3E6'));
    }
  }
});

test('payroll cards have distinct tinted backgrounds without changing other cards', () => {
  for (const [tone, color] of Object.entries({ payrollPeople: '#F4F7FB', payrollTotal: '#FCF9F0', payrollPaid: '#F3F9F5', hold: '#FAF8FC', brass: '#123456' })) {
    const html = renderToStaticMarkup(React.createElement(StatCard, { label: '統計', value: 0, tone }));
    assert.ok(html.startsWith(`<div style="background:${color};`));
  }
});

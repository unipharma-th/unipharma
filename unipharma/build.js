// build.js — Pre-compile JSX so iPad / mobile don't need babel-standalone.
//
// Concatenates plain JS files + JSX files (in the exact order index.html
// loaded them) into a single bundle, then runs esbuild to transform JSX
// and minify. The output is unipharma/app.bundle.js — one HTTP request,
// no in-browser Babel.
//
// Run locally:  node build.js
// On Vercel:    triggered by package.json "build" via vercel.json buildCommand.

const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const SRC = path.join(__dirname, 'unipharma');
const OUT = path.join(SRC, 'app.bundle.js');

// MUST match the load order from index.html. Plain JS first (set up window
// globals + DB + UTILS), then JSX components, then app.jsx last (mounts root).
const FILES = [
  'config.js',
  'data.js',
  'utils.js',
  'db.js',
  'auth.jsx',
  'components.jsx',
  'Dashboard.jsx',
  'Drugs.jsx',
  'Orders.jsx',
  'CreatePO.jsx',
  'PODocument.jsx',
  'Suppliers.jsx',
  'Comparison.jsx',
  'Stock.jsx',
  'OutOfStock.jsx',
  'Reports.jsx',
  'Help.jsx',
  'DataSync.jsx',
  'tweaks-panel.jsx',
  'CategoryManager.jsx',
  'app.jsx',
];

// One `const { ... } = React` at the very top instead of one per file —
// otherwise concatenation creates duplicate top-level `const` declarations
// and the bundle fails to parse.
const banner = '// UNIPHARMA — bundled ' + new Date().toISOString() + '\n'
  + 'const { useState, useEffect, useMemo, useRef, useCallback } = React;\n';

// Strip per-file React-hook destructuring lines like:
//   const { useState, useMemo } = React;
const REACT_HOOKS_LINE = /^\s*const\s*\{[^}]*\}\s*=\s*React\s*;\s*$/gm;

const parts = [banner];
for (const f of FILES) {
  const p = path.join(SRC, f);
  if (!fs.existsSync(p)) {
    console.error('Missing source file:', f);
    process.exit(1);
  }
  parts.push('\n/* ===== ' + f + ' ===== */\n');
  parts.push(fs.readFileSync(p, 'utf8').replace(REACT_HOOKS_LINE, ''));
}
const combined = parts.join('\n');

esbuild.transform(combined, {
  loader: 'jsx',
  jsx: 'transform',
  target: ['es2018', 'safari13'],
  minify: true,
  legalComments: 'none',
}).then(result => {
  fs.writeFileSync(OUT, result.code);
  const kb = (result.code.length / 1024).toFixed(1);
  console.log('✓ Bundled ' + FILES.length + ' files → ' + path.relative(__dirname, OUT) + ' (' + kb + ' KB)');
  if (result.warnings && result.warnings.length) {
    console.warn('Warnings:', result.warnings);
  }
}).catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});

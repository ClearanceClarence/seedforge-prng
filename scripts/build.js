/**
 * SeedForge build script
 *
 * Generates the published files from src/seedforge.js:
 *   dist/seedforge.js    UMD bundle (CommonJS, AMD, browser global)
 *   dist/seedforge.mjs   ES module with named exports
 *   types/seedforge.d.mts  Type definitions for the ES module entry
 *
 * Usage: node scripts/build.js
 */

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const srcPath = path.join(root, 'src', 'seedforge.js');
const distDir = path.join(root, 'dist');
const typesDir = path.join(root, 'types');

// Normalize line endings so the build gives the same output on Windows
// (where Git may check files out with CRLF) as on macOS and Linux
const source = fs.readFileSync(srcPath, 'utf8').replace(/\r\n/g, '\n');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

// The version in the source must match package.json
if (!source.includes(`version: '${pkg.version}'`) || !source.includes(`@version ${pkg.version}`)) {
    throw new Error(`src/seedforge.js does not declare version ${pkg.version}; update it before building`);
}

fs.mkdirSync(distDir, { recursive: true });

// 1. UMD bundle: the source file as written
fs.writeFileSync(path.join(distDir, 'seedforge.js'), source);

// 2. ES module: swap the UMD wrapper for export statements
const WRAPPER_START = "(function(global) {\n    'use strict';\n";
const WRAPPER_END_MARKER = '    // Export for different module systems';

const startIndex = source.indexOf(WRAPPER_START);
const endIndex = source.indexOf(WRAPPER_END_MARKER);
if (startIndex === -1 || endIndex === -1) {
    throw new Error('Could not find the UMD wrapper in src/seedforge.js');
}

const header = source.slice(0, startIndex);
const body = source.slice(startIndex + WRAPPER_START.length, endIndex);

const esm = header + body.replace(/\s+$/, '') + `

    const { Algorithms, Noise, Utils } = PRNG_Library;
    const version = PRNG_Library.version;
    const create = PRNG_Library.create.bind(PRNG_Library);
    const seed = PRNG_Library.seed.bind(PRNG_Library);
    const random = PRNG_Library.random.bind(PRNG_Library);

export { PRNG, Algorithms, Noise, Utils, version, create, seed, random };
export default PRNG_Library;
`;

fs.writeFileSync(path.join(distDir, 'seedforge.mjs'), esm);

// 3. Types for the ES module entry
const types = fs.readFileSync(path.join(typesDir, 'seedforge.d.ts'), 'utf8').replace(/\r\n/g, '\n');
fs.writeFileSync(path.join(typesDir, 'seedforge.d.mts'), types);

console.log(`Built SeedForge ${pkg.version}`);
for (const file of ['dist/seedforge.js', 'dist/seedforge.mjs', 'types/seedforge.d.mts']) {
    const size = fs.statSync(path.join(root, file)).size;
    console.log(`  ${file.padEnd(24)} ${(size / 1024).toFixed(1)} kB`);
}

/**
 * SeedForge - ES Module Test
 * Checks that the package can be imported as an ES module and that the
 * ESM build behaves exactly like the CommonJS build.
 * Run with: node test/esm.test.mjs
 */

import { createRequire } from 'module';
import SeedForge, { PRNG, Noise, Algorithms, Utils, create, seed, random, version } from '../dist/seedforge.mjs';

const require = createRequire(import.meta.url);
const cjs = require('../dist/seedforge.js');
const pkg = require('../package.json');

let passed = 0;
let failed = 0;

function assert(condition, message) {
    if (condition) {
        console.log(`  ✅ ${message}`);
        passed++;
    } else {
        console.log(`  ❌ ${message}`);
        failed++;
    }
}

console.log(`\n${'='.repeat(50)}`);
console.log('  ES Module Build');
console.log('='.repeat(50));

assert(typeof PRNG === 'function', 'named export PRNG');
assert(typeof Noise.SimplexNoise === 'function' && Object.keys(Noise).length === 6, 'named export Noise with 6 generators');
assert(typeof Algorithms.SFC32 === 'function' && Object.keys(Algorithms).length === 6, 'named export Algorithms with 6 generators');
assert(typeof Utils.cyrb128 === 'function', 'named export Utils');
assert(version === pkg.version, `named export version is ${pkg.version}`);
assert(SeedForge.PRNG === PRNG && SeedForge.Noise === Noise, 'default export exposes the same classes');

assert(create('esm', 'sfc32') instanceof PRNG, 'create() works as a standalone function');
assert(seed('global-seed') === SeedForge && typeof random() === 'number', 'seed() and random() work as standalone functions');
seed('repeat');
const first = random();
seed('repeat');
assert(random() === first, 'the global generator is reproducible');

// The two builds must produce identical output
const sameKeys = JSON.stringify(Object.keys(SeedForge).sort()) === JSON.stringify(Object.keys(cjs).sort());
assert(sameKeys, 'ESM and CommonJS builds expose the same API');

let identical = true;
for (const algorithm of ['mulberry32', 'xoshiro128', 'xorshift128', 'pcg32', 'sfc32', 'lcg']) {
    const a = new PRNG('parity', algorithm);
    const b = new cjs.PRNG('parity', algorithm);
    for (let i = 0; i < 200; i++) {
        if (a.random() !== b.random() || a.normal(5, 2) !== b.normal(5, 2) || a.poisson(1200) !== b.poisson(1200)) {
            identical = false;
        }
    }
}
assert(identical, 'ESM and CommonJS builds generate identical numbers');

const esmNoise = new Noise.WorleyNoise('parity');
const cjsNoise = new cjs.Noise.WorleyNoise('parity');
assert(esmNoise.noise2D(1.5, 2.3) === cjsNoise.noise2D(1.5, 2.3), 'ESM and CommonJS builds generate identical noise');

console.log(`\n${'='.repeat(50)}`);
console.log(`  SUMMARY: ${passed} passed, ${failed} failed`);
console.log('='.repeat(50));

process.exit(failed > 0 ? 1 : 0);

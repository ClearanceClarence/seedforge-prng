# Changelog

All notable changes to SeedForge are documented here. The project follows [Semantic Versioning](https://semver.org/).

## 1.1.1

A bug-fix release. Output for a given seed is unchanged, except for `pcg32` (see "Changed").

### Fixed

- **ES module imports.** `import { PRNG } from 'seedforge-prng'` failed in Node.js with "Named export not found" because only a CommonJS bundle was published. The package now ships a real ES module build at `dist/seedforge.mjs`, plus an `exports` map so Node.js, bundlers and TypeScript each pick the right file. The ES module also loads directly in the browser with `<script type="module">`.
- **`poisson()` for large `lambda`.** Values were capped near 709 once `lambda` passed roughly 700, because `Math.exp(-lambda)` underflows to zero. `lambda` of 500 and above now uses Hörmann's transformed rejection method, which is accurate for any `lambda` and runs in constant time. Results for `lambda` below 500 are bit-for-bit identical to 1.1.0.
- **`pcg32` output.** The 64-bit arithmetic lost precision, which skewed `random()` heavily toward small values. The generator now matches the PCG reference implementation and is verified against its published test vectors.
- **Unseeded generators.** `new PRNG()` used `Date.now()` as the seed, so generators created in the same millisecond produced the same sequence. Each unseeded generator (and noise generator) now gets a unique seed.
- **`geometric(1)`** returned 0. It now returns 1, and `geometric()` can no longer return 0 for any `p`.
- **`vonMises()`** could return values below -π when `mu` was negative. Results are now always in [-π, π).
- **Silent failures on bad input.** Calls such as `int(5, 1)`, `pick([])`, `normal(0, -1)`, `sample([1, 2], 5)` and `weightedPick(items, [0, 0])` returned `NaN`, `undefined` or a wrong value. They now throw a `TypeError` (wrong type, `NaN`, infinite) or a `RangeError` (out of range) with a message naming the method and the argument. A rejected call does not advance the generator.
- **Documentation.** Removed `angle()` and `angleDeg()`, which were documented but never existed, and corrected the signatures of `pointInRect()`, `colorHSL()`, `fork()` and `shuffle()`. The `vonMises()` range is now documented correctly.

### Changed

- **`pcg32` sequences differ from 1.1.0.** This is unavoidable: the old output was not uniformly distributed. Saved `pcg32` states still load, but continue with corrected numbers. The other five algorithms produce exactly the same sequences as before.
- **Errors instead of silent results.** Code that relied on the old behavior for invalid input (for example `pick([])` returning `undefined`) now receives an error.
- **Node.js 14 or newer** is declared in `engines`. The code already used syntax that Node.js 12 cannot run.

### Added

- `version` export (`require('seedforge-prng').version`).
- `npm run build`, which generates `dist/seedforge.js`, `dist/seedforge.mjs` and `types/seedforge.d.mts` from `src/seedforge.js`.
- Tests for statistical correctness (every distribution against its theoretical mean and variance), input validation, output stability across versions, and the ES module build. The suite grew from 39 to 156 checks.

## 1.1.0

### Added

- Six statistical distributions: `geometric`, `zipf`, `chiSquared`, `studentT`, `vonMises`, `hypergeometric`.
- Four noise generators: `PerlinNoise`, `WorleyNoise`, `RidgedNoise`, `BillowedNoise`.
- Noise features: `turbulence()`, `warp()`, `warp2()`.
- Browser test suite with interactive demos, distribution histograms and a noise gallery.

## 1.0.0

- Initial release: 6 PRNG algorithms, 11 statistical distributions, Value and Simplex noise with fBm, state management, TypeScript definitions.

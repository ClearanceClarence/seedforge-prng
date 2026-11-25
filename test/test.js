/**
 * SeedForge - Node.js Test Suite
 * Run with: node test/test.js
 */

const SeedForge = require('../dist/seedforge.js');
const { PRNG, Noise, Algorithms } = SeedForge;

// Test utilities
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

function section(title) {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`  ${title}`);
    console.log('='.repeat(50));
}

// ============================================================
// TESTS
// ============================================================

section('Basic Generation');

const rng = new PRNG('test-seed', 'xoshiro128');

// Range tests
let inRange = true;
for (let i = 0; i < 1000; i++) {
    const v = rng.random();
    if (v < 0 || v >= 1) inRange = false;
}
assert(inRange, 'random() in [0, 1)');

rng.reset();
let intRange = true;
for (let i = 0; i < 1000; i++) {
    const v = rng.int(5, 15);
    if (v < 5 || v > 15 || !Number.isInteger(v)) intRange = false;
}
assert(intRange, 'int(5, 15) in [5, 15]');

section('Reproducibility');

const rng1 = new PRNG('same-seed', 'sfc32');
const rng2 = new PRNG('same-seed', 'sfc32');

const seq1 = Array.from({ length: 10 }, () => rng1.random());
const seq2 = Array.from({ length: 10 }, () => rng2.random());
assert(seq1.every((v, i) => v === seq2[i]), 'Same seed = same sequence');

rng1.reset();
const seq3 = Array.from({ length: 10 }, () => rng1.random());
assert(seq1.every((v, i) => v === seq3[i]), 'reset() works');

section('State Management');

const rngState = new PRNG('state-test', 'pcg32');
for (let i = 0; i < 50; i++) rngState.random();

const saved = rngState.getState();
const expected = Array.from({ length: 10 }, () => rngState.random());

rngState.setState(saved);
const restored = Array.from({ length: 10 }, () => rngState.random());
assert(expected.every((v, i) => v === restored[i]), 'setState() restores position');

const cloned = rngState.clone();
const origSeq = Array.from({ length: 10 }, () => rngState.random());
const cloneSeq = Array.from({ length: 10 }, () => cloned.random());
assert(cloneSeq.every((v, i) => v === origSeq[i]), 'clone() works');

section('Distributions');

const distRng = new PRNG('dist-test');

// Normal distribution
const normals = Array.from({ length: 10000 }, () => distRng.normal(100, 15));
const mean = normals.reduce((a, b) => a + b) / normals.length;
const stdDev = Math.sqrt(normals.reduce((a, b) => a + (b - mean) ** 2, 0) / normals.length);
assert(Math.abs(mean - 100) < 1, `normal() mean: ${mean.toFixed(2)} (expected ~100)`);
assert(Math.abs(stdDev - 15) < 1, `normal() stdDev: ${stdDev.toFixed(2)} (expected ~15)`);

// Exponential
const exps = Array.from({ length: 10000 }, () => distRng.exponential(0.5));
const expMean = exps.reduce((a, b) => a + b) / exps.length;
assert(Math.abs(expMean - 2) < 0.1, `exponential(0.5) mean: ${expMean.toFixed(2)} (expected ~2)`);

section('Array Utilities');

const arrRng = new PRNG('array-test');
const original = [1, 2, 3, 4, 5];
const shuffled = arrRng.shuffled(original);
assert(original.join(',') === '1,2,3,4,5', 'shuffled() preserves original');
assert(shuffled.sort((a,b) => a-b).join(',') === '1,2,3,4,5', 'shuffled() has same elements');

const items = ['a', 'b', 'c', 'd', 'e'];
const picked = arrRng.pick(items);
assert(items.includes(picked), `pick() returns valid item: ${picked}`);

const sampled = arrRng.sample(items, 3);
assert(sampled.length === 3 && new Set(sampled).size === 3, 'sample(3) returns 3 unique items');

section('Geometric Utilities');

const geoRng = new PRNG('geo-test');

let allInCircle = true;
for (let i = 0; i < 1000; i++) {
    const p = geoRng.pointInCircle(10);
    if (Math.sqrt(p.x ** 2 + p.y ** 2) > 10) allInCircle = false;
}
assert(allInCircle, 'pointInCircle() always within radius');

let allInSphere = true;
for (let i = 0; i < 1000; i++) {
    const p = geoRng.pointInSphere(1);
    if (Math.sqrt(p.x ** 2 + p.y ** 2 + p.z ** 2) > 1) allInSphere = false;
}
assert(allInSphere, 'pointInSphere() always within radius');

section('Special Generators');

const specRng = new PRNG('special-test');

const uuid = specRng.uuid();
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
assert(uuidRegex.test(uuid), `uuid() valid: ${uuid}`);

const color = specRng.color();
assert(/^#[0-9a-f]{6}$/.test(color), `color() valid: ${color}`);

const str = specRng.string(16);
assert(str.length === 16, `string(16) correct length: ${str}`);

section('Noise Generators');

const valueNoise = new Noise.ValueNoise('noise-test');
let noiseInRange = true;
for (let i = 0; i < 100; i++) {
    const v = valueNoise.noise2D(i * 0.1, i * 0.05);
    if (v < 0 || v > 1) noiseInRange = false;
}
assert(noiseInRange, 'ValueNoise in [0, 1]');

const simplex = new Noise.SimplexNoise('simplex-test');
let simplexInRange = true;
for (let i = 0; i < 100; i++) {
    const v = simplex.noise2D(i * 0.1, i * 0.05);
    if (v < -1 || v > 1) simplexInRange = false;
}
assert(simplexInRange, 'SimplexNoise in [-1, 1]');

section('New Distributions (v1.1.0)');

const distRng2 = new PRNG('dist-test-v11');

// Geometric distribution
const geoSamples = Array.from({ length: 1000 }, () => distRng2.geometric(0.3));
const geoMin = Math.min(...geoSamples);
assert(geoMin >= 1, 'geometric() returns values >= 1');

// Zipf distribution
const zipfSamples = Array.from({ length: 100 }, () => distRng2.zipf(10, 1));
assert(zipfSamples.every(v => v >= 1 && v <= 10), 'zipf() in valid range');

// Chi-squared distribution
const chiSamples = Array.from({ length: 100 }, () => distRng2.chiSquared(4));
assert(chiSamples.every(v => v >= 0), 'chiSquared() returns non-negative values');

// Student's t-distribution
const tSamples = Array.from({ length: 100 }, () => distRng2.studentT(10));
assert(tSamples.some(v => v < 0) && tSamples.some(v => v > 0), 'studentT() spans positive and negative');

// Von Mises distribution
const vmSamples = Array.from({ length: 100 }, () => distRng2.vonMises(0, 2));
assert(vmSamples.every(v => v >= -Math.PI && v <= Math.PI), 'vonMises() in [-π, π]');

// Hypergeometric distribution
const hyperSamples = Array.from({ length: 100 }, () => distRng2.hypergeometric(50, 20, 10));
assert(hyperSamples.every(v => v >= 0 && v <= 10), 'hypergeometric() in valid range');

section('New Noise Types (v1.1.0)');

// Perlin noise
const perlin = new Noise.PerlinNoise('perlin-test');
let perlinWorks = true;
for (let i = 0; i < 50; i++) {
    const v = perlin.noise2D(i * 0.1, i * 0.05);
    if (typeof v !== 'number' || isNaN(v)) perlinWorks = false;
}
assert(perlinWorks, 'PerlinNoise generates valid 2D values');

// Worley noise
const worley = new Noise.WorleyNoise('worley-test');
let worleyWorks = true;
for (let i = 0; i < 50; i++) {
    const v = worley.noise2D(i * 0.5, i * 0.3);
    if (typeof v !== 'number' || isNaN(v) || v < 0) worleyWorks = false;
}
assert(worleyWorks, 'WorleyNoise generates valid non-negative 2D values');

// Worley F2-F1 (cell edges)
const worleyEdge = worley.noise2D(1.5, 2.3, 'euclidean', 2);
assert(worleyEdge >= 0, 'WorleyNoise F2-F1 returns non-negative');

// Ridged noise
const ridged = new Noise.RidgedNoise('ridged-test');
let ridgedWorks = true;
for (let i = 0; i < 50; i++) {
    const v = ridged.noise2D(i * 0.1, i * 0.05);
    if (typeof v !== 'number' || isNaN(v) || v < 0) ridgedWorks = false;
}
assert(ridgedWorks, 'RidgedNoise generates valid non-negative 2D values');

// Billowed noise  
const billowed = new Noise.BillowedNoise('billowed-test');
let billowedWorks = true;
for (let i = 0; i < 50; i++) {
    const v = billowed.noise2D(i * 0.1, i * 0.05);
    if (typeof v !== 'number' || isNaN(v) || v < 0) billowedWorks = false;
}
assert(billowedWorks, 'BillowedNoise generates valid non-negative 2D values');

// Domain warping
const warpValue = simplex.warp(1.5, 2.3, 0.5, 3);
assert(typeof warpValue === 'number' && !isNaN(warpValue), 'SimplexNoise.warp() works');

// Turbulence
const turbValue = simplex.turbulence(1.5, 2.3, null, 4, 2, 0.5);
assert(typeof turbValue === 'number' && !isNaN(turbValue) && turbValue >= 0, 'SimplexNoise.turbulence() works');

section('All Algorithms');

const algorithms = ['mulberry32', 'xoshiro128', 'xorshift128', 'pcg32', 'sfc32', 'lcg'];

for (const algo of algorithms) {
    const r1 = new PRNG('algo-test', algo);
    const r2 = new PRNG('algo-test', algo);
    
    const s1 = Array.from({ length: 100 }, () => r1.random());
    const s2 = Array.from({ length: 100 }, () => r2.random());
    
    assert(s1.every((v, i) => v === s2[i]), `${algo} is reproducible`);
}

// ============================================================
// STATISTICAL CORRECTNESS
// ============================================================

section('Statistical Correctness');

const SAMPLES = 40000;

function stats(fn, n = SAMPLES) {
    let sum = 0, sumSq = 0;
    for (let i = 0; i < n; i++) {
        const v = fn();
        sum += v;
        sumSq += v * v;
    }
    const mean = sum / n;
    return { mean, variance: sumSq / n - mean * mean };
}

/**
 * Check a sampler against its theoretical mean and variance.
 * The mean must land within 5 standard errors, the variance within 8%.
 */
function checkMoments(name, fn, expectedMean, expectedVariance) {
    const { mean, variance } = stats(fn);
    const standardError = Math.sqrt(expectedVariance / SAMPLES);
    const meanOk = Math.abs(mean - expectedMean) <= 5 * standardError;
    const varianceOk = Math.abs(variance - expectedVariance) <= 0.08 * expectedVariance;
    assert(meanOk && varianceOk,
        `${name}: mean ${mean.toFixed(4)} (expected ${expectedMean.toFixed(4)}), ` +
        `variance ${variance.toFixed(4)} (expected ${expectedVariance.toFixed(4)})`);
}

const st = new PRNG('statistics', 'xoshiro128');

for (const algo of ['mulberry32', 'xoshiro128', 'xorshift128', 'pcg32', 'sfc32', 'lcg']) {
    const r = new PRNG('uniformity', algo);
    checkMoments(`random() with ${algo}`, () => r.random(), 0.5, 1 / 12);
}

checkMoments('int(1, 6)', () => st.int(1, 6), 3.5, 35 / 12);
checkMoments('float(10, 20)', () => st.float(10, 20), 15, 100 / 12);
checkMoments('normal(100, 15)', () => st.normal(100, 15), 100, 225);
checkMoments('exponential(0.5)', () => st.exponential(0.5), 2, 4);
checkMoments('poisson(4)', () => st.poisson(4), 4, 4);
checkMoments('poisson(120)', () => st.poisson(120), 120, 120);
checkMoments('poisson(500)', () => st.poisson(500), 500, 500);
checkMoments('poisson(1000)', () => st.poisson(1000), 1000, 1000);
checkMoments('poisson(250000)', () => st.poisson(250000), 250000, 250000);
checkMoments('binomial(20, 0.3)', () => st.binomial(20, 0.3), 6, 4.2);
checkMoments('pareto(6, 2)', () => st.pareto(6, 2), 2.4, 0.24);
checkMoments('beta(2, 5)', () => st.beta(2, 5), 2 / 7, 10 / 392);
checkMoments('gamma(2, 2)', () => st.gamma(2, 2), 4, 8);
checkMoments('gamma(0.5, 1)', () => st.gamma(0.5, 1), 0.5, 0.5);
checkMoments('triangular(0, 100, 80)', () => st.triangular(0, 100, 80), 60, 8400 / 18);
checkMoments('logNormal(0, 0.5)', () => st.logNormal(0, 0.5),
    Math.exp(0.125), (Math.exp(0.25) - 1) * Math.exp(0.25));
checkMoments('weibull(1, 2)', () => st.weibull(1, 2), Math.sqrt(Math.PI) / 2, 1 - Math.PI / 4);
checkMoments('geometric(0.3)', () => st.geometric(0.3), 1 / 0.3, 0.7 / 0.09);
checkMoments('chiSquared(5)', () => st.chiSquared(5), 5, 10);
checkMoments('studentT(10)', () => st.studentT(10), 0, 1.25);
checkMoments('hypergeometric(52, 13, 5)', () => st.hypergeometric(52, 13, 5),
    1.25, 5 * 0.25 * 0.75 * 47 / 51);

// Zipf(10, 1): P(k) = (1/k) / H(10)
const h10 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].reduce((sum, k) => sum + 1 / k, 0);
checkMoments('zipf(10, 1)', () => st.zipf(10, 1), 10 / h10, 55 / h10 - (10 / h10) ** 2);

// Cauchy has no mean; check the median and quartiles instead
const cauchySamples = Array.from({ length: SAMPLES }, () => st.cauchy(3, 2)).sort((a, b) => a - b);
const cauchyMedian = cauchySamples[SAMPLES / 2];
const cauchyQ1 = cauchySamples[SAMPLES / 4];
const cauchyQ3 = cauchySamples[3 * SAMPLES / 4];
assert(Math.abs(cauchyMedian - 3) < 0.1 && Math.abs(cauchyQ1 - 1) < 0.1 && Math.abs(cauchyQ3 - 5) < 0.1,
    `cauchy(3, 2): median ${cauchyMedian.toFixed(3)}, quartiles ${cauchyQ1.toFixed(3)} / ${cauchyQ3.toFixed(3)}`);

// Von Mises: circular mean and mean resultant length I1(kappa) / I0(kappa)
let vmSin = 0, vmCos = 0, vmInRange = true;
for (let i = 0; i < SAMPLES; i++) {
    const angle = st.vonMises(1, 2);
    if (angle < -Math.PI || angle >= Math.PI) vmInRange = false;
    vmSin += Math.sin(angle);
    vmCos += Math.cos(angle);
}
const vmDirection = Math.atan2(vmSin, vmCos);
const vmLength = Math.hypot(vmSin, vmCos) / SAMPLES;
assert(Math.abs(vmDirection - 1) < 0.03 && Math.abs(vmLength - 0.69777) < 0.01,
    `vonMises(1, 2): direction ${vmDirection.toFixed(4)}, concentration ${vmLength.toFixed(4)}`);
assert(vmInRange, 'vonMises() stays in [-π, π)');

let vmNegativeOk = true;
for (let i = 0; i < 2000; i++) {
    const angle = st.vonMises(-40, 3);
    if (angle < -Math.PI || angle >= Math.PI) vmNegativeOk = false;
}
assert(vmNegativeOk, 'vonMises() wraps correctly for a large negative mu');

// Uniformity of int(): chi-squared test over 10 buckets (critical value 27.88 at p = 0.001, 9 df)
const buckets = new Array(10).fill(0);
for (let i = 0; i < SAMPLES; i++) buckets[st.int(0, 9)]++;
const chi2 = buckets.reduce((sum, count) => sum + (count - SAMPLES / 10) ** 2 / (SAMPLES / 10), 0);
assert(chi2 < 27.88, `int(0, 9) is uniform (chi-squared ${chi2.toFixed(2)})`);

// Weighted pick follows the weights
const weightCounts = { a: 0, b: 0, c: 0 };
for (let i = 0; i < SAMPLES; i++) weightCounts[st.weightedPick(['a', 'b', 'c'], [70, 20, 10])]++;
assert(Math.abs(weightCounts.a / SAMPLES - 0.7) < 0.015 &&
       Math.abs(weightCounts.b / SAMPLES - 0.2) < 0.015 &&
       Math.abs(weightCounts.c / SAMPLES - 0.1) < 0.015,
    'weightedPick() follows the weights');

// Shuffle is unbiased: every item lands in every position equally often
const positionCounts = [0, 0, 0, 0];
for (let i = 0; i < SAMPLES; i++) positionCounts[st.shuffled([0, 1, 2, 3]).indexOf(0)]++;
assert(positionCounts.every(count => Math.abs(count / SAMPLES - 0.25) < 0.015), 'shuffle() is unbiased');

// ============================================================
// EDGE CASES
// ============================================================

section('Edge Cases');

const edge = new PRNG('edge-cases');

assert(edge.poisson(0) === 0, 'poisson(0) returns 0');
assert(Array.from({ length: 50 }, () => edge.geometric(1)).every(v => v === 1), 'geometric(1) always returns 1');
assert(Array.from({ length: 2000 }, () => edge.geometric(0.999)).every(v => v >= 1), 'geometric() never returns less than 1');
assert(edge.int(5, 5) === 5, 'int(5, 5) returns 5');
assert(edge.normal(7, 0) === 7, 'normal(7, 0) returns the mean');
assert(edge.binomial(0, 0.5) === 0 && edge.binomial(10, 0) === 0 && edge.binomial(10, 1) === 10, 'binomial() handles n = 0, p = 0 and p = 1');
assert(edge.sample([1, 2, 3], 3).length === 3 && edge.sample([1, 2, 3], 0).length === 0, 'sample() handles n = 0 and n = length');
assert(edge.string(0) === '' && edge.array(0).length === 0, 'string(0) and array(0) return empty results');
assert(edge.weightedPick(['a', 'b'], [0, 5]) === 'b', 'weightedPick() skips zero-weight items');
assert(edge.pick('abc').length === 1 && edge.shuffle(new Uint8Array([1, 2, 3])).length === 3, 'pick() accepts strings and shuffle() accepts typed arrays');

// ============================================================
// UNSEEDED GENERATORS
// ============================================================

section('Unseeded Generators');

const unseededValues = new Set(Array.from({ length: 200 }, () => new PRNG().random()));
assert(unseededValues.size === 200, 'generators created without a seed are all different');

const unseededByAlgorithm = ['mulberry32', 'xoshiro128', 'xorshift128', 'pcg32', 'sfc32', 'lcg']
    .every(algo => new PRNG(undefined, algo).random() !== new PRNG(undefined, algo).random());
assert(unseededByAlgorithm, 'unseeded generators differ for every algorithm');

const noiseFingerprint = noise => [0.3, 1.7, 4.1, 9.6].map(x => noise.noise2D(x, x * 0.37)).join(',');
assert(noiseFingerprint(new Noise.SimplexNoise()) !== noiseFingerprint(new Noise.SimplexNoise()),
    'noise generators created without a seed are different');

const unseeded = new PRNG();
const unseededFirst = unseeded.random();
unseeded.reset();
assert(unseeded.random() === unseededFirst, 'an unseeded generator still resets to its own start');

// ============================================================
// INPUT VALIDATION
// ============================================================

section('Input Validation');

const v = new PRNG('validation');

function assertThrows(fn, ErrorType, message) {
    let error = null;
    try { fn(); } catch (e) { error = e; }
    assert(error instanceof ErrorType && error instanceof Error && error.message.length > 0, message);
}

assertThrows(() => v.int(5, 1), RangeError, 'int(5, 1) throws RangeError');
assertThrows(() => v.int(1.2, 1.8), RangeError, 'int(1.2, 1.8) throws RangeError (no integer in range)');
assertThrows(() => v.int('1', 6), TypeError, 'int("1", 6) throws TypeError');
assertThrows(() => v.int(1), TypeError, 'int(1) with a missing max throws TypeError');
assertThrows(() => v.int(0, Infinity), TypeError, 'int(0, Infinity) throws TypeError');
assertThrows(() => v.float(NaN, 1), TypeError, 'float(NaN, 1) throws TypeError');
assertThrows(() => v.normal(0, -1), RangeError, 'normal(0, -1) throws RangeError');
assertThrows(() => v.exponential(0), RangeError, 'exponential(0) throws RangeError');
assertThrows(() => v.poisson(-1), RangeError, 'poisson(-1) throws RangeError');
assertThrows(() => v.poisson(), TypeError, 'poisson() without lambda throws TypeError');
assertThrows(() => v.binomial(-1, 0.5), RangeError, 'binomial(-1, 0.5) throws RangeError');
assertThrows(() => v.binomial(10, 1.5), RangeError, 'binomial(10, 1.5) throws RangeError');
assertThrows(() => v.pareto(0, 1), RangeError, 'pareto(0, 1) throws RangeError');
assertThrows(() => v.beta(0, 1), RangeError, 'beta(0, 1) throws RangeError');
assertThrows(() => v.gamma(-2), RangeError, 'gamma(-2) throws RangeError');
assertThrows(() => v.triangular(5, 5, 5), RangeError, 'triangular(5, 5, 5) throws RangeError');
assertThrows(() => v.triangular(0, 10, 11), RangeError, 'triangular(0, 10, 11) throws RangeError');
assertThrows(() => v.weibull(1, 0), RangeError, 'weibull(1, 0) throws RangeError');
assertThrows(() => v.cauchy(0, 0), RangeError, 'cauchy(0, 0) throws RangeError');
assertThrows(() => v.geometric(0), RangeError, 'geometric(0) throws RangeError');
assertThrows(() => v.zipf(0), RangeError, 'zipf(0) throws RangeError');
assertThrows(() => v.chiSquared(0), RangeError, 'chiSquared(0) throws RangeError');
assertThrows(() => v.studentT(0), RangeError, 'studentT(0) throws RangeError');
assertThrows(() => v.vonMises(0, -1), RangeError, 'vonMises(0, -1) throws RangeError');
assertThrows(() => v.hypergeometric(10, 20, 5), RangeError, 'hypergeometric(10, 20, 5) throws RangeError');
assertThrows(() => v.pick([]), RangeError, 'pick([]) throws RangeError');
assertThrows(() => v.pick(null), TypeError, 'pick(null) throws TypeError');
assertThrows(() => v.shuffle('abc'), TypeError, 'shuffle("abc") throws TypeError');
assertThrows(() => v.sample([1, 2], 5), RangeError, 'sample([1, 2], 5) throws RangeError');
assertThrows(() => v.sample([1, 2], -1), RangeError, 'sample([1, 2], -1) throws RangeError');
assertThrows(() => v.weightedPick(['a', 'b'], [1]), RangeError, 'weightedPick() with mismatched lengths throws RangeError');
assertThrows(() => v.weightedPick(['a', 'b'], [0, 0]), RangeError, 'weightedPick() with all-zero weights throws RangeError');
assertThrows(() => v.weightedPick(['a', 'b'], [1, -1]), RangeError, 'weightedPick() with a negative weight throws RangeError');
assertThrows(() => v.weightedPick([], []), RangeError, 'weightedPick([], []) throws RangeError');
assertThrows(() => v.weightedPickObject({}), RangeError, 'weightedPickObject({}) throws RangeError');
assertThrows(() => v.weightedPickObject(null), TypeError, 'weightedPickObject(null) throws TypeError');
assertThrows(() => v.char(''), TypeError, 'char("") throws TypeError');
assertThrows(() => v.string(-1), RangeError, 'string(-1) throws RangeError');
assertThrows(() => v.array(2.5), RangeError, 'array(2.5) throws RangeError');
assertThrows(() => new PRNG({}), TypeError, 'new PRNG({}) throws TypeError');
assertThrows(() => new PRNG(NaN), TypeError, 'new PRNG(NaN) throws TypeError');
assertThrows(() => new PRNG('seed', 'nope'), Error, 'an unknown algorithm throws');
assertThrows(() => new PRNG('seed', 42), TypeError, 'a non-string algorithm throws TypeError');
assertThrows(() => v.setState(null), TypeError, 'setState(null) throws TypeError');
assertThrows(() => v.setState({ algorithm: 'sfc32' }), TypeError, 'setState() with a partial state throws TypeError');

// A failed call must not consume random numbers
const beforeFailure = new PRNG('no-side-effects');
const afterFailure = new PRNG('no-side-effects');
try { afterFailure.int(5, 1); } catch (e) { /* expected */ }
try { afterFailure.pick([]); } catch (e) { /* expected */ }
try { afterFailure.weightedPick(['a'], [0]); } catch (e) { /* expected */ }
assert(beforeFailure.random() === afterFailure.random(), 'a rejected call does not advance the generator');

// ============================================================
// STABLE OUTPUT ACROSS VERSIONS
// ============================================================

section('Stable Output Across Versions');

// First three random() values for seed "seedforge", recorded from v1.1.0.
// These must never change: users rely on a seed producing the same world.
// (pcg32 is checked separately below: its arithmetic was corrected in v1.1.1.)
const GOLDEN = {
    mulberry32: [0.9150991500355303, 0.8249061461538076, 0.24556037061847746],
    xoshiro128: [0.08832284528762102, 0.37102262838743627, 0.775036072358489],
    xorshift128: [0.569637558888644, 0.2497514975257218, 0.636186177842319],
    sfc32: [0.8499728129245341, 0.8689743659924716, 0.7402530889958143],
    lcg: [0.14630305697210133, 0.3319744598120451, 0.023786617210134864]
};

for (const algo of Object.keys(GOLDEN)) {
    const r = new PRNG('seedforge', algo);
    const values = [r.random(), r.random(), r.random()];
    assert(values.every((value, i) => value === GOLDEN[algo][i]), `${algo} output matches v1.1.0`);
}

// pcg32 must match the reference implementation (pcg-random.org demo vectors
// for seed 42, sequence 54)
const pcgReference = [0xa15c02b7, 0x7b47f409, 0xba1d3330, 0x83d2f293, 0xbfa4784b, 0xcbed606e];
const pcg = new Algorithms.PCG32(42, 54);
assert(pcgReference.every(expected => pcg.nextInt() === expected), 'pcg32 matches the PCG reference implementation');

// pcg32 output as of v1.1.1
const pcgGolden = new PRNG('seedforge', 'pcg32');
assert(JSON.stringify([pcgGolden.random(), pcgGolden.random(), pcgGolden.random()]) === '[0.96909349411726,0.29058207012712955,0.2854143970180303]',
    'pcg32 output matches v1.1.1');

const goldenMix = new PRNG('seedforge');
const mixed = [goldenMix.int(1, 100), goldenMix.normal(100, 15), goldenMix.poisson(4), goldenMix.pick(['a', 'b', 'c', 'd']), goldenMix.uuid()];
assert(JSON.stringify(mixed) === JSON.stringify([9, 91.00846773452498, 4, "d", "9ed114d0-96a5-47a9-952a-74cf1d65d5d3"]), 'mixed call sequence matches v1.1.0');

const goldenNoise = new Noise.SimplexNoise('seedforge');
assert(goldenNoise.noise2D(1.5, 2.3) === 0.04788613991065693 && goldenNoise.fbm(1.5, 2.3) === -0.12064582846713463,
    'simplex noise output matches v1.1.0');

assert(SeedForge.version === require('../package.json').version, 'exported version matches package.json');

// ============================================================
// SUMMARY
// ============================================================

console.log(`\n${'='.repeat(50)}`);
console.log(`  SUMMARY: ${passed} passed, ${failed} failed`);
console.log('='.repeat(50));

process.exit(failed > 0 ? 1 : 0);

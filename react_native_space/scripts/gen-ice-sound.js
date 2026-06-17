// Synthesizes a short, royalty-free "ice clinking in a glass" sound as a WAV.
// A few bright, glassy chimes with quick exponential decay + a soft low thunk.
const fs = require('fs');
const path = require('path');

const sampleRate = 44100;
const duration = 0.85; // seconds
const n = Math.floor(sampleRate * duration);
const data = new Float32Array(n);

// Each "clink" = sum of high glassy partials with fast decay.
const clinks = [
  { t: 0.00, freqs: [2820, 4190, 5600], decay: 11, gain: 0.9 },
  { t: 0.19, freqs: [3120, 4700, 6100], decay: 13, gain: 0.7 },
  { t: 0.34, freqs: [2650, 3980, 5200], decay: 12, gain: 0.55 },
];

for (let i = 0; i < n; i++) {
  const t = i / sampleRate;
  let s = 0;
  for (const c of clinks) {
    if (t < c.t) continue;
    const dt = t - c.t;
    const env = Math.exp(-c.decay * dt) * c.gain;
    for (let k = 0; k < c.freqs.length; k++) {
      s += (env / c.freqs.length) * Math.sin(2 * Math.PI * c.freqs[k] * dt);
    }
    // soft low "settle" thunk under the first clink
    if (c === clinks[0]) {
      s += Math.exp(-22 * dt) * 0.25 * Math.sin(2 * Math.PI * 180 * dt);
    }
  }
  data[i] = s;
}

// Normalize to avoid clipping
let peak = 0;
for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(data[i]));
const norm = peak > 0 ? 0.85 / peak : 1;

// 16-bit PCM mono WAV
const bytesPerSample = 2;
const buffer = Buffer.alloc(44 + n * bytesPerSample);
buffer.write('RIFF', 0);
buffer.writeUInt32LE(36 + n * bytesPerSample, 4);
buffer.write('WAVE', 8);
buffer.write('fmt ', 12);
buffer.writeUInt32LE(16, 16);
buffer.writeUInt16LE(1, 20); // PCM
buffer.writeUInt16LE(1, 22); // mono
buffer.writeUInt32LE(sampleRate, 24);
buffer.writeUInt32LE(sampleRate * bytesPerSample, 28);
buffer.writeUInt16LE(bytesPerSample, 32);
buffer.writeUInt16LE(16, 34);
buffer.write('data', 36);
buffer.writeUInt32LE(n * bytesPerSample, 40);
for (let i = 0; i < n; i++) {
  let v = Math.round(data[i] * norm * 32767);
  v = Math.max(-32768, Math.min(32767, v));
  buffer.writeInt16LE(v, 44 + i * bytesPerSample);
}

const outDir = path.join(__dirname, '..', 'assets', 'sounds');
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, 'ice-glass.wav');
fs.writeFileSync(outPath, buffer);
console.log('wrote', outPath, buffer.length, 'bytes');

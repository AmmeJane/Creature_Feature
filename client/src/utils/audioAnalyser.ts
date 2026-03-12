// utils/audioAnalyser.ts
export type Lane = "A" | "S" | "D";

export interface Note {
  time:  number; // seconds from start
  lane:  Lane;
}

export interface NoteChart {
  notes:      Note[];
  duration:   number;
  previewUrl: string;
  bpm:        number;
  audioDelay: number; // seconds to wait before starting audio so beat 1 lines up
}

const BASS_MAX   = 300;   // Hz
const MID_MAX    = 2500;  // Hz
const HOP_MS     = 23;    // ~43 frames/sec, good time resolution
const MAX_NOTES  = 64;

// ── Fetch ─────────────────────────────────────────────────────────────────────
async function fetchAudioBuffer(url: string): Promise<AudioBuffer> {
  let arrayBuffer: ArrayBuffer;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("direct fetch failed");
    arrayBuffer = await res.arrayBuffer();
  } catch {
    const res = await fetch(`/api/audio-proxy?url=${encodeURIComponent(url)}`);
    if (!res.ok) throw new Error("proxy fetch failed");
    arrayBuffer = await res.arrayBuffer();
  }
  const ctx = new AudioContext();
  return ctx.decodeAudioData(arrayBuffer);
}

// ── RMS energy per band per frame ─────────────────────────────────────────────
function analyseBuffer(buffer: AudioBuffer) {
  const sampleRate = buffer.sampleRate;
  const data       = buffer.getChannelData(0);
  const hopSamples = Math.floor((HOP_MS / 1000) * sampleRate);
  const winSize    = hopSamples * 2;
  const numFrames  = Math.floor(data.length / hopSamples);

  const bassE  = new Float32Array(numFrames);
  const midE   = new Float32Array(numFrames);
  const highE  = new Float32Array(numFrames);
  const times  = new Float32Array(numFrames);

  // Simple band-split using a biquad-style RMS approach:
  // For each frame, compute RMS of bass/mid/high by summing DFT magnitudes
  const fftSize = 512;
  const binHz   = sampleRate / fftSize;
  const bassEnd = Math.floor(BASS_MAX / binHz);
  const midEnd  = Math.floor(MID_MAX  / binHz);

  const hann = new Float32Array(fftSize);
  for (let i = 0; i < fftSize; i++) {
    hann[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / fftSize));
  }

  for (let f = 0; f < numFrames; f++) {
    const offset = f * hopSamples;
    times[f] = offset / sampleRate;

    let bE = 0, mE = 0, hE = 0;
    for (let k = 1; k < fftSize / 2; k++) {
      let re = 0, im = 0;
      const freq = (2 * Math.PI * k) / fftSize;
      for (let n = 0; n < fftSize && (offset + n) < data.length; n++) {
        const s = data[offset + n] * hann[n];
        re += s * Math.cos(freq * n);
        im -= s * Math.sin(freq * n);
      }
      const mag = Math.sqrt(re * re + im * im) / fftSize;
      if      (k <= bassEnd) bE += mag;
      else if (k <= midEnd)  mE += mag;
      else                   hE += mag;
    }
    bassE[f] = bE;
    midE[f]  = mE;
    highE[f] = hE;
  }

  return { bassE, midE, highE, times, numFrames };
}

// ── Spectral flux onset detection ─────────────────────────────────────────────
// Much more reliable than threshold — detects sudden increases in energy
function spectralFlux(energy: Float32Array): Float32Array {
  const flux = new Float32Array(energy.length);
  for (let i = 1; i < energy.length; i++) {
    const diff = energy[i] - energy[i - 1];
    flux[i] = diff > 0 ? diff : 0; // half-wave rectify
  }
  return flux;
}

function pickPeaks(flux: Float32Array, times: Float32Array, minGapSec: number): number[] {
  // Adaptive threshold: mean + 1 std dev of the flux
  let sum = 0, sum2 = 0;
  for (const v of flux) { sum += v; sum2 += v * v; }
  const mean  = sum / flux.length;
  const std   = Math.sqrt(sum2 / flux.length - mean * mean);
  const thresh = mean + std * 1.2;

  const peaks: number[] = [];
  let lastTime = -999;

  for (let i = 2; i < flux.length - 2; i++) {
    if (
      flux[i] > thresh &&
      flux[i] >= flux[i - 1] && flux[i] >= flux[i - 2] &&
      flux[i] >= flux[i + 1] && flux[i] >= flux[i + 2] &&
      times[i] - lastTime >= minGapSec
    ) {
      peaks.push(i);
      lastTime = times[i];
    }
  }
  return peaks;
}

// ── BPM from beat peaks ───────────────────────────────────────────────────────
function estimateBpm(beatTimes: number[]): number {
  if (beatTimes.length < 4) return 120;

  const intervals: number[] = [];
  for (let i = 1; i < beatTimes.length; i++) {
    const gap = beatTimes[i] - beatTimes[i - 1];
    if (gap > 0.25 && gap < 1.5) intervals.push(gap);
  }
  if (intervals.length === 0) return 120;

  // Histogram at 10ms resolution
  const buckets: Record<number, number> = {};
  for (const iv of intervals) {
    const b = Math.round(iv * 100);
    buckets[b] = (buckets[b] ?? 0) + 1;
  }

  let bestBucket = 60, bestCount = 0;
  for (const [b, c] of Object.entries(buckets)) {
    if (c > bestCount) { bestCount = c; bestBucket = Number(b); }
  }

  let bpm = 60 / (bestBucket / 100);
  if (bpm < 60)  bpm *= 2;
  if (bpm > 180) bpm /= 2;
  return Math.round(bpm);
}

// ── Snap time to nearest beat grid point ─────────────────────────────────────
function snapToBeats(time: number, beatInterval: number, phase: number): number {
  // phase = time of the first detected beat (beat grid offset)
  const relative  = time - phase;
  const snapped   = Math.round(relative / beatInterval) * beatInterval;
  return phase + snapped;
}

// ── Build the note chart ──────────────────────────────────────────────────────
function buildChart(
  bassE: Float32Array, midE: Float32Array, highE: Float32Array,
  times: Float32Array, duration: number, previewUrl: string,
): NoteChart {
  // Spectral flux for each band
  const bassFlux = spectralFlux(bassE);
  const midFlux  = spectralFlux(midE);
  const highFlux = spectralFlux(highE);

  // Detect peaks per band with different min gaps:
  // Bass = slower (kick drum spacing), mid/high = faster
  const bassBeats = pickPeaks(bassFlux, times, 0.35);
  const midBeats  = pickPeaks(midFlux,  times, 0.25);
  const highBeats = pickPeaks(highFlux, times, 0.25);

  // Use bass beats to estimate BPM and grid phase
  const bassTimes = bassBeats.map(f => times[f]);
  const bpm         = estimateBpm(bassTimes);
  const beatInterval = 60 / bpm;

  // Grid phase = time of first bass beat (so grid aligns to actual music)
  const gridPhase = bassTimes[0] ?? 0;

  // Collect all candidates, snap each to beat grid
  type Candidate = { rawTime: number; snappedTime: number; lane: Lane };
  const candidates: Candidate[] = [
    ...bassBeats.map(f => ({ rawTime: times[f], snappedTime: snapToBeats(times[f], beatInterval, gridPhase), lane: "A" as Lane })),
    ...midBeats.map(f  => ({ rawTime: times[f], snappedTime: snapToBeats(times[f], beatInterval / 2, gridPhase), lane: "S" as Lane })),
    ...highBeats.map(f => ({ rawTime: times[f], snappedTime: snapToBeats(times[f], beatInterval / 2, gridPhase), lane: "D" as Lane })),
  ].sort((a, b) => a.snappedTime - b.snappedTime);

  // Deduplicate: if two notes land on same snapped time, keep loudest lane
  const slotMap = new Map<number, Candidate>();
  for (const c of candidates) {
    const key = Math.round(c.snappedTime * 100); // 10ms resolution key
    if (!slotMap.has(key)) slotMap.set(key, c);
  }

  // Apply gaps and build final note list
  const lastLaneTime: Record<Lane, number> = { A: -999, S: -999, D: -999 };
  let lastGlobal = -999;
  const notes: Note[] = [];

  for (const c of Array.from(slotMap.values()).sort((a, b) => a.snappedTime - b.snappedTime)) {
    const t = c.snappedTime;
    if (t < 0 || t > duration) continue;
    if (t - lastLaneTime[c.lane] < beatInterval * 0.9) continue; // must be at least ~1 beat apart per lane
    if (t - lastGlobal < beatInterval / 2) continue;             // global: at least half a beat apart

    notes.push({ time: t, lane: c.lane });
    lastLaneTime[c.lane] = t;
    lastGlobal = t;
  }

  // Cap
  const trimmed = notes.length > MAX_NOTES
    ? notes.filter((_, i) => i % Math.ceil(notes.length / MAX_NOTES) === 0)
    : notes;

  // audioDelay: start audio so that the first note hits the hit zone on beat 1
  // The caller (hooks.ts) uses this to delay audio.play() relative to note spawning
  const audioDelay = gridPhase > 0 ? gridPhase : 0;

  return { notes: trimmed, duration, previewUrl, bpm, audioDelay };
}

// ── Main export ───────────────────────────────────────────────────────────────
export async function generateNoteChart(previewUrl: string): Promise<NoteChart> {
  const buffer = await fetchAudioBuffer(previewUrl);
  const { bassE, midE, highE, times } = analyseBuffer(buffer);
  return buildChart(bassE, midE, highE, times, buffer.duration, previewUrl);
}
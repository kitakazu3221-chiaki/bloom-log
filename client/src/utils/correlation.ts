import type { PhotoRecord } from "../types";

export interface DailyData {
  date: string;
  photoCount: number;
  sleep?: number;
  stress?: number;
  exercise?: number; // 0 or 1
  diet?: number;
  alcohol?: number; // 0 or 1
  scalpMassage?: number; // 0 or 1
}

export interface CorrelationResult {
  factorA: string;
  factorB: string;
  r: number;
  n: number;
  strength: "strong" | "moderate" | "weak";
  direction: "positive" | "negative" | "neutral";
}

export function pearsonCorrelation(x: number[], y: number[]): number | null {
  if (x.length !== y.length || x.length < 3) return null;
  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((a, xi, i) => a + xi * y[i], 0);
  const sumX2 = x.reduce((a, xi) => a + xi * xi, 0);
  const sumY2 = y.reduce((a, yi) => a + yi * yi, 0);
  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt(
    (n * sumX2 - sumX ** 2) * (n * sumY2 - sumY ** 2)
  );
  if (denominator === 0) return null;
  return numerator / denominator;
}

export function aggregateDailyData(records: PhotoRecord[]): DailyData[] {
  const byDate = new Map<string, PhotoRecord[]>();
  for (const r of records) {
    const existing = byDate.get(r.date) ?? [];
    existing.push(r);
    byDate.set(r.date, existing);
  }

  const result: DailyData[] = [];
  for (const [date, recs] of byDate) {
    // Use the first record's notes that has data for each field
    let sleep: number | undefined;
    let stress: number | undefined;
    let exercise: number | undefined;
    let diet: number | undefined;
    let alcohol: number | undefined;
    let scalpMassage: number | undefined;

    for (const r of recs) {
      if (sleep === undefined && r.notes.sleep !== undefined) sleep = r.notes.sleep;
      if (stress === undefined && r.notes.stress !== undefined) stress = r.notes.stress;
      if (exercise === undefined && r.notes.exercise !== undefined) exercise = r.notes.exercise ? 1 : 0;
      if (diet === undefined && r.notes.diet !== undefined) diet = r.notes.diet;
      if (alcohol === undefined && r.notes.alcohol !== undefined) alcohol = r.notes.alcohol ? 1 : 0;
      if (scalpMassage === undefined && r.notes.scalpMassage !== undefined) scalpMassage = r.notes.scalpMassage ? 1 : 0;
    }

    result.push({
      date,
      photoCount: recs.length,
      sleep,
      stress,
      exercise,
      diet,
      alcohol,
      scalpMassage,
    });
  }

  result.sort((a, b) => a.date.localeCompare(b.date));
  return result;
}

type FactorKey = "sleep" | "stress" | "exercise" | "diet" | "alcohol" | "scalpMassage";

const FACTOR_PAIRS: [FactorKey, FactorKey][] = [
  ["sleep", "stress"],
  ["sleep", "diet"],
  ["sleep", "exercise"],
  ["stress", "exercise"],
  ["stress", "diet"],
  ["exercise", "diet"],
  ["alcohol", "sleep"],
  ["alcohol", "stress"],
  ["scalpMassage", "stress"],
  ["scalpMassage", "sleep"],
];

function classifyCorrelation(r: number): { strength: CorrelationResult["strength"]; direction: CorrelationResult["direction"] } {
  const abs = Math.abs(r);
  const strength: CorrelationResult["strength"] = abs >= 0.5 ? "strong" : abs >= 0.3 ? "moderate" : "weak";
  const direction: CorrelationResult["direction"] = abs < 0.1 ? "neutral" : r > 0 ? "positive" : "negative";
  return { strength, direction };
}

export function computeCorrelations(records: PhotoRecord[]): CorrelationResult[] {
  const daily = aggregateDailyData(records);
  const results: CorrelationResult[] = [];

  for (const [a, b] of FACTOR_PAIRS) {
    const xVals: number[] = [];
    const yVals: number[] = [];

    for (const d of daily) {
      const va = d[a];
      const vb = d[b];
      if (va !== undefined && vb !== undefined) {
        xVals.push(va);
        yVals.push(vb);
      }
    }

    if (xVals.length < 7) continue;

    const r = pearsonCorrelation(xVals, yVals);
    if (r === null) continue;

    const { strength, direction } = classifyCorrelation(r);
    results.push({ factorA: a, factorB: b, r, n: xVals.length, strength, direction });
  }

  // Sort by absolute correlation strength descending
  results.sort((a, b) => Math.abs(b.r) - Math.abs(a.r));
  return results;
}

export function getTimeSeriesData(
  records: PhotoRecord[],
  factor: FactorKey,
  days: number = 30
): { date: string; value: number }[] {
  const daily = aggregateDailyData(records);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  return daily
    .filter((d) => d.date >= cutoffStr && d[factor] !== undefined)
    .map((d) => ({ date: d.date, value: d[factor]! }));
}

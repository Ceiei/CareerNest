import { describe, expect, it } from 'vitest';
import { calculateMetrics } from '../utils/metrics';

describe('calculateMetrics', () => {
  it('separates coverage from accuracy', () => {
    const metrics = calculateMetrics([
      { answerable: true, expectedKey: 'personal.fullName', predictedKey: 'personal.fullName' },
      { answerable: true, expectedKey: 'personal.phone', predictedKey: 'personal.email' },
      { answerable: true, expectedKey: 'education.0.school' },
      { answerable: false }
    ]);
    expect(metrics.coverage).toBeCloseTo(2 / 3);
    expect(metrics.accuracy).toBe(0.5);
  });
});

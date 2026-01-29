import { describe, it, expect } from 'vitest';
import { recordNewsSync, getJobsStatus } from '../src/lib/jobs.js';

describe('Jobs status', () => {
  it('records news sync timestamp', () => {
    recordNewsSync('2020-01-01T00:00:00Z');
    const s = getJobsStatus();
    expect(s.lastNewsSync).toBe('2020-01-01T00:00:00.000Z');
  });
});
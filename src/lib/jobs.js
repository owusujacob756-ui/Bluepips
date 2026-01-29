let lastNewsSync = null;

export function recordNewsSync(time = new Date()) {
  lastNewsSync = time instanceof Date ? time.toISOString() : new Date(time).toISOString();
}

export function getJobsStatus() {
  return { lastNewsSync };
}
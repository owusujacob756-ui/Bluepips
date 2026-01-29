import { getJobsStatus } from '../../../../lib/jobs.js';

export async function GET() {
  try {
    const status = getJobsStatus();
    return new Response(JSON.stringify(status), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
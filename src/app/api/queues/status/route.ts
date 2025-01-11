import { NextResponse } from 'next/server';
import prematchQueue from '../../../../queues/prematch.queue';
import analyticsQueue from '../../../../queues/analytics.queue';

export async function GET() {
  try {
    const [prematchJobs, analyticsJobs] = await Promise.all([
      prematchQueue.getJobs(['waiting', 'active', 'completed', 'failed']),
      analyticsQueue.getJobs(['waiting', 'active', 'completed', 'failed'])
    ]);

    const formatJobs = (jobs: any[]) => {
      return jobs.map(job => ({
        id: job.id,
        name: job.name,
        state: job.state,
        timestamp: job.timestamp,
        failedReason: job.failedReason,
        returnvalue: job.returnvalue,
      }));
    };

    const status = {
      prematch: {
        waiting: prematchJobs.filter(job => job.state === 'waiting').length,
        active: prematchJobs.filter(job => job.state === 'active').length,
        completed: prematchJobs.filter(job => job.state === 'completed').length,
        failed: prematchJobs.filter(job => job.state === 'failed').length,
        recentJobs: formatJobs(prematchJobs.slice(0, 5)),
      },
      analytics: {
        waiting: analyticsJobs.filter(job => job.state === 'waiting').length,
        active: analyticsJobs.filter(job => job.state === 'active').length,
        completed: analyticsJobs.filter(job => job.state === 'completed').length,
        failed: analyticsJobs.filter(job => job.state === 'failed').length,
        recentJobs: formatJobs(analyticsJobs.slice(0, 5)),
      },
    };

    return NextResponse.json(status);
  } catch (error) {
    console.error('Failed to fetch queue status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch queue status' },
      { status: 500 }
    );
  }
} 
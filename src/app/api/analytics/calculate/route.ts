import { NextResponse } from 'next/server';
import analyticsQueue from '../../../../queues/analytics.queue';

export async function POST() {
  try {
    await analyticsQueue.add('calculate-analytics', {});
    return NextResponse.json({ message: 'Analytics calculation queued' });
  } catch (error) {
    console.error('Failed to queue analytics calculation:', error);
    return NextResponse.json(
      { error: 'Failed to queue analytics calculation' },
      { status: 500 }
    );
  }
} 
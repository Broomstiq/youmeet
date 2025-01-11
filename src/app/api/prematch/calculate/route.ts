import { NextResponse } from 'next/server';
import prematchQueue from '../../../../queues/prematch.queue';

export async function POST() {
  try {
    await prematchQueue.add('calculate-prematches', {});
    return NextResponse.json({ message: 'Prematch calculation queued' });
  } catch (error) {
    console.error('Failed to queue prematch calculation:', error);
    return NextResponse.json(
      { error: 'Failed to queue prematch calculation' },
      { status: 500 }
    );
  }
} 
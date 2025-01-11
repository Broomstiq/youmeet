import { Queue } from 'bullmq';
import { redisConnection, QUEUES } from './config';

const prematchQueue = new Queue(QUEUES.PREMATCH, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  },
});

export const schedulePrematchCalculation = async () => {
  await prematchQueue.add(
    'calculate-prematches',
    {},
    {
      repeat: {
        pattern: '0 0 * * *', // Run at midnight every day
      },
    }
  );
};

export default prematchQueue; 
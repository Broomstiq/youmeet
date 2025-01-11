import { Queue } from 'bullmq';
import { redisConnection, QUEUES } from './config';

const analyticsQueue = new Queue(QUEUES.ANALYTICS, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  },
});

export default analyticsQueue; 
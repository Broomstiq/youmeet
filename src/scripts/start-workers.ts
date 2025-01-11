import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

// Import workers
import prematchWorker from '../queues/prematch.worker';
import analyticsWorker from '../queues/analytics.worker';

console.log('Starting workers...');

// Create worker instances
const prematchWorkerInstance = prematchWorker;
const analyticsWorkerInstance = analyticsWorker;

// Export worker instances
export { prematchWorkerInstance as prematchWorker, analyticsWorkerInstance as analyticsWorker }; 
import { Command } from 'commander';
import mongoose from 'mongoose';
import inquirer from 'inquirer';
import ora from 'ora';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

export function setupCommands(program: Command) {
  const setup = program.command('setup').description('Setup and configuration');

  setup
    .command('init')
    .description('Initialize Growvia configuration')
    .action(async () => {
      console.log(chalk.bold.cyan('\n🌱 Growvia Setup\n'));

      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'mongoUri',
          message: 'MongoDB URI:',
          default: 'mongodb://localhost:27017/growvia',
        },
        {
          type: 'input',
          name: 'redisHost',
          message: 'Redis host:',
          default: 'localhost',
        },
        {
          type: 'input',
          name: 'redisPort',
          message: 'Redis port:',
          default: '6379',
        },
        {
          type: 'input',
          name: 'apiPort',
          message: 'API port:',
          default: '3001',
        },
      ]);

      const envContent = `# MongoDB
MONGODB_URI=${answers.mongoUri}

# Redis
REDIS_HOST=${answers.redisHost}
REDIS_PORT=${answers.redisPort}
REDIS_PASSWORD=

# Server
PORT=${answers.apiPort}
NODE_ENV=development

# CORS
CORS_ORIGIN=*

# Attribution
DEFAULT_ATTRIBUTION_MODEL=last-click
DEFAULT_CONVERSION_WINDOW=604800

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
`;

      const envPath = path.join(process.cwd(), '.env');
      fs.writeFileSync(envPath, envContent);

      console.log(chalk.green('\n✓ Configuration saved to .env'));
      console.log(chalk.cyan('\nNext steps:'));
      console.log('  1. Review and update .env file');
      console.log('  2. Run: growvia setup db');
      console.log('  3. Start services: npm run dev\n');
    });

  setup
    .command('db')
    .description('Initialize database')
    .action(async () => {
      const spinner = ora('Connecting to database...').start();

      try {
        await mongoose.connect(process.env.MONGODB_URI!);
        spinner.text = 'Creating indexes...';

        // Create indexes (implement based on your models)
        const TrackingEvent = mongoose.model('TrackingEvent');
        await TrackingEvent.collection.createIndex({ eventId: 1 }, { unique: true });
        await TrackingEvent.collection.createIndex({ timestamp: -1 });
        await TrackingEvent.collection.createIndex({ affiliateId: 1, campaignId: 1 });

        spinner.succeed(chalk.green('Database initialized successfully'));
      } catch (error: any) {
        spinner.fail('Database initialization failed');
        console.error(chalk.red(error.message));
      } finally {
        await mongoose.disconnect();
      }
    });

  setup
    .command('test')
    .description('Test database and Redis connections')
    .action(async () => {
      console.log(chalk.bold('\nTesting connections...\n'));

      // Test MongoDB
      const mongoSpinner = ora('Testing MongoDB...').start();
      try {
        await mongoose.connect(process.env.MONGODB_URI!);
        mongoSpinner.succeed(chalk.green('MongoDB: Connected'));
        await mongoose.disconnect();
      } catch (error: any) {
        mongoSpinner.fail(chalk.red(`MongoDB: ${error.message}`));
      }

      // Test Redis
      const redisSpinner = ora('Testing Redis...').start();
      try {
        const { Redis } = await import('ioredis');
        const redis = new Redis({
          host: process.env.REDIS_HOST,
          port: parseInt(process.env.REDIS_PORT || '6379'),
        });
        await redis.ping();
        redisSpinner.succeed(chalk.green('Redis: Connected'));
        await redis.quit();
      } catch (error: any) {
        redisSpinner.fail(chalk.red(`Redis: ${error.message}`));
      }

      console.log();
    });
}

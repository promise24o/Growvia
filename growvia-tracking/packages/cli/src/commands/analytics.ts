import { Command } from 'commander';
import mongoose from 'mongoose';
import ora from 'ora';
import chalk from 'chalk';
import { table } from 'table';

export function analyticsCommands(program: Command) {
  const analytics = program.command('analytics').description('View analytics');

  analytics
    .command('summary')
    .description('Show overall summary')
    .option('-d, --days <number>', 'Number of days', '7')
    .action(async (options) => {
      const spinner = ora('Calculating summary...').start();

      try {
        await mongoose.connect(process.env.MONGODB_URI!);
        const TrackingEvent = mongoose.model('TrackingEvent');

        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - parseInt(options.days));

        const summary = await TrackingEvent.aggregate([
          { $match: { timestamp: { $gte: daysAgo } } },
          {
            $group: {
              _id: null,
              totalEvents: { $sum: 1 },
              totalRevenue: { $sum: '$amount' },
              totalCommission: { $sum: '$payout' },
              validatedEvents: {
                $sum: { $cond: [{ $eq: ['$status', 'validated'] }, 1, 0] },
              },
              fraudEvents: {
                $sum: { $cond: [{ $eq: ['$status', 'fraud'] }, 1, 0] },
              },
            },
          },
        ]);

        spinner.stop();

        if (summary.length === 0) {
          console.log(chalk.yellow('No data found'));
          return;
        }

        const s = summary[0];
        const roi = s.totalRevenue > 0 ? ((s.totalRevenue - s.totalCommission) / s.totalRevenue * 100).toFixed(2) : '0.00';

        console.log(chalk.bold(`\nSummary (Last ${options.days} days):\n`));
        console.log(chalk.cyan(`Total Events:       ${s.totalEvents}`));
        console.log(chalk.green(`Validated:          ${s.validatedEvents}`));
        console.log(chalk.red(`Fraud:              ${s.fraudEvents}`));
        console.log(chalk.yellow(`Total Revenue:      ${s.totalRevenue.toFixed(2)}`));
        console.log(chalk.yellow(`Total Commission:   ${s.totalCommission.toFixed(2)}`));
        console.log(chalk.magenta(`ROI:                ${roi}%`));
      } catch (error: any) {
        spinner.fail('Failed to calculate summary');
        console.error(chalk.red(error.message));
      } finally {
        await mongoose.disconnect();
      }
    });

  analytics
    .command('top-affiliates')
    .description('Show top performing affiliates')
    .option('-l, --limit <number>', 'Number of results', '10')
    .action(async (options) => {
      const spinner = ora('Loading top affiliates...').start();

      try {
        await mongoose.connect(process.env.MONGODB_URI!);
        const TrackingEvent = mongoose.model('TrackingEvent');

        const topAffiliates = await TrackingEvent.aggregate([
          { $match: { status: 'validated' } },
          {
            $group: {
              _id: '$affiliateId',
              conversions: { $sum: 1 },
              revenue: { $sum: '$amount' },
              commission: { $sum: '$payout' },
            },
          },
          { $sort: { revenue: -1 } },
          { $limit: parseInt(options.limit) },
        ]);

        spinner.stop();

        if (topAffiliates.length === 0) {
          console.log(chalk.yellow('No data found'));
          return;
        }

        const data = [
          ['Rank', 'Affiliate ID', 'Conversions', 'Revenue', 'Commission'],
          ...topAffiliates.map((a: any, i: number) => [
            i + 1,
            a._id.toString().slice(-8),
            a.conversions,
            a.revenue.toFixed(2),
            a.commission.toFixed(2),
          ]),
        ];

        console.log(chalk.bold(`\nTop ${options.limit} Affiliates:\n`));
        console.log(table(data));
      } catch (error: any) {
        spinner.fail('Failed to load top affiliates');
        console.error(chalk.red(error.message));
      } finally {
        await mongoose.disconnect();
      }
    });
}

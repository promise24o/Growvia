import { Command } from 'commander';
import mongoose from 'mongoose';
import ora from 'ora';
import chalk from 'chalk';
import { table } from 'table';

export function affiliateCommands(program: Command) {
  const affiliate = program.command('affiliate').description('Manage affiliates');

  affiliate
    .command('list')
    .description('List all affiliates')
    .option('-c, --campaign <id>', 'Filter by campaign ID')
    .action(async (options) => {
      const spinner = ora('Loading affiliates...').start();

      try {
        await mongoose.connect(process.env.MONGODB_URI!);
        const CampaignAffiliate = mongoose.model('CampaignAffiliate');

        const query = options.campaign
          ? { campaignId: new mongoose.Types.ObjectId(options.campaign) }
          : {};

        const affiliates = await CampaignAffiliate.find(query)
          .populate('affiliateId')
          .limit(50);

        spinner.stop();

        if (affiliates.length === 0) {
          console.log(chalk.yellow('No affiliates found'));
          return;
        }

        const data = [
          ['ID', 'Name', 'Status', 'Conversions', 'Revenue', 'Commission'],
          ...affiliates.map((a: any) => [
            a._id.toString().slice(-8),
            a.affiliateId?.name || 'N/A',
            a.status,
            a.conversions || 0,
            a.totalRevenue || 0,
            a.totalCommission || 0,
          ]),
        ];

        console.log(table(data));
        console.log(chalk.green(`\nTotal: ${affiliates.length} affiliates`));
      } catch (error: any) {
        spinner.fail('Failed to load affiliates');
        console.error(chalk.red(error.message));
      } finally {
        await mongoose.disconnect();
      }
    });

  affiliate
    .command('performance <affiliateId>')
    .description('Show affiliate performance')
    .option('-d, --days <number>', 'Number of days', '30')
    .action(async (affiliateId, options) => {
      const spinner = ora('Loading performance data...').start();

      try {
        await mongoose.connect(process.env.MONGODB_URI!);
        const TrackingEvent = mongoose.model('TrackingEvent');

        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - parseInt(options.days));

        const events = await TrackingEvent.find({
          affiliateId: new mongoose.Types.ObjectId(affiliateId),
          timestamp: { $gte: daysAgo },
        });

        spinner.stop();

        const byType = events.reduce((acc: any, event: any) => {
          if (!acc[event.type]) {
            acc[event.type] = { count: 0, revenue: 0, commission: 0 };
          }
          acc[event.type].count++;
          acc[event.type].revenue += event.amount || 0;
          acc[event.type].commission += event.payout || 0;
          return acc;
        }, {});

        const data = [
          ['Event Type', 'Count', 'Revenue', 'Commission'],
          ...Object.entries(byType).map(([type, stats]: [string, any]) => [
            type,
            stats.count,
            stats.revenue.toFixed(2),
            stats.commission.toFixed(2),
          ]),
        ];

        console.log(chalk.bold(`\nPerformance (Last ${options.days} days):\n`));
        console.log(table(data));
      } catch (error: any) {
        spinner.fail('Failed to load performance data');
        console.error(chalk.red(error.message));
      } finally {
        await mongoose.disconnect();
      }
    });
}

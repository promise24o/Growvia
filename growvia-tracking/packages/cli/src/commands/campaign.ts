import { Command } from 'commander';
import mongoose from 'mongoose';
import inquirer from 'inquirer';
import ora from 'ora';
import chalk from 'chalk';
import { table } from 'table';

export function campaignCommands(program: Command) {
  const campaign = program.command('campaign').description('Manage campaigns');

  campaign
    .command('list')
    .description('List all campaigns')
    .option('-o, --org <id>', 'Filter by organization ID')
    .action(async (options) => {
      const spinner = ora('Loading campaigns...').start();

      try {
        await mongoose.connect(process.env.MONGODB_URI!);

        const Campaign = mongoose.model('Campaign');
        const query = options.org ? { organizationId: options.org } : {};
        const campaigns = await Campaign.find(query).limit(50);

        spinner.stop();

        if (campaigns.length === 0) {
          console.log(chalk.yellow('No campaigns found'));
          return;
        }

        const data = [
          ['ID', 'Name', 'Type', 'Status', 'Budget'],
          ...campaigns.map((c: any) => [
            c._id.toString().slice(-8),
            c.name,
            c.type,
            c.status,
            `${c.budget || 0}`,
          ]),
        ];

        console.log(table(data));
        console.log(chalk.green(`\nTotal: ${campaigns.length} campaigns`));
      } catch (error: any) {
        spinner.fail('Failed to load campaigns');
        console.error(chalk.red(error.message));
      } finally {
        await mongoose.disconnect();
      }
    });

  campaign
    .command('create')
    .description('Create a new campaign')
    .action(async () => {
      try {
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'name',
            message: 'Campaign name:',
            validate: (input) => input.length > 0,
          },
          {
            type: 'list',
            name: 'type',
            message: 'Campaign type:',
            choices: ['CPA', 'CPS', 'CPL', 'CPC'],
          },
          {
            type: 'number',
            name: 'budget',
            message: 'Budget (optional):',
          },
        ]);

        const spinner = ora('Creating campaign...').start();

        await mongoose.connect(process.env.MONGODB_URI!);
        const Campaign = mongoose.model('Campaign');

        const campaign = await Campaign.create({
          ...answers,
          status: 'active',
          createdAt: new Date(),
        });

        spinner.succeed(chalk.green(`Campaign created: ${campaign._id}`));
      } catch (error: any) {
        console.error(chalk.red(error.message));
      } finally {
        await mongoose.disconnect();
      }
    });

  campaign
    .command('stats <campaignId>')
    .description('Show campaign statistics')
    .action(async (campaignId) => {
      const spinner = ora('Loading stats...').start();

      try {
        await mongoose.connect(process.env.MONGODB_URI!);
        const TrackingEvent = mongoose.model('TrackingEvent');

        const stats = await TrackingEvent.aggregate([
          { $match: { campaignId: new mongoose.Types.ObjectId(campaignId) } },
          {
            $group: {
              _id: '$type',
              count: { $sum: 1 },
              totalAmount: { $sum: '$amount' },
              totalPayout: { $sum: '$payout' },
            },
          },
        ]);

        spinner.stop();

        if (stats.length === 0) {
          console.log(chalk.yellow('No data found for this campaign'));
          return;
        }

        const data = [
          ['Event Type', 'Count', 'Revenue', 'Payout'],
          ...stats.map((s: any) => [
            s._id,
            s.count,
            s.totalAmount || 0,
            s.totalPayout || 0,
          ]),
        ];

        console.log(table(data));
      } catch (error: any) {
        spinner.fail('Failed to load stats');
        console.error(chalk.red(error.message));
      } finally {
        await mongoose.disconnect();
      }
    });
}

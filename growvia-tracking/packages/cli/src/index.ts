#!/usr/bin/env node

import { Command } from 'commander';
import dotenv from 'dotenv';
import { campaignCommands } from './commands/campaign';
import { affiliateCommands } from './commands/affiliate';
import { analyticsCommands } from './commands/analytics';
import { setupCommands } from './commands/setup';

dotenv.config();

const program = new Command();

program
  .name('growvia')
  .description('Growvia CLI - Manage your affiliate tracking system')
  .version('1.0.0');

// Register command groups
campaignCommands(program);
affiliateCommands(program);
analyticsCommands(program);
setupCommands(program);

program.parse();

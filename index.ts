#!/usr/bin/env tsx
import { Command } from 'commander';
import { registerCommands } from './commands/index';
import { registerBootAction } from './internal/boot';

const program = new Command();
program.name('colleague').description('Personal CLI').version('1.0.0');

await registerCommands(program);
registerBootAction(program);

program.parse();

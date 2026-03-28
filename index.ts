#!/usr/bin/env tsx
import { Command } from 'commander';
import { registerCommands, privateCommandNames } from './commands/index';
import { registerBootAction } from './internal/boot';
import { configureHelp } from './internal/help';

const program = new Command();
program.name('colleague').description('Personal CLI').version('1.0.0');

await registerCommands(program);
registerBootAction(program);
configureHelp(program, privateCommandNames);

program.parse();

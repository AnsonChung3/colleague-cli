import { Command } from 'commander';
import { todo } from './todo';

export { todo as defaultTask };

export async function registerCommands(program: Command) {
  program.command('todo').description('Interactive todo list').action(todo);

  try {
    const { registerPrivateCommands } = await import('./private/index');
    registerPrivateCommands(program);
  } catch {
    // private commands not present
  }
}

import { appendFileSync, readFileSync, writeFileSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { log } from '@clack/prompts';
import type { Command } from 'commander';

// Builds a bash completion script by reading the live command tree from
// the program instance. This means private commands are included automatically
// without any manual updates to this file.
function buildScript(program: Command): string {
  const commandNames = program.commands
    .map(c => c.name())
    .filter(name => name !== 'completion')
    .join(' ');

  // For each command that has options, build a case block so Tab works on
  // flags too (e.g. `colleague stamp --<Tab>` → `--list`)
  const flagCases = program.commands
    .filter(cmd => cmd.options.length > 0 && cmd.name() !== 'completion')
    .map(cmd => {
      const flags = cmd.options.map(o => o.long ?? '').filter(Boolean).join(' ');
      return `    ${cmd.name()})\n      COMPREPLY=(\$(compgen -W "${flags}" -- "$cur"))\n      ;;`;
    })
    .join('\n');

  // Uses COMP_CWORD (the index of the word being completed) instead of
  // matching $prev against the command name. On Windows Git Bash, COMP_WORDS[0]
  // may contain the full path to the script rather than just "colleague",
  // which would break a name-based match.
  return `
# colleague CLI tab completion — added by colleague completion --install
_colleague_completion() {
  local cur="\${COMP_WORDS[COMP_CWORD]}"
  local prev="\${COMP_WORDS[COMP_CWORD-1]}"

  if [[ \${COMP_CWORD} -eq 1 ]]; then
    COMPREPLY=(\$(compgen -W "${commandNames} --help --version" -- "$cur"))
  else
    case "$prev" in
${flagCases}
    esac
  fi
}
complete -F _colleague_completion colleague
`;
}

// Removes any previously installed completion block from ~/.bashrc so the
// relink script can write a fresh one without duplicates.
export function removeCompletion(): void {
  const bashrc = join(homedir(), '.bashrc');
  if (!existsSync(bashrc)) return;

  const content = readFileSync(bashrc, 'utf-8');
  if (!content.includes('_colleague_completion')) return;

  // Strip from the marker comment to the complete line (inclusive)
  const cleaned = content.replace(
    /\n# colleague CLI tab completion[\s\S]*?complete -F _colleague_completion colleague\n/,
    '\n',
  );
  writeFileSync(bashrc, cleaned);
}

// Returns the action function for the completion command. Takes program as a
// parameter so it can read the registered commands at the time the action runs.
export function makeCompletionAction(program: Command) {
  return function (options: { install?: boolean }) {
    const script = buildScript(program);

    if (options.install) {
      // Always remove any old block first so reinstalling is safe to run anytime
      removeCompletion();
      appendFileSync(join(homedir(), '.bashrc'), script);
      log.success('Installed. Run: source ~/.bashrc');
      return;
    }

    // Default: print the script so the user can inspect or pipe it manually
    process.stdout.write(script);
  };
}

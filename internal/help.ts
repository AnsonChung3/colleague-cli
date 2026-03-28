import { Help } from 'commander';
import type { Command } from 'commander';

export function configureHelp(program: Command, privateNames: Set<string>): void {
	program.configureHelp({
		formatHelp(cmd: Command, helper: Help): string {
			// Leaf commands (no subcommands): delegate to Commander's default renderer.
			// This handles `colleague stamp -h` correctly with no extra work.
			if (cmd.commands.length === 0) {
				return Help.prototype.formatHelp.call(helper, cmd, helper);
			}
			return buildRootHelp(cmd, helper, privateNames);
		},
	});
}

function buildRootHelp(cmd: Command, helper: Help, privateNames: Set<string>): string {
	const all = helper.visibleCommands(cmd);
	const pub  = all.filter(c => !privateNames.has(c.name()));
	const priv = all.filter(c =>  privateNames.has(c.name()));

	const maxLen = Math.max(...all.map(c => helper.subcommandTerm(c).length), 0);
	const pad = maxLen + 2;

	const row = (c: Command) =>
		`  ${helper.subcommandTerm(c).padEnd(pad)}${helper.subcommandDescription(c)}`;

	const lines: string[] = [];
	lines.push(`Usage: ${cmd.name()} <command> [args]`, '');
	lines.push(helper.commandDescription(cmd), '');

	if (pub.length > 0) {
		lines.push('Commands:');
		lines.push(...pub.map(row), '');
	}

	if (priv.length > 0) {
		lines.push('Private commands:');
		lines.push(...priv.map(row), '');
	}

	const opts = helper.visibleOptions(cmd);
	if (opts.length > 0) {
		const optPad = Math.max(...opts.map(o => helper.optionTerm(o).length), 0) + 2;
		lines.push('Options:');
		opts.forEach(o =>
			lines.push(`  ${helper.optionTerm(o).padEnd(optPad)}${helper.optionDescription(o)}`)
		);
		lines.push('');
	}

	return lines.join('\n');
}

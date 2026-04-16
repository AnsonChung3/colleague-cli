import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { esmDirname } from './paths';

const __dirname = esmDirname(import.meta.url);
const configFile = join(__dirname, '..', 'config', 'colleague.json');

export type ColleagueConfig = {
	defaultTask: {
		enabled: boolean;
		lineup: string[];
	};
};

const DEFAULT_CONFIG: ColleagueConfig = {
	defaultTask: {
		enabled: true,
		lineup: ['todo'],
	},
};

export function getConfig(): ColleagueConfig {
	if (!existsSync(configFile)) return structuredClone(DEFAULT_CONFIG);
	try {
		return JSON.parse(readFileSync(configFile, 'utf-8')) as ColleagueConfig;
	} catch {
		return structuredClone(DEFAULT_CONFIG);
	}
}

export function setConfig(config: ColleagueConfig): void {
	mkdirSync(dirname(configFile), { recursive: true });
	writeFileSync(configFile, JSON.stringify(config, null, 2));
}

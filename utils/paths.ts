import { fileURLToPath } from 'url';
import { dirname } from 'path';

export function esmDirname(importMetaUrl: string): string {
  return dirname(fileURLToPath(importMetaUrl));
}

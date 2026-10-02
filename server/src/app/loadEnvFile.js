import fs from 'node:fs';

export const loadEnvFile = (filePath) => {
  if (!fs.existsSync(filePath)) return false;
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/i);
    if (!match || line.trim().startsWith('#')) continue;
    const value = match[2].replace(/^(['"])(.*)\1$/, '$2');
    if (value && process.env[match[1]] === undefined) process.env[match[1]] = value;
  }
  return true;
};

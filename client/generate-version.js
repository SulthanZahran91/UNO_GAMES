#!/usr/bin/env node

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Generate version info
const versionInfo = {
  version: `${Date.now()}`, // Use timestamp as version
  buildTime: new Date().toISOString(),
  buildDate: new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }),
};

// Write to public directory (will be copied to dist during build)
const publicDir = join(__dirname, 'public');
const versionFilePath = join(publicDir, 'version.json');

try {
  // Ensure public directory exists
  if (!existsSync(publicDir)) {
    mkdirSync(publicDir, { recursive: true });
  }

  writeFileSync(versionFilePath, JSON.stringify(versionInfo, null, 2));
  console.log('✅ Generated version.json:', versionInfo);
} catch (error) {
  console.error('❌ Failed to generate version.json:', error);
  process.exit(1);
}

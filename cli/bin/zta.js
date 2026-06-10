#!/usr/bin/env node

import { runWizard } from '../src/index.js';

runWizard().catch(err => {
  console.error('An unexpected error occurred in ZTA setup:', err);
  process.exit(1);
});

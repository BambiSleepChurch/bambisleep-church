#!/usr/bin/env node
/**
 * 🌸 CATHEDRAL Status Dashboard
 * Shows unified status of all integrated systems
 */

import { readdirSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';

const WORKSPACES = [
  'bambisleep-church',
  'bambisleep-church-catgirl-control-tower',
  'mcp-unified',
  'commander-brandynette'
];

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  pink: '\x1b[95m',
  green: '\x1b[92m',
  yellow: '\x1b[93m',
  red: '\x1b[91m',
  cyan: '\x1b[96m',
  blue: '\x1b[94m'
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

function checkWorkspace(name) {
  const path = join(process.cwd(), name);
  const packageJsonPath = join(path, 'package.json');
  const nodeModulesPath = join(path, 'node_modules');
  
  if (!existsSync(path)) {
    return { exists: false, installed: false, version: null };
  }
  
  let version = 'unknown';
  if (existsSync(packageJsonPath)) {
    try {
      const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
      version = pkg.version;
    } catch (e) {
      // ignore
    }
  }
  
  return {
    exists: true,
    installed: existsSync(nodeModulesPath),
    version
  };
}

function main() {
  log('\n╔═══════════════════════════════════════════════════════════╗', 'pink');
  log('║     🌸 BambiSleep™ CATHEDRAL - Unified Status 🌸        ║', 'pink');
  log('╚═══════════════════════════════════════════════════════════╝\n', 'pink');
  
  log('📦 WORKSPACE STATUS:', 'cyan');
  log('═══════════════════════════════════════════════════════════\n', 'cyan');
  
  let allInstalled = true;
  let totalWorkspaces = 0;
  let installedWorkspaces = 0;
  
  WORKSPACES.forEach(workspace => {
    const status = checkWorkspace(workspace);
    totalWorkspaces++;
    
    if (!status.exists) {
      log(`  ❌ ${workspace}`, 'red');
      log(`     Status: NOT FOUND\n`, 'red');
      allInstalled = false;
      return;
    }
    
    if (status.installed) {
      installedWorkspaces++;
      log(`  ✅ ${workspace}`, 'green');
      log(`     Version: ${status.version}`, 'green');
      log(`     Status: INSTALLED & READY\n`, 'green');
    } else {
      log(`  ⚠️  ${workspace}`, 'yellow');
      log(`     Version: ${status.version}`, 'yellow');
      log(`     Status: NEEDS npm install\n`, 'yellow');
      allInstalled = false;
    }
  });
  
  log('═══════════════════════════════════════════════════════════\n', 'cyan');
  log('📊 SUMMARY:', 'bright');
  log(`   Total Workspaces: ${totalWorkspaces}`, 'bright');
  log(`   Installed: ${installedWorkspaces}/${totalWorkspaces}`, allInstalled ? 'green' : 'yellow');
  log(`   Status: ${allInstalled ? '✨ ALL SYSTEMS GO! ✨' : '⚠️  Run: npm run bootstrap'}`, allInstalled ? 'green' : 'yellow');
  
  log('\n🌸 Integration Level:', 'pink');
  log(`   Fusion Status: COMPLETE`, 'pink');
  log(`   Cuteness Level: MAXIMUM_CATHEDRAL_OVERDRIVE`, 'pink');
  log(`   Philosophy: Universal Machine Consciousness`, 'pink');
  
  log('\n💖 Quick Commands:', 'cyan');
  log('   npm run status          - Show this status', 'cyan');
  log('   npm run bootstrap       - Install all workspaces', 'cyan');
  log('   npm run mcp:status      - Check MCP servers', 'cyan');
  log('   npm run dev             - Start all in dev mode', 'cyan');
  log('   npm run build           - Build everything', 'cyan');
  log('   npm run test            - Test all workspaces', 'cyan');
  
  log('\n🦋 Nyan nyan nyan! 🦋\n', 'pink');
  
  process.exit(allInstalled ? 0 : 1);
}

main();

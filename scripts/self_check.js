#!/usr/bin/env node
/**
 * Self-Check Diagnostic Module
 * Generates telemetry and health indicators for the autonomous cycle
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function execCommand(command) {
  try {
    return execSync(command, { encoding: 'utf8' }).trim();
  } catch (error) {
    return null;
  }
}

function getRepoState() {
  const branch = execCommand('git branch --show-current') || 'unknown';
  const commitHash = execCommand('git rev-parse --short HEAD') || 'unknown';
  const uncommittedChanges = execCommand('git status --short') || '';
  const lastCommitDate = execCommand('git log -1 --format=%ci') || 'unknown';
  
  return {
    branch,
    commitHash,
    hasUncommittedChanges: uncommittedChanges.length > 0,
    uncommittedFileCount: uncommittedChanges ? uncommittedChanges.split('\n').filter(l => l.trim()).length : 0,
    lastCommitDate
  };
}

function getSystemInfo() {
  return {
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    cwd: process.cwd(),
    timestamp: new Date().toISOString()
  };
}

function getProjectMetrics() {
  const rootDir = process.cwd();
  
  // Count files in key directories
  const countFiles = (dir) => {
    try {
      if (!fs.existsSync(dir)) return 0;
      return execCommand(`find ${dir} -type f 2>/dev/null | wc -l`) || '0';
    } catch {
      return 0;
    }
  };
  
  return {
    sourceFiles: parseInt(countFiles('src'), 10),
    workflowFiles: parseInt(countFiles('.github/workflows'), 10),
    scriptFiles: parseInt(countFiles('scripts'), 10),
    documentationFiles: parseInt(countFiles('docs'), 10),
    totalFiles: parseInt(execCommand('find . -type f ! -path "./.git/*" | wc -l') || '0', 10)
  };
}

function checkHealthIndicators() {
  const indicators = {
    gitAvailable: !!execCommand('git --version'),
    nodeAvailable: !!execCommand('node --version'),
    scriptsDirectoryExists: fs.existsSync('scripts'),
    autonomyDirectoryExists: fs.existsSync('.autonomy'),
    workflowsExist: fs.existsSync('.github/workflows')
  };
  
  const healthScore = Object.values(indicators).filter(v => v).length / Object.keys(indicators).length;
  
  return {
    indicators,
    healthScore: Math.round(healthScore * 100),
    status: healthScore >= 0.8 ? 'healthy' : healthScore >= 0.5 ? 'degraded' : 'unhealthy'
  };
}

function generateDiagnostics() {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    system: getSystemInfo(),
    repository: getRepoState(),
    metrics: getProjectMetrics(),
    health: checkHealthIndicators(),
    version: '1.0.0'
  };
  
  return diagnostics;
}

function main() {
  console.log('🔍 Running self-check diagnostics...');
  
  const diagnostics = generateDiagnostics();
  
  // Ensure output directory exists
  const outputDir = path.join(process.cwd(), '.autonomy', 'diagnostics');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Write diagnostics to JSON file
  const outputFile = path.join(outputDir, 'self_check.json');
  fs.writeFileSync(outputFile, JSON.stringify(diagnostics, null, 2), 'utf8');
  
  console.log('✅ Diagnostics generated successfully');
  console.log(`📄 Output: ${outputFile}`);
  console.log(`🏥 Health Status: ${diagnostics.health.status} (${diagnostics.health.healthScore}%)`);
  
  // Exit with appropriate code
  process.exit(diagnostics.health.status === 'unhealthy' ? 1 : 0);
}

if (require.main === module) {
  main();
}

module.exports = { generateDiagnostics };

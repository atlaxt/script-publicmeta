#!/usr/bin/env node
'use strict'

const fs = require('node:fs')
const path = require('node:path')
const readline = require('node:readline')

const PREBUILD_CMD = 'to-public'
const pkgPath = path.resolve(process.cwd(), 'package.json')
const configPath = path.resolve(process.cwd(), 'to-public.config.json')

if (!fs.existsSync(pkgPath)) {
  process.stderr.write('[to-public] package.json not found in current directory.\n')
  process.exit(1)
}

const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))

const ownVersion = require('./package.json').version
if (!pkg.devDependencies) pkg.devDependencies = {}
if (!pkg.devDependencies['@atlaxt/to-public']) {
  pkg.devDependencies['@atlaxt/to-public'] = `^${ownVersion}`
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8')
  process.stdout.write(`[to-public] Added @atlaxt/to-public@^${ownVersion} to devDependencies.\n`)
}

if (!pkg.scripts) pkg.scripts = {}
if (pkg.scripts.prebuild && pkg.scripts.prebuild !== PREBUILD_CMD) {
  process.stdout.write(`[to-public] prebuild already set: "${pkg.scripts.prebuild}" — skipping.\n`)
} else if (pkg.scripts.prebuild === PREBUILD_CMD) {
  process.stdout.write('[to-public] prebuild already configured.\n')
} else {
  pkg.scripts.prebuild = PREBUILD_CMD
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8')
  process.stdout.write('[to-public] Added prebuild script to package.json.\n')
}

// ─────────────────────────────────────────────────────────────────────────────
// Config panel
// ─────────────────────────────────────────────────────────────────────────────

const isTTY = Boolean(process.stdout.isTTY)
const c = (code, str) => isTTY ? `\x1B[${code}m${str}\x1B[0m` : str

// Interactive terminal → show config panel, then run
// Non-interactive (CI, prebuild script) → run directly
if (process.stdin.isTTY) {
  runConfigSetup()
} else {
  require('./to-public.cjs')
}

function loadConfig() {
  if (fs.existsSync(configPath)) {
    try { return JSON.parse(fs.readFileSync(configPath, 'utf8')) } catch {}
  }
  return { outputPath: 'public/meta.json', include: null, exclude: null }
}

function saveConfig(config) {
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf8')
}

function displayConfig(config) {
  const includeVal = config.include ? c('33', config.include.join(', ')) : c('2', '(all fields)')
  const excludeVal = config.exclude ? c('33', config.exclude.join(', ')) : c('2', '(none)')

  process.stdout.write('\n')
  process.stdout.write(c('1', '  @atlaxt/to-public — Config\n'))
  process.stdout.write('  ' + c('2', '─'.repeat(40)) + '\n')
  process.stdout.write(`  ${c('36', '1)')} outputPath   ${c('2', '→')}  ${c('33', config.outputPath)}\n`)
  process.stdout.write(`  ${c('36', '2)')} include      ${c('2', '→')}  ${includeVal}\n`)
  process.stdout.write(`  ${c('36', '3)')} exclude      ${c('2', '→')}  ${excludeVal}\n`)
  process.stdout.write('  ' + c('2', '─'.repeat(40)) + '\n')
  process.stdout.write(`  ${c('2', 'Enter → save & run   q → quit')}\n\n`)
}

function runConfigSetup() {
  const config = loadConfig()
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  const ask = q => new Promise(resolve => rl.question(q, resolve))

  async function menu() {
    displayConfig(config)
    const choice = (await ask('  > ')).trim().toLowerCase()

    if (choice === 'q') {
      rl.close()
      return
    }

    if (choice === '' || choice === 's') {
      saveConfig(config)
      process.stdout.write(c('32', '\n  ✔ Config saved.\n\n'))
      rl.close()
      require('./to-public.cjs')
      return
    }

    if (choice === '1') {
      const val = (await ask(`  outputPath [${config.outputPath}]: `)).trim()
      if (val) config.outputPath = val
    } else if (choice === '2') {
      const current = config.include ? config.include.join(', ') : ''
      const val = (await ask(`  include fields (comma-separated, empty = all) [${current || 'all'}]: `)).trim()
      config.include = val ? val.split(',').map(s => s.trim()).filter(Boolean) : null
    } else if (choice === '3') {
      const current = config.exclude ? config.exclude.join(', ') : ''
      const val = (await ask(`  exclude fields (comma-separated, empty = none) [${current || 'none'}]: `)).trim()
      config.exclude = val ? val.split(',').map(s => s.trim()).filter(Boolean) : null
    }

    await menu()
  }

  menu().catch(err => {
    process.stderr.write(`[to-public] ${err.message}\n`)
    rl.close()
    process.exit(1)
  })
}

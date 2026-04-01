#!/usr/bin/env node
'use strict'

const fs = require('node:fs')
const path = require('node:path')
const readline = require('node:readline')

const PREBUILD_CMD = 'to-public'
const pkgPath = path.resolve(process.cwd(), 'package.json')
const configPathCjs = path.resolve(process.cwd(), 'to-public.config.cjs')
const configPathJson = path.resolve(process.cwd(), 'to-public.config.json')
const args = process.argv.slice(2)
const wantsConfigPanel = args.includes('--config') || args.includes('-c')

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

// Show config panel only on first run (no config yet) or when explicitly requested.
if (process.stdin.isTTY && (wantsConfigPanel || !hasSavedConfig())) {
  runConfigSetup()
} else {
  require('./to-public.cjs')
}

function hasSavedConfig() {
  return fs.existsSync(configPathCjs) || fs.existsSync(configPathJson)
}

function getExistingConfigPath() {
  if (fs.existsSync(configPathCjs)) return configPathCjs
  if (fs.existsSync(configPathJson)) return configPathJson
  return null
}

function readConfigFile(filePath) {
  if (filePath.endsWith('.cjs')) {
    delete require.cache[require.resolve(filePath)]
    return require(filePath)
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function loadConfig() {
  const existingPath = getExistingConfigPath()
  if (existingPath) {
    try {
      return {
        outputPath: 'public/meta.json',
        includeDependencies: false,
        ...readConfigFile(existingPath),
      }
    } catch {}
  }
  return { outputPath: 'public/meta.json', includeDependencies: false }
}

function saveConfig(config) {
  const content = `/**
 * to-public config
 *
 * outputPath: Output file path (relative to project root)
 * includeDependencies:
 *   false -> output only version + buildDate
 *   true  -> also output dependencies as a string[] (names only)
 */
module.exports = {
  outputPath: ${JSON.stringify(config.outputPath)},
  includeDependencies: ${JSON.stringify(config.includeDependencies)},
}
`

  fs.writeFileSync(configPathCjs, content, 'utf8')
}

function displayConfig(config) {
  const includeDepsVal = config.includeDependencies ? c('32', 'true') : c('2', 'false')

  process.stdout.write('\n')
  process.stdout.write(c('1', '  @atlaxt/to-public — Config\n'))
  process.stdout.write('  ' + c('2', '─'.repeat(40)) + '\n')
  process.stdout.write(`  ${c('36', '1)')} outputPath            ${c('2', '→')}  ${c('33', config.outputPath)}\n`)
  process.stdout.write(`  ${c('36', '2)')} includeDependencies   ${c('2', '→')}  ${includeDepsVal}\n`)
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
      config.includeDependencies = !config.includeDependencies
      process.stdout.write(c('32', `  includeDependencies => ${String(config.includeDependencies)}\n`))
    }

    await menu()
  }

  menu().catch(err => {
    process.stderr.write(`[to-public] ${err.message}\n`)
    rl.close()
    process.exit(1)
  })
}

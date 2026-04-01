#!/usr/bin/env node 
/* eslint-disable */
// @ts-nocheck
// prettier-ignore

/**
 * @file @atlaxt/to-public
 * @description
 *   Reads `package.json` and writes a sanitised, public-safe JSON file.
 *   No CLI flags — configure once in the CONFIG block below.
 *
 * @author Atlas Yiğit Aydın <https://atlaxt.me>
 */

// ─────────────────────────────────────────────────────────────────────────────
// ⚠  SETUP REQUIRED
//    Add this script to your build pipeline before it runs:
//
//    "scripts": {
//      "prebuild": "node meta.cjs"
//    }
//
//    That's it. npm will run it automatically before every build.
// ─────────────────────────────────────────────────────────────────────────────

'use strict'

const fs = require('node:fs')
const path = require('node:path')

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG — Edit this block once. Never touch again.
// ─────────────────────────────────────────────────────────────────────────────

const CONFIG = {
  /**
   * Output file path (relative to project root).
   * @type {string}
   */
  outputPath: 'public/meta.json',

  /**
   * Include dependency names in output.
   * false -> output only version + buildDate
   * true  -> add `dependencies: string[]` (names only, no versions)
   * @type {boolean}
   */
  includeDependencies: false,
}

// ─────────────────────────────────────────────────────────────────────────────
// internals — do not edit below this line
// ─────────────────────────────────────────────────────────────────────────────

const isTTY = Boolean(process.stdout.isTTY)

/**
 * Returns an ANSI-coloured string, but only in TTY environments.
 * In CI or piped output, returns the plain string.
 *
 * @param {string} code  - ANSI escape code (e.g. '32' for green).
 * @param {string} str   - The string to colour.
 * @returns {string}
 */
function ansi(code, str) {
  return isTTY ? `\x1B[${code}m${str}\x1B[0m` : str
}

const TAG = ansi('1', '[to-public]')

/**
 * Writes a formatted log line to stdout or stderr.
 *
 * @param {'info'|'warn'|'error'|'success'} level
 * @param {string} message
 */
function log(level, message) {
  const levels = {
    info: { icon: ansi('36', 'ℹ'), stream: process.stdout },
    warn: { icon: ansi('33', '⚠'), stream: process.stderr },
    error: { icon: ansi('31', '✖'), stream: process.stderr },
    success: { icon: ansi('32', '✔'), stream: process.stdout },
  }
  const { icon, stream } = levels[level] ?? levels.info
  stream.write(`${icon}  ${TAG} ${message}\n`)
}

/**
 * Logs an error and exits the process with code 1.
 *
 * @param {string} message
 * @returns {never}
 */
function fatal(message) {
  log('error', message)
  process.exit(1)
}

/**
 * Reads and JSON-parses `package.json` from the given path.
 *
 * @param {string} pkgPath
 * @returns {Record<string, unknown>}
 */
function readPackageJson(pkgPath) {
  if (!fs.existsSync(pkgPath)) {
    fatal(`package.json not found at: ${pkgPath}`)
  }

  let raw
  try {
    raw = fs.readFileSync(pkgPath, 'utf8')
  }
  catch (err) {
    fatal(`Cannot read package.json: ${err.message}`)
  }

  try {
    return JSON.parse(raw)
  }
  catch (err) {
    fatal(`package.json is not valid JSON: ${err.message}`)
  }
}

/**
 * Builds the public payload.
 *
 * Always includes:
 *  - version
 *  - buildDate
 *
 * Optionally includes:
 *  - dependencies (package names only)
 *
 * @param {Record<string, unknown>} pkg
 * @returns {Record<string, unknown>}
 */
function buildPayload(pkg) {
  const payload = {
    version: typeof pkg.version === 'string' ? pkg.version : null,
    buildDate: new Date().toISOString(),
  }

  if (CONFIG.includeDependencies) {
    payload.dependencies = Object.keys(pkg.dependencies ?? {}).sort()
  }

  return payload
}

/**
 * Ensures the output directory exists, then writes the JSON file.
 *
 * @param {string} outputPath - Absolute path to the output file.
 * @param {Record<string, unknown>} payload
 */
function writePayload(outputPath, payload) {
  const outputDir = path.dirname(outputPath)

  if (!fs.existsSync(outputDir)) {
    try {
      fs.mkdirSync(outputDir, { recursive: true })
      log('info', `Created directory: ${outputDir}`)
    }
    catch (err) {
      fatal(`Cannot create output directory: ${err.message}`)
    }
  }

  try {
    fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2), 'utf8')
  }
  catch (err) {
    fatal(`Cannot write output file: ${err.message}`)
  }

  log('success', `Generated → ${ansi('32', outputPath)}`)
}

// ─────────────────────────────────────────────────────────────────────────────
// Bootstrap
// ─────────────────────────────────────────────────────────────────────────────

;(function main() {
  const root = process.cwd()
  const pkgPath = path.resolve(root, 'package.json')

  const configFilePathCjs = path.resolve(root, 'to-public.config.cjs')
  const configFilePathJson = path.resolve(root, 'to-public.config.json')
  const configFilePath = fs.existsSync(configFilePathCjs)
    ? configFilePathCjs
    : configFilePathJson

  if (fs.existsSync(configFilePath)) {
    try {
      const external = configFilePath.endsWith('.cjs')
        ? (() => {
            delete require.cache[require.resolve(configFilePath)]
            return require(configFilePath)
          })()
        : JSON.parse(fs.readFileSync(configFilePath, 'utf8'))
      Object.assign(CONFIG, external)
    }
    catch (err) {
      log('warn', `Could not parse ${path.basename(configFilePath)}: ${err.message}`)
    }
  }

  const outputPath = path.resolve(root, CONFIG.outputPath)

  const pkg = readPackageJson(pkgPath)
  const payload = buildPayload(pkg)

  writePayload(outputPath, payload)
})()

// ─────────────────────────────────────────────────────────────────────────────
// PACKAGE.JSON FIELD REFERENCE
// ─────────────────────────────────────────────────────────────────────────────
//
// The following fields may appear in a package.json file.
// Full specification → https://docs.npmjs.com/cli/v10/configuring-npm/package-json
//
// ── Identity ────────────────────────────────────────────────────────────────
//   name          Package name. Must be lowercase; hyphens allowed.
//   version       Semantic version string (e.g. "1.0.0"). → https://semver.org
//   description   Short summary. Appears in npm search results.
//   keywords      Discovery tags. Array of strings.
//   license       License identifier (e.g. "MIT"). → https://spdx.org/licenses
//
// ── Ownership & Contact ──────────────────────────────────────────────────────
//   author        Primary author. String or { name, email, url } object.
//   contributors  Additional authors. Array in the same format as author.
//   funding       Financial support info. → https://docs.npmjs.com/cli/v10/configuring-npm/package-json#funding
//
// ── Links ────────────────────────────────────────────────────────────────────
//   homepage      Project website URL.
//   repository    Source code location. { type, url } object.
//   bugs          Issue tracker URL or email. { url, email } object.
//
// ── Entry Points ─────────────────────────────────────────────────────────────
//   main          CommonJS entry file (e.g. "index.cjs").
//   module        ESM entry file (e.g. "index.mjs"). Non-standard; read by bundlers.
//   exports       Modern entry point map. Supersedes main.
//                 → https://nodejs.org/api/packages.html#exports
//   bin           CLI command definition. { "command-name": "./bin/cli.cjs" }
//   browser       Alternative entry point for browser environments.
//
// ── Dependencies ─────────────────────────────────────────────────────────────
//   dependencies          Runtime dependencies.
//   devDependencies       Development-only dependencies.
//   peerDependencies      Dependencies the consumer is expected to install.
//   optionalDependencies  Installation failure is non-fatal.
//   bundledDependencies   Dependencies shipped inside the package itself.
//
// ── Environment & Compatibility ──────────────────────────────────────────────
//   engines       Supported Node / npm version ranges. { node: ">=18" }
//   os            Supported operating systems. ["linux", "darwin"]
//   cpu           Supported CPU architectures. ["x64", "arm64"]
//
// ── File Control ─────────────────────────────────────────────────────────────
//   files         Allowlist of files and folders published to npm.
//                 Works like .gitignore in reverse; everything else is excluded.
//
// ── Behaviour ────────────────────────────────────────────────────────────────
//   scripts       Commands executed via npm run <name>.
//   config        Key/value store readable in scripts via process.env.npm_package_config_*
//   private       If true, prevents accidental publish to npm.
//   type          "module" → ESM, "commonjs" → CJS (default).
//   workspaces    Monorepo sub-package paths. ["packages/*"]
//
// ─────────────────────────────────────────────────────────────────────────────

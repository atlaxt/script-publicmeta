#!/usr/bin/env node
'use strict'

const fs = require('node:fs')
const path = require('node:path')

const PREBUILD_CMD = 'npx @atlaxt/to-public'
const pkgPath = path.resolve(process.cwd(), 'package.json')

if (!fs.existsSync(pkgPath)) {
  process.stderr.write('[publicmeta] package.json not found in current directory.\n')
  process.exit(1)
}

const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))

if (!pkg.scripts) pkg.scripts = {}

if (pkg.scripts.prebuild && pkg.scripts.prebuild !== PREBUILD_CMD) {
  process.stdout.write(`[publicmeta] prebuild already set: "${pkg.scripts.prebuild}" — skipping.\n`)
} else if (pkg.scripts.prebuild === PREBUILD_CMD) {
  process.stdout.write('[publicmeta] prebuild already configured.\n')
} else {
  pkg.scripts.prebuild = PREBUILD_CMD
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8')
  process.stdout.write('[publicmeta] Added prebuild script to package.json.\n')
}

require('./publicmeta.cjs')

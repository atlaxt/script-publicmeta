# @atlaxt/to-public

Reads your `package.json` and writes a sanitised, public-safe `public/meta.json` — automatically, before every build.

## Setup

```bash
npx @atlaxt/to-public
```

That's it. This command:

1. Generates `public/meta.json` from your `package.json`
2. Adds `"prebuild": "npx @atlaxt/to-public"` to your `package.json` so it runs automatically before every build

## Configuration

Open the generated `publicmeta.cjs` and edit the `CONFIG` block at the top:

```js
const CONFIG = {
  outputPath: 'public/meta.json',  // where to write the output

  // Remove specific fields from the output
  exclude: ['scripts', 'devDependencies'],

  // Or keep only specific fields (takes priority over exclude)
  include: ['name', 'version', 'description', 'homepage'],
}
```

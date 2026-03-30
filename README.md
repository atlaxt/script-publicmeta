# @atlaxt/to-public

Reads your `package.json` and writes a sanitised, public-safe `public/meta.json` — automatically, before every build.

## Setup

### npm

```bash
npm install -D @atlaxt/to-public
npx to-public
```

### pnpm

```bash
pnpm add -D @atlaxt/to-public
pnpm exec to-public
```

That's it. This command:

1. Generates `public/meta.json` from your `package.json`
2. Adds `"prebuild": "to-public"` to your `package.json` so it regenerates automatically before every build

## Configuration

Open `to-public.cjs` in your project and edit the `CONFIG` block at the top:

```js
const CONFIG = {
  outputPath: 'public/meta.json',  // where to write the output

  // Remove specific fields from the output
  exclude: ['scripts', 'devDependencies'],

  // Or keep only specific fields (takes priority over exclude)
  include: ['name', 'version', 'description', 'homepage'],
}
```

## Output example

```json
{
  "name": "my-app",
  "version": "1.0.0",
  "description": "My awesome app",
  "homepage": "https://example.com"
}
```

## License

MIT — [Atlas Yigit Aydin](https://atlaxt.me)

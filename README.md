# @atlaxt/to-public

Reads your `package.json` and writes a minimal `public/meta.json` automatically before every build.

Default output:

- `version`
- `buildDate`

Optional output:

- `dependencies` (string array with package names only, no version values)

## Setup

```bash
npx @atlaxt/to-public
```

That's it. First run opens an interactive config panel in your terminal. Configure, hit Enter, and the file is generated.

This command also:

- Adds `@atlaxt/to-public` to `devDependencies` (if not already there)
- Adds `"prebuild": "to-public"` to your `package.json`

From then on, `meta.json` regenerates automatically before every build.

## Config panel

The panel appears on first run (when no config file exists). It lets you set:

| Option | Description |
| --- | --- |
| `outputPath` | Where to write the output file (default: `public/meta.json`) |
| `includeDependencies` | `false` by default. When `true`, adds dependency names as `string[]` |

Settings are saved to `to-public.config.cjs` in your project root with inline comments. You can also edit it manually:

```js
/**
 * to-public config
 */
module.exports = {
  outputPath: 'public/meta.json',
  includeDependencies: false,
}
```

Legacy `to-public.config.json` is still supported.

> When running as a prebuild script (non-interactive), the panel is skipped and the file is generated directly using the saved config.

To reopen the panel after setup, run:

```bash
npx @atlaxt/to-public --config
```

## Output examples

`includeDependencies: false`

```json
{
  "version": "1.2.3",
  "buildDate": "2026-04-01T12:34:56.789Z"
}
```

`includeDependencies: true`

```json
{
  "version": "1.2.3",
  "buildDate": "2026-04-01T12:34:56.789Z",
  "dependencies": ["react", "zod", "zustand"]
}
```

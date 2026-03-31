# @atlaxt/to-public

Reads your `package.json` and writes a sanitised, public-safe `public/meta.json` — automatically, before every build.

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

The panel appears on every direct `npx` invocation. It lets you set:

| Option | Description |
| --- | --- |
| `outputPath` | Where to write the output file (default: `public/meta.json`) |
| `include` | Keep only these fields (empty = all fields) |
| `exclude` | Remove these fields from output |

Settings are saved to `to-public.config.json` in your project root. You can also edit it manually:

```json
{
  "outputPath": "public/meta.json",
  "include": ["name", "version", "description", "homepage"],
  "exclude": null
}
```

> When running as a prebuild script (non-interactive), the panel is skipped and the file is generated directly using the saved config.


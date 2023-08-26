this was in src/pages/og-image/[slug].png.ts

but was removed because of

```bash
src/pages/index.astro
  └─ /index.html (+1ms)
λ src/pages/og-image/[slug].png.ts
 error   Expected "slug" to match "[^\/#\?]+?", but got "en/hi-mdx"
  File:
    /home/daniel/pro/gustawdaniel/node_modules/.pnpm/path-to-regexp@6.2.1/node_modules/path-to-regexp/dist/index.js:229:27
  Code:
    228 |                 if (validate && !matches[i].test(segment)) {
    > 229 |                     throw new TypeError("Expected \"".concat(token.name, "\" to match \"").concat(token.pattern, "\", but got \"").concat(segment, "\""));
          |                           ^
      230 |                 }
      231 |                 path += token.prefix + segment + token.suffix;
      232 |                 continue;
  Stacktrace:
TypeError: Expected "slug" to match "[^\/#\?]+?", but got "en/hi-mdx"
    at Object.generate (/home/daniel/pro/gustawdaniel/node_modules/.pnpm/path-to-regexp@6.2.1/node_modules/path-to-regexp/dist/index.js:229:27)
    at stringifyParams (file:///home/daniel/pro/gustawdaniel/node_modules/.pnpm/astro@2.10.8_sharp@0.32.0/node_modules/astro/dist/core/routing/params.js:23:31)
    at callGetStaticPaths (file:///home/daniel/pro/gustawdaniel/node_modules/.pnpm/astro@2.10.8_sharp@0.32.0/node_modules/astro/dist/core/render/route-cache.js:42:23)
    at async getPathsForRoute (file:///home/daniel/pro/gustawdaniel/node_modules/.pnpm/astro@2.10.8_sharp@0.32.0/node_modules/astro/dist/core/build/generate.js:217:25)
    at async generatePage (file:///home/daniel/pro/gustawdaniel/node_modules/.pnpm/astro@2.10.8_sharp@0.32.0/node_modules/astro/dist/core/build/generate.js:198:17)
    at async generatePages (file:///home/daniel/pro/gustawdaniel/node_modules/.pnpm/astro@2.10.8_sharp@0.32.0/node_modules/astro/dist/core/build/generate.js:131:7)
    at async staticBuild (file:///home/daniel/pro/gustawdaniel/node_modules/.pnpm/astro@2.10.8_sharp@0.32.0/node_modules/astro/dist/core/build/static-build.js:86:7)
    at async AstroBuilder.build (file:///home/daniel/pro/gustawdaniel/node_modules/.pnpm/astro@2.10.8_sharp@0.32.0/node_modules/astro/dist/core/build/index.js:121:5)
    at async AstroBuilder.run (file:///home/daniel/pro/gustawdaniel/node_modules/.pnpm/astro@2.10.8_sharp@0.32.0/node_modules/astro/dist/core/build/index.js:152:7)
    at async build (file:///home/daniel/pro/gustawdaniel/node_modules/.pnpm/astro@2.10.8_sharp@0.32.0/node_modules/astro/dist/core/build/index.js:37:3)
    at async build (file:///home/daniel/pro/gustawdaniel/node_modules/.pnpm/astro@2.10.8_sharp@0.32.0/node_modules/astro/dist/cli/build/index.js:20:3)
    at async runCommand (file:///home/daniel/pro/gustawdaniel/node_modules/.pnpm/astro@2.10.8_sharp@0.32.0/node_modules/astro/dist/cli/index.js:110:7)
    at async cli (file:///home/daniel/pro/gustawdaniel/node_modules/.pnpm/astro@2.10.8_sharp@0.32.0/node_modules/astro/dist/cli/index.js:148:5)
```

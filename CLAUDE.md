# Project Instructions

## Import aliases

Use the `~` alias for intra-`src` imports: `~<path>` maps to `src/<path>`. It's a
single wildcard (`~*` → `./src/*`), so new top-level folders under `src/` work with
no config change. Do not reintroduce the `@/` alias.

```ts
import { Icon } from '~components/atoms/Icon';
import { useMixes } from '~api/hooks';
import { cn } from '~lib/cn';
```

## No index.ts barrel files

Do not create `index.ts` (or `index.tsx`) files. Import directly from the source file:

```ts
// bad
import { Foo } from '~components/atoms';

// good
import { Foo } from '~components/atoms/Foo';
```

# ABI Bookmarks

Fork of [abi.ninja](https://github.com/BuidlGuidl/abi.ninja) (Scaffold-ETH 2 based).
Interact with smart contracts on any EVM chain using localStorage-persisted ABI bookmarks.

## Project Structure

Yarn workspaces monorepo. The Next.js app lives in `packages/nextjs/`.

- **Pages Router** (Next.js 14) — not App Router
- **Styling**: Tailwind CSS + DaisyUI
- **Web3**: wagmi v2, viem, RainbowKit
- **State**: Zustand (`services/store/store.ts`)
- **Barrel exports**: `components/scaffold-eth/index.tsx` re-exports everything — be careful with import side effects

## Key Files

- `scaffold.config.ts` — target networks, Alchemy/WalletConnect keys
- `utils/abiBookmarks.ts` — localStorage CRUD for bookmarks + recent contracts
- `components/scaffold-eth/Contract/` — ContractUI, MethodSelector, ReadOnlyFunctionForm, WriteOnlyFunctionForm, CustomCallForm
- `pages/[contractAddress]/[network].tsx` — contract detail page (uses `getServerSideProps`)
- `pages/index.tsx` — home page (static)
- `middleware.ts` — redirects bare `/{address}` to `/{address}/1`

## Vercel Deployment

**Critical learnings from deployment:**

1. **Framework Preset must be "Next.js"** in Vercel Settings > General. If set to "Other", static pages work but serverless functions 404.

2. **Root Directory**: Set to `packages/nextjs` with "Include files outside root directory" enabled.

3. **EMFILE (too many open files)**: viem has hundreds of ESM modules. On Vercel serverless functions, cold-starting a page with `getServerSideProps` can exceed the file descriptor limit. Fix: add `viem` to `transpilePackages` in `next.config.mjs` so webpack bundles it into fewer files.

4. **`outputFileTracingRoot`**: Must be set to the monorepo root (`path.join(__dirname, "../../")`) in `next.config.mjs` for efficient serverless function bundling.

5. **Edge Runtime vs Node.js**: The `pages/api/og.tsx` must use `runtime: "nodejs"` (not `"edge"`). The barrel export `utils/scaffold-eth/index.ts` pulls in `@ethersproject` → `js-sha3` → `process.versions` which crashes in Edge Runtime.

6. **Middleware matcher**: Must be tightly scoped (`"/:path(0x[a-fA-F0-9]{40})"`) to avoid Edge Runtime bundling unrelated dependencies.

7. **Node version**: Pin to 20.x in Vercel dashboard AND `.nvmrc`.

## Git Conventions

- Author: Lazaro Raul <riglesiasvera@gmail.com>
- Co-author: `Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>`
- Run prettier without asking: `yarn workspace @se-2/nextjs format`

## Etherscan/Heimdall Hooks

The hooks `useFetchContractAbi` and `useHeimdall` are **unplugged** (not imported/used) but **not deleted** — preserved for potential future reuse.

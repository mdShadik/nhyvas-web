This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### Environment

Copy `nhyvas-web/.env.example` to `nhyvas-web/.env.local` and fill:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (Supabase anon key)
- `NEXT_PUBLIC_SUPABASE_KYC_BUCKET`
- `NEXT_PUBLIC_R2_PUBLIC_BASE_URL`
- `NEXT_PUBLIC_R2_SIGN_URL`

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Cloudflare

This app is configured for Cloudflare Workers via the OpenNext adapter. Full-stack Next.js apps with API routes should use the Workers/OpenNext path; Cloudflare Pages is only appropriate for static Next output.

Install dependencies, then preview or deploy:

```bash
npm install
npm run preview
npm run deploy
```

Workers AI is configured in `wrangler.jsonc` through the `AI` binding. The AI search embeddings use `@cf/baai/bge-small-en-v1.5`, which returns 384-dimensional vectors.

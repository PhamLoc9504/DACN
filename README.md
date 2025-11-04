This is a Next.js app for Warehouse Management (Quản lý kho hàng) using Supabase.

## Getting Started

First, create `.env.local` with your Supabase keys:

```
NEXT_PUBLIC_SUPABASE_URL=https://vvfyrmokhzekpxwqdixg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2ZnlybW9raHpla3B4d3FkaXhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4MzYxODgsImV4cCI6MjA3NzQxMjE4OH0.wbIvlNrhKlRmTfM4_mmUJs08jkommFT5Olf_RQVNMIo
# server-only
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2ZnlybW9raHpla3B4d3FkaXhnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTgzNjE4OCwiZXhwIjoyMDc3NDEyMTg4fQ.u4i_PMRR3S_iDk2bRtSLLQhUmf-zQZtVePksUrx5btA
```

Then run the development server:

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

Existing Supabase schema is used directly; no seed data is required.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

-- Lock down table access for anon/authenticated (use server-side service role via API routes)

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated;

-- Keep schema usage so Supabase can function, but no direct table access
GRANT USAGE ON SCHEMA public TO anon, authenticated;

SELECT '✅ Revoked table/sequence/function privileges from anon/authenticated' AS status;

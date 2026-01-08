-- =====================================================
-- Verification Script: Test Infrastructure
-- =====================================================
-- This script verifies that the test infrastructure is
-- properly set up and ready to run tests
-- =====================================================

\echo '=== Verifying pgTAP Extension ==='
SELECT
  extname,
  extversion,
  nspname as schema
FROM pg_extension e
JOIN pg_namespace n ON e.extnamespace = n.oid
WHERE extname = 'pgtap';

\echo ''
\echo '=== Verifying Test Schema ==='
SELECT schema_name
FROM information_schema.schemata
WHERE schema_name = 'tests';

\echo ''
\echo '=== Verifying Auth Helper Functions ==='
SELECT
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'extensions'
  AND routine_name IN ('create_supabase_user', 'authenticate_as')
ORDER BY routine_name;

\echo ''
\echo '=== Verifying Test Helper Functions ==='
SELECT
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'tests'
ORDER BY routine_name;

\echo ''
\echo '=== Verifying Private Schema Helper Functions ==='
SELECT
  routine_name,
  security_type
FROM information_schema.routines
WHERE routine_schema = 'private'
  AND routine_name LIKE '%path%'
ORDER BY routine_name;

\echo ''
\echo '=== Verifying RLS is Enabled ==='
SELECT
  schemaname,
  tablename,
  CASE WHEN rowsecurity THEN 'ENABLED' ELSE 'DISABLED' END as rls_status
FROM pg_tables t
JOIN pg_class c ON t.tablename = c.relname
WHERE schemaname IN ('public', 'storage')
  AND tablename IN ('households', 'boxes', 'objects')
ORDER BY schemaname, tablename;

\echo ''
\echo '=== Verifying RLS Policies Exist ==='
SELECT
  schemaname,
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname IN ('public', 'storage')
GROUP BY schemaname, tablename
ORDER BY schemaname, tablename;

\echo ''
\echo '=== Test Infrastructure Summary ==='
SELECT
  'pgTAP Extension' as component,
  CASE WHEN EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'pgtap')
    THEN '✅ Installed' ELSE '❌ Missing' END as status
UNION ALL
SELECT
  'Tests Schema',
  CASE WHEN EXISTS(SELECT 1 FROM information_schema.schemata WHERE schema_name = 'tests')
    THEN '✅ Created' ELSE '❌ Missing' END
UNION ALL
SELECT
  'Auth Helpers',
  CASE WHEN (SELECT COUNT(*) FROM information_schema.routines
    WHERE routine_schema = 'extensions'
    AND routine_name IN ('create_supabase_user', 'authenticate_as')) = 2
    THEN '✅ Created (2 functions)' ELSE '❌ Missing' END
UNION ALL
SELECT
  'Test Helpers',
  CASE WHEN (SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'tests') > 0
    THEN '✅ Created (' || (SELECT COUNT(*)::text FROM information_schema.routines WHERE routine_schema = 'tests') || ' functions)'
    ELSE '❌ Missing' END
UNION ALL
SELECT
  'Storage Helpers',
  CASE WHEN (SELECT COUNT(*) FROM information_schema.routines
    WHERE routine_schema = 'private' AND routine_name LIKE '%path%') = 3
    THEN '✅ Created (3 functions)' ELSE '❌ Incomplete' END
UNION ALL
SELECT
  'RLS Enabled',
  CASE WHEN (SELECT COUNT(*) FROM pg_tables t JOIN pg_class c ON t.tablename = c.relname
    WHERE schemaname = 'public' AND c.relrowsecurity) > 0
    THEN '✅ Active' ELSE '❌ Not Enabled' END;

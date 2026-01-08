# RLS Policy Tests

Comprehensive test suite for Row Level Security (RLS) policies using pgTAP.

## Test Files

- `rls_households_test.sql` - Tests for households table (15 tests)
- `rls_boxes_test.sql` - Tests for boxes table (20 tests)
- `rls_storage_test.sql` - Tests for storage.objects bucket policies (15 tests)

**Total: 50 tests** covering the most critical RLS policies.

## Prerequisites

The following extensions and helper functions are installed via migration `006_setup_testing_infrastructure.sql`:

- pgTAP extension (for unit testing)
- Custom auth helpers (`extensions.create_supabase_user`, `extensions.authenticate_as`)
- Test helper functions in `tests` schema
- Test fixtures setup function

## Running Tests

### Option 1: Supabase CLI (Recommended)

```bash
# Run all tests
supabase test db

# Run specific test file
supabase test db rls_households_test

# Run with verbose output
supabase test db --debug
```

### Option 2: Using pg_prove (Advanced)

```bash
# Install pg_prove (part of pgTAP)
brew install pgtap  # macOS
# or
sudo apt-get install pgtap  # Linux

# Run all tests
pg_prove -d postgres://postgres:password@db.project.supabase.co:5432/postgres supabase/tests/*.sql

# Run specific test
pg_prove -d <connection-string> supabase/tests/rls_households_test.sql

# Run with verbose output
pg_prove -v -d <connection-string> supabase/tests/*.sql
```

### Option 3: Manual Execution

```bash
# Connect to database
psql postgres://postgres:password@db.project.supabase.co:5432/postgres

# Run test file
\i supabase/tests/rls_households_test.sql
```

## Test Structure

Each test file follows this structure:

```sql
BEGIN;  -- Start transaction (auto-rollback)

SELECT plan(N);  -- Declare number of tests

-- Setup test fixtures
SELECT tests.setup_rls_test_fixtures();

-- Run tests
SELECT ok(..., 'Test description');
SELECT is(..., expected, 'Test description');
SELECT lives_ok(..., 'Test description');
SELECT throws_ok(..., 'Test description');

-- Cleanup
SELECT * FROM finish();

ROLLBACK;  -- Rollback transaction (cleanup)
```

## Test Fixtures

The `tests.setup_rls_test_fixtures()` function creates:

### Test Users (4)
- `test-owner@example.com` - Owner role in household 1
- `test-admin@example.com` - Admin role in household 1, owner of household 2
- `test-member@example.com` - Member role in household 1
- `test-viewer@example.com` - Viewer role in household 1

### Test Households (2)
- `TEST_Household_1` - Has all 4 users with different roles
- `TEST_Household_2` - Has only admin as owner (for isolation testing)

## Test Helper Functions

Located in `tests` schema (from migration 006):

### Fixture Management
- `tests.setup_rls_test_fixtures()` - Creates standard test users and households
- `tests.cleanup_test_data()` - Removes all test data (prefix: `TEST_`)

### Data Creation
- `tests.create_test_household(name, owner_id)` - Creates test household
- `tests.add_user_to_household(household_id, user_id, role)` - Adds user to household
- `tests.create_test_box(household_id, label, status)` - Creates test box
- `tests.create_test_pallet(household_id, name, rows, positions)` - Creates test pallet

### Authentication
- `extensions.create_supabase_user(email, first_name, last_name)` - Creates test user
- `extensions.authenticate_as(email)` - Simulates authentication as user

## Test Coverage

### Households Table (15 tests)
- ✅ SELECT policy (4 tests) - Role-based viewing
- ✅ INSERT policy (3 tests) - Any authenticated user can create
- ✅ UPDATE policy (4 tests) - Only owner can update
- ✅ DELETE policy (4 tests) - Only owner can delete

### Boxes Table (20 tests)
- ✅ SELECT policy (5 tests) - Household member access
- ✅ INSERT policy (4 tests) - Member+ role required
- ✅ UPDATE policy (5 tests) - Member+ role required
- ✅ DELETE policy (6 tests) - Member+ role required

### Storage Objects (15 tests)
- ✅ INSERT policy (6 tests) - Path-based upload validation
- ✅ SELECT policy (5 tests) - Path-based view validation
- ✅ Path validation (4 tests) - Household ID extraction

## Adding New Tests

To add tests for additional tables:

1. Create new test file: `supabase/tests/rls_<table>_test.sql`
2. Follow the structure above
3. Use test helper functions for setup
4. Test all four operations (SELECT, INSERT, UPDATE, DELETE)
5. Test role-based access control
6. Test cross-household isolation
7. Update this README with test count

## CI/CD Integration

Add to your GitHub Actions workflow:

```yaml
- name: Run Database Tests
  run: supabase test db
  env:
    SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
```

## Troubleshooting

### Tests fail with "relation does not exist"
- Ensure migrations are applied: `supabase db push`
- Check that test fixtures are created: `SELECT * FROM tests.setup_rls_test_fixtures();`

### Tests fail with "permission denied"
- Verify RLS is enabled: `SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'boxes';`
- Check that helper functions exist: `SELECT * FROM private.user_has_household_access(...);`

### Tests timeout or hang
- Ensure transactions are rolled back (ROLLBACK at end of test)
- Clean up test data: `SELECT tests.cleanup_test_data();`

## Best Practices

1. **Always use transactions** - Wrap tests in BEGIN/ROLLBACK
2. **Use descriptive test names** - Make failures easy to understand
3. **Test both positive and negative cases** - Allow and deny scenarios
4. **Clean up after tests** - Use ROLLBACK or cleanup functions
5. **Test edge cases** - Boundary conditions, NULL values, etc.
6. **Test cross-household isolation** - Ensure data leakage prevention

## References

- [pgTAP Documentation](https://pgtap.org/)
- [Supabase Testing Guide](https://supabase.com/docs/guides/local-development/testing)
- [RLS Best Practices](https://supabase.com/docs/guides/database/postgres/row-level-security)

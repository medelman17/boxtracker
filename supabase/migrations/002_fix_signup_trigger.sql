-- Fix RLS policy to allow trigger to create initial user-household relationship
-- Problem: The original INSERT policy requires user to already be owner/admin,
-- but during signup the user doesn't exist in user_households yet.

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Owners and admins can add members" ON user_households;

-- Create new policy that allows:
-- 1. Existing owners/admins to add members (original behavior)
-- 2. Users to be added to households during signup (when user_id matches auth.uid())
CREATE POLICY "Owners and admins can add members, or self during signup"
  ON user_households FOR INSERT
  WITH CHECK (
    -- Allow if user is owner/admin of the household
    household_id IN (
      SELECT household_id
      FROM user_households
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
    -- OR allow if the record being inserted is for the current user (signup case)
    OR user_id = auth.uid()
  );

-- Add helpful comment
COMMENT ON POLICY "Owners and admins can add members, or self during signup" ON user_households IS
'Allows owners/admins to add members to their households. Also allows the signup trigger to create the initial user-household relationship by checking if user_id matches the authenticated user.';

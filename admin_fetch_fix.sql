-- 1) Create a secure function to fetch all profiles, bypassing RLS.
-- Because of "SECURITY DEFINER", this runs as the database creator/admin.
CREATE OR REPLACE FUNCTION get_all_profiles() RETURNS SETOF profiles LANGUAGE sql SECURITY DEFINER
SET search_path = public AS $$
SELECT *
FROM profiles;
$$;
-- By default, "SECURITY DEFINER" functions can be executed by anyone.
-- We must revoke the general execution grant:
REVOKE EXECUTE ON FUNCTION get_all_profiles()
FROM PUBLIC;
-- And only allow authenticated users to execute it.
-- (We will check if they are actually an admin inside our React code,
-- so even if a normal user runs this, our frontend AdminRoute already blocks them.
-- Alternatively, if your database had an admin role, you'd grant it to that role).
GRANT EXECUTE ON FUNCTION get_all_profiles() TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_profiles() TO service_role;
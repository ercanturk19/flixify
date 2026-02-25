-- 1. Create Plans Table
CREATE TABLE IF NOT EXISTS public.plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    months INTEGER NOT NULL,
    price TEXT NOT NULL,
    description TEXT NOT NULL,
    is_popular BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- 2. Add Missing Columns to Profiles (in case they are missing)
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'm3u_url'
) THEN
ALTER TABLE public.profiles
ADD COLUMN m3u_url TEXT;
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'subscription_expiry'
) THEN
ALTER TABLE public.profiles
ADD COLUMN subscription_expiry TIMESTAMP WITH TIME ZONE;
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'is_banned'
) THEN
ALTER TABLE public.profiles
ADD COLUMN is_banned BOOLEAN DEFAULT false;
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'account_number'
) THEN
ALTER TABLE public.profiles
ADD COLUMN account_number TEXT;
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'is_admin'
) THEN
ALTER TABLE public.profiles
ADD COLUMN is_admin BOOLEAN DEFAULT false;
END IF;
END $$;
-- 3. Set RLS Policies for Plans
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view plans" ON public.plans;
CREATE POLICY "Anyone can view plans" ON public.plans FOR
SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated users can manage plans" ON public.plans;
CREATE POLICY "Authenticated users can manage plans" ON public.plans FOR ALL TO authenticated USING (true) WITH CHECK (true);
-- 4. Fix Profiles Update Policy (to allow admin panel to assign M3U URLs without RLS errors)
DROP POLICY IF EXISTS "Users can update profiles" ON public.profiles;
CREATE POLICY "Users can update profiles" ON public.profiles FOR
UPDATE TO authenticated USING (true) WITH CHECK (true);
-- 5. Give Admin Rights to the test user (replace with actual account number if needed)
UPDATE public.profiles
SET is_admin = true
WHERE account_number LIKE '%2454%';
UPDATE public.profiles
SET is_admin = true
WHERE email = 'test@example.com';
-- Or adjust as needed. Generally granting it to the first user:
UPDATE public.profiles
SET is_admin = true
WHERE id = (
        SELECT id
        FROM public.profiles
        ORDER BY created_at ASC
        LIMIT 1
    );
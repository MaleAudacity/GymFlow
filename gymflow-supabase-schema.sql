-- ==============================================================================
-- GYMFLOW SUPABASE DATABASE SCHEMA & ROW LEVEL SECURITY (RLS) POLICIES
-- Run this in your Supabase Project: SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. GYM PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.gym_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    gym_name TEXT NOT NULL DEFAULT 'My Gym',
    logo_uri TEXT,
    theme_color TEXT DEFAULT '#4F46E5',
    working_hours_start TEXT DEFAULT '06:00',
    working_hours_end TEXT DEFAULT '22:00',
    language TEXT DEFAULT 'en',
    currency TEXT DEFAULT 'INR',
    country TEXT DEFAULT 'IN',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. GYM PLANS TABLE
CREATE TABLE IF NOT EXISTS public.gym_plans (
    id INTEGER NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price NUMERIC NOT NULL,
    duration_days INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (id, user_id)
);

-- 3. GYM MEMBERS TABLE
CREATE TABLE IF NOT EXISTS public.gym_members (
    id INTEGER NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    photo_uri TEXT,
    plan_id INTEGER,
    join_date TEXT,
    fee_status TEXT DEFAULT 'paid',
    pin_code TEXT,
    qr_payload TEXT,
    active INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (id, user_id)
);

-- 4. GYM ATTENDANCE TABLE
CREATE TABLE IF NOT EXISTS public.gym_attendance (
    id INTEGER NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    member_id INTEGER,
    checked_in_at TEXT NOT NULL,
    method TEXT DEFAULT 'pin',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (id, user_id)
);

-- ==============================================================================
-- ENABLE ROW LEVEL SECURITY (RLS) FOR PRIVACY AND ISOLATION
-- ==============================================================================
ALTER TABLE public.gym_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_attendance ENABLE ROW LEVEL SECURITY;

-- 1. GYM PROFILES POLICIES
CREATE POLICY "Users can view their own gym profile"
    ON public.gym_profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can insert/update their own gym profile"
    ON public.gym_profiles FOR ALL
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- 2. GYM PLANS POLICIES
CREATE POLICY "Users can manage their own plans"
    ON public.gym_plans FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 3. GYM MEMBERS POLICIES
CREATE POLICY "Users can manage their own members"
    ON public.gym_members FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 4. GYM ATTENDANCE POLICIES
CREATE POLICY "Users can manage their own attendance records"
    ON public.gym_attendance FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);


-- 1) Add role to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'shopper' CHECK (role IN ('shopper','seller','both'));

-- 2) Backfill from user_roles for any existing users
UPDATE public.profiles p SET role = CASE
  WHEN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=p.id AND role='seller')
   AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=p.id AND role='buyer') THEN 'both'
  WHEN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=p.id AND role='seller') THEN 'seller'
  ELSE 'shopper'
END;

-- 3) Rewrite signup trigger to write profiles.role from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  chosen text;
BEGIN
  chosen := COALESCE(NEW.raw_user_meta_data ->> 'account_type', 'shopper');
  IF chosen NOT IN ('shopper','seller','both') THEN chosen := 'shopper'; END IF;

  INSERT INTO public.profiles (id, full_name, username, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'username',
    chosen
  )
  ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;
  RETURN NEW;
END;
$$;

-- Ensure the trigger exists on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4) Categories table (requested)
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  emoji text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Categories public read" ON public.categories;
CREATE POLICY "Categories public read" ON public.categories FOR SELECT USING (true);

INSERT INTO public.categories (slug, name, emoji, sort_order) VALUES
  ('women','Women','👗',1),
  ('men','Men','👔',2),
  ('shoes','Shoes','👟',3),
  ('jewellery','Jewellery','💎',4),
  ('bags','Bags','👜',5),
  ('accessories','Accessories','🕶️',6)
ON CONFLICT (slug) DO NOTHING;

-- 5) Ensure user_roles is writable so any leftover code doesn't 500 (harmless owner-scoped policies)
DROP POLICY IF EXISTS "Users insert own roles" ON public.user_roles;
CREATE POLICY "Users insert own roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users delete own roles" ON public.user_roles;
CREATE POLICY "Users delete own roles" ON public.user_roles FOR DELETE TO authenticated USING (auth.uid() = user_id);

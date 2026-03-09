
-- Drop all existing RESTRICTIVE policies and recreate as PERMISSIVE

-- request_logs policies
DROP POLICY IF EXISTS "Users can view their own logs" ON public.request_logs;
DROP POLICY IF EXISTS "Users can insert their own logs" ON public.request_logs;
DROP POLICY IF EXISTS "Users can delete their own logs" ON public.request_logs;

CREATE POLICY "Users can view their own logs" ON public.request_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own logs" ON public.request_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own logs" ON public.request_logs FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- evaluations policies
DROP POLICY IF EXISTS "Users can view their own evaluations" ON public.evaluations;
DROP POLICY IF EXISTS "Users can insert their own evaluations" ON public.evaluations;
DROP POLICY IF EXISTS "Users can delete their own evaluations" ON public.evaluations;

CREATE POLICY "Users can view their own evaluations" ON public.evaluations FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own evaluations" ON public.evaluations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own evaluations" ON public.evaluations FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- profiles policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Add missing trigger for auto-creating profiles on signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

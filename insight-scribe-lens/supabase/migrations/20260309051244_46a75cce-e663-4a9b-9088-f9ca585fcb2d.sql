
-- Security definer function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND email = 'dwarampudirakesh143@gmail.com'
  )
$$;

-- Admin can view ALL chat messages
CREATE POLICY "Admin can view all messages" ON public.chat_messages FOR SELECT USING (public.is_admin());

-- Admin can view ALL activity logs
CREATE POLICY "Admin can view all activity" ON public.activity_logs FOR SELECT USING (public.is_admin());

-- Admin can view all request logs
CREATE POLICY "Admin can view all request logs" ON public.request_logs FOR SELECT USING (public.is_admin());

-- Admin can view all evaluations
CREATE POLICY "Admin can view all evaluations" ON public.evaluations FOR SELECT USING (public.is_admin());

-- Admin can view all profiles
CREATE POLICY "Admin can view all profiles" ON public.profiles FOR SELECT USING (public.is_admin());

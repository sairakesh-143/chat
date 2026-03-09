-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Request logs table
CREATE TABLE public.request_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_id TEXT NOT NULL,
  query TEXT NOT NULL,
  response TEXT,
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  cost NUMERIC(12,6) NOT NULL DEFAULT 0,
  latency INTEGER NOT NULL DEFAULT 0,
  model TEXT NOT NULL DEFAULT 'gpt-4o',
  status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'error')),
  trace_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.request_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own logs" ON public.request_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own logs" ON public.request_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own logs" ON public.request_logs FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_request_logs_user_id ON public.request_logs(user_id);
CREATE INDEX idx_request_logs_created_at ON public.request_logs(created_at DESC);

-- Evaluations table
CREATE TABLE public.evaluations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_log_id UUID REFERENCES public.request_logs(id) ON DELETE CASCADE,
  request_id TEXT NOT NULL,
  query TEXT NOT NULL,
  relevance_score NUMERIC(3,1) NOT NULL DEFAULT 0 CHECK (relevance_score >= 0 AND relevance_score <= 5),
  hallucination_score NUMERIC(3,1) NOT NULL DEFAULT 0 CHECK (hallucination_score >= 0 AND hallucination_score <= 5),
  context_score NUMERIC(3,1) NOT NULL DEFAULT 0 CHECK (context_score >= 0 AND context_score <= 5),
  overall_score NUMERIC(3,1) NOT NULL DEFAULT 0 CHECK (overall_score >= 0 AND overall_score <= 5),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own evaluations" ON public.evaluations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own evaluations" ON public.evaluations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own evaluations" ON public.evaluations FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_evaluations_user_id ON public.evaluations(user_id);
CREATE INDEX idx_evaluations_request_log_id ON public.evaluations(request_log_id);
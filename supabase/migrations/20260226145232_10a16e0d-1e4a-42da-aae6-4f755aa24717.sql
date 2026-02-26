
-- Create roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'operador', 'viewer');

-- Create config_usuarios table
CREATE TABLE public.config_usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL DEFAULT '',
  rol app_role NOT NULL DEFAULT 'viewer',
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.config_usuarios ENABLE ROW LEVEL SECURITY;

-- Users can read their own config
CREATE POLICY "Users can read own config"
ON public.config_usuarios FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins can read all
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.config_usuarios
    WHERE user_id = _user_id AND rol = _role AND activo = true
  )
$$;

CREATE POLICY "Admins can read all configs"
ON public.config_usuarios FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert configs"
ON public.config_usuarios FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update configs"
ON public.config_usuarios FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_config_usuarios_updated_at
BEFORE UPDATE ON public.config_usuarios
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create config_usuarios on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.config_usuarios (user_id, email, nombre)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'nombre', ''));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

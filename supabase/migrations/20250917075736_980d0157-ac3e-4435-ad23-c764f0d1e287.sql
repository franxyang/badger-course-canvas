-- Fix function search path security warnings

-- Update handle_new_user function with proper search path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, name, image)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'name',
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN NEW;
END;
$$;

-- Update update_updated_at_column function with proper search path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Update rating_to_uw_grade function with proper search path
CREATE OR REPLACE FUNCTION public.rating_to_uw_grade(rating NUMERIC)
RETURNS uw_grade 
LANGUAGE plpgsql 
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF rating >= 4.7 THEN RETURN 'A';
  ELSIF rating >= 4.2 THEN RETURN 'AB';
  ELSIF rating >= 3.7 THEN RETURN 'B';
  ELSIF rating >= 3.2 THEN RETURN 'BC';
  ELSIF rating >= 2.5 THEN RETURN 'C';
  ELSIF rating >= 1.5 THEN RETURN 'D';
  ELSE RETURN 'F';
  END IF;
END;
$$;
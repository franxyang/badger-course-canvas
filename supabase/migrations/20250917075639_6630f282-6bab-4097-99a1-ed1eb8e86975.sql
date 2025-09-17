-- Create MADSPACE database schema for UW-Madison course reviews

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('USER', 'ADMIN');

-- Create enum for UW letter grades
CREATE TYPE uw_grade AS ENUM ('A', 'AB', 'B', 'BC', 'C', 'D', 'F');

-- Create departments table
CREATE TABLE public.departments (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create instructors table
CREATE TABLE public.instructors (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  department TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create courses table
CREATE TABLE public.courses (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  credits INTEGER,
  department_id UUID REFERENCES public.departments(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create course_instructors junction table
CREATE TABLE public.course_instructors (
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  PRIMARY KEY (course_id, instructor_id)
);

-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  image TEXT,
  role user_role NOT NULL DEFAULT 'USER',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reviews table
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  semester TEXT NOT NULL,
  instructor_name TEXT,
  ta_name TEXT,
  ta_rating uw_grade,
  content TEXT NOT NULL,
  rating_content INTEGER NOT NULL CHECK (rating_content BETWEEN 1 AND 5),
  rating_teaching INTEGER NOT NULL CHECK (rating_teaching BETWEEN 1 AND 5),
  rating_grading INTEGER NOT NULL CHECK (rating_grading BETWEEN 1 AND 5),
  rating_workload INTEGER NOT NULL CHECK (rating_workload BETWEEN 1 AND 5),
  helpful_count INTEGER NOT NULL DEFAULT 0,
  reported BOOLEAN NOT NULL DEFAULT false,
  moderation_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id, semester)
);

-- Create votes table for helpful votes
CREATE TABLE public.votes (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  value INTEGER NOT NULL CHECK (value IN (1, -1)),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, review_id)
);

-- Enable Row Level Security
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for departments (read-only for authenticated users)
CREATE POLICY "Departments are viewable by authenticated users" 
ON public.departments FOR SELECT USING (auth.role() = 'authenticated');

-- RLS Policies for instructors (read-only for authenticated users)
CREATE POLICY "Instructors are viewable by authenticated users" 
ON public.instructors FOR SELECT USING (auth.role() = 'authenticated');

-- RLS Policies for courses (read-only for authenticated users)
CREATE POLICY "Courses are viewable by authenticated users" 
ON public.courses FOR SELECT USING (auth.role() = 'authenticated');

-- RLS Policies for course_instructors (read-only for authenticated users)
CREATE POLICY "Course instructors are viewable by authenticated users" 
ON public.course_instructors FOR SELECT USING (auth.role() = 'authenticated');

-- RLS Policies for reviews
CREATE POLICY "Reviews are viewable by authenticated users" 
ON public.reviews FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create their own reviews" 
ON public.reviews FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT user_id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Users can update their own reviews" 
ON public.reviews FOR UPDATE USING (
  user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

-- Admin can update any review
CREATE POLICY "Admins can update any review" 
ON public.reviews FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'ADMIN'
  )
);

-- RLS Policies for votes
CREATE POLICY "Votes are viewable by authenticated users" 
ON public.votes FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create their own votes" 
ON public.votes FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT user_id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Users can update their own votes" 
ON public.votes FOR UPDATE USING (
  user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Users can delete their own votes" 
ON public.votes FOR DELETE USING (
  user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

-- Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample departments
INSERT INTO public.departments (code, name) VALUES
('MATH', 'Mathematics'),
('CS', 'Computer Science'),
('PHYS', 'Physics'),
('CHEM', 'Chemistry'),
('ECON', 'Economics'),
('HIST', 'History'),
('ENGL', 'English'),
('PSYC', 'Psychology');

-- Insert sample courses
INSERT INTO public.courses (code, name, description, credits, department_id) VALUES
('MATH 521', 'Analysis I', 'Introduction to real analysis covering sequences, series, continuity, and differentiation.', 3, (SELECT id FROM public.departments WHERE code = 'MATH')),
('CS 540', 'Artificial Intelligence', 'Introduction to artificial intelligence including search, knowledge representation, and machine learning.', 3, (SELECT id FROM public.departments WHERE code = 'CS')),
('MATH 234', 'Calculus - Functions of Several Variables', 'Multivariable calculus including partial derivatives, multiple integrals, and vector calculus.', 4, (SELECT id FROM public.departments WHERE code = 'MATH')),
('CS 367', 'Introduction to Data Structures', 'Fundamental data structures and algorithms for efficient programming.', 3, (SELECT id FROM public.departments WHERE code = 'CS'));

-- Create helper function to convert numeric rating to UW letter grade
CREATE OR REPLACE FUNCTION public.rating_to_uw_grade(rating NUMERIC)
RETURNS uw_grade AS $$
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
$$ LANGUAGE plpgsql IMMUTABLE;
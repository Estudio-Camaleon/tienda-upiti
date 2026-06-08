ALTER TABLE public.products ADD COLUMN status TEXT DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected'));
ALTER TABLE public.products ADD COLUMN rejected_reason TEXT;
ALTER TABLE public.profiles ADD COLUMN is_verified BOOLEAN DEFAULT false;

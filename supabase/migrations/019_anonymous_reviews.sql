-- 019_anonymous_reviews.sql
-- Allow anonymous reviews (non-logged-in users)

-- Make reviewer_id nullable so anonymous users can leave reviews
ALTER TABLE public.reviews
  ALTER COLUMN reviewer_id DROP NOT NULL;

-- Add display name for anonymous reviewers
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS reviewer_name TEXT;

-- Drop self-review constraint (need to recreate without reviewer_id)
ALTER TABLE public.reviews
  DROP CONSTRAINT IF EXISTS reviews_no_self_review;

-- Recreate: only check self-review when reviewer_id is not null
ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_no_self_review
  CHECK (
    reviewer_id IS NULL
    OR seller_id <> reviewer_id
  );

-- Update INSERT policy to allow anonymous (reviewer_id IS NULL) + authenticated
DROP POLICY IF EXISTS "Usuarios crean sus reviews" ON public.reviews;
CREATE POLICY "Usuarios crean sus reviews" ON public.reviews
  FOR INSERT WITH CHECK (
    (auth.uid() = reviewer_id AND auth.uid() <> seller_id)
    OR reviewer_id IS NULL
  );

-- Allow admins to delete any review (already updated by 018)

-- Index on reviewer_name for potential lookups
CREATE INDEX IF NOT EXISTS reviews_reviewer_name_idx ON public.reviews(reviewer_name);

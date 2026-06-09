-- Add banner_url to profiles for seller banner images
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS banner_url text;

-- Bucket 'banners' and its RLS policies are created in 010_banners_bucket.sql

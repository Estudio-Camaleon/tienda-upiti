-- Add separate columns for WhatsApp parts and backfill from existing whatsapp_number
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS whatsapp_region text,
  ADD COLUMN IF NOT EXISTS whatsapp_area text,
  ADD COLUMN IF NOT EXISTS whatsapp_number_local text;

-- Backfill logic: normalize existing whatsapp_number to digits-only and extract groups using substring (not regexp_matches)
WITH normalized AS (
  SELECT id, regexp_replace(coalesce(whatsapp_number, ''), '\D', '', 'g') AS num
  FROM profiles
)
UPDATE profiles p
SET
  whatsapp_region = CASE
    WHEN n.num ~ '^(\d{1,4})(\d{2,4})(\d{6,8})$'
      THEN substring(n.num FROM '^(\d{1,4})')
    ELSE substring(n.num FROM '^(.{1,2})')
  END,
  whatsapp_area = CASE
    WHEN n.num ~ '^(\d{1,4})(\d{2,4})(\d{6,8})$'
      THEN substring(n.num FROM '^\d{1,4}(\d{2,4})')
    ELSE substring(n.num FROM '^.{2}(.{3})')
  END,
  whatsapp_number_local = CASE
    WHEN n.num ~ '^(\d{1,4})(\d{2,4})(\d{6,8})$'
      THEN substring(n.num FROM '^\d{1,4}\d{2,4}(\d{6,8})')
    ELSE substring(n.num FROM '^.{5}(.*)$')
  END
FROM normalized n
WHERE p.id = n.id;

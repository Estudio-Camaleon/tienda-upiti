-- Add separate columns for WhatsApp parts and backfill from existing whatsapp_number
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS whatsapp_region text,
  ADD COLUMN IF NOT EXISTS whatsapp_area text,
  ADD COLUMN IF NOT EXISTS whatsapp_number_local text;

-- Backfill logic: normalize existing whatsapp_number to digits-only and try to extract groups
WITH normalized AS (
  SELECT id, regexp_replace(coalesce(whatsapp_number, ''), '\\D', '', 'g') AS num
  FROM profiles
)
UPDATE profiles p
SET
  whatsapp_region = CASE
    WHEN n.num ~ '^(\\d{1,4})(\\d{2,4})(\\d{6,8})$' THEN (regexp_matches(n.num, '^(\\d{1,4})(\\d{2,4})(\\d{6,8})$'))[1]
    ELSE substr(n.num, 1, 2)
  END,
  whatsapp_area = CASE
    WHEN n.num ~ '^(\\d{1,4})(\\d{2,4})(\\d{6,8})$' THEN (regexp_matches(n.num, '^(\\d{1,4})(\\d{2,4})(\\d{6,8})$'))[2]
    ELSE substr(n.num, 3, 3)
  END,
  whatsapp_number_local = CASE
    WHEN n.num ~ '^(\\d{1,4})(\\d{2,4})(\\d{6,8})$' THEN (regexp_matches(n.num, '^(\\d{1,4})(\\d{2,4})(\\d{6,8})$'))[3]
    ELSE substr(n.num, 6)
  END
FROM normalized n
WHERE p.id = n.id;

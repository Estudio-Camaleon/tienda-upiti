-- Slug columns for friendly URLs

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS slug text;

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS slug text;

-- Unique indexes (PostgreSQL ignores NULLs for uniqueness)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_slug_key ON profiles (slug) WHERE slug IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS products_slug_key ON products (slug) WHERE slug IS NOT NULL;

-- Helper function: basic slugify (lowercase, replace non-alphanum with hyphen)
CREATE OR REPLACE FUNCTION slugify(text) RETURNS text
  LANGUAGE SQL IMMUTABLE PARALLEL SAFE STRICT
AS $$
  SELECT regexp_replace(
    regexp_replace(
      regexp_replace(
        lower(trim($1)),
        '[^a-z0-9\s-]', '', 'g'
      ),
      '[\s_]+', '-', 'g'
    ),
    '-+', '-', 'g'
  );
$$;

-- Backfill profiles: slug from company_name, or first_name || '-' || last_name
DO $$
DECLARE
  rec RECORD;
  base TEXT;
  v_slug TEXT;
  suffix INT;
BEGIN
  FOR rec IN SELECT id, company_name, first_name, last_name FROM profiles WHERE slug IS NULL LOOP
    IF rec.company_name IS NOT NULL AND rec.company_name <> '' THEN
      base := slugify(rec.company_name);
    ELSIF rec.first_name IS NOT NULL AND rec.last_name IS NOT NULL THEN
      base := slugify(rec.first_name || '-' || rec.last_name);
    ELSE
      base := 'tienda';
    END IF;

    IF base IS NULL OR base = '' THEN
      base := 'tienda';
    END IF;

    v_slug := base;
    suffix := 2;
    LOOP
      BEGIN
        UPDATE profiles SET slug = v_slug WHERE id = rec.id;
        EXIT;
      EXCEPTION WHEN unique_violation THEN
        v_slug := base || '-' || suffix;
        suffix := suffix + 1;
        IF suffix > 100 THEN
          v_slug := base || '-' || substr(md5(random()::text), 1, 4);
          UPDATE profiles SET slug = v_slug WHERE id = rec.id;
          EXIT;
        END IF;
      END;
    END LOOP;
  END LOOP;
END $$;

-- Backfill products: slug from name
DO $$
DECLARE
  rec RECORD;
  base TEXT;
  v_slug TEXT;
  suffix INT;
BEGIN
  FOR rec IN SELECT id, name FROM products WHERE slug IS NULL ORDER BY id LOOP
    base := slugify(rec.name);
    IF base IS NULL OR base = '' THEN
      base := 'producto';
    END IF;

    v_slug := base;
    suffix := 2;
    LOOP
      BEGIN
        UPDATE products SET slug = v_slug WHERE id = rec.id;
        EXIT;
      EXCEPTION WHEN unique_violation THEN
        v_slug := base || '-' || suffix;
        suffix := suffix + 1;
        IF suffix > 100 THEN
          v_slug := base || '-' || substr(md5(random()::text), 1, 4);
          UPDATE products SET slug = v_slug WHERE id = rec.id;
          EXIT;
        END IF;
      END;
    END LOOP;
  END LOOP;
END $$;

DROP FUNCTION IF EXISTS slugify(text);

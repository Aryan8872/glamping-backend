-- 1) Add tsvector column
ALTER TABLE "CampSite" 
ADD COLUMN IF NOT EXISTS "search_vector" tsvector;

-- 2) Populate existing rows
UPDATE "CampSite"
SET "search_vector" = to_tsvector(
  'english',
  coalesce("name",'') || ' ' || coalesce("description",'')
);

-- 3) Add GIN index
CREATE INDEX IF NOT EXISTS idx_campsite_search_vector 
ON "CampSite" USING GIN ("search_vector");

-- 4) Trigger function
CREATE OR REPLACE FUNCTION campsite_search_vector_trigger() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector(
    'english',
    coalesce(NEW.name,'') || ' ' || coalesce(NEW.description,'')
  );
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- 5) Attach trigger
DROP TRIGGER IF EXISTS trg_campsite_search_vector ON "CampSite";

CREATE TRIGGER trg_campsite_search_vector
BEFORE INSERT OR UPDATE ON "CampSite"
FOR EACH ROW EXECUTE PROCEDURE campsite_search_vector_trigger();

-- Normalize regions in spirits table
-- Extract country from "City, Country" format (take text after last comma)
UPDATE spirit
SET region = TRIM(SUBSTRING(region FROM POSITION(',' IN region) + 1))
WHERE region LIKE '%,%';

-- Normalize regions in distillery table  
-- Extract country from "City, Country" format (take text after last comma)
UPDATE distillery
SET region = TRIM(SUBSTRING(region FROM POSITION(',' IN region) + 1))
WHERE region LIKE '%,%';

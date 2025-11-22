-- Update existing donors with null gender to 'Male'
UPDATE public.donors
SET gender = 'Male'
WHERE gender IS NULL;

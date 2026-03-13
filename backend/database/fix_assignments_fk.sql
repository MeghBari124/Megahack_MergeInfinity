-- FIX: Point the Foreign Key to the correct table (claim_applications) instead of 'claims'
-- Run this in Supabase SQL Editor

ALTER TABLE public.field_officer_assignments 
DROP CONSTRAINT IF EXISTS field_officer_assignments_claim_id_fkey;

ALTER TABLE public.field_officer_assignments 
ADD CONSTRAINT field_officer_assignments_claim_id_fkey 
FOREIGN KEY (claim_id) REFERENCES public.claim_applications (id) ON DELETE CASCADE;

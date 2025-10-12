-- Data migration: Update specific creative submission
-- Protected with DO block to handle case where table doesn't exist (fresh install)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'j_ads_creative_submissions') THEN
    UPDATE j_ads_creative_submissions
    SET manager_id = '214db609-4968-8018-8855-cdef3328ef00', status = 'pending'
    WHERE id = 'f2bb0dd2-7d90-4b2a-9066-fff254327e1c';
  END IF;
END $$;
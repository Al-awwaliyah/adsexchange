-- Create a public function to validate referral codes (bypass RLS)
CREATE OR REPLACE FUNCTION public.validate_referral_code(code TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE referral_code = UPPER(TRIM(code))
  );
END;
$$;
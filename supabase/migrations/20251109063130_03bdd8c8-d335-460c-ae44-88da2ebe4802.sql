-- Ensure all verified users without referral codes get one
UPDATE public.profiles 
SET referral_code = public.generate_referral_code(id)
WHERE verified = true AND (referral_code IS NULL OR referral_code = '');

-- Update trigger to always generate code on verification
CREATE OR REPLACE FUNCTION public.handle_user_verification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Generate referral code when user gets verified and doesn't have one yet
  IF NEW.verified = true AND (NEW.referral_code IS NULL OR NEW.referral_code = '') THEN
    NEW.referral_code := public.generate_referral_code(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$function$;
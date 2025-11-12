-- Generate referral codes for all existing users without one
UPDATE public.profiles 
SET referral_code = public.generate_referral_code(id)
WHERE referral_code IS NULL OR referral_code = '';

-- Update handle_new_user to generate referral code on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  selected_role TEXT;
  new_referral_code TEXT;
BEGIN
  -- Generate referral code immediately
  new_referral_code := public.generate_referral_code(NEW.id);
  
  -- Insert profile with referral code
  INSERT INTO public.profiles (id, full_name, referral_code)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', new_referral_code);
  
  -- Create wallet
  INSERT INTO public.wallets (user_id, currency_type)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'currency_type', 'USD'));
  
  -- Get selected role from metadata
  selected_role := NEW.raw_user_meta_data->>'selected_role';
  
  -- Insert user role
  IF selected_role IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, selected_role::app_role);
  END IF;
  
  -- Handle referral if provided
  IF NEW.raw_user_meta_data->>'referral_code' IS NOT NULL THEN
    UPDATE public.profiles
    SET referred_by = (
      SELECT id FROM public.profiles
      WHERE referral_code = NEW.raw_user_meta_data->>'referral_code'
      LIMIT 1
    )
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Remove the verification requirement from handle_user_verification
-- Keep trigger for other verification-related updates
CREATE OR REPLACE FUNCTION public.handle_user_verification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Ensure referral code exists (backup in case it wasn't generated)
  IF NEW.referral_code IS NULL OR NEW.referral_code = '' THEN
    NEW.referral_code := public.generate_referral_code(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;
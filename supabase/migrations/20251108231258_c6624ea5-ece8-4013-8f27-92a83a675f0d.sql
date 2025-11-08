-- Add referral code and referred_by to profiles table
ALTER TABLE public.profiles 
ADD COLUMN referral_code TEXT UNIQUE,
ADD COLUMN referred_by UUID REFERENCES public.profiles(id);

-- Create index for faster referral code lookups
CREATE INDEX idx_profiles_referral_code ON public.profiles(referral_code);
CREATE INDEX idx_profiles_referred_by ON public.profiles(referred_by);

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code(user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate 8-character code from user_id hash
    new_code := UPPER(SUBSTRING(MD5(user_id::text || NOW()::text || RANDOM()::text) FROM 1 FOR 8));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM profiles WHERE referral_code = new_code) INTO code_exists;
    
    -- Exit loop if code is unique
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN new_code;
END;
$$;

-- Trigger to auto-generate referral code for verified users
CREATE OR REPLACE FUNCTION public.handle_user_verification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Generate referral code when user gets verified and doesn't have one yet
  IF NEW.verified = true AND OLD.verified = false AND NEW.referral_code IS NULL THEN
    NEW.referral_code := public.generate_referral_code(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_user_verified
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_user_verification();

-- Create storage bucket for campaign ads
INSERT INTO storage.buckets (id, name, public)
VALUES ('campaign-ads', 'campaign-ads', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for campaign ads
CREATE POLICY "Advertisers can upload campaign ads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'campaign-ads' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Advertisers can update own ads"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'campaign-ads' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Anyone can view campaign ads"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'campaign-ads');

CREATE POLICY "Advertisers can delete own ads"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'campaign-ads' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
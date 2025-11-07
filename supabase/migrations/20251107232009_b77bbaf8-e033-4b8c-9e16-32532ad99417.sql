-- Add NIN verification fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS nin_encrypted TEXT,
ADD COLUMN IF NOT EXISTS nin_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS nin_verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS nin_verification_status TEXT DEFAULT 'not_submitted' CHECK (nin_verification_status IN ('not_submitted', 'pending', 'verified', 'failed'));

-- Create verification_attempts table
CREATE TABLE IF NOT EXISTS public.verification_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nin TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  selfie_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  provider_response JSONB,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id)
);

-- Enable RLS on verification_attempts
ALTER TABLE public.verification_attempts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for verification_attempts
CREATE POLICY "Users can view own verification attempts"
ON public.verification_attempts
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can create own verification attempts"
ON public.verification_attempts
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all verification attempts"
ON public.verification_attempts
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update verification attempts"
ON public.verification_attempts
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_verification_attempts_user_id ON public.verification_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_attempts_status ON public.verification_attempts(status);
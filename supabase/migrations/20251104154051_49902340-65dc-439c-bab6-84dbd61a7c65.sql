-- Update handle_new_user function to handle currency_type from user metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  
  INSERT INTO public.wallets (user_id, currency_type)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'currency_type', 'USD')
  );
  
  RETURN NEW;
END;
$function$;
-- Drop existing constraint
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_transaction_type_check;

-- Add updated constraint with all transaction types
ALTER TABLE public.transactions ADD CONSTRAINT transactions_transaction_type_check 
CHECK (transaction_type = ANY (ARRAY[
  'deposit'::text,
  'withdrawal'::text,
  'payment'::text,
  'refund'::text,
  'commission'::text,
  'campaign_budget'::text,
  'task_payout'::text
]));
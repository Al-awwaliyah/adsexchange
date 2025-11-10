import { z } from 'zod';

// Campaign validation schema
export const campaignSchema = z.object({
  title: z.string()
    .trim()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must be less than 100 characters'),
  description: z.string()
    .trim()
    .max(1000, 'Description must be less than 1000 characters')
    .optional(),
  budget: z.number()
    .positive('Budget must be positive')
    .max(1000000, 'Budget cannot exceed $1,000,000'),
  payout: z.number()
    .positive('Payout must be positive')
    .min(40, 'Minimum payout amount is 40')
    .max(100000, 'Payout cannot exceed $100,000'),
  creative_url: z.string()
    .trim()
    .url('Must be a valid URL')
    .optional()
    .or(z.literal('')),
  platform: z.enum(['instagram', 'tiktok', 'youtube', 'whatsapp', 'facebook', 'twitter']),
  min_followers: z.number()
    .int('Followers must be a whole number')
    .min(0, 'Followers cannot be negative')
    .max(100000000, 'Followers cannot exceed 100 million')
    .optional(),
  region: z.string()
    .trim()
    .max(100, 'Region must be less than 100 characters')
    .optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
}).refine((data) => {
  if (data.payout > data.budget) {
    return false;
  }
  return true;
}, {
  message: 'Payout cannot exceed total budget',
  path: ['payout'],
}).refine((data) => {
  if (data.start_date && data.end_date) {
    return new Date(data.start_date) < new Date(data.end_date);
  }
  return true;
}, {
  message: 'End date must be after start date',
  path: ['end_date'],
});

// Withdrawal validation schema
export const withdrawalSchema = z.object({
  amount: z.number()
    .positive('Amount must be positive')
    .min(100, 'Minimum withdrawal amount is 100')
    .max(1000000, 'Amount cannot exceed $1,000,000'),
  payment_method: z.enum(['nigerian_bank', 'bank_transfer', 'paypal', 'crypto'], {
    required_error: 'Payment method is required',
  }),
  bank_name: z.string().optional(),
  account_number: z.string()
    .regex(/^\d{10}$/, 'Account number must be exactly 10 digits')
    .optional(),
  account_name: z.string()
    .trim()
    .min(2, 'Account name must be at least 2 characters')
    .max(100, 'Account name must be less than 100 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Account name can only contain letters, spaces, hyphens, and apostrophes')
    .optional(),
  account_details: z.string().optional(),
}).refine((data) => {
  if (data.payment_method === 'nigerian_bank') {
    return !!(data.bank_name && data.account_number && data.account_name);
  }
  return true;
}, {
  message: 'Bank details are required for Nigerian bank transfers',
  path: ['bank_name'],
}).refine((data) => {
  if (data.payment_method === 'paypal' && data.account_details) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(data.account_details);
  }
  return true;
}, {
  message: 'Must be a valid email address',
  path: ['account_details'],
}).refine((data) => {
  if (data.payment_method === 'crypto' && data.account_details) {
    return data.account_details.length >= 26 && data.account_details.length <= 120;
  }
  return true;
}, {
  message: 'Must be a valid crypto wallet address',
  path: ['account_details'],
});

// Auth validation schema
export const authSchema = z.object({
  email: z.string()
    .trim()
    .email('Must be a valid email address')
    .max(255, 'Email must be less than 255 characters'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  fullName: z.string()
    .trim()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must be less than 100 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes')
    .optional(),
  role: z.enum(['advertiser', 'promoter', 'admin']).optional(),
  currency: z.enum(['USD', 'NGN']).optional(),
});

// Task proof URL validation
export const taskProofSchema = z.object({
  proof_url: z.string()
    .trim()
    .url('Must be a valid URL')
    .max(500, 'URL must be less than 500 characters'),
});

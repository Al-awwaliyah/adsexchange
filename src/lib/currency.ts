export type CurrencyType = 'USD' | 'NGN';

export const formatCurrency = (amount: number | string, currency: CurrencyType = 'USD'): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (currency === 'NGN') {
    return `₦${numAmount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  
  return `$${numAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const getCurrencySymbol = (currency: CurrencyType = 'USD'): string => {
  return currency === 'NGN' ? '₦' : '$';
};

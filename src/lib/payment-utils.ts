/**
 * Masks sensitive payment details for display purposes
 * Used to prevent exposure of full account numbers, crypto addresses, etc.
 */

export function maskBankAccount(accountNumber: string): string {
  if (!accountNumber || accountNumber.length < 4) return '****';
  return '****' + accountNumber.slice(-4);
}

export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '****@****.***';
  const [username, domain] = email.split('@');
  const maskedUsername = username.length > 2 
    ? username[0] + '***' + username[username.length - 1]
    : '***';
  return `${maskedUsername}@${domain}`;
}

export function maskCryptoAddress(address: string): string {
  if (!address || address.length < 8) return '****...****';
  return address.slice(0, 6) + '...' + address.slice(-4);
}

/**
 * Masks payment details based on payment method type
 * Returns a safe string that can be displayed to users
 */
export function maskPaymentDetails(paymentDetails: any, paymentMethod: string): string {
  if (!paymentDetails) return 'Payment details on file';

  try {
    switch (paymentMethod) {
      case 'nigerian_bank':
      case 'bank_transfer':
        if (paymentDetails.account_number) {
          const maskedAccount = maskBankAccount(paymentDetails.account_number);
          const bankName = paymentDetails.bank_name || 'Bank';
          return `${bankName} - ${maskedAccount}`;
        }
        return 'Bank account on file';

      case 'paypal':
        if (paymentDetails.account) {
          return maskEmail(paymentDetails.account);
        }
        return 'PayPal account on file';

      case 'crypto':
        if (paymentDetails.account) {
          return maskCryptoAddress(paymentDetails.account);
        }
        return 'Crypto wallet on file';

      default:
        return 'Payment details on file';
    }
  } catch (error) {
    console.error('Error masking payment details:', error);
    return 'Payment details on file';
  }
}

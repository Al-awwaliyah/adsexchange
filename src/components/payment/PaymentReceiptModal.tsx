import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Download, Printer } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useCurrency } from '@/hooks/useCurrency';

type PaymentRecord = {
  id: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  status: string;
  created_at: string;
  payment_method?: string;
  transaction_type?: string;
  reference?: string;
};

interface PaymentReceiptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: PaymentRecord | null;
}

export default function PaymentReceiptModal({ open, onOpenChange, payment }: PaymentReceiptModalProps) {
  const { format: formatCurrency } = useCurrency();
  
  if (!payment) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Create a simple text receipt
    const receiptText = `
PAYMENT RECEIPT
================

Receipt ID: ${payment.id}
Date: ${new Date(payment.created_at).toLocaleString()}
Type: ${payment.type.toUpperCase()}
Amount: ${formatCurrency(payment.amount)}
Status: ${payment.status.toUpperCase()}
${payment.reference ? `Reference: ${payment.reference}` : ''}
${payment.payment_method ? `Payment Method: ${payment.payment_method}` : ''}

Thank you for your business!
    `;

    const blob = new Blob([receiptText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${payment.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'failed':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Payment Receipt</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="text-center space-y-2">
            <div className="text-sm text-muted-foreground">Receipt ID</div>
            <div className="font-mono text-xs">{payment.id}</div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date & Time</span>
              <span className="font-medium">
                {new Date(payment.created_at).toLocaleString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-muted-foreground">Transaction Type</span>
              <Badge variant={payment.type === 'deposit' ? 'default' : 'secondary'}>
                {payment.type}
              </Badge>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Amount</span>
              <span className={`text-xl font-bold ${payment.type === 'deposit' ? 'text-green-600' : 'text-red-600'}`}>
                {payment.type === 'deposit' ? '+' : '-'}{formatCurrency(payment.amount)}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge variant={getStatusColor(payment.status)}>
                {payment.status}
              </Badge>
            </div>

            {payment.reference && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reference</span>
                <span className="font-mono text-xs">{payment.reference}</span>
              </div>
            )}

            {payment.payment_method && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment Method</span>
                <span className="font-medium">{payment.payment_method}</span>
              </div>
            )}
          </div>

          <Separator />

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" className="flex-1" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

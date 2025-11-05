import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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

export default function PaymentHistory() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<'all' | 'deposit' | 'withdrawal'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending' | 'failed'>('all');

  useEffect(() => {
    if (user) {
      fetchPaymentHistory();
    }
  }, [user, typeFilter, statusFilter]);

  const fetchPaymentHistory = async () => {
    try {
      setLoading(true);
      const allPayments: PaymentRecord[] = [];

      // Fetch deposits (transactions with to_user_id = current user)
      if (typeFilter === 'all' || typeFilter === 'deposit') {
        let depositQuery = supabase
          .from('transactions')
          .select('*')
          .eq('to_user_id', user?.id)
          .eq('transaction_type', 'deposit')
          .order('created_at', { ascending: false });

        if (statusFilter !== 'all') {
          depositQuery = depositQuery.eq('status', statusFilter);
        }

        const { data: deposits, error: depositError } = await depositQuery;
        if (depositError) throw depositError;

        if (deposits) {
          allPayments.push(
            ...deposits.map((d) => ({
              id: d.id,
              type: 'deposit' as const,
              amount: Number(d.amount),
              status: d.status || 'pending',
              created_at: d.created_at,
              transaction_type: d.transaction_type,
              reference: d.reference,
            }))
          );
        }
      }

      // Fetch withdrawals
      if (typeFilter === 'all' || typeFilter === 'withdrawal') {
        let withdrawalQuery = supabase
          .from('withdrawals')
          .select('*')
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false });

        if (statusFilter !== 'all') {
          withdrawalQuery = withdrawalQuery.eq('status', statusFilter);
        }

        const { data: withdrawals, error: withdrawalError } = await withdrawalQuery;
        if (withdrawalError) throw withdrawalError;

        if (withdrawals) {
          allPayments.push(
            ...withdrawals.map((w) => ({
              id: w.id,
              type: 'withdrawal' as const,
              amount: Number(w.amount),
              status: w.status || 'pending',
              created_at: w.created_at,
              payment_method: w.payment_method,
            }))
          );
        }
      }

      // Sort by date
      allPayments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setPayments(allPayments);
    } catch (error) {
      console.error('Error fetching payment history:', error);
    } finally {
      setLoading(false);
    }
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
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Payment History</h1>
              <p className="text-muted-foreground">View all your deposits and withdrawals</p>
            </div>
          </div>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Filter your payment history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Select value={typeFilter} onValueChange={(value: any) => setTypeFilter(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Payment Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="deposit">Deposits</SelectItem>
                    <SelectItem value="withdrawal">Withdrawals</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-12 text-center">
                <p className="text-muted-foreground">Loading payment history...</p>
              </div>
            ) : payments.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-muted-foreground">No payment records found.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reference</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        {new Date(payment.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={payment.type === 'deposit' ? 'default' : 'secondary'}>
                          {payment.type}
                        </Badge>
                      </TableCell>
                      <TableCell className={payment.type === 'deposit' ? 'text-green-600' : 'text-red-600'}>
                        {payment.type === 'deposit' ? '+' : '-'}${payment.amount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(payment.status)}>
                          {payment.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {payment.reference || payment.payment_method || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

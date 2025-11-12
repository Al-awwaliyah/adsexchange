import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/currency';
import { useCurrency } from '@/hooks/useCurrency';
import { Users, TrendingUp, Award, CheckCircle2, XCircle } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

interface ReferralData {
  id: string;
  full_name: string;
  verified: boolean;
  created_at: string;
  nin_verified: boolean;
}

export default function ReferralDashboard() {
  const { user } = useAuth();
  const { currency } = useCurrency();
  const [referrals, setReferrals] = useState<ReferralData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchReferralData();
    }
  }, [user]);

  const fetchReferralData = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, verified, created_at, nin_verified')
        .eq('referred_by', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReferrals(data || []);
    } catch (error) {
      console.error('Error fetching referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalReferrals = referrals.length;
  const activeReferrals = referrals.filter(r => r.verified).length;
  const inactiveReferrals = totalReferrals - activeReferrals;
  const conversionRate = totalReferrals > 0 ? (activeReferrals / totalReferrals) * 100 : 0;
  
  // Placeholder for earnings calculation - can be enhanced with actual transaction data
  const earningsPerReferral = 5; // Example: $5 per verified referral
  const totalEarnings = activeReferrals * earningsPerReferral;

  const chartData = [
    { name: 'Active', value: activeReferrals, fill: 'hsl(var(--success))' },
    { name: 'Inactive', value: inactiveReferrals, fill: 'hsl(var(--muted))' },
  ];

  const chartConfig = {
    active: {
      label: "Active",
      color: "hsl(var(--success))",
    },
    inactive: {
      label: "Inactive",
      color: "hsl(var(--muted))",
    },
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalReferrals}</div>
            <p className="text-xs text-muted-foreground">
              All time referrals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Referrals</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeReferrals}</div>
            <p className="text-xs text-muted-foreground">
              Verified users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-info" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Verified / Total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <Award className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalEarnings, currency)}</div>
            <p className="text-xs text-muted-foreground">
              From referrals
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart and Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Referral Status Distribution</CardTitle>
            <CardDescription>Active vs Inactive referrals</CardDescription>
          </CardHeader>
          <CardContent>
            {totalReferrals > 0 ? (
              <ChartContainer config={chartConfig} className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No referrals yet
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Earnings Breakdown</CardTitle>
            <CardDescription>Revenue per referral status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Per Active Referral</span>
              <span className="text-lg font-bold text-success">
                {formatCurrency(earningsPerReferral, currency)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Active Referrals</span>
              <span className="text-lg font-bold">{activeReferrals}</span>
            </div>
            <div className="border-t pt-4 flex justify-between items-center">
              <span className="text-sm font-medium">Total Earnings</span>
              <span className="text-xl font-bold text-primary">
                {formatCurrency(totalEarnings, currency)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Earnings are calculated based on verified referrals. Inactive referrals don't generate revenue until verified.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Referrals List */}
      <Card>
        <CardHeader>
          <CardTitle>Referral Details</CardTitle>
          <CardDescription>All your referrals and their status</CardDescription>
        </CardHeader>
        <CardContent>
          {referrals.length > 0 ? (
            <div className="space-y-4">
              {referrals.map((referral) => (
                <div
                  key={referral.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      referral.verified ? 'bg-success/20' : 'bg-muted'
                    }`}>
                      {referral.verified ? (
                        <CheckCircle2 className="h-5 w-5 text-success" />
                      ) : (
                        <XCircle className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{referral.full_name || 'User'}</p>
                      <p className="text-sm text-muted-foreground">
                        Joined {new Date(referral.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={referral.verified ? "default" : "secondary"}>
                      {referral.verified ? 'Active' : 'Inactive'}
                    </Badge>
                    {referral.nin_verified && (
                      <Badge variant="outline" className="border-success text-success">
                        NIN Verified
                      </Badge>
                    )}
                    <span className="text-sm font-medium">
                      {referral.verified ? formatCurrency(earningsPerReferral, currency) : formatCurrency(0, currency)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No referrals yet</p>
              <p className="text-sm mt-2">Share your referral code to start earning!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

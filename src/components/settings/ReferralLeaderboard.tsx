import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface LeaderboardEntry {
  user_id: string;
  full_name: string;
  referral_count: number;
  rank: number;
}

export const ReferralLeaderboard = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      // Query to get all users and count their referrals
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, full_name, referred_by');

      if (error) throw error;

      // Count referrals for each user
      const referralCounts = new Map<string, { full_name: string; count: number }>();
      
      profiles?.forEach(profile => {
        if (profile.referred_by) {
          const current = referralCounts.get(profile.referred_by) || { full_name: '', count: 0 };
          current.count++;
          referralCounts.set(profile.referred_by, current);
        }
      });

      // Get full names for referrers
      profiles?.forEach(profile => {
        if (referralCounts.has(profile.id)) {
          const entry = referralCounts.get(profile.id)!;
          entry.full_name = profile.full_name || 'Unknown User';
        }
      });

      // Convert to array and sort by count
      const leaderboardData: LeaderboardEntry[] = Array.from(referralCounts.entries())
        .map(([user_id, data]) => ({
          user_id,
          full_name: data.full_name,
          referral_count: data.count,
          rank: 0
        }))
        .sort((a, b) => b.referral_count - a.referral_count)
        .slice(0, 10) // Top 10
        .map((entry, index) => ({
          ...entry,
          rank: index + 1
        }));

      setLeaderboard(leaderboardData);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return null;
    }
  };

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return <Badge className="bg-yellow-500 text-white hover:bg-yellow-600">🥇 1st</Badge>;
      case 2:
        return <Badge className="bg-gray-400 text-white hover:bg-gray-500">🥈 2nd</Badge>;
      case 3:
        return <Badge className="bg-amber-600 text-white hover:bg-amber-700">🥉 3rd</Badge>;
      default:
        return <Badge variant="outline">#{rank}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Referral Leaderboard</CardTitle>
          <CardDescription>Top referrers in our community</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Referral Leaderboard</CardTitle>
          <CardDescription>Top referrers in our community</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No referral data available yet. Be the first to refer someone!
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Referral Leaderboard
        </CardTitle>
        <CardDescription>Top 10 referrers in our community</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {leaderboard.map((entry) => (
            <div
              key={entry.user_id}
              className={`flex items-center gap-4 p-4 rounded-lg transition-colors ${
                entry.rank <= 3 ? 'bg-muted/50 border border-border' : 'hover:bg-muted/30'
              }`}
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="flex items-center gap-2 w-16">
                  {getRankIcon(entry.rank)}
                  {getRankBadge(entry.rank)}
                </div>

                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {entry.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <p className="font-medium">{entry.full_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {entry.referral_count} {entry.referral_count === 1 ? 'referral' : 'referrals'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

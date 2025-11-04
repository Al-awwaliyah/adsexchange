import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import AdvertiserDashboard from '@/components/dashboards/AdvertiserDashboard';
import PublisherDashboard from '@/components/dashboards/PublisherDashboard';
import AdminDashboard from '@/components/dashboards/AdminDashboard';

const Dashboard = () => {
  const { user, roles, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  if (roles.includes('admin')) {
    return <AdminDashboard />;
  }

  if (roles.includes('advertiser')) {
    return <AdvertiserDashboard />;
  }

  if (roles.includes('publisher')) {
    return <PublisherDashboard />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">No Role Assigned</h2>
        <p className="text-muted-foreground">Please contact support to get a role assigned.</p>
      </div>
    </div>
  );
};

export default Dashboard;

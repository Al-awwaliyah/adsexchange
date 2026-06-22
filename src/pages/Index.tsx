import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Megaphone, Users, Shield } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">AdExchange</h1>
          <Button onClick={() => navigate('/auth')}>Sign In</Button>
        </div>
      </header>

      <main>
        <section className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-5xl font-bold mb-6">
            Connect Advertisers with Promoters
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            The marketplace where advertisers launch campaigns and promoters earn by completing tasks on social media
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" onClick={() => navigate('/auth')}>
              Get Started
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/auth')}>
              Learn More
            </Button>
          </div>
        </section>

        <section className="container mx-auto px-4 py-16">
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <Megaphone className="h-12 w-12 text-primary mb-4" />
                <CardTitle>For Advertisers</CardTitle>
                <CardDescription>
                  Create campaigns, set your budget, and reach your target audience through social media influencers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Upload creative assets</li>
                  <li>• Set custom payout rates</li>
                  <li>• Track campaign analytics</li>
                  <li>• Approve completed tasks</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-12 w-12 text-primary mb-4" />
                <CardTitle>For Promoters</CardTitle>
                <CardDescription>
                  Monetize your social media presence by completing tasks from brands and advertisers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Browse available tasks</li>
                  <li>• Complete social media posts</li>
                  <li>• Upload proof of work</li>
                  <li>• Earn and withdraw funds</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Secure & Reliable</CardTitle>
                <CardDescription>
                  Built with escrow system, secure payments, and dispute resolution to protect both parties
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Escrow-based payments</li>
                  <li>• Verified social accounts</li>
                  <li>• Admin dispute resolution</li>
                  <li>• Multiple payment options</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="bg-primary text-primary-foreground py-16 mt-16">
          <div className="container mx-auto px-4 text-center">
            <h3 className="text-3xl font-bold mb-4">Ready to get started?</h3>
            <p className="text-lg mb-8 opacity-90">
              Join thousands of advertisers and promoters already using AdExchange
            </p>
            <Button size="lg" variant="secondary" onClick={() => navigate('/auth')}>
              Create Your Account
            </Button>
          </div>
        </section>
      </main>

    <footer className="bg-gray-100 border-t mt-10">
      <div className="max-w-7xl mx-auto px-4 py-8">

        <div className="grid md:grid-cols-3 gap-8">

          <div>
            <h3 className="font-bold text-lg">AdsExchange</h3>
            <p className="text-gray-600 mt-2">
              Connecting advertisers with promoters through simple and effective task-based marketing.
            </p>
          </div>

          <div>
            <h3 className="font-bold mb-2">Quick Links</h3>
            <div className="flex flex-col gap-2">
              <Link to="/">Home</Link>
              <Link to="/about">About</Link>
              <Link to="/contact">Contact</Link>
              <Link to="/dashboard">Dashboard</Link>
            </div>
          </div>

          <div>
            <h3 className="font-bold mb-2">Legal</h3>
            <div className="flex flex-col gap-2">
              <Link to="/privacy">Privacy Policy</Link>
              <Link to="/terms">Terms & Conditions</Link>
            </div>
          </div>

        </div>

        <div className="border-t mt-6 pt-4 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} AdsExchange. All rights reserved.
        </div>

      </div>
    </footer>
      
    </div>
  );
};

export default Index;

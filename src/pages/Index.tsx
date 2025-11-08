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
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
              <Megaphone className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold">AdExchange</h1>
          </div>
          <Button onClick={() => navigate('/auth')} size="lg">Sign In</Button>
        </div>
      </header>

      <main>
        <section className="container mx-auto px-4 py-24 text-center">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <span className="h-2 w-2 bg-primary rounded-full animate-pulse"></span>
              Trusted by advertisers and promoters worldwide
            </div>
            <h2 className="text-5xl md:text-6xl font-bold leading-tight">
              Connect Advertisers <br />
              <span className="text-primary">with Promoters</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              The marketplace where advertisers launch campaigns and promoters earn by completing tasks on social media
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button size="lg" onClick={() => navigate('/auth')} className="text-lg px-8 py-6">
                Get Started
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/auth')} className="text-lg px-8 py-6">
                Learn More
              </Button>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-20">
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-2 hover:border-primary transition-colors">
              <CardHeader>
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Megaphone className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-2xl">For Advertisers</CardTitle>
                <CardDescription className="text-base">
                  Create campaigns, set your budget, and reach your target audience through social media influencers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span>Upload creative assets</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span>Set custom payout rates</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span>Track campaign analytics</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span>Approve completed tasks</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary transition-colors">
              <CardHeader>
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-2xl">For Promoters</CardTitle>
                <CardDescription className="text-base">
                  Monetize your social media presence by completing tasks from brands and advertisers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span>Browse available tasks</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span>Complete social media posts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span>Upload proof of work</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span>Earn and withdraw funds</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary transition-colors">
              <CardHeader>
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-2xl">Secure & Reliable</CardTitle>
                <CardDescription className="text-base">
                  Built with escrow system, secure payments, and dispute resolution to protect both parties
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span>Escrow-based payments</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span>Verified social accounts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span>Admin dispute resolution</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span>Multiple payment options</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-20 mt-20">
          <div className="container mx-auto px-4 text-center">
            <h3 className="text-4xl font-bold mb-4">Ready to get started?</h3>
            <p className="text-lg mb-8 opacity-95 max-w-2xl mx-auto">
              Join thousands of advertisers and promoters already using AdExchange to grow their business
            </p>
            <Button size="lg" variant="secondary" onClick={() => navigate('/auth')} className="text-lg px-8 py-6">
              Create Your Account
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t py-12 mt-20 bg-card">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 bg-primary rounded flex items-center justify-center">
                <Megaphone className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-bold">AdExchange</span>
            </div>
            <p className="text-muted-foreground text-sm">&copy; 2025 AdExchange. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;

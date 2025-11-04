import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Megaphone, Users, Shield } from 'lucide-react';

const Auth = () => {
  const navigate = useNavigate();
  const { signUp, signIn, user } = useAuth();
  const [loading, setLoading] = useState(false);

  const [signUpData, setSignUpData] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'advertiser' as 'advertiser' | 'promoter' | 'admin'
  });

  const [signInData, setSignInData] = useState({
    email: '',
    password: ''
  });

  if (user) {
    navigate('/dashboard');
    return null;
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signUp(
      signUpData.email,
      signUpData.password,
      signUpData.fullName,
      signUpData.role
    );

    setLoading(false);

    if (error) {
      toast({
        title: 'Sign up failed',
        description: error.message,
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Success!',
        description: 'Please check your email to confirm your account.'
      });
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signIn(signInData.email, signInData.password);

    setLoading(false);

    if (error) {
      toast({
        title: 'Sign in failed',
        description: error.message,
        variant: 'destructive'
      });
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">AdExchange</CardTitle>
          <CardDescription>Connect advertisers with promoters</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="you@example.com"
                    value={signInData.email}
                    onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    value={signInData.password}
                    onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="John Doe"
                    value={signUpData.fullName}
                    onChange={(e) => setSignUpData({ ...signUpData, fullName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    value={signUpData.email}
                    onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={signUpData.password}
                    onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-3">
                  <Label>I am a...</Label>
                  <RadioGroup
                    value={signUpData.role}
                    onValueChange={(value: any) => setSignUpData({ ...signUpData, role: value })}
                  >
                    <div className="flex items-center space-x-2 p-3 border rounded-md hover:bg-accent">
                      <RadioGroupItem value="advertiser" id="advertiser" />
                      <Label htmlFor="advertiser" className="flex items-center gap-2 cursor-pointer flex-1">
                        <Megaphone className="h-4 w-4" />
                        <div>
                          <div className="font-medium">Advertiser</div>
                          <div className="text-xs text-muted-foreground">Create campaigns and reach audiences</div>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border rounded-md hover:bg-accent">
                      <RadioGroupItem value="promoter" id="promoter" />
                      <Label htmlFor="promoter" className="flex items-center gap-2 cursor-pointer flex-1">
                        <Users className="h-4 w-4" />
                        <div>
                          <div className="font-medium">Promoter</div>
                          <div className="text-xs text-muted-foreground">Complete tasks and earn money</div>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Creating account...' : 'Sign Up'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;

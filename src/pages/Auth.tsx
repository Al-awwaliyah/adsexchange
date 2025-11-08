import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Megaphone, Users, Shield } from 'lucide-react';
import { authSchema } from '@/lib/validation';

const Auth = () => {
  const navigate = useNavigate();
  const { signUp, signIn, user } = useAuth();
  const [loading, setLoading] = useState(false);

  const [signUpData, setSignUpData] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'advertiser' as 'advertiser' | 'promoter' | 'admin',
    currency: 'USD' as 'USD' | 'NGN',
    referralCode: ''
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

    try {
      // Validate form data
      const validatedData = authSchema.parse({
        email: signUpData.email,
        password: signUpData.password,
        fullName: signUpData.fullName,
        role: signUpData.role,
        currency: signUpData.currency,
      });

      const { error } = await signUp(
        validatedData.email,
        validatedData.password,
        validatedData.fullName!,
        validatedData.role!,
        validatedData.currency!,
        signUpData.referralCode || undefined
      );

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
    } catch (error: any) {
      if (error.errors) {
        // Zod validation error
        const firstError = error.errors[0];
        toast({
          title: 'Validation Error',
          description: firstError.message,
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Basic email validation for sign-in (no strict password validation)
      const validatedData = authSchema.partial({ password: true, fullName: true, role: true, currency: true }).parse({
        email: signInData.email,
      });

      const { error } = await signIn(validatedData.email, signInData.password);

      if (error) {
        toast({
          title: 'Sign in failed',
          description: error.message,
          variant: 'destructive'
        });
      } else {
        navigate('/dashboard');
      }
    } catch (error: any) {
      if (error.errors) {
        toast({
          title: 'Validation Error',
          description: error.errors[0].message,
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive'
        });
      }
    } finally {
      setLoading(false);
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
                    minLength={8}
                  />
                  <p className="text-xs text-muted-foreground">
                    Must be at least 8 characters with uppercase, lowercase, and a number
                  </p>
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
                <div className="space-y-2">
                  <Label htmlFor="currency">Preferred Currency</Label>
                  <Select
                    value={signUpData.currency}
                    onValueChange={(value: any) => setSignUpData({ ...signUpData, currency: value })}
                  >
                    <SelectTrigger id="currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">$ US Dollar (USD)</SelectItem>
                      <SelectItem value="NGN">₦ Nigerian Naira (NGN)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="referralCode">Referral Code (Optional)</Label>
                  <Input
                    id="referralCode"
                    type="text"
                    value={signUpData.referralCode}
                    onChange={(e) => setSignUpData({ ...signUpData, referralCode: e.target.value.toUpperCase() })}
                    placeholder="Enter referral code"
                    maxLength={8}
                  />
                  <p className="text-xs text-muted-foreground">
                    Have a referral code? Enter it here to connect with your referrer
                  </p>
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

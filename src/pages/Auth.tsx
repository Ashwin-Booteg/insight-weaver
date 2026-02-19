import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (session?.user) navigate('/');
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) navigate('/');
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast({ title: 'Login failed', description: error.message, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen dot-grid flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient glow blobs */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/8 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-accent/6 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm animate-fade-in">
        {/* Brand mark */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 mb-5">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Starzopp</h1>
          <p className="text-sm text-muted-foreground mt-1">ICP Intelligence Platform</p>
        </div>

        {/* Form card */}
        <div className="glass border border-border rounded-2xl p-8">
          <h2 className="text-lg font-semibold mb-6">Sign in</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block uppercase tracking-wider">Email</label>
              <Input
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 bg-background/60 border-border/60 focus:border-primary/60 rounded-xl placeholder:text-muted-foreground/40"
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block uppercase tracking-wider">Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 bg-background/60 border-border/60 focus:border-primary/60 rounded-xl placeholder:text-muted-foreground/40"
                required
                minLength={6}
              />
            </div>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 mt-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-xl shadow-lg shadow-primary/20 transition-all hover:shadow-primary/30 hover:shadow-xl"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <span className="flex items-center gap-2">Continue <ArrowRight className="w-4 h-4" /></span>
              )}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground/50 mt-6">
          Secure analytics · End-to-end encrypted
        </p>
      </div>
    </div>
  );
};

export default Auth;

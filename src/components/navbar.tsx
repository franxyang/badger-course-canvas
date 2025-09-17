import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { User } from '@supabase/supabase-js';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-accent border border-border rounded-lg flex items-center justify-center">
              <span className="text-foreground font-bold text-sm">M</span>
            </div>
            <span className="text-xl font-bold text-foreground">MADSPACE</span>
          </div>

          {/* Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Button
              variant="ghost"
              onClick={() => navigate('/reviews')}
              className="text-muted-foreground hover:text-foreground"
            >
              Browse Reviews
            </Button>
            <Button
              variant="ghost"
              className="text-muted-foreground hover:text-foreground"
            >
              Catalog
            </Button>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-lg mx-8 hidden lg:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <input
                type="text"
                placeholder="Search courses (e.g., MATH 521)..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const query = (e.target as HTMLInputElement).value;
                    if (query.trim()) {
                      navigate(`/reviews?q=${encodeURIComponent(query.trim())}`);
                    }
                  }
                }}
              />
            </div>
          </div>

          {/* Auth */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Button
                  variant="ghost"
                  onClick={() => navigate('/account')}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Account
                </Button>
                <Button variant="outline" onClick={handleSignOut}>
                  Sign Out
                </Button>
              </>
            ) : (
              <Button onClick={() => navigate('/auth')}>
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Calendar, ExternalLink, BookOpen, Users, TrendingUp } from 'lucide-react';
import { Navbar } from "@/components/navbar";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const today = new Date();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/reviews?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const quickLinks = [
    { name: 'Canvas', url: 'https://canvas.wisc.edu', icon: ExternalLink },
    { name: 'Student Center', url: 'https://studentcenter.wisc.edu', icon: ExternalLink },
    { name: 'Course Catalog', url: 'https://guide.wisc.edu', icon: BookOpen },
  ];

  const featuredStats = [
    { label: 'Total Reviews', value: '2,847', icon: Users },
    { label: 'Courses Covered', value: '1,234', icon: BookOpen },
    { label: 'Active Reviewers', value: '892', icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Welcome to <span className="bg-gradient-primary bg-clip-text text-transparent">MADSPACE</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Your trusted platform for UW-Madison course reviews. Share experiences and discover the best classes for your academic journey.
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search courses (e.g., MATH 521, Computer Science, Prof. Smith)..."
                className="w-full pl-12 pr-4 py-4 text-lg rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent shadow-card"
              />
              <Button 
                type="submit" 
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
                size="sm"
              >
                Search
              </Button>
            </div>
          </form>

          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <Button onClick={() => navigate('/reviews')} variant="outline" size="lg">
              Browse All Reviews
            </Button>
            <Button onClick={() => navigate('/reviews?sort=popular')} variant="outline" size="lg">
              Popular Courses
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {featuredStats.map((stat) => (
            <Card key={stat.label} className="text-center">
              <CardContent className="pt-6">
                <stat.icon className="h-8 w-8 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold text-foreground mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Links and Calendar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Links */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ExternalLink className="h-5 w-5 mr-2" />
                  Quick Links
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {quickLinks.map((link) => (
                    <a
                      key={link.name}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center p-4 rounded-lg border border-border hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      <link.icon className="h-5 w-5 mr-3 text-primary" />
                      <span className="font-medium">{link.name}</span>
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Mini Calendar */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">
                  {today.getDate()}
                </div>
                <div className="text-sm text-muted-foreground">
                  {today.toLocaleDateString('en-US', { 
                    weekday: 'long',
                    month: 'long',
                    year: 'numeric'
                  })}
                </div>
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    Ready to share your course experience?
                  </p>
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => navigate('/reviews')}>
                    Write a Review
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <Card className="mt-12 bg-gradient-primary text-primary-foreground">
          <CardContent className="text-center py-12">
            <h2 className="text-3xl font-bold mb-4">Join the MADSPACE Community</h2>
            <p className="text-lg mb-6 opacity-90">
              Help fellow Badgers make informed course decisions. Your reviews matter!
            </p>
            <Button variant="secondary" size="lg" onClick={() => navigate('/auth')}>
              Get Started Today
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
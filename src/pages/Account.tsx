import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { User } from '@supabase/supabase-js';
import { Upload, FileText, User as UserIcon, Mail } from 'lucide-react';

interface TakenCourse {
  course_code: string;
  semester: string;
  grade: string;
}

export default function Account() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [takenCourses, setTakenCourses] = useState<TakenCourse[]>([]);
  const [csvFile, setCsvFile] = useState<File | null>(null);

  useEffect(() => {
    // Check authentication
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/auth');
        return;
      }
      setUser(session.user);
      setLoading(false);
      
      // Load taken courses from localStorage
      const savedCourses = localStorage.getItem('madspace_taken_courses');
      if (savedCourses) {
        try {
          setTakenCourses(JSON.parse(savedCourses));
        } catch (error) {
          console.error('Error parsing saved courses:', error);
        }
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) {
          navigate('/auth');
        } else {
          setUser(session.user);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setCsvFile(file);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const csv = event.target?.result as string;
        const lines = csv.split('\n');
        const courses: TakenCourse[] = [];
        
        // Skip header row, parse data
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (line) {
            const [course_code, semester, grade] = line.split(',').map(s => s.trim());
            if (course_code && semester && grade) {
              courses.push({ course_code, semester, grade });
            }
          }
        }
        
        setTakenCourses(courses);
        localStorage.setItem('madspace_taken_courses', JSON.stringify(courses));
      };
      
      reader.readAsText(file);
    }
  };

  const clearTakenCourses = () => {
    setTakenCourses([]);
    setCsvFile(null);
    localStorage.removeItem('madspace_taken_courses');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-4">Account</h1>
          <p className="text-muted-foreground">
            Manage your profile and course history
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserIcon className="h-5 w-5 mr-2" />
                Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <div className="text-foreground">{user?.user_metadata?.name || 'Not provided'}</div>
              </div>
              
              <div className="space-y-2">
                <Label>Email</Label>
                <div className="text-foreground flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                  {user?.email}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Account Status</Label>
                <Badge variant="secondary">
                  {user?.email?.endsWith('@wisc.edu') ? 'UW-Madison Student' : 'Verified User'}
                </Badge>
              </div>

              <div className="pt-4 border-t border-border">
                <Button variant="outline" className="w-full" onClick={() => navigate('/reviews')}>
                  Browse Reviews
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Taken Courses Upload */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Upload className="h-5 w-5 mr-2" />
                  Course History (Optional)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Upload a CSV file of courses you've taken to see "You took this" badges on course pages. 
                  This data is stored only in your browser and is not shared.
                </p>

                <div className="space-y-2">
                  <Label htmlFor="csv-upload">Upload CSV File</Label>
                  <Input
                    id="csv-upload"
                    type="file"
                    accept=".csv"
                    onChange={handleCsvUpload}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground">
                    Expected format: course_code,semester,grade<br/>
                    Example: MATH 521,2024-FA,A
                  </p>
                </div>

                {takenCourses.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium">
                        Uploaded Courses ({takenCourses.length})
                      </h3>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={clearTakenCourses}
                      >
                        Clear All
                      </Button>
                    </div>

                    <div className="max-h-64 overflow-y-auto border border-border rounded-lg">
                      <div className="divide-y divide-border">
                        {takenCourses.slice(0, 10).map((course, index) => (
                          <div key={index} className="p-3 flex justify-between items-center">
                            <div>
                              <div className="font-medium text-sm">{course.course_code}</div>
                              <div className="text-xs text-muted-foreground">{course.semester}</div>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {course.grade}
                            </Badge>
                          </div>
                        ))}
                        {takenCourses.length > 10 && (
                          <div className="p-3 text-center text-sm text-muted-foreground">
                            ... and {takenCourses.length - 10} more courses
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {csvFile && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <FileText className="h-4 w-4 mr-2" />
                    Uploaded: {csvFile.name}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Review Activity (Placeholder) */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Your Review Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                You haven't written any reviews yet.
              </p>
              <Button onClick={() => navigate('/reviews')}>
                Write Your First Review
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
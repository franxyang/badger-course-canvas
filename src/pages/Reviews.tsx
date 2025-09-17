import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Navbar } from "@/components/navbar";
import { CourseCard } from "@/components/course-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, SortAsc } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";

interface Course {
  id: string;
  code: string;
  name: string;
  description?: string;
  credits?: number;
  department?: string;
  averageRatings?: {
    content: number;
    teaching: number;
    grading: number;
    workload: number;
  };
  reviewCount?: number;
}

const ITEMS_PER_PAGE = 12;

export default function Reviews() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Filters and search
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'popularity');
  const [departmentFilter, setDepartmentFilter] = useState(searchParams.get('dept') || 'all');
  const [levelFilter, setLevelFilter] = useState(searchParams.get('level') || 'all');
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1'));

  const departments = ['MATH', 'CS', 'PHYS', 'CHEM', 'ECON', 'HIST', 'ENGL', 'PSYC'];
  const levels = ['100', '200', '300', '400', '500+'];

  useEffect(() => {
    fetchCourses();
  }, [searchQuery, sortBy, departmentFilter, levelFilter, currentPage]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('courses')
        .select(`
          id,
          code,
          name,
          description,
          credits,
          departments!inner(code, name)
        `, { count: 'exact' });

      // Apply filters
      if (searchQuery) {
        query = query.or(`code.ilike.%${searchQuery}%,name.ilike.%${searchQuery}%`);
      }

      if (departmentFilter && departmentFilter !== 'all') {
        query = query.eq('departments.code', departmentFilter);
      }

      if (levelFilter && levelFilter !== 'all') {
        if (levelFilter === '500+') {
          query = query.gte('code', `${departmentFilter || ''} 500`);
        } else {
          const levelNum = parseInt(levelFilter);
          query = query.gte('code', `${departmentFilter || ''} ${levelNum}`)
                      .lt('code', `${departmentFilter || ''} ${levelNum + 100}`);
        }
      }

      // Apply sorting
      switch (sortBy) {
        case 'name':
          query = query.order('name');
          break;
        case 'code':
          query = query.order('code');
          break;
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        default: // popularity
          query = query.order('code'); // For now, will add review count later
      }

      // Pagination
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching courses:', error);
        return;
      }

      // Transform data
      const transformedCourses: Course[] = data?.map(course => ({
        id: course.id,
        code: course.code,
        name: course.name,
        description: course.description,
        credits: course.credits,
        department: course.departments?.name || '',
        // TODO: Fetch actual review statistics
        averageRatings: {
          content: Math.random() * 5,
          teaching: Math.random() * 5,
          grading: Math.random() * 5,
          workload: Math.random() * 5,
        },
        reviewCount: Math.floor(Math.random() * 50),
      })) || [];

      setCourses(transformedCourses);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSearchParams = (updates: Record<string, string>) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    });
    setSearchParams(newParams);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateSearchParams({ q: searchQuery, page: '1' });
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-4">Course Reviews</h1>
          <p className="text-muted-foreground">
            Discover and share experiences about UW-Madison courses
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="h-5 w-5 mr-2" />
              Search & Filter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search courses by code, name, or description..."
                  className="pl-10"
                />
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Select 
                  value={departmentFilter} 
                  onValueChange={(value) => {
                    const filterValue = value === 'all' ? '' : value;
                    setDepartmentFilter(filterValue);
                    updateSearchParams({ dept: filterValue, page: '1' });
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map(dept => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select 
                  value={levelFilter}
                  onValueChange={(value) => {
                    const filterValue = value === 'all' ? '' : value;
                    setLevelFilter(filterValue);
                    updateSearchParams({ level: filterValue, page: '1' });
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Course Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    {levels.map(level => (
                      <SelectItem key={level} value={level}>{level} Level</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select 
                  value={sortBy}
                  onValueChange={(value) => {
                    setSortBy(value);
                    updateSearchParams({ sort: value, page: '1' });
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="popularity">Most Popular</SelectItem>
                    <SelectItem value="name">Course Name</SelectItem>
                    <SelectItem value="code">Course Code</SelectItem>
                    <SelectItem value="newest">Newest</SelectItem>
                  </SelectContent>
                </Select>

                <Button type="submit" className="w-full">
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>

              {/* Active Filters */}
              {(searchQuery || (departmentFilter && departmentFilter !== 'all') || (levelFilter && levelFilter !== 'all')) && (
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm text-muted-foreground">Active filters:</span>
                  {searchQuery && (
                    <Badge variant="secondary" className="text-xs">
                      Search: {searchQuery}
                    </Badge>
                  )}
                  {departmentFilter && departmentFilter !== 'all' && (
                    <Badge variant="secondary" className="text-xs">
                      Department: {departmentFilter}
                    </Badge>
                  )}
                  {levelFilter && levelFilter !== 'all' && (
                    <Badge variant="secondary" className="text-xs">
                      Level: {levelFilter}
                    </Badge>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      setSearchQuery('');
                      setDepartmentFilter('all');
                      setLevelFilter('all');
                      setSearchParams({});
                      setCurrentPage(1);
                    }}
                    className="h-6 px-2 text-xs"
                  >
                    Clear all
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-muted-foreground">
            {loading ? 'Loading...' : `${totalCount} courses found`}
          </p>
          <div className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </div>
        </div>

        {/* Course Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded"></div>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded"></div>
                    <div className="h-4 bg-muted rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : courses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <CourseCard
                key={course.id}
                code={course.code}
                name={course.name}
                description={course.description}
                credits={course.credits}
                department={course.department}
                averageRatings={course.averageRatings}
                reviewCount={course.reviewCount}
                onClick={() => navigate(`/courses/${encodeURIComponent(course.code)}`)}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground mb-4">No courses found matching your criteria</p>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchQuery('');
                  setDepartmentFilter('');
                  setLevelFilter('');
                  setSearchParams({});
                  setCurrentPage(1);
                }}
              >
                Clear filters
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-8 space-x-2">
            <Button
              variant="outline"
              disabled={currentPage === 1}
              onClick={() => {
                const newPage = currentPage - 1;
                setCurrentPage(newPage);
                updateSearchParams({ page: newPage.toString() });
              }}
            >
              Previous
            </Button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = Math.max(1, currentPage - 2) + i;
              if (page > totalPages) return null;
              
              return (
                <Button
                  key={page}
                  variant={page === currentPage ? "default" : "outline"}
                  onClick={() => {
                    setCurrentPage(page);
                    updateSearchParams({ page: page.toString() });
                  }}
                >
                  {page}
                </Button>
              );
            })}
            
            <Button
              variant="outline"
              disabled={currentPage === totalPages}
              onClick={() => {
                const newPage = currentPage + 1;
                setCurrentPage(newPage);
                updateSearchParams({ page: newPage.toString() });
              }}
            >
              Next
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
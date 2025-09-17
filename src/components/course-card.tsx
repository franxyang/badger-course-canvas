import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RatingBadge } from "@/components/ui/rating-badge";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Users } from 'lucide-react';

interface CourseCardProps {
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
  onClick?: () => void;
}

// Convert numeric rating (1-5) to UW letter grade
const ratingToGrade = (rating: number) => {
  if (rating >= 4.7) return 'A';
  if (rating >= 4.2) return 'AB';
  if (rating >= 3.7) return 'B';
  if (rating >= 3.2) return 'BC';
  if (rating >= 2.5) return 'C';
  if (rating >= 1.5) return 'D';
  return 'F';
};

export function CourseCard({
  code,
  name,
  description,
  credits,
  department,
  averageRatings,
  reviewCount = 0,
  onClick
}: CourseCardProps) {
  return (
    <Card 
      className="hover:shadow-elegant transition-all duration-300 cursor-pointer group"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
              {code}
            </CardTitle>
            <p className="text-sm font-medium text-muted-foreground mt-1">
              {name}
            </p>
          </div>
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            {credits && (
              <div className="flex items-center">
                <BookOpen className="h-3 w-3 mr-1" />
                {credits} cr
              </div>
            )}
            {reviewCount > 0 && (
              <div className="flex items-center">
                <Users className="h-3 w-3 mr-1" />
                {reviewCount}
              </div>
            )}
          </div>
        </div>
        
        {department && (
          <Badge variant="secondary" className="w-fit text-xs">
            {department}
          </Badge>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        {description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {description}
          </p>
        )}

        {averageRatings && (
          <div className="grid grid-cols-2 gap-2">
            <RatingBadge 
              grade={ratingToGrade(averageRatings.content)} 
              label="Content" 
              size="sm"
            />
            <RatingBadge 
              grade={ratingToGrade(averageRatings.teaching)} 
              label="Teaching" 
              size="sm"
            />
            <RatingBadge 
              grade={ratingToGrade(averageRatings.grading)} 
              label="Grading" 
              size="sm"
            />
            <RatingBadge 
              grade={ratingToGrade(averageRatings.workload)} 
              label="Workload" 
              size="sm"
            />
          </div>
        )}

        {!averageRatings && (
          <div className="text-center text-sm text-muted-foreground py-4">
            No reviews yet
          </div>
        )}
      </CardContent>
    </Card>
  );
}
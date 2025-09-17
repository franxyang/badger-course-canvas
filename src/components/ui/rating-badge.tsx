import { cn } from "@/lib/utils";

type UWGrade = 'A' | 'AB' | 'B' | 'BC' | 'C' | 'D' | 'F';

interface RatingBadgeProps {
  grade: UWGrade;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const gradeColors: Record<UWGrade, string> = {
  'A': 'bg-primary text-primary-foreground',
  'AB': 'bg-primary/90 text-primary-foreground',
  'B': 'bg-primary/70 text-primary-foreground',
  'BC': 'bg-primary/50 text-primary-foreground',
  'C': 'bg-muted text-foreground',
  'D': 'bg-destructive/70 text-destructive-foreground',
  'F': 'bg-destructive text-destructive-foreground',
};

const sizeClasses = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-1.5 text-sm',
  lg: 'px-4 py-2 text-base',
};

export function RatingBadge({ grade, label, size = 'md', className }: RatingBadgeProps) {
  return (
    <div className={cn(
      'inline-flex items-center justify-center rounded-md font-semibold',
      gradeColors[grade],
      sizeClasses[size],
      className
    )}>
      {label && <span className="mr-1">{label}:</span>}
      <span>{grade}</span>
    </div>
  );
}
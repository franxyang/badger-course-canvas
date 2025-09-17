import { cn } from "@/lib/utils";

type UWGrade = 'A' | 'AB' | 'B' | 'BC' | 'C' | 'D' | 'F';

interface RatingBadgeProps {
  grade: UWGrade;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const gradeColors: Record<UWGrade, string> = {
  'A': 'bg-green-100 text-green-800 border border-green-200',
  'AB': 'bg-green-50 text-green-700 border border-green-200',
  'B': 'bg-blue-50 text-blue-700 border border-blue-200',
  'BC': 'bg-blue-50 text-blue-600 border border-blue-200',
  'C': 'bg-yellow-50 text-yellow-700 border border-yellow-200',
  'D': 'bg-orange-50 text-orange-700 border border-orange-200',
  'F': 'bg-red-50 text-red-700 border border-red-200',
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
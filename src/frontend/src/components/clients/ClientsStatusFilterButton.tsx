import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Filter, Check } from 'lucide-react';

type FilterType = 'all' | 'active' | 'paused' | 'expired' | 'expiring' | 'half' | 'full';

interface FilterOption {
  value: FilterType;
  label: string;
}

const filterOptions: FilterOption[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'half', label: 'Half' },
  { value: 'full', label: 'Full' },
  { value: 'paused', label: 'Paused' },
  { value: 'expiring', label: 'Expiring' },
  { value: 'expired', label: 'Expired' },
];

interface ClientsStatusFilterButtonProps {
  currentFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  getFilterCount: (filter: FilterType) => number;
}

export function ClientsStatusFilterButton({
  currentFilter,
  onFilterChange,
  getFilterCount,
}: ClientsStatusFilterButtonProps) {
  const currentLabel = filterOptions.find((opt) => opt.value === currentFilter)?.label || 'All';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          Filter: {currentLabel}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {filterOptions.map((option) => {
          const count = getFilterCount(option.value);
          const isSelected = currentFilter === option.value;
          
          return (
            <DropdownMenuItem
              key={option.value}
              onClick={() => onFilterChange(option.value)}
              className="flex items-center justify-between cursor-pointer"
            >
              <span className="flex items-center gap-2">
                {isSelected && <Check className="h-4 w-4" />}
                {!isSelected && <span className="w-4" />}
                {option.label}
              </span>
              <span className="text-xs text-muted-foreground ml-2">({count})</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

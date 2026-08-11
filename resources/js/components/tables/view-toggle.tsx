import { Button } from '@/components/ui/button';
import { Table, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ViewToggleProps {
    viewMode: 'table' | 'cards' | 'grouped';
    onViewChange: (mode: 'table' | 'cards' | 'grouped') => void;
    className?: string;
}

export function ViewToggle({ viewMode, onViewChange, className }: ViewToggleProps) {
    return (
        <div className={cn('flex items-center gap-1 border rounded-md p-1', className)}>
            <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewChange('table')}
                className="h-8"
            >
                <Table className="h-4 w-4" />
            </Button>
            <Button
                variant={viewMode !== 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewChange(viewMode === 'table' ? 'cards' : 'table')}
                className="h-8"
            >
                <LayoutGrid className="h-4 w-4" />
            </Button>
        </div>
    );
}

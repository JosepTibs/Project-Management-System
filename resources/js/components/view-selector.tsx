import React from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Columns3, BarChart3, Calendar } from 'lucide-react';
import { usePage } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';

type ViewType = 'kanban' | 'gantt' | 'calendar';

interface ViewSelectorProps {
    currentView: ViewType;
    onViewChange: (view: ViewType) => void;
}

export default function ViewSelector({ currentView, onViewChange }: ViewSelectorProps) {
    const { project } = usePage<{ project: { id: number; name: string } }>().props;

    const viewConfig = {
        kanban: {
            icon: Columns3,
            label: 'Kanban Board',
            shortLabel: 'Kanban',
        },
        gantt: {
            icon: BarChart3,
            label: 'Gantt Chart',
            shortLabel: 'Gantt',
        },
        calendar: {
            icon: Calendar,
            label: 'Calendar View',
            shortLabel: 'Calendar',
        },
    };

    const currentConfig = viewConfig[currentView];
    const CurrentIcon = currentConfig.icon;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                    <CurrentIcon className="mr-1.5 h-4 w-4" />
                    {currentConfig.shortLabel}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {(Object.keys(viewConfig) as ViewType[]).map((view) => {
                    const config = viewConfig[view];
                    const Icon = config.icon;
                    return (
                        <DropdownMenuItem
                            key={view}
                            onClick={() => onViewChange(view)}
                            className={currentView === view ? 'bg-accent' : ''}
                        >
                            <Icon className="mr-2 h-4 w-4" />
                            <span>{config.label}</span>
                            {currentView === view && (
                                <span className="ml-auto text-xs text-muted-foreground">✓</span>
                            )}
                        </DropdownMenuItem>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
import React, { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface WorkItem {
    id: number;
    title: string;
    priority: string;
    due_date: string | null;
    progress: number;
}

interface Milestone {
    id: number;
    name: string;
    target_date: string;
    completed_at: string | null;
}

interface CalendarViewProps {
    workItems: WorkItem[];
    milestones: Milestone[];
}

const DAY_WIDTH = 80;
const ROW_HEIGHT = 80;
const HEADER_HEIGHT = 40;

function stripTime(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isSameDay(a: Date, b: Date) {
    return a.getFullYear() === b.getFullYear() &&
           a.getMonth() === b.getMonth() &&
           a.getDate() === b.getDate();
}

function getPriorityColor(priority: string): string {
    switch (priority) {
        case 'critical': return 'bg-red-100 border-red-400 text-red-800 dark:bg-red-900/30 dark:border-red-600 dark:text-red-300';
        case 'high': return 'bg-orange-100 border-orange-400 text-orange-800 dark:bg-orange-900/30 dark:border-orange-600 dark:text-orange-300';
        case 'medium': return 'bg-yellow-100 border-yellow-400 text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-600 dark:text-yellow-300';
        case 'low': return 'bg-green-100 border-green-400 text-green-800 dark:bg-green-900/30 dark:border-green-600 dark:text-green-300';
        default: return 'bg-gray-100 border-gray-400 text-gray-800 dark:bg-gray-900/30 dark:border-gray-600 dark:text-gray-300';
    }
}

export default function CalendarView({ workItems, milestones }: CalendarViewProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Get first day of month and total days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday

    // Get today's date for highlighting
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

    // Navigate to previous month
    const goToPreviousMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1));
    };

    // Navigate to next month
    const goToNextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1));
    };

    // Get items for a specific day
    const getItemsForDay = (day: number) => {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        const dayWorkItems = workItems.filter(item => item.due_date === dateStr);
        const dayMilestones = milestones.filter(m => {
            if (!m.target_date) return false;
            const mDate = new Date(m.target_date);
            return mDate.getFullYear() === year && mDate.getMonth() === month && mDate.getDate() === day;
        });

        return { dayWorkItems, dayMilestones };
    };

    // Generate calendar days
    const calendarDays = useMemo(() => {
        const days: Array<{ date: Date; day: number; isCurrentMonth: boolean }> = [];

        // Previous month days
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = startingDayOfWeek - 1; i >= 0; i--) {
            const day = prevMonthLastDay - i;
            days.push({
                date: new Date(year, month - 1, day),
                day,
                isCurrentMonth: false,
            });
        }

        // Current month days
        for (let day = 1; day <= daysInMonth; day++) {
            days.push({
                date: new Date(year, month, day),
                day,
                isCurrentMonth: true,
            });
        }

        // Next month days (fill to complete 6 rows = 42 cells)
        const remainingDays = 42 - days.length;
        for (let day = 1; day <= remainingDays; day++) {
            days.push({
                date: new Date(year, month + 1, day),
                day,
                isCurrentMonth: false,
            });
        }

        return days;
    }, [year, month, daysInMonth, startingDayOfWeek]);

    const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    return (
        <div className="w-full max-w-full min-w-0 rounded-lg border bg-background overflow-hidden">
            {/* Calendar Header */}
            <div className="flex items-center justify-between p-4 border-b bg-muted/40">
                <div className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                    <h3 className="text-lg font-semibold">{monthName}</h3>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={goToPreviousMonth}
                        className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent transition-colors"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                        onClick={goToNextMonth}
                        className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent transition-colors"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="overflow-x-auto">
                <div className="min-w-[560px]">
                    {/* Day headers */}
                    <div className="grid grid-cols-7 border-b bg-muted/20">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                            <div
                                key={day}
                                className="flex items-center justify-center py-2 text-xs font-semibold text-muted-foreground border-r last:border-r-0"
                            >
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar cells */}
                    <div className="grid grid-cols-7">
                        {calendarDays.map((cell, index) => {
                            const { dayWorkItems, dayMilestones } = getItemsForDay(cell.day);
                            const isToday = isCurrentMonth && isSameDay(cell.date, today);
                            const hasItems = dayWorkItems.length > 0 || dayMilestones.length > 0;

                            return (
                                <div
                                    key={index}
                                    className={`min-h-[80px] border-r border-b last:border-r-0 transition-colors ${
                                        !cell.isCurrentMonth ? 'bg-muted/10' : 'bg-background'
                                    } ${hasItems ? 'hover:bg-muted/20' : ''}`}
                                >
                                    <div className="p-1.5">
                                        <div className={`text-sm font-medium mb-1 ${
                                            !cell.isCurrentMonth ? 'text-muted-foreground/50' : 'text-foreground'
                                        } ${isToday ? 'inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-600 text-white' : ''}`}>
                                            {cell.day}
                                        </div>
                                        
                                        {/* Milestones */}
                                        <div className="space-y-0.5">
                                            {dayMilestones.map((milestone) => (
                                                <Tooltip key={milestone.id}>
                                                    <TooltipTrigger asChild>
                                                        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-400 border border-amber-300 dark:border-amber-600 cursor-pointer">
                                                            <span className="text-xs">◆</span>
                                                            <span className="truncate">{milestone.name}</span>
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="top" className="max-w-[200px]">
                                                        <p className="font-medium">{milestone.name}</p>
                                                        <p className="text-xs text-muted-foreground">Milestone</p>
                                                        {milestone.completed_at && (
                                                            <p className="text-xs text-emerald-600">✓ Completed</p>
                                                        )}
                                                    </TooltipContent>
                                                </Tooltip>
                                            ))}
                                        </div>

                                        {/* Work items */}
                                        <div className="space-y-0.5 mt-0.5">
                                            {dayWorkItems.slice(0, 3).map((item) => (
                                                <Tooltip key={item.id}>
                                                    <TooltipTrigger asChild>
                                                        <div className={`px-1.5 py-0.5 rounded text-[10px] font-medium border cursor-pointer truncate ${getPriorityColor(item.priority)}`}>
                                                            {item.title}
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="top" className="max-w-[200px]">
                                                        <p className="font-medium">{item.title}</p>
                                                        <p className="text-xs text-muted-foreground capitalize">{item.priority} priority</p>
                                                        <p className="text-xs text-muted-foreground">Progress: {item.progress}%</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            ))}
                                            {dayWorkItems.length > 3 && (
                                                <div className="text-[10px] text-muted-foreground px-1.5">
                                                    +{dayWorkItems.length - 3} more
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
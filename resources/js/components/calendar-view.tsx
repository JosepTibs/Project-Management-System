import React, { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Diamond } from 'lucide-react';
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

const MAX_VISIBLE_ITEMS = 3;

function isSameDay(a: Date, b: Date) {
    return a.getFullYear() === b.getFullYear() &&
           a.getMonth() === b.getMonth() &&
           a.getDate() === b.getDate();
}

// Priority now drives a left accent bar + small dot, not a full-fill badge.
// Keeps the eye focused on the milestone (amber) as the one "loud" color per cell.
const PRIORITY_STYLES: Record<string, { bar: string; dot: string; text: string; rank: number }> = {
    critical: { bar: 'border-red-500',    dot: 'bg-red-500',    text: 'text-red-900 dark:text-red-300',       rank: 0 },
    high:     { bar: 'border-orange-500', dot: 'bg-orange-500', text: 'text-orange-900 dark:text-orange-300', rank: 1 },
    medium:   { bar: 'border-yellow-500', dot: 'bg-yellow-500', text: 'text-yellow-900 dark:text-yellow-300', rank: 2 },
    low:      { bar: 'border-green-500',  dot: 'bg-green-500',  text: 'text-green-900 dark:text-green-300',   rank: 3 },
    default:  { bar: 'border-gray-400',   dot: 'bg-gray-400',   text: 'text-gray-800 dark:text-gray-300',     rank: 4 },
};

function getPriorityStyle(priority: string) {
    return PRIORITY_STYLES[priority] ?? PRIORITY_STYLES.default;
}

type DayCellItem =
    | { kind: 'work'; id: number; sortKey: number; item: WorkItem }
    | { kind: 'milestone'; id: number; sortKey: number; item: Milestone };

export default function CalendarView({ workItems, milestones }: CalendarViewProps) {
    const [currentDate, setCurrentDate] = useState(new Date());

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

    const goToPreviousMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const goToNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
    const goToToday = () => setCurrentDate(new Date());

    // Milestones are now capped and merged into one sorted, overflow-aware list per day,
    // instead of rendering unbounded and stretching that row taller than its neighbors.
    const getItemsForDay = (day: number): { visible: DayCellItem[]; overflowCount: number } => {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        const dayWorkItems: DayCellItem[] = workItems
            .filter(item => item.due_date === dateStr)
            .map(item => ({ kind: 'work', id: item.id, sortKey: getPriorityStyle(item.priority).rank, item }));

        const dayMilestones: DayCellItem[] = milestones
            .filter(m => {
                if (!m.target_date) return false;
                const mDate = new Date(m.target_date);
                return mDate.getFullYear() === year && mDate.getMonth() === month && mDate.getDate() === day;
            })
            .map(item => ({ kind: 'milestone', id: item.id, sortKey: -1, item })); // milestones surface first

        const all = [...dayMilestones, ...dayWorkItems].sort((a, b) => a.sortKey - b.sortKey);

        return {
            visible: all.slice(0, MAX_VISIBLE_ITEMS),
            overflowCount: Math.max(0, all.length - MAX_VISIBLE_ITEMS),
        };
    };

    const calendarDays = useMemo(() => {
        const days: Array<{ date: Date; day: number; isCurrentMonth: boolean }> = [];

        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = startingDayOfWeek - 1; i >= 0; i--) {
            const day = prevMonthLastDay - i;
            days.push({ date: new Date(year, month - 1, day), day, isCurrentMonth: false });
        }
        for (let day = 1; day <= daysInMonth; day++) {
            days.push({ date: new Date(year, month, day), day, isCurrentMonth: true });
        }
        const remainingDays = 42 - days.length;
        for (let day = 1; day <= remainingDays; day++) {
            days.push({ date: new Date(year, month + 1, day), day, isCurrentMonth: false });
        }

        return days;
    }, [year, month, daysInMonth, startingDayOfWeek]);

    const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    return (
        <TooltipProvider>
            <div className="w-full max-w-full min-w-0 rounded-lg border bg-background overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between gap-3 p-4 border-b bg-muted/40">
                    <div className="flex items-center gap-2 min-w-0">
                        <CalendarIcon className="h-5 w-5 text-muted-foreground shrink-0" />
                        <h3 className="text-lg font-semibold truncate">{monthName}</h3>
                    </div>

                    {/* Compact legend — makes the accent-bar convention legible without a key elsewhere */}
                    <div className="hidden sm:flex items-center gap-3 text-[11px] text-muted-foreground">
                        {(['critical', 'high', 'medium', 'low'] as const).map((p) => (
                            <div key={p} className="flex items-center gap-1">
                                <span className={`h-1.5 w-1.5 rounded-full ${getPriorityStyle(p).dot}`} />
                                <span className="capitalize">{p}</span>
                            </div>
                        ))}
                        <div className="flex items-center gap-1">
                            <Diamond className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
                            <span>Milestone</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                        <button
                            onClick={goToToday}
                            className="hidden sm:inline-flex items-center h-8 px-2.5 rounded-md text-xs font-medium hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            Today
                        </button>
                        <button
                            onClick={goToPreviousMonth}
                            aria-label="Previous month"
                            className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                            onClick={goToNextMonth}
                            aria-label="Next month"
                            className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Grid */}
                <div className="overflow-x-auto">
                    <div className="min-w-[560px]">
                        <div className="grid grid-cols-7 border-b bg-muted/20">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                                <div
                                    key={day}
                                    className={`flex items-center justify-center py-2 text-xs font-semibold text-muted-foreground border-r last:border-r-0 ${
                                        i === 0 || i === 6 ? 'bg-muted/10' : ''
                                    }`}
                                >
                                    {day}
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-7">
                            {calendarDays.map((cell, index) => {
                                const { visible, overflowCount } = getItemsForDay(cell.day);
                                const isToday = isCurrentMonth && isSameDay(cell.date, today);
                                const isWeekend = index % 7 === 0 || index % 7 === 6;

                                return (
                                    <div
                                        key={index}
                                        className={`min-h-[92px] border-r border-b last:border-r-0 transition-colors ${
                                            isToday
                                                ? 'bg-blue-50/70 dark:bg-blue-950/30'
                                                : !cell.isCurrentMonth
                                                    ? 'bg-muted/10'
                                                    : isWeekend
                                                        ? 'bg-muted/[0.06]'
                                                        : 'bg-background'
                                        } hover:bg-muted/20`}
                                    >
                                        <div className="p-1.5">
                                            <div
                                                className={`text-sm mb-1 h-6 w-6 flex items-center justify-center rounded-full ${
                                                    isToday
                                                        ? 'bg-blue-600 text-white font-semibold'
                                                        : !cell.isCurrentMonth
                                                            ? 'text-muted-foreground/50 font-medium'
                                                            : 'text-foreground font-medium'
                                                }`}
                                            >
                                                {cell.day}
                                            </div>

                                            <div className="space-y-1">
                                                {visible.map((entry) => {
                                                    if (entry.kind === 'milestone') {
                                                        const m = entry.item as Milestone;
                                                        return (
                                                            <Tooltip key={`m-${m.id}`}>
                                                                <TooltipTrigger asChild>
                                                                    <div className="flex items-center gap-1 h-5 px-1.5 rounded bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 cursor-pointer">
                                                                        <Diamond className="h-2 w-2 fill-amber-600 text-amber-600 dark:fill-amber-400 dark:text-amber-400 shrink-0" />
                                                                        <span className="truncate text-[10px] font-medium text-amber-900 dark:text-amber-300">
                                                                            {m.name}
                                                                        </span>
                                                                    </div>
                                                                </TooltipTrigger>
                                                                <TooltipContent side="top" className="max-w-[200px]">
                                                                    <p className="font-medium">{m.name}</p>
                                                                    <p className="text-xs text-muted-foreground">Milestone</p>
                                                                    {m.completed_at && (
                                                                        <p className="text-xs text-emerald-600">Completed</p>
                                                                    )}
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        );
                                                    }

                                                    const item = entry.item as WorkItem;
                                                    const style = getPriorityStyle(item.priority);
                                                    return (
                                                        <Tooltip key={`w-${item.id}`}>
                                                            <TooltipTrigger asChild>
                                                                <div
                                                                    className={`flex items-center h-5 pl-1.5 pr-1.5 border-l-2 ${style.bar} bg-muted/40 hover:bg-muted/70 cursor-pointer rounded-r`}
                                                                >
                                                                    <span className={`truncate text-[10px] font-medium ${style.text}`}>
                                                                        {item.title}
                                                                    </span>
                                                                </div>
                                                            </TooltipTrigger>
                                                            <TooltipContent side="top" className="max-w-[200px]">
                                                                <p className="font-medium">{item.title}</p>
                                                                <p className="text-xs text-muted-foreground capitalize">{item.priority} priority</p>
                                                                <p className="text-xs text-muted-foreground">Progress: {item.progress}%</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    );
                                                })}

                                                {overflowCount > 0 && (
                                                    <div className="text-[10px] text-muted-foreground px-1.5 h-5 flex items-center">
                                                        +{overflowCount} more
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
        </TooltipProvider>
    );
}
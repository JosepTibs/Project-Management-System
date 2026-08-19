import React, { useMemo, useState } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ChevronRight, ChevronDown } from 'lucide-react';

interface Milestone {
    id: number;
    name: string;
    description: string;
    start_date: string;
    target_date: string;
    completed_at: string | null;
    completion_percentage: number;
    order: number;
}

interface WorkItem {
    id: number;
    title: string;
    priority: string;
    due_date: string;
    progress: number;
    start_date?: string;
}

interface WorkItemGroup {
    id: number;
    name: string;
    description: string;
    start_date: string;
    end_date: string;
    milestone_id: number | null;
    completion_percentage: number;
    work_items: WorkItem[];
}

interface GanttChartProps {
    milestones: Milestone[];
    workItemGroups: WorkItemGroup[];
}

interface TimelineItem {
    id: string;
    name: string;
    start: Date;
    end: Date;
    type: "milestone" | "group" | "task";
    progress: number;
    level: number;
    description?: string;
    collapsed?: boolean;
}

const DAY_WIDTH = 28;
const NAME_WIDTH = 240;
const ROW_HEIGHT = 56;
const INDENT_WIDTH = 20;

function stripTime(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function differenceInDays(a: Date, b: Date) {
    return Math.floor(
        (stripTime(a).getTime() - stripTime(b).getTime()) /
            (1000 * 60 * 60 * 24)
    );
}

function addDays(date: Date, days: number) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
}

function isWeekend(date: Date) {
    const day = date.getDay();
    return day === 0 || day === 6;
}

function formatDayNumber(date: Date) {
    return date.getDate();
}

function formatDateShort(date: Date) {
    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
    });
}

function formatDateRange(start: Date, end: Date) {
    const sameMonth =
        start.getMonth() === end.getMonth() &&
        start.getFullYear() === end.getFullYear();
    if (sameMonth) {
        return `${start.toLocaleDateString("en-US", { month: "short" })} ${start.getDate()} – ${end.getDate()}`;
    }
    return `${formatDateShort(start)} – ${formatDateShort(end)}`;
}

function isToday(date: Date) {
    const today = new Date();
    return (
        date.getFullYear() === today.getFullYear() &&
        date.getMonth() === today.getMonth() &&
        date.getDate() === today.getDate()
    );
}

interface MonthGroup {
    label: string;
    monthKey: string;
    days: Date[];
}

function groupDaysByMonth(days: Date[]): MonthGroup[] {
    const groups: MonthGroup[] = [];
    let current: MonthGroup | null = null;

    for (const day of days) {
        const key = `${day.getFullYear()}-${day.getMonth()}`;
        if (!current || current.monthKey !== key) {
            current = {
                monthKey: key,
                label: day.toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                }),
                days: [],
            };
            groups.push(current);
        }
        current.days.push(day);
    }

    return groups;
}

export function GanttChart({ milestones, workItemGroups }: GanttChartProps) {
    const [collapsedMilestones, setCollapsedMilestones] = useState<Set<number>>(new Set());
    const [collapsedGroups, setCollapsedGroups] = useState<Set<number>>(new Set());

    const toggleMilestone = (id: number) => {
        setCollapsedMilestones((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleGroup = (id: number) => {
        setCollapsedGroups((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const items = useMemo<TimelineItem[]>(() => {
        const result: TimelineItem[] = [];

        // Group milestones by their ID from workItemGroups
        const milestoneGroups = new Map<number, { milestone: Milestone; groups: WorkItemGroup[] }>();

        for (const group of workItemGroups) {
            if (!group.start_date || !group.end_date) continue;
            const start = new Date(group.start_date);
            const end = new Date(group.end_date);
            if (isNaN(start.getTime()) || isNaN(end.getTime())) continue;

            const milestoneId = group.milestone_id;
            if (!milestoneId) continue;

            if (!milestoneGroups.has(milestoneId)) {
                const milestone = milestones.find((m) => m.id === milestoneId);
                if (milestone) {
                    milestoneGroups.set(milestoneId, { milestone, groups: [] });
                }
            }

            const entry = milestoneGroups.get(milestoneId);
            if (entry) {
                entry.groups.push(group);
            }
        }

        // Build hierarchical list
        for (const [milestoneId, { milestone, groups }] of milestoneGroups) {
            const milestoneTarget = new Date(milestone.target_date);
            result.push({
                id: `milestone-${milestone.id}`,
                name: milestone.name,
                start: milestoneTarget,
                end: milestoneTarget,
                type: "milestone",
                progress: milestone.completed_at ? 100 : 0,
                level: 0,
                description: milestone.description,
                collapsed: collapsedMilestones.has(milestone.id),
            });

            for (const group of groups) {
                const groupStart = new Date(group.start_date);
                const groupEnd = new Date(group.end_date);
                const isCollapsed = collapsedMilestones.has(milestone.id) || collapsedGroups.has(group.id);

                result.push({
                    id: `group-${group.id}`,
                    name: group.name,
                    start: groupStart,
                    end: groupEnd,
                    type: "group",
                    progress: group.completion_percentage ?? 0,
                    level: 1,
                    description: group.description,
                    collapsed: isCollapsed,
                });

                if (!isCollapsed) {
                    for (const task of group.work_items) {
                        if (!task.start_date && !task.due_date) continue;
                        const taskStart = task.start_date ? new Date(task.start_date) : (task.due_date ? new Date(task.due_date) : new Date());
                        const taskEnd = task.due_date ? new Date(task.due_date) : (task.start_date ? new Date(task.start_date) : new Date());
                        if (isNaN(taskStart.getTime()) || isNaN(taskEnd.getTime())) continue;

                        result.push({
                            id: `task-${task.id}`,
                            name: task.title,
                            start: taskStart,
                            end: taskEnd,
                            type: "task",
                            progress: task.progress ?? 0,
                            level: 2,
                            description: task.priority,
                        });
                    }
                }
            }
        }

        return result;
    }, [milestones, workItemGroups, collapsedMilestones, collapsedGroups]);

    const { earliest, totalDays, days, monthGroups, todayOffset } =
        useMemo(() => {
            if (!items.length) {
                return {
                    earliest: new Date(),
                    totalDays: 0,
                    days: [] as Date[],
                    monthGroups: [] as MonthGroup[],
                    todayOffset: -1,
                };
            }

            const earliest = new Date(
                Math.min(...items.map((i) => i.start.getTime()))
            );
            const latest = new Date(
                Math.max(...items.map((i) => i.end.getTime()))
            );
            const totalDays = differenceInDays(latest, earliest) + 1;
            const days = Array.from({ length: totalDays }, (_, i) =>
                addDays(earliest, i)
            );
            const monthGroups = groupDaysByMonth(days);

            const today = new Date();
            const todayOffset =
                today >= stripTime(earliest) && today <= stripTime(latest)
                    ? differenceInDays(today, earliest)
                    : -1;

            return {
                earliest,
                totalDays,
                days,
                monthGroups,
                todayOffset,
            };
        }, [items]);

    if (!items.length) {
        return (
            <div className="py-8 text-center text-sm text-muted-foreground">
                No timeline available.
            </div>
        );
    }

    return (
        <div className="w-full max-w-full min-w-0 max-h-[750px] rounded-lg border bg-background overflow-x-auto overflow-y-auto">
            <TooltipProvider delayDuration={300}>
                <div
                    className="grid"
                    style={{
                        width: NAME_WIDTH + totalDays * DAY_WIDTH,
                        minWidth: NAME_WIDTH + totalDays * DAY_WIDTH,
                        gridTemplateColumns: `${NAME_WIDTH}px ${totalDays * DAY_WIDTH}px`,
                    }}
                >
                    {/* ── Header: Task label ── */}
                    <div className="sticky left-0 z-30 border-b bg-background p-3 font-semibold text-sm">
                        Task
                    </div>

                    {/* ── Header: Month groups + day numbers ── */}
                    <div className="border-b bg-muted/40 min-w-0">
                        {/* Month labels row */}
                        <div className="flex min-w-0">
                            {monthGroups.map((group) => (
                                <div
                                    key={group.label}
                                    className="flex items-center justify-center border-l py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                                    style={{
                                        width: group.days.length * DAY_WIDTH,
                                    }}
                                >
                                    {group.label}
                                </div>
                            ))}
                        </div>
                        {/* Day numbers row */}
                        <div className="flex min-w-0">
                            {days.map((day) => (
                                <div
                                    key={day.toISOString()}
                                    className={`flex items-center justify-center border-l py-1 text-[11px] tabular-nums ${
                                        isWeekend(day)
                                            ? "bg-muted/30 text-muted-foreground/50"
                                            : "text-muted-foreground"
                                    } ${isToday(day) ? "font-bold text-blue-600" : ""}`}
                                    style={{ width: DAY_WIDTH, height: 24 }}
                                >
                                    {formatDayNumber(day)}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── Rows ── */}
                    {items.map((item, index) => {
                        const startOffset = differenceInDays(item.start, earliest);
                        const duration = Math.max(
                            differenceInDays(item.end, item.start) + 1,
                            1
                        );
                        const barWidth = Math.max(duration * DAY_WIDTH - 4, DAY_WIDTH - 4);
                        const barLeft = startOffset * DAY_WIDTH + 2 + (item.level * INDENT_WIDTH);
                        const isEvenRow = index % 2 === 0;

                        return (
                            <React.Fragment key={item.id}>
                                {/* Sidebar cell */}
                                <div
                                    className={`sticky left-0 z-20 flex items-center border-b px-3 transition-colors ${
                                        isEvenRow ? "bg-background" : "bg-background"
                                    } hover:bg-muted/30`}
                                    style={{ height: ROW_HEIGHT, paddingLeft: 12 + item.level * INDENT_WIDTH }}
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5">
                                            {/* Collapse/Expand toggle for milestones and groups */}
                                            {(item.type === "milestone" || item.type === "group") && (
                                                <button
                                                    onClick={() => {
                                                        if (item.type === "milestone") {
                                                            toggleMilestone(parseInt(item.id.replace('milestone-', '')));
                                                        } else {
                                                            toggleGroup(parseInt(item.id.replace('group-', '')));
                                                        }
                                                    }}
                                                    className="inline-flex items-center justify-center h-4 w-4 hover:bg-muted rounded"
                                                >
                                                    {item.collapsed ? (
                                                        <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                                    ) : (
                                                        <ChevronDown className="h-3 w-3 text-muted-foreground" />
                                                    )}
                                                </button>
                                            )}
                                            {item.type === "task" && (
                                                <span className="inline-block w-4" />
                                            )}
                                            <span className="min-w-0 flex-1 text-sm font-medium truncate">
                                                {item.name}
                                            </span>
                                            <span
                                                className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                                                    item.type === "milestone"
                                                        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                                                        : item.type === "group"
                                                        ? "bg-slate-100 text-slate-700 dark:bg-slate-900/40 dark:text-slate-400"
                                                        : "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400"
                                                }`}
                                            >
                                                {item.type === "milestone" ? "Milestone" : item.type === "group" ? "Group" : "Task"}
                                            </span>
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-0.5 truncate">
                                            {item.type === "milestone"
                                                ? `Due: ${formatDateShort(item.end)}`
                                                : formatDateRange(item.start, item.end)}
                                        </div>
                                    </div>
                                </div>

                                {/* Timeline cell */}
                                <div
                                    className={`relative border-b transition-colors ${
                                        isEvenRow ? "bg-background" : "bg-muted/10"
                                    } hover:bg-muted/20`}
                                    style={{ height: ROW_HEIGHT }}
                                >
                                    {/* Vertical grid lines + weekend fills */}
                                    <div className="absolute inset-0 flex pointer-events-none">
                                        {days.map((d) => (
                                            <div
                                                key={d.toISOString()}
                                                className={`border-l ${isWeekend(d) ? "bg-muted/20" : ""}`}
                                                style={{ width: DAY_WIDTH }}
                                            />
                                        ))}
                                    </div>

                                    {/* Today indicator (only on first row) */}
                                    {index === 0 && todayOffset >= 0 && (
                                        <>
                                            <div
                                                className="absolute top-0 bottom-0 z-10 pointer-events-none"
                                                style={{ left: todayOffset * DAY_WIDTH }}
                                            >
                                                <div className="w-px h-full bg-blue-500/60" />
                                            </div>
                                            <div
                                                className="absolute -top-0.5 z-10 rounded bg-blue-500 px-1 py-[1px] text-[9px] font-bold text-white whitespace-nowrap pointer-events-none"
                                                style={{
                                                    left: Math.max(
                                                        20,
                                                        Math.min(
                                                            todayOffset * DAY_WIDTH,
                                                            totalDays * DAY_WIDTH - 20
                                                        )
                                                    ),
                                                    transform: "translateX(-50%)",
                                                }}
                                            >
                                                Today
                                            </div>
                                        </>
                                    )}

                                    {/* Task bar */}
                                    {item.type === "task" ? (
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div
                                                    className="group absolute top-1/2 -translate-y-1/2 cursor-pointer"
                                                    style={{
                                                        left: barLeft,
                                                        width: barWidth,
                                                    }}
                                                >
                                                    <div
                                                        className="relative h-7 rounded-md overflow-hidden cursor-pointer
                                                                            bg-gradient-to-r from-indigo-600 to-indigo-500
                                                                            shadow-md hover:shadow-lg
                                                                            hover:from-indigo-700 hover:to-indigo-600
                                                                            transition-all duration-150"
                                                    >
                                                        {/* Progress fill */}
                                                        <div
                                                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-800/40 to-indigo-700/20 transition-all duration-500"
                                                            style={{
                                                                width: `${item.progress}%`,
                                                            }}
                                                        />
                                                        {/* Label */}
                                                        {barWidth > 50 && (
                                                            <span className="relative z-10 flex items-center h-full px-2 text-[11px] font-semibold text-white truncate">
                                                                {item.progress > 0
                                                                    ? `${item.progress}%`
                                                                    : ""}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent side="top" align="center" className="z-50 max-w-[200px]">
                                                <div className="space-y-1">
                                                    <p className="font-medium text-popover-foreground">
                                                        {item.name}
                                                    </p>
                                                    {item.description && (
                                                        <p className="text-muted-foreground line-clamp-2">
                                                            {item.description}
                                                        </p>
                                                    )}
                                                    <div className="flex items-center gap-2 text-muted-foreground">
                                                        <span className="inline-block h-2 w-2 rounded-full bg-indigo-500" />
                                                        <span>
                                                            {formatDateRange(
                                                                item.start,
                                                                item.end
                                                            )}
                                                        </span>
                                                    </div>
                                                    <p className="text-muted-foreground">
                                                        Progress: {item.progress}%
                                                    </p>
                                                </div>
                                            </TooltipContent>
                                        </Tooltip>
                                    ) : item.type === "group" ? (
                                        /* Group bar */
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div
                                                    className="group absolute top-1/2 -translate-y-1/2 cursor-pointer"
                                                    style={{
                                                        left: barLeft,
                                                        width: barWidth,
                                                    }}
                                                >
                                                    <div
                                                        className="relative h-6 rounded-md overflow-hidden cursor-pointer
                                                                            bg-slate-400/40 border border-slate-400/60
                                                                            shadow-sm hover:shadow-md
                                                                            transition-all duration-150"
                                                    >
                                                        <div
                                                            className="absolute inset-y-0 left-0 bg-slate-500/30 transition-all duration-500"
                                                            style={{
                                                                width: `${item.progress}%`,
                                                            }}
                                                        />
                                                        {barWidth > 60 && (
                                                            <span className="relative z-10 flex items-center h-full px-2 text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate">
                                                                {item.name} · {item.progress}%
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent side="top" align="center" className="z-50 max-w-[200px]">
                                                <div className="space-y-1">
                                                    <p className="font-medium text-popover-foreground">{item.name}</p>
                                                    {item.description && (
                                                        <p className="text-muted-foreground line-clamp-2">{item.description}</p>
                                                    )}
                                                    <p className="text-muted-foreground">Progress: {item.progress}%</p>
                                                </div>
                                            </TooltipContent>
                                        </Tooltip>
                                    ) : (
                                        /* Milestone diamond */
                                        <div className="relative h-full pointer-events-none">
                                            <div
                                                className="absolute top-0 bottom-0 w-px bg-amber-300/40"
                                                style={{ left: startOffset * DAY_WIDTH + DAY_WIDTH / 2 }}
                                            />
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div
                                                        className="absolute top-0 bottom-0 cursor-pointer pointer-events-auto"
                                                        style={{
                                                            left: startOffset * DAY_WIDTH + DAY_WIDTH / 2 - 8,
                                                            width: 16,
                                                        }}
                                                    >
                                                        <div
                                                            className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 rotate-45 border-2 shadow-sm transition-all duration-150 ${
                                                                item.progress === 100
                                                                    ? "bg-amber-400 border-amber-500 shadow-amber-300/50"
                                                                    : "bg-amber-300 border-amber-400 shadow-amber-200/30"
                                                            }`}
                                                        >
                                                            {item.progress === 100 && (
                                                                <div className="absolute inset-0 flex items-center justify-center">
                                                                    <div className="h-1.5 w-1.5 rotate-45 bg-amber-700" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent side="top" align="center" className="z-50 max-w-[200px]">
                                                    <div className="space-y-1">
                                                        <p className="font-medium text-popover-foreground">{item.name}</p>
                                                        <p className="text-muted-foreground">Due: {formatDateShort(item.end)}</p>
                                                        {item.progress === 100 && (
                                                            <p className="text-emerald-600 font-medium">✓ Completed</p>
                                                        )}
                                                    </div>
                                                </TooltipContent>
                                            </Tooltip>
                                        </div>
                                    )}
                                </div>
                            </React.Fragment>
                        );
                    })}
                </div>
            </TooltipProvider>
        </div>
    );
}
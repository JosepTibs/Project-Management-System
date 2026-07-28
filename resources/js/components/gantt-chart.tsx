import React, { useMemo } from "react";

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

interface WorkItemGroup {
    id: number;
    name: string;
    description: string;
    start_date: string;
    end_date: string;
    milestone_id: number | null;
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
    type: "task" | "milestone";
    progress: number;
    description?: string;
}

const DAY_WIDTH = 28;
const NAME_WIDTH = 240;
const ROW_HEIGHT = 56;

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

export function GanttChart({
    milestones,
    workItemGroups,
}: GanttChartProps) {
    const items = useMemo<TimelineItem[]>(() => {
        return [
            ...workItemGroups.map((group) => ({
                id: `group-${group.id}`,
                name: group.name,
                start: new Date(group.start_date),
                end: new Date(group.end_date),
                type: "task" as const,
                progress: 0,
                description: group.description,
            })),
            ...milestones.map((milestone) => ({
                id: `milestone-${milestone.id}`,
                name: milestone.name,
                start: new Date(milestone.target_date),
                end: new Date(milestone.target_date),
                type: "milestone" as const,
                progress: milestone.completed_at ? 100 : 0,
                description: milestone.description,
            })),
        ];
    }, [milestones, workItemGroups]);

    const { earliest, latest, totalDays, days, monthGroups, todayOffset } =
        useMemo(() => {
            if (!items.length) {
                return {
                    earliest: new Date(),
                    latest: new Date(),
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
                latest,
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
        <div className="rounded-lg border bg-background overflow-auto">
            <div
                className="grid"
                style={{
                    gridTemplateColumns: `${NAME_WIDTH}px ${totalDays * DAY_WIDTH}px`,
                    minWidth: NAME_WIDTH + totalDays * DAY_WIDTH,
                }}
            >
                {/* ── Header: Task label ── */}
                <div className="sticky left-0 z-30 border-b bg-background p-3 font-semibold text-sm">
                    Task
                </div>

                {/* ── Header: Month groups + day numbers ── */}
                <div className="border-b bg-muted/40">
                    {/* Month labels row */}
                    <div className="flex">
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
                    <div className="flex">
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
                    const duration =
                        differenceInDays(item.end, item.start) + 1;
                    const barWidth = duration * DAY_WIDTH - 4;
                    const barLeft = startOffset * DAY_WIDTH + 2;
                    const isEvenRow = index % 2 === 0;

                    return (
                        <React.Fragment key={item.id}>
                            {/* Sidebar cell */}
                            <div
                                className={`sticky left-0 z-20 flex items-center border-b px-3 transition-colors ${
                                    isEvenRow ? "bg-background" : "bg-muted/10"
                                } hover:bg-muted/30`}
                                style={{ height: ROW_HEIGHT }}
                            >
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium truncate">
                                            {item.name}
                                        </span>
                                        <span
                                            className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                                                item.type === "milestone"
                                                    ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                                                    : "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400"
                                            }`}
                                        >
                                            {item.type === "milestone"
                                                ? "Milestone"
                                                : "Work Item"}
                                        </span>
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-0.5">
                                        {item.type === "milestone"
                                            ? `Due: ${formatDateShort(item.end)}`
                                            : formatDateRange(
                                                  item.start,
                                                  item.end
                                              )}
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
                                <div className="absolute inset-0 flex">
                                    {days.map((d) => (
                                        <div
                                            key={d.toISOString()}
                                            className={`border-l ${
                                                isWeekend(d)
                                                    ? "bg-muted/20"
                                                    : ""
                                            }`}
                                            style={{ width: DAY_WIDTH }}
                                        />
                                    ))}
                                </div>

                                {/* Today indicator (only on first row) */}
                                {index === 0 && todayOffset >= 0 && (
                                    <div
                                        className="absolute top-0 bottom-0 z-10 pointer-events-none"
                                        style={{
                                            left: todayOffset * DAY_WIDTH,
                                        }}
                                    >
                                        <div className="w-px h-full bg-blue-500/60" />
                                        <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 rounded bg-blue-500 px-1 py-[1px] text-[9px] font-bold text-white whitespace-nowrap">
                                            Today
                                        </div>
                                    </div>
                                )}

                                {/* Task bar */}
                                {item.type === "task" ? (
                                    <div className="group relative h-full">
                                        <div
                                            className="absolute top-1/2 h-7 -translate-y-1/2 rounded-md overflow-hidden cursor-pointer
                                                        bg-gradient-to-r from-indigo-500 to-indigo-400
                                                        shadow-sm hover:shadow-md
                                                        hover:from-indigo-600 hover:to-indigo-500
                                                        transition-all duration-150"
                                            style={{
                                                left: barLeft,
                                                width: barWidth,
                                            }}
                                        >
                                            {/* Progress fill */}
                                            <div
                                                className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-600/50 to-indigo-500/30 transition-all duration-500"
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

                                        {/* Tooltip */}
                                        <div
                                            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50
                                                        hidden group-hover:block
                                                        rounded-lg border bg-popover px-3 py-2 text-xs shadow-md
                                                        min-w-[200px] pointer-events-none"
                                        >
                                            <p className="font-medium text-popover-foreground">
                                                {item.name}
                                            </p>
                                            {item.description && (
                                                <p className="text-muted-foreground mt-0.5 line-clamp-2">
                                                    {item.description}
                                                </p>
                                            )}
                                            <div className="mt-1.5 flex items-center gap-2 text-muted-foreground">
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
                                    </div>
                                ) : (
                                    /* Milestone diamond */
                                    <div className="group relative h-full">
                                        {/* Vertical stem line */}
                                        <div
                                            className="absolute top-0 bottom-0 w-px bg-amber-300/40"
                                            style={{
                                                left:
                                                    startOffset * DAY_WIDTH +
                                                    DAY_WIDTH / 2,
                                            }}
                                        />
                                        {/* Diamond */}
                                        <div
                                            className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 rotate-45
                                                        border-2 shadow-sm transition-all duration-150
                                                        ${
                                                            item.progress === 100
                                                                ? "bg-amber-400 border-amber-500 shadow-amber-300/50"
                                                                : "bg-amber-300 border-amber-400 shadow-amber-200/30"
                                                        }`}
                                            style={{
                                                left:
                                                    startOffset * DAY_WIDTH +
                                                    DAY_WIDTH / 2 -
                                                    8,
                                            }}
                                        >
                                            {/* Inner dot for completed */}
                                            {item.progress === 100 && (
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="h-1.5 w-1.5 rotate-45 bg-amber-700" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Tooltip */}
                                        <div
                                            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50
                                                        hidden group-hover:block
                                                        rounded-lg border bg-popover px-3 py-2 text-xs shadow-md
                                                        min-w-[200px] pointer-events-none"
                                        >
                                            <p className="font-medium text-popover-foreground">
                                                {item.name}
                                            </p>
                                            {item.description && (
                                                <p className="text-muted-foreground mt-0.5 line-clamp-2">
                                                    {item.description}
                                                </p>
                                            )}
                                            <div className="mt-1.5 flex items-center gap-2 text-muted-foreground">
                                                <span className="inline-block h-2 w-2 rotate-45 bg-amber-500" />
                                                <span>
                                                    Due:{" "}
                                                    {formatDateShort(item.end)}
                                                </span>
                                            </div>
                                            {item.progress === 100 && (
                                                <p className="text-emerald-600 font-medium">
                                                    ✓ Completed
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
}
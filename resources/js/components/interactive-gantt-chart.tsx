import React, { useMemo, useRef, useState, useCallback, useEffect } from "react";
import { router } from '@inertiajs/react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Link2, Link2Off, ChevronRight, ChevronDown, Maximize2, Minimize2, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import AddDependencyDialog from '@/components/dependencies/add-dependency-dialog';


interface WorkItem {
    id: number;
    title: string;
    description: string;
    start_date: string | null;
    due_date: string | null;
    progress: number;
    priority: string;
    status: { id: number; name: string } | null;
    assignee: { id: number; name: string } | null;
    group_id: number | null;
}

interface Milestone {
    id: number;
    name: string;
    description: string;
    target_date: string;
    completed_at: string | null;
    completion_percentage: number;
}

interface WorkItemGroup {
    id: number;
    name: string;
    description: string;
    start_date: string | null;
    end_date: string | null;
    milestone_id: number | null;
    completion_percentage: number;
}

interface Dependency {
    id: number;
    predecessor_id: number;
    successor_id: number;
    type: string;
    lag: number | null;
    predecessor: { id: number; title: string };
    successor: { id: number; title: string };
}

interface TimelineItem {
    id: string;
    taskId?: number;
    name: string;
    start: Date;
    end: Date;
    type: "task" | "milestone" | "group";
    progress: number;
    level: number;
    description?: string;
    collapsed?: boolean;
    assignee?: { id: number; name: string } | null;
}

interface InteractiveGanttChartProps {
    projectId: number;
    workItems: WorkItem[];
    milestones: Milestone[];
    workItemGroups: WorkItemGroup[];
    /** Disables all drag/move/resize/dependency interactions (view-only mode). */
    readOnly?: boolean;
}

// NAME_WIDTH / INDENT_WIDTH stay fixed regardless of fullscreen.
// BASE_UNIT_WIDTH is used ONLY for date-range math (drag offset estimation)
// so it never depends on totalUnits — avoiding a circular dependency.
const NAME_WIDTH = 240;
const COLLAPSED_NAME_WIDTH = 48;
const INDENT_WIDTH = 20;
const BASE_UNIT_WIDTH = 180;

type ViewMode = "day" | "week" | "month" | "quarter" | "year";

const VIEW_UNIT_WIDTH: Record<ViewMode, number> = {
    day: 28,
    week: 140,
    month: 180,
    quarter: 200,
    year: 220,
};

// Average number of days in one period of each view. Used to convert a pixel
// drag offset into individual days so dragging stays day-accurate in every
// view (rather than snapping to the currently selected period granularity).
const VIEW_DAYS_PER_PERIOD: Record<ViewMode, number> = {
    day: 1,
    week: 7,
    month: 365.25 / 12,
    quarter: 365.25 / 4,
    year: 365.25,
};

// Bars never get narrower than this, so short tasks stay visible and
// draggable even in quarter/year views.
const MIN_BAR_WIDTH = 60;

// Height of each bar type, kept as whole numbers so bars can be vertically
// centered with integer-pixel tops (avoids sub-pixel clipping of rounded edges).
function barHeightForType(type: TimelineItem["type"]): number {
    switch (type) {
        case "task":
            return 28; // h-7
        case "group":
            return 24; // h-6
        case "milestone":
            return 16; // h-4 rotated diamond
        default:
            return 28;
    }
}

function stripTime(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
}

function differenceInDays(a: Date, b: Date) {
    return Math.floor(
        (stripTime(a).getTime() - stripTime(b).getTime()) /
            (1000 * 60 * 60 * 24)
    );
}

function isWeekend(date: Date) {
    const day = date.getDay();
    return day === 0 || day === 6;
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

interface TimePeriod {
    key: string;
    label: string;
    groupLabel: string;
    start: Date;
    end: Date;
}

interface PeriodGroup {
    label: string;
    groupKey: string;
    periods: TimePeriod[];
}

function startOfWeek(date: Date) {
    const d = stripTime(date);
    const diff = (d.getDay() + 6) % 7; // days since Monday
    d.setDate(d.getDate() - diff);
    return d;
}

function unitIndexOf(date: Date, view: ViewMode): number {
    const d = stripTime(date);
    switch (view) {
        case "day":
            return Math.floor(d.getTime() / (1000 * 60 * 60 * 24));
        case "week":
            return Math.floor(startOfWeek(d).getTime() / (1000 * 60 * 60 * 24 * 7));
        case "month":
            return d.getFullYear() * 12 + d.getMonth();
        case "quarter":
            return d.getFullYear() * 4 + Math.floor(d.getMonth() / 3);
        case "year":
            return d.getFullYear();
    }
}

function startOfPeriod(date: Date, view: ViewMode): Date {
    const d = stripTime(date);
    switch (view) {
        case "day":
            return d;
        case "week":
            return startOfWeek(d);
        case "month":
            return new Date(d.getFullYear(), d.getMonth(), 1);
        case "quarter":
            return new Date(d.getFullYear(), Math.floor(d.getMonth() / 3) * 3, 1);
        case "year":
            return new Date(d.getFullYear(), 0, 1);
    }
}

function addPeriods(date: Date, count: number, view: ViewMode): Date {
    const d = new Date(date);
    switch (view) {
        case "day":
            d.setDate(d.getDate() + count);
            return d;
        case "week":
            d.setDate(d.getDate() + count * 7);
            return d;
        case "month":
            d.setMonth(d.getMonth() + count);
            return d;
        case "quarter":
            d.setMonth(d.getMonth() + count * 3);
            return d;
        case "year":
            d.setFullYear(d.getFullYear() + count);
            return d;
    }
}

function periodLabel(date: Date, view: ViewMode): string {
    switch (view) {
        case "day":
            return String(date.getDate());
        case "week":
            return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        case "month":
            return date.toLocaleDateString("en-US", { month: "short" });
        case "quarter":
            return `Q${Math.floor(date.getMonth() / 3) + 1}`;
        case "year":
            return String(date.getFullYear());
    }
}

function periodGroupLabel(date: Date, view: ViewMode): string {
    switch (view) {
        case "day":
        case "week":
            return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
        case "month":
        case "quarter":
        case "year":
            return String(date.getFullYear());
    }
}

function buildPeriods(earliest: Date, latest: Date, view: ViewMode): TimePeriod[] {
    const periods: TimePeriod[] = [];
    const first = startOfPeriod(earliest, view);
    const lastStart = startOfPeriod(latest, view);
    let cursor = first;
    let guard = 0;
    while (cursor.getTime() <= lastStart.getTime() && guard < 1000) {
        guard++;
        const nextStart = addPeriods(cursor, 1, view);
        periods.push({
            key: `${unitIndexOf(cursor, view)}-${cursor.toISOString()}`,
            label: periodLabel(cursor, view),
            groupLabel: periodGroupLabel(cursor, view),
            start: cursor,
            end: addDays(nextStart, -1),
        });
        cursor = nextStart;
    }
    return periods;
}

function fractionalUnitIndex(date: Date, view: ViewMode): number {
    const d = stripTime(date);
    switch (view) {
        case "day":
            return Math.floor(d.getTime() / (1000 * 60 * 60 * 24));
        case "week": {
            const ws = startOfWeek(d);
            const into = differenceInDays(d, ws);
            return unitIndexOf(ws, view) + into / 7;
        }
        case "month": {
            const ms = new Date(d.getFullYear(), d.getMonth(),  1);
            const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
            const into = differenceInDays(d, ms);
            return unitIndexOf(ms, view) + into / daysInMonth;
        }  
        case "quarter": {
            const qStartMonth = Math.floor(d.getMonth() /3) * 3;
            const qs = new Date(d.getFullYear(), qStartMonth, 1);
            const qe = new Date(d.getFullYear(), qStartMonth + 3, 1);
            const into = differenceInDays(d, qs);
            return unitIndexOf(qs, view) + into / differenceInDays(qe, qs);
        }
        case "year": {
            const ys = new Date(d.getFullYear(), 0, 1);
            const ye = new Date(d.getFullYear() + 1, 0, 1);
            const into = differenceInDays(d, ys);
            return unitIndexOf(ys, view) + into / differenceInDays(ye, ys);
        }
    }
}

function columnIndexOf(date: Date, earliest: Date, view: ViewMode): number {
    return fractionalUnitIndex(date, view) - unitIndexOf(earliest, view);
}

function groupPeriods(periods: TimePeriod[]): PeriodGroup[] {
    const groups: PeriodGroup[] = [];
    let current: PeriodGroup | null = null;
    for (const p of periods) {
        if (!current || current.groupKey !== p.groupLabel) {
            current = { label: p.groupLabel, groupKey: p.groupLabel, periods: [] };
            groups.push(current);
        }
        current.periods.push(p);
    }
    return groups;
}

type DragMode = "move" | "resize-start" | "resize-end" | "dependency" | null;

interface DragState {
    mode: DragMode;
    itemId: string;
    startX: number;
    originalStart: Date;
    originalEnd: Date;
    currentOffset: number;
}

interface DependencyPreview {
    fromTaskId: string;
    toTaskId: string | null;
    startX: number;
    startY: number;
    x: number;
    y: number;
}

export default function InteractiveGanttChart({
    projectId,
    workItems,
    milestones,
    workItemGroups,
    readOnly = false,
}: InteractiveGanttChartProps) {
    const [localWorkItems, setLocalWorkItems] = useState<WorkItem[]>(workItems);
    const [localMilestones, setLocalMilestones] = useState<Milestone[]>(milestones);
    const [localGroups, setLocalGroups] = useState<WorkItemGroup[]>(workItemGroups);
    const [dependencies, setDependencies] = useState<Dependency[]>([]);
    const [dragState, setDragState] = useState<DragState | null>(null);
    const [depPreview, setDepPreview] = useState<DependencyPreview | null>(null);
    const [showDependencies, setShowDependencies] = useState(true);
    const [addDepOpen, setAddDepOpen] = useState(false);
    const [collapsedMilestones, setCollapsedMilestones] = useState<Set<number>>(new Set());
    const [collapsedGroups, setCollapsedGroups] = useState<Set<number>>(new Set());
    const [collapsedTasks, setCollapsedTasks] = useState<Set<number>>(() => new Set(workItems.map((w) => w.id)));
    const containerRef = useRef<HTMLDivElement>(null);
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const deleteDepHoverRef = useRef(false);
    // Tracks whether the active mousedown->mouseup gesture moved beyond a click threshold
    const dragMovedRef = useRef(false);
    
    const autoScrollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const lastMousePosRef = useRef<{ x: number; y: number} | null>(null);  

    const [isFullscreen, setIsFullscreen] = useState(false);
    const [containerWidth, setContainerWidth] = useState(0);

    const [viewMode, setViewMode] = useState<ViewMode>("day");
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const effectiveNameWidth = sidebarCollapsed ? COLLAPSED_NAME_WIDTH : NAME_WIDTH;

    

    // Row height reserves headroom above task bars for the floating owner tag.
    // Fullscreen stays slightly shorter for density but still fits the tag.
    const ROW_HEIGHT = isFullscreen ? 52 : 56;

    const toolbarRef = useRef<HTMLDivElement>(null);
    const [toolbarHeight, setToolbarHeight] = useState(0);

    useEffect(() => {
        const el = toolbarRef.current;
        if (!el) return;
        const update = () => setToolbarHeight(el.offsetHeight);
        update();
        const observer = new ResizeObserver(update);
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    
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

    const toggleTask = (id: number) => {
        setCollapsedTasks((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    // Navigate to the work item detail page when a task is clicked.
    // Guards against firing after an actual drag (move/resize) gesture.
    const handleTaskClick = useCallback(
        (item: TimelineItem) => {
            if (item.type !== "task" || !item.taskId) return;
            if (dragMovedRef.current || dragState?.mode) return;
            router.visit(`/projects/${projectId}/work-items/${item.taskId}`);
        },
        [projectId, dragState]
    );

    const removeDependency = useCallback(
        (dep: Dependency) => {
            if (!window.confirm(`Remove dependency ${dep.predecessor.title} → ${dep.successor.title}?`)) return;
            router.delete(`/projects/${projectId}/dependencies/${dep.id}`, {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => setDependencies((prev) => prev.filter((d) => d.id !== dep.id)),
            });
        },
        [projectId]
    );

    const findMilestoneForGroup = useCallback((groupId: number): Milestone | undefined => {
        const group = localGroups.find(g => g.id === groupId);
        if(!group?.milestone_id) return undefined;
        return localMilestones.find(m => m.id === group.milestone_id);
    }, [localGroups, localMilestones]);

    const findGroupForTask = useCallback((taskId: number): WorkItemGroup | undefined => {
        const task = localWorkItems.find(w => w.id === taskId);
        if(!task?.group_id) return undefined;
        return localGroups.find(g => g.id === task.group_id);
    }, [localWorkItems, localGroups]);

    // Track viewport width while in fullscreen so UNIT_WIDTH can be fitted to it
    // useEffect(() => {
    //     if (!isFullscreen) return;
    //     const update = () => setContainerWidth(window.innerWidth);
    //     update();
    //     window.addEventListener("resize", update);
    //     return () => window.removeEventListener("resize", update);
    // }, [isFullscreen]);

    useEffect(() => {
        const el = containerRef.current;
        if(!el) return;
        const update = () => setContainerWidth(el.clientWidth);
        update();
        const observer = new ResizeObserver(update);
        observer.observe(el);
        window.addEventListener("resize", update);
        return () => { 
            observer.disconnect();
            window.removeEventListener("resize", update);
        };
    }, []);

    // Escape-to-exit fullscreen + lock background scroll while active
    useEffect(() => {
        if (!isFullscreen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setIsFullscreen(false);
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = previousOverflow;
        };
    }, [isFullscreen]);

    // Fetch dependencies on mount
    useEffect(() => {
        fetch(`/projects/${projectId}/dependencies`, {
            headers: { Accept: 'application/json' },
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.success) {
                    setDependencies(data.dependencies);
                }
            })
            .catch(() => console.error('Failed to load dependencies'));
    }, [projectId]);

    const refreshDependencies = useCallback(() => {
        fetch(`/projects/${projectId}/dependencies`, {
            headers: { Accept: 'application/json' },
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.success) {
                    setDependencies(data.dependencies);
                }
            })
            .catch(() => console.error('Failed to load dependencies'));
    }, [projectId]);

    // Cleanup save timer on unmount
    useEffect(() => {
        return () => {
            if (saveTimerRef.current) {
                clearTimeout(saveTimerRef.current);
            }
        };
    }, []);

    const items = useMemo<TimelineItem[]>(() => {
        const result: TimelineItem[] = [];

        // Group milestones by their ID from workItemGroups
        const milestoneGroups = new Map<number, { milestone: Milestone; groups: typeof workItemGroups }>();

        for (const group of localGroups) {
            if (!group.start_date || !group.end_date) continue;
            const milestoneId = group.milestone_id;
            if (!milestoneId) continue;

            if (!milestoneGroups.has(milestoneId)) {
                const milestone = localMilestones.find((m) => m.id === milestoneId);
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
                progress: typeof milestone.completion_percentage === "number" ? milestone.completion_percentage : milestone.completed_at ? 100 : 0,
                level: 0,
                description: milestone.description,
                collapsed: collapsedMilestones.has(milestone.id),
            });

            for (const group of groups) {
                const groupStart = group.start_date ? new Date(group.start_date) : new Date();
                const groupEnd = group.end_date ? new Date(group.end_date) : new Date();
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
                    // Tasks belonging to this group only
                    const groupTasks = localWorkItems.filter((item) => item.group_id === group.id);

                    for (const task of groupTasks) {
                        if (!task.start_date && !task.due_date) continue;

                        const taskStart = task.start_date
                            ? new Date(task.start_date)
                            : new Date(task.due_date!);
                        const taskEnd = task.due_date
                            ? new Date(task.due_date)
                            : new Date(task.start_date!);
                        if (isNaN(taskStart.getTime()) || isNaN(taskEnd.getTime())) continue;

                        result.push({
                            id: `task-${task.id}`,
                            taskId: task.id,
                            name: task.title,
                            start: taskStart,
                            end: taskEnd,
                            type: "task",
                            progress: task.progress ?? 0,
                            level: 2,
                            description: task.description,
                            assignee: task.assignee,
                            collapsed: collapsedTasks.has(task.id),
                        });
                    }
                }
            }
        }

        // Ungrouped tasks (not assigned to a listed group) — show them once, still collapsible
        const groupIdSet = new Set(localGroups.map((g) => g.id));
        const placedTaskIds = new Set(result.filter((i) => i.type === "task").map((i) => i.taskId));

        for (const task of localWorkItems) {
            if (placedTaskIds.has(task.id)) continue;
            if (task.group_id != null && groupIdSet.has(task.group_id)) continue;
            if (!task.start_date && !task.due_date) continue;

            const taskStart = task.start_date
                ? new Date(task.start_date)
                : new Date(task.due_date!);
            const taskEnd = task.due_date
                ? new Date(task.due_date)
                : new Date(task.start_date!);
            if (isNaN(taskStart.getTime()) || isNaN(taskEnd.getTime())) continue;

            result.push({
                id: `task-${task.id}`,
                taskId: task.id,
                name: task.title,
                start: taskStart,
                end: taskEnd,
                type: "task",
                progress: task.progress ?? 0,
                level: 1,
                description: task.description,
                assignee: task.assignee,
                collapsed: collapsedTasks.has(task.id),
            });
        }

        return result;
    }, [localWorkItems, localMilestones, localGroups, collapsedMilestones, collapsedGroups, collapsedTasks]);

    // NOTE: this memo uses BASE_UNIT_WIDTH (a fixed constant) rather than the
    // dynamic UNIT_WIDTH, since UNIT_WIDTH below depends on totalUnits and would
    // otherwise create a circular "used before declaration" dependency.

    
    
    const { earliest, totalUnits, periods, periodGroups, todayOffset } = useMemo(() => {
        if (!items.length) {
            return {
                earliest: new Date(),
                totalUnits: 0,
                periods: [] as TimePeriod[],
                periodGroups: [] as PeriodGroup[],
                todayOffset: -1,
            };
        }

        // Include preview offset for live feedback
        let allStartDates = items.map((i) => i.start.getTime());
        let allEndDates = items.map((i) => i.end.getTime());

        // If dragging a task, expand range to include the preview position
        if (dragState?.mode === "move" && dragState.itemId) {
            const draggedItem = items.find((i) => i.id === dragState.itemId);
            if (draggedItem) {
                const offsetDays = Math.round(dragState.currentOffset / (BASE_UNIT_WIDTH / VIEW_DAYS_PER_PERIOD[viewMode]));
                const previewStart = addDays(draggedItem.start, offsetDays);
                const previewEnd = addDays(draggedItem.end, offsetDays);
                allStartDates = [...allStartDates, previewStart.getTime()];
                allEndDates = [...allEndDates, previewEnd.getTime()];
            }
        }
        if (dragState?.mode === "resize-end" && dragState.itemId) {
            const draggedItem = items.find((i) => i.id === dragState.itemId);
            if (draggedItem) {
                const offsetDays = Math.round(dragState.currentOffset / (BASE_UNIT_WIDTH / VIEW_DAYS_PER_PERIOD[viewMode]));
                const previewEnd = addDays(draggedItem.end, offsetDays);
                allEndDates = [...allEndDates, previewEnd.getTime()];
            }
        }
        if (dragState?.mode === "resize-start" && dragState.itemId) {
            const draggedItem = items.find((i) => i.id === dragState.itemId);
            if (draggedItem) {
                const offsetDays = Math.round(dragState.currentOffset / (BASE_UNIT_WIDTH / VIEW_DAYS_PER_PERIOD[viewMode]));
                const previewStart = addDays(draggedItem.start, offsetDays);
                allStartDates = [...allStartDates, previewStart.getTime()];
            }
        }

       const earliest = new Date(Math.min(...allStartDates));
    let latest = new Date(Math.max(...allEndDates));

    let periods = buildPeriods(earliest, latest, viewMode);

    // Pad with extra trailing periods so the timeline fills the viewport
    // instead of stretching each column's width to compensate.
    const baseWidth = VIEW_UNIT_WIDTH[viewMode];
    const available = containerWidth - effectiveNameWidth;
    if (available > 0) {
        const neededUnits = Math.ceil(available / baseWidth);
        if (periods.length < neededUnits) {
            const extendedLatest = addPeriods(
                startOfPeriod(latest, viewMode),
                neededUnits - 1,
                viewMode
            );
            periods = buildPeriods(earliest, extendedLatest, viewMode);
        }
    }

    const periodGroups = groupPeriods(periods);
    const totalUnits = periods.length;

    const today = new Date();
    const todayOffset =
        today >= stripTime(earliest) && today <= stripTime(latest)
            ? columnIndexOf(today, earliest, viewMode)
            : -1;

    return { earliest, totalUnits, periods, periodGroups, todayOffset };
}, [items, dragState, viewMode, containerWidth, effectiveNameWidth]);

    

        const EDGE_TRESHOLD = 60;
        const MAX_SCORLL_SPEED = 18;

        const runAutoScroll = useCallback(() => {
            const container = containerRef.current;
            const pos =lastMousePosRef.current;
            if(!container || !pos) return;

            const rect = container.getBoundingClientRect();
            let dx = 0;
            let dy = 0;

            // Horizontal Edges
            if(pos.x < rect.left + EDGE_TRESHOLD){
                const intensity = 1 -Math.max(pos.x - rect.left, 0) / EDGE_TRESHOLD;
                dx = -Math.ceil(MAX_SCORLL_SPEED * intensity);
            } else if(pos.x > rect.left + EDGE_TRESHOLD){
                const intensity = 1 -Math.max(rect.right - pos.x, 0) /EDGE_TRESHOLD;
                dx = Math.ceil(MAX_SCORLL_SPEED * intensity);
            }

            //Vertical Edges
             if(pos.y < rect.left + EDGE_TRESHOLD){
                const intensity = 1 -Math.max(pos.y - rect.left, 0) / EDGE_TRESHOLD;
                dy = -Math.ceil(MAX_SCORLL_SPEED * intensity);
            } else if(pos.x > rect.left + EDGE_TRESHOLD){
                const intensity = 1 -Math.max(rect.right - pos.y, 0) /EDGE_TRESHOLD;
                dy = Math.ceil(MAX_SCORLL_SPEED * intensity);
            }

            if (dx !== 0) container.scrollLeft += dx;
            if (dy !== 0) container.scrollTop += dy;

            if (dx !== 0){
                setDragState( (prev) => 
                prev ? { ...prev, currentOffset: prev.currentOffset + dx} : prev
                );
            }
        },[])

        const UNIT_WIDTH = useMemo(() => {
        const baseWidth = VIEW_UNIT_WIDTH[viewMode];
        if( !containerWidth || totalUnits === 0) return baseWidth;

        const available = containerWidth - effectiveNameWidth;
        if (available <= 0) return baseWidth;

        if (isFullscreen){
        const fitWidth = Math.floor(available / totalUnits);
        return Math.min(Math.max(fitWidth, 60), 240);
        }

        const naturalWidth = totalUnits * baseWidth;
        if(naturalWidth <available){
        return Math.floor(available / totalUnits);
        }
        return baseWidth;
        },[isFullscreen, containerWidth, totalUnits, viewMode, effectiveNameWidth]);

    // Pixel-per-day for the current view. Used so drag offsets convert to
    // individual days regardless of the selected period granularity.
    const PIXELS_PER_DAY = UNIT_WIDTH / VIEW_DAYS_PER_PERIOD[viewMode];
    const MIN_BAR_WIDTH = Math.min(60, Math.max(10, PIXELS_PER_DAY * 3));

    // Get the displayed position/duration for an item considering drag state
    const getItemLayout = useCallback(
        (item: TimelineItem) => {
            let start = item.start;
            let end = item.end;

            if (dragState?.itemId === item.id) {
                const offsetDays = Math.round(dragState.currentOffset / PIXELS_PER_DAY);
                if (dragState.mode === "move") {
                    start = addDays(item.start, offsetDays);
                    end = addDays(item.end, offsetDays);
                } else if (dragState.mode === "resize-end") {
                    end = addDays(item.end, offsetDays);
                } else if (dragState.mode === "resize-start") {
                    start = addDays(item.start, offsetDays);
                }
            }

            const startOffset = columnIndexOf(start, earliest, viewMode);
            const endOffset = columnIndexOf(end, earliest, viewMode);
            const duration = Math.max(endOffset - startOffset , 0);
            const barWidth = Math.max(duration * UNIT_WIDTH, MIN_BAR_WIDTH);
            const barLeft = startOffset * UNIT_WIDTH ;

            // Vertical placement: integer-pixel `top` keeps the bar perfectly
            // centered in its row so no sub-pixel bottom edge gets clipped away.
            const barHeight = barHeightForType(item.type);
            const barTop = Math.max(Math.round((ROW_HEIGHT - barHeight) / 2), 0);

            return { start, end, startOffset, duration, barWidth, barLeft, barHeight, barTop };
        },
        [dragState, earliest, UNIT_WIDTH, PIXELS_PER_DAY, viewMode, ROW_HEIGHT]
    );

    // Handle drag start on bars (tasks, groups, milestones)
    const handleDragStart = useCallback(
        (e: React.MouseEvent, item: TimelineItem, mode: DragMode) => {
            if (readOnly) return;
            if (item.type !== "task" && item.type !== "group" && item.type !== "milestone") return;
            e.preventDefault();
            e.stopPropagation();
            dragMovedRef.current = false;

            setDragState({
                mode,
                itemId: item.id,
                startX: e.clientX,
                originalStart: item.start,
                originalEnd: item.end,
                currentOffset: 0,
            });
        },
        []
    );

    // Handle dependency drag start from task right edge handle
    const handleDepDragStart = useCallback(
        (e: React.MouseEvent, item: TimelineItem) => {
            if (readOnly || item.type !== "task") return;
            e.preventDefault();
            e.stopPropagation();

            setDepPreview({
                fromTaskId: item.id,
                toTaskId: null,
                startX: e.clientX,
                startY: e.clientY,
                x: e.clientX,
                y: e.clientY,
            });
        },
        []
    );


         // Handle mouse move for drag operations
    const handleGlobalMouseMove = useCallback(
        (e: MouseEvent) => {
            lastMousePosRef.current = { x: e.clientX, y: e.clientY};

            const container = containerRef.current;
            if(container && (dragState?.mode || depPreview)){
                const rect = container.getBoundingClientRect();
                const nearEdge = 
                    e.clientX < rect.left + EDGE_TRESHOLD ||
                    e.clientX > rect.right - EDGE_TRESHOLD ||
                    e.clientY < rect.top + EDGE_TRESHOLD ||
                    e.clientY > rect.bottom - EDGE_TRESHOLD;

                if(nearEdge && !autoScrollRef.current){
                    autoScrollRef.current = setInterval(runAutoScroll, 16); //60fps
                } else if (!nearEdge &&autoScrollRef.current){
                    clearInterval(autoScrollRef.current);
                    autoScrollRef.current = null;
                }

            }

            // Handle dependency preview
            if (depPreview) {
                setDepPreview((prev) => (prev ? { ...prev, x: e.clientX, y: e.clientY } : prev));
                return;
            }

            // Handle move/resize drag
            if (dragState?.mode && (dragState.mode === "move" || dragState.mode === "resize-start" || dragState.mode === "resize-end")) {
                const offset = e.clientX - dragState.startX;
                let clampedOffset = offset;

                // Live clamping: enforce task boundary constraints during drag
                const item = items.find((i) => i.id === dragState.itemId);
                if (item && item.type === "task" && item.taskId) {
                    const taskGroup = findGroupForTask(item.taskId);
                    if (taskGroup && taskGroup.start_date && taskGroup.end_date) {
                        const offsetDays = Math.round(offset / PIXELS_PER_DAY);
                        const groupStart = new Date(taskGroup.start_date);
                        const groupEnd = new Date(taskGroup.end_date);

                        if (dragState.mode === "move") {
                            const newStart = addDays(item.start, offsetDays);
                            const newEnd = addDays(item.end, offsetDays);

                            if (newStart < groupStart) {
                                clampedOffset = differenceInDays(groupStart, item.start) * PIXELS_PER_DAY;
                            }
                            if (newEnd > groupEnd) {
                                clampedOffset = Math.min(clampedOffset, differenceInDays(groupEnd, item.end) * PIXELS_PER_DAY);
                            }
                        } else if (dragState.mode === "resize-end") {
                            const newEnd = addDays(item.end, offsetDays);
                            if (newEnd > groupEnd) {
                                clampedOffset = differenceInDays(groupEnd, item.end) * PIXELS_PER_DAY;
                            }
                        } else if (dragState.mode === "resize-start") {
                            const newStart = addDays(item.start, offsetDays);
                            if (newStart < groupStart) {
                                clampedOffset = differenceInDays(groupStart, item.start) * PIXELS_PER_DAY;
                            }
                        }
                    }
                }

                if (Math.abs(offset) > 4) dragMovedRef.current = true;

                setDragState((prev) => (prev ? { ...prev, currentOffset: clampedOffset } : prev));
            }
        },
        [dragState, depPreview, items, PIXELS_PER_DAY, findGroupForTask, runAutoScroll]
    );

    // Handle mouse up for drag operations
    const handleGlobalMouseUp = useCallback(() => {
        if (autoScrollRef.current) {
        clearInterval(autoScrollRef.current);
        autoScrollRef.current = null;
    }
        // Handle dependency creation
        if (depPreview) {
            // Find which task bar we dropped on
            const dropTask = items.find((item) => {
                if (item.type !== "task") return false;
                const t = item.id;
                if (t === depPreview.fromTaskId) return false;

                // Find if the drop position overlaps the task bar
                const rect = containerRef.current?.querySelector(`[data-task-id="${t}"]`)?.getBoundingClientRect();
                if (!rect) return false;

                // Use stored client coordinates for hit testing
                const containerRect = containerRef.current?.getBoundingClientRect();
                if (!containerRect) return false;

                // Convert preview x (container-relative) to client x
                const clientX = depPreview.x + containerRect.left;
                const clientY = depPreview.y + containerRect.top;

                return (
                    clientX >= rect.left &&
                    clientX <= rect.right &&
                    clientY >= rect.top &&
                    clientY <= rect.bottom
                );
            });

            if (dropTask) {
                const fromId = depPreview.fromTaskId.replace("task-", "");
                const toId = dropTask.id.replace("task-", "");

                router.post(
                    `/projects/${projectId}/dependencies`,
                    {
                        predecessor_id: fromId,
                        successor_id: toId,
                        type: "finish_to_start",
                        lag: 0,
                    },
                    {
                        preserveScroll: true,
                        preserveState: true,
                        onSuccess: () => {
                            // Refresh dependencies
                            fetch(`/projects/${projectId}/dependencies`, {
                                headers: { Accept: 'application/json' },
                            })
                                .then((res) => res.json())
                                .then((data) => {
                                    if (data.success) {
                                        setDependencies(data.dependencies);
                                    }
                                });
                        },
                        onError: (errors) => {
                            console.error('Failed to create dependency:', errors);
                        },
                    }
                );
            }
            setDepPreview(null);
            return;
        }

        if (!dragState?.mode) return;

        if (dragState.mode === "move" || dragState.mode === "resize-start" || dragState.mode === "resize-end") {
            const offsetDays = Math.round(dragState.currentOffset / PIXELS_PER_DAY);
            if (offsetDays === 0) {
                setDragState(null);
                return;
            }

            const item = items.find((i) => i.id === dragState.itemId);
            if (!item) {
                setDragState(null);
                return;
            }

                                    if (dragState.mode === "move") {
                let newStart = addDays(item.start, offsetDays);
                let newEnd = addDays(item.end, offsetDays);

                // Constraint: Group cannot exceed milestone target_date
                if (item.type === "group") {
                    const groupId = parseInt(item.id.replace('group-', ''));
                    const milestone = findMilestoneForGroup(groupId);
                    if (milestone && milestone.target_date) {
                        const milestoneTarget = new Date(milestone.target_date);

                        // Clamp group's end to milestone's target_date
                        if (newEnd > milestoneTarget) {
                            const groupDuration = Math.max(differenceInDays(item.end, item.start), 1);
                            newEnd = milestoneTarget;
                            newStart = addDays(newEnd, -groupDuration);

                            // If clamping results in no movement, skip entirely
                            if (newStart.getTime() === item.start.getTime()) {
                                setDragState(null);
                                return;
                            }
                        }
                    }
                }

                if (item.type === "task" && item.taskId) {
                    // Constraint: Task cannot exceed its parent group's date range
                    let constrainedStart = newStart;
                    let constrainedEnd = newEnd;

                    const group = findGroupForTask(item.taskId);
                    if (group && group.start_date && group.end_date) {
                        const groupStart = new Date(group.start_date);
                        const groupEnd = new Date(group.end_date);
                        const taskDuration = Math.max(differenceInDays(item.end, item.start), 1);

                        // Task start cannot be before group start
                        if (constrainedStart < groupStart) {
                            constrainedStart = groupStart;
                            constrainedEnd = addDays(constrainedStart, taskDuration);
                        }

                        // Task end cannot exceed group end
                        if (constrainedEnd > groupEnd) {
                            constrainedEnd = groupEnd;
                            constrainedStart = addDays(constrainedEnd, -taskDuration);
                        }

                        // If no movement after clamping, skip save
                        if (
                            constrainedStart.getTime() === item.start.getTime() &&
                            constrainedEnd.getTime() === item.end.getTime()
                        ) {
                            setDragState(null);
                            return;
                        }
                    }

                    // Optimistic update for tasks
                    setLocalWorkItems((prev) =>
                        prev.map((wi) =>
                            wi.id === item.taskId
                                ? {
                                      ...wi,
                                      start_date: constrainedStart.toISOString().slice(0, 10),
                                      due_date: constrainedEnd.toISOString().slice(0, 10),
                                  }
                                : wi
                        )
                    );

                    // Debounced save
                    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
                    saveTimerRef.current = setTimeout(() => {
                        router.patch(
                            `/projects/${projectId}/work-items/${item.taskId}/move`,
                            { start_date: constrainedStart.toISOString().slice(0, 10) },
                            {
                                preserveScroll: true,
                                preserveState: true,
                                onError: () => {
                                    setLocalWorkItems(workItems);
                                },
                            }
                        );
                    }, 300);
                } else if (item.type === "group") {
                    const groupId = parseInt(item.id.replace('group-', ''));
                    setLocalGroups(prev => prev.map(g =>
                        g.id === groupId ?
                            {
                                ...g,
                                start_date: newStart.toISOString().slice(0, 10),
                                end_date: newEnd.toISOString().slice(0, 10),
                            } : g
                    ));

                    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
                    saveTimerRef.current = setTimeout(() => {
                        router.patch(
                            `/projects/${projectId}/groups/${groupId}/move`,
                            {
                                start_date: newStart.toISOString().slice(0, 10),
                                end_date: newEnd.toISOString().slice(0, 10),
                            },
                            {
                                preserveScroll: true,
                                preserveState: true,
                                onError: () => {
                                    console.error('Failed to move group');
                                },
                            }
                        );
                    }, 300);
                } else if (item.type === "milestone") {
                    const milestoneId = parseInt(item.id.replace('milestone-', ''));
                    setLocalMilestones(prev => prev.map(m =>
                        m.id === milestoneId ?
                            {
                                ...m,
                                target_date: newStart.toISOString().slice(0, 10),
                            } : m
                    ));
                    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
                    saveTimerRef.current = setTimeout(() => {
                        router.patch(
                            `/projects/${projectId}/milestones/${milestoneId}/move`,
                            {
                                target_date: newStart.toISOString().slice(0, 10),
                            },
                            {
                                preserveScroll: true,
                                preserveState: true,
                                onError: () => {
                                    console.error('Failed to move Milestone');
                                }
                            }
                        );
                    }, 300);
                }
            }

                if (dragState.mode === "resize-end") {
                const newEnd = addDays(item.end, offsetDays);
                if (newEnd < item.start) {
                    setDragState(null);
                    return;
                }

                if (item.type === "task" && item.taskId) {
                    // Constraint: Task end cannot exceed its parent group's end date
                    let constrainedEnd = newEnd;

                    const group = findGroupForTask(item.taskId);
                    if (group && group.end_date) {
                        const groupEnd = new Date(group.end_date);

                        if (constrainedEnd > groupEnd) {
                            constrainedEnd = groupEnd;
                        }

                        // If no effective change, skip save
                        if (constrainedEnd.getTime() === item.end.getTime()) {
                            setDragState(null);
                            return;
                        }
                    }

                    setLocalWorkItems((prev) =>
                        prev.map((wi) =>
                            wi.id === item.taskId
                                ? { ...wi, due_date: constrainedEnd.toISOString().slice(0, 10) }
                                : wi
                        )
                    );

                    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
                    saveTimerRef.current = setTimeout(() => {
                        router.patch(
                            `/projects/${projectId}/work-items/${item.taskId}/resize`,
                            {
                                start_date: item.start.toISOString().slice(0, 10),
                                due_date: constrainedEnd.toISOString().slice(0, 10),
                            },
                            {
                                preserveScroll: true,
                                preserveState: true,
                                onError: () => {
                                    setLocalWorkItems(workItems);
                                },
                            }
                        );
                    }, 300);
                }
            }

                                    if (dragState.mode === "resize-start") {
                const newStart = addDays(item.start, offsetDays);
                if (newStart > item.end) {
                    setDragState(null);
                    return;
                }

                if (item.type === "task" && item.taskId) {
                    // Constraint: Task start cannot go before its parent group's start date
                    let constrainedStart = newStart;

                    const group = findGroupForTask(item.taskId);
                    if (group && group.start_date) {
                        const groupStart = new Date(group.start_date);

                        if (constrainedStart < groupStart) {
                            constrainedStart = groupStart;
                        }

                        // If no effective change, skip save
                        if (constrainedStart.getTime() === item.start.getTime()) {
                            setDragState(null);
                            return;
                        }
                    }

                    setLocalWorkItems((prev) =>
                        prev.map((wi) =>
                            wi.id === item.taskId
                                ? { ...wi, start_date: constrainedStart.toISOString().slice(0, 10) }
                                : wi
                        )
                    );

                    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
                    saveTimerRef.current = setTimeout(() => {
                        router.patch(
                            `/projects/${projectId}/work-items/${item.taskId}/resize`,
                            {
                                start_date: constrainedStart.toISOString().slice(0, 10),
                                due_date: item.end.toISOString().slice(0, 10),
                            },
                            {
                                preserveScroll: true,
                                preserveState: true,
                                onError: () => {
                                    setLocalWorkItems(workItems);
                                },
                            }
                        );
                    }, 300);
                }
            }
        }

                setDragState(null);
    }, [dragState, depPreview, items, projectId, workItems, PIXELS_PER_DAY, findGroupForTask, findMilestoneForGroup]);

    useEffect(() => {
    return () => {
        if (autoScrollRef.current) clearInterval(autoScrollRef.current);
    };
}, []);

    // Attach global mouse listeners
    useEffect(() => {
        if (dragState?.mode || depPreview) {
            window.addEventListener("mousemove", handleGlobalMouseMove);
            window.addEventListener("mouseup", handleGlobalMouseUp);
            return () => {
                window.removeEventListener("mousemove", handleGlobalMouseMove);
                window.removeEventListener("mouseup", handleGlobalMouseUp);
            };
        }
    }, [dragState?.mode, depPreview, handleGlobalMouseMove, handleGlobalMouseUp]);

    if (!items.length) {
        return (
            <div className="py-8 text-center text-sm text-muted-foreground">
                No timeline available. Add work items with start/due dates first.
            </div>
        );
    }

    return (
        <div
            className={
                isFullscreen
                    ? "fixed inset-0 z-[100] bg-background overflow-x-auto overflow-y-auto"
                    : "w-full max-w-full min-w-0 max-h-screen rounded-lg border bg-background overflow-x-auto overflow-y-auto"
            }
            ref={containerRef}
        >
            
            <TooltipProvider delayDuration={300}>
                
                <div ref={toolbarRef} className="sticky top-0 left-0 z-50 flex flex-wrap items-center gap-2 border-b border-input bg-background px-2 py-1.5 text-sm w-full min-w-max">
                    <button
                        onClick={() => setSidebarCollapsed((prev) => !prev)}
                        title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                        className="inline-flex items-center justify-center h-7 w-7 rounded border border-input bg-background hover:bg-accent text-muted-foreground"
                    >
                        {sidebarCollapsed ? <PanelLeftOpen className="h-3.5 w-3.5" /> : <PanelLeftClose className="h-3.5 w-3.5" />}
                    </button>
                    <div className="flex items-center gap-0.5 rounded border border-input bg-muted/40 p-0.5">
                        {(["day", "week", "month", "quarter", "year"] as ViewMode[]).map((v) => (
                            <button
                                key={v}
                                onClick={() => setViewMode(v)}
                                title={`${v} view`}
                                className={`h-6 px-2 rounded text-[11px] font-semibold uppercase tracking-wide transition-colors ${
                                    viewMode === v
                                        ? "bg-background text-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                {v === "quarter" ? "Qtr" : v.charAt(0).toUpperCase() + v.slice(1, 3)}
                            </button>
                        ))}
                    </div>
                    <span className="flex-1" />
                    
                    <button
                        onClick={() => setShowDependencies(!showDependencies)}
                        title={showDependencies ? "Hide dependencies" : "Show dependencies"}
                        className="inline-flex items-center justify-center h-7 w-7 rounded border border-input bg-background hover:bg-accent text-muted-foreground"
                    >
                        {showDependencies ? <Link2 className="h-3.5 w-3.5 text-blue-600" /> : <Link2Off className="h-3.5 w-3.5" />}
                    </button>
                    {!readOnly && (
                    <button
                        onClick={() => setAddDepOpen(true)}
                        title="Add dependency"
                        className="inline-flex items-center h-7 px-2 rounded border border-input bg-background hover:bg-accent text-muted-foreground text-[11px] font-semibold"
                    >
                        + Link
                    </button>
                    )}
                    {readOnly && (
                        <span className="inline-flex items-center h-7 px-2 rounded bg-muted text-muted-foreground text-[11px] font-medium" title="View only — ask a manager to change the schedule">
                            View only
                        </span>
                    )}
                    <button
                        onClick={() => setIsFullscreen((prev) => !prev)}
                        title={isFullscreen ? "Exit fullscreen (Esc)" : "Fullscreen"}
                        className="inline-flex items-center justify-center h-7 w-7 rounded border border-input bg-background hover:bg-accent text-muted-foreground"
                    >
                        {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                    </button>
                </div>
                <div
                    className="grid"
                    style={{
                        position: 'relative',
                        width: effectiveNameWidth + totalUnits * UNIT_WIDTH,
                        minWidth: effectiveNameWidth + totalUnits * UNIT_WIDTH,
                        gridTemplateColumns: `${effectiveNameWidth}px ${totalUnits * UNIT_WIDTH}px`,
                    }}
                >
                    {/* ── Header: Task label ── */}
                    <div className="sticky left-0 z-50 border-b bg-background p-3 font-semibold text-sm flex items-center" style={{ top: toolbarHeight }}>
                        Task
                    </div>

                    {/* ── Header: Period groups + unit labels ── */}
                    <div className="border-b bg-muted/40 min-w-0">
                        {/* Group labels row */}
                        <div className="flex min-w-0">
                            {periodGroups.map((group) => (
                                <div
                                    key={group.label}
                                    className="flex items-center justify-center border-l py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                                    style={{ width: group.periods.length * UNIT_WIDTH }}
                                >
                                    {group.label}
                                </div>
                            ))}
                        </div>
                        {/* Unit labels row */}
                        <div className="flex min-w-0">
                            {periods.map((period) => (
                                <div
                                    key={period.key}
                                    className={`flex items-center justify-center border-l py-1 text-[11px] tabular-nums ${
                                        viewMode === "day" && isWeekend(period.start)
                                            ? "bg-muted/30 text-muted-foreground/50"
                                            : "text-muted-foreground"
                                    } ${isToday(period.start) ? "font-bold text-blue-600" : ""}`}
                                    style={{ width: UNIT_WIDTH, height: 24 }}
                                >
                                    {period.label}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── Rows ── */}
                    {items.map((item, index) => {
                        const layout = getItemLayout(item);
                        const isEvenRow = index % 2 === 0;
                        const isDragging = dragState?.itemId === item.id;

                        return (
                            <React.Fragment key={item.id}>
                                {/* Sidebar cell */}
                                <div
                                    className={`sticky left-0 z-20 flex items-center border-b px-3 transition-colors bg-background`}
                                    style={{ height: ROW_HEIGHT, paddingLeft: sidebarCollapsed ? 0 : 12 + item.level * 20 }}
                                >
                                    <div className={`min-w-0 ${sidebarCollapsed ? "w-full flex items-center justify-center" : "flex-1"}`}>
                                       
                                        {!sidebarCollapsed && (
                                            <>
                                                
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span
                                                            onClick={() => handleTaskClick(item)}
                                                            className={`min-w-0 flex-1 text-sm font-medium truncate ${item.type === "task" && item.taskId ? "cursor-pointer hover:underline" : ""}`}
                                                        >
                                                            {item.name}
                                                            {(item.type === "milestone" || item.type === "group" ) && (
                                            <button
                                                onClick={() => {
                                                    if (item.type === "milestone") {
                                                        toggleMilestone(parseInt(item.id.replace('milestone-', '')));
                                                    } else if (item.type === "group") {
                                                        toggleGroup(parseInt(item.id.replace('group-', '')));
                                                    } 
                                                }}
                                                className={`inline-flex items-center justify-center hover:bg-muted rounded shrink-0 ${
                                                    sidebarCollapsed ? "h-5 w-5" : "h-4 w-4"
                                                }`}
                                            >
                                                {item.collapsed ? (
                                                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                                ) : (
                                                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                                                )}
                                            </button>
                                        )}
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
                                                            : formatDateRange(layout.start, layout.end)}
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Timeline cell */}
                                <div
                                    className={`relative border-b transition-colors ${
                                        isEvenRow ? "bg-background" : "bg-muted/10"
                                    } hover:bg-muted/20`}
                                    style={{ height: ROW_HEIGHT }}
                                    data-task-id={item.id}
                                >
                                    {/* Vertical grid lines */}
                                    <div className="absolute inset-0 flex pointer-events-none">
                                        {periods.map((period) => (
                                            <div key={period.key} className={`border-l ${viewMode === "day" && isWeekend(period.start) ? "bg-muted/20" : ""}`} style={{ width: UNIT_WIDTH }} />
                                        ))}
                                    </div>

                                    {/* Today indicator */}
                                    {index === 0 && todayOffset >= 0 && (
                                        <>
                                            <div
                                                className="absolute top-0 bottom-0 z-10 pointer-events-none"
                                                style={{ left: todayOffset * UNIT_WIDTH + 12 }}
                                            >
                                                <div className="w-px h-full bg-blue-500/60" />
                                            </div>
                                            <div
                                                className="absolute -top-0.5 z-10 rounded bg-blue-500 px-1 py-[1px] text-[9px] font-bold text-white whitespace-nowrap pointer-events-none"
                                                style={{
                                                    left: Math.max(20, Math.min(todayOffset * UNIT_WIDTH + 12, totalUnits * UNIT_WIDTH - 20)),
                                                    transform: "translateX(-50%)",
                                                }}
                                            >
                                                Today
                                            </div>
                                        </>
                                    )}

                                    {/* Task, Group, or Milestone bar */}
                                    {(item.type === "task" || item.type === "group" || item.type === "milestone" || item.type === "subtask") && (
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div
                                                    className={`absolute ${item.type === "task" ? "cursor-pointer" : ""}`}
                                                    style={{ left: layout.barLeft, top: layout.barTop, width: layout.barWidth }}
                                                    onMouseDown={(e) => handleDragStart(e, item, "move")}
                                                    onClick={() => handleTaskClick(item)}
                                                >
                                                    {item.type === "task" ? (
                                                        <>
                                                            {/* Owner tag — floats above the bar so it never overlaps the name
                                                                and stays visible even on narrow bars */}
                                                            {(item.assignee?.name || item.progress > 0) && (
                                                                <span className="absolute left-0 z-20 -translate-y-[calc(100%+2px)] pointer-events-none whitespace-nowrap rounded bg-indigo-600/80 px-1 py-0.5 text-[9px] font-medium text-indigo-100">
                                                                    {(item.assignee?.name ? item.assignee.name : "Unassigned")}
                                                                    {item.progress > 0 ? ` · ${item.progress}%` : ""}
                                                                </span>
                                                            )}
                                                            <div
                                                                className={`relative h-7 rounded-md overflow-hidden cursor-grab active:cursor-grabbing select-none
                                                                bg-gradient-to-r from-indigo-600 to-indigo-500
                                                                shadow-md hover:shadow-lg
                                                                hover:from-indigo-700 hover:to-indigo-600
                                                                transition-colors duration-150
                                                                ${isDragging && dragState?.mode === "move" ? "shadow-xl ring-2 ring-indigo-400/50" : ""}
                                                                ${isDragging && dragState?.mode !== "move" ? "ring-2 ring-amber-400/60" : ""}`}
                                                            >
                                                                {/* Progress fill */}
                                                                <div
                                                                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-800/40 to-indigo-700/20 transition-all duration-500 pointer-events-none"
                                                                    style={{ width: `${item.progress}%` }}
                                                                />
                                                                {/* Label */}
                                                                {layout.barWidth > 50 && (
                                                                    <span className="relative z-10 flex items-center w-full h-full px-2 text-[11px] font-semibold text-white truncate pointer-events-none">
                                                                        {item.name}
                                                                    </span>
                                                                )}

                                                                {/* Resize handles */}
                                                                <div
                                                                    style={readOnly ? { display: "none" } : undefined}
                                                                    className="absolute left-1.5 top-0 bottom-0 w-3.5 cursor-ew-resize hover:bg-white/40 rounded-l-md z-30"
                                                                    onMouseDown={(e) => handleDragStart(e, item, "resize-start")}
                                                                />
                                                                <div
                                                                    className="absolute right-1.5 top-0 bottom-0 w-3.5 cursor-ew-resize hover:bg-white/40 rounded-r-md z-30"
                                                                    onMouseDown={(e) => handleDragStart(e, item, "resize-end")}
                                                                />

                                                                {/* Dependency connection handle */}
                                                                <div
                                                                    style={readOnly ? { display: "none" } : undefined}
                                                                    className="absolute -right-2.5 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center h-5 w-5 rounded-full border border-indigo-300 bg-white/90 text-indigo-600 cursor-crosshair opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                                                    onMouseDown={(e) => handleDepDragStart(e, item)}
                                                                    title="Drag to create dependency"
                                                                >
                                                                    <Link2 className="h-3 w-3" />
                                                                </div>
                                                            </div>
                                                        </>
                                                    ) : item.type === "group" ? (
                                                        <div className="relative h-6 rounded-md overflow-hidden bg-slate-400/40 border border-slate-400/60 shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing">
                                                            <div
                                                                className="absolute inset-y-0 left-0 bg-slate-500/30 pointer-events-none"
                                                                style={{ width: `${item.progress}%` }}
                                                            />
                                                            {layout.barWidth > 60 && (
                                                                <span className="relative z-10 flex items-center h-full px-2 text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate pointer-events-none">
                                                                    {item.name} · {item.progress}%
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : item.type === "milestone" ? (
                                                        <div className="relative h-4 w-4 rotate-45 border-2 shadow-sm bg-amber-300 border-amber-400 cursor-grab active:cursor-grabbing">
                                                            {item.progress === 100 && (
                                                                <div className="absolute inset-0 flex items-center justify-center">
                                                                    <div className="h-1.5 w-1.5 rotate-45 bg-amber-700" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        /* SUBTASK bar */
                                                        <div className="relative h-3.5 rounded-sm bg-emerald-500/80 shadow-sm">
                                                            <div className="absolute inset-y-0 left-0 bg-emerald-700/30 pointer-events-none"
                                                                style={{ width: `${item.progress}%` }} />
                                                            {layout.barWidth > 30 && (
                                                                <span className="relative z-10 flex items-center h-full px-1.5 text-[10px] font-medium text-white truncate pointer-events-none">
                                                                    {item.name}
                                                                </span>
                                                            )}
                                                            {/* Resize handles */}
                                                            <div
                                                                className="absolute left-1 top-0 bottom-0 w-2.5 cursor-ew-resize hover:bg-white/40 rounded-1-md z-30 "
                                                                onMouseDown={(e) => handleDragStart(e, item, "resize-start")} />
                                                            <div
                                                                className="absolute left-1 top-0 bottom-0 w-2.5 cursor-ew-resize hover:bg-white/40 rounded-1-md z-30 "
                                                                onMouseDown={(e) => handleDragStart(e, item, "resize-end")} />
                                                        </div>
                                                    )}
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent side="top" align="center" className="z-50 max-w-[200px]">
                                                <div className="space-y-1">
                                                    <p className="font-medium text-popover-foreground">{item.name}</p>
                                                    {item.description && (
                                                        <p className="text-muted-foreground line-clamp-2">{item.description}</p>
                                                    )}
                                                    <div className="flex items-center gap-2 text-muted-foreground">
                                                        <span className="inline-block h-2 w-2 rounded-full bg-indigo-500" />
                                                        <span>{formatDateRange(layout.start, layout.end)}</span>
                                                    </div>
                                                    <p className="text-muted-foreground">Progress: {item.progress}%</p>
                                                </div>
                                            </TooltipContent>
                                        </Tooltip>
                                    )}
                                </div>
                            </React.Fragment>
                        );
                    })}

                    {/* ── Dependency arrows overlay ── */}
                    {showDependencies && dependencies.length > 0 && (
                        <div
                            className="absolute pointer-events-none z-40 overflow-hidden"
                            style={{
                                left: effectiveNameWidth,
                                width: totalUnits * UNIT_WIDTH,
                                height: items.length * ROW_HEIGHT,
                                top: viewMode === "day" ? 58 : 42,
                            }}
                        >
                            <svg
                                className="w-full h-full "
                                style={{ position: 'relative', overflow: 'hidden' }}
                            >
                                {dependencies.map((dep) => {
                                    const pred = items.find((i) => i.id === `task-${dep.predecessor_id}`);
                                    const succ = items.find((i) => i.id === `task-${dep.successor_id}`);
                                    if (!pred || !succ) return null;

                                    const predLayout = getItemLayout(pred);
                                    const succLayout = getItemLayout(succ);

                                    // Find row indices for y positions
                                    const predRowIndex = items.findIndex((i) => i.id === pred.id);
                                    const succRowIndex = items.findIndex((i) => i.id === succ.id);
                                    if (predRowIndex === -1 || succRowIndex === -1) return null;

                                    const x1 = predLayout.barLeft + predLayout.barWidth + 4;
                                    const x2 = succLayout.barLeft - 2;

                                    const rowCenter = ROW_HEIGHT / 2;
                                    const ALIGNMENT_OFFSET = 12;

                                    const y1 = (predRowIndex * ROW_HEIGHT) + rowCenter + ALIGNMENT_OFFSET;
                                    const y2 = (succRowIndex * ROW_HEIGHT) + rowCenter + ALIGNMENT_OFFSET;

                                    const BUFFER = 12;

                                    let path = '';

                                    if (x2 < x1 + BUFFER) {
                                        // Backtrack case: Successor starts before Predecessor finishes
                                        const midY = (y1 + y2) / 2;
                                        path = `M ${x1} ${y1} ` +
                                            `L ${x1 + BUFFER} ${y1} ` +
                                            `L ${x1 + BUFFER} ${midY} ` +
                                            `L ${x2 - BUFFER} ${midY} ` +
                                            `L ${x2 - BUFFER} ${y2} ` +
                                            `L ${x2} ${y2}`;
                                    } else {
                                        // Forward case
                                        path = `M ${x1} ${y1} L ${x1 + BUFFER} ${y1} L ${x1 + BUFFER} ${y2} L ${x2} ${y2}`;
                                    }

                                    return (
                                        <g
                                            key={dep.id}
                                            onClick={(e) => { e.stopPropagation(); removeDependency(dep); }}
                                            onMouseEnter={() => (deleteDepHoverRef.current = true)}
                                            className="cursor-pointer"
                                        >
                                            <path
                                                d={path}
                                                fill="none"
                                                stroke="#6366f1"
                                                strokeWidth={1.5}
                                                strokeDasharray={dep.type === "finish_to_start" ? "none" : "4 3"}
                                                className="cursor-pointer pointer-events-auto"
                                            />
                                            {/* Arrowhead */}
                                            <polygon
                                                points={`${x2},${y2} ${x2 - 6},${y2 - 3} ${x2 - 6},${y2 + 3}`}
                                                fill="#6366f1"
                                            />
                                            <title>{`${dep.predecessor.title} → ${dep.successor.title} (${dep.type.replace(/_/g, " ")})`}</title>
                                        </g>
                                    );
                                })}
                            </svg>
                        </div>
                    )}
                </div>
            </TooltipProvider>

            {/* Dependency drag preview line */}
            {depPreview && depPreview.startX !== undefined && depPreview.startY !== undefined && (
                <div className="fixed inset-0 pointer-events-none z-50">
                    <svg className="w-full h-full overflow-visible">
                        {(() => {
                            const x1 = depPreview.startX;
                            const y1 = depPreview.startY;
                            const x2 = depPreview.x;
                            const y2 = depPreview.y;

                            const midX = (x1 + x2) / 2;
                            const previewPath = `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;

                            return (
                                <>
                                    <path
                                        d={previewPath}
                                        fill="none"
                                        stroke="#4f46e5"
                                        strokeWidth={2}
                                        strokeDasharray="4 4"
                                    />
                                    <circle
                                        cx={x2}
                                        cy={y2}
                                        r={5}
                                        fill="#4f46e5"
                                        stroke="white"
                                        strokeWidth={2}
                                    />
                                </>
                            );
                        })()}
                    </svg>
                </div>
            )}
<AddDependencyDialog
                open={addDepOpen}
                onOpenChange={setAddDepOpen}
                projectId={projectId}
                workItems={localWorkItems.map((w) => ({ id: w.id, title: w.title }))}
                onCreated={refreshDependencies}
            />

        </div>
    );
}
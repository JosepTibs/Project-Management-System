import React, { useMemo, useRef, useState, useCallback, useEffect } from "react";
import { router } from '@inertiajs/react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Link2, Link2Off, ChevronRight, ChevronDown } from 'lucide-react';

interface Subtask {
    id: number;
    title: string;
    description: string;
    due_date: string | null;
    completed_at: string | null;
}

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
    subtasks?: Subtask[];
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
    type: "task" | "milestone" | "group" | "subtask";
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
    x: number;
    y: number;
}

export default function InteractiveGanttChart({
    projectId,
    workItems,
    milestones,
    workItemGroups,
}: InteractiveGanttChartProps) {
    const [localWorkItems, setLocalWorkItems] = useState<WorkItem[]>(workItems);
    const [localMilestones, setLocalMilestones] = useState<Milestone[]>(milestones);
    const [localGroups, setLocalGroups] = useState<WorkItemGroup[]>(workItemGroups);
    const [dependencies, setDependencies] = useState<Dependency[]>([]);
    const [dragState, setDragState] = useState<DragState | null>(null);
    const [depPreview, setDepPreview] = useState<DependencyPreview | null>(null);
    const [showDependencies, setShowDependencies] = useState(true);
    const [collapsedMilestones, setCollapsedMilestones] = useState<Set<number>>(new Set());
    const [collapsedGroups, setCollapsedGroups] = useState<Set<number>>(new Set());
    const [collapsedTasks, setCollapsedTasks] = useState<Set<number>>(() => new Set(workItems.map((w) => w.id)));
    const containerRef = useRef<HTMLDivElement>(null);
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const deleteDepHoverRef = useRef(false);

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
            if(next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        })
    }
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
                progress: milestone.completed_at ? 100 : 0,
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

                        // Add subtasks only when this task is expanded
                        if (!collapsedTasks.has(task.id)) {
                            for (const subtask of task.subtasks || []) {
                                if (!subtask.due_date) continue;
                                const subEnd = new Date(subtask.due_date);
                                if (isNaN(subEnd.getTime())) continue;
                                const subStart = subtask.completed_at ? new Date(subtask.completed_at) : subEnd;

                                result.push({
                                    id: `subtask-${subtask.id}`,
                                    taskId: subtask.id,
                                    name: subtask.title,
                                    start: subStart,
                                    end: subEnd,
                                    type: "subtask",
                                    progress: subtask.completed_at ? 100 : 0,
                                    level: 3,
                                    description: subtask.description,
                                });
                            }
                        }
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

            if (!collapsedTasks.has(task.id)) {
                for (const subtask of task.subtasks || []) {
                    if (!subtask.due_date) continue;
                    const subEnd = new Date(subtask.due_date);
                    if (isNaN(subEnd.getTime())) continue;
                    const subStart = subtask.completed_at ? new Date(subtask.completed_at) : subEnd;

                    result.push({
                        id: `subtask-${subtask.id}`,
                        taskId: subtask.id,
                        name: subtask.title,
                        start: subStart,
                        end: subEnd,
                        type: "subtask",
                        progress: subtask.completed_at ? 100 : 0,
                        level: 2,
                        description: subtask.description,
                    });
                }
            }
        }

        return result;
    }, [localWorkItems, localMilestones, localGroups, collapsedMilestones, collapsedGroups, collapsedTasks]);

    const { earliest, totalDays, days, monthGroups, todayOffset } = useMemo(() => {
        if (!items.length) {
            return {
                earliest: new Date(),
                totalDays: 0,
                days: [] as Date[],
                monthGroups: [] as MonthGroup[],
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
                const offsetDays = Math.round(dragState.currentOffset / DAY_WIDTH);
                const previewStart = addDays(draggedItem.start, offsetDays);
                const previewEnd = addDays(draggedItem.end, offsetDays);
                allStartDates = [...allStartDates, previewStart.getTime()];
                allEndDates = [...allEndDates, previewEnd.getTime()];
            }
        }
        if (dragState?.mode === "resize-end" && dragState.itemId) {
            const draggedItem = items.find((i) => i.id === dragState.itemId);
            if (draggedItem) {
                const offsetDays = Math.round(dragState.currentOffset / DAY_WIDTH);
                const previewEnd = addDays(draggedItem.end, offsetDays);
                allEndDates = [...allEndDates, previewEnd.getTime()];
            }
        }
        if (dragState?.mode === "resize-start" && dragState.itemId) {
            const draggedItem = items.find((i) => i.id === dragState.itemId);
            if (draggedItem) {
                const offsetDays = Math.round(dragState.currentOffset / DAY_WIDTH);
                const previewStart = addDays(draggedItem.start, offsetDays);
                allStartDates = [...allStartDates, previewStart.getTime()];
            }
        }

        const earliest = new Date(Math.min(...allStartDates));
        const latest = new Date(Math.max(...allEndDates));
        const totalDays = differenceInDays(latest, earliest) + 1;
        const days = Array.from({ length: totalDays }, (_, i) => addDays(earliest, i));
        const monthGroups = groupDaysByMonth(days);

        const today = new Date();
        const todayOffset =
            today >= stripTime(earliest) && today <= stripTime(latest)
                ? differenceInDays(today, earliest)
                : -1;

        return { earliest, totalDays, days, monthGroups, todayOffset };
    }, [items, dragState]);

    // Get the displayed position/duration for an item considering drag state
    const getItemLayout = useCallback(
        (item: TimelineItem) => {
            let start = item.start;
            let end = item.end;

            if (dragState?.itemId === item.id) {
                const offsetDays = Math.round(dragState.currentOffset / DAY_WIDTH);
                if (dragState.mode === "move") {
                    start = addDays(item.start, offsetDays);
                    end = addDays(item.end, offsetDays);
                } else if (dragState.mode === "resize-end") {
                    end = addDays(item.end, offsetDays);
                } else if (dragState.mode === "resize-start") {
                    start = addDays(item.start, offsetDays);
                }
            }

            const startOffset = differenceInDays(start, earliest);
            const duration = Math.max(differenceInDays(end, start) + 1, 1);
            const barWidth = Math.max(duration * DAY_WIDTH - 4, DAY_WIDTH - 4);
            const barLeft = startOffset * DAY_WIDTH + 2 + (item.level * INDENT_WIDTH);

            return { start, end, startOffset, duration, barWidth, barLeft };
        },
        [dragState, earliest]
    );

    // Handle drag start on bars (tasks, groups, milestones)
    const handleDragStart = useCallback(
        (e: React.MouseEvent, item: TimelineItem, mode: DragMode) => {
            if (item.type !== "task" && item.type !== "group" && item.type !== "milestone" && item.type !== "subtask") return;
            e.preventDefault();
            e.stopPropagation();

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
            if (item.type !== "task") return;
            e.preventDefault();
            e.stopPropagation();

            setDepPreview({
                fromTaskId: item.id,
                toTaskId: null,
                x: e.clientX,
                y: e.clientY,
            });
        },
        []
    );

    // Handle mouse move for drag operations
    const handleGlobalMouseMove = useCallback(
        (e: MouseEvent) => {
            // Handle dependency preview
            if (depPreview) {
                const container = containerRef.current;
                if (container) {
                    const rect = container.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    setDepPreview((prev) => (prev ? { ...prev, x, y } : prev));
                }
                return;
            }

            // Handle move/resize drag
            if (dragState?.mode && (dragState.mode === "move" || dragState.mode === "resize-start" || dragState.mode === "resize-end")) {
                const offset = e.clientX - dragState.startX;
                setDragState((prev) => (prev ? { ...prev, currentOffset: offset } : prev));
            }
        },
        [dragState, depPreview]
    );

    // Handle mouse up for drag operations
    const handleGlobalMouseUp = useCallback(() => {
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
            const offsetDays = Math.round(dragState.currentOffset / DAY_WIDTH);
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
                const newStart = addDays(item.start, offsetDays);
                const newEnd = addDays(item.end, offsetDays);

                if (item.type === "task" && item.taskId) {
                    // Optimistic update for tasks
                    setLocalWorkItems((prev) =>
                        prev.map((wi) =>
                            wi.id === item.taskId
                                ? {
                                      ...wi,
                                      start_date: newStart.toISOString().slice(0, 10),
                                      due_date: newEnd.toISOString().slice(0, 10),
                                  }
                                : wi
                        )
                    );

                    // Debounced save
                    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
                    saveTimerRef.current = setTimeout(() => {
                        router.patch(
                            `/projects/${projectId}/work-items/${item.taskId}/move`,
                            { start_date: newStart.toISOString().slice(0, 10) },
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
                        { ...g, 
                        start_date: newStart.toISOString().slice(0,10),
                        end_date: newEnd.toISOString().slice(0,10),  } : g
                    ));

                    if(saveTimerRef.current) clearTimeout(saveTimerRef.current);
                    saveTimerRef.current = setTimeout(() =>{
                        router.patch(
                            `/projects/${projectId}/groups/${groupId}/move`,
                            {
                                start_date: newStart.toISOString().slice(0,10),
                                end_date: newEnd.toISOString().slice(0,10),                           
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
                        { ...m, 
                        target_date: newStart.toISOString().slice(0,10),
                        } : m
                    ));
                    if(saveTimerRef.current) clearTimeout(saveTimerRef.current);
                    saveTimerRef.current = setTimeout(() => {
                        router.patch(
                            `/projects/${projectId}/milestones/${milestoneId}/move`,
                            {
                                target_date: newStart.toISOString().slice(0,10),
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
                    setLocalWorkItems((prev) =>
                        prev.map((wi) =>
                            wi.id === item.taskId
                                ? { ...wi, due_date: newEnd.toISOString().slice(0, 10) }
                                : wi
                        )
                    );

                    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
                    saveTimerRef.current = setTimeout(() => {
                        router.patch(
                            `/projects/${projectId}/work-items/${item.taskId}/resize`,
                            {
                                start_date: item.start.toISOString().slice(0, 10),
                                due_date: newEnd.toISOString().slice(0, 10),
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
                    setLocalWorkItems((prev) =>
                        prev.map((wi) =>
                            wi.id === item.taskId
                                ? { ...wi, start_date: newStart.toISOString().slice(0, 10) }
                                : wi
                        )
                    );

                    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
                    saveTimerRef.current = setTimeout(() => {
                        router.patch(
                            `/projects/${projectId}/work-items/${item.taskId}/resize`,
                            {
                                start_date: newStart.toISOString().slice(0, 10),
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
    }, [dragState, depPreview, items, projectId, workItems]);

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
        <div className="w-full max-w-full min-w-0 max-h-screen rounded-lg border bg-background overflow-x-auto overflow-y-auto" ref={containerRef}>
            <TooltipProvider delayDuration={300}>
                <div
                    className="grid"
                    style={{
                        position: 'relative',
                        width: NAME_WIDTH + totalDays * DAY_WIDTH,
                        minWidth: NAME_WIDTH + totalDays * DAY_WIDTH,
                        gridTemplateColumns: `${NAME_WIDTH}px ${totalDays * DAY_WIDTH}px`,
                    }}
                >
                    {/* ── Header: Task label ── */}
                    <div className="sticky left-0 z-50 border-b bg-background p-3 font-semibold text-sm flex items-center gap-2">
                        Task
                        <button
                            onClick={() => setShowDependencies(!showDependencies)}
                            title={showDependencies ? "Hide dependencies" : "Show dependencies"}
                            className="inline-flex items-center justify-center h-6 w-6 rounded border border-input bg-background hover:bg-accent text-muted-foreground"
                        >
                            {showDependencies ? <Link2 className="h-3.5 w-3.5 text-blue-600" /> : <Link2Off className="h-3.5 w-3.5" />}
                        </button>
                    </div>

                    {/* ── Header: Month groups + day numbers ── */}
                    <div className="border-b bg-muted/40 min-w-0">
                        {/* Month labels row */}
                        <div className="flex min-w-0">
                            {monthGroups.map((group) => (
                                <div
                                    key={group.label}
                                    className="flex items-center justify-center border-l py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                                    style={{ width: group.days.length * DAY_WIDTH }}
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
                                        isWeekend(day) ? "bg-muted/30 text-muted-foreground/50" : "text-muted-foreground"
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
                        const layout = getItemLayout(item);
                        const isEvenRow = index % 2 === 0;
                        const isDragging = dragState?.itemId === item.id;

                        return (
                            <React.Fragment key={item.id}>
                                {/* Sidebar cell */}
                                <div
                                    className={`sticky left-0 z-50 flex items-center border-b px-3 transition-colors bg-background`}
                                    style={{ height: ROW_HEIGHT, paddingLeft: 12 + item.level * 20 }}
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            {/* Collapse/Expand toggle for milestones and groups */}
                                            {(item.type === "milestone" || item.type === "group" || item.type === "task") && (
                                                <button
                                                    onClick={() => {
                                                        if (item.type === "milestone") {
                                                            toggleMilestone(parseInt(item.id.replace('milestone-', '')));
                                                        } else if  (item.type === "group") {
                                                            toggleGroup(parseInt(item.id.replace('group-', '')));
                                                        } else if (item.type === "task"){
                                                            toggleTask(parseInt(item.id.replace('task-', '')));
                                                        }
                                                    }}
                                                    className="inline-flex items-center justify-center h-4 w-4 hover:bg-muted rounded shrink-0"
                                                >
                                                    {item.collapsed ? (
                                                        <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                                    ) : (
                                                        <ChevronDown className="h-3 w-3 text-muted-foreground" />
                                                    )}
                                                </button>
                                            )}
                                            {item.type === "task" && (
                                                <span className="inline-block w-4 shrink-0" />
                                            )}
                                            {item.type === "subtask" && (
                                                <span className="inline-block w-6 shrink-0" />
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
                                                {item.type === "milestone" ? "Milestone" : item.type === "group" ? "Group" : item.type === "task" ?"Task" : "Subtask"}
                                            </span>
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-0.5 truncate">
                                            {item.type === "milestone"
                                                ? `Due: ${formatDateShort(item.end)}`
                                                : formatDateRange(layout.start, layout.end)}
                                            <div className="text-xs text-muted-foreground mt-0.5 truncate">
                                            </div>
                                            
                                        </div>
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

                                    {/* Today indicator */}
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
                                                    left: Math.max(20, Math.min(todayOffset * DAY_WIDTH, totalDays * DAY_WIDTH - 20)),
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
                                                    className="absolute top-1/2 -translate-y-1/2"
                                                    style={{ left: layout.barLeft, width: layout.barWidth }}
                                                    onMouseDown={(e) => handleDragStart(e, item, "move")}
                                                >
                                                    {item.type === "task" ? (
                                                        <>
                                                        <span className="relative z-10 flex items-center h-full px-2 text-[11px] font-semibold text-white whitespace-nowrap pointer-events-none">
                                                                   {item.assignee?.name} | Progress:  {item.progress > 0 ? `${item.progress}%` : ""}
                                                                </span>
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
                                                                className="absolute left-1.5 top-0 bottom-0 w-3.5 cursor-ew-resize hover:bg-white/40 rounded-l-md z-30"
                                                                onMouseDown={(e) => handleDragStart(e, item, "resize-start")}
                                                            />
                                                            <div
                                                                className="absolute right-1.5 top-0 bottom-0 w-3.5 cursor-ew-resize hover:bg-white/40 rounded-r-md z-30"
                                                                onMouseDown={(e) => handleDragStart(e, item, "resize-end")}
                                                            />

                                                            {/* Dependency connection handle */}
                                                            <div
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
                                                            onMouseDown={(e) => handleDragStart(e, item, "resize-start")}/>
                                                            <div
                                                            className="absolute left-1 top-0 bottom-0 w-2.5 cursor-ew-resize hover:bg-white/40 rounded-1-md z-30 "
                                                            onMouseDown={(e) => handleDragStart(e, item, "resize-end")}/>
                                                                 
                                                            
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
                                left: NAME_WIDTH,
                                width: totalDays * DAY_WIDTH,
                                height: items.length * ROW_HEIGHT,
                                top: 48,
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

                                    // --- UPDATE THIS VERTICAL CALCULATION BLOCK ---
                                    // 1. Base middle line of the row
                                    const rowCenter = ROW_HEIGHT / 2; 

                                    // 2. Adjust this number to shift the lines down. 
                                    // Try 6 or 8 pixels to compensate for the text label pushing the bar down.
                                    const ALIGNMENT_OFFSET = 12; 

                                    const y1 = (predRowIndex * ROW_HEIGHT) + rowCenter + ALIGNMENT_OFFSET;
                                    const y2 = (succRowIndex * ROW_HEIGHT) + rowCenter + ALIGNMENT_OFFSET;
                                    // ----------------------------------------------

                                    const BUFFER = 12; 
                                   
                                    let path = '';
                                                                    
                                    if (x2 < x1 + BUFFER) {
                                        // Backtrack case: Successor starts before Predecessor finishes
                                        // Route cleanly within the whitespace buffer between rows
                                        const midY = (y1 + y2) / 2;
                                        path = `M ${x1} ${y1} ` +
                                               `L ${x1 + BUFFER} ${y1} ` +
                                               `L ${x1 + BUFFER} ${midY} ` +
                                               `L ${x2 - BUFFER} ${midY} ` +
                                               `L ${x2 - BUFFER} ${y2} ` +
                                               `L ${x2} ${y2}`;
                                    } else {
                                        // Forward case: Drops right down after clearing the Predecessor bar body
                                        path = `M ${x1} ${y1} L ${x1 + BUFFER} ${y1} L ${x1 + BUFFER} ${y2} L ${x2} ${y2}`;
                                    }


                                    return (
                                        <g
                                            key={dep.id}
                                            onClick={(e) => { e.stopPropagation(); removeDependency(dep); }}
                                            onMouseEnter={() => (deleteDepHoverRef.current = true)} // optional
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
            {depPreview && (
                <div
                    className="fixed pointer-events-none z-50"
                    style={{ left: depPreview.x, top: depPreview.y }}
                >
                    <div className="w-3 h-3 -ml-1.5 -mt-1.5 rounded-full bg-indigo-600 border-2 border-white shadow-md" />
                </div>
            )}
        </div>
    );
}

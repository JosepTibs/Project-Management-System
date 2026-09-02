import FileAttachmentList from '@/components/attachments/file-attachment-list';
import CalendarView from '@/components/calendar-view';
import InteractiveGanttChart from '@/components/interactive-gantt-chart';
import KanbanBoard from '@/components/kanban/kanban-board';
import ProjectSetupSheet from '@/components/projects/project-setup-sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    BarChart3,
    Calendar,
    ChevronDown,
    ChevronUp,
    Columns3,
    FileSpreadsheet,
    FileText,
    Paperclip,
    Settings,
    Target,
    Users,
} from 'lucide-react';
import { useState } from 'react';

function getPriorityVariant(priority: string) {
    switch (priority) {
        case 'critical':
            return 'destructive' as const;
        case 'high':
            return 'default' as const;
        case 'medium':
            return 'secondary' as const;
        default:
            return 'outline' as const;
    }
}

export default function ShowProject() {
    const { project, setup, columns, statuses, workItems, attachments } = usePage<any>().props;
    const [editOpen, setEditOpen] = useState(false);

    // Active tab is persisted in the URL (?tab=kanban ...) so a browser
    // refresh or shared link restores the view instead of defaulting to
    // Overview. Invalid/missing values fall back to overview.
    type TabValue = 'overview' | 'kanban' | 'gantt' | 'calendar' | 'documents';
    const TAB_VALUES: TabValue[] = ['overview', 'kanban', 'gantt', 'calendar', 'documents'];
    const [currentTab, setCurrentTab] = useState<TabValue>(() => {
        const tab = new URLSearchParams(window.location.search).get('tab') as TabValue | null;
        return tab && TAB_VALUES.includes(tab) ? tab : 'overview';
    });

    const handleTabChange = (value: string) => {
        setCurrentTab(value as TabValue);
        const url = new URL(window.location.href);
        if (value === 'overview') {
            url.searchParams.delete('tab');
        } else {
            url.searchParams.set('tab', value);
        }
        window.history.replaceState({}, '', url.toString());
    };

    // Role tiers: admins manage every project; managers only projects they
    // own; members are view-only.
    const userRoles: string[] = usePage<any>().props.auth?.roles ?? [];
    const authUserId = usePage<any>().props.auth?.user?.id;
    const isAdmin = userRoles.some((r) => ['admin', 'superadmin'].includes(r.toLowerCase()));
    const isManager = !isAdmin && userRoles.some((r) => r.toLowerCase().includes('manager'));
    const projectCreatedBy = Number(usePage<any>().props.project?.created_by ?? null);
    const canManageProject = isAdmin || (isManager && projectCreatedBy === Number(authUserId));
    const isMember = !canManageProject;

    // Member scope toggle: view the whole project or only their own tasks.
    // Persisted in the URL so refreshes/back-navigation restore the view.
    const [scope, setScope] = useState<'all' | 'mine'>(() => {
        const s = new URLSearchParams(window.location.search).get('scope');
        return s === 'mine' ? 'mine' : 'all';
    });

    // Scope changes update both state and the URL (?scope=mine; omitted for
    // 'all' to keep default URLs clean).
    const setScopeParam = (next: 'all' | 'mine') => {
        setScope(next);
        const url = new URL(window.location.href);
        if (next === 'all') {
            url.searchParams.delete('scope');
        } else {
            url.searchParams.set('scope', next);
        }
        window.history.replaceState({}, '', url.toString());
    };
    // Explicit collapse state for overview sections (true = expanded/open).
    const [openGroups, setOpenGroups] = useState<Record<number, boolean>>({});
    const [openMilestones, setOpenMilestones] = useState<Record<number, boolean>>({});

    const isMyItem = (item: any) => item.assignee?.id === authUserId || (item.collaborator_ids ?? []).includes(authUserId);

    const allWorkItems = workItems || [];
    const visibleWorkItems = scope === 'mine' ? allWorkItems.filter(isMyItem) : allWorkItems;
    const visibleItemIds = new Set(visibleWorkItems.map((i: any) => i.id));
    // Overview lists read from project.work_items — apply scope + overrides there too.
    const visibleProjectItems = project.work_items
        .filter((i: any) => scope === 'all' || visibleItemIds.has(i.id))
        .map((i: any) => {
            const src = allWorkItems.find((w: any) => w.id === i.id);
            return { ...i, collaborator_ids: src?.collaborator_ids ?? [], progress: src?.progress ?? i.progress };
        });

    // In "My Tasks" scope only show milestones/groups that actually contain
    // one of the member's items — no empty shells.
    const visibleGroups =
        scope === 'mine'
            ? (project.work_item_groups || []).filter((g: any) => visibleProjectItems.some((i: any) => i.group_id === g.id))
            : project.work_item_groups || [];
    const visibleMilestones =
        scope === 'mine'
            ? (project.milestones || []).filter(
                  (m: any) =>
                      visibleGroups.some((g: any) => g.milestone_id === m.id) ||
                      visibleProjectItems.some((i: any) => i.milestone_id === m.id && !i.group_id),
              )
            : project.milestones || [];

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Projects', href: '/projects' },
        { title: project.name, href: `/projects/${project.id}` },
    ];

    const totalItems = project.work_items.length;
    const progressPercent = Math.min(100, Math.round(project.completion_percentage || 0));

    // A single work-item group card (collapsible list of its work items).
    // Rendered nested inside its parent milestone in the overview.
    const renderGroupCard = (group: any) => {
        const groupItems = visibleProjectItems.filter((i: any) => i.group_id === group.id);
        const isOpen = openGroups[group.id] ?? true;

        return (
            <Collapsible
                key={group.id}
                defaultOpen
                className="bg-card rounded-md border"
                open={isOpen}
                onOpenChange={(open) => setOpenGroups((prev) => ({ ...prev, [group.id]: open }))}
            >
                <CollapsibleTrigger asChild>
                    <div className="hover:bg-muted/50 flex cursor-pointer items-center justify-between px-4 py-2.5 transition-colors select-none">
                        <div className="flex items-center gap-2">
                            {(openGroups[group.id] ?? true) ? (
                                <ChevronUp className="text-muted-foreground h-4 w-4" />
                            ) : (
                                <ChevronDown className="text-muted-foreground h-4 w-4" />
                            )}
                            <span className="text-sm font-medium">{group.name}</span>
                            <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                                {groupItems.length}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-3">
                            {typeof group.progress === 'number' && (groupItems.length === 0 || Number(group.progress) > 0) && (
                                <span className="text-muted-foreground flex items-center gap-1 text-xs">
                                    <BarChart3 className="h-3 w-3" /> {Math.round(group.completion_percentage ?? group.progress ?? 0)}%
                                </span>
                            )}
                            {group.assignees?.length > 0 && (
                                <span className="text-muted-foreground flex items-center gap-1 text-xs">
                                    <Users className="h-3 w-3" /> {group.assignees.length}
                                </span>
                            )}
                            {group.end_date && (
                                <span className="text-muted-foreground flex items-center gap-1 text-xs">
                                    <Calendar className="h-3 w-3" /> Due {group.end_date}
                                </span>
                            )}
                        </div>
                    </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    {groupItems.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/20 hover:bg-muted/20">
                                    <TableHead>Title</TableHead>
                                    <TableHead>Priority</TableHead>
                                    <TableHead>Assignee</TableHead>
                                    <TableHead>Progress</TableHead>
                                    <TableHead className="text-right">Due Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {groupItems.map((item: any) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="text-sm font-medium">
                                            <Link href={`/projects/${project.id}/work-items/${item.id}`} className="hover:underline">
                                                {item.title}
                                            </Link>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={getPriorityVariant(item.priority)} className="text-[10px] capitalize">
                                                {item.priority}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className="text-[10px] capitalize">
                                                {item.assignee?.name ? item.assignee.name : 'Unassigned'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="bg-secondary h-1.5 w-16 overflow-hidden rounded-full">
                                                    <div
                                                        className="bg-primary h-1.5 rounded-full transition-all"
                                                        style={{ width: `${Math.min(100, item.progress ?? 0)}%` }}
                                                    />
                                                </div>
                                                <span className="text-muted-foreground text-[10px] tabular-nums">
                                                    {Math.min(100, item.progress ?? 0)}%
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-right text-xs">{item.due_date || '—'}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="text-muted-foreground px-4 py-3 text-sm">
                            No work items — team members have been assigned directly to this group.
                        </div>
                    )}
                </CollapsibleContent>
            </Collapsible>
        );
    };

    // Table of work items not attached to any group (milestone-level
    // "ungrouped" items). Reuses the same row markup as group tables.
    const renderUngroupedItemsTable = (items: any[]) => {
        if (items.length === 0) return null;
        return (
            <Table>
                <TableHeader>
                    <TableRow className="bg-muted/20 hover:bg-muted/20">
                        <TableHead>Title</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Assignee</TableHead>
                        <TableHead>Progress</TableHead>
                        <TableHead className="text-right">Due Date</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {items.map((item: any) => (
                        <TableRow key={item.id}>
                            <TableCell className="text-sm font-medium">
                                <Link href={`/projects/${project.id}/work-items/${item.id}`} className="hover:underline">
                                    {item.title}
                                </Link>
                            </TableCell>
                            <TableCell>
                                <Badge variant={getPriorityVariant(item.priority)} className="text-[10px] capitalize">
                                    {item.priority}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <Badge className="text-[10px] capitalize">{item.assignee?.name ? item.assignee.name : 'Unassigned'}</Badge>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <div className="bg-secondary h-1.5 w-16 overflow-hidden rounded-full">
                                        <div
                                            className="bg-primary h-1.5 rounded-full transition-all"
                                            style={{ width: `${Math.min(100, item.progress ?? 0)}%` }}
                                        />
                                    </div>
                                    <span className="text-muted-foreground text-[10px] tabular-nums">{Math.min(100, item.progress ?? 0)}%</span>
                                </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-right text-xs">{item.due_date || '—'}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={project.name} />

            <div className="mx-auto flex h-full w-full max-w-7xl min-w-0 flex-1 flex-col gap-6 p-6">
                {/* Header Section */}
                <div className="flex flex-col gap-4 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={() => window.history.back()} className="h-8 w-8">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="bg-muted text-muted-foreground rounded px-2 py-0.5 font-mono text-xs uppercase">
                                    {project.item_prefix}
                                </span>
                                <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
                                {project.status_name && (
                                    <Badge variant="outline" className="ml-2">
                                        {project.status_name}
                                    </Badge>
                                )}
                            </div>
                            <p className="text-muted-foreground mt-1 text-xs">Created by {project.creator_name || 'Unknown'}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <a href={`/projects/${project.id}/export/gantt`} download>
                            <Button variant="outline" size="sm" title="Download this project's Gantt as Excel">
                                <FileSpreadsheet className="mr-2 h-4 w-4" />
                                Export Gantt
                            </Button>
                        </a>
                        {canManageProject && (
                            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                                <Settings className="mr-2 h-4 w-4" />
                                Setup
                            </Button>
                        )}
                    </div>
                </div>

                {/* Tabbed View Navigation — active tab persisted in the URL
            (?tab=kanban etc.) so reloads don't snap back to Overview. */}
                <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
                    <div className="flex items-center justify-between border-b pb-2">
                        <TabsList className="gap-2 bg-transparent p-0">
                            <TabsTrigger value="overview" className="data-[state=active]:bg-muted">
                                Overview
                            </TabsTrigger>
                            <TabsTrigger value="kanban" className="data-[state=active]:bg-muted">
                                <Columns3 className="mr-1.5 h-3.5 w-3.5" /> Kanban
                            </TabsTrigger>
                            <TabsTrigger value="gantt" className="data-[state=active]:bg-muted">
                                <BarChart3 className="mr-1.5 h-3.5 w-3.5" /> Gantt
                            </TabsTrigger>
                            <TabsTrigger value="calendar" className="data-[state=active]:bg-muted">
                                <Calendar className="mr-1.5 h-3.5 w-3.5" /> Calendar
                            </TabsTrigger>
                            <TabsTrigger value="documents" className="data-[state=active]:bg-muted">
                                <Paperclip className="mr-1.5 h-3.5 w-3.5" /> Documents
                            </TabsTrigger>
                        </TabsList>

                        <div className="flex items-center gap-2">
                            {isMember && (
                                <div className="flex items-center rounded-md border p-0.5">
                                    <Button
                                        variant={scope === 'all' ? 'secondary' : 'ghost'}
                                        size="sm"
                                        className="h-7 px-2 text-xs"
                                        onClick={() => setScopeParam('all')}
                                    >
                                        Whole Project
                                    </Button>
                                    <Button
                                        variant={scope === 'mine' ? 'secondary' : 'ghost'}
                                        size="sm"
                                        className="h-7 px-2 text-xs"
                                        onClick={() => setScopeParam('mine')}
                                    >
                                        My Tasks
                                    </Button>
                                </div>
                            )}
                            <Link href={`/projects/${project.id}/work-items`}>
                                <Button variant="ghost" size="sm" className="h-8 text-xs">
                                    All Items
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Overview View */}
                    <TabsContent value="overview" className="pt-4">
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                            {/* Left/Main Column (2 cols) */}
                            <div className="space-y-6 lg:col-span-2">
                                {/* Milestones - each milestone nests its work item groups */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-muted-foreground flex items-center gap-2 text-sm font-semibold tracking-wider uppercase">
                                            <Target className="h-4 w-4" /> Milestones ({visibleMilestones.length})
                                        </h3>
                                        <span className="text-muted-foreground text-xs">
                                            {scope === 'mine' ? `${visibleProjectItems.length} My Items` : `${totalItems} Total Items`}
                                        </span>
                                    </div>

                                    {visibleMilestones.map((m: any) => {
                                        const milestoneGroups = visibleGroups.filter((g: any) => g.milestone_id === m.id);
                                        // Work items attached directly to this milestone (no group).
                                        const milestoneUngroupedItems = visibleProjectItems.filter(
                                            (i: any) => i.milestone_id === m.id && !i.group_id,
                                        );
                                        const milestoneItemsCount =
                                            milestoneGroups.reduce(
                                                (sum: number, g: any) => sum + visibleProjectItems.filter((i: any) => i.group_id === g.id).length,
                                                0,
                                            ) + milestoneUngroupedItems.length;
                                        const isOpen = openMilestones[m.id] ?? true;

                                        return (
                                            <Collapsible
                                                key={m.id}
                                                defaultOpen
                                                className="bg-card overflow-hidden rounded-lg border"
                                                open={isOpen}
                                                onOpenChange={(open) => setOpenMilestones((prev) => ({ ...prev, [m.id]: open }))}
                                            >
                                                <CollapsibleTrigger asChild>
                                                    <div className="hover:bg-muted/50 bg-muted/30 flex cursor-pointer flex-col justify-between gap-2 px-4 py-3 transition-colors select-none sm:flex-row sm:items-center">
                                                        <div className="flex items-center gap-2">
                                                            {isOpen ? (
                                                                <ChevronUp className="text-muted-foreground h-4 w-4" />
                                                            ) : (
                                                                <ChevronDown className="text-muted-foreground h-4 w-4" />
                                                            )}
                                                            <span className="text-sm font-medium">{m.name}</span>
                                                            <Badge variant={m.completed_at ? 'default' : 'outline'} className="text-[10px]">
                                                                {m.completed_at ? 'Done' : 'Active'}
                                                            </Badge>
                                                            <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                                                                {milestoneItemsCount}
                                                            </Badge>
                                                        </div>
                                                        <div className="flex shrink-0 items-center gap-4">
                                                            <span className="text-muted-foreground hidden text-xs md:inline">
                                                                {m.start_date} {'\u2192'} {m.target_date}
                                                            </span>
                                                            <div className="flex items-center gap-2">
                                                                <div className="bg-secondary h-1.5 w-20 overflow-hidden rounded-full">
                                                                    <div
                                                                        className="bg-primary h-1.5 rounded-full transition-all"
                                                                        style={{ width: `${Math.min(100, m.completion_percentage ?? 0)}%` }}
                                                                    />
                                                                </div>
                                                                <span className="text-muted-foreground text-[10px] tabular-nums">
                                                                    {Math.min(100, Math.round(m.completion_percentage ?? 0))}%
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </CollapsibleTrigger>
                                                <CollapsibleContent>
                                                    {m.description && (
                                                        <p className="text-muted-foreground line-clamp-1 px-4 pt-2 text-xs">{m.description}</p>
                                                    )}
                                                    <div className="space-y-2 p-3">
                                                        {milestoneGroups.length > 0 || milestoneUngroupedItems.length > 0 ? (
                                                            <>
                                                                {milestoneGroups.map(renderGroupCard)}
                                                                {milestoneUngroupedItems.length > 0 && (
                                                                    <div className="border-primary/40 bg-primary/[0.025] rounded-md border border-dashed">
                                                                        <div className="flex items-center gap-2 px-3 py-2">
                                                                            <FileText className="text-primary h-3.5 w-3.5" />
                                                                            <span className="text-xs font-medium">Ungrouped tasks</span>
                                                                            <Badge
                                                                                variant="outline"
                                                                                className="border-primary/40 text-primary h-4 px-1.5 text-[10px]"
                                                                            >
                                                                                {milestoneUngroupedItems.length}
                                                                            </Badge>
                                                                        </div>
                                                                        <div className="border-t">
                                                                            {renderUngroupedItemsTable(milestoneUngroupedItems)}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <p className="text-muted-foreground px-1 py-2 text-sm">
                                                                No work item groups in this milestone.
                                                            </p>
                                                        )}
                                                    </div>
                                                </CollapsibleContent>
                                            </Collapsible>
                                        );
                                    })}

                                    {/* Groups not attached to any milestone */}
                                    {(() => {
                                        const looseGroups = visibleGroups.filter((g: any) => !g.milestone_id);
                                        if (looseGroups.length === 0) return null;
                                        return (
                                            <div className="space-y-2 pt-3">
                                                <h4 className="text-muted-foreground flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase">
                                                    <FileText className="h-3 w-3" /> Groups without Milestone ({looseGroups.length})
                                                </h4>
                                                <div className="space-y-2">{looseGroups.map(renderGroupCard)}</div>
                                            </div>
                                        );
                                    })()}

                                    {/* Work items not attached to any group or milestone */}
                                    {(() => {
                                        const looseItems = visibleProjectItems.filter((i: any) => !i.group_id && !i.milestone_id);
                                        if (looseItems.length === 0) return null;
                                        return (
                                            <div className="space-y-2 pt-3">
                                                <h4 className="text-muted-foreground flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase">
                                                    <FileText className="h-3 w-3" /> Tasks without Milestone ({looseItems.length})
                                                </h4>
                                                <div className="border-primary/40 bg-primary/[0.025] rounded-md border border-dashed">
                                                    <div className="border-t">{renderUngroupedItemsTable(looseItems)}</div>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>

                            {/* Sidebar (1 col) */}
                            <div className="space-y-6">
                                {/* Progress Overview */}
                                <div className="bg-card space-y-3 rounded-lg border p-4">
                                    <h4 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">Project Health</h4>
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-muted-foreground">Overall Progress</span>
                                            <span className="font-semibold">{progressPercent}%</span>
                                        </div>
                                        <div className="bg-secondary h-2 w-full rounded-full">
                                            <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${progressPercent}%` }} />
                                        </div>
                                    </div>
                                    {project.description && <p className="text-muted-foreground mt-2 border-t pt-2 text-xs">{project.description}</p>}
                                </div>

                                {/* Team Members List */}
                                <div className="bg-card space-y-3 rounded-lg border p-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-muted-foreground flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase">
                                            <Users className="h-3.5 w-3.5" /> Team ({project.members.length})
                                        </h4>
                                    </div>
                                    <div className="divide-border divide-y">
                                        {project.members.map((member: any) => (
                                            <div key={member.id} className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
                                                <div className="flex items-center gap-2.5">
                                                    <Avatar className="h-7 w-7">
                                                        <AvatarFallback className="text-[10px] uppercase">
                                                            {member.user_name?.substring(0, 2)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex flex-col">
                                                        <Link href={`/users/${member.user_id}`} className="text-xs font-medium hover:underline">
                                                            {member.user_name}
                                                        </Link>
                                                        <span className="text-muted-foreground max-w-[140px] truncate text-[10px]">
                                                            {member.user_email}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Kanban Tab */}
                    <TabsContent value="kanban" className="pt-4">
                        <div className="bg-card h-full rounded-lg border p-4">
                            <KanbanBoard
                                columns={columns.map((c: any) =>
                                    scope === 'mine' ? { ...c, items: (c.items || []).filter((it: any) => visibleItemIds.has(it.id)) } : c,
                                )}
                                statuses={statuses}
                                authUserId={authUserId}
                                canManage={canManageProject}
                            />
                        </div>
                    </TabsContent>

                    {/* Gantt Tab */}
                    <TabsContent value="gantt" className="pt-4">
                        <div className="bg-card rounded-lg border p-4">
                            <InteractiveGanttChart
                                projectId={project.id}
                                workItems={visibleWorkItems}
                                milestones={project.milestones || []}
                                workItemGroups={(project.work_item_groups || []).map((g: any) => ({
                                    ...g,
                                    completion_percentage: g.completion_percentage || 0,
                                }))}
                                readOnly={!canManageProject}
                            />
                        </div>
                    </TabsContent>

                    {/* Calendar Tab */}
                    <TabsContent value="calendar" className="pt-4">
                        <div className="bg-card rounded-lg border p-4">
                            <CalendarView
                                workItems={visibleWorkItems.map((i: any) => ({
                                    ...i,
                                    due_date: i.due_date,
                                    progress: i.progress ?? 0,
                                }))}
                                milestones={project.milestones || []}
                            />
                        </div>
                    </TabsContent>

                    {/* Documents Tab */}
                    <TabsContent value="documents" className="pt-4">
                        {attachments && attachments.length > 0 ? (
                            <div className="space-y-4">
                                {/* Group attachments by work item */}
                                {Object.entries(
                                    attachments.reduce((acc: Record<string, any>, attachment: any) => {
                                        const key = String(attachment.work_item_id);
                                        if (!acc[key]) {
                                            acc[key] = {
                                                workItemId: attachment.work_item_id,
                                                workItemTitle: attachment.work_item_title,
                                                attachments: [],
                                            };
                                        }
                                        acc[key].attachments.push(attachment);
                                        return acc;
                                    }, {}),
                                ).map(([key, group]: [string, any]) => (
                                    <Card key={key}>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2 text-base">
                                                <FileText className="h-4 w-4" />
                                                <Link
                                                    href={`/projects/${project.id}/work-items/${group.workItemId}`}
                                                    className="text-primary hover:underline"
                                                >
                                                    {group.workItemTitle || `Work Item #${group.workItemId}`}
                                                </Link>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <FileAttachmentList attachments={group.attachments} authUserId={usePage<any>().props.auth?.user?.id} />
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <Paperclip className="h-4 w-4" />
                                        Project Documents
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground text-sm">No documents attached to this project.</p>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>
                </Tabs>

                {/* Setup Modal/Sheet */}
                {setup && (
                    <ProjectSetupSheet
                        open={editOpen}
                        onOpenChange={setEditOpen}
                        mode="edit"
                        project={{
                            name: project.name,
                            description: project.description,
                            item_prefix: project.item_prefix,
                            start_date: project.start_date,
                            end_date: project.end_date,
                        }}
                        statusName={project.status_name ?? ''}
                        statuses={setup.statuses}
                        allUsers={setup.allUsers}
                        workItemStatuses={setup.workItemStatuses}
                        initialMemberIds={setup.memberIds}
                        initialMilestones={setup.milestones}
                        onSuccess={() => setEditOpen(false)}
                    />
                )}
            </div>
        </AppLayout>
    );
}

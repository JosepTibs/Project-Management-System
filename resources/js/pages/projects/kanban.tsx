import { Head, Link, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import KanbanBoard from '@/components/kanban/kanban-board';
import InteractiveGanttChart from '@/components/interactive-gantt-chart';
import CalendarView from '@/components/calendar-view';
import ViewSelector from '@/components/view-selector';

interface KanbanCardData {
    id: number;
    title: string;
    priority: string;
    assignee_name: string | null;
    due_date: string | null;
    group_name: string | null;
}

interface KanbanColumnData {
    status: string;
    items: KanbanCardData[];
}

interface StatusData {
    id: number;
    name: string;
    color: string;
}

interface KanbanPageProps extends Record<string, unknown> {
    project: {
        id: number;
        name: string;
        created_by?: number;
    };
    columns: KanbanColumnData[];
    statuses: StatusData[];
    workItems?: any[];
    milestones?: any[];
    workItemGroups?: any[];
}

export default function Kanban() {
    const { project, columns, statuses, workItems, milestones, workItemGroups } = usePage<KanbanPageProps>().props;
    const userRoles: string[] = (usePage<any>().props.auth?.roles ?? []) as string[];
    const authUserId = (usePage<any>().props.auth?.user?.id ?? null) as number | null;
    const isAdmin = userRoles.some((r) => ['admin', 'superadmin'].includes(r.toLowerCase()));
    const isManager = !isAdmin && userRoles.some((r) => r.toLowerCase().includes('manager'));
    const projectCreatedBy = Number(usePage<any>().props.project?.created_by ?? null);
    const canManageProject = isAdmin || (isManager && projectCreatedBy === Number(authUserId));
    const params = new URLSearchParams(window.location.search);
    const initialView = (params.get('view') as 'kanban' | 'gantt' | 'calendar') || 'kanban';
    const [currentView, setCurrentView] = useState<'kanban' | 'gantt' | 'calendar'>(initialView);
    // Update URL when view changes
    const handleViewChange = (view: 'kanban' | 'gantt' | 'calendar') => {
        setCurrentView(view);
        const url = new URL(window.location.href);
        url.searchParams.set('view', view);
        window.history.replaceState({}, '', url.toString());
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Projects', href: '/projects' },
        { title: project.name, href: `/projects/${project.id}` },
        { title: currentView.charAt(0).toUpperCase() + currentView.slice(1), href: `/projects/${project.id}/kanban` },
    ];
    

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${project.name} - ${currentView.charAt(0).toUpperCase() + currentView.slice(1)}`} />
            
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center gap-4">
                    <Link href={`/projects/${project.id}`}>
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </Button>
                    </Link>
                    <h1 className="text-2xl font-bold">{project.name}</h1>
                    <div className="ml-auto flex items-center gap-2">
                        <ViewSelector 
                            currentView={currentView} 
                            onViewChange={handleViewChange}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-hidden">
                    {currentView === 'kanban' && (
                        <KanbanBoard
                            columns={columns}
                            statuses={statuses}
                            authUserId={authUserId}
                            canManage={canManageProject}
                        />
                    )}
                    {currentView === 'gantt' && (
                        <InteractiveGanttChart
                            projectId={project.id}
                            workItems={workItems || []}
                            milestones={milestones || []}
                            workItemGroups={workItemGroups || []}
                            readOnly={!canManageProject}
                        />
                    )}
                    {currentView === 'calendar' && (
                        <CalendarView
                            workItems={(workItems || []).map(item => ({
                                ...item,
                                due_date: item.due_date,
                            }))}
                            milestones={(milestones || []).map(m => ({
                                ...m,
                                target_date: m.target_date,
                            }))}
                        />
                    )}
                </div>
            </div>
        </AppLayout>
    );
}

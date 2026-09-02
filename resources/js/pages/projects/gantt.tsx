import { Head, Link, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Maximize2, Minimize2 } from 'lucide-react';
import { useState } from 'react';
import InteractiveGanttChart from '@/components/interactive-gantt-chart';
import KanbanBoard from '@/components/kanban/kanban-board';
import CalendarView from '@/components/calendar-view';
import ViewSelector from '@/components/view-selector';

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
    start_date: string | null;
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

interface GanttPageProps extends Record<string, unknown> {
    project: { id: number; name: string; start_date?: string | null; end_date?: string | null };
    workItems: WorkItem[];
    milestones: Milestone[];
    workItemGroups: WorkItemGroup[];
    columns?: any[];
    statuses?: any[];
}

export default function Gantt() {
    const { project, workItems, milestones, workItemGroups, columns, statuses } = usePage<GanttPageProps>().props;
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [currentView, setCurrentView] = useState<'kanban' | 'gantt' | 'calendar'>('gantt');

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Projects', href: '/projects' },
        { title: project.name, href: `/projects/${project.id}` },
        { title: currentView.charAt(0).toUpperCase() + currentView.slice(1), href: `/projects/${project.id}/gantt` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${project.name} - ${currentView.charAt(0).toUpperCase() + currentView.slice(1)}`} />
    

            <div className={`flex flex-col gap-4 rounded-xl p-4 ${isFullscreen ? 'h-screen' : 'h-full flex-1'}`}>
                <div className="flex items-center gap-4">
                    <Link href={`/projects/${project.id}`}>
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </Button>
                    </Link>
                        <h1 className="gap-5 text-2xl font-bold">{project.name} — {currentView.charAt(0).toUpperCase() + currentView.slice(1)}</h1>
                        <div className=" ml-auto flex gap-2">
                            <ViewSelector 
                                currentView={currentView} 
                                onViewChange={(view) => setCurrentView(view as 'kanban' | 'gantt' | 'calendar')}
                            />
                            {currentView === 'gantt' && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsFullscreen(!isFullscreen)}
                                >
                                    {isFullscreen ? (
                                        <>
                                            <Minimize2 className="mr-2 h-4 w-4" />
                                            Exit Fullscreen
                                        </>
                                    ) : (
                                        <>
                                            <Maximize2 className="mr-2 h-4 w-4" />
                                            Fullscreen
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                </div>

                <div className="flex-1 min-h-0 overflow-hidden">
                    {currentView === 'kanban' && (
                        <KanbanBoard columns={columns || []} statuses={statuses || []} />
                    )}
                    {currentView === 'gantt' && (
                        <InteractiveGanttChart
                            projectId={project.id}
                            workItems={workItems}
                            milestones={milestones}
                            workItemGroups={workItemGroups}
                            projectStartDate={project.start_date ?? null}
                            projectEndDate={project.end_date ?? null}
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

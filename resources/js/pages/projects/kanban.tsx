import { Head, Link, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Columns3 } from 'lucide-react';
import KanbanBoard from '@/components/kanban/kanban-board';

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
    };
    columns: KanbanColumnData[];
    statuses: StatusData[];
}

export default function Kanban() {
    const { project, columns, statuses } = usePage<KanbanPageProps>().props;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Projects', href: '/projects' },
        { title: project.name, href: `/projects/${project.id}` },
        { title: 'Kanban', href: `/projects/${project.id}/kanban` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${project.name} - Kanban`} />
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
                        <Columns3 className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Kanban Board</span>
                    </div>
                </div>

                <div className="flex-1 overflow-hidden">
                    <KanbanBoard columns={columns} statuses={statuses} />
                </div>
            </div>
        </AppLayout>
    );
}
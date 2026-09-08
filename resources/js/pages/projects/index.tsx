import { Head, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, FileSpreadsheet } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { ViewToggle } from '@/components/tables/view-toggle';
import { ProjectsCardView } from '@/components/tables/projects-card-view';
import { ProjectsTableView } from '@/components/tables/projects-table-view';
import ProjectSetupSheet, { type StatusOption, type UserOption, type WorkItemStatusOption, type NestedMilestone} from '@/components/projects/setup/project-setup-sheet-refactored';
import { confirmRequest } from '@/components/confirm-dialog';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Projects',
        href: '/projects',
    },
];

export interface ProjectItem {
    id: number;
    name: string;
    description: string;
    item_prefix: string;
    created_by: number;
    creator_name: string;
    members_count: number;
    work_items_count: number;
    completion_percentage: number;
    end_date: string | null;
    archived?: boolean;
}

interface ProjectsPageProps extends Record<string, unknown> {
    projects: ProjectItem[];
    archived?: boolean;
    statuses: StatusOption[];
    allUsers: UserOption[];
    workItemStatuses: WorkItemStatusOption[];
    auth?: {
        user?: {
            id: number;
            name: string;
            email: string;
        } | null;
        roles?: string[];
    };

}

export default function ProjectsIndex() {
    const { projects, archived = false, statuses, allUsers, workItemStatuses, auth } = usePage<ProjectsPageProps>().props;
    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState<'table' | 'cards' | 'grouped'>('table');
    const [createOpen, setCreateOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<{
        project: {
            id: number;
            name: string;
            description: string;
            item_prefix: string;
            start_date: string | null;
            end_date: string | null;
            status_name: string | null;
        };
        statuses: StatusOption[];
        allUsers: UserOption[];
        workItemStatuses: WorkItemStatusOption[];
        memberIds: number[];
        milestones: NestedMilestone[];
    } | null>(null);
    const [editLoading, setEditLoading] = useState(false);
    // Role tiers: admins manage everything; managers may create projects but
    // only edit ones they own; members are view-only.
    const userRoles = auth?.roles || [];
    const isAdmin = userRoles.some((r) => ['admin', 'superadmin'].includes(r.toLowerCase()));
    const isManager = !isAdmin && userRoles.some((r) => r.toLowerCase().includes('manager'));
    const canManageProjects = !userRoles.includes('member');
    const canManageProject = (project: { created_by: number }) =>
        isAdmin || (isManager && Number(project.created_by) === Number(auth?.user?.id));
    // Persist view preference
    useEffect(() => {
        const saved = localStorage.getItem('projects-view-mode');
        if (saved === 'table' || saved === 'cards' || saved === 'grouped') {
            setViewMode(saved as 'table' | 'cards' | 'grouped');
        }
    }, []);

    const toggleView = (mode: 'table' | 'cards' | 'grouped') => {
        setViewMode(mode);
        localStorage.setItem('projects-view-mode', mode);
    };

    const filteredProjects = useMemo(() => {
        if (!search.trim()) return projects;
        const query = search.toLowerCase();
        return projects.filter(
            (project) =>
                project.name.toLowerCase().includes(query) ||
                project.description?.toLowerCase().includes(query),
        );
    }, [projects, search]);

    async function handleDelete(projectId: number, projectName: string) {
        const ok = await confirmRequest({
            title: `Delete "${projectName}"?`,
            description: 'This will permanently remove the project, its groups, milestones and work items. This action cannot be undone.',
            confirmLabel: 'Delete project',
        });

        if (ok) {
            router.delete(`/projects/${projectId}`, { preserveScroll: true });
        }
    }

    function handleArchive(projectId: number) {
        router.post(`/projects/${projectId}/archive`, {}, { preserveScroll: true });
    }

    function handleRestore(projectId: number) {
        router.post(`/projects/${projectId}/restore`, {}, { preserveScroll: true });
    }

    function setArchivedView(archived: boolean) {
        router.get('/projects', { project_archived: archived ? '1' : '0' }, { preserveState: true, replace: true });
    }

    async function handleEditClick(projectId: number) {
        setEditLoading(true);
        try {
            const res = await fetch(`/projects/${projectId}/setup-data`, {
                headers: { Accept: 'application/json' },
            });
            if (!res.ok) throw new Error('Failed to load project setup data');
            const data = await res.json();
            setEditingProject(data);
            setEditOpen(true);
        } catch (e) {
            console.error(e);
        } finally {
            setEditLoading(false);
        }
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Projects" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Projects</h1>
                    <div className="flex items-center gap-2">
                        <ViewToggle viewMode={viewMode} onViewChange={toggleView} />
                        {/* Export what you see: the download mirrors the current
                            search text and archived filter. Plain <a> so the
                            browser handles the file download directly. */}
                        <a
                            href={`/projects/export?search=${encodeURIComponent(search)}${archived ? '&project_archived=1' : ''}`}
                            download
                        >
                            <Button variant="outline" size="sm" title={`Export ${filteredProjects.length} projects as Excel`}>
                                <FileSpreadsheet className="mr-2 h-4 w-4" />
                                Export Excel
                            </Button>
                        </a>
                        {canManageProjects && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setArchivedView(!archived)}
                            >
                                {archived ? 'View Active' : 'View Archived'}
                            </Button>
                        )}
                        {canManageProjects && (
                            <Button onClick={() => setCreateOpen(true)}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Project
                            </Button>
                        )}
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search projects by name or description..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
    {filteredProjects.filter(p => p.completion_percentage >= 100).length} done ·{' '}
    {filteredProjects.filter(p =>
        p.end_date && p.completion_percentage < 100 &&
        new Date(`${p.end_date}T00:00:00`).getTime() < new Date().setHours(0,0,0,0)
    ).length} overdue
</div>

                {/* View Content */}
                {viewMode === 'table' ? (
                    <ProjectsTableView projects={filteredProjects} canManageProjects={canManageProjects} canManageProject={canManageProject} onDelete={handleDelete} onEdit={handleEditClick} editLoading={editLoading} onArchive={handleArchive} onRestore={handleRestore} />
                ) : (
                    <ProjectsCardView projects={filteredProjects} canManageProjects={canManageProjects} canManageProject={canManageProject} onDelete={handleDelete} onEdit={handleEditClick} editLoading={editLoading} onArchive={handleArchive} onRestore={handleRestore} />
                )}
            </div>

            {editingProject && (
                <ProjectSetupSheet
                    open={editOpen}
                    onOpenChange={setEditOpen}
                    mode="edit"
                    projectId={editingProject.project.id}
                    project={editingProject.project}
                    statusName={editingProject.project.status_name ?? ''}
                    statuses={editingProject.statuses}
                    allUsers={editingProject.allUsers}
                    workItemStatuses={editingProject.workItemStatuses}
                    initialMemberIds={editingProject.memberIds}
                    initialMilestones={editingProject.milestones}
                />
            )}

            <ProjectSetupSheet
                open={createOpen}
                onOpenChange={setCreateOpen}
                mode="create"
                project={{ name: '', description: '', item_prefix: '', start_date: null, end_date: null }}
                statusName="Active"
                statuses={statuses}
                allUsers={allUsers}
                workItemStatuses={workItemStatuses}
            />
        </AppLayout>
    );
}

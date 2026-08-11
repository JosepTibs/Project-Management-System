import { Head, Link, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { ViewToggle } from '@/components/tables/view-toggle';
import { ProjectsCardView } from '@/components/tables/projects-card-view';
import { ProjectsTableView } from '@/components/tables/projects-table-view';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Projects',
        href: '/projects',
    },
];

interface ProjectItem {
    id: number;
    name: string;
    description: string;
    item_prefix: string;
    created_by: number;
    creator_name: string;
    members_count: number;
    work_items_count: number;
    completion_percentage: number;
}

interface ProjectsPageProps extends Record<string, unknown> {
    projects: ProjectItem[];
}

export default function ProjectsIndex() {
    const { projects } = usePage<ProjectsPageProps>().props;
    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

    // Persist view preference
    useEffect(() => {
        const saved = localStorage.getItem('projects-view-mode');
        if (saved === 'table' || saved === 'cards') {
            setViewMode(saved);
        }
    }, []);

    const toggleView = (mode: 'table' | 'cards') => {
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

    function handleDelete(projectId: number, projectName: string) {
        if (confirm(`Are you sure you want to delete "${projectName}"? This action cannot be undone.`)) {
            router.delete(`/projects/${projectId}`, { preserveScroll: true });
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
                        <Link href="/projects/create">
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Project
                            </Button>
                        </Link>
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

                {/* View Content */}
                {viewMode === 'table' ? (
                    <ProjectsTableView projects={filteredProjects} onDelete={handleDelete} />
                ) : (
                    <ProjectsCardView projects={filteredProjects} onDelete={handleDelete} />
                )}
            </div>
        </AppLayout>
    );
}

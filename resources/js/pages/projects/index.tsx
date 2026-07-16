import { Head, Link, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Eye, Pencil, Trash2, Users, FileText } from 'lucide-react';
import { useState, useMemo } from 'react';

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
    members_count: number;
    work_items_count: number;
}

interface ProjectsPageProps extends Record<string, unknown> {
    projects: ProjectItem[];
}

export default function ProjectsIndex() {
    const { projects } = usePage<ProjectsPageProps>().props;
    const [search, setSearch] = useState('');

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
                    <Link href="/projects/create">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Project
                        </Button>
                    </Link>
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

                {/* Project Cards Grid */}
                {filteredProjects.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {filteredProjects.map((project: ProjectItem) => (
                            <Card key={project.id} className="flex flex-col">
                                <CardHeader>
                                    <div className="flex items-start justify-between gap-2">
                                        <Link
                                            href={`/projects/${project.id}`}
                                            className="text-lg font-semibold hover:underline leading-tight"
                                        >
                                            {project.name}
                                        </Link>
                                        <span className="shrink-0 rounded bg-muted px-2 py-0.5 text-xs font-mono">
                                            {project.item_prefix}
                                        </span>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-1">
                                    <p className="line-clamp-2 text-sm text-muted-foreground">
                                        {project.description || 'No description provided.'}
                                    </p>
                                    <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <Users className="h-4 w-4" />
                                            {project.members_count} {project.members_count === 1 ? 'member' : 'members'}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <FileText className="h-4 w-4" />
                                            {project.work_items_count} {project.work_items_count === 1 ? 'item' : 'items'}
                                        </span>
                                    </div>
                                </CardContent>
                                <CardFooter className="border-t pt-4">
                                    <div className="flex w-full justify-end gap-2">
                                        <Link href={`/projects/${project.id}`}>
                                            <Button variant="outline" size="sm" title="View">
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                        <Link href={`/projects/${project.id}/edit`}>
                                            <Button variant="outline" size="sm" title="Edit">
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-red-600 hover:text-red-700"
                                            title="Delete"
                                            onClick={() => handleDelete(project.id, project.name)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card>
                        <CardContent className="py-12 text-center">
                            {search ? (
                                <p className="text-muted-foreground">
                                    No projects matching "<span className="font-medium">{search}</span>"
                                </p>
                            ) : (
                                <p className="text-muted-foreground">No projects yet. Create your first project!</p>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
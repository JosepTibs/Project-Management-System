import { Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import type { ProjectItem } from '@/pages/projects/index';

interface ProjectsCardViewProps {
    projects: ProjectItem[];
    onDelete: (projectId: number, projectName: string) => void;
    onEdit?: (projectId: number) => void;
    editLoading?: boolean;
}

export function ProjectsCardView({ projects, onDelete, onEdit, editLoading }: ProjectsCardViewProps) {
    return (
        <>
            {projects.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {projects.map((project) => (
                        <Card key={project.id} className="flex flex-col">
                            <CardHeader>
                                <div className="flex items-start justify-between gap-2">
                                    <Link
                                        href={`/projects/${project.id}`}
                                        className="text-lg font-semibold hover:underline"
                                    >
                                        {project.name}
                                    </Link>
                                </div>
                                {project.description && (
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                        {project.description}
                                    </p>
                                )}
                            </CardHeader>
                            <CardContent className="flex-1">
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Prefix</span>
                                        <span className="font-mono text-xs">{project.item_prefix}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Work Items</span>
                                        <span className="font-medium">{project.work_items_count}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Members</span>
                                        <span className="font-medium">{project.members_count}</span>
                                    </div>
                                    <div className="mt-3">
                                        <div className="flex items-center justify-between text-sm mb-1">
                                            <span className="text-muted-foreground">Progress</span>
                                            <span className="font-medium">{Math.round(project.completion_percentage)}%</span>
                                        </div>
                                        <div className="w-full bg-secondary rounded-full h-2">
                                            <div
                                                className="bg-primary rounded-full h-2 transition-all"
                                                style={{ width: `${project.completion_percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        Created by {project.creator_name || 'Unknown'}
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="border-t pt-4">
                                <div className="flex w-full justify-end gap-2">
                                    <Link href={`/projects/${project.id}`}>
                                        <Button variant="outline" size="sm" title="View">
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        title="Edit"
                                        onClick={() => onEdit?.(project.id)}
                                        disabled={editLoading}
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-red-600 hover:text-red-700"
                                        title="Delete"
                                        onClick={() => onDelete(project.id, project.name)}
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
                        <p className="text-muted-foreground">No projects yet. Create your first project!</p>
                    </CardContent>
                </Card>
            )}
        </>
    );
}

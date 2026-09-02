import { Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Pencil, Trash2, Archive, ArchiveRestore } from 'lucide-react';
import type { ProjectItem } from '@/pages/projects/index';
import { getDueStatus } from '@/lib/project-due';
interface ProjectsCardViewProps {
    projects: ProjectItem[];
    /** False for members — shows an "ask to be assigned" empty state instead of "create one". */
    canManageProjects?: boolean;
    /** Per-project ownership check (managers may only manage projects they own). */
    canManageProject?: (project: ProjectItem) => boolean;
    onDelete: (projectId: number, projectName: string) => void;
    onEdit?: (projectId: number) => void;
    editLoading?: boolean;
    onArchive?: (projectId: number) => void;
    onRestore?: (projectId: number) => void;
}

export function ProjectsCardView({ projects, canManageProjects = true, canManageProject, onDelete, onEdit, editLoading, onArchive, onRestore }: ProjectsCardViewProps) {
    const mayManage = (project: ProjectItem) => canManageProject ? canManageProject(project) : canManageProjects;

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
                                        <span className="text-muted-foreground">Members</span>
                                        <span className="font-medium">{project.members_count}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Due Date</span>
                                        {project.end_date && (
                                      <div className="flex items-center gap-2">
                                       
                                        {(() => {
                                          const { label, className } = getDueStatus(project.end_date, project.completion_percentage);
                                          return (
                                            <Badge variant="outline" className={`${className} border-0 font-medium`}>
                                              {label}
                                            </Badge>
                                          );
                                        })()}
                                      </div>
                                    )}
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
                                    {(canManageProjects || canManageProject) && mayManage(project) && (
                                        <>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                title="Edit"
                                                onClick={() => onEdit?.(project.id)}
                                                disabled={editLoading}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            {project.archived ? (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    title="Restore"
                                                    onClick={() => onRestore?.(project.id)}
                                                >
                                                    <ArchiveRestore className="h-4 w-4" />
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    title="Archive"
                                                    onClick={() => onArchive?.(project.id)}
                                                >
                                                    <Archive className="h-4 w-4" />
                                                </Button>
                                            )}
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-red-600 hover:text-red-700"
                                                title="Delete"
                                                onClick={() => onDelete(project.id, project.name)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card>
                    <CardContent className="py-12 text-center">
                        <p className="text-muted-foreground">
                            {canManageProjects
                                ? 'No projects yet. Create your first project!'
                                : "You haven't been assigned to any projects yet. Ask an administrator or project manager to add you to a team."}
                        </p>
                    </CardContent>
                </Card>
            )}
        </>
    );
}

import { Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Pencil, Trash2, Archive, ArchiveRestore } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import type { ProjectItem } from '@/pages/projects/index';
import { getDueStatus } from '@/lib/project-due';

interface ProjectsTableViewProps {
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

export function ProjectsTableView({ projects, canManageProjects = true, canManageProject, onDelete, onEdit, editLoading, onArchive, onRestore }: ProjectsTableViewProps) {
    const mayManage = (project: ProjectItem) => canManageProject ? canManageProject(project) : canManageProjects;

    return (
        <Card>
            <CardHeader className="p-0">
                <div className="w-full overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Prefix</TableHead>
                                <TableHead className="text-right">Members</TableHead>
                                <TableHead className="text-right">Progress</TableHead>
                                <TableHead className="text-right">Due Date</TableHead>
                                <TableHead >Created By</TableHead>
                                {canManageProjects && <TableHead className="text-right">Actions</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {projects.map((project) => (
                                <TableRow key={project.id}>
                                    <TableCell className="font-medium">
                                        <Link href={`/projects/${project.id}`} className="hover:underline">
                                            {project.name}
                                        </Link>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground max-w-xs truncate">
                                        {project.description || '—'}
                                    </TableCell>
                                    <TableCell>
                                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                            {project.item_prefix}
                                        </code>
                                    </TableCell>
                                    <TableCell className="text-right">{project.members_count}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <div className="w-16 bg-secondary rounded-full h-1.5">
                                                <div
                                                    className="bg-primary rounded-full h-1.5"
                                                    style={{ width: `${project.completion_percentage}%` }}
                                                />
                                            </div>
                                            <span className="text-xs text-muted-foreground w-10">
                                                {Math.round(project.completion_percentage)}%
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {(() => {
                                            const { label, className } = getDueStatus(project.end_date, project.completion_percentage);
                                            return (
                                                <span
                                                    title={project.end_date ? 'Due date & remaining days' : 'No due date set'}
                                                    className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${
                                                        project.end_date ? className : 'text-muted-foreground'
                                                    }`}
                                                >
                                                    {label}
                                                </span>
                                            );
                                        })()}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {project.creator_name || 'Unknown'}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex justify-end gap-2">
                                            <Link href={`/projects/${project.id}`}>
                                                <Button variant="ghost" size="sm" title="View">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                            {(canManageProjects || canManageProject) && mayManage(project) && (
                                                <>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        title="Edit"
                                                        onClick={() => onEdit?.(project.id)}
                                                        disabled={editLoading}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    {project.archived ? (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            title="Restore"
                                                            onClick={() => onRestore?.(project.id)}
                                                        >
                                                            <ArchiveRestore className="h-4 w-4" />
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            title="Archive"
                                                            onClick={() => onArchive?.(project.id)}
                                                        >
                                                            <Archive className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="ghost"
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
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardHeader>
            {projects.length === 0 && (
                <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">
                        {canManageProjects
                            ? 'No projects yet. Create your first project!'
                            : "You haven't been assigned to any projects yet. Ask an administrator or project manager to add you to a team."}
                    </p>
                </CardContent>
            )}
        </Card>
    );
}

import { Head, Link, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { ArrowLeft, Users, FileText, Edit } from 'lucide-react';

interface Member {
    id: number;
    user_id: number;
    user_name: string;
    user_email: string;
}

interface WorkItem {
    id: number;
    title: string;
    priority: string;
    due_date: string;
}

interface ProjectData {
    id: number;
    name: string;
    description: string;
    item_prefix: string;
    members: Member[];
    work_items: WorkItem[];
}

interface ShowProjectPageProps extends Record<string, unknown> {
    project: ProjectData;
}

function getPriorityVariant(priority: string) {
    switch (priority) {
        case 'critical': return 'destructive' as const;
        case 'high': return 'default' as const;
        case 'medium': return 'secondary' as const;
        case 'low': return 'outline' as const;
        default: return 'outline' as const;
    }
}

export default function ShowProject() {
    const { project } = usePage<ShowProjectPageProps>().props;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Projects', href: '/projects' },
        { title: project.name, href: `/projects/${project.id}` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={project.name} />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center gap-4">
                    <Link href="/projects">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </Button>
                    </Link>
                    <h1 className="text-2xl font-bold">{project.name}</h1>
                    <div className="ml-auto">
                        <Link href={`/projects/${project.id}/edit`}>
                            <Button variant="outline" size="sm">
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Project Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Project Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <dt className="text-sm text-muted-foreground">Name</dt>
                                <dd className="font-medium">{project.name}</dd>
                            </div>
                            <div>
                                <dt className="text-sm text-muted-foreground">Item Prefix</dt>
                                <dd className="font-mono text-sm">{project.item_prefix}</dd>
                            </div>
                            <div className="sm:col-span-2">
                                <dt className="text-sm text-muted-foreground">Description</dt>
                                <dd className="text-muted-foreground">{project.description || '—'}</dd>
                            </div>
                        </dl>
                    </CardContent>
                </Card>

                {/* Members */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Users className="h-5 w-5" />
                            Members ({project.members.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {project.members.length > 0 ? (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Email</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {project.members.map((member: Member) => (
                                            <TableRow key={member.id}>
                                                <TableCell className="font-medium">{member.user_name}</TableCell>
                                                <TableCell className="text-muted-foreground">{member.user_email}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <p className="py-4 text-center text-sm text-muted-foreground">No members assigned yet.</p>
                        )}
                    </CardContent>
                </Card>

                {/* Work Items */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <FileText className="h-5 w-5" />
                                Work Items ({project.work_items.length})
                            </CardTitle>
                            <Link href={`/projects/${project.id}/work-items`}>
                                <Button variant="outline" size="sm">View All</Button>
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {project.work_items.length > 0 ? (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Title</TableHead>
                                            <TableHead>Priority</TableHead>
                                            <TableHead>Due Date</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {project.work_items.map((item: WorkItem) => (
                                            <TableRow key={item.id}>
                                                <TableCell className="font-medium">{item.title}</TableCell>
                                                <TableCell>
                                                    <Badge variant={getPriorityVariant(item.priority)}>
                                                        {item.priority}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">{item.due_date}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <p className="py-4 text-center text-sm text-muted-foreground">No work items yet.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
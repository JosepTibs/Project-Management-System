import { Head, Link, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { ArrowLeft, Edit, FolderOpen } from 'lucide-react';

interface Role {
    id: number;
    name: string;
}

interface Project {
    id: number;
    name: string;
}

interface UserData {
    id: number;
    name: string;
    email: string;
    role: Role | null;
    created_at: string;
    projects: Project[];
}

interface ShowUserPageProps extends Record<string, unknown> {
    user: UserData;
}

export default function ShowUser() {
    const { user } = usePage<ShowUserPageProps>().props;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Users', href: '/users' },
        { title: user.name, href: `/users/${user.id}` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={user.name} />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center gap-4">
                    <Link href="/users">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </Button>
                    </Link>
                    <h1 className="text-2xl font-bold">{user.name}</h1>
                    <div className="ml-auto">
                        <Link href={`/users/${user.id}/edit`}>
                            <Button variant="outline" size="sm">
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* User Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">User Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <dt className="text-sm text-muted-foreground">Name</dt>
                                <dd className="font-medium">{user.name}</dd>
                            </div>
                            <div>
                                <dt className="text-sm text-muted-foreground">Email</dt>
                                <dd className="text-muted-foreground">{user.email}</dd>
                            </div>
                            <div>
                                <dt className="text-sm text-muted-foreground">Role</dt>
                                <dd>
                                    {user.role ? (
                                        <Badge variant={user.role.name === 'admin' ? 'destructive' : 'default'}>
                                            {user.role.name}
                                        </Badge>
                                    ) : (
                                        <span className="text-muted-foreground">—</span>
                                    )}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm text-muted-foreground">Joined</dt>
                                <dd className="text-muted-foreground">{user.created_at}</dd>
                            </div>
                        </dl>
                    </CardContent>
                </Card>

                {/* Projects */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <FolderOpen className="h-5 w-5" />
                            Projects ({user.projects.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {user.projects.length > 0 ? (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Project Name</TableHead>
                                            <TableHead className="w-24">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {user.projects.map((project: Project) => (
                                            <TableRow key={project.id}>
                                                <TableCell className="font-medium">{project.name}</TableCell>
                                                <TableCell>
                                                    <Link href={`/projects/${project.id}`}>
                                                        <Button variant="outline" size="sm">View</Button>
                                                    </Link>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <p className="py-4 text-center text-sm text-muted-foreground">Not assigned to any projects.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
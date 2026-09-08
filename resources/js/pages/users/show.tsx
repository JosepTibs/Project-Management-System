import { Head, Link, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Edit, FolderOpen } from 'lucide-react';
import BackButton from '@/components/navigation/back-button';
import CreateUserSheet, { type SheetUserData } from '@/components/users/create-user-sheet';
import { useState } from 'react';

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
    username: string;
    fname: string;
    mname: string;
    lname: string;
    sname: string;
    email: string;
    role: Role | null;
    role_id?: number | null;
    created_at: string;
    projects: Project[];
}

interface ShowUserPageProps extends Record<string, unknown> {
    user: UserData;
    roles: Role[];
}

function formatFullName(user: UserData) {
    const parts = [user.fname, user.mname, user.lname, user.sname].filter(Boolean);
    return parts.join(' ');
}

export default function ShowUser() {
    const { user, roles } = usePage<ShowUserPageProps>().props;
    const fullName = formatFullName(user);
    const [editOpen, setEditOpen] = useState(false);

    // Shape the user for the edit sheet (same contract as the edit page).
    const sheetUser: SheetUserData = {
        id: user.id,
        username: user.username,
        fname: user.fname,
        mname: user.mname,
        lname: user.lname,
        sname: user.sname,
        email: user.email,
        role_id: user.role_id ?? user.role?.id ?? null,
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Users', href: '/users' },
        { title: fullName, href: `/users/${user.id}` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={fullName} />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center gap-4">
                    <BackButton defaultUrl="/users" />
                    <h1 className="text-2xl font-bold">{fullName}</h1>
                    <div className="ml-auto">
                        <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                        </Button>
                    </div>
                </div>

                <CreateUserSheet
                    open={editOpen}
                    onOpenChange={setEditOpen}
                    roles={roles}
                    user={sheetUser}
                />

                {/* User Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">User Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <dt className="text-sm text-muted-foreground">Username</dt>
                                <dd className="font-medium">{user.username}</dd>
                            </div>
                            <div>
                                <dt className="text-sm text-muted-foreground">Full Name</dt>
                                <dd className="font-medium">{fullName}</dd>
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
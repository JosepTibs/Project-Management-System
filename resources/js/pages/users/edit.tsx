import { Head, Link, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';
import { FormEvent, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Users',
        href: '/users',
    },
    {
        title: 'Edit',
        href: '/users/:id/edit',
    },
];

interface Role {
    id: number;
    name: string;
}

interface EditUserData {
    id: number;
    username: string;
    fname: string;
    mname: string;
    lname: string;
    sname: string;
    email: string;
    role_id: number | null;
}

interface EditUserPageProps extends Record<string, unknown> {
    user: EditUserData;
    roles: Role[];
}

export default function EditUser() {
    const { user, roles } = usePage<EditUserPageProps>().props;
    const [username, setUserName] = useState(user.username);
    const [fname, setFirstName] = useState(user.fname);
    const [mname, setMiddleName] = useState(user.mname);
    const [lname, setLastName] = useState(user.lname);
    const [sname, setSuffixName] = useState(user.sname);
    const [email, setEmail] = useState(user.email);
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [roleId, setRoleId] = useState(String(user.role_id ?? ''));
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setProcessing(true);

        router.put(`/users/${user.id}`, {
            username,
            fname,
            mname,
            lname,
            sname,
            email,
            password: password || undefined,
            password_confirmation: passwordConfirmation || undefined,
            role_id: roleId,
        }, {
            onError: (errs) => {
                setErrors(errs);
                setProcessing(false);
            },
            onSuccess: () => {
                setProcessing(false);
            },
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit User" />
            <div className="flex h-full flex-1 flex-col items-center gap-4 rounded-xl p-4">
                <div className="flex items-center gap-4">
                   <Button  variant="outline"  size="sm" onClick={() => window.history.back()} >
                         <ArrowLeft className="mr-2 h-4 w-4" />
                         Back
                     </Button>
                    <h1 className="text-2xl font-bold">Edit User</h1>
                </div>

                <Card className="w-full max-w-2xl">
                    <CardHeader>
                        <CardTitle className="text-lg">User Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="username">Username</Label>
                                <Input
                                    id="username"
                                    value={username}
                                    onChange={(e) => setUserName(e.target.value)}
                                    placeholder="Alwayswannafly"
                                />
                                {errors.username && (
                                    <p className="text-sm text-red-600">{errors.username}</p>
                                )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                <Label htmlFor="fname">First Name</Label>
                                <Input
                                  id="fname"
                                  value={fname}
                                  onChange={(e) => setFirstName(e.target.value)}
                                  placeholder="Joseph Daniel"
                                />
                                 {errors.fname && (
                                    <p className="text-sm text-red-600">{errors.fname}</p>
                                )}
                              </div>
                                <div className = "space-y-2">
                                <Label htmlFor="mname">Middle name</Label>
                                <Input
                                    id="mname"
                                    value={mname}
                                    onChange={(e) => setMiddleName(e.target.value)}
                                    placeholder="Divine"
                                />
                                {errors.mname && (
                                    <p className="text-sm text-red-600">{errors.fname}</p>
                                )}</div>
                                <div className = "space-y-2">
                                <Label htmlFor="lname">Last Name</Label>
                                <Input
                                    id="lname"
                                    value={lname}
                                    onChange={(e) => setLastName(e.target.value)}
                                    placeholder="Teves"
                                />
                                {errors.lname && (
                                    <p className="text-sm text-red-600">{errors.lname}</p>
                                )}
                                </div>
                                <div className = "space-y-2">
                                 <Label htmlFor="sname">Suffix </Label>
                                <Input
                                    id="sname"
                                    value={sname}
                                    onChange={(e) => setSuffixName(e.target.value)}
                                    placeholder="Jr"
                                />
                                {errors.lname && (
                                    <p className="text-sm text-red-600">{errors.lname}</p>
                                )}
                                </div>
                            </div>

                            {/* Email */}
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="john@example.com"
                                />
                                {errors.email && (
                                    <p className="text-sm text-red-600">{errors.email}</p>
                                )}
                            </div>

                            {/* Password (optional) */}
                            <div className="space-y-2">
                                <Label htmlFor="password">
                                    Password <span className="text-muted-foreground text-xs">(leave blank to keep current)</span>
                                </Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Min. 8 characters"
                                />
                                {errors.password && (
                                    <p className="text-sm text-red-600">{errors.password}</p>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div className="space-y-2">
                                <Label htmlFor="password_confirmation">Confirm Password</Label>
                                <Input
                                    id="password_confirmation"
                                    type="password"
                                    value={passwordConfirmation}
                                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                                    placeholder="Repeat password"
                                />
                            </div>

                            {/* Role */}
                            <div className="space-y-2">
                                <Label htmlFor="role">Role</Label>
                                <Select value={roleId} onValueChange={setRoleId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {roles.map((role) => (
                                            <SelectItem key={role.id} value={String(role.id)}>
                                                {role.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.role_id && (
                                    <p className="text-sm text-red-600">{errors.role_id}</p>
                                )}
                            </div>

                            <div className="flex justify-end gap-3">
                                <Link href="/users">
                                    <Button variant="outline" type="button">Cancel</Button>
                                </Link>
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
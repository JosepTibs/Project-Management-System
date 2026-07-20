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
        title: 'Create',
        href: '/users/create',
    },
];

interface Role {
    id: number;
    name: string;
}

interface CreateUserPageProps extends Record<string, unknown> {
    roles: Role[];
}

export default function CreateUser() {
    const { roles } = usePage<CreateUserPageProps>().props;
    const [username, setUserName] = useState('');
    const [fname, setFirstName] = useState('');
    const [mname, setMiddleName] = useState('');
    const [lname, setLastName] = useState('');
    const [sname, setSuffixName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [roleId, setRoleId] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setProcessing(true);

        router.post('/users', {
            username,
            fname,
            mname,
            lname,
            sname,
            email,
            password,
            password_confirmation: passwordConfirmation,
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
            <Head title="Create User" />
            <div className="flex h-full flex-1 flex-col items-center gap-4 rounded-xl p-4">
                <div className="flex items-center gap-4">
                    <Link href="/users">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </Button>
                    </Link>
                    <h1 className="text-2xl font-bold">Create User</h1>
                </div>

                <Card className="w-full max-w-2xl">
                    <CardHeader>
                        <CardTitle className="text-lg">User Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Name */}
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

                            {/* Password */}
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
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
                                    {processing ? 'Creating...' : 'Create User'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
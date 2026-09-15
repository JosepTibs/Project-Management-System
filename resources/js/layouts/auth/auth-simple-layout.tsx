import { Link } from '@inertiajs/react';

interface AuthLayoutProps {
    children: React.ReactNode;
    name?: string;
    title?: string;
    description?: string;
}

export default function AuthSimpleLayout({ children, title, description }: AuthLayoutProps) {
    return (
        <div className="bg-auth-bg flex min-h-svh w-full">
            {/* Left Side - Login Form */}
            <div className="flex w-full flex-col items-center justify-center gap-6 p-6 md:w-1/2 md:p-10">
                <div className="w-full max-w-sm">
                    <div className="flex flex-col gap-8">
                        <div className="flex flex-col items-center gap-3">
                            <Link href={route('home')} className="flex flex-col items-center gap-2 font-medium">
                                <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-md bg-auth-surface ring-1 ring-auth-accent/30">
                                    <img src="/phccilogo-light.png" alt="PHCCI logo" className="size-10 object-contain" />
                                </div>
                                <span className="sr-only">{title}</span>
                            </Link>

                            <span className="text-center text-lg font-semibold tracking-wide text-auth-foreground">
                                PHCCI Project Management System
                            </span>
                        </div>

                        <div className="space-y-2 text-center">
                            <h1 className="text-2xl font-semibold text-auth-foreground">{title}</h1>
                            <p className="text-auth-muted text-center text-sm">{description}</p>
                        </div>
                        {children}
                    </div>
                </div>
            </div>

            {/* Right Side - Dashboard Preview */}
            <div className="hidden md:flex md:w-1/2 md:items-center md:justify-center bg-auth-surface p-8">
                <div className="w-full max-w-2xl space-y-4">
                    {/* Mock Dashboard UI */}
                    <div className="rounded-lg bg-auth-bg p-6 shadow-2xl">
                        {/* Header */}
                        <div className="mb-6 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded bg-auth-accent"></div>
                                <div className="h-4 w-32 rounded bg-auth-muted"></div>
                            </div>
                            <div className="flex gap-2">
                                <div className="h-8 w-8 rounded-full bg-auth-surface"></div>
                            </div>
                        </div>

                        {/* Content Grid */}
                        <div className="grid grid-cols-3 gap-4">
                            {/* Sidebar */}
                            <div className="col-span-1 space-y-3">
                                <div className="h-10 rounded bg-auth-surface"></div>
                                <div className="h-10 rounded bg-auth-surface"></div>
                                <div className="h-10 rounded bg-auth-accent"></div>
                                <div className="h-10 rounded bg-auth-surface"></div>
                                <div className="h-10 rounded bg-auth-surface"></div>
                            </div>

                            {/* Main Content */}
                            <div className="col-span-2 space-y-4">
                                {/* Stats Row */}
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="rounded bg-auth-surface p-4">
                                        <div className="mb-2 h-3 w-16 rounded bg-auth-muted"></div>
                                        <div className="h-6 w-24 rounded bg-auth-accent"></div>
                                    </div>
                                    <div className="rounded bg-auth-surface p-4">
                                        <div className="mb-2 h-3 w-16 rounded bg-auth-muted"></div>
                                        <div className="h-6 w-24 rounded bg-auth-accent"></div>
                                    </div>
                                    <div className="rounded bg-auth-surface p-4">
                                        <div className="mb-2 h-3 w-16 rounded bg-auth-muted"></div>
                                        <div className="h-6 w-24 rounded bg-auth-accent"></div>
                                    </div>
                                </div>

                                {/* Chart */}
                                <div className="rounded bg-auth-surface p-4">
                                    <div className="mb-3 h-4 w-32 rounded bg-auth-muted"></div>
                                    <div className="flex items-end justify-between gap-2">
                                        <div className="h-20 w-full rounded bg-auth-accent opacity-80"></div>
                                        <div className="h-28 w-full rounded bg-auth-accent opacity-90"></div>
                                        <div className="h-24 w-full rounded bg-auth-accent opacity-70"></div>
                                        <div className="h-32 w-full rounded bg-auth-accent"></div>
                                        <div className="h-26 w-full rounded bg-auth-accent opacity-85"></div>
                                    </div>
                                </div>

                                {/* Table */}
                                <div className="rounded bg-auth-surface p-4">
                                    <div className="mb-3 h-4 w-24 rounded bg-auth-muted"></div>
                                    <div className="space-y-2">
                                        <div className="flex gap-4">
                                            <div className="h-3 w-20 rounded bg-auth-muted"></div>
                                            <div className="h-3 w-32 rounded bg-auth-muted"></div>
                                            <div className="h-3 w-16 rounded bg-auth-accent"></div>
                                        </div>
                                        <div className="flex gap-4">
                                            <div className="h-3 w-20 rounded bg-auth-muted"></div>
                                            <div className="h-3 w-32 rounded bg-auth-muted"></div>
                                            <div className="h-3 w-16 rounded bg-auth-accent"></div>
                                        </div>
                                        <div className="flex gap-4">
                                            <div className="h-3 w-20 rounded bg-auth-muted"></div>
                                            <div className="h-3 w-32 rounded bg-auth-muted"></div>
                                            <div className="h-3 w-16 rounded bg-auth-accent"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

import { Link } from '@inertiajs/react';

interface AuthLayoutProps {
    children: React.ReactNode;
    name?: string;
    title?: string;
    description?: string;
}

export default function AuthSimpleLayout({ children, title, description }: AuthLayoutProps) {
    return (
        <div className="bg-[#0A1128] flex min-h-svh w-full">
            {/* Left Side - Login Form */}
            <div className="flex w-full flex-col items-center justify-center gap-6 p-6 md:w-1/2 md:p-10">
                <div className="w-full max-w-sm">
                    <div className="flex flex-col gap-8">
                        <div className="flex flex-col items-center gap-3">
                            <Link href={route('home')} className="flex flex-col items-center gap-2 font-medium">
                                <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-md bg-[#131F42] ring-1 ring-[#20E2CD]/30">
                                    <img src="/phccilogo.png" alt="PHCCI logo" className="size-10 object-contain" />
                                </div>
                                <span className="sr-only">{title}</span>
                            </Link>

                            <span className="text-center text-lg font-semibold tracking-wide text-[#F4F6F9]">
                                PHCCI Project Management System
                            </span>
                        </div>

                        <div className="space-y-2 text-center">
                            <h1 className="text-2xl font-semibold text-[#F4F6F9]">{title}</h1>
                            <p className="text-[#8C9A9E] text-center text-sm">{description}</p>
                        </div>
                        {children}
                    </div>
                </div>
            </div>

            {/* Right Side - Dashboard Preview */}
            <div className="hidden md:flex md:w-1/2 md:items-center md:justify-center bg-[#131F42] p-8">
                <div className="w-full max-w-2xl space-y-4">
                    {/* Mock Dashboard UI */}
                    <div className="rounded-lg bg-[#0A1128] p-6 shadow-2xl">
                        {/* Header */}
                        <div className="mb-6 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded bg-[#20E2CD]"></div>
                                <div className="h-4 w-32 rounded bg-[#8C9A9E]"></div>
                            </div>
                            <div className="flex gap-2">
                                <div className="h-8 w-8 rounded-full bg-[#131F42]"></div>
                            </div>
                        </div>

                        {/* Content Grid */}
                        <div className="grid grid-cols-3 gap-4">
                            {/* Sidebar */}
                            <div className="col-span-1 space-y-3">
                                <div className="h-10 rounded bg-[#131F42]"></div>
                                <div className="h-10 rounded bg-[#131F42]"></div>
                                <div className="h-10 rounded bg-[#20E2CD]"></div>
                                <div className="h-10 rounded bg-[#131F42]"></div>
                                <div className="h-10 rounded bg-[#131F42]"></div>
                            </div>

                            {/* Main Content */}
                            <div className="col-span-2 space-y-4">
                                {/* Stats Row */}
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="rounded bg-[#131F42] p-4">
                                        <div className="mb-2 h-3 w-16 rounded bg-[#8C9A9E]"></div>
                                        <div className="h-6 w-24 rounded bg-[#20E2CD]"></div>
                                    </div>
                                    <div className="rounded bg-[#131F42] p-4">
                                        <div className="mb-2 h-3 w-16 rounded bg-[#8C9A9E]"></div>
                                        <div className="h-6 w-24 rounded bg-[#20E2CD]"></div>
                                    </div>
                                    <div className="rounded bg-[#131F42] p-4">
                                        <div className="mb-2 h-3 w-16 rounded bg-[#8C9A9E]"></div>
                                        <div className="h-6 w-24 rounded bg-[#20E2CD]"></div>
                                    </div>
                                </div>

                                {/* Chart */}
                                <div className="rounded bg-[#131F42] p-4">
                                    <div className="mb-3 h-4 w-32 rounded bg-[#8C9A9E]"></div>
                                    <div className="flex items-end justify-between gap-2">
                                        <div className="h-20 w-full rounded bg-[#20E2CD] opacity-80"></div>
                                        <div className="h-28 w-full rounded bg-[#20E2CD] opacity-90"></div>
                                        <div className="h-24 w-full rounded bg-[#20E2CD] opacity-70"></div>
                                        <div className="h-32 w-full rounded bg-[#20E2CD]"></div>
                                        <div className="h-26 w-full rounded bg-[#20E2CD] opacity-85"></div>
                                    </div>
                                </div>

                                {/* Table */}
                                <div className="rounded bg-[#131F42] p-4">
                                    <div className="mb-3 h-4 w-24 rounded bg-[#8C9A9E]"></div>
                                    <div className="space-y-2">
                                        <div className="flex gap-4">
                                            <div className="h-3 w-20 rounded bg-[#8C9A9E]"></div>
                                            <div className="h-3 w-32 rounded bg-[#8C9A9E]"></div>
                                            <div className="h-3 w-16 rounded bg-[#20E2CD]"></div>
                                        </div>
                                        <div className="flex gap-4">
                                            <div className="h-3 w-20 rounded bg-[#8C9A9E]"></div>
                                            <div className="h-3 w-32 rounded bg-[#8C9A9E]"></div>
                                            <div className="h-3 w-16 rounded bg-[#20E2CD]"></div>
                                        </div>
                                        <div className="flex gap-4">
                                            <div className="h-3 w-20 rounded bg-[#8C9A9E]"></div>
                                            <div className="h-3 w-32 rounded bg-[#8C9A9E]"></div>
                                            <div className="h-3 w-16 rounded bg-[#20E2CD]"></div>
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

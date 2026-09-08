import { Head } from '@inertiajs/react';
import { House, ShieldX, FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BackButton from '@/components/navigation/back-button';

interface ErrorPageProps extends Record<string, unknown> {
    status: number;
}

const errorConfig: Record<number, { title: string; description: string }> = {
    403: {
        title: 'Access denied',
        description:
            "You don't have permission to view this page. If you think this is a mistake, ask an administrator or your project manager for access.",
    },
    404: {
        title: 'Page not found',
        description:
            "The page you're looking for doesn't exist or may have been moved, archived, or deleted.",
    },
};

export default function ErrorPage({ status }: ErrorPageProps) {
    const config = errorConfig[status] ?? {
        title: 'Something went wrong',
        description: 'An unexpected error occurred. Please try again.',
    };
    const Icon = status === 403 ? ShieldX : FileQuestion;

    return (
        <>
            <Head title={`${status} · ${config.title}`} />

            <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center">
                {/* Giant faded status code backdrop */}
                <div className="pointer-events-none fixed inset-0 flex items-center justify-center overflow-hidden">
                    <span className="select-none font-mono text-[38vw] leading-none font-black text-muted-foreground/[0.04] sm:text-[26vw]">
                        {status}
                    </span>
                </div>

                <div className="relative z-10 flex max-w-md flex-col items-center gap-5">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-card shadow-sm">
                        <Icon className="h-8 w-8 text-muted-foreground" />
                    </div>

                    <div className="space-y-1.5">
                        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                            Error {status}
                        </p>
                        <h1 className="text-2xl font-bold tracking-tight">{config.title}</h1>
                        <p className="text-sm text-muted-foreground">{config.description}</p>
                    </div>

                    <div className="mt-2 flex items-center gap-2">
                        <BackButton defaultUrl="/dashboard" label="Go back" />
                        <Button asChild size="sm">
                            <a href="/dashboard">
                                <House className="mr-2 h-4 w-4" />
                                Dashboard
                            </a>
                        </Button>
                    </div>
                </div>

                <p className="absolute bottom-6 text-[11px] text-muted-foreground/60">
                    Error code: {status}
                </p>
            </div>
        </>
    );
}

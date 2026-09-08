import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Calendar, CheckCircle2, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface DigestItem {
    id: number;
    title: string;
    assignee: string;
    project: string;
    due_date: string;
    days_overdue?: number;
    days_until_due?: number;
    completed_at?: string;
    url: string;
}

interface DigestStats {
    overdue_count: number;
    due_today_count: number;
    upcoming_count: number;
    completed_today_count: number;
}

interface DigestPageProps {
    stats: DigestStats;
    overdue_items: DigestItem[];
    due_today_items: DigestItem[];
    upcoming_items: DigestItem[];
    completed_today_items: DigestItem[];
}

const ROW_CAP = 5;

function DigestRow({ item, accentClass, badge }: { item: DigestItem; accentClass: string; badge: React.ReactNode }) {
    return (
        <div
            className={cn(
                'flex items-center justify-between gap-4 border-l-2 py-2.5 pl-3 pr-1 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/60',
                accentClass
            )}
        >
            <div className="min-w-0 flex-1">
                <Link href={item.url} className="truncate text-sm font-medium hover:underline">
                    {item.title}
                </Link>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{item.assignee}</span>
                    <span>•</span>
                    <span>{item.project}</span>
                    {item.due_date && (
                        <>
                            <span>•</span>
                            <span>Due {item.due_date}</span>
                        </>
                    )}
                </div>
            </div>
            <div className="shrink-0">{badge}</div>
        </div>
    );
}

function DigestSection({
    title,
    icon,
    count,
    items,
    accentClass,
    renderBadge,
    defaultOpen = true,
    sortFn,
}: {
    title: string;
    icon: React.ReactNode;
    count: number;
    items: DigestItem[];
    accentClass: string;
    renderBadge: (item: DigestItem) => React.ReactNode;
    defaultOpen?: boolean;
    sortFn: (a: DigestItem, b: DigestItem) => number;
}) {
    const [open, setOpen] = useState(defaultOpen);
    const [expanded, setExpanded] = useState(false);

    if (count === 0) return null;

    const sorted = [...items].sort(sortFn);
    const visible = expanded ? sorted : sorted.slice(0, ROW_CAP);
    const remaining = sorted.length - visible.length;

    return (
        <Card>
            <CardHeader
                className="cursor-pointer select-none py-4"
                onClick={() => setOpen((o) => !o)}
            >
                <CardTitle className="flex items-center justify-between text-sm font-semibold">
                    <span className="flex items-center gap-2">
                        {icon}
                        {title}
                        <span className="font-normal text-muted-foreground">({count})</span>
                    </span>
                    {open ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                </CardTitle>
            </CardHeader>
            {open && (
                <CardContent className="pt-0">
                    <div className="divide-y">
                        {visible.map((item) => (
                            <DigestRow key={item.id} item={item} accentClass={accentClass} badge={renderBadge(item)} />
                        ))}
                    </div>
                    {remaining > 0 && (
                        <button
                            onClick={() => setExpanded(true)}
                            className="mt-2 text-sm font-medium text-blue-600 hover:underline"
                        >
                            Show {remaining} more
                        </button>
                    )}
                    {expanded && sorted.length > ROW_CAP && (
                        <button
                            onClick={() => setExpanded(false)}
                            className="mt-2 text-sm font-medium text-muted-foreground hover:underline"
                        >
                            Show less
                        </button>
                    )}
                </CardContent>
            )}
        </Card>
    );
}

export default function Digest({
    stats,
    overdue_items,
    due_today_items,
    upcoming_items,
    completed_today_items,
}: DigestPageProps) {
    const isEmpty =
        overdue_items.length === 0 &&
        due_today_items.length === 0 &&
        upcoming_items.length === 0 &&
        completed_today_items.length === 0;

    return (
        <AppLayout>
            <Head title="Daily Digest" />

            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Daily Digest</h1>
                    <p className="text-sm text-muted-foreground">
                        Last updated:{' '}
                        {new Date().toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                        })}
                    </p>
                </div>

                {/* Stats strip */}
                <div className="grid gap-3 sm:grid-cols-4">
                    {[
                        { label: 'Overdue', value: stats.overdue_count, icon: AlertCircle, color: 'text-red-600' },
                        { label: 'Due Today', value: stats.due_today_count, icon: AlertCircle, color: 'text-orange-600' },
                        { label: 'Due This Week', value: stats.upcoming_count, icon: Calendar, color: 'text-blue-600' },
                        { label: 'Completed Today', value: stats.completed_today_count, icon: CheckCircle2, color: 'text-green-600' },
                    ].map(({ label, value, icon: Icon, color }) => (
                        <Card key={label} className="border-sidebar-border/70">
                            <CardContent className="flex items-center justify-between py-4">
                                <div>
                                    <p className="text-xs text-muted-foreground">{label}</p>
                                    <p className={cn('text-2xl font-bold', color)}>{value}</p>
                                </div>
                                <Icon className={cn('h-5 w-5 opacity-70', color)} />
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <DigestSection
                    title="Overdue"
                    icon={<AlertCircle className="h-4 w-4 text-red-600" />}
                    count={overdue_items.length}
                    items={overdue_items}
                    accentClass="border-l-red-500"
                    sortFn={(a, b) => (b.days_overdue ?? 0) - (a.days_overdue ?? 0)}
                    renderBadge={(item) => (
                        <Badge variant="destructive" className="whitespace-nowrap">
                            {item.days_overdue}d overdue
                        </Badge>
                    )}
                />

                <DigestSection
                    title="Due Today"
                    icon={<AlertCircle className="h-4 w-4 text-orange-600" />}
                    count={due_today_items.length}
                    items={due_today_items}
                    accentClass="border-l-orange-500"
                    sortFn={() => 0}
                    renderBadge={() => (
                        <Badge className="whitespace-nowrap bg-orange-500 hover:bg-orange-600">Due Today</Badge>
                    )}
                />

                <DigestSection
                    title="Due This Week"
                    icon={<Clock className="h-4 w-4 text-blue-600" />}
                    count={upcoming_items.length}
                    items={upcoming_items}
                    accentClass="border-l-blue-500"
                    sortFn={(a, b) => (a.days_until_due ?? 0) - (b.days_until_due ?? 0)}
                    renderBadge={(item) => (
                        <Badge variant="outline" className="whitespace-nowrap border-blue-300 text-blue-600">
                            {item.days_until_due}d left
                        </Badge>
                    )}
                />

                <DigestSection
                    title="Completed Today"
                    icon={<CheckCircle2 className="h-4 w-4 text-green-600" />}
                    count={completed_today_items.length}
                    items={completed_today_items}
                    accentClass="border-l-green-500"
                    defaultOpen={false}
                    sortFn={() => 0}
                    renderBadge={() => (
                        <Badge className="whitespace-nowrap bg-green-500 hover:bg-green-600">Completed</Badge>
                    )}
                />

                {isEmpty && (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <CheckCircle2 className="mb-4 h-12 w-12 text-green-500" />
                            <h3 className="text-lg font-medium">All caught up!</h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                                No pending items or activity to report today.
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
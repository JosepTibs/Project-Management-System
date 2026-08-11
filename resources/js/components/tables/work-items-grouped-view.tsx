import { Link } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Plus } from 'lucide-react';
import type { WorkItem, WorkItemGroup } from '@/pages/projects/show';

interface WorkItemsGroupedViewProps {
    workItems: WorkItem[];
    projectId: number;
    groups: WorkItemGroup[];
}

export function WorkItemsGroupedView({ workItems, projectId, groups }: WorkItemsGroupedViewProps) {
    function getPriorityVariant(priority: string) {
        switch (priority) {
            case 'critical': return 'destructive' as const;
            case 'high': return 'default' as const;
            case 'medium': return 'secondary' as const;
            case 'low': return 'outline' as const;
            default: return 'outline' as const;
        }
    }

    return (
        <>
            {workItems.length > 0 ? (
                <div className="space-y-3">
                    {groups.map((group) => {
                        const groupItems = workItems.filter((item) => item.group_id === group.id);
                        if (groupItems.length === 0) return null;
                        return (
                            <Collapsible key={group.id} defaultOpen={true}>
                                <div className="rounded-lg border">
                                    <CollapsibleTrigger asChild>
                                        <div className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors select-none">
                                            <div className="flex items-center gap-2">
                                                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 data-[state=open]:rotate-180" />
                                                <span className="text-sm font-medium">{group.name}</span>
                                                <span className="text-xs text-muted-foreground">({groupItems.length})</span>
                                            </div>
                                            {group.end_date && (
                                                <span className="text-xs text-muted-foreground">Due {group.end_date}</span>
                                            )}
                                        </div>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                        <div className="overflow-x-auto border-t">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Title</TableHead>
                                                        <TableHead>Priority</TableHead>
                                                        <TableHead>Due Date</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {groupItems.map((item: WorkItem) => (
                                                        <TableRow key={item.id}>
                                                            <TableCell className="text-sm font-medium">
                                                                <Link href={`/projects/${projectId}/work-items/${item.id}`} className="text-sm font-medium hover:underline leading-tight">
                                                                    {item.title}
                                                                </Link>
                                                            </TableCell>
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
                                    </CollapsibleContent>
                                </div>
                            </Collapsible>
                        );
                    })}
                    {workItems.filter((item) => item.group_id === null).length > 0 && (
                        <div className="rounded-lg border">
                            <div className="flex items-center gap-2 px-3 py-2 bg-muted/30">
                                <span className="text-sm font-medium">Ungrouped</span>
                                <span className="text-xs text-muted-foreground">
                                    ({workItems.filter((item) => item.group_id === null).length})
                                </span>
                            </div>
                            <div className="overflow-x-auto border-t">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Title</TableHead>
                                            <TableHead>Priority</TableHead>
                                            <TableHead>Due Date</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {workItems.filter((item) => item.group_id === null).map((item: WorkItem) => (
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
                        </div>
                    )}
                </div>
            ) : (
                <div className="py-8 text-center text-sm text-muted-foreground">
                    No work items yet.
                </div>
            )}
        </>
    );
}

import { Head, Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { type NestedMilestone, type StatusOption, type UserOption, type WorkItemStatusOption } from '@/components/projects/project-setup-sheet';
import ProjectSetupSheet from '@/components/projects/project-setup-sheet';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ArrowLeft, Users, FileText, Settings, Target, ChevronDown, BarChart3, Columns3, Calendar, Paperclip } from 'lucide-react';
import KanbanBoard from '@/components/kanban/kanban-board';
import InteractiveGanttChart from '@/components/interactive-gantt-chart';
import CalendarView from '@/components/calendar-view';
import FileAttachmentList from '@/components/attachments/file-attachment-list';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

function getPriorityVariant(priority: string) {
  switch (priority) {
    case 'critical': return 'destructive' as const;
    case 'high': return 'default' as const;
    case 'medium': return 'secondary' as const;
    default: return 'outline' as const;
  }
}

export default function ShowProject() {
  const { project, setup, columns, statuses, workItems, attachments } = usePage<any>().props;
  const [editOpen, setEditOpen] = useState(false);

  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Projects', href: '/projects' },
    { title: project.name, href: `/projects/${project.id}` },
  ];

  const totalItems = project.work_items.length;
  const progressPercent = Math.min(100, Math.round(project.completion_percentage || 0));

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={project.name} />

      <div className="flex h-full min-w-0 flex-1 flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
        {/* Header Section */}
        <div className="flex flex-col gap-4 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => window.history.back()} className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs uppercase px-2 py-0.5 rounded bg-muted text-muted-foreground">
                  {project.item_prefix}
                </span>
                <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
                {project.status_name && (
                  <Badge variant="outline" className="ml-2">{project.status_name}</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Created by {project.creator_name || 'Unknown'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <Settings className="mr-2 h-4 w-4" />
              Setup
            </Button>
          </div>
        </div>

        {/* Tabbed View Navigation */}
        <Tabs defaultValue="overview" className="w-full">
          <div className="flex items-center justify-between border-b pb-2">
            <TabsList className="bg-transparent p-0 gap-2">
              <TabsTrigger value="overview" className="data-[state=active]:bg-muted">Overview</TabsTrigger>
              <TabsTrigger value="kanban" className="data-[state=active]:bg-muted">
                <Columns3 className="mr-1.5 h-3.5 w-3.5" /> Kanban
              </TabsTrigger>
              <TabsTrigger value="gantt" className="data-[state=active]:bg-muted">
                <BarChart3 className="mr-1.5 h-3.5 w-3.5" /> Gantt
              </TabsTrigger>
              <TabsTrigger value="calendar" className="data-[state=active]:bg-muted">
                <Calendar className="mr-1.5 h-3.5 w-3.5" /> Calendar
              </TabsTrigger>
              <TabsTrigger value="documents" className="data-[state=active]:bg-muted">
                <Paperclip className="mr-1.5 h-3.5 w-3.5" /> Documents
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              <Link href={`/projects/${project.id}/work-items`}>
                <Button variant="ghost" size="sm" className="h-8 text-xs">All Items</Button>
              </Link>
            </div>
          </div>

          {/* Overview View */}
          <TabsContent value="overview" className="pt-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left/Main Column (2 cols) */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Work Item Groups Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <FileText className="h-4 w-4" /> Work Item Groups
                    </h3>
                    <span className="text-xs text-muted-foreground">{totalItems} Total Items</span>
                  </div>

                  {project.work_item_groups.map((group: any) => {
                    const groupItems = project.work_items.filter((i: any) => i.group_id === group.id);
                    if (groupItems.length === 0) return null;

                    return (
                      <Collapsible key={group.id} defaultOpen className="rounded-lg border bg-card">
                        <CollapsibleTrigger asChild>
                          <div className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors select-none">
                            <div className="flex items-center gap-2">
                              <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 data-[state=open]:rotate-180" />
                              <span className="font-medium text-sm">{group.name}</span>
                              <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{groupItems.length}</Badge>
                            </div>
                            {group.end_date && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" /> Due {group.end_date}
                              </span>
                            )}
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-muted/20 hover:bg-muted/20">
                                <TableHead className="w-[60%]">Title</TableHead>
                                <TableHead>Priority</TableHead>
                                <TableHead className="text-right">Due Date</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {groupItems.map((item: any) => (
                                <TableRow key={item.id}>
                                  <TableCell className="font-medium text-sm">
                                    <Link href={`/projects/${project.id}/work-items/${item.id}`} className="hover:underline">
                                      {item.title}
                                    </Link>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant={getPriorityVariant(item.priority)} className="capitalize text-[10px]">
                                      {item.priority}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right text-xs text-muted-foreground">{item.due_date || '—'}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  })}
                </div>

                {/* Milestones Section */}
                <div className="space-y-3 pt-2">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Target className="h-4 w-4" /> Milestones ({project.milestones.length})
                  </h3>

                  <div className="grid gap-3">
                    {project.milestones.map((m: any) => (
                      <div key={m.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-lg border bg-card gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{m.name}</span>
                            <Badge variant={m.completed_at ? 'default' : 'outline'} className="text-[10px]">
                              {m.completed_at ? 'Done' : 'Active'}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1">{m.description || 'No description provided.'}</p>
                        </div>
                        <div className="flex items-center gap-4 shrink-0">
                          <span className="text-xs text-muted-foreground">{m.start_date} → {m.target_date}</span>
                          <div className="w-20 bg-secondary rounded-full h-1.5">
                            <div className="bg-primary rounded-full h-1.5 transition-all" style={{ width: `${Math.min(100, m.completion_percentage)}%` }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Sidebar (1 col) */}
              <div className="space-y-6">
                
                {/* Progress Overview */}
                <div className="p-4 rounded-lg border bg-card space-y-3">
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Project Health</h4>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Overall Progress</span>
                      <span className="font-semibold">{progressPercent}%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div className="bg-primary rounded-full h-2 transition-all" style={{ width: `${progressPercent}%` }} />
                    </div>
                  </div>
                  {project.description && (
                    <p className="text-xs text-muted-foreground pt-2 border-t mt-2">{project.description}</p>
                  )}
                </div>

                {/* Team Members List */}
                <div className="p-4 rounded-lg border bg-card space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" /> Team ({project.members.length})
                    </h4>
                  </div>
                  <div className="divide-y divide-border">
                    {project.members.map((member: any) => (
                      <div key={member.id} className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className="text-[10px] uppercase">{member.user_name?.substring(0, 2)}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <Link href={`/users/${member.user_id}`} className="text-xs font-medium hover:underline">
                              {member.user_name}
                            </Link>
                            <span className="text-[10px] text-muted-foreground truncate max-w-[140px]">{member.user_email}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          </TabsContent>

          {/* Kanban Tab */}
          <TabsContent value="kanban" className="pt-4">
            <div className="p-4 rounded-lg border bg-card h-full">
              <KanbanBoard columns={columns} statuses={statuses} />
            </div>
          </TabsContent>

          {/* Gantt Tab */}
          <TabsContent value="gantt" className="pt-4">
            <div className="p-4 rounded-lg border bg-card">
              <InteractiveGanttChart
                projectId={project.id}
                workItems={workItems || []}
                milestones={project.milestones || []}
                workItemGroups={(project.work_item_groups || []).map((g: any) => ({
                  ...g,
                  completion_percentage: g.completion_percentage || 0,
                }))}
              />
            </div>
          </TabsContent>

          {/* Calendar Tab */}
          <TabsContent value="calendar" className="pt-4">
            <div className="p-4 rounded-lg border bg-card">
              <CalendarView
                workItems={(workItems || []).map((i: any) => ({
                  ...i,
                  due_date: i.due_date,
                  progress: i.progress ?? 0,
                }))}
                milestones={project.milestones || []}
              />
            </div>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="pt-4">
            {attachments && attachments.length > 0 ? (
              <div className="space-y-4">
                {/* Group attachments by work item */}
                {Object.entries(
                  attachments.reduce((acc: Record<string, any>, attachment: any) => {
                    const key = String(attachment.work_item_id);
                    if (!acc[key]) {
                      acc[key] = {
                        workItemId: attachment.work_item_id,
                        workItemTitle: attachment.work_item_title,
                        attachments: [],
                      };
                    }
                    acc[key].attachments.push(attachment);
                    return acc;
                  }, {})
                ).map(([key, group]: [string, any]) => (
                  <Card key={key}>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <Link 
                          href={`/projects/${project.id}/work-items/${group.workItemId}`}
                          className="hover:underline text-primary"
                        >
                          {group.workItemTitle || `Work Item #${group.workItemId}`}
                        </Link>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <FileAttachmentList 
                        attachments={group.attachments} 
                        authUserId={usePage<any>().props.auth?.user?.id} 
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Paperclip className="h-4 w-4" />
                    Project Documents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">No documents attached to this project.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Setup Modal/Sheet */}
        {setup && (
          <ProjectSetupSheet
            open={editOpen}
            onOpenChange={setEditOpen}
            mode="edit"
            project={{
              name: project.name,
              description: project.description,
              item_prefix: project.item_prefix,
              start_date: project.start_date,
              end_date: project.end_date,
            }}
            statusName={project.status_name ?? ''}
            statuses={setup.statuses}
            allUsers={setup.allUsers}
            workItemStatuses={setup.workItemStatuses}
            initialMemberIds={setup.memberIds}
            initialMilestones={setup.milestones}
            onSuccess={() => setEditOpen(false)}
          />
        )}
      </div>
    </AppLayout>
  );
}
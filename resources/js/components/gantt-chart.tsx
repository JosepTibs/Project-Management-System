import React from 'react';
import { Gantt, Task, ViewMode } from 'gantt-task-react';
import 'gantt-task-react/dist/index.css';

interface Milestone {
    id: number;
    name: string;
    description: string;
    start_date: string;
    target_date: string;
    completed_at: string | null;
    completion_percentage: number;
    order: number;
}

interface WorkItemGroup {
    id: number;
    name: string;
    description: string;
    start_date: string;
    end_date: string;
    milestone_id: number | null;
}

interface GanttChartProps {
    milestones: Milestone[];
    workItemGroups: WorkItemGroup[];
}

function formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const TaskListHeader: React.FC<{
    headerHeight: number;
    rowWidth: string;
    fontFamily: string;
    fontSize: string;
}> = ({ headerHeight, rowWidth, fontFamily, fontSize }) => {
    return (
        <div
            style={{
                fontFamily,
                fontSize,
                height: headerHeight - 1,
            }}
            className="flex items-center border-b bg-muted/30 text-muted-foreground text-xs uppercase tracking-wider font-medium"
        >
            <div
                className="flex items-center px-3 h-full border-r"
                style={{ width: rowWidth }}
            >
                Name
            </div>
            <div className="flex items-center px-3 h-full">
                Deadline
            </div>
        </div>
    );
};

const TaskListTable: React.FC<{
    rowHeight: number;
    rowWidth: string;
    fontFamily: string;
    fontSize: string;
    locale: string;
    tasks: Task[];
    selectedTaskId: string;
    setSelectedTask: (taskId: string) => void;
    onExpanderClick: (task: Task) => void;
}> = ({ rowHeight, rowWidth, fontFamily, fontSize, tasks, selectedTaskId, setSelectedTask }) => {
    return (
        <div style={{ fontFamily, fontSize }}>
            {tasks.map((task) => {
                const isSelected = task.id === selectedTaskId;
                return (
                    <div
                        key={task.id}
                        className={`flex items-center border-b cursor-pointer transition-colors ${
                            isSelected ? 'bg-accent' : 'hover:bg-muted/50'
                        }`}
                        style={{ height: rowHeight - 1 }}
                        onClick={() => setSelectedTask(task.id)}
                    >
                        <div
                            className="flex items-center gap-2 px-3 h-full border-r overflow-hidden"
                            style={{ width: rowWidth }}
                        >
                            <span
                                className={`w-2 h-2 rounded-full shrink-0 ${
                                    task.type === 'milestone' ? 'bg-amber-500' : 'bg-indigo-500'
                                }`}
                            />
                            <span className="truncate text-foreground text-sm">{task.name}</span>
                            {task.type === 'milestone' && (
                                <span className="text-[10px] uppercase tracking-wider text-amber-600 dark:text-amber-400 font-medium shrink-0">
                                    Milestone
                                </span>
                            )}
                        </div>
                        <div className="flex items-center px-3 h-full text-xs text-muted-foreground">
                            {task.type === 'milestone'
                                ? formatDate(task.end)
                                : `${formatDate(task.start)} – ${formatDate(task.end)}`
                            }
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export function GanttChart({ milestones, workItemGroups }: GanttChartProps) {
    const tasks: Task[] = [
        // Add work item groups as tasks
        ...workItemGroups.map((group) => ({
            id: `group-${group.id}`,
            name: group.name,
            start: new Date(group.start_date),
            end: new Date(group.end_date),
            progress: 0,
            type: 'task' as const,
            isDisabled: true,
            styles: {
                backgroundColor: '#6366f1',
                backgroundSelectedColor: '#818cf8',
                progressColor: '#4f46e5',
                progressSelectedColor: '#6366f1',
            },
        })),
        // Add milestones
        ...milestones.map((milestone) => ({
            id: `milestone-${milestone.id}`,
            name: milestone.name,
            start: new Date(milestone.start_date),
            end: new Date(milestone.target_date),
            progress: milestone.completed_at ? 100 : 0,
            type: 'milestone' as const,
            isDisabled: true,
            styles: {
                backgroundColor: '#f59e0b',
                backgroundSelectedColor: '#fbbf24',
                progressColor: '#d97706',
                progressSelectedColor: '#f59e0b',
            },
        })),
    ];

    return (
        <>
            {tasks.length > 0 ? (
                <div className="w-full max-w-full overflow-x-auto rounded-lg border">
                    <div className="inline-block min-w-full">
                        <Gantt
                            tasks={tasks}
                            viewMode={ViewMode.Month}
                            columnWidth={80}
                            listCellWidth="160px"
                            rowHeight={40}
                            barCornerRadius={4}
                            barFill={70}
                            todayColor="rgba(99, 102, 241, 0.06)"
                            TaskListHeader={TaskListHeader}
                            TaskListTable={TaskListTable}
                            TooltipContent={({ task }) => (
                                <div className="rounded-md bg-popover px-3 py-2 text-xs shadow-md border">
                                    <p className="font-medium text-popover-foreground">{task.name}</p>
                                    <p className="text-muted-foreground">
                                        {task.type === 'milestone'
                                            ? `Due: ${formatDate(task.end)}`
                                            : `${formatDate(task.start)} – ${formatDate(task.end)}`
                                        }
                                    </p>
                                    {task.type === 'task' && (
                                        <p className="text-muted-foreground">Progress: {task.progress}%</p>
                                    )}
                                </div>
                            )}
                        />
                    </div>
                </div>
            ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">No timeline data available.</p>
            )}
        </>
    );
}

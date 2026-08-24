import { Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts';

export interface TrendPoint {
    week: string;
    created: number;
    completed: number;
}

interface TrendChartProps {
    data: TrendPoint[];
    height?: number;
    className?: string;
}

const tickStyle = {
    fill: 'var(--muted-foreground)',
    fontSize: 11,
} as const;

/**
 * Zoho-reports-like area chart comparing work items created vs completed per week.
 * Each series gets a distinct stackId so they render as two independent lines
 * rather than a single stacked shape.
 */
export function TrendChart({ data, height = 260 }: TrendChartProps) {
    return (
        <AreaChart
            data={data}
            height={height}
            margin={{ top: 10, right: 16, bottom: 24, left: 0 }}
        >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
                dataKey="week"
                axisLine={false}
                tickLine={false}
                tickMargin={8}
                tick={tickStyle}
            />
            <YAxis width={36} axisLine={false} tickLine={false} tick={tickStyle} />
            <Area
                dataKey="created"
                name="Created"
                stackId="created"
                type="monotone"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.35}
                strokeWidth={2}
                activeDot={{ r: 4 }}
                animationDuration={400}
            />
            <Area
                dataKey="completed"
                name="Completed"
                stackId="completed"
                type="monotone"
                stroke="#8b5cf6"
                fill="#8b5cf6"
                fillOpacity={0.35}
                strokeWidth={2}
                activeDot={{ r: 4 }}
                animationDuration={400}
            />
            <Tooltip
                contentStyle={{
                    background: 'var(--popover)',
                    border: '1px solid var(--border)',
                    borderRadius: 6,
                    color: 'var(--popover-foreground)',
                    fontSize: 12,
                }}
            />
        </AreaChart>
    );
}
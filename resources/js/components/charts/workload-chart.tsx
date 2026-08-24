import { Bar, BarChart, CartesianGrid, Cell, Tooltip, XAxis, YAxis } from 'recharts';

export interface WorkloadDatum {
    name: string;
    value: number;
    color?: string;
}

interface WorkloadChartProps {
    data: WorkloadDatum[];
    height?: number;
}

const DEFAULT_BAR = '#10b981';
const OVERLOAD_BAR = '#e11d48';

const tickStyle = {
    fill: 'var(--muted-foreground)',
    fontSize: 11,
} as const;

// Rotated category labels are right-anchored to the tick so they don't clip
// against the left plot edge when the card is narrow.
const xTickStyle = {
    ...tickStyle,
    textAnchor: 'end' as const,
};

const overloadThreshold = (counts: number[]) => {
    const values = counts.filter((value) => value > 0);
    if (values.length === 0) {
        return Number.NaN;
    }
    const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
    return avg * 1.5;
};

/**
 * Column chart of open/assigned tasks per team member. Bars above the overload
 * threshold (1.5x the average workload) are highlighted in a destructive color
 * so overloaded members stand out (similar to Zoho's resource-load widgets).
 */
export function WorkloadChart({ data, height = 240 }: WorkloadChartProps) {
    const threshold = overloadThreshold(data.map((datum) => datum.value));

    const themed = data.map((datum) => ({
        ...datum,
        fill:
            datum.color ??
            (threshold > 0 && datum.value > threshold ? OVERLOAD_BAR : DEFAULT_BAR),
    }));

    return (
        <BarChart
            data={themed}
            height={height}
            margin={{ top: 10, right: 12, bottom: 40, left: 0 }}
        >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                interval={0}
                angle={-20}
                tickMargin={8}
                height={50}
                tick={xTickStyle}
            />
            <YAxis width={34} axisLine={false} tickLine={false} tick={tickStyle} allowDecimals={false} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} animationDuration={400} />
            <Tooltip
                cursor={{ fill: 'var(--muted)', opacity: 0.4 }}
                contentStyle={{
                    background: 'var(--popover)',
                    border: '1px solid var(--border)',
                    borderRadius: 6,
                    color: 'var(--popover-foreground)',
                    fontSize: 12,
                }}
            />
            {themed.map((datum, index) => (
                <Cell key={index} fill={datum.fill} />
            ))}
        </BarChart>
    );
}
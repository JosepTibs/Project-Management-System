import { Cell, Pie, PieChart, Tooltip } from 'recharts';

import { cn } from '@/lib/utils';

export interface DonutDatum {
    name: string;
    value: number;
    color?: string;
}

interface DonutChartProps {
    data: DonutDatum[];
    colors?: string[];
    height?: number;
    centerValue?: string;
    centerLabel?: string;
    className?: string;
}

const DEFAULT_COLORS = ['#10b981', '#f59e0b', '#e11d48', '#8b5cf6'];

/**
 * Zoho-style donut chart rendered with Recharts. Each datum is colored by its
 * own `color` (falling back to the shared palette), so the sector order always
 * matches the data order — no color/label mismatch.
 */
export function DonutChart({
    data,
    colors = DEFAULT_COLORS,
    height = 220,
    centerValue,
    centerLabel,
    className,
}: DonutChartProps) {
    const themed = data.map((datum, index) => ({
        ...datum,
        fill: datum.color ?? colors[index % colors.length],
    }));

    const hasData = themed.some((datum) => datum.value > 0);

    if (!hasData) {
        return (
            <p className="text-sm text-center text-muted-foreground">No data to show.</p>
        );
    }

    return (
        <div
            className={cn('relative mx-auto flex items-center justify-center', className)}
            style={{ width: 220, height }}
        >
            <PieChart
                data={themed}
                width={220}
                height={height}
                margin={{ top: 4, right: 4, bottom: 4, left: 4 }}
            >
                <Pie dataKey="value" nameKey="name" innerRadius={52} outerRadius={88} paddingAngle={3} />
                <Tooltip
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
            </PieChart>

            {(centerValue != null || centerLabel) && (
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    {centerValue != null && (
                        <div className="text-2xl font-bold leading-none">{centerValue}</div>
                    )}
                    {centerLabel && (
                        <div className="text-xs text-muted-foreground mt-1">{centerLabel}</div>
                    )}
                </div>
            )}
        </div>
    );
}

interface DonutLegendProps {
    data: DonutDatum[];
    /** Optional formatted value mapper, e.g. (datum) => datum.value */
    formatValue?: (datum: DonutDatum) => string | number;
    className?: string;
}

export function DonutLegend({ data, formatValue = (datum) => datum.value, className }: DonutLegendProps) {
    const colors = DEFAULT_COLORS;

    return (
        <div className={cn('space-y-2', className)}>
            {data.map((datum, index) => (
                <div key={datum.name} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">
                        <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: datum.color ?? colors[index % colors.length] }}
                        />
                        <span className="capitalize">{datum.name}</span>
                    </span>
                    <span className="font-medium">{formatValue(datum)}</span>
                </div>
            ))}
        </div>
    );
}
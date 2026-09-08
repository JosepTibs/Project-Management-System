import { useId } from 'react';

import { AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function DateField({
    label,
    value,
    onChange,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
}) {
    const id = useId();

    return (
        <div className="min-w-0 space-y-2">
            <Label htmlFor={id}>{label}</Label>

            <Input
                id={id}
                type="date"
                className=" w-[10.5rem] w-full"
                value={value}
                onChange={(event) => onChange(event.target.value)}
            />
        </div>
    );
}

export function Summary({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                {label}
            </p>

            <p className="mt-1 text-sm font-medium">{value}</p>
        </div>
    );
}

export function ErrorMessage({ message }: { message: string }) {
    return (
        <div
            role="alert"
            aria-live="assertive"
            className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200"
        >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />

            <p className="text-sm">{message}</p>
        </div>
    );
}
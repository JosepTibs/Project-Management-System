import { Check } from 'lucide-react';

import { STEP_LABELS, type Step } from './types';

/*
 * Four-step progress strip for the project setup wizard.
 * Extracted from project-setup-sheet.tsx (lines 2565-2641); steps already
 * reached are clickable, future steps are disabled, and completed steps
 * show a check mark with an optional per-step issue count badge.
 */
export function SetupProgressIndicator({
    step,
    maxVisited,
    issueCounts = { 1: 0, 2: 0, 3: 0, 4: 0 },
    onStepSelect,
}: {
    step: Step;
    maxVisited: Step;
    issueCounts?: Record<Step, number>;
    onStepSelect: (step: Step) => void;
}) {
    return (
        <div
            className="mt-4 grid grid-cols-4 gap-2"
            aria-label="Project setup progress"
        >
            {([1, 2, 3, 4] as Step[]).map((item) => {
                const active = item === step;
                const complete = item < step;
                const count = issueCounts[item] ?? 0;
                // A step is reachable if the user has already visited it.
                const reachable = item <= maxVisited;

                return (
                    <button
                        key={item}
                        type="button"
                        onClick={() => reachable && onStepSelect(item)}
                        disabled={!reachable}
                        aria-current={active ? 'step' : undefined}
                        className={`relative rounded-lg border px-3 py-2 text-left transition-colors ${
                            active
                                ? 'border-primary bg-primary/5'
                                : 'hover:bg-muted/50'
                        } ${
                            !reachable
                                ? 'cursor-not-allowed opacity-50'
                                : ''
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            <span
                                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                                    complete || active
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted text-muted-foreground'
                                }`}
                            >
                                {complete ? (
                                    <Check className="h-3.5 w-3.5" />
                                ) : (
                                    item
                                )}
                            </span>

                            <span className="text-sm font-medium">
                                {STEP_LABELS[item]}
                            </span>
                        </div>

                        {count > 0 && (
                            <span className="absolute top-2 right-2 rounded-full border border-red-300 bg-red-50 px-1.5 text-[11px] font-medium text-red-600 dark:border-red-700 dark:bg-red-950/60 dark:text-red-300">
                                {count}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
import * as CollapsiblePrimitive from '@radix-ui/react-collapsible';
import { cn } from '@/lib/utils';

const Collapsible = CollapsiblePrimitive.Root;

const CollapsibleTrigger = CollapsiblePrimitive.CollapsibleTrigger;

/**
 * Animated collapsible content. The `collapsible-content` class pairs with
 * the keyframes in app.css to smoothly animate height on open/close; Radix
 * exposes the measured height via `--radix-collapsible-content-height`.
 */
const CollapsibleContent = ({
    className,
    ...props
}: React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.CollapsibleContent>) => (
    <CollapsiblePrimitive.CollapsibleContent
        className={cn('collapsible-content overflow-hidden', className)}
        {...props}
    />
);

export { Collapsible, CollapsibleContent, CollapsibleTrigger };

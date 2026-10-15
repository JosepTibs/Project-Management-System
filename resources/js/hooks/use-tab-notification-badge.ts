import { useCallback, useEffect, useRef } from 'react';

const PREFIX_RE = /^\(\d+\+?\)\s*/;

function stripPrefix(title: string): string {
    return title.replace(PREFIX_RE, '');
}

function formatTitle(base: string, count: number): string {
    if (count <= 0) return base;
    const label = count > 99 ? '99+' : String(count);
    return `(${label}) ${base}`;
}

/**
 * Owns the browser-tab unread badge, e.g. `(3) Dashboard - App`.
 *
 * Inertia rewrites document.title on every navigation, so this hook watches
 * <title> with a MutationObserver: external writes become the new base,
 * own writes are ignored. Call setCount() from notification state owners.
 */
export function useTabNotificationBadge() {
    const baseRef = useRef<string>('');
    const countRef = useRef<number>(0);
    const writingRef = useRef(false);

    const render = useCallback(() => {
        if (typeof document === 'undefined') return;
        const next = formatTitle(baseRef.current, countRef.current);
        if (document.title !== next) {
            writingRef.current = true;
            document.title = next;
        }
    }, []);

    useEffect(() => {
        if (typeof document === 'undefined') return;
        baseRef.current = stripPrefix(document.title);
        render();

        const el = document.querySelector('title');
        if (!el) return;

        const observer = new MutationObserver(() => {
            if (writingRef.current) {
                writingRef.current = false;
                return;
            }
            baseRef.current = stripPrefix(document.title);
            render();
        });
        observer.observe(el, { childList: true, characterData: true, subtree: true });
        return () => {
            observer.disconnect();
            // Clear our prefix on unmount (e.g. logout) without touching the base title.
            countRef.current = 0;
            const clean = stripPrefix(document.title);
            if (document.title !== clean) {
                document.title = clean;
            }
        };
    }, [render]);

    const setCount = useCallback(
        (count: number) => {
            countRef.current = Math.max(0, Math.floor(count) || 0);
            render();
        },
        [render],
    );

    const reset = useCallback(() => {
        countRef.current = 0;
        render();
    }, [render]);

    return { setCount, reset };
}

/**
 * Shared role helpers. Keep these in sync with the backend gates in
 * AuthServiceProvider (User::isAdminLevel / isManagerRole / isMemberRole).
 *
 * Role tiers:
 *  - admin-level ("admin" / "superadmin"): full access, sees everything;
 *  - manager (any role containing "manager", e.g. "project manager"):
 *    scoped to projects they own (plus assigned/member visibility);
 *  - everyone else (member or no role): personal "My Tasks" view.
 */
export const isAdminLevel = (roles: string[] | undefined | null): boolean =>
    (roles ?? []).some((r) => ['admin', 'superadmin'].includes(r.toLowerCase()));

export const isManager = (roles: string[] | undefined | null): boolean =>
    !isAdminLevel(roles) && (roles ?? []).some((r) => r.toLowerCase().includes('manager'));

export const isMember = (roles: string[] | undefined | null): boolean =>
    !isAdminLevel(roles) && !isManager(roles);

import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem, type SharedData } from '@/types';
import { isAdminLevel } from '@/lib/roles';
import { Link, usePage } from '@inertiajs/react';
import { FolderKanban, LayoutGrid, LogOut, Users, FileText, ActivityIcon, Bell, User2, BarChart3 } from 'lucide-react';
import AppLogo from './app-logo';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        url: '/dashboard',
        icon: LayoutGrid,
    },
    {
        title: 'Projects',
        url: '/projects',
        icon: FolderKanban,
    },
    {
        title: 'Work Items',
        url: '/work-items',
        icon: FileText,
    },
    {
        title: 'Users',
        url: '/users',
        icon: Users,
        roles: ['superadmin', 'admin'],
    },
    {
        title: 'Activity Log',
        url: '/activity-logs',
        icon: ActivityIcon,
        roles: ['superadmin', 'admin'],
    },
    {
        title: 'Daily Digest',
        url: '/admin/digest',
        icon: BarChart3,
        roles: ['superadmin', 'admin', 'manager'],
    },
];

const footerNavItems: NavItem[] = [
    {
        title: "Profile",
        url: '/profile',
        icon: User2,
    },
    {
        title: 'Notifications',
        url: '/notifications',
        method: 'get',
        icon: Bell,
    },
    {
        title: 'Log Out',
        url: '/logout',
        method: 'post',
        icon: LogOut,
    },
];

export function AppSidebar() {
    const { auth } = usePage<SharedData>().props;

    const visibleNavItems = mainNavItems.filter((item) => {
        if (!item.roles) {
            return true;
        }
        // Admin-gated items: also let superadmins through via Gate::before.
        if (item.roles.includes('admin' )) {
            return isAdminLevel(auth?.roles);
        }
        return item.roles.some((role) => auth?.roles?.includes(role));
    });
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={visibleNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
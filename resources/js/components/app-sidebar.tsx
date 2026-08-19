import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { BookOpen, Folder, LayoutGrid, Users, Workflow, FileText, User, ActivityIcon, ActivitySquare } from 'lucide-react';
import AppLogo from './app-logo';

type pageProps = {
    auth: {
        user: {
            id: number;
            name: string;
            email: string;
        };
        roles: string [];
    };
};
const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        url: '/dashboard',
        icon: LayoutGrid,
    },
    {
        title: 'Profile',
        url: '/profile',
        icon: User,
    },
    {
        title: 'Users',
        url: '/users',
        icon: Users,
        roles: ['admin'],
    },
    {
        title: 'Projects',
        url: '/projects',
        icon: ActivitySquare,
        roles: ['admin']
    },
    {
        title: ' My Projects',
        url: '/projects',
        icon: Workflow,
        roles: ['member', 'project manager' ]

    },
    {
        title: 'Work Items',
        url: '/work-items',
        icon: FileText,
    },
    {
        title: 'Activity Log',
        url: '/activity-logs',
        icon: ActivityIcon,
        roles: ['admin']
    }
];

const footerNavItems: NavItem[] = [
    {
        title: 'Logout',
        url: '/logout',
        icon: Folder,
    },
    {
        title: 'Documentation',
        url: 'https://laravel.com/docs/starter-kits',
        icon: BookOpen,
    },
];

export function AppSidebar() {

    const { auth } = usePage<pageProps>().props;

    const visibleNavItems = mainNavItems.filter((item) => {
        if(!item.roles){
            return true;
        }
        return item.roles.some((role) => auth.roles.includes(role));
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
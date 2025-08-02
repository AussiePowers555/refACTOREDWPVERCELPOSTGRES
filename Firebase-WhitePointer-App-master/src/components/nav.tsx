
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSessionStorage } from "@/hooks/use-session-storage"
import {
    Sidebar,
    SidebarHeader,
    SidebarContent,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
} from "@/components/ui/sidebar"
import {
    Home,
    Briefcase,
    Bike,
    Banknote,
    FileText,
    Gem,
    Settings,
    MessageSquare,
    ClipboardCheck,
    Contact,
    Mail,
    LayoutGrid,
    Shield,
} from "lucide-react"

const mainNavItems = [
    { href: "/", label: "Dashboard", icon: Home, adminOnly: false },
    { href: "/workspaces", label: "Workspaces", icon: LayoutGrid, adminOnly: true },
    { href: "/cases", label: "Case Management", icon: Briefcase, adminOnly: false },
    { href: "/fleet", label: "Fleet Tracking", icon: Bike, adminOnly: true },
    { href: "/financials", label: "Financials", icon: Banknote, adminOnly: true },
    { href: "/commitments", label: "Commitments", icon: ClipboardCheck, adminOnly: true },
    { href: "/contacts", label: "Contacts", icon: Contact, adminOnly: true },
    { href: "/documents", label: "Documents", icon: FileText, adminOnly: false },
    { href: "/interactions", label: "Interactions", icon: MessageSquare, adminOnly: false },
    { href: "/ai-email", label: "AI Email", icon: Mail, adminOnly: true },
]

const settingsNavItems = [
    { href: "/admin", label: "User Management", icon: Shield, adminOnly: true },
    { href: "/subscriptions", label: "Subscriptions", icon: Gem, adminOnly: true },
    { href: "/settings", label: "Settings", icon: Settings, adminOnly: false },
]

export function Nav() {
    const [currentUser] = useSessionStorage<any>("currentUser", null);
    const isAdmin = currentUser?.role === "admin" || currentUser?.role === "developer";
    const pathname = usePathname()

    const rentalAgreementRegex = /^\/rental-agreement\/.*/;
    const isRentalAgreementPage = rentalAgreementRegex.test(pathname);
    const isFleetPage = pathname.startsWith('/fleet');

    return (
        <div className="flex h-full flex-col">
            <SidebarHeader>
                <Link href="/" className="flex items-center gap-2">
                    <Bike className="h-6 w-6 text-primary" />
                    <span className="text-lg font-semibold">PBikeRescue</span>
                </Link>
            </SidebarHeader>
            <SidebarContent className="flex-1">
                <SidebarMenu>
                    {mainNavItems
                        .filter(item => !item.adminOnly || isAdmin)
                        .map((item) => (
                        <SidebarMenuItem key={item.href}>
                            <SidebarMenuButton
                                asChild
                                isActive={pathname === item.href || (item.href === "/fleet" && isRentalAgreementPage)}
                            >
                                <Link href={item.href}>
                                    <item.icon />
                                    <span>{item.label}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarContent>
            <SidebarFooter>
                 <SidebarGroup>
                    <SidebarGroupLabel>Settings</SidebarGroupLabel>
                    <SidebarMenu>
                        {settingsNavItems
                            .filter(item => !item.adminOnly || isAdmin)
                            .map((item) => (
                             <SidebarMenuItem key={item.href}>
                                <SidebarMenuButton asChild isActive={pathname.startsWith(item.href)}>
                                    <Link href={item.href}>
                                        <item.icon />
                                        <span>{item.label}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarFooter>
        </div>
    )
}

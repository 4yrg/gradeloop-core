"use client"

import {
    BadgeCheck,
    Bell,
    ChevronsUpDown,
    LogOut,
    ShieldCheck,
} from "lucide-react"

import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "../../ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "../../ui/dropdown-menu"
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "../../ui/sidebar"

import { useUser } from "../../../hooks/use-user"
import { logout } from "../../../actions/auth"

export function UserMenu() {
    const { isMobile } = useSidebar()
    const { user, isLoading, error } = useUser()

    if (isLoading) return <div className="p-4 text-center text-xs text-muted-foreground">Loading...</div>

    // Fallback if user data fetch fails, so we can still show Logout
    const safeUser = user || {
        name: "Guest User",
        email: "Session Error",
        role: "UNKNOWN",
        image: undefined
    }

    // Normalize role string (remove ROLE_ prefix if exists for display)
    const roleStr = safeUser.role || 'UNKNOWN';
    const displayRole = roleStr.replace('ROLE_', '').replace('_', ' ');

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild id="sidebar-user-menu">
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                        >
                            <Avatar className="h-8 w-8 rounded-lg">
                                <AvatarImage src={safeUser.image} alt={safeUser.name || safeUser.email} />
                                <AvatarFallback className="rounded-lg">
                                    {(safeUser.name || safeUser.email).charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-semibold">{safeUser.name || safeUser.email}</span>
                                <span className="truncate text-xs">{displayRole}</span>
                            </div>
                            <ChevronsUpDown className="ml-auto size-4" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                        side={isMobile ? "bottom" : "right"}
                        align="end"
                        sideOffset={4}
                    >
                        <DropdownMenuLabel className="p-0 font-normal">
                            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                <Avatar className="h-8 w-8 rounded-lg">
                                    <AvatarImage src={safeUser.image} alt={safeUser.name || safeUser.email} />
                                    <AvatarFallback className="rounded-lg">
                                        {(safeUser.name || safeUser.email).charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-semibold">{safeUser.name || safeUser.email}</span>
                                    <span className="truncate text-xs">{safeUser.email}</span>
                                </div>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            <DropdownMenuItem>
                                <BadgeCheck className="mr-2 size-4" />
                                Account
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <Bell className="mr-2 size-4" />
                                Notifications
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-500" onClick={async () => {
                            await logout();
                            window.location.href = "/login";
                        }}>
                            <LogOut className="mr-2 size-4" />
                            Log out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    )
}

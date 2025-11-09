"use client";

import {
  ChevronsUpDown,
  LogOut,
  Settings,
  Sparkles,
  Sun,
  Moon,
  CreditCard,
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Link, useRouter } from "@tanstack/react-router";

import { useAuth } from '@/data/queries/auth-queries';
import { useLogoutMutation } from '@/data/mutations/auth-mutations';

export function NavUser() {
  const router = useRouter();
  const logoutMutation = useLogoutMutation();
  const { user: authUser } = useAuth();

  const { isMobile } = useSidebar();
  const { theme: selectedTheme, setTheme } = useTheme();
  const isDark = selectedTheme === "dark";
  const toggleTheme = () => setTheme(isDark ? "light" : "dark");

  // Check if user has an active subscription
  const hasActiveSubscription = authUser?.subscription?.status === 'active' || authUser?.subscription?.status === 'trialing';

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();

    // Wait for navigation to complete
    await router.navigate({ to: "/login" });
  };

  // Use actual user data from store, with fallbacks
  const displayName = authUser?.display_name || authUser?.email || 'User';
  const displayEmail = authUser?.email || '';
  const avatarFallback = authUser?.display_name?.[0] || authUser?.email?.[0] || 'U';

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src="" alt={displayName} />
                <AvatarFallback className="rounded-lg capitalize">{avatarFallback}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                {authUser?.display_name && (
                  <span className="truncate font-medium">{displayName}</span>
                )}
                <span className={`truncate ${authUser?.display_name ? 'text-xs' : 'text-sm'}`}>{displayEmail}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src="" alt={displayName} />
                  <AvatarFallback className="rounded-lg capitalize">{avatarFallback}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  {authUser?.display_name && (
                    <span className="truncate font-medium">{displayName}</span>
                  )}
                  <span className={`truncate ${authUser?.display_name ? 'text-xs' : 'text-sm'}`}>{displayEmail}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link to={"/plans"} search={{ checkout: undefined, session_id: undefined }}>
                  {hasActiveSubscription ? (
                    <>
                      <CreditCard />
                      Manage Subscription
                    </>
                  ) : (
                    <>
                      <Sparkles />
                      Upgrade to Pro
                    </>
                  )}
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <Settings />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={toggleTheme}>
                {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
                {isDark ? "Light Mode" : "Dark Mode"}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Bell,
  Search,
  Menu,
  ChevronDown,
  Settings,
  LogOut,
  UserRound,
  Layers3,
  Loader2,
} from "lucide-react";

import { authClient } from "@/lib/auth-client";
import Sidebar from "@/components/dashboard/Sidebar/Sidebar";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard Overview",
  "/dashboard/leads": "All Leads",
  "/dashboard/import": "Import Leads",
  "/dashboard/duplicates": "Duplicate Leads",
  "/dashboard/workspaces": "Workspaces",
  "/dashboard/analytics": "Analytics",
  "/dashboard/team": "Team Members",
  "/dashboard/settings": "Settings",
};

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const { data: session, isPending } = authClient.useSession();

  const [search, setSearch] = useState("");
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const user = session?.user;

  const pageTitle =
    pageTitles[pathname] ||
    pathname
      .split("/")
      .filter(Boolean)
      .pop()
      ?.replace(/-/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase()) ||
    "Dashboard";

  const initials = user?.name
    ? user.name
        .trim()
        .split(/\s+/)
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "LF";

  const handleLogout = async () => {
    setLogoutLoading(true);

    try {
      const { error } = await authClient.signOut();

      if (error) {
        throw new Error(error.message || "Logout failed");
      }

      router.replace("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
      setLogoutLoading(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 flex h-20 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8">

      {/* Left Section */}
      <div className="flex min-w-0 items-center gap-3">

        {/* Mobile Sidebar */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger
  className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 lg:hidden"
  aria-label="Open navigation"
>
  <Menu size={20} />
</SheetTrigger>

          <SheetContent
            side="left"
            className="w-72 gap-0 overflow-hidden border-r-0 p-0"
          >
            <SheetTitle className="sr-only">
              LeadFlow Navigation
            </SheetTitle>

            <div
              className="h-full"
              onClick={(event) => {
                if (
                  (event.target as HTMLElement).closest("a")
                ) {
                  setMobileOpen(false);
                }
              }}
            >
              <Sidebar />
            </div>
          </SheetContent>
        </Sheet>

        {/* Mobile Logo */}
        <div className="flex items-center gap-2 lg:hidden">
          <div className="rounded-lg bg-teal-600 p-2 text-white">
            <Layers3 size={18} />
          </div>
        </div>

        {/* Page Title */}
        <div className="min-w-0">
          <h1 className="truncate text-base font-bold text-slate-900 sm:text-xl">
            {pageTitle}
          </h1>

          <p className="hidden text-xs text-slate-500 sm:block">
            Manage your leads and grow your business
          </p>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex shrink-0 items-center gap-2 sm:gap-4">

        {/* Search */}
        <div className="relative hidden md:block">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search leads..."
            className="h-10 w-48 rounded-xl border-slate-200 bg-slate-50 pl-10 focus-visible:ring-teal-500 xl:w-72"
          />
        </div>

        {/* Mobile Search */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Search leads"
          onClick={() => router.push("/dashboard/leads")}
        >
          <Search size={20} />
        </Button>

        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-xl text-slate-600 hover:bg-teal-50 hover:text-teal-700"
          aria-label="Notifications"
        >
          <Bell size={20} />

          <span className="absolute right-2 top-2 h-2 w-2 rounded-full border border-white bg-red-500" />
        </Button>

        {/* Divider */}
        <div className="hidden h-8 w-px bg-slate-200 sm:block" />

        {/* User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex h-auto items-center gap-2 rounded-xl px-1 py-1.5 hover:bg-slate-50 sm:px-2"
            >
              <Avatar className="h-9 w-9 border-2 border-teal-100">
                <AvatarImage
                  src={user?.image || undefined}
                  alt={user?.name || "User"}
                />

                <AvatarFallback className="bg-teal-100 text-sm font-bold text-teal-700">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="hidden max-w-36 text-left sm:block">
                <p className="truncate text-sm font-semibold text-slate-800">
                  {isPending ? "Loading..." : user?.name || "User"}
                </p>

                <p className="truncate text-xs text-slate-500">
                  {user?.email || "LeadFlow Account"}
                </p>
              </div>

              <ChevronDown
                size={15}
                className="hidden text-slate-400 sm:block"
              />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            sideOffset={10}
            className="w-64 rounded-xl p-2"
          >
            <DropdownMenuLabel>
              <p className="font-semibold text-slate-900">
                {user?.name || "User"}
              </p>

              <p className="truncate text-xs font-normal text-slate-500">
                {user?.email}
              </p>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuItem asChild>
              <Link
                href="/dashboard/settings"
                className="flex cursor-pointer items-center gap-2"
              >
                <UserRound size={16} />
                My Profile
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Link
                href="/dashboard/settings"
                className="flex cursor-pointer items-center gap-2"
              >
                <Settings size={16} />
                Account Settings
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onSelect={handleLogout}
              disabled={logoutLoading}
              className="cursor-pointer gap-2 text-red-600 focus:bg-red-50 focus:text-red-600"
            >
              {logoutLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <LogOut size={16} />
              )}

              {logoutLoading ? "Signing out..." : "Sign Out"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

      </div>
    </header>
  );
}
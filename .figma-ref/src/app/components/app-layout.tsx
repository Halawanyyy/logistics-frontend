import { useState } from "react";
import { Outlet, useNavigate } from "react-router";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarTrigger,
} from "./ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import {
  Package,
  Warehouse,
  DollarSign,
  Users,
  Truck,
  Settings,
  LayoutDashboard,
  Bell,
  Search,
  Plus,
  LogOut,
  User,
  ChevronDown,
  PackagePlus,
} from "lucide-react";
import { CommandPalette } from "./command-palette";

const menuItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    path: "/dashboard",
  },
  {
    title: "Shipments",
    icon: Package,
    path: "/shipments",
  },
  {
    title: "Warehouse",
    icon: Warehouse,
    path: "/warehouse",
  },
  {
    title: "Financial",
    icon: DollarSign,
    path: "/financial",
  },
  {
    title: "Merchants",
    icon: Users,
    path: "/merchants",
  },
  {
    title: "Couriers",
    icon: Truck,
    path: "/couriers",
  },
  {
    title: "Settings",
    icon: Settings,
    path: "/settings",
  },
];

export function AppLayout() {
  const navigate = useNavigate();
  const [notifications] = useState(3);

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden">
        <Sidebar>
          <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Package className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-medium">LogisticsPro</span>
                <span className="text-xs text-muted-foreground">v2.0</span>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton
                        onClick={() => navigate(item.path)}
                        tooltip={item.title}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="border-t border-sidebar-border p-4">
            <DropdownMenu>
              <DropdownMenuTrigger className="w-full">
                <div className="flex w-full items-center gap-2 rounded-md px-2 py-2 hover:bg-sidebar-accent">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>AD</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-1 flex-col items-start text-sm">
                    <span className="font-medium">Admin User</span>
                    <span className="text-xs text-muted-foreground">
                      admin@logisticspro.com
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/")}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>

        <div className="flex flex-1 flex-col overflow-hidden">
          <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
            <SidebarTrigger />
            <div className="flex flex-1 items-center gap-4">
              <div className="relative w-96">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search or press Cmd+K..."
                  className="pl-9"
                  readOnly
                  onClick={() =>
                    document.dispatchEvent(
                      new KeyboardEvent("keydown", { key: "k", metaKey: true })
                    )
                  }
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => navigate("/shipments/create")}
                  >
                    <PackagePlus className="mr-2 h-4 w-4" />
                    New Shipment
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => navigate("/warehouse/stock-in")}
                  >
                    <Warehouse className="mr-2 h-4 w-4" />
                    Stock In
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {notifications > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -right-1 -top-1 h-5 min-w-5 rounded-full px-1"
                  >
                    {notifications}
                  </Badge>
                )}
              </Button>
            </div>
          </header>

          <main className="flex-1 overflow-auto bg-background p-6">
            <Outlet />
          </main>
        </div>
      </div>
      <CommandPalette />
    </SidebarProvider>
  );
}

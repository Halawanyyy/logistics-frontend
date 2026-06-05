import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "./ui/command";
import {
  Package,
  Warehouse,
  DollarSign,
  Users,
  Truck,
  Settings,
  LayoutDashboard,
  PackagePlus,
  PackageSearch,
} from "lucide-react";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleNavigate = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => handleNavigate("/dashboard")}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </CommandItem>
          <CommandItem onSelect={() => handleNavigate("/shipments")}>
            <Package className="mr-2 h-4 w-4" />
            <span>Shipments</span>
          </CommandItem>
          <CommandItem onSelect={() => handleNavigate("/warehouse")}>
            <Warehouse className="mr-2 h-4 w-4" />
            <span>Warehouse</span>
          </CommandItem>
          <CommandItem onSelect={() => handleNavigate("/financial")}>
            <DollarSign className="mr-2 h-4 w-4" />
            <span>Financial</span>
          </CommandItem>
          <CommandItem onSelect={() => handleNavigate("/merchants")}>
            <Users className="mr-2 h-4 w-4" />
            <span>Merchants</span>
          </CommandItem>
          <CommandItem onSelect={() => handleNavigate("/couriers")}>
            <Truck className="mr-2 h-4 w-4" />
            <span>Couriers</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Quick Actions">
          <CommandItem onSelect={() => handleNavigate("/shipments/create")}>
            <PackagePlus className="mr-2 h-4 w-4" />
            <span>Create Shipment</span>
          </CommandItem>
          <CommandItem onSelect={() => handleNavigate("/warehouse/stock-in")}>
            <PackageSearch className="mr-2 h-4 w-4" />
            <span>Stock In</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="System">
          <CommandItem onSelect={() => handleNavigate("/settings")}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

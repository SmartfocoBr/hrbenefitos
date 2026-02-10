import { Building2, ChevronDown, Check } from "lucide-react";
import { useTenant } from "@/hooks/useTenant";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function TenantSwitcher() {
  const { tenants, activeTenant, switchTenant, isLoading } = useTenant();

  if (isLoading || tenants.length <= 1) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2 max-w-[240px]">
          <Building2 className="h-4 w-4 shrink-0" />
          <span className="truncate">{activeTenant?.name || "Selecionar empresa"}</span>
          <ChevronDown className="h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[240px]">
        {tenants.map((tenant) => (
          <DropdownMenuItem
            key={tenant.id}
            onClick={() => switchTenant(tenant.id)}
            className="flex items-center justify-between"
          >
            <div className="flex flex-col gap-0.5">
              <span className="font-medium truncate">{tenant.name}</span>
              <Badge variant="secondary" className="text-xs w-fit">
                {tenant.role}
              </Badge>
            </div>
            {activeTenant?.id === tenant.id && (
              <Check className="h-4 w-4 text-accent shrink-0" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

import { useWorkspace } from "@/contexts/WorkspaceContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, Building2, LayoutDashboard, Check, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

export const WorkspaceSwitcher = () => {
  const { brands, activeBrandId, setActiveBrandId, isAgency, isLoading } = useWorkspace();
  const navigate = useNavigate();

  if (isLoading || brands.length === 0) return null;

  const activeBrand = brands.find((b) => b.id === activeBrandId) || brands[0];

  const handleAddNewBrand = () => {
    setActiveBrandId(null);
    navigate("/company/profile-setup");
  };

  return (
    <div className="px-3 mb-6">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between gap-2 bg-background/50 border-white/10 hover:bg-white/5 group transition-all duration-300 backdrop-blur-md"
          >
            <div className="flex items-center gap-2 truncate">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-white/20 bg-gradient-to-br from-primary/20 to-purple-500/20 text-[10px] font-medium text-white group-hover:scale-110 transition-transform">
                {activeBrand?.logo_url ? (
                  <img src={activeBrand.logo_url} alt="" className="h-full w-full object-cover rounded-md" />
                ) : (
                  <Building2 size={12} />
                )}
              </div>
              <span className="truncate font-semibold text-sm">
                {activeBrand?.company_name || "Select Brand"}
              </span>
            </div>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-[200px] bg-slate-900/95 border-white/10 backdrop-blur-xl text-white shadow-2xl animate-in fade-in zoom-in-95 duration-200"
          align="start"
          sideOffset={8}
        >
          <DropdownMenuLabel className="text-xs font-semibold text-slate-400 px-2 py-1.5 flex items-center gap-2">
            <LayoutDashboard size={12} />
            Your Client Workspaces
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-white/5" />
          <div className="max-h-[300px] overflow-y-auto py-1 custom-scrollbar">
            {brands.map((brand) => (
              <DropdownMenuItem
                key={brand.id}
                onClick={() => setActiveBrandId(brand.id)}
                className={cn(
                  "flex items-center gap-2 px-2 py-2 cursor-pointer transition-colors",
                  activeBrandId === brand.id 
                    ? "bg-primary/20 text-primary-foreground focus:bg-primary/30" 
                    : "hover:bg-white/5 focus:bg-white/5"
                )}
              >
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded border border-white/10 bg-white/5 text-[10px] font-medium">
                  {brand.logo_url ? (
                    <img src={brand.logo_url} alt="" className="h-full w-full object-cover rounded" />
                  ) : (
                    brand.company_name?.charAt(0) || "B"
                  )}
                </div>
                <div className="flex flex-col truncate">
                  <span className="truncate text-sm font-medium">{brand.company_name}</span>
                  <span className="truncate text-[10px] text-slate-500 italic">
                    {brand.industry || "General"}
                  </span>
                </div>
                {activeBrandId === brand.id && (
                  <Check size={14} className="ml-auto text-primary animate-in zoom-in" />
                )}
              </DropdownMenuItem>
            ))}
          </div>
          {isAgency && (
            <>
              <DropdownMenuSeparator className="bg-white/5" />
              <DropdownMenuItem 
                className="flex items-center gap-2 px-2 py-2 cursor-pointer hover:bg-white/10 transition-colors italic text-slate-400 text-xs"
                onClick={handleAddNewBrand}
              >
                <Plus size={12} />
                Add New Brand
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

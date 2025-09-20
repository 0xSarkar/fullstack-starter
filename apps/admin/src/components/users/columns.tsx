import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, ArrowUpDown, CheckCircle, XCircle, Shield, ShieldCheck, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { toast } from "sonner";
import type { AdminUser } from "@fullstack-starter/shared-schemas";

export const createColumns = (onUserStatusToggle?: (user: AdminUser) => void): ColumnDef<AdminUser>[] => [
  {
    accessorKey: "email",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 h-auto font-medium"
        >
          Email
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "display_name",
    header: "Display Name",
    cell: ({ row }) => {
      const displayName = row.getValue("display_name") as string | null;
      return <div className="font-medium">{displayName || "—"}</div>;
    },
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => {
      const role = row.getValue("role") as string;

      const getRoleIcon = (role: string) => {
        switch (role) {
          case 'super_admin':
            return <ShieldCheck className="h-3 w-3" />;
          case 'admin':
            return <Shield className="h-3 w-3" />;
          default:
            return <User className="h-3 w-3" />;
        }
      };

      const getRoleVariant = (role: string) => {
        switch (role) {
          case 'super_admin':
            return 'destructive' as const;
          case 'admin':
            return 'default' as const;
          default:
            return 'secondary' as const;
        }
      };

      return (
        <Badge variant={getRoleVariant(role)} className="gap-1">
          {getRoleIcon(role)}
          {role === 'super_admin' ? 'Super Admin' : role.charAt(0).toUpperCase() + role.slice(1)}
        </Badge>
      );
    },
  },
  {
    accessorKey: "active",
    header: "Status",
    cell: ({ row }) => {
      const isActive = row.getValue("active") as boolean;
      return (
        <Badge variant={isActive ? "default" : "secondary"} className="gap-1">
          {isActive ? (
            <>
              <CheckCircle className="h-3 w-3 text-green-600" />
              Active
            </>
          ) : (
            <>
              <XCircle className="h-3 w-3 text-red-600" />
              Inactive
            </>
          )}
        </Badge>
      );
    },
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 h-auto font-medium"
        >
          Created
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue("created_at") as string);
      return <div className="text-sm text-muted-foreground">{date.toLocaleDateString()}</div>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const user = row.original;

      const handleCopyId = async () => {
        try {
          await navigator.clipboard.writeText(user.id);
          toast.success("User ID copied to clipboard");
        } catch (error) {
          toast.error("Failed to copy user ID");
        }
      };

      const handleCopyEmail = async () => {
        try {
          await navigator.clipboard.writeText(user.email);
          toast.success("Email copied to clipboard");
        } catch (error) {
          toast.error("Failed to copy email");
        }
      };

      const handleToggleStatus = () => {
        if (onUserStatusToggle) {
          onUserStatusToggle(user);
        }
      };

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={handleCopyId}>
              Copy user ID
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleCopyEmail}>
              Copy email
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleToggleStatus}>
              {user.active ? 'Deactivate user' : 'Activate user'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

// Default export for backward compatibility
export const columns = createColumns();

"use client";

import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { useSessionStorage } from "@/hooks/use-session-storage";
import { useToast } from "@/hooks/use-toast";

export function UserHeader() {
  const [currentUser, setCurrentUser] = useSessionStorage<any>("currentUser", null);
  const [activeWorkspace, setActiveWorkspace] = useSessionStorage<any>("activeWorkspace", null);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveWorkspace(null);
    toast({
      title: "Logged out",
      description: "You have been successfully logged out."
    });
    router.push("/login");
  };

  const clearWorkspace = () => {
    if (currentUser?.role === "admin") {
      setActiveWorkspace(null);
      toast({
        title: "Switched to Main Workspace",
        description: "Now viewing all cases across all workspaces."
      });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background/80 backdrop-blur-sm px-4 md:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="md:hidden" />
        <div className="flex items-center gap-4">
          {/* Workspace Display - Now more prominent and always visible */}
          <div className="flex items-center gap-2">
            <div className="text-lg font-semibold text-primary">
              {activeWorkspace ? (
                activeWorkspace.name === 'Main Workspace' ? (
                  <span>Main Workspace</span>
                ) : (
                  <>
                    <span className="text-muted-foreground text-sm font-normal">{activeWorkspace.type}:</span>
                    <span className="ml-1">{activeWorkspace.name} Workspace</span>
                  </>
                )
              ) : (
                currentUser?.role === "admin" ? "Main Workspace" : "Dashboard"
              )}
            </div>
            {activeWorkspace && currentUser?.role === "admin" && activeWorkspace.name !== 'Main Workspace' && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={clearWorkspace}
              >
                Back to Main
              </Button>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        {currentUser?.role === "admin" && (
          <Badge variant="outline" className="hidden sm:inline-flex">
            Administrator
          </Badge>
        )}
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarImage src="https://placehold.co/100x100" alt={currentUser?.name} />
                <AvatarFallback>
                  {currentUser?.name ? getInitials(currentUser.name) : "U"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              <div>
                <p className="font-medium">{currentUser?.name || "User"}</p>
                <p className="text-xs text-muted-foreground">{currentUser?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {currentUser?.role === "admin" && (
              <>
                <DropdownMenuItem onClick={() => router.push("/workspaces")}>
                  Manage Workspaces
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/contacts")}>
                  Manage Contacts
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuItem>Support</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

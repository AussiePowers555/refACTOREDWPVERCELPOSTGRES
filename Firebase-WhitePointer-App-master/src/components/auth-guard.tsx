"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSessionStorage } from "@/hooks/use-session-storage";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const [currentUser] = useSessionStorage<any>("currentUser", null);
  const [isLoading, setIsLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Faster loading resolution
    const timer = setTimeout(() => {
      if (!currentUser && !redirecting) {
        console.log('AuthGuard: No user found, redirecting to login');
        setRedirecting(true);
        router.push("/login");
      } else if (currentUser) {
        console.log('AuthGuard: User authenticated:', currentUser.email);
        setIsLoading(false);
      }
    }, 50); // Very short delay to prevent flicker

    return () => clearTimeout(timer);
  }, [currentUser, router, redirecting]);

  // Immediate check for existing user to skip loading state
  useEffect(() => {
    if (currentUser) {
      setIsLoading(false);
    }
  }, [currentUser]);

  if (redirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600 text-sm">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return null; // Will redirect to login
  }

  return <>{children}</>;
}


"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { DashboardProtection } from "@/components/DashboardProtection";
import { Activity } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Activity className="h-8 w-8 text-muted-foreground animate-spin" />
      </div>
    );
  }

  return (
    <DashboardProtection>
      <div className="flex min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
        <DashboardSidebar />
        <main className="flex-1 overflow-auto dashboard-grid-bg transition-all duration-300 ease-in-out [margin-left:16rem]">
          <div className="max-w-[1200px] mx-auto px-4 py-8 md:px-8">
            {children}
          </div>
        </main>
      </div>
    </DashboardProtection>
  );
}

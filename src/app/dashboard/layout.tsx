import AuthGuard from '@/components/auth/auth-guard';
import { DataProvider } from '@/components/data-provider';
import { DashboardHeader } from '@/components/dashboard/header';
import { DashboardSidebar } from '@/components/dashboard/sidebar';
import { DashboardMain } from '@/components/dashboard/main';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <DataProvider>
        <div className="relative flex min-h-screen w-full">
          <DashboardSidebar />
          <div className="flex-1 flex flex-col pl-14 sm:pl-16">
            <DashboardHeader />
            <DashboardMain>
              {children}
            </DashboardMain>
          </div>
        </div>
      </DataProvider>
    </AuthGuard>
  );
}

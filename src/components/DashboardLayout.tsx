import { ReactNode } from "react";
import AppSidebar from "@/components/AppSidebar";
import { FloatingChatbot } from "@/components/chatbot/FloatingChatbot";

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
      <FloatingChatbot />
    </div>
  );
};

export default DashboardLayout;

import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Layout } from "@/components/layout/layout";
import { LoginPage } from "@/pages/login-page";
import { DashboardPage } from "@/pages/dashboard-page";
import { UnauthorizedPage } from "@/pages/unauthorized-page";
import { ProtectedRoute } from "./components/protected-route";
import { TicketsPage } from "./pages/ticket/tickets-page";
import { TicketNewPage } from "./pages/ticket/ticket-new-page";
import { TicketDetailPage } from "./pages/ticket/ticket-detail-page";
import { TicketEditPage } from "./pages/ticket/ticket-edit-page";
import { UsersPage } from "./pages/user/users-page";
import { UserNewPage } from "./pages/user/user-new-page";
import { UserEditPage } from "./pages/user/user-edit-page";
import { CompaniesPage } from "./pages/company/companies-page";
import { CompanyCreatePage } from "./pages/company/company-new-page";
import { CompanyEditPage } from "./pages/company/company-edit-page";
import { LogsPage } from "./pages/log/logs-page";
import { LogDetailPage } from "./pages/log/log-detail-page";
import { useToast } from "./hooks/use-toast";
import { socketService } from "./services/socketService";
import type { Ticket } from "./types/ticket.types";
import type { Message } from "./types/message.types";

function App() {
  const { isAuthenticated, checkAuth, user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (isAuthenticated) {
      checkAuth();
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      socketService.disconnect();
      return;
    }

    socketService.connect();

    const handleTicketCreated = (newTicket: Ticket) => {
      if (user.role === "user") return;
      toast({
        title: "🎫 Nouveau ticket",
        description: `${newTicket.ticketRef} — ${newTicket.title}`,
      });
    };

    const handleMessageCreated = (message: Message) => {
      const currentPath = window.location.pathname;
      if (currentPath.includes(message.ticket)) return;

      toast({
        title: "💬 Nouveau message",
        description: `${message.author.firstName} ${message.author.lastName} : ${message.content.slice(0, 60)}${message.content.length > 60 ? "…" : ""}`,
      });
    };

    socketService.on<Ticket>("ticket:created", handleTicketCreated);
    socketService.on<Message>("message:created", handleMessageCreated);

    return () => {
      socketService.off("ticket:created", handleTicketCreated);
      socketService.off("message:created", handleMessageCreated);
    };
  }, [isAuthenticated, user]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout>
                <DashboardPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/tickets"
          element={
            <ProtectedRoute>
              <Layout>
                <TicketsPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/tickets/new"
          element={
            <ProtectedRoute>
              <Layout>
                <TicketNewPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/tickets/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <TicketDetailPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/tickets/:id/edit"
          element={
            <ProtectedRoute>
              <Layout>
                <TicketEditPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/users"
          element={
            <ProtectedRoute requiredRoles={["admin"]}>
              <Layout>
                <UsersPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/users/new"
          element={
            <ProtectedRoute requiredRoles={["admin"]}>
              <Layout>
                <UserNewPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/users/:id/edit"
          element={
            <ProtectedRoute requiredRoles={["admin"]}>
              <Layout>
                <UserEditPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/companies"
          element={
            <ProtectedRoute requiredRoles={["admin"]}>
              <Layout>
                <CompaniesPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/companies/new"
          element={
            <ProtectedRoute requiredRoles={["admin"]}>
              <Layout>
                <CompanyCreatePage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/companies/:id/edit"
          element={
            <ProtectedRoute requiredRoles={["admin"]}>
              <Layout>
                <CompanyEditPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/logs"
          element={
            <ProtectedRoute requiredRoles={["admin"]}>
              <Layout>
                <LogsPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/logs/:id"
          element={
            <ProtectedRoute requiredRoles={["admin"]}>
              <Layout>
                <LogDetailPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

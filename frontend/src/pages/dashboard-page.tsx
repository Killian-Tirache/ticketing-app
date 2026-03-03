import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { dashboardService } from "@/services/dashboardService";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Ticket,
  Users,
  Building2,
  Activity,
  CheckCircle,
  XCircle,
  UserCheck,
  Clock,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import type { DashboardData } from "@/types/dashboard.types";
import type { Ticket as TicketType } from "@/types/ticket.types";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardPage() {
  const { user, isAdmin, isSupport } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    dashboardService
      .get()
      .then(setData)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-blue-500";
      case "in_progress":
        return "bg-orange-500";
      case "resolved":
        return "bg-green-500";
      case "closed":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  const statusLabels: Record<string, string> = {
    open: "Ouvert",
    in_progress: "En cours",
    resolved: "Résolu",
    closed: "Fermé",
  };

  const buildStats = () => {
    if (!data) return [];
    const { stats } = data;

    const base = [
      {
        label: "Total tickets",
        value: stats.totalTickets,
        icon: Ticket,
        color: "text-blue-500",
      },
      {
        label: "Ouverts",
        value: stats.openTickets,
        icon: Activity,
        color: "text-orange-500",
      },
      {
        label: "En cours",
        value: stats.inProgressTickets,
        icon: Clock,
        color: "text-yellow-500",
      },
      {
        label: "Résolus",
        value: stats.resolvedTickets,
        icon: CheckCircle,
        color: "text-green-500",
      },
    ];

    if (isAdmin) {
      base.push(
        {
          label: "Fermés",
          value: stats.closedTickets ?? 0,
          icon: XCircle,
          color: "text-gray-500",
        },
        {
          label: "Utilisateurs",
          value: stats.totalUsers ?? 0,
          icon: Users,
          color: "text-purple-500",
        },
        {
          label: "Entreprises",
          value: stats.totalCompanies ?? 0,
          icon: Building2,
          color: "text-cyan-500",
        },
      );
    }

    if (isSupport) {
      base.push({
        label: "Assignés à moi",
        value: stats.assignedToMe ?? 0,
        icon: UserCheck,
        color: "text-purple-500",
      });
    }

    return base;
  };

  const stats = buildStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Bienvenue, {user?.firstName} {user?.lastName}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))
          : stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.label}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {stat.label}
                    </CardTitle>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                  </CardContent>
                </Card>
              );
            })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tickets récents</CardTitle>
          <CardDescription>
            {isAdmin
              ? "Les 5 derniers tickets créés"
              : "Les 5 derniers tickets de vos entreprises"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : data?.recentTickets.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucun ticket pour le moment.
            </p>
          ) : (
            <div className="space-y-1">
              {data?.recentTickets.map((ticket: TicketType) => (
                <div
                  key={ticket._id}
                  onClick={() => navigate(`/tickets/${ticket._id}`)}
                  className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono text-xs text-muted-foreground shrink-0">
                      {ticket.ticketRef}
                    </span>
                    <span className="text-sm truncate">{ticket.title}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    <span className="text-xs text-muted-foreground hidden sm:block">
                      {formatDistanceToNow(new Date(ticket.createdAt), {
                        addSuffix: true,
                        locale: fr,
                      })}
                    </span>
                    <Badge
                      className={`${getStatusColor(ticket.status)} text-xs`}
                    >
                      {statusLabels[ticket.status]}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

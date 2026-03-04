import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ticketService } from "@/services/ticketService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  Edit,
  Trash2,
  Loader2,
  ArrowLeft,
  Building2,
  User,
  Calendar,
  Hash,
  ChevronDown,
  MessageSquare,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { Ticket } from "@/types/ticket.types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { User as IUser } from "@/types/user.types";
import { userService } from "@/services/userService";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TicketChat } from "@/components/tickets/ticket-chat";

export function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin, isUser } = useAuth();
  const { toast } = useToast();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [assignableUsers, setAssignableUsers] = useState<IUser[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    if (!id) {
      navigate("/tickets");
      return;
    }
    loadTicket(id);
  }, [id, navigate]);

  const loadTicket = async (ticketId: string) => {
    try {
      const data = await ticketService.getById(ticketId);
      setTicket(data);
    } catch (error) {
      console.error("Error loading ticket:", error);
      navigate("/tickets");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!ticket || isUser) return;
    userService
      .getAssignableForTicket((ticket.company as any)._id ?? ticket.company)
      .then(setAssignableUsers)
      .catch(console.error);
  }, [ticket?._id]);

  const handleAssignChange = async (userId: string) => {
    if (!ticket) return;
    try {
      setIsAssigning(true);
      const updatedTicket = await ticketService.update(ticket._id, {
        assignedTo: userId === "none" ? null : userId,
      });
      setTicket(updatedTicket);
      toast({ title: "Succès", description: "Assignation mise à jour" });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description:
          error.response?.data?.error || "Impossible de modifier l'assignation",
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const handleDelete = async () => {
    if (!ticket) return;

    try {
      setIsDeleting(true);
      await ticketService.delete(ticket._id);
      toast({
        title: "Succès",
        description: "Ticket supprimé avec succès",
      });
      navigate("/tickets");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description:
          error.response?.data?.error || "Impossible de supprimer le ticket",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStatusChange = async (newStatus: Ticket["status"]) => {
    if (!ticket) return;

    try {
      await ticketService.update(ticket._id, { status: newStatus });
      setTicket({ ...ticket, status: newStatus });
      toast({
        title: "Succès",
        description: "Statut mis à jour avec succès",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description:
          error.response?.data?.error ||
          "Impossible de mettre à jour le statut",
      });
    }
  };

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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-600";
      case "high":
        return "bg-red-500";
      case "medium":
        return "bg-orange-500";
      case "low":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!ticket) {
    return null;
  }

  const statusLabels: Record<string, string> = {
    open: "Ouvert",
    in_progress: "En cours",
    resolved: "Résolu",
    closed: "Fermé",
  };

  const priorityLabels: Record<string, string> = {
    critical: "Critique",
    high: "Haute",
    medium: "Moyenne",
    low: "Basse",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/tickets")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {ticket.title}
            </h1>
            <p className="text-muted-foreground font-mono">
              {ticket.ticketRef}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {isAdmin && (
            <Button
              variant="outline"
              onClick={() => navigate(`/tickets/${ticket._id}/edit`)}
            >
              <Edit className="mr-2 h-4 w-4" />
              Modifier
            </Button>
          )}

          {isAdmin && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                  <AlertDialogDescription>
                    Êtes-vous sûr de vouloir supprimer ce ticket ? Cette action
                    est irréversible.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeleting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Supprimer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{ticket.description}</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Hash className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Numéro</p>
                  <p className="text-sm text-muted-foreground">
                    {ticket.ticketNumber}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex items-start gap-3">
                <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Entreprise</p>
                  <p className="text-sm text-muted-foreground">
                    {ticket.company.name}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Créé par</p>
                  <p className="text-sm text-muted-foreground">
                    {ticket.createdBy.firstName} {ticket.createdBy.lastName}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="space-y-1 w-full">
                  <p className="text-sm font-medium">Assigné à</p>

                  {!isUser ? (
                    <Select
                      value={ticket.assignedTo?._id ?? "none"}
                      onValueChange={handleAssignChange}
                      disabled={isAssigning}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="Non assigné" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">
                          <span className="text-muted-foreground">
                            Non assigné
                          </span>
                        </SelectItem>
                        {assignableUsers.map((u) => (
                          <SelectItem key={u._id} value={u._id}>
                            {u.firstName} {u.lastName}
                            <span className="ml-1 text-xs text-muted-foreground">
                              ({u.role})
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {ticket.assignedTo
                        ? `${(ticket.assignedTo as any).firstName} ${(ticket.assignedTo as any).lastName}`
                        : "Non assigné"}
                    </p>
                  )}
                </div>
              </div>

              <Separator />

              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Date de création</p>
                  <p className="text-sm text-muted-foreground">
                    {format(
                      new Date(ticket.createdAt),
                      "dd MMMM yyyy à HH:mm",
                      { locale: fr },
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Statut & Priorité</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Statut</p>
                {!isUser ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className={`${getStatusColor(ticket.status)} border-0`}
                      >
                        {statusLabels[ticket.status]}
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem
                        onClick={() => handleStatusChange("open")}
                      >
                        Ouvert
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleStatusChange("in_progress")}
                      >
                        En cours
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleStatusChange("resolved")}
                      >
                        Résolu
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleStatusChange("closed")}
                      >
                        Fermé
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Badge className={getStatusColor(ticket.status)}>
                    {statusLabels[ticket.status]}
                  </Badge>
                )}
              </div>

              <Separator />

              <div>
                <p className="text-sm font-medium mb-2">Priorité</p>
                <Badge
                  variant="outline"
                  className={getPriorityColor(ticket.priority)}
                >
                  {priorityLabels[ticket.priority]}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Discussion
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TicketChat ticketId={ticket._id} />
        </CardContent>
      </Card>
    </div>
  );
}

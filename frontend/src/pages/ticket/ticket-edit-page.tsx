import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ticketService } from "@/services/ticketService";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import type { Ticket } from "@/types/ticket.types";
import { TicketForm } from "@/components/tickets/tickets-form";

export function TicketEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          Modifier le ticket
        </h1>
        <p className="text-muted-foreground">Ticket {ticket.ticketRef}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations du ticket</CardTitle>
          <CardDescription>Modifiez les informations du ticket</CardDescription>
        </CardHeader>
        <CardContent>
          <TicketForm mode="edit" ticket={ticket} />
        </CardContent>
      </Card>
    </div>
  );
}

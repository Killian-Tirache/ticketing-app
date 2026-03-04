import { TicketForm } from "@/components/tickets/tickets-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function TicketNewPage() {
  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Nouveau ticket</h1>
        <p className="text-muted-foreground">
          Créez un nouveau ticket de support
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations du ticket</CardTitle>
          <CardDescription>
            Remplissez les informations ci-dessous pour créer un nouveau ticket
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TicketForm mode="create" />
        </CardContent>
      </Card>
    </div>
  );
}

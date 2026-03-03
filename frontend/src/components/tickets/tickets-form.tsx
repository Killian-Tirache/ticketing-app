import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import {
  ticketFormSchema,
  type TicketFormValues,
} from "@/lib/validations/ticket";
import { ticketService } from "@/services/ticketService";
import { companyService } from "@/services/companyService";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import type { Ticket } from "@/types/ticket.types";
import type { Company } from "@/types/company.types";
import { Textarea } from "../ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { CompanySelect } from "./company-select";
import { useAuth } from "@/hooks/useAuth";

interface TicketFormProps {
  ticket?: Ticket;
  mode: "create" | "edit";
}

export function TicketForm({ ticket, mode }: TicketFormProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isUser } = useAuth();

  useEffect(() => {
    if (mode === "edit" && isUser) {
      navigate("/tickets");
    }
  }, [mode, isUser, navigate]);

  const form = useForm<TicketFormValues>({
    resolver: zodResolver(ticketFormSchema),
    defaultValues: {
      title: ticket?.title || "",
      description: ticket?.description || "",
      company: ticket?.company?._id || "",
      priority: ticket?.priority || "medium",
      status: ticket?.status || "open",
    },
  });

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      const data = await companyService.getAllForSelect();
      setCompanies(data);

      if (mode === "create" && data.length === 1) {
        form.setValue("company", data[0]._id);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les entreprises",
      });
    } finally {
      setIsLoadingCompanies(false);
    }
  };

  const onSubmit = async (values: TicketFormValues) => {
    try {
      setIsLoading(true);

      if (mode === "create") {
        await ticketService.create(values);
        toast({
          title: "Succès",
          description: "Ticket créé avec succès",
        });
      } else if (ticket) {
        await ticketService.update(ticket._id, values);
        toast({
          title: "Succès",
          description: "Ticket mis à jour avec succès",
        });
      }

      navigate("/tickets");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.response?.data?.error || "Une erreur est survenue",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingCompanies) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Titre</FormLabel>
              <FormControl>
                <Input placeholder="Titre du ticket" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Décrivez le problème en détail..."
                  className="min-h-30"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="company"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Entreprise</FormLabel>
                <FormControl>
                  <CompanySelect
                    companies={companies}
                    value={field.value}
                    onChange={field.onChange}
                    disabled={
                      mode === "edit" || (isUser && companies.length === 1)
                    }
                  />
                </FormControl>
                {mode === "edit" && (
                  <FormDescription>
                    L'entreprise ne peut pas être modifiée
                  </FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priorité</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une priorité" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="low">Basse</SelectItem>
                    <SelectItem value="medium">Moyenne</SelectItem>
                    <SelectItem value="high">Haute</SelectItem>
                    <SelectItem value="critical">Critique</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {mode === "edit" && (
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Statut</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un statut" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="open">Ouvert</SelectItem>
                      <SelectItem value="in_progress">En cours</SelectItem>
                      <SelectItem value="resolved">Résolu</SelectItem>
                      <SelectItem value="closed">Fermé</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "create" ? "Créer le ticket" : "Mettre à jour"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/tickets")}
            disabled={isLoading}
          >
            Annuler
          </Button>
        </div>
      </form>
    </Form>
  );
}

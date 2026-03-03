import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import {
  companySchema,
  type CompanyFormValues,
} from "@/lib/validations/company";
import { companyService } from "@/services/companyService";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import type { Company } from "@/types/company.types";

interface CompanyFormProps {
  company?: Company;
  mode: "create" | "edit";
}

export function CompanyForm({ company, mode }: CompanyFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: company?.name || "",
      ticketPrefix: company?.ticketPrefix || "",
    },
  });

  useEffect(() => {
    if (company) {
      form.reset({
        name: company.name,
        ticketPrefix: company.ticketPrefix,
      });
    }
  }, [company, form]);

  const onSubmit = async (values: CompanyFormValues) => {
    try {
      setIsLoading(true);

      const payload = {
        name: values.name.trim(),
        ticketPrefix: values.ticketPrefix.toUpperCase().trim(),
      };

      if (mode === "create") {
        await companyService.create(payload);
        toast({
          title: "Succès",
          description: "Entreprise créée avec succès",
        });
      } else if (company) {
        await companyService.update(company._id, payload);
        toast({
          title: "Succès",
          description: "Entreprise mise à jour avec succès",
        });
      }

      navigate("/companies");
    } catch (error: any) {
      const message =
        error.response?.data?.details?.[0] ||
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Une erreur est survenue";
      toast({
        variant: "destructive",
        title: "Erreur",
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom</FormLabel>
              <FormControl>
                <Input placeholder="Nom de l'entreprise" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="ticketPrefix"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Préfixe des tickets</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex : ACME"
                  maxLength={10}
                  {...field}
                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "create" ? "Créer l'entreprise" : "Mettre à jour"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/companies")}
            disabled={isLoading}
          >
            Annuler
          </Button>
        </div>
      </form>
    </Form>
  );
}

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { companyService } from "@/services/companyService";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Company } from "@/types/company.types";
import { CompanyForm } from "@/components/company/company-form";

export function CompanyEditPage() {
  const { id } = useParams<{ id: string }>();
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!id) return;
    loadCompany(id);
  }, [id]);

  const loadCompany = async (companyId: string) => {
    try {
      setIsLoading(true);
      const data = await companyService.getById(companyId);
      setCompany(data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger l'entreprise",
      });
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

  if (!company) {
    return (
      <div className="text-center text-muted-foreground">
        Entreprise introuvable.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Modifier l&apos;entreprise
        </h1>
        <p className="text-muted-foreground">
          Mettez à jour les informations de l&apos;entreprise.
        </p>
      </div>
      <CompanyForm mode="edit" company={company} />
    </div>
  );
}

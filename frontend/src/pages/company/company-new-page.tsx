import { CompanyForm } from "@/components/company/company-form";

export function CompanyCreatePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Nouvelle entreprise
        </h1>
        <p className="text-muted-foreground">
          Créez une nouvelle entreprise et définissez son préfixe de ticket.
        </p>
      </div>
      <CompanyForm mode="create" />
    </div>
  );
}

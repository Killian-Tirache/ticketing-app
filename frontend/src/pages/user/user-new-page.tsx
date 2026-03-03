import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UserForm } from "@/components/users/user-form";

export function UserNewPage() {
  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          Nouvel utilisateur
        </h1>
        <p className="text-muted-foreground">Créez un nouvel utilisateur</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations de l'utilisateur</CardTitle>
          <CardDescription>
            Remplissez les informations ci-dessous pour créer un nouvel
            utilisateur
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UserForm mode="create" />
        </CardContent>
      </Card>
    </div>
  );
}

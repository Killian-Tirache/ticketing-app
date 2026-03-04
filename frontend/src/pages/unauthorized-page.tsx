import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function UnauthorizedPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">403</h1>
        <p className="text-xl text-muted-foreground">Accès non autorisé</p>
        <Button onClick={() => navigate("/")}>Retour à l'accueil</Button>
      </div>
    </div>
  );
}

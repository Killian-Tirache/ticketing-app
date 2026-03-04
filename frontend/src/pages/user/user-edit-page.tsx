import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { userService } from "@/services/userService";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UserForm } from "@/components/users/user-form";
import { Loader2 } from "lucide-react";
import type { User } from "@/types/user.types";

export function UserEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      navigate("/users");
      return;
    }
    loadUser(id);
  }, [id, navigate]);

  const loadUser = async (userId: string) => {
    try {
      const data = await userService.getById(userId);
      setUser(data);
    } catch (error) {
      console.error("Error loading user:", error);
      navigate("/users");
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

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          Modifier l'utilisateur
        </h1>
        <p className="text-muted-foreground">
          {user.firstName} {user.lastName}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations de l'utilisateur</CardTitle>
          <CardDescription>
            Modifiez les informations de l'utilisateur
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UserForm mode="edit" user={user} />
        </CardContent>
      </Card>
    </div>
  );
}

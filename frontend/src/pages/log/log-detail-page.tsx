import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { logService } from "@/services/logService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { Log } from "@/types/log.types";

function isDiffField(value: unknown): value is { old: unknown; new: unknown } {
  return (
    typeof value === "object" &&
    value !== null &&
    "old" in value &&
    "new" in value
  );
}

function isUpdateDiff(details: Record<string, unknown>): boolean {
  return Object.values(details).every((v) => isDiffField(v));
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return value;
  if (typeof value === "boolean") return value ? "Oui" : "Non";
  if (typeof value === "number") return String(value);

  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if ("firstName" in obj && "lastName" in obj) {
      return `${obj.firstName} ${obj.lastName}${obj.email ? ` (${obj.email})` : ""}`;
    }
    if ("name" in obj && !("firstName" in obj)) {
      return obj.name as string;
    }
    return JSON.stringify(obj, null, 2);
  }

  return String(value);
}

function hasChanged(oldVal: unknown, newVal: unknown): boolean {
  return JSON.stringify(oldVal) !== JSON.stringify(newVal);
}

const FIELD_LABELS: Record<string, string> = {
  title: "Titre",
  description: "Description",
  status: "Statut",
  priority: "Priorité",
  company: "Entreprise",
  createdBy: "Créé par",
  assignedTo: "Assigné à",
  name: "Nom",
  email: "Email",
  role: "Rôle",
  ticketPrefix: "Préfixe ticket",
  firstName: "Prénom",
  lastName: "Nom",
};

export function LogDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [log, setLog] = useState<Log | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  const ACTION_LABELS: Record<string, string> = {
    create: "Création",
    update: "Modification",
    delete: "Suppression",
    register: "Inscription",
    login: "Connexion",
    logout: "Déconnexion",
    error: "Erreur",
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "create":
        return "bg-green-500";
      case "update":
        return "bg-blue-500";
      case "delete":
        return "bg-red-500";
      case "register":
        return "bg-purple-500";
      case "login":
        return "bg-cyan-500";
      case "logout":
        return "bg-gray-500";
      case "error":
        return "bg-orange-500";
      default:
        return "bg-gray-500";
    }
  };

  useEffect(() => {
    if (!id) return;
    loadLog(id);
  }, [id]);

  const loadLog = async (logId: string) => {
    try {
      setIsLoading(true);
      const data = await logService.getById(logId);
      setLog(data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger le log",
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

  if (!log) {
    return (
      <div className="text-center text-muted-foreground">Log introuvable.</div>
    );
  }

  const hasDetails = log.details && Object.keys(log.details).length > 0;
  const showDiffTable =
    hasDetails && log.action === "update" && isUpdateDiff(log.details!);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/logs")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Détail du log</h1>
          <p className="text-muted-foreground text-sm font-mono">{log._id}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informations générales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Action</span>
              <Badge variant="outline" className={getActionColor(log.action)}>
                {ACTION_LABELS[log.action] || log.action}
              </Badge>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Statut</span>
              <Badge className={log.success ? "bg-green-500" : "bg-red-500"}>
                {log.success ? "Succès" : "Échec"}
              </Badge>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Entité</span>
              <span className="text-sm capitalize font-medium">
                {log.entity}
              </span>
            </div>
            {log.entityId && (
              <>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    ID entité
                  </span>
                  <span className="text-sm font-mono">{log.entityId}</span>
                </div>
              </>
            )}
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Date</span>
              <span className="text-sm font-medium">
                {format(new Date(log.createdAt), "dd MMMM yyyy à HH:mm:ss", {
                  locale: fr,
                })}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Utilisateur</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {log.userId ? (
              <>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Nom</span>
                  <span className="text-sm font-medium">
                    {log.userId.firstName} {log.userId.lastName}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Email</span>
                  <span className="text-sm font-medium">
                    {log.userId.email}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">ID</span>
                  <span className="text-sm font-mono">{log.userId._id}</span>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Utilisateur inconnu ou supprimé
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {log.message && (
        <Card>
          <CardHeader>
            <CardTitle>Message</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{log.message}</p>
          </CardContent>
        </Card>
      )}

      {showDiffTable && (
        <Card>
          <CardHeader>
            <CardTitle>Modifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-40">Champ</TableHead>
                    <TableHead>Avant</TableHead>
                    <TableHead>Après</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(log.details!).map(([field, diff]) => {
                    if (!isDiffField(diff)) return null;
                    const changed = hasChanged(diff.old, diff.new);
                    const oldStr = formatValue(diff.old);
                    const newStr = formatValue(diff.new);

                    return (
                      <TableRow key={field}>
                        <TableCell className="font-medium text-sm capitalize">
                          {FIELD_LABELS[field] ?? field}
                        </TableCell>
                        <TableCell
                          className={`text-sm whitespace-pre-wrap break-all ${
                            changed
                              ? "text-red-500 opacity-70"
                              : "text-muted-foreground"
                          }`}
                        >
                          {oldStr}
                        </TableCell>
                        <TableCell
                          className={`text-sm whitespace-pre-wrap break-all ${
                            changed
                              ? "text-green-500 font-medium"
                              : "text-muted-foreground"
                          }`}
                        >
                          {newStr}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {hasDetails && !showDiffTable && (
        <Card>
          <CardHeader>
            <CardTitle>Données détaillées</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted rounded-md p-4 text-xs overflow-x-auto whitespace-pre-wrap break-all">
              {JSON.stringify(log.details, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

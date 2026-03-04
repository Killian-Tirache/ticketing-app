import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import {
  userCreateSchema,
  userEditSchema,
  type UserCreateValues,
  type UserEditValues,
} from "@/lib/validations/user";
import { userService } from "@/services/userService";
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
import { CompanyMultiSelect } from "./company-multi-select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import type { User } from "@/types/user.types";
import type { Company } from "@/types/company.types";
import { extractCompanyIds } from "@/lib/utils";

interface UserFormProps {
  user?: User;
  mode: "create" | "edit";
}

export function UserForm({ user, mode }: UserFormProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<UserCreateValues | UserEditValues>({
    resolver: zodResolver(
      mode === "create" ? userCreateSchema : userEditSchema,
    ),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      password: "",
      role: user?.role || "user",
      companies: user ? extractCompanyIds(user.companies) : [],
    },
  });

  useEffect(() => {
    loadCompanies();
  }, []);

  useEffect(() => {
    if (mode === "edit" && user && companies.length > 0) {
      const companyIds = extractCompanyIds(user.companies);
      form.setValue("companies", companyIds);
    }
  }, [companies, mode, user, form]);

  const loadCompanies = async () => {
    try {
      const data = await companyService.getAllForSelect();
      setCompanies(data);
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

  const onSubmit = async (values: UserCreateValues | UserEditValues) => {
    try {
      setIsLoading(true);

      const payload: any = { ...values };
      if (mode === "edit" && (!values.password || values.password === "")) {
        delete payload.password;
      }

      if (mode === "create") {
        await userService.create(payload);
        toast({
          title: "Succès",
          description: "Utilisateur créé avec succès",
        });
      } else if (user) {
        await userService.update(user._id, payload);
        toast({
          title: "Succès",
          description: "Utilisateur mis à jour avec succès",
        });
      }

      navigate("/users");
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
        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prénom</FormLabel>
                <FormControl>
                  <Input placeholder="John" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom</FormLabel>
                <FormControl>
                  <Input placeholder="Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="john.doe@example.com"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Mot de passe{" "}
                {mode === "edit" && "(laisser vide pour ne pas modifier)"}
              </FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder={
                    mode === "edit" ? "Nouveau mot de passe" : "Mot de passe"
                  }
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Minimum 12 caractères avec majuscule, minuscule, chiffre et
                caractère spécial (!@#$%^&*)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rôle</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un rôle" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="companies"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Entreprises</FormLabel>
              <FormControl>
                <CompanyMultiSelect
                  companies={companies}
                  value={field.value || []}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormDescription>
                Sélectionnez les entreprises auxquelles l'utilisateur a accès
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "create" ? "Créer l'utilisateur" : "Mettre à jour"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/users")}
            disabled={isLoading}
          >
            Annuler
          </Button>
        </div>
      </form>
    </Form>
  );
}

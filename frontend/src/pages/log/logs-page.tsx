// src/pages/logs-page.tsx
import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { logService } from '@/services/logService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import {
  Loader2, Search, Filter, X,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/use-debounce';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Log } from '@/types/log.types';

const PAGE_SIZE = 30;

const ALL_ACTIONS = ['create', 'update', 'delete', 'register', 'login', 'logout', 'error'];

const ACTION_LABELS: Record<string, string> = {
  create: 'Création',
  update: 'Modification',
  delete: 'Suppression',
  register: 'Inscription',
  login: 'Connexion',
  logout: 'Déconnexion',
  error: 'Erreur',
};

const ACTION_COLORS: Record<string, string> = {
  create: 'bg-green-500',
  update: 'bg-blue-500',
  delete: 'bg-red-500',
  register: 'bg-purple-500',
  login: 'bg-cyan-500',
  logout: 'bg-gray-500',
  error: 'bg-orange-500',
};

// Entités connues en dur (pas de dépendance à la page courante)
const ALL_ENTITIES = ['ticket', 'user', 'company', 'auth'];

export function LogsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState('');
  const [actionFilters, setActionFilters] = useState<string[]>([]);
  const [entityFilters, setEntityFilters] = useState<string[]>([]);
  const [successFilter, setSuccessFilter] = useState<boolean | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const navigate = useNavigate();
  const { toast } = useToast();
  const debouncedSearch = useDebounce(globalFilter, 400);

  const loadLogs = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await logService.getAll({
        search: debouncedSearch,
        actions: actionFilters,
        entities: entityFilters,
        success: successFilter,
        page: currentPage,
        limit: PAGE_SIZE,
      });
      setLogs(response.data);
      setTotal(response.total);
      setTotalPages(response.totalPages);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de charger les logs',
      });
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, actionFilters, entityFilters, successFilter, currentPage]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  // Reset page à 1 quand les filtres changent
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, actionFilters, entityFilters, successFilter]);

  const toggleActionFilter = (action: string) => {
    setActionFilters((prev) =>
      prev.includes(action) ? prev.filter((a) => a !== action) : [...prev, action]
    );
  };

  const toggleEntityFilter = (entity: string) => {
    setEntityFilters((prev) =>
      prev.includes(entity) ? prev.filter((e) => e !== entity) : [...prev, entity]
    );
  };

  const clearFilters = () => {
    setGlobalFilter('');
    setActionFilters([]);
    setEntityFilters([]);
    setSuccessFilter(null);
  };

  const hasActiveFilters =
    globalFilter || actionFilters.length > 0 ||
    entityFilters.length > 0 || successFilter !== null;

  const pageNumbers = useMemo(() => {
    const delta = 2;
    const range: number[] = [];
    for (
      let i = Math.max(1, currentPage - delta);
      i <= Math.min(totalPages, currentPage + delta);
      i++
    ) {
      range.push(i);
    }
    return range;
  }, [currentPage, totalPages]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Logs</h1>
        <p className="text-muted-foreground">
          Consultez l'historique des actions effectuées sur l'application
        </p>
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par utilisateur (nom, email) ou message..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-8"
          />
        </div>

        {/* Filtre Actions */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full sm:w-auto">
              <Filter className="mr-2 h-4 w-4" />
              Actions
              {actionFilters.length > 0 && (
                <Badge variant="secondary" className="ml-2">{actionFilters.length}</Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Filtrer par action</h4>
              {ALL_ACTIONS.map((action) => (
                <div key={action} className="flex items-center space-x-2">
                  <Checkbox
                    id={`action-${action}`}
                    checked={actionFilters.includes(action)}
                    onCheckedChange={() => toggleActionFilter(action)}
                  />
                  <label htmlFor={`action-${action}`} className="text-sm font-normal cursor-pointer">
                    {ACTION_LABELS[action]}
                  </label>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Filtre Entités */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full sm:w-auto">
              <Filter className="mr-2 h-4 w-4" />
              Entités
              {entityFilters.length > 0 && (
                <Badge variant="secondary" className="ml-2">{entityFilters.length}</Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Filtrer par entité</h4>
              <div className="max-h-56 overflow-y-auto space-y-2">
                {ALL_ENTITIES.map((entity) => (
                  <div key={entity} className="flex items-center space-x-2">
                    <Checkbox
                      id={`entity-${entity}`}
                      checked={entityFilters.includes(entity)}
                      onCheckedChange={() => toggleEntityFilter(entity)}
                    />
                    <label
                      htmlFor={`entity-${entity}`}
                      className="text-sm font-normal cursor-pointer capitalize"
                    >
                      {entity}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Filtre Statut */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full sm:w-auto">
              <Filter className="mr-2 h-4 w-4" />
              Statut
              {successFilter !== null && (
                <Badge variant="secondary" className="ml-2">1</Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Filtrer par statut</h4>
              {[
                { label: 'Succès', value: true },
                { label: 'Échec', value: false },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center space-x-2">
                  <Checkbox
                    id={`status-${label}`}
                    checked={successFilter === value}
                    onCheckedChange={() =>
                      setSuccessFilter((prev) => (prev === value ? null : value))
                    }
                  />
                  <label htmlFor={`status-${label}`} className="text-sm font-normal cursor-pointer">
                    {label}
                  </label>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Clear filters */}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8">
          <X className="mr-2 h-4 w-4" />
          Réinitialiser les filtres
        </Button>
      )}

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Utilisateur</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entité</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Message</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : logs.length ? (
              logs.map((log) => (
                <TableRow
                  key={log._id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => navigate(`/logs/${log._id}`)}
                >
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm', { locale: fr })}
                  </TableCell>
                  <TableCell className="text-sm">
                    {log.userId
                      ? `${log.userId.firstName} ${log.userId.lastName}`
                      : '—'}
                  </TableCell>
                  <TableCell>
                    <Badge className={ACTION_COLORS[log.action] ?? 'bg-gray-400'}>
                      {ACTION_LABELS[log.action] ?? log.action}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="capitalize text-sm">{log.entity}</span>
                  </TableCell>
                  <TableCell>
                    <Badge className={log.success ? 'bg-green-500' : 'bg-red-500'}>
                      {log.success ? 'Succès' : 'Échec'}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                    {log.message ?? '—'}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Aucun log trouvé.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {total} log(s) — page {currentPage} sur {totalPages}
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline" size="sm"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            <ChevronLeft className="h-4 w-4 -ml-3" />
          </Button>
          <Button
            variant="outline" size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {pageNumbers[0] > 1 && (
            <>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(1)}>1</Button>
              {pageNumbers[0] > 2 && <span className="px-1 text-muted-foreground">…</span>}
            </>
          )}
          {pageNumbers.map((page) => (
            <Button
              key={page}
              variant={page === currentPage ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentPage(page)}
            >
              {page}
            </Button>
          ))}
          {pageNumbers[pageNumbers.length - 1] < totalPages && (
            <>
              {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
                <span className="px-1 text-muted-foreground">…</span>
              )}
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(totalPages)}>
                {totalPages}
              </Button>
            </>
          )}

          <Button
            variant="outline" size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline" size="sm"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
            <ChevronRight className="h-4 w-4 -ml-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}

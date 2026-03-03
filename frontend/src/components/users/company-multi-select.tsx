import { useState } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Company } from "@/types/company.types";

interface CompanyMultiSelectProps {
  companies: Company[];
  value: string[];
  onChange: (value: string[]) => void;
}

export function CompanyMultiSelect({
  companies,
  value,
  onChange,
}: CompanyMultiSelectProps) {
  const [open, setOpen] = useState(false);

  const selectedCompanies = companies.filter((company) =>
    value.includes(company._id),
  );

  const toggleCompany = (companyId: string) => {
    const newValue = value.includes(companyId)
      ? value.filter((id) => id !== companyId)
      : [...value, companyId];
    onChange(newValue);
  };

  const removeCompany = (companyId: string) => {
    onChange(value.filter((id) => id !== companyId));
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedCompanies.length > 0
              ? `${selectedCompanies.length} entreprise(s) sélectionnée(s)`
              : "Sélectionner des entreprises"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Rechercher une entreprise..." />
            <CommandEmpty>Aucune entreprise trouvée.</CommandEmpty>
            <CommandGroup className="max-h-64 overflow-auto">
              {companies.map((company) => (
                <CommandItem
                  key={company._id}
                  value={company.name}
                  onSelect={() => toggleCompany(company._id)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value.includes(company._id) ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {company.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedCompanies.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedCompanies.map((company) => (
            <Badge key={company._id} variant="secondary">
              {company.name}
              <button
                type="button"
                className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                onClick={() => removeCompany(company._id)}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

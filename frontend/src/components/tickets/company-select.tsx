import { useState, useMemo } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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

interface CompanySelectProps {
  companies: Company[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function CompanySelect({
  companies,
  value,
  onChange,
  disabled,
}: CompanySelectProps) {
  const [open, setOpen] = useState(false);

  const selectedCompany = useMemo(
    () => companies.find((company) => company._id === value),
    [companies, value],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {selectedCompany
            ? selectedCompany.name
            : "Sélectionner une entreprise"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
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
                onSelect={() => {
                  onChange(company._id);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === company._id ? "opacity-100" : "opacity-0",
                  )}
                />
                {company.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

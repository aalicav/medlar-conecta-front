import { useState, useEffect } from "react";
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
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { specialtyService, MedicalSpecialty } from "@/services/specialtyService";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Tuss {
  id: number;
  code: string;
  description: string;
}

interface TussSearchProps {
  onSelect: (tuss: Tuss) => void;
  defaultValue?: Tuss;
}

export function TussSearch({ onSelect, defaultValue }: TussSearchProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [tussProcedures, setTussProcedures] = useState<Tuss[]>([]);
  const [selectedTuss, setSelectedTuss] = useState<Tuss | undefined>(defaultValue);
  const [showSpecialtySelect, setShowSpecialtySelect] = useState(false);
  const [specialties, setSpecialties] = useState<MedicalSpecialty[]>([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState<MedicalSpecialty | null>(null);

  useEffect(() => {
    const loadTussProcedures = async () => {
      try {
        const response = await fetch(`/api/tuss?search=${searchTerm}`);
        const data = await response.json();
        setTussProcedures(data);
      } catch (error) {
        console.error("Error loading TUSS procedures:", error);
      }
    };

    if (searchTerm.length >= 2 || tussProcedures.length === 0) {
      loadTussProcedures();
    }
  }, [searchTerm]);

  useEffect(() => {
    const loadSpecialties = async () => {
      try {
        const data = await specialtyService.list();
        setSpecialties(data);
      } catch (error) {
        console.error("Error loading specialties:", error);
      }
    };

    if (showSpecialtySelect) {
      loadSpecialties();
    }
  }, [showSpecialtySelect]);

  const handleTussSelect = (tuss: Tuss) => {
    setSelectedTuss(tuss);
    if (tuss.code === "10101012") {
      setShowSpecialtySelect(true);
    } else {
      setShowSpecialtySelect(false);
      setSelectedSpecialty(null);
      onSelect(tuss);
    }
    setOpen(false);
  };

  const handleSpecialtySelect = (specialtyId: string) => {
    const specialty = specialties.find(s => s.id.toString() === specialtyId);
    if (specialty && selectedTuss) {
      setSelectedSpecialty(specialty);
      onSelect({
        ...selectedTuss,
        description: `${selectedTuss.description} - ${specialty.name}`
      });
    }
  };

  return (
    <div className="space-y-4">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedTuss ? (
              <div className="flex flex-col items-start">
                <span className="font-medium">{selectedTuss.code}</span>
                <span className="text-sm text-muted-foreground truncate">
                  {selectedTuss.description}
                  {selectedSpecialty && ` - ${selectedSpecialty.name}`}
                </span>
              </div>
            ) : (
              "Selecione um procedimento"
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0">
          <Command>
            <CommandInput
              placeholder="Busque por código ou descrição..."
              onValueChange={setSearchTerm}
            />
            <CommandEmpty>Nenhum procedimento encontrado.</CommandEmpty>
            <CommandGroup className="max-h-[300px] overflow-auto">
              {tussProcedures.map((tuss) => (
                <CommandItem
                  key={tuss.id}
                  value={tuss.code + tuss.description}
                  onSelect={() => handleTussSelect(tuss)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedTuss?.id === tuss.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium">{tuss.code}</span>
                    <span className="text-sm text-muted-foreground">
                      {tuss.description}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {showSpecialtySelect && (
        <Select onValueChange={handleSpecialtySelect} value={selectedSpecialty?.id.toString()}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione uma especialidade" />
          </SelectTrigger>
          <SelectContent>
            {specialties.map((specialty) => (
              <SelectItem key={specialty.id} value={specialty.id.toString()}>
                {specialty.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
} 
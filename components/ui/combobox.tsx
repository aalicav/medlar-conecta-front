"use client"

import * as React from "react"
import { Check, ChevronsUpDown, PlusCircle } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export type ComboboxOption = {
  value: string
  label: string
}

interface ComboboxProps {
  options: ComboboxOption[]
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  emptyText?: string
  searchPlaceholder?: string
  className?: string
  onCreateNew?: () => void
  createNewText?: string
  disabled?: boolean
  loading?: boolean
  onSearch?: (query: string) => void
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Select an option",
  emptyText = "No results found.",
  searchPlaceholder = "Search...",
  className,
  onCreateNew,
  createNewText = "Create new",
  disabled = false,
  loading = false,
  onSearch,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")

  const selectedOption = React.useMemo(
    () => options.find((option) => option.value === value),
    [options, value]
  )

  // Handle search input change
  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
    if (onSearch) {
      onSearch(query)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={disabled}
        >
          {loading ? (
            <span className="text-muted-foreground">Loading...</span>
          ) : value && selectedOption ? (
            selectedOption.label
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command 
          className="w-full"
          // Disable filtering completely for external search
          shouldFilter={false}
        >
          <CommandInput 
            placeholder={searchPlaceholder} 
            onValueChange={handleSearchChange} 
            value={searchQuery}
          />
          <CommandList>
            <CommandEmpty>
              {emptyText}
              {onCreateNew && (
                <Button
                  variant="ghost"
                  className="w-full mt-2 justify-start"
                  onClick={() => {
                    setOpen(false)
                    onCreateNew()
                  }}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  {createNewText}
                </Button>
              )}
            </CommandEmpty>
            <CommandGroup>
              {/* Show all options without filtering */}
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={(currentValue) => {
                    onValueChange(currentValue)
                    setOpen(false)
                    setSearchQuery("")
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
} 
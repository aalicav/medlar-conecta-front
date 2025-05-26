"use client"

import { useState, useEffect } from "react"
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  onPaginationChange?: (page: number, pageSize: number) => void
  onSortingChange?: (sorting: SortingState) => void
  onFilterChange?: (columnId: string, value: string) => void
  pageCount?: number
  currentPage?: number
  pageSize?: number
  totalItems?: number
  isLoading?: boolean
  pageSizeOptions?: number[]
}

export function DataTable<TData, TValue>({
  columns,
  data,
  onPaginationChange,
  onSortingChange,
  onFilterChange,
  pageCount = 1,
  currentPage = 1,
  pageSize = 10,
  totalItems = 0,
  isLoading = false,
  pageSizeOptions = [10, 20, 30, 50, 100],
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({})

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    pageCount,
    state: {
      sorting,
      pagination: {
        pageIndex: currentPage - 1,
        pageSize,
      },
    },
  })

  // Handle sorting changes
  useEffect(() => {
    if (onSortingChange && sorting.length > 0) {
      onSortingChange(sorting)
    }
  }, [sorting, onSortingChange])

  // Handle filter changes
  const handleFilterChange = (columnId: string, value: string) => {
    setColumnFilters((prev) => ({
      ...prev,
      [columnId]: value,
    }))

    if (onFilterChange) {
      onFilterChange(columnId, value)
    }
  }

  // Clear filter for a specific column
  const clearFilter = (columnId: string) => {
    setColumnFilters((prev) => {
      const newFilters = { ...prev }
      delete newFilters[columnId]
      return newFilters
    })

    if (onFilterChange) {
      onFilterChange(columnId, "")
    }
  }

  return (
    <div className="space-y-4">
      {/* Filter inputs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {columns
          .filter((column) => (column as any).enableFiltering)
          .map((column) => {
            const columnId = String(column.id)
            return (
              <div key={columnId} className="flex items-center space-x-2">
                <div className="relative w-full">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={`Filtrar por ${column.id}`}
                    value={columnFilters[columnId] || ""}
                    onChange={(e) => handleFilterChange(columnId, e.target.value)}
                    className="pl-8 w-full"
                  />
                  {columnFilters[columnId] && (
                    <button onClick={() => clearFilter(columnId)} className="absolute right-2 top-2.5">
                      <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const isSortable = header.column.getCanSort()
                  return (
                    <TableHead key={header.id} className="whitespace-nowrap">
                      {isSortable ? (
                        <div
                          className={cn(
                            "flex items-center space-x-1 cursor-pointer",
                            isSortable && "cursor-pointer select-none",
                          )}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {isSortable && (
                            <span>
                              {header.column.getIsSorted() === "asc" ? (
                                <ArrowUp className="ml-1 h-4 w-4" />
                              ) : header.column.getIsSorted() === "desc" ? (
                                <ArrowDown className="ml-1 h-4 w-4" />
                              ) : (
                                <ArrowUpDown className="ml-1 h-4 w-4" />
                              )}
                            </span>
                          )}
                        </div>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: pageSize }).map((_, index) => (
                <TableRow key={index}>
                  {columns.map((_, colIndex) => (
                    <TableCell key={colIndex}>
                      <div className="h-6 bg-muted animate-pulse rounded" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Nenhum resultado encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Updated Pagination */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Mostrar</span>
          <select
            className="h-8 w-20 rounded-md border border-input bg-background px-2 py-1 text-sm"
            value={pageSize}
            onChange={(e) => onPaginationChange?.(1, Number(e.target.value))}
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <span className="text-sm text-muted-foreground">registros por página</span>
        </div>

        <div className="text-sm text-muted-foreground">
          Mostrando {data.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} a{" "}
          {Math.min(currentPage * pageSize, totalItems)} de {totalItems} registros
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPaginationChange?.(1, pageSize)}
            disabled={currentPage === 1}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPaginationChange?.(currentPage - 1, pageSize)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            Página {currentPage} de {pageCount}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPaginationChange?.(currentPage + 1, pageSize)}
            disabled={currentPage === pageCount}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPaginationChange?.(pageCount, pageSize)}
            disabled={currentPage === pageCount}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

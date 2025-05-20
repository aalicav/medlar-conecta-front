import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  // Define o range de páginas para mostrar
  const getPageRange = () => {
    const delta = 2; // Número de páginas para mostrar antes e depois da página atual
    const range = [];
    
    for (
      let i = Math.max(1, currentPage - delta);
      i <= Math.min(totalPages, currentPage + delta);
      i++
    ) {
      range.push(i);
    }
    
    // Adiciona ... para páginas omitidas
    if (currentPage - delta > 1) {
      range.unshift('...');
      range.unshift(1);
    } else if (currentPage - delta === 1) {
      range.unshift(1);
    }
    
    if (currentPage + delta < totalPages) {
      range.push('...');
      range.push(totalPages);
    } else if (currentPage + delta === totalPages - 1) {
      range.push(totalPages);
    }
    
    return range;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center space-x-2">
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
        className="hidden sm:flex"
      >
        <ChevronsLeft className="h-4 w-4" />
        <span className="sr-only">Primeira página</span>
      </Button>
      
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="sr-only">Página anterior</span>
      </Button>
      
      <div className="flex items-center space-x-1">
        {getPageRange().map((page, index) => 
          page === '...' ? (
            <span key={`ellipsis-${index}`} className="px-2">...</span>
          ) : (
            <Button
              key={`page-${page}`}
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(page as number)}
              className="min-w-8"
            >
              {page}
            </Button>
          )
        )}
      </div>
      
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <ChevronRight className="h-4 w-4" />
        <span className="sr-only">Próxima página</span>
      </Button>
      
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
        className="hidden sm:flex"
      >
        <ChevronsRight className="h-4 w-4" />
        <span className="sr-only">Última página</span>
      </Button>
    </div>
  );
} 
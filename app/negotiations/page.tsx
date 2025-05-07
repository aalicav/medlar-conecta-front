"use client"

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Plus, 
  MoreVertical, 
  FileText, 
  CheckCircle, 
  XCircle, 
  PauseCircle,
  Filter,
  FileDown
} from 'lucide-react';

import { 
  negotiationService, 
  Negotiation, 
  negotiationStatusLabels, 
  NegotiationStatus 
} from '../services/negotiationService';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { toast } from '@/components/ui/use-toast';

// Helper function to map status to color variants
const getStatusVariant = (status: NegotiationStatus) => {
  switch (status) {
    case 'draft': return 'outline';
    case 'submitted': return 'secondary';
    case 'pending': return 'default';
    case 'complete': return 'default';
    case 'approved': return 'default';
    case 'partially_approved': return 'secondary';
    case 'rejected': return 'destructive';
    case 'cancelled': return 'outline';
    default: return 'outline';
  }
};

export default function NegotiationsPage() {
  const router = useRouter();
  const [negotiations, setNegotiations] = useState<Negotiation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<NegotiationStatus | ''>('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: 'submit' | 'cancel' | null;
    id: number | null;
    title: string;
    description: string;
  }>({
    open: false,
    action: null,
    id: null,
    title: '',
    description: ''
  });

  const fetchNegotiations = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const response = await negotiationService.getNegotiations({
        search: searchText || undefined,
        status: statusFilter as NegotiationStatus || undefined,
        sort_field: sortField,
        sort_order: sortOrder,
        page,
        per_page: pageSize
      });
      
      setNegotiations(response.data);
      setPagination({
        current: response.meta.current_page,
        pageSize: response.meta.per_page,
        total: response.meta.total
      });
    } catch (error) {
      console.error('Error fetching negotiations:', error);
      toast({
        title: "Error",
        description: "Failed to load negotiations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNegotiations(pagination.current, pagination.pageSize);
  }, [searchText, statusFilter, sortField, sortOrder]);

  const handleSearch = (value: string) => {
    setSearchText(value);
    setPagination({ ...pagination, current: 1 });
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value as NegotiationStatus | '');
    setPagination({ ...pagination, current: 1 });
  };

  const handlePageChange = (page: number) => {
    setPagination({ ...pagination, current: page });
    fetchNegotiations(page, pagination.pageSize);
  };

  const handleSortChange = (field: string) => {
    const newOrder = field === sortField && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortOrder(newOrder);
  };

  const confirmAction = (action: 'submit' | 'cancel', id: number) => {
    const titles = {
      submit: 'Submit Negotiation',
      cancel: 'Cancel Negotiation'
    };
    
    const descriptions = {
      submit: 'Are you sure you want to submit this negotiation for approval?',
      cancel: 'Are you sure you want to cancel this negotiation?'
    };
    
    setConfirmDialog({
      open: true,
      action,
      id,
      title: titles[action],
      description: descriptions[action]
    });
  };

  const handleActionConfirm = async () => {
    if (!confirmDialog.action || !confirmDialog.id) return;
    
    try {
      if (confirmDialog.action === 'submit') {
        await negotiationService.submitNegotiation(confirmDialog.id);
        toast({
          title: "Success",
          description: "Negotiation submitted successfully",
        });
      } else if (confirmDialog.action === 'cancel') {
        await negotiationService.cancelNegotiation(confirmDialog.id);
        toast({
          title: "Success",
          description: "Negotiation cancelled successfully",
        });
      }
      
      fetchNegotiations(pagination.current, pagination.pageSize);
    } catch (error) {
      console.error(`Error ${confirmDialog.action}ing negotiation:`, error);
      toast({
        title: "Error",
        description: `Failed to ${confirmDialog.action} negotiation`,
        variant: "destructive"
      });
    } finally {
      setConfirmDialog({ ...confirmDialog, open: false });
    }
  };

  const handleGenerateContract = async (id: number) => {
    try {
      const response = await negotiationService.generateContract(id);
      toast({
        title: "Success",
        description: "Contract generated successfully",
      });
      router.push(`/contracts/${response.data.contract_id}`);
    } catch (error) {
      console.error('Error generating contract:', error);
      toast({
        title: "Error",
        description: "Failed to generate contract",
        variant: "destructive"
      });
    }
  };

  const renderPagination = () => {
    const { current, total, pageSize } = pagination;
    const totalPages = Math.ceil(total / pageSize);
    
    if (totalPages <= 1) return null;
    
    return (
      <Pagination className="mt-4">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious 
              onClick={() => handlePageChange(Math.max(1, current - 1))}
              className={current === 1 ? 'pointer-events-none opacity-50' : ''}
            />
          </PaginationItem>
          
          {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
            let pageNum = current <= 3 
              ? i + 1 
              : current >= totalPages - 2 
                ? totalPages - 4 + i 
                : current - 2 + i;
                
            if (pageNum > totalPages) return null;
            if (pageNum < 1) pageNum = 1;
            
            return (
              <PaginationItem key={pageNum}>
                <PaginationLink 
                  isActive={pageNum === current}
                  onClick={() => handlePageChange(pageNum)}
                >
                  {pageNum}
                </PaginationLink>
              </PaginationItem>
            );
          })}
          
          {totalPages > 5 && current < totalPages - 2 && (
            <>
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink onClick={() => handlePageChange(totalPages)}>
                  {totalPages}
                </PaginationLink>
              </PaginationItem>
            </>
          )}
          
          <PaginationItem>
            <PaginationNext 
              onClick={() => handlePageChange(Math.min(totalPages, current + 1))}
              className={current === totalPages ? 'pointer-events-none opacity-50' : ''}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  return (
    <div className="container py-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Negotiations</h1>
          <p className="text-muted-foreground">Manage your negotiations with health plans, professionals, and clinics</p>
        </div>
        
        <Button onClick={() => router.push('/negotiations/new')}>
          <Plus className="mr-2 h-4 w-4" />
          New Negotiation
        </Button>
      </div>
      
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="w-full sm:w-auto flex-1">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search negotiations..."
                  value={searchText}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Select
                value={statusFilter || ''}
                onValueChange={handleStatusFilter}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(negotiationStatusLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="relative w-full overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSortChange('title')}
                  >
                    Title {sortField === 'title' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSortChange('created_at')}
                  >
                    Created {sortField === 'created_at' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : negotiations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No negotiations found
                    </TableCell>
                  </TableRow>
                ) : (
                  negotiations.map((negotiation) => (
                    <TableRow key={negotiation.id}>
                      <TableCell>
                        <Link 
                          href={`/negotiations/${negotiation.id}`}
                          className="font-medium hover:underline"
                        >
                          {negotiation.title}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{negotiation.negotiable?.name || '-'}</span>
                          <span className="text-xs text-muted-foreground">
                            {negotiation.negotiable_type.split('\\').pop() === 'HealthPlan' 
                              ? 'Health Plan' 
                              : negotiation.negotiable_type.split('\\').pop() === 'Professional'
                                ? 'Professional'
                                : 'Clinic'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(negotiation.status)}>
                          {negotiationStatusLabels[negotiation.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(negotiation.start_date).toLocaleDateString()} - {new Date(negotiation.end_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {new Date(negotiation.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/negotiations/${negotiation.id}`)}>
                              <FileText className="mr-2 h-4 w-4" />
                              View
                            </DropdownMenuItem>
                            
                            {negotiation.status === 'draft' && (
                              <>
                                <DropdownMenuItem onClick={() => router.push(`/negotiations/${negotiation.id}/edit`)}>
                                  <FileText className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => confirmAction('submit', negotiation.id)}>
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Submit for approval
                                </DropdownMenuItem>
                              </>
                            )}
                            
                            {['draft', 'submitted', 'pending'].includes(negotiation.status) && (
                              <DropdownMenuItem onClick={() => confirmAction('cancel', negotiation.id)}>
                                <XCircle className="mr-2 h-4 w-4" />
                                Cancel
                              </DropdownMenuItem>
                            )}
                            
                            {negotiation.status === 'approved' && (
                              <DropdownMenuItem onClick={() => handleGenerateContract(negotiation.id)}>
                                <FileDown className="mr-2 h-4 w-4" />
                                Generate Contract
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {renderPagination()}
        </CardContent>
      </Card>
      
      <AlertDialog 
        open={confirmDialog.open} 
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleActionConfirm}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 
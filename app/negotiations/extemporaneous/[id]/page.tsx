'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { LoadingSpinner } from '@/app/components/ui/loading-spinner';
import { usePermissions } from '@/app/hooks/usePermissions';
import { apiClient, getErrorMessage } from '@/app/services/api-client';
import { notificationService } from '@/app/services/notification-service';
import { formatCurrency, formatDate } from '@/lib/utils';
import { PencilIcon } from 'lucide-react';
import Link from 'next/link';

export default function ExtemporaneousNegotiationDetail() {
  const params = useParams<{ id: string }>();
  const negotiationId = params?.id;
  const router = useRouter();
  const { toast } = useToast();
  const { hasPermission, hasRole } = usePermissions();
  const [loading, setLoading] = useState(true);
  const [negotiation, setNegotiation] = useState<any>(null);
  const [approvalValue, setApprovalValue] = useState<string>('');
  const [approvalNotes, setApprovalNotes] = useState<string>('');
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [addendumText, setAddendumText] = useState<string>('');
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showAddendumDialog, setShowAddendumDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Permissions check
  const canApprove = hasRole(['commercial_manager', 'director', 'admin', 'super_admin']);
  const canAddendum = hasRole(['legal', 'commercial_manager', 'admin', 'super_admin']);
  
  // Fetch negotiation details
  const fetchNegotiation = async () => {
    try {
      // NOTA: Em versões futuras do Next.js, será necessário usar React.use(params) 
      // em vez do acesso direto a params.id
      const response = await apiClient.get(`/extemporaneous-negotiations/${negotiationId}`);
      const negotiationData = response.data.data;
      
      setNegotiation(negotiationData);
      
      // Set initial approval value to the requested value
      if (negotiationData?.requested_value) {
        setApprovalValue(negotiationData.requested_value.toString());
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: getErrorMessage(error),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (negotiationId) {
      fetchNegotiation();
    }
  }, [negotiationId, toast]);

  // Handle approve negotiation
  const handleApprove = async () => {
    if (!canApprove) {
      toast({
        title: 'Permission Denied',
        description: 'You do not have permission to approve negotiations',
        variant: 'destructive',
      });
      return;
    }

    if (!approvalValue || parseFloat(approvalValue) <= 0) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a valid approval value',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await apiClient.post(`/extemporaneous-negotiations/${negotiationId}/approve`, {
        approved_value: parseFloat(approvalValue),
        approval_notes: approvalNotes,
        is_requiring_addendum: true,
      });
      
      toast({
        title: 'Success',
        description: 'Negotiation approved successfully',
      });
      
      // Send notification to Adla in the commercial_manager team
      try {
        await notificationService.sendToRole('commercial_manager', {
          title: 'New Addendum Required',
          body: `An extemporaneous negotiation for contract #${negotiation.contract.contract_number} has been approved and requires a formal addendum.`,
          action_link: `/negotiations/extemporaneous/${negotiationId}`,
          icon: 'file-plus',
          priority: 'high'
        });
      } catch (notificationError) {
        console.error('Failed to send notification:', notificationError);
      }
      
      // Refresh negotiation data
      setNegotiation(response.data.data);
    } catch (error) {
      toast({
        title: 'Error',
        description: getErrorMessage(error),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle reject negotiation
  const handleReject = async () => {
    if (!canApprove) {
      toast({
        title: 'Permission Denied',
        description: 'You do not have permission to reject negotiations',
        variant: 'destructive',
      });
      return;
    }

    if (!rejectionReason || rejectionReason.length < 5) {
      toast({
        title: 'Validation Error',
        description: 'Please provide a detailed rejection reason (minimum 5 characters)',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await apiClient.post(`/extemporaneous-negotiations/${negotiationId}/reject`, {
        rejection_reason: rejectionReason,
      });
      
      toast({
        title: 'Success',
        description: 'Negotiation rejected successfully',
      });
      
      // Refresh negotiation data
      setNegotiation(response.data.data);
    } catch (error) {
      toast({
        title: 'Error',
        description: getErrorMessage(error),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle marking as included in addendum
  const handleMarkAsAddendumIncluded = async () => {
    if (!canAddendum) {
      toast({
        title: 'Permission Denied',
        description: 'You do not have permission to update addendum status',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await apiClient.post(`/extemporaneous-negotiations/${negotiationId}/addendum`, {
        addendum_number: `A-${Date.now().toString().slice(-6)}`,
        addendum_date: new Date().toISOString().split('T')[0],
        notes: 'Addendum created from the system',
      });
      
      toast({
        title: 'Success',
        description: 'Negotiation marked as included in addendum successfully',
      });
      
      // Refresh negotiation data
      setNegotiation(response.data.data);
    } catch (error) {
      toast({
        title: 'Error',
        description: getErrorMessage(error),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!negotiation) {
    return (
      <div className="text-center p-8">
        <h2 className="text-xl font-bold">Negotiation not found</h2>
        <p className="mt-2 text-muted-foreground">The requested negotiation does not exist or you don't have permission to view it.</p>
        <Button onClick={() => router.push('/negotiations/extemporaneous')} className="mt-4">
          Return to Negotiations
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Extemporaneous Negotiation Details</h1>
          <p className="text-muted-foreground">
            Review and process exceptional procedure negotiations
          </p>
        </div>
        
        <div className="flex gap-2">
          {negotiation.status === 'pending' && hasPermission('edit extemporaneous negotiations') && (
            <Button variant="outline" onClick={() => router.push(`/negotiations/extemporaneous/${negotiationId}/edit`)}>
              <PencilIcon className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
          <Button variant="outline" onClick={() => router.push('/negotiations/extemporaneous')}>
            Back to List
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main information */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Negotiation Information</CardTitle>
              <Badge 
                variant={
                  negotiation.status === 'approved' ? 'success' : 
                  negotiation.status === 'rejected' ? 'destructive' : 
                  'secondary'
                }
              >
                {negotiation.status.toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Contract</Label>
                <p className="text-sm font-medium">#{negotiation.contract?.contract_number || 'N/A'}</p>
              </div>
              
              <div>
                <Label>TUSS Procedure</Label>
                <p className="text-sm font-medium">
                  {negotiation.tuss?.code || 'N/A'} - {negotiation.tuss?.description || 'N/A'}
                </p>
              </div>
              
              <div>
                <Label>Requested Value</Label>
                <p className="text-sm font-medium">
                  {formatCurrency(negotiation.requested_value)}
                </p>
              </div>
              
              <div>
                <Label>Urgency Level</Label>
                <p className="text-sm font-medium capitalize">
                  {negotiation.urgency_level || 'N/A'}
                </p>
              </div>
              
              <div>
                <Label>Requested By</Label>
                <p className="text-sm font-medium">
                  {negotiation.requestedBy?.name || 'N/A'}
                </p>
              </div>
              
              <div>
                <Label>Request Date</Label>
                <p className="text-sm font-medium">
                  {formatDate(negotiation.created_at)}
                </p>
              </div>
            </div>
            
            <div>
              <Label>Justification</Label>
              <p className="text-sm mt-1 p-2 bg-muted rounded-md">
                {negotiation.justification || 'No justification provided'}
              </p>
            </div>
            
            {negotiation.status === 'approved' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <Label>Approved Value</Label>
                    <p className="text-sm font-medium">
                      {formatCurrency(negotiation.approved_value)}
                    </p>
                  </div>
                  
                  <div>
                    <Label>Approved By</Label>
                    <p className="text-sm font-medium">
                      {negotiation.approvedBy?.name || 'N/A'}
                    </p>
                  </div>
                  
                  <div>
                    <Label>Approval Date</Label>
                    <p className="text-sm font-medium">
                      {formatDate(negotiation.approved_at)}
                    </p>
                  </div>
                  
                  <div>
                    <Label>Requires Addendum</Label>
                    <p className="text-sm font-medium">
                      {negotiation.is_requiring_addendum ? 'Yes' : 'No'}
                    </p>
                  </div>
                </div>
                
                {negotiation.approval_notes && (
                  <div>
                    <Label>Approval Notes</Label>
                    <p className="text-sm mt-1 p-2 bg-muted rounded-md">
                      {negotiation.approval_notes}
                    </p>
                  </div>
                )}
                
                {negotiation.is_requiring_addendum && (
                  <div className="mt-4">
                    <Label>Addendum Status</Label>
                    <div className="mt-1">
                      {negotiation.addendum_included ? (
                        <div className="p-2 bg-green-50 border border-green-200 rounded-md">
                          <p className="text-sm text-green-800 font-medium">
                            Included in Addendum #{negotiation.addendum_number} on {formatDate(negotiation.addendum_date)}
                          </p>
                          {negotiation.addendum_notes && (
                            <p className="text-sm text-green-700 mt-1">
                              {negotiation.addendum_notes}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="p-2 bg-amber-50 border border-amber-200 rounded-md">
                          <p className="text-sm text-amber-800 font-medium">
                            Pending addendum creation
                          </p>
                          {canAddendum && (
                            <Button 
                              onClick={handleMarkAsAddendumIncluded}
                              className="mt-2"
                              size="sm"
                              disabled={isSubmitting}
                            >
                              Mark as Included in Addendum
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
            
            {negotiation.status === 'rejected' && (
              <div>
                <Label>Rejection Reason</Label>
                <p className="text-sm mt-1 p-2 bg-red-50 border border-red-200 rounded-md text-red-800">
                  {negotiation.rejection_reason || 'No reason provided'}
                </p>
                <div className="mt-2">
                  <Label>Rejected By</Label>
                  <p className="text-sm font-medium">
                    {negotiation.approvedBy?.name || 'N/A'} on {formatDate(negotiation.approved_at)}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Action panel */}
        {negotiation.status === 'pending' && canApprove && (
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="approvalValue">Approval Value</Label>
                <Input
                  id="approvalValue"
                  type="number"
                  step="0.01"
                  value={approvalValue}
                  onChange={(e) => setApprovalValue(e.target.value)}
                  placeholder="Enter approved value"
                />
              </div>
              
              <div>
                <Label htmlFor="approvalNotes">Approval Notes (Optional)</Label>
                <Textarea
                  id="approvalNotes"
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder="Add any notes or conditions"
                  rows={3}
                />
              </div>
              
              <Button
                className="w-full"
                onClick={handleApprove}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Approving...' : 'Approve Negotiation'}
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t"></span>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or</span>
                </div>
              </div>
              
              <div>
                <Label htmlFor="rejectionReason">Rejection Reason</Label>
                <Textarea
                  id="rejectionReason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explain why this negotiation is being rejected"
                  rows={3}
                />
              </div>
              
              <Button
                variant="destructive"
                className="w-full"
                onClick={handleReject}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Rejecting...' : 'Reject Negotiation'}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 
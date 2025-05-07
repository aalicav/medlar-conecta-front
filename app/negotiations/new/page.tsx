"use client"

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';

import { 
  negotiationService, 
  CreateNegotiationDto
} from '../../services/negotiationService';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/use-toast';
import { useForm } from 'react-hook-form';

interface EntityOption {
  id: number;
  name: string;
  type: string;
}

interface TussOption {
  id: number;
  code: string;
  name: string;
}

interface FormValues {
  title: string;
  entity_type: string;
  entity_id: number;
  start_date: Date;
  end_date: Date;
  description?: string;
  notes?: string;
  items: {
    tuss_id: number;
    proposed_value: number;
    notes?: string;
  }[];
}

export default function CreateNegotiationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [entityOptions, setEntityOptions] = useState<EntityOption[]>([]);
  const [selectedEntityType, setSelectedEntityType] = useState<string>('');
  const [tussOptions, setTussOptions] = useState<TussOption[]>([]);
  
  const form = useForm<FormValues>({
    defaultValues: {
      title: '',
      entity_type: '',
      entity_id: 0,
      start_date: new Date(),
      end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      items: [{ tuss_id: 0, proposed_value: 0 }]
    }
  });

  // Load entity and TUSS options
  useEffect(() => {
    // For demonstration purposes, we'll use simulated data
    setEntityOptions([
      // Health Plans
      { id: 1, name: 'Unimed', type: 'App\\Models\\HealthPlan' },
      { id: 2, name: 'Amil', type: 'App\\Models\\HealthPlan' },
      { id: 3, name: 'SulAmérica', type: 'App\\Models\\HealthPlan' },
      // Professionals
      { id: 1, name: 'Dra. Ana Silva', type: 'App\\Models\\Professional' },
      { id: 2, name: 'Dr. Carlos Oliveira', type: 'App\\Models\\Professional' },
      // Clinics
      { id: 1, name: 'Clínica São Lucas', type: 'App\\Models\\Clinic' },
      { id: 2, name: 'Centro Médico Santa Maria', type: 'App\\Models\\Clinic' },
    ]);
    
    // Simulate TUSS procedures search
    setTussOptions([
      { id: 1, code: '10101012', name: 'Consulta em consultório' },
      { id: 2, code: '10101020', name: 'Consulta em pronto socorro' },
      { id: 3, code: '20101236', name: 'Raio-X de tórax' },
      { id: 4, code: '31301271', name: 'Avaliação fisioterapêutica' },
      { id: 5, code: '40202615', name: 'Hemograma completo' },
    ]);
  }, []);

  const handleEntityTypeChange = (value: string) => {
    setSelectedEntityType(value);
    form.setValue('entity_id', 0);
  };

  const onSubmit = async (values: FormValues) => {
    const formattedValues = {
      title: values.title,
      description: values.description,
      notes: values.notes,
      start_date: format(values.start_date, 'yyyy-MM-dd'),
      end_date: format(values.end_date, 'yyyy-MM-dd'),
      entity_type: values.entity_type,
      entity_id: values.entity_id,
      status: 'draft',
      items: values.items.map((item) => ({
        tuss_id: item.tuss_id,
        proposed_value: item.proposed_value,
        notes: item.notes
      }))
    };
    
    setLoading(true);
    try {
      const response = await negotiationService.createNegotiation(formattedValues as CreateNegotiationDto);
      toast({
        title: "Success",
        description: "Negotiation created successfully",
      });
      router.push(`/negotiations/${response.data.id}`);
    } catch (error) {
      console.error('Error creating negotiation:', error);
      toast({
        title: "Error",
        description: "Failed to create negotiation",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    const items = form.getValues('items');
    form.setValue('items', [...items, { tuss_id: 0, proposed_value: 0 }]);
  };

  const removeItem = (index: number) => {
    const items = form.getValues('items');
    if (items.length > 1) {
      form.setValue('items', items.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="container py-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-muted-foreground">
        <Link href="/dashboard" className="hover:underline">Dashboard</Link>
        <span>/</span>
        <Link href="/negotiations" className="hover:underline">Negotiations</Link>
        <span>/</span>
        <span>New Negotiation</span>
      </div>
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => router.push('/negotiations')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">New Negotiation</h1>
        </div>
      </div>
      
      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">General Information</h3>
                
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Negotiation Title</FormLabel>
                      <FormControl>
                        <Input placeholder="E.g., Price Table 2024 - Unimed" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="entity_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Entity Type</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            handleEntityTypeChange(value);
                          }}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select entity type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="App\Models\HealthPlan">Health Plan</SelectItem>
                            <SelectItem value="App\Models\Professional">Professional</SelectItem>
                            <SelectItem value="App\Models\Clinic">Clinic</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="entity_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Entity</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          value={field.value?.toString()}
                          disabled={!selectedEntityType}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select entity" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {entityOptions
                              .filter(entity => entity.type === selectedEntityType)
                              .map(entity => (
                                <SelectItem key={entity.id} value={entity.id.toString()}>
                                  {entity.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="start_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Start Date</FormLabel>
                        <DatePicker
                          date={field.value}
                          setDate={field.onChange}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="end_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>End Date</FormLabel>
                        <DatePicker
                          date={field.value}
                          setDate={field.onChange}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Brief description of this negotiation"
                          className="resize-none"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Additional notes or observations"
                          className="resize-none"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Negotiation Items</h3>
                  <Button type="button" variant="outline" size="sm" onClick={addItem}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Item
                  </Button>
                </div>
                
                {form.watch('items').map((item, index) => (
                  <div key={index} className="p-4 border rounded-md space-y-4">
                    <div className="flex justify-between">
                      <h4 className="font-medium">Item {index + 1}</h4>
                      {form.watch('items').length > 1 && (
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm"
                          onClick={() => removeItem(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`items.${index}.tuss_id`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Procedure (TUSS)</FormLabel>
                            <Select
                              onValueChange={(value) => field.onChange(parseInt(value))}
                              value={field.value?.toString()}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select procedure" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {tussOptions.map(tuss => (
                                  <SelectItem key={tuss.id} value={tuss.id.toString()}>
                                    {tuss.code} - {tuss.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name={`items.${index}.proposed_value`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Proposed Value (R$)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                value={field.value || ''}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name={`items.${index}.notes`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Additional notes for this item"
                              className="resize-none"
                              {...field}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ))}
              </div>
              
              <div className="flex justify-end">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="mr-2"
                  onClick={() => router.push('/negotiations')}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Negotiation'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
} 
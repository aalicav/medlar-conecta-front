export interface BillingRule {
  id: number;
  name: string;
  description?: string;
  entity_type: string;
  entity_id?: number;
  rule_type: string;
  billing_cycle?: string;
  billing_day?: number;
  payment_term_days?: number;
  invoice_generation_days_before?: number;
  payment_method?: string;
  conditions?: any;
  discounts?: any;
  tax_rules?: any;
  is_active: boolean;
  priority: number;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface BillingBatch {
  id: number;
  billing_rule_id: number;
  entity_type: string;
  entity_id: number;
  reference_period_start: string;
  reference_period_end: string;
  items_count: number;
  total_amount: number;
  fees_amount: number;
  taxes_amount: number;
  net_amount: number;
  billing_date: string;
  due_date: string;
  status: string;
  invoice_number?: string;
  invoice_path?: string;
  created_by: number;
  processing_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface BillingItem {
  id: number;
  billing_batch_id: number;
  item_type: string;
  item_id: number;
  reference_type?: string;
  reference_id?: number;
  description: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
} 
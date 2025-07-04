import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// Tipos para os dados de exportação
export interface ExportData {
  title: string;
  headers: string[];
  data: any[][];
  filename: string;
}

// Função para exportar dados como PDF
export const exportToPDF = (exportData: ExportData): void => {
  const doc = new jsPDF();
  
  // Adicionar título
  doc.setFontSize(16);
  doc.text(exportData.title, 14, 22);
  
  // Adicionar data de geração
  doc.setFontSize(10);
  doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 32);
  
  // Criar tabela
  autoTable(doc, {
    head: [exportData.headers],
    body: exportData.data,
    startY: 40,
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
  });
  
  // Salvar arquivo
  doc.save(`${exportData.filename}.pdf`);
};

// Função para exportar dados como Excel
export const exportToExcel = (exportData: ExportData): void => {
  // Criar workbook
  const wb = XLSX.utils.book_new();
  
  // Criar worksheet
  const ws = XLSX.utils.aoa_to_sheet([
    [exportData.title],
    [`Gerado em: ${new Date().toLocaleString('pt-BR')}`],
    [], // linha vazia
    exportData.headers,
    ...exportData.data
  ]);
  
  // Definir largura das colunas
  const colWidths = exportData.headers.map(() => ({ wch: 15 }));
  ws['!cols'] = colWidths;
  
  // Adicionar worksheet ao workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Dados');
  
  // Gerar arquivo e fazer download
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(data, `${exportData.filename}.xlsx`);
};

// Função específica para exportar lote de faturamento
export const exportBillingBatch = (batch: any, format: 'pdf' | 'excel'): void => {
  const headers = [
    'ID do Item',
    'Paciente',
    'CPF',
    'Profissional',
    'Especialidade',
    'Procedimento',
    'Código',
    'Valor',
    'Status',
    'Data Agendamento'
  ];
  
  const data = batch.items.map((item: any) => [
    item.id,
    item.patient.name,
    item.patient.cpf,
    item.provider.name,
    item.provider.specialty,
    item.procedure.description,
    item.procedure.code,
    `R$ ${item.amount.toFixed(2)}`,
    item.status,
    new Date(item.appointment.scheduled_date).toLocaleDateString('pt-BR')
  ]);
  
  const exportData: ExportData = {
    title: `Lote de Faturamento #${batch.id}`,
    headers,
    data,
    filename: `lote-faturamento-${batch.id}`
  };
  
  if (format === 'pdf') {
    exportToPDF(exportData);
  } else {
    exportToExcel(exportData);
  }
};

// Função específica para exportar verificação de valores
export const exportValueVerification = (verification: any, format: 'pdf' | 'excel'): void => {
  const headers = [
    'ID',
    'Tipo de Valor',
    'Valor Original',
    'Valor Verificado',
    'Status',
    'Prioridade',
    'Motivo',
    'Lote ID',
    'Data Criação'
  ];
  
  const data = [[
    verification.id,
    verification.value_type,
    `R$ ${verification.original_value.toFixed(2)}`,
    verification.verified_value ? `R$ ${verification.verified_value.toFixed(2)}` : '-',
    verification.status,
    verification.priority,
    verification.verification_reason || '-',
    verification.billing_batch_id || '-',
    new Date(verification.created_at).toLocaleDateString('pt-BR')
  ]];
  
  const exportData: ExportData = {
    title: `Verificação de Valor #${verification.id}`,
    headers,
    data,
    filename: `verificacao-valor-${verification.id}`
  };
  
  if (format === 'pdf') {
    exportToPDF(exportData);
  } else {
    exportToExcel(exportData);
  }
};

// Função para exportar lista de verificações
export const exportVerificationsList = (verifications: any[], format: 'pdf' | 'excel'): void => {
  const headers = [
    'ID',
    'Tipo de Valor',
    'Valor Original',
    'Status',
    'Prioridade',
    'Motivo',
    'Lote ID',
    'Data Criação'
  ];
  
  const data = verifications.map(verification => [
    verification.id,
    verification.value_type,
    `R$ ${verification.original_value.toFixed(2)}`,
    verification.status,
    verification.priority,
    verification.verification_reason || '-',
    verification.billing_batch_id || '-',
    new Date(verification.created_at).toLocaleDateString('pt-BR')
  ]);
  
  const exportData: ExportData = {
    title: 'Lista de Verificações de Valores',
    headers,
    data,
    filename: `verificacoes-valores-${new Date().toISOString().split('T')[0]}`
  };
  
  if (format === 'pdf') {
    exportToPDF(exportData);
  } else {
    exportToExcel(exportData);
  }
};

// Função para exportar lista de lotes
export const exportBatchesList = (batches: any[], format: 'pdf' | 'excel'): void => {
  const headers = [
    'ID',
    'Período Início',
    'Período Fim',
    'Valor Total',
    'Status',
    'Número de Itens',
    'Data Criação'
  ];
  
  const data = batches.map(batch => [
    batch.id,
    batch.reference_period_start,
    batch.reference_period_end,
    `R$ ${batch.total_amount.toFixed(2)}`,
    batch.status,
    batch.items.length,
    new Date(batch.created_at).toLocaleDateString('pt-BR')
  ]);
  
  const exportData: ExportData = {
    title: 'Lista de Lotes de Faturamento',
    headers,
    data,
    filename: `lotes-faturamento-${new Date().toISOString().split('T')[0]}`
  };
  
  if (format === 'pdf') {
    exportToPDF(exportData);
  } else {
    exportToExcel(exportData);
  }
}; 
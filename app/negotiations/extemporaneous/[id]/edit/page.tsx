"use client";

import { useParams } from 'next/navigation';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import FormularioNegociacaoExtemporanea from '../../NewExtemporaneousNegotiation';

export default function EditarNegociacaoExtemporaneaPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id || '';

  return (
    <div className="container py-6 space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb className="text-muted-foreground">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/negotiations">Negociações</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/negotiations/extemporaneous">Extemporâneas</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={`/negotiations/extemporaneous/${id}`}>Detalhes</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink className="font-medium text-foreground">Editar</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Editar Negociação Extemporânea</h1>
        <p className="text-muted-foreground">
          Atualize as informações desta solicitação de procedimento extemporâneo
        </p>
      </div>
      
      {/* Form Card */}
      <div className="mt-8">
        <FormularioNegociacaoExtemporanea negotiationId={id} isEditing={true} />
      </div>
    </div>
  );
} 
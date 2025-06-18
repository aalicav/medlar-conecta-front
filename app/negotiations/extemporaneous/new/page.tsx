"use client";

import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { NewExtemporaneousNegotiation } from '../NewExtemporaneousNegotiation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function NovaNegociacaoExtemporaneaPage() {
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
            <BreadcrumbLink className="font-medium text-foreground">Nova</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Nova Negociação Extemporânea</h1>
        <p className="text-muted-foreground">
          Crie uma solicitação para procedimentos não incluídos ou com valores especiais
        </p>
      </div>
      
      {/* Form Card */}
      <div className="mt-8">
        <NewExtemporaneousNegotiation />
      </div>
    </div>
  );
} 
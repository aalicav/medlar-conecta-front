"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { fetchResourceById, performResourceAction } from "@/services/resource-service"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/use-toast"
import { formatDate } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { ArrowLeft, Edit, CheckCircle, Upload, FileText, List } from "lucide-react"

interface HealthPlan {
  id: number
  name: string
  status: string
  // ... outros campos
}

export default function HealthPlanDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { hasPermission } = useAuth()
  const healthPlanId = Number(params.id)
  const [healthPlan, setHealthPlan] = useState<HealthPlan | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isApproving, setIsApproving] = useState(false)

  useEffect(() => {
    const fetchHealthPlan = async () => {
      try {
        const data = await fetchResourceById("health-plans", healthPlanId)
        setHealthPlan(data)
      } catch (error) {
        console.error("Error fetching health plan:", error)
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados do plano de saúde.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchHealthPlan()
  }, [healthPlanId])

  const handleApprove = async () => {
    setIsApproving(true)
    try {
      await performResourceAction("health-plans", healthPlanId, "approve")
      toast({
        title: "Plano aprovado",
        description: "O plano de saúde foi aprovado com sucesso.",
      })
      // Refresh the data
      const data = await fetchResourceById("health-plans", healthPlanId)
      setHealthPlan(data)
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível aprovar o plano de saúde.",
        variant: "destructive",
      })
    } finally {
      setIsApproving(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="success">Ativo</Badge>
      case "pending":
        return <Badge variant="warning">Pendente</Badge>
      case "inactive":
        return <Badge variant="destructive">Inativo</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-10 w-[250px]" />
            <Skeleton className="mt-2 h-4 w-[350px]" />
          </div>
          <Skeleton className="h-10 w-[100px]" />
        </div>
        <Skeleton className="h-[600px] w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{healthPlan?.name}</h1>
          <p className="text-muted-foreground">Detalhes do plano de saúde</p>
        </div>
        
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <Button variant="outline" onClick={() => router.push(`/health-plans/${healthPlanId}/procedures`)}>
            <List className="h-4 w-4 mr-2" />
            Gerenciar Procedimentos
          </Button>
          <Button variant="outline" onClick={() => router.push(`/health-plans/${healthPlanId}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
        </div>
      </div>

      <Tabs defaultValue="details" className="space-y-6">
        <TabsList>
          <TabsTrigger value="details">Detalhes</TabsTrigger>
          <TabsTrigger value="documents">Documentos</TabsTrigger>
          <TabsTrigger value="tuss">Negociação TUSS</TabsTrigger>
          <TabsTrigger value="contracts">Contratos</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações Gerais</CardTitle>
              <CardDescription>Detalhes do plano de saúde</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Nome</h3>
                  <p className="text-base">{healthPlan.name}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                  <p className="text-base">{getStatusBadge(healthPlan.status)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Cobertura</h3>
                  <p className="text-base">
                    {healthPlan.coverage === "national"
                      ? "Nacional"
                      : healthPlan.coverage === "regional"
                        ? "Regional"
                        : healthPlan.coverage === "state"
                          ? "Estadual"
                          : healthPlan.coverage}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Número ANS</h3>
                  <p className="text-base">{healthPlan.ans_number}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">E-mail de Contato</h3>
                  <p className="text-base">{healthPlan.contact_email}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Telefone de Contato</h3>
                  <p className="text-base">{healthPlan.contact_phone}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Data de Criação</h3>
                  <p className="text-base">{formatDate(healthPlan.created_at)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Última Atualização</h3>
                  <p className="text-base">{formatDate(healthPlan.updated_at)}</p>
                </div>
              </div>

              {healthPlan.description && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Descrição</h3>
                  <p className="text-base">{healthPlan.description}</p>
                </div>
              )}
            </CardContent>
            {healthPlan.status === "pending" && hasPermission("approve health plans") && (
              <CardFooter>
                <Button onClick={handleApprove} disabled={isApproving}>
                  {isApproving ? (
                    <>Aprovando...</>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Aprovar Plano
                    </>
                  )}
                </Button>
              </CardFooter>
            )}
          </Card>

          {healthPlan.address && (
            <Card>
              <CardHeader>
                <CardTitle>Endereço</CardTitle>
                <CardDescription>Endereço do plano de saúde</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Rua</h3>
                    <p className="text-base">{healthPlan.address.street}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Número</h3>
                    <p className="text-base">{healthPlan.address.number}</p>
                  </div>
                  {healthPlan.address.complement && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Complemento</h3>
                      <p className="text-base">{healthPlan.address.complement}</p>
                    </div>
                  )}
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Bairro</h3>
                    <p className="text-base">{healthPlan.address.neighborhood}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Cidade</h3>
                    <p className="text-base">{healthPlan.address.city}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Estado</h3>
                    <p className="text-base">{healthPlan.address.state}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">CEP</h3>
                    <p className="text-base">{healthPlan.address.zip_code}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Documentos</CardTitle>
              <CardDescription>Documentos do plano de saúde</CardDescription>
            </CardHeader>
            <CardContent>
              {healthPlan.documents && healthPlan.documents.length > 0 ? (
                <div className="space-y-4">
                  {healthPlan.documents.map((document: any) => (
                    <div key={document.id} className="flex items-center justify-between rounded-lg border p-4">
                      <div className="flex items-center space-x-4">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{document.name}</p>
                          <p className="text-sm text-muted-foreground">{formatDate(document.created_at)}</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <a href={document.path} target="_blank" rel="noopener noreferrer">
                          Visualizar
                        </a>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <FileText className="mb-2 h-12 w-12 text-muted-foreground" />
                  <h3 className="text-lg font-medium">Nenhum documento encontrado</h3>
                  <p className="text-sm text-muted-foreground">
                    Não há documentos cadastrados para este plano de saúde.
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button>
                <Upload className="mr-2 h-4 w-4" />
                Enviar Documento
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="tuss" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Negociação TUSS</CardTitle>
              <CardDescription>Tabela de procedimentos e valores negociados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <h3 className="text-lg font-medium">Negociação TUSS</h3>
                <p className="text-sm text-muted-foreground">
                  Aqui seriam exibidos os procedimentos TUSS e valores negociados com este plano de saúde.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contracts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contratos</CardTitle>
              <CardDescription>Contratos associados ao plano de saúde</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <h3 className="text-lg font-medium">Contratos</h3>
                <p className="text-sm text-muted-foreground">
                  Aqui seriam exibidos os contratos associados a este plano de saúde.
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button>
                <FileText className="mr-2 h-4 w-4" />
                Gerar Contrato
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

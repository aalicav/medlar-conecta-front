"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Loader2, Save, TestTube, RefreshCw, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import {api} from "@/lib/api"

interface NFeConfig {
  environment: string
  company_name: string
  cnpj: string
  state: string
  schemes: string
  version: string
  ibpt_token: string
  csc: string
  csc_id: string
  certificate_path: string
  certificate_password: string
  address: {
    street: string
    number: string
    district: string
    city: string
    zipcode: string
  }
  ie: string
  crt: string
  city_code: string
}

interface TestResult {
  success: boolean
  message: string
  environment?: string
  company?: string
  cnpj?: string
  certificate_path?: string
}

export default function NFeConfigPage() {
  const [config, setConfig] = useState<NFeConfig>({
    environment: "2",
    company_name: "",
    cnpj: "",
    state: "SP",
    schemes: "PL_009_V4",
    version: "4.00",
    ibpt_token: "",
    csc: "",
    csc_id: "",
    certificate_path: "certificates/certificate.pfx",
    certificate_password: "",
    address: {
      street: "",
      number: "",
      district: "",
      city: "",
      zipcode: "",
    },
    ie: "",
    crt: "1",
    city_code: "3550308",
  })

  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [states, setStates] = useState<Record<string, string>>({})
  const [crtOptions, setCrtOptions] = useState<Record<string, string>>({})
  const [environmentOptions, setEnvironmentOptions] = useState<Record<string, string>>({})

  useEffect(() => {
    loadConfig()
    loadOptions()
  }, [])

  const loadConfig = async () => {
    try {
      setLoading(true)
      const response = await api.get("/billing/nfe-config")

      if (response.data) {
        const data = response.data
        if (data.current_config) {
          setConfig({
            environment: data.current_config.tpAmb?.toString() || "2",
            company_name: data.current_config.razaosocial || "",
            cnpj: data.current_config.cnpj || "",
            state: data.current_config.siglaUF || "SP",
            schemes: data.current_config.schemes || "PL_009_V4",
            version: data.current_config.versao || "4.00",
            ibpt_token: data.current_config.tokenIBPT || "",
            csc: data.current_config.CSC || "",
            csc_id: data.current_config.CSCid || "",
            certificate_path: data.current_config.certificate_path || "certificates/certificate.pfx",
            certificate_password: data.current_config.certificate_password || "",
            address: {
              street: data.current_config.address?.street || "",
              number: data.current_config.address?.number || "",
              district: data.current_config.address?.district || "",
              city: data.current_config.address?.city || "",
              zipcode: data.current_config.address?.zipcode || "",
            },
            ie: data.current_config.ie || "",
            crt: data.current_config.crt || "1",
            city_code: data.current_config.city_code || "3550308",
          })
        }
      }
    } catch (error) {
      toast.error("Erro ao carregar configurações")
    } finally {
      setLoading(false)
    }
  }

  const loadOptions = async () => {
    try {
      const [statesRes, crtRes, envRes] = await Promise.all([
        api.get("/billing/nfe-config/states"),
        api.get("/billing/nfe-config/crt-options"),
        api.get("/billing/nfe-config/environment-options"),
      ])

      if (statesRes.data) setStates(statesRes.data)
      if (crtRes.data) setCrtOptions(crtRes.data)
      if (envRes.data) setEnvironmentOptions(envRes.data)
    } catch (error) {
      console.error("Erro ao carregar opções:", error)
    }
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      
      const dataToSend = {
        "nfe.environment": config.environment,
        "nfe.company_name": config.company_name,
        "nfe.cnpj": config.cnpj,
        "nfe.state": config.state,
        "nfe.schemes": config.schemes,
        "nfe.version": config.version,
        "nfe.ibpt_token": config.ibpt_token,
        "nfe.csc": config.csc,
        "nfe.csc_id": config.csc_id,
        "nfe.certificate_path": config.certificate_path,
        "nfe.certificate_password": config.certificate_password,
        "nfe.address.street": config.address.street,
        "nfe.address.number": config.address.number,
        "nfe.address.district": config.address.district,
        "nfe.address.city": config.address.city,
        "nfe.address.zipcode": config.address.zipcode,
        "nfe.ie": config.ie,
        "nfe.crt": config.crt,
        "nfe.city_code": config.city_code,
      }
      
      console.log("Dados sendo enviados:", dataToSend)
      
      const response = await api.put("/billing/nfe-config", dataToSend)

      if (response.data) {
        toast.success("Configurações salvas com sucesso!")
      }
    } catch (error: any) {
      console.error("Erro ao salvar configurações:", error)
      
      if (error.response?.data?.errors) {
        // Validation errors
        const errors = error.response.data.errors
        const errorMessages = Object.values(errors).flat()
        toast.error(`Erro de validação: ${errorMessages.join(', ')}`)
      } else if (error.response?.data?.message) {
        // Server error message
        toast.error(error.response.data.message)
      } else {
        // Generic error
        toast.error("Erro ao salvar configurações")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleTest = async () => {
    try {
      setTesting(true)
      setTestResult(null)
      const response = await api.post("/billing/nfe-config/test", {
      })

      const result = response.data
      setTestResult(result)

      if (result.success) {
        toast.success("Configuração válida!")
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error("Erro ao testar configuração")
    } finally {
      setTesting(false)
    }
  }

  const handleInitializeDefaults = async () => {
    try {
      setLoading(true)
      const response = await api.post("/billing/nfe-config/initialize-defaults", {
      })

      if (response.data) {
        toast.success("Configurações padrão inicializadas!")
        await loadConfig()
      } else {
        toast.error("Erro ao inicializar configurações padrão")
      }
    } catch (error) {
      toast.error("Erro ao inicializar configurações padrão")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Configurações da NFe</h1>
          <p className="text-muted-foreground">
            Gerencie as configurações para emissão de Notas Fiscais Eletrônicas
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadConfig} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Recarregar
          </Button>
          <Button variant="outline" onClick={handleInitializeDefaults} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Padrões
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="certificate">Certificado</TabsTrigger>
          <TabsTrigger value="address">Endereço</TabsTrigger>
          <TabsTrigger value="test">Teste</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações Gerais</CardTitle>
              <CardDescription>
                Informações básicas da empresa e ambiente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="environment">Ambiente</Label>
                  <Select value={config.environment} onValueChange={(value) => setConfig({ ...config, environment: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(environmentOptions).map(([key, value]) => (
                        <SelectItem key={key} value={key}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company_name">Razão Social</Label>
                  <Input
                    id="company_name"
                    value={config.company_name}
                    onChange={(e) => setConfig({ ...config, company_name: e.target.value })}
                    placeholder="Nome da empresa"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    value={config.cnpj}
                    onChange={(e) => setConfig({ ...config, cnpj: e.target.value })}
                    placeholder="00.000.000/0000-00"
                    maxLength={14}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">Estado (UF)</Label>
                  <Select value={config.state} onValueChange={(value) => setConfig({ ...config, state: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(states).map(([key, value]) => (
                        <SelectItem key={key} value={key}>
                          {key} - {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ie">Inscrição Estadual</Label>
                  <Input
                    id="ie"
                    value={config.ie}
                    onChange={(e) => setConfig({ ...config, ie: e.target.value })}
                    placeholder="123456789"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="crt">Regime Tributário</Label>
                  <Select value={config.crt} onValueChange={(value) => setConfig({ ...config, crt: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(crtOptions).map(([key, value]) => (
                        <SelectItem key={key} value={key}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="schemes">Schemas</Label>
                  <Input
                    id="schemes"
                    value={config.schemes}
                    onChange={(e) => setConfig({ ...config, schemes: e.target.value })}
                    placeholder="PL_009_V4"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="version">Versão</Label>
                  <Input
                    id="version"
                    value={config.version}
                    onChange={(e) => setConfig({ ...config, version: e.target.value })}
                    placeholder="4.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city_code">Código da Cidade</Label>
                  <Input
                    id="city_code"
                    value={config.city_code}
                    onChange={(e) => setConfig({ ...config, city_code: e.target.value })}
                    placeholder="3550308"
                    maxLength={7}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="certificate" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Certificado Digital</CardTitle>
              <CardDescription>
                Configurações do certificado digital para assinatura das NFes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="certificate_path">Caminho do Certificado</Label>
                  <Input
                    id="certificate_path"
                    value={config.certificate_path}
                    onChange={(e) => setConfig({ ...config, certificate_path: e.target.value })}
                    placeholder="certificates/certificate.pfx"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="certificate_password">Senha do Certificado</Label>
                  <Input
                    id="certificate_password"
                    type="password"
                    value={config.certificate_password}
                    onChange={(e) => setConfig({ ...config, certificate_password: e.target.value })}
                    placeholder="Senha do certificado"
                  />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ibpt_token">Token IBPT</Label>
                  <Input
                    id="ibpt_token"
                    value={config.ibpt_token}
                    onChange={(e) => setConfig({ ...config, ibpt_token: e.target.value })}
                    placeholder="Token do IBPT"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="csc">CSC</Label>
                  <Input
                    id="csc"
                    value={config.csc}
                    onChange={(e) => setConfig({ ...config, csc: e.target.value })}
                    placeholder="Código de Segurança"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="csc_id">ID do CSC</Label>
                  <Input
                    id="csc_id"
                    value={config.csc_id}
                    onChange={(e) => setConfig({ ...config, csc_id: e.target.value })}
                    placeholder="ID do CSC"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="address" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Endereço da Empresa</CardTitle>
              <CardDescription>
                Endereço fiscal da empresa emissora da NFe
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="street">Logradouro</Label>
                  <Input
                    id="street"
                    value={config.address.street}
                    onChange={(e) => setConfig({ ...config, address: { ...config.address, street: e.target.value } })}
                    placeholder="Rua das Flores"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="number">Número</Label>
                  <Input
                    id="number"
                    value={config.address.number}
                    onChange={(e) => setConfig({ ...config, address: { ...config.address, number: e.target.value } })}
                    placeholder="123"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="district">Bairro</Label>
                  <Input
                    id="district"
                    value={config.address.district}
                    onChange={(e) => setConfig({ ...config, address: { ...config.address, district: e.target.value } })}
                    placeholder="Centro"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    value={config.address.city}
                    onChange={(e) => setConfig({ ...config, address: { ...config.address, city: e.target.value } })}
                    placeholder="São Paulo"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zipcode">CEP</Label>
                  <Input
                    id="zipcode"
                    value={config.address.zipcode}
                    onChange={(e) => setConfig({ ...config, address: { ...config.address, zipcode: e.target.value } })}
                    placeholder="01234-567"
                    maxLength={9}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Teste de Configuração</CardTitle>
              <CardDescription>
                Teste se as configurações estão válidas para emissão de NFes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={handleTest} disabled={testing} className="w-full">
                {testing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Testando...
                  </>
                ) : (
                  <>
                    <TestTube className="h-4 w-4 mr-2" />
                    Testar Configuração
                  </>
                )}
              </Button>

              {testResult && (
                <Alert className={testResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                  {testResult.success ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <AlertDescription className={testResult.success ? "text-green-800" : "text-red-800"}>
                    {testResult.message}
                  </AlertDescription>
                  {testResult.success && (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Ambiente</Badge>
                        <span className="text-sm">{testResult.environment}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Empresa</Badge>
                        <span className="text-sm">{testResult.company}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">CNPJ</Badge>
                        <span className="text-sm">{testResult.cnpj}</span>
                      </div>
                    </div>
                  )}
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={loadConfig} disabled={loading}>
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Salvar Configurações
            </>
          )}
        </Button>
      </div>
    </div>
  )
} 
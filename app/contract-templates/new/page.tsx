"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save } from "lucide-react"
import { 
  createContractTemplate, 
  getPlaceholders 
} from "@/services/contract-templates"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/use-toast"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ContractEditor } from "@/components/ContractEditor"
import { useEffect } from "react"

export default function CreateTemplateFormPage() {
  const router = useRouter()
  
  const [isSaving, setIsSaving] = useState(false)
  const [form, setForm] = useState({
    name: "",
    entity_type: "health_plan" as "health_plan" | "clinic" | "professional",
    content: "<h2>Novo Template de Contrato</h2><p>Edite este conteúdo para criar seu template...</p>",
    is_active: true
  })
  const [placeholders, setPlaceholders] = useState<{
    common: Record<string, string>;
    entity: Record<string, string>;
  }>({
    common: {},
    entity: {}
  })

  // Templates pré-definidos
  const TEMPLATE_MODELS = {
    health_plan: `<h2 style="text-align: center;">CONTRATO DE PRESTAÇÃO DE SERVIÇOS - PLANO DE SAÚDE</h2>

<p>
    <strong>CONTRATO Nº:</strong> {{contract_number}}<br>
    <strong>DATA:</strong> {{date}}
</p>

<p>Por este instrumento particular, de um lado <strong>{{health_plan.name}}</strong>, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº {{health_plan.registration_number}}, com sede no endereço {{health_plan.address}}, doravante denominada CONTRATANTE, e de outro lado a INVICTA MEDICAL SERVICES, pessoa jurídica de direito privado, doravante denominada CONTRATADA, têm entre si justo e contratado o seguinte:</p>

<h3>CLÁUSULA PRIMEIRA - DO OBJETO</h3>

<p>O presente contrato tem por objeto a prestação de serviços médicos pela CONTRATADA aos beneficiários da CONTRATANTE, conforme especificações contidas no Anexo I deste instrumento.</p>

<h3>CLÁUSULA SEGUNDA - DO PRAZO</h3>

<p>O presente contrato terá vigência de 12 (doze) meses, com início em {{start_date}} e término em {{end_date}}, podendo ser renovado mediante termo aditivo.</p>

<h3>CLÁUSULA TERCEIRA - DOS SERVIÇOS</h3>

<p>A CONTRATADA disponibilizará aos beneficiários da CONTRATANTE os seguintes serviços:</p>
<ul>
    <li>Atendimento médico eletivo em consultório;</li>
    <li>Atendimento médico de urgência e emergência;</li>
    <li>Realização de exames e procedimentos conforme tabela negociada.</li>
</ul>

<h3>CLÁUSULA QUARTA - DOS PREÇOS E CONDIÇÕES DE PAGAMENTO</h3>

<p>Os serviços prestados serão remunerados conforme tabela de procedimentos negociada entre as partes, que integra o presente contrato como Anexo II.</p>

<p>Os pagamentos serão efetuados mensalmente, mediante apresentação de fatura detalhada dos atendimentos realizados no período.</p>

<h3>CLÁUSULA QUINTA - TABELA DE PROCEDIMENTOS</h3>

<p>Os procedimentos e valores acordados nesta negociação ({{negotiation.title}}) têm validade de {{negotiation.start_date}} até {{negotiation.end_date}}.</p>

<table border="1" cellpadding="5" cellspacing="0" width="100%">
    <tr>
        <th>Código</th>
        <th>Procedimento</th>
        <th>Valor</th>
    </tr>
    <!-- Tabela de procedimentos será preenchida dinamicamente -->
</table>

<h3>CLÁUSULA SEXTA - DAS DISPOSIÇÕES GERAIS</h3>

<p>E, por estarem justas e contratadas, as partes assinam o presente contrato em duas vias de igual teor e forma.</p>

<div style="display: flex; justify-content: space-between; margin-top: 50px; text-align: center;">
    <div style="width: 45%;">
        <p>_______________________________<br>
        <strong>{{health_plan.name}}</strong><br>
        CONTRATANTE</p>
    </div>
    <div style="width: 45%;">
        <p>_______________________________<br>
        <strong>INVICTA MEDICAL SERVICES</strong><br>
        CONTRATADA</p>
    </div>
</div>`,
    professional: `<h2 style="text-align: center;">CONTRATO DE CREDENCIAMENTO - PROFISSIONAL</h2>

<p>
    <strong>CONTRATO Nº:</strong> {{contract_number}}<br>
    <strong>DATA:</strong> {{date}}
</p>

<p>Por este instrumento particular, de um lado <strong>INVICTA MEDICAL SERVICES</strong>, pessoa jurídica de direito privado, doravante denominada CONTRATANTE, e de outro lado <strong>Dr(a). {{professional.name}}</strong>, profissional da área de saúde, inscrito(a) no Conselho Profissional sob o nº {{professional.license_number}}, doravante denominado(a) CONTRATADO(A), têm entre si justo e contratado o seguinte:</p>

<h3>CLÁUSULA PRIMEIRA - DO OBJETO</h3>

<p>O presente contrato tem por objeto o credenciamento do(a) CONTRATADO(A) para prestação de serviços de saúde na especialidade de {{professional.specialization}} aos beneficiários encaminhados pela CONTRATANTE.</p>

<h3>CLÁUSULA SEGUNDA - DO PRAZO</h3>

<p>O presente contrato terá vigência de 12 (doze) meses, com início em {{start_date}} e término em {{end_date}}, podendo ser renovado mediante termo aditivo.</p>

<h3>CLÁUSULA TERCEIRA - DAS OBRIGAÇÕES</h3>

<p>O(A) CONTRATADO(A) se compromete a:</p>
<ul>
    <li>Atender os beneficiários encaminhados pela CONTRATANTE;</li>
    <li>Cumprir os protocolos e diretrizes estabelecidos;</li>
    <li>Manter atualizados seus dados cadastrais e documentação profissional.</li>
</ul>

<h3>CLÁUSULA QUARTA - DOS HONORÁRIOS</h3>

<p>Os serviços prestados pelo(a) CONTRATADO(A) serão remunerados conforme tabela de procedimentos negociada, que integra o presente contrato como Anexo I.</p>

<h3>CLÁUSULA QUINTA - TABELA DE PROCEDIMENTOS</h3>

<p>Os procedimentos e valores acordados nesta negociação ({{negotiation.title}}) têm validade de {{negotiation.start_date}} até {{negotiation.end_date}}.</p>

<table border="1" cellpadding="5" cellspacing="0" width="100%">
    <tr>
        <th>Código</th>
        <th>Procedimento</th>
        <th>Valor</th>
    </tr>
    <!-- Tabela de procedimentos será preenchida dinamicamente -->
</table>

<h3>CLÁUSULA SEXTA - DAS DISPOSIÇÕES GERAIS</h3>

<p>E, por estarem justas e contratadas, as partes assinam o presente contrato em duas vias de igual teor e forma.</p>

<div style="display: flex; justify-content: space-between; margin-top: 50px; text-align: center;">
    <div style="width: 45%;">
        <p>_______________________________<br>
        <strong>INVICTA MEDICAL SERVICES</strong><br>
        CONTRATANTE</p>
    </div>
    <div style="width: 45%;">
        <p>_______________________________<br>
        <strong>Dr(a). {{professional.name}}</strong><br>
        CONTRATADO(A)</p>
    </div>
</div>`,
    clinic: `<h2 style="text-align: center;">CONTRATO DE CREDENCIAMENTO - CLÍNICA</h2>

<p>
    <strong>CONTRATO Nº:</strong> {{contract_number}}<br>
    <strong>DATA:</strong> {{date}}
</p>

<p>Por este instrumento particular, de um lado <strong>INVICTA MEDICAL SERVICES</strong>, pessoa jurídica de direito privado, doravante denominada CONTRATANTE, e de outro lado <strong>{{clinic.name}}</strong>, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº {{clinic.registration_number}}, com sede no endereço {{clinic.address}}, doravante denominada CONTRATADA, neste ato representada por seu responsável técnico, Dr(a). {{clinic.director}}, têm entre si justo e contratado o seguinte:</p>

<h3>CLÁUSULA PRIMEIRA - DO OBJETO</h3>

<p>O presente contrato tem por objeto o credenciamento da CONTRATADA para prestação de serviços de saúde aos beneficiários encaminhados pela CONTRATANTE.</p>

<h3>CLÁUSULA SEGUNDA - DO PRAZO</h3>

<p>O presente contrato terá vigência de 12 (doze) meses, com início em {{start_date}} e término em {{end_date}}, podendo ser renovado mediante termo aditivo.</p>

<h3>CLÁUSULA TERCEIRA - DAS OBRIGAÇÕES</h3>

<p>A CONTRATADA se compromete a:</p>
<ul>
    <li>Atender os beneficiários encaminhados pela CONTRATANTE;</li>
    <li>Manter as instalações em perfeitas condições de higiene e segurança;</li>
    <li>Cumprir os protocolos e diretrizes estabelecidos.</li>
</ul>

<h3>CLÁUSULA QUARTA - DOS VALORES E PAGAMENTOS</h3>

<p>Os serviços prestados pela CONTRATADA serão remunerados conforme tabela de procedimentos negociada, que integra o presente contrato como Anexo I.</p>

<h3>CLÁUSULA QUINTA - TABELA DE PROCEDIMENTOS</h3>

<p>Os procedimentos e valores acordados nesta negociação ({{negotiation.title}}) têm validade de {{negotiation.start_date}} até {{negotiation.end_date}}.</p>

<table border="1" cellpadding="5" cellspacing="0" width="100%">
    <tr>
        <th>Código</th>
        <th>Procedimento</th>
        <th>Valor</th>
    </tr>
    <!-- Tabela de procedimentos será preenchida dinamicamente -->
</table>

<h3>CLÁUSULA SEXTA - DAS DISPOSIÇÕES GERAIS</h3>

<p>E, por estarem justas e contratadas, as partes assinam o presente contrato em duas vias de igual teor e forma.</p>

<div style="display: flex; justify-content: space-between; margin-top: 50px; text-align: center;">
    <div style="width: 45%;">
        <p>_______________________________<br>
        <strong>INVICTA MEDICAL SERVICES</strong><br>
        CONTRATANTE</p>
    </div>
    <div style="width: 45%;">
        <p>_______________________________<br>
        <strong>{{clinic.name}}</strong><br>
        CONTRATADA</p>
    </div>
</div>`
  }

  useEffect(() => {
    const fetchPlaceholders = async () => {
      try {
        const response = await getPlaceholders(form.entity_type)
        if (response.status === 'success') {
          setPlaceholders(response.data)
        }
      } catch (error) {
        console.error("Failed to fetch placeholders:", error)
      }
    }

    fetchPlaceholders()

    // Sugerir um nome para o template com base no tipo selecionado
    if (form.name === "") {
      const nameMap = {
        health_plan: "Contrato - Plano de Saúde",
        clinic: "Contrato - Estabelecimento",
        professional: "Contrato - Profissional"
      };
      setForm(prev => ({
        ...prev,
        name: nameMap[form.entity_type]
      }));
    }
  }, [form.entity_type])

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSwitchChange = (checked: boolean) => {
    setForm((prev) => ({ ...prev, is_active: checked }))
  }

  const handleEntityTypeChange = async (value: string) => {
    const entityType = value as "health_plan" | "clinic" | "professional"
    setForm((prev) => ({ ...prev, entity_type: entityType }))
    
    try {
      const response = await getPlaceholders(entityType)
      if (response.status === 'success') {
        setPlaceholders(response.data)
      }
    } catch (error) {
      console.error("Failed to fetch placeholders:", error)
    }
  }

  const loadTemplateModel = () => {
    if (TEMPLATE_MODELS[form.entity_type]) {
      setForm(prev => ({
        ...prev,
        content: TEMPLATE_MODELS[form.entity_type]
      }))
      
      toast({
        title: "Modelo carregado",
        description: `Um modelo de template para ${form.entity_type === 'health_plan' ? 'Plano de Saúde' : form.entity_type === 'clinic' ? 'Estabelecimento' : 'Profissional'} foi carregado.`,
      })
    }
  }

  const insertPlaceholder = (key: string) => {
    // Idealmente, deveríamos inserir diretamente no editor
    // Como alternativa simples, adicionamos ao final do conteúdo
    setForm((prev) => ({
      ...prev,
      content: prev.content + `{{${key}}}`
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    
    try {
      const formData = {
        name: form.name,
        entity_type: form.entity_type,
        content: form.content,
        is_active: form.is_active
      }
      
      const response = await createContractTemplate(formData)
      
      if (response.status === 'success') {
        toast({
          title: "Template criado",
          description: "O template de contrato foi criado com sucesso.",
        })
        router.push(`/contract-templates/${response.data.id}`)
      } else {
        toast({
          title: "Erro ao criar",
          description: response.message || "Não foi possível criar o template.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to create template:", error)
      toast({
        title: "Erro ao criar",
        description: "Ocorreu um erro ao tentar criar o template.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/contract-templates')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Novo Template de Contrato
            </h1>
            <p className="text-muted-foreground">
              Criar um novo template de contrato
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="submit" form="template-form" disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>

      <form id="template-form" onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Template</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Nome descritivo do template"
                  value={form.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="entity_type">Tipo de Entidade</Label>
                <Select
                  value={form.entity_type}
                  onValueChange={handleEntityTypeChange}
                >
                  <SelectTrigger id="entity_type" name="entity_type">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="health_plan">Plano de Saúde</SelectItem>
                    <SelectItem value="clinic">Estabelecimento</SelectItem>
                    <SelectItem value="professional">Profissional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={form.is_active}
                onCheckedChange={handleSwitchChange}
              />
              <Label htmlFor="is_active">Template Ativo</Label>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-6">
          <Card className="lg:col-span-4">
            <CardHeader>
              <CardTitle>Conteúdo do Template</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center mb-2">
                  <Label htmlFor="content">Conteúdo HTML</Label>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={loadTemplateModel}
                    type="button"
                  >
                    Carregar Modelo Padrão
                  </Button>
                </div>
                <ContractEditor
                  initialContent={form.content}
                  onChange={(html) => setForm(prev => ({ ...prev, content: html }))}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Placeholders Disponíveis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Placeholders Comuns</h3>
                  <div className="space-y-2">
                    {Object.entries(placeholders.common).map(([key, description]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between p-2 text-sm border rounded-md cursor-pointer hover:bg-gray-50"
                        onClick={() => insertPlaceholder(key)}
                      >
                        <code>{key}</code>
                        <span className="text-xs text-muted-foreground">{description}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Placeholders de {form.entity_type === 'health_plan' ? 'Plano de Saúde' : form.entity_type === 'clinic' ? 'Estabelecimento' : 'Profissional'}</h3>
                  <div className="space-y-2">
                    {Object.entries(placeholders.entity).map(([key, description]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between p-2 text-sm border rounded-md cursor-pointer hover:bg-gray-50"
                        onClick={() => insertPlaceholder(key)}
                      >
                        <code>{key}</code>
                        <span className="text-xs text-muted-foreground">{description}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <p className="text-xs text-muted-foreground">
                  Clique em um placeholder para inseri-lo no template
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  )
} 
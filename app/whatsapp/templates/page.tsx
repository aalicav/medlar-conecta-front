'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Check, Info, Send, X, Filter } from 'lucide-react';
import WhatsappService, { TemplateOption, TemplateTestResponse } from '@/app/services/whatsappService';

export default function TestTemplatesPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>('simple');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<TemplateTestResponse | null>(null);
  
  // Campos comuns
  const [recipient, setRecipient] = useState<string>('');
  
  // Campos para template simples
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [templateValues, setTemplateValues] = useState<string[]>([]);
  
  // Campos para template avançado
  const [advancedTemplate, setAdvancedTemplate] = useState<string>('');
  const [customData, setCustomData] = useState<Record<string, string>>({});
  
  const availableTemplates = WhatsappService.getAvailableTemplates();
  
  const handleSendSimpleTemplate = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const formattedRecipient = formatPhoneNumber(recipient);
      // Filtrar apenas valores não vazios
      const filteredValues = templateValues.filter(value => value.trim() !== '');
      
      const response = await WhatsappService.sendSimpleTest(
        formattedRecipient,
        selectedTemplate,
        filteredValues.length > 0 ? filteredValues : undefined
      );
      
      setSuccess('Template enviado com sucesso!');
      setLastResponse(response);
    } catch (err) {
      console.error('Erro ao enviar template:', err);
      setError('Erro ao enviar template. Verifique os dados e tente novamente.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSendAdvancedTemplate = async () => {
    if (!validateForm('advanced')) return;
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const formattedRecipient = formatPhoneNumber(recipient);
      
      const response = await WhatsappService.sendTemplateTest(
        formattedRecipient,
        advancedTemplate,
        Object.keys(customData).length > 0 ? customData : undefined
      );
      
      setSuccess('Template enviado com sucesso!');
      setLastResponse(response);
    } catch (err) {
      console.error('Erro ao enviar template avançado:', err);
      setError('Erro ao enviar template. Verifique os dados e tente novamente.');
    } finally {
      setLoading(false);
    }
  };
  
  const validateForm = (mode: 'simple' | 'advanced' = 'simple') => {
    if (!recipient) {
      setError('O número do destinatário é obrigatório');
      return false;
    }
    
    if (mode === 'simple' && !selectedTemplate) {
      setError('Selecione um template');
      return false;
    }
    
    if (mode === 'advanced' && !advancedTemplate) {
      setError('Selecione um template');
      return false;
    }
    
    return true;
  };
  
  // Formatar número de telefone para o formato esperado pela API
  const formatPhoneNumber = (phone: string): string => {
    // Remove caracteres não numéricos
    return phone.replace(/\D/g, '');
  };
  
  // Handle template selection for simple mode
  const handleTemplateChange = (templateKey: string) => {
    setSelectedTemplate(templateKey);
    
    // Reset template values
    const template = WhatsappService.getTemplateByKey(templateKey);
    if (template) {
      // Initialize array with empty strings based on the number of params
      setTemplateValues(Array(template.paramCount).fill(''));
    } else {
      setTemplateValues([]);
    }
  };
  
  // Handle template selection for advanced mode
  const handleAdvancedTemplateChange = (templateKey: string) => {
    setAdvancedTemplate(templateKey);
    
    // Reset custom data
    setCustomData({});
  };
  
  // Update a specific template value
  const updateTemplateValue = (index: number, value: string) => {
    const newValues = [...templateValues];
    newValues[index] = value;
    setTemplateValues(newValues);
  };
  
  // Update custom data
  const updateCustomData = (key: string, value: string) => {
    setCustomData({
      ...customData,
      [key]: value
    });
  };
  
  const getSelectedTemplate = (): TemplateOption | undefined => {
    return WhatsappService.getTemplateByKey(selectedTemplate);
  };
  
  const getAdvancedTemplate = (): TemplateOption | undefined => {
    return WhatsappService.getTemplateByKey(advancedTemplate);
  };
  
  const addCustomField = () => {
    // Find the next available index
    const keys = Object.keys(customData).map(k => parseInt(k)).sort((a, b) => a - b);
    let nextIndex = 1;
    
    if (keys.length > 0) {
      nextIndex = keys[keys.length - 1] + 1;
    }
    
    updateCustomData(nextIndex.toString(), '');
  };
  
  const removeCustomField = (key: string) => {
    const newData = { ...customData };
    delete newData[key];
    setCustomData(newData);
  };
  
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Testar Templates WhatsApp</h1>
          <p className="text-gray-500">Testar e verificar templates de WhatsApp</p>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="outline">
            <Link href="/dashboard/whatsapp">Voltar ao Dashboard</Link>
          </Button>
        </div>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <X className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="mb-6 bg-green-50 border-green-200 text-green-800">
          <Check className="h-4 w-4" />
          <AlertTitle>Sucesso</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Section */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Testar Templates</CardTitle>
              <CardDescription>
                Teste templates WhatsApp com dados personalizados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid gap-2">
                  <Label>Número do Destinatário</Label>
                  <Input 
                    placeholder="Ex: 5511999999999" 
                    value={recipient} 
                    onChange={(e) => setRecipient(e.target.value)}
                  />
                  <p className="text-sm text-gray-500">
                    Formato: código do país + DDD + número (sem espaços ou símbolos)
                  </p>
                </div>
                
                <Tabs 
                  defaultValue="simple" 
                  value={activeTab} 
                  onValueChange={setActiveTab}
                  className="w-full"
                >
                  <TabsList className="grid grid-cols-2 w-full">
                    <TabsTrigger value="simple">Simples</TabsTrigger>
                    <TabsTrigger value="advanced">Avançado</TabsTrigger>
                  </TabsList>
                  
                  {/* Simple Template Tab */}
                  <TabsContent value="simple" className="pt-4">
                    <div className="space-y-4">
                      <div className="grid gap-2">
                        <Label>Selecione um Template</Label>
                        <Select 
                          value={selectedTemplate}
                          onValueChange={(value) => handleTemplateChange(value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um template" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableTemplates.map((template) => (
                              <SelectItem key={template.key} value={template.key}>
                                {template.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-sm text-gray-500 flex items-center mt-1">
                          <Info className="h-4 w-4 mr-1" />
                          Modo Simples: Preencha valores na ordem correta
                        </p>
                      </div>
                      
                      {selectedTemplate && getSelectedTemplate() && (
                        <>
                          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                            <h3 className="font-medium text-blue-800">{getSelectedTemplate()?.name}</h3>
                            <p className="text-sm text-blue-600">{getSelectedTemplate()?.description}</p>
                          </div>
                          
                          <div className="grid gap-3">
                            {getSelectedTemplate()?.placeholders?.map((placeholder, index) => (
                              <div key={index}>
                                <Label>{placeholder}</Label>
                                <Input 
                                  value={templateValues[index] || ''}
                                  onChange={(e) => updateTemplateValue(index, e.target.value)}
                                  placeholder={`Insira ${placeholder.toLowerCase()}`}
                                />
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </TabsContent>
                  
                  {/* Advanced Template Tab */}
                  <TabsContent value="advanced" className="pt-4">
                    <div className="space-y-4">
                      <div className="grid gap-2">
                        <Label>Selecione um Template</Label>
                        <Select 
                          value={advancedTemplate}
                          onValueChange={(value) => handleAdvancedTemplateChange(value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um template" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableTemplates.map((template) => (
                              <SelectItem key={template.key} value={template.key}>
                                {template.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-sm text-gray-500 flex items-center mt-1">
                          <Info className="h-4 w-4 mr-1" />
                          Modo Avançado: Especifique parâmetros de template exatos por índice
                        </p>
                      </div>
                      
                      {advancedTemplate && getAdvancedTemplate() && (
                        <>
                          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                            <h3 className="font-medium text-blue-800">{getAdvancedTemplate()?.name}</h3>
                            <p className="text-sm text-blue-600">{getAdvancedTemplate()?.description}</p>
                            <p className="text-xs text-blue-400 mt-2">Parâmetros: {getAdvancedTemplate()?.paramCount}</p>
                            <div className="mt-2 space-y-1">
                              {getAdvancedTemplate()?.placeholders?.map((placeholder, index) => (
                                <div key={index} className="text-xs">
                                  <strong>{index + 1}:</strong> {placeholder}
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <Label>Valores Personalizados</Label>
                              <Button variant="outline" size="sm" onClick={addCustomField}>
                                Adicionar Valor
                              </Button>
                            </div>
                            
                            {Object.keys(customData).length === 0 && (
                              <div className="text-sm text-gray-500 py-2">
                                Clique em "Adicionar Valor" para especificar valores para o template
                              </div>
                            )}
                            
                            {Object.entries(customData).map(([key, value]) => (
                              <div key={key} className="flex items-center gap-2">
                                <div className="w-16">
                                  <Label>Índice</Label>
                                  <Input 
                                    value={key}
                                    disabled
                                    className="text-center"
                                  />
                                </div>
                                <div className="flex-1">
                                  <Label>Valor</Label>
                                  <Input 
                                    value={value}
                                    onChange={(e) => updateCustomData(key, e.target.value)}
                                    placeholder="Valor do parâmetro"
                                  />
                                </div>
                                <div className="mt-6">
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => removeCustomField(key)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => router.push('/dashboard/whatsapp')}>
                Cancelar
              </Button>
              <Button 
                onClick={activeTab === 'simple' ? handleSendSimpleTemplate : handleSendAdvancedTemplate}
                disabled={loading}
                className="flex items-center"
              >
                <Send className="mr-2 h-4 w-4" />
                Testar Template
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        {/* Preview Section */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Prévia</CardTitle>
              <CardDescription>
                Como seu template vai aparecer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-100 rounded-md p-3 h-full min-h-[250px]">
                {activeTab === 'simple' ? (
                  selectedTemplate ? (
                    <div className="space-y-3">
                      <h3 className="font-medium">{getSelectedTemplate()?.name}</h3>
                      <div className="border-t pt-2 space-y-2">
                        {templateValues.map((value, index) => (
                          <div key={index} className="flex justify-between items-start text-sm">
                            <div className="text-gray-500">{getSelectedTemplate()?.placeholders?.[index]}:</div>
                            <div className="font-medium">{value || 'Não preenchido'}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-400 flex items-center justify-center h-full">
                      Selecione um template para ver a prévia
                    </div>
                  )
                ) : (
                  advancedTemplate ? (
                    <div className="space-y-3">
                      <h3 className="font-medium">{getAdvancedTemplate()?.name}</h3>
                      <div className="border-t pt-2 space-y-2">
                        {Object.entries(customData).map(([key, value]) => (
                          <div key={key} className="flex justify-between items-start text-sm">
                            <div className="text-gray-500">
                              Parâmetro {key}: 
                              {getAdvancedTemplate()?.placeholders && parseInt(key) <= getAdvancedTemplate()!.placeholders.length 
                                ? ` (${getAdvancedTemplate()!.placeholders[parseInt(key) - 1]})` 
                                : ''}
                            </div>
                            <div className="font-medium">{value || 'Não preenchido'}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-400 flex items-center justify-center h-full">
                      Selecione um template para ver a prévia
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>
          
          {lastResponse && (
            <Card className="mt-4">
              <CardHeader className="pb-2">
                <CardTitle>Último Teste</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-3 rounded-md space-y-2 text-sm">
                  <div>
                    <span className="font-semibold">Status:</span>{' '}
                    {lastResponse.success ? (
                      <span className="text-green-600">Sucesso</span>
                    ) : (
                      <span className="text-red-600">Falha</span>
                    )}
                  </div>
                  {lastResponse.template_key && (
                    <div>
                      <span className="font-semibold">Template:</span>{' '}
                      {lastResponse.template_key}
                    </div>
                  )}
                  {lastResponse.values_used && (
                    <div>
                      <span className="font-semibold">Valores:</span>
                      <div className="pl-2 mt-1 space-y-1">
                        {Object.entries(lastResponse.values_used).map(([key, value]) => (
                          <div key={key} className="flex items-start">
                            <span className="font-medium mr-1">{key}:</span> {value}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {lastResponse.message && (
                    <div>
                      <span className="font-semibold">Mensagem:</span>{' '}
                      {lastResponse.message}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
} 
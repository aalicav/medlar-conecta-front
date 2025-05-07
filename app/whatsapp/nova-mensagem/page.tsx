'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Check, FileText, Image, Info, Send, Video, Volume2, X } from 'lucide-react';
import WhatsappService, { TemplateOption } from '@/app/services/whatsappService';

export default function NovaMensagemWhatsApp() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>('texto');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Campos comuns
  const [recipient, setRecipient] = useState<string>('');
  
  // Campos de mensagem de texto
  const [textMessage, setTextMessage] = useState<string>('');
  
  // Campos de mensagem de mídia
  const [mediaType, setMediaType] = useState<'image' | 'document' | 'video' | 'audio'>('image');
  const [mediaUrl, setMediaUrl] = useState<string>('');
  const [caption, setCaption] = useState<string>('');
  
  // Campos para template
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [templateValues, setTemplateValues] = useState<string[]>([]);
  const availableTemplates = WhatsappService.getAvailableTemplates();
  
  const handleSendTextMessage = async () => {
    if (!recipient) {
      setError('O número do destinatário é obrigatório');
      return;
    }
    
    if (!textMessage) {
      setError('A mensagem é obrigatória');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const formattedRecipient = formatPhoneNumber(recipient);
      await WhatsappService.sendTextMessage(formattedRecipient, textMessage);
      setSuccess('Mensagem enviada com sucesso!');
      
      // Limpar o formulário
      setTextMessage('');
      
      // Redirecionar após 2 segundos
      setTimeout(() => {
        router.push('/dashboard/whatsapp/mensagens');
      }, 2000);
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
      setError('Erro ao enviar mensagem. Verifique os dados e tente novamente.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSendMediaMessage = async () => {
    if (!recipient) {
      setError('O número do destinatário é obrigatório');
      return;
    }
    
    if (!mediaUrl) {
      setError('A URL da mídia é obrigatória');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const formattedRecipient = formatPhoneNumber(recipient);
      await WhatsappService.sendMediaMessage(
        formattedRecipient,
        mediaUrl,
        mediaType,
        caption,
      );
      setSuccess('Mensagem com mídia enviada com sucesso!');
      
      // Limpar o formulário
      setMediaUrl('');
      setCaption('');
      
      // Redirecionar após 2 segundos
      setTimeout(() => {
        router.push('/dashboard/whatsapp/mensagens');
      }, 2000);
    } catch (err) {
      console.error('Erro ao enviar mensagem com mídia:', err);
      setError('Erro ao enviar mensagem com mídia. Verifique os dados e tente novamente.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSendTemplateMessage = async () => {
    if (!recipient) {
      setError('O número do destinatário é obrigatório');
      return;
    }
    
    if (!selectedTemplate) {
      setError('Selecione um template');
      return;
    }
    
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
      
      // Limpar o formulário de template
      setTemplateValues([]);
      
      // Redirecionar após 2 segundos
      setTimeout(() => {
        router.push('/dashboard/whatsapp/mensagens');
      }, 2000);
    } catch (err) {
      console.error('Erro ao enviar template:', err);
      setError('Erro ao enviar template. Verifique os dados e tente novamente.');
    } finally {
      setLoading(false);
    }
  };
  
  // Formatar número de telefone para o formato esperado pela API
  const formatPhoneNumber = (phone: string): string => {
    // Remove caracteres não numéricos
    return phone.replace(/\D/g, '');
  };
  
  const getMediaTypeIcon = () => {
    switch (mediaType) {
      case 'image':
        return <Image className="h-4 w-4" />;
      case 'document':
        return <FileText className="h-4 w-4" />;
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'audio':
        return <Volume2 className="h-4 w-4" />;
      default:
        return <Image className="h-4 w-4" />;
    }
  };
  
  // Handle template selection
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
  
  // Update a specific template value
  const updateTemplateValue = (index: number, value: string) => {
    const newValues = [...templateValues];
    newValues[index] = value;
    setTemplateValues(newValues);
  };
  
  const getSelectedTemplate = (): TemplateOption | undefined => {
    return WhatsappService.getTemplateByKey(selectedTemplate);
  };
  
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Nova Mensagem de WhatsApp</h1>
          <p className="text-gray-500">Envie mensagens de texto ou mídia</p>
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
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Enviar Mensagem</CardTitle>
              <CardDescription>
                Escolha entre enviar uma mensagem de texto, mídia ou template para o destinatário
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid gap-2">
                  <Label htmlFor="recipient">Número do Destinatário</Label>
                  <Input 
                    id="recipient" 
                    placeholder="Ex: 5511999999999" 
                    value={recipient} 
                    onChange={(e) => setRecipient(e.target.value)}
                  />
                  <p className="text-sm text-gray-500">
                    Formato: código do país + DDD + número (sem espaços ou símbolos)
                  </p>
                </div>
                
                <Tabs 
                  defaultValue="texto" 
                  value={activeTab} 
                  onValueChange={setActiveTab}
                  className="w-full"
                >
                  <TabsList className="grid grid-cols-3 w-full">
                    <TabsTrigger value="texto">Mensagem de Texto</TabsTrigger>
                    <TabsTrigger value="midia">Mensagem com Mídia</TabsTrigger>
                    <TabsTrigger value="templates">Templates</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="texto" className="pt-4">
                    <div className="grid gap-2">
                      <Label htmlFor="message">Mensagem</Label>
                      <Textarea 
                        id="message" 
                        placeholder="Digite sua mensagem aqui..."
                        value={textMessage}
                        onChange={(e) => setTextMessage(e.target.value)}
                        rows={6}
                      />
                      <p className="text-sm text-gray-500 flex items-center">
                        <Info className="h-4 w-4 mr-1" />
                        Use "[nome]" para personalizar com o nome do contato
                      </p>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="midia" className="pt-4">
                    <div className="space-y-4">
                      <div className="grid gap-2">
                        <Label>Tipo de Mídia</Label>
                        <RadioGroup 
                          defaultValue="image" 
                          value={mediaType}
                          onValueChange={(value) => setMediaType(value as any)}
                          className="grid grid-cols-2 sm:grid-cols-4 gap-2"
                        >
                          <div className="flex items-center space-x-2 border rounded-md p-2">
                            <RadioGroupItem value="image" id="image" />
                            <Label htmlFor="image" className="flex items-center cursor-pointer">
                              <Image className="h-4 w-4 mr-2" />
                              Imagem
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2 border rounded-md p-2">
                            <RadioGroupItem value="document" id="document" />
                            <Label htmlFor="document" className="flex items-center cursor-pointer">
                              <FileText className="h-4 w-4 mr-2" />
                              Documento
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2 border rounded-md p-2">
                            <RadioGroupItem value="video" id="video" />
                            <Label htmlFor="video" className="flex items-center cursor-pointer">
                              <Video className="h-4 w-4 mr-2" />
                              Vídeo
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2 border rounded-md p-2">
                            <RadioGroupItem value="audio" id="audio" />
                            <Label htmlFor="audio" className="flex items-center cursor-pointer">
                              <Volume2 className="h-4 w-4 mr-2" />
                              Áudio
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="mediaUrl">URL da Mídia</Label>
                        <Input 
                          id="mediaUrl" 
                          placeholder="https://exemplo.com/arquivo.jpg" 
                          value={mediaUrl}
                          onChange={(e) => setMediaUrl(e.target.value)}
                        />
                        <p className="text-sm text-gray-500">
                          URL pública da mídia que deseja enviar
                        </p>
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="caption">Legenda (opcional)</Label>
                        <Textarea 
                          id="caption" 
                          placeholder="Legenda para a mídia..."
                          value={caption}
                          onChange={(e) => setCaption(e.target.value)}
                          rows={4}
                        />
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="templates" className="pt-4">
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
                          Teste os templates do WhatsApp com dados personalizados
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
                </Tabs>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => router.push('/dashboard/whatsapp')}
              >
                Cancelar
              </Button>
              <Button 
                onClick={activeTab === 'texto' ? handleSendTextMessage : activeTab === 'midia' ? handleSendMediaMessage : handleSendTemplateMessage}
                disabled={loading}
                className="flex items-center"
              >
                {loading ? 'Enviando...' : 'Enviar Mensagem'}
                <Send className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Prévia</CardTitle>
              <CardDescription>
                Visualização da mensagem a ser enviada
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="text-sm font-medium mb-2">
                  Destinatário: {recipient || '(não informado)'}
                </div>
                
                {activeTab === 'texto' ? (
                  <div className="bg-green-500 text-white p-3 rounded-lg max-w-xs ml-auto">
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {textMessage || '(sem conteúdo)'}
                    </p>
                  </div>
                ) : activeTab === 'midia' ? (
                  <div className="space-y-2">
                    <div className="bg-white border rounded-lg p-2 flex items-center">
                      {getMediaTypeIcon()}
                      <span className="ml-2 text-sm font-medium">
                        {mediaType === 'image' && 'Imagem'}
                        {mediaType === 'document' && 'Documento'}
                        {mediaType === 'video' && 'Vídeo'}
                        {mediaType === 'audio' && 'Áudio'}
                      </span>
                    </div>
                    {mediaUrl ? (
                      <div className="text-xs truncate">
                        URL: {mediaUrl}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-500">
                        (URL não informada)
                      </div>
                    )}
                    {caption && (
                      <div className="bg-green-500 text-white p-3 rounded-lg max-w-xs ml-auto mt-2">
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {caption}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-green-500 text-white p-3 rounded-lg max-w-xs ml-auto">
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {selectedTemplate ? (
                        <>
                          <strong>{getSelectedTemplate()?.name}</strong>
                          <br />
                          {templateValues.filter(Boolean).length > 0 ? (
                            <>
                              {templateValues.map((value, index) => (
                                value && (
                                  <span key={index}>
                                    {getSelectedTemplate()?.placeholders?.[index]}: {value}<br />
                                  </span>
                                )
                              ))}
                            </>
                          ) : '(preencha os valores do template)'}
                        </>
                      ) : '(nenhum template selecionado)'}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Alert className="bg-blue-50 border-blue-200 text-blue-800">
                <Info className="h-4 w-4" />
                <AlertTitle>Dica</AlertTitle>
                <AlertDescription className="text-xs">
                  Certifique-se de que o número está no formato correto e a mensagem está adequada.
                </AlertDescription>
              </Alert>
            </CardFooter>
          </Card>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Formatos Aceitos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <span className="font-medium flex items-center">
                  <Image className="h-4 w-4 mr-2" />
                  Imagens:
                </span>
                <p className="text-gray-600">jpg, jpeg, png, webp</p>
              </div>
              <div>
                <span className="font-medium flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  Documentos:
                </span>
                <p className="text-gray-600">pdf, doc, docx, xls, xlsx, txt</p>
              </div>
              <div>
                <span className="font-medium flex items-center">
                  <Video className="h-4 w-4 mr-2" />
                  Vídeos:
                </span>
                <p className="text-gray-600">mp4, mov, avi (máx. 16MB)</p>
              </div>
              <div>
                <span className="font-medium flex items-center">
                  <Volume2 className="h-4 w-4 mr-2" />
                  Áudios:
                </span>
                <p className="text-gray-600">mp3, ogg, wav (máx. 16MB)</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 
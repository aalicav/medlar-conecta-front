# Integração Bidirecional de WhatsApp via Twilio

## Visão Geral

Esta implementação adiciona funcionalidade de comunicação bidirecional ao sistema de WhatsApp existente, permitindo:

- **Receber mensagens** de profissionais, clínicas ou pacientes
- **Exibir histórico** de conversas no frontend
- **Responder manualmente** às mensagens recebidas
- **Rastrear status** de todas as mensagens (enviadas e recebidas)

## Arquitetura Implementada

### Backend (Laravel)

#### 1. Modelo Message
- **Arquivo**: `conecta-backend/app/Models/Message.php`
- **Funcionalidades**:
  - Armazena mensagens bidirecionais (inbound/outbound)
  - Relacionamentos polimórficos com entidades
  - Identificação automática de remetentes
  - Status tracking completo

#### 2. Migration
- **Arquivo**: `conecta-backend/database/migrations/2024_12_01_000001_create_messages_table.php`
- **Campos principais**:
  - `sender_phone` / `recipient_phone`
  - `direction` (inbound/outbound)
  - `status` (pending/sent/delivered/read/failed)
  - `related_model_type` / `related_model_id`
  - `external_id` (Twilio SID)

#### 3. WhatsAppService Atualizado
- **Arquivo**: `conecta-backend/app/Services/WhatsAppService.php`
- **Novos métodos**:
  - `processIncomingMessage()` - Processa mensagens recebidas
  - `sendManualMessage()` - Envia mensagens manuais
  - `getConversationHistory()` - Histórico de conversas
  - `getConversations()` - Lista de conversas
  - `identifySenderEntity()` - Identifica entidade por telefone

#### 4. Controller Bidirecional
- **Arquivo**: `conecta-backend/app/Http/Controllers/Api/BidirectionalMessageController.php`
- **Endpoints**:
  - `GET /messages/conversations` - Lista conversas
  - `GET /messages/conversations/{phone}/history` - Histórico
  - `POST /messages/send` - Enviar mensagem
  - `GET /messages/entity/{type}/{id}` - Mensagens por entidade
  - `GET /messages/statistics` - Estatísticas

#### 5. Webhook Atualizado
- **Arquivo**: `conecta-backend/app/Http/Controllers/Api/WhatsappController.php`
- **Funcionalidade**: Processa mensagens recebidas e salva na tabela `messages`

### Frontend (React/Next.js)

#### 1. Serviço de Mensagens
- **Arquivo**: `app/services/bidirectionalMessageService.ts`
- **Funcionalidades**:
  - Interface com APIs bidirecionais
  - Tipagem TypeScript completa
  - Métodos para conversas e envio

#### 2. Página de Conversas
- **Arquivo**: `app/whatsapp/conversas/page.tsx`
- **Funcionalidades**:
  - Lista todas as conversas
  - Busca por telefone/conteúdo/nome
  - Identificação de entidades
  - Status visual das mensagens

#### 3. Página de Chat Individual
- **Arquivo**: `app/whatsapp/conversas/[phone]/page.tsx`
- **Funcionalidades**:
  - Interface de chat em tempo real
  - Envio de mensagens manuais
  - Histórico completo da conversa
  - Status de entrega

## Configuração

### 1. Executar Migration
```bash
php artisan migrate
```

### 2. Configurar Webhook no Twilio
- URL: `https://seu-dominio.com/api/whatsapp/webhook`
- Método: POST
- Configurar para receber mensagens de entrada

### 3. Variáveis de Ambiente
```env
# Twilio (já existentes)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_FROM=whatsapp:+1234567890
TWILIO_MESSAGING_SERVICE_SID=your_messaging_service_sid

# Webhook (adicionar se necessário)
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_webhook_verify_token
```

## Fluxo de Funcionamento

### 1. Recebimento de Mensagens
1. Usuário envia mensagem para o WhatsApp da empresa
2. Twilio envia webhook para `/api/whatsapp/webhook`
3. Sistema processa e salva na tabela `messages`
4. Identifica automaticamente a entidade (paciente/profissional/clínica)

### 2. Visualização de Conversas
1. Operador acessa `/whatsapp/conversas`
2. Vê lista de todas as conversas ativas
3. Clica em uma conversa para ver histórico
4. Pode responder diretamente na interface

### 3. Envio de Mensagens
1. Operador digita mensagem na interface
2. Sistema envia via Twilio API
3. Salva registro na tabela `messages`
4. Atualiza status conforme webhooks do Twilio

## APIs Disponíveis

### GET /messages/conversations
Lista todas as conversas
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "conversation_partner": "5511999999999",
      "content": "Última mensagem",
      "direction": "inbound",
      "status": "delivered",
      "created_at": "2024-12-01T10:00:00Z"
    }
  ]
}
```

### GET /messages/conversations/{phone}/history
Histórico de uma conversa específica
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "sender_phone": "5511999999999",
      "recipient_phone": "5511888888888",
      "content": "Olá, preciso de ajuda",
      "direction": "inbound",
      "status": "delivered",
      "created_at": "2024-12-01T10:00:00Z"
    }
  ]
}
```

### POST /messages/send
Enviar mensagem manual
```json
{
  "recipient_phone": "5511999999999",
  "content": "Olá! Como posso ajudar?",
  "related_model_type": "Patient",
  "related_model_id": 123
}
```

## Funcionalidades Implementadas

### ✅ Completas
- [x] Modelo Message com relacionamentos polimórficos
- [x] Migration para tabela messages
- [x] WhatsAppService com métodos bidirecionais
- [x] Controller para APIs bidirecionais
- [x] Webhook atualizado para processar mensagens recebidas
- [x] Serviço frontend para mensagens bidirecionais
- [x] Página de lista de conversas
- [x] Página de chat individual
- [x] Integração com sidebar
- [x] Links na página principal do WhatsApp

### 🔄 Próximos Passos (Opcionais)
- [ ] Notificações em tempo real (WebSocket)
- [ ] Upload de mídia nas conversas
- [ ] Templates de resposta rápida
- [ ] Relatórios de conversas
- [ ] Integração com chatbot SURI
- [ ] Filtros avançados de conversas

## Testes

### 1. Testar Webhook
```bash
# Simular mensagem recebida
curl -X POST https://seu-dominio.com/api/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "entry": [{
      "changes": [{
        "value": {
          "messages": [{
            "from": "5511999999999",
            "text": {"body": "Teste de mensagem"},
            "type": "text",
            "id": "test_message_id"
          }]
        }
      }]
    }]
  }'
```

### 2. Testar Envio Manual
```bash
curl -X POST https://seu-dominio.com/api/messages/send \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recipient_phone": "5511999999999",
    "content": "Teste de envio manual"
  }'
```

## Monitoramento

### Logs Importantes
- `Incoming WhatsApp message processed` - Mensagens recebidas
- `Manual WhatsApp message sent` - Mensagens enviadas manualmente
- `Updated bidirectional message status` - Atualizações de status

### Métricas Disponíveis
- Total de mensagens (inbound/outbound)
- Taxa de entrega
- Conversas ativas
- Tempo de resposta

## Segurança

### Implementado
- Autenticação via Sanctum para APIs
- Validação de entrada em todos os endpoints
- Sanitização de números de telefone
- Logs de auditoria para mensagens

### Recomendações
- Implementar rate limiting
- Adicionar validação de webhook signature
- Configurar CORS adequadamente
- Monitorar uso da API Twilio

## Suporte

Para dúvidas ou problemas:
1. Verificar logs do Laravel (`storage/logs/laravel.log`)
2. Verificar logs do Twilio (Console Twilio)
3. Testar webhook com ferramentas como ngrok
4. Verificar configurações de ambiente

---

**Status**: ✅ Implementação Completa
**Versão**: 1.0.0
**Data**: Dezembro 2024 
# CRUD de Especialidades Médicas

Este documento descreve as funcionalidades implementadas para o gerenciamento de especialidades médicas no sistema.

## Estrutura de Arquivos

```
app/admin/medical-specialties/
├── page.tsx                    # Listagem de especialidades
├── new/
│   └── page.tsx               # Criação de nova especialidade
└── [id]/
    ├── page.tsx               # Visualização detalhada
    └── edit/
        └── page.tsx           # Edição de especialidade

components/forms/
└── medical-specialty-form.tsx # Componente de formulário

services/
└── specialtyService.ts        # Serviço para operações CRUD

app/api/medical-specialties/
├── route.ts                   # API para listar e criar
└── [id]/
    └── route.ts              # API para obter, atualizar e excluir
```

## Funcionalidades Implementadas

### 1. Listagem de Especialidades (`/admin/medical-specialties`)

- **Tabela responsiva** com todas as especialidades
- **Busca em tempo real** por nome, código TUSS ou descrição
- **Filtros visuais** para status (Ativa/Inativa) e negociável (Sim/Não)
- **Ações por linha**: Visualizar, Editar, Excluir
- **Formatação de preços** em Real brasileiro
- **Loading states** e tratamento de erros

### 2. Criação de Especialidade (`/admin/medical-specialties/new`)

- **Formulário completo** com validação
- **Campos obrigatórios**:
  - Nome da especialidade
  - Código TUSS
  - Descrição TUSS
  - Preço padrão
- **Configurações opcionais**:
  - Especialidade ativa/inativa
  - Preço negociável
- **Validação em tempo real** com mensagens de erro
- **Botão de voltar** e navegação intuitiva

### 3. Edição de Especialidade (`/admin/medical-specialties/[id]/edit`)

- **Carregamento automático** dos dados existentes
- **Mesmo formulário** da criação, mas pré-preenchido
- **Validação de dados** antes da submissão
- **Tratamento de erros** e loading states
- **Redirecionamento** após sucesso

### 4. Visualização Detalhada (`/admin/medical-specialties/[id]`)

- **Layout em cards** organizados por seções
- **Informações básicas**: Nome, código TUSS, status
- **Informações financeiras**: Preço padrão formatado
- **Descrição TUSS** completa
- **Informações do sistema**: ID, datas de criação/atualização
- **Botão de edição** direto na página

### 5. Exclusão de Especialidade

- **Confirmação obrigatória** via modal
- **Mensagem de confirmação** com nome da especialidade
- **Exclusão segura** com tratamento de erros
- **Atualização automática** da lista após exclusão

## Componentes Utilizados

### UI Components (shadcn/ui)
- `Button` - Botões de ação
- `Input` - Campos de texto
- `Textarea` - Campo de descrição
- `Switch` - Toggles para configurações
- `Card` - Containers de conteúdo
- `Table` - Tabela de listagem
- `Badge` - Indicadores de status
- `AlertDialog` - Modal de confirmação
- `Form` - Formulários com validação

### Ícones (Lucide React)
- `Plus` - Adicionar novo
- `Edit` - Editar
- `Trash2` - Excluir
- `Eye` - Visualizar
- `Search` - Busca
- `ArrowLeft` - Voltar
- `Save` - Salvar

## Serviço de API

### Interface MedicalSpecialty
```typescript
interface MedicalSpecialty {
  id: number;
  name: string;
  description?: string;
  default_price: number;
  tuss_code: string;
  tuss_description: string;
  active: boolean;
  negotiable: boolean;
  created_at?: string;
  updated_at?: string;
}
```

### Métodos Disponíveis
- `list()` - Listar todas as especialidades
- `getById(id)` - Obter especialidade por ID
- `create(data)` - Criar nova especialidade
- `update(id, data)` - Atualizar especialidade
- `delete(id)` - Excluir especialidade

## Validação de Formulário

### Schema Zod
```typescript
const medicalSpecialtySchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(255, "Nome muito longo"),
  tuss_code: z.string().min(1, "Código TUSS é obrigatório").max(20, "Código TUSS muito longo"),
  tuss_description: z.string().min(1, "Descrição TUSS é obrigatória"),
  default_price: z.number().min(0, "Preço deve ser maior ou igual a zero"),
  negotiable: z.boolean().default(true),
  active: z.boolean().default(true),
});
```

## Rotas da API

### GET /api/medical-specialties
- Lista todas as especialidades
- Retorna array de objetos MedicalSpecialty

### POST /api/medical-specialties
- Cria nova especialidade
- Recebe dados no body da requisição
- Retorna especialidade criada

### GET /api/medical-specialties/[id]
- Obtém especialidade específica
- Retorna objeto MedicalSpecialty

### PUT /api/medical-specialties/[id]
- Atualiza especialidade existente
- Recebe dados parciais no body
- Retorna especialidade atualizada

### DELETE /api/medical-specialties/[id]
- Exclui especialidade
- Retorna mensagem de sucesso

## Como Usar

1. **Acesse** `/admin/medical-specialties` para ver a lista
2. **Clique em "Nova Especialidade"** para criar
3. **Use os botões de ação** na tabela para editar/excluir
4. **Clique no ícone de olho** para visualizar detalhes
5. **Use a busca** para filtrar especialidades

## Próximos Passos

- [ ] Integração com backend real (Laravel)
- [ ] Paginação na listagem
- [ ] Filtros avançados
- [ ] Exportação de dados
- [ ] Histórico de alterações
- [ ] Permissões de acesso
- [ ] Testes automatizados

## Notas Técnicas

- **Responsivo**: Funciona em desktop e mobile
- **Acessível**: Segue padrões de acessibilidade
- **Performance**: Lazy loading e otimizações
- **UX**: Feedback visual e estados de loading
- **Segurança**: Validação client e server-side 
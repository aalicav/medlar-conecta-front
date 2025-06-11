# Medical System - Frontend

Este é o frontend do sistema médico, desenvolvido com Next.js, TypeScript e Tailwind CSS.

## Requisitos

- Node.js 18.x ou superior
- npm 9.x ou superior

## Instalação

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/medical-system.git
cd medical-system
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env.local
```
Edite o arquivo `.env.local` com suas configurações.

## Desenvolvimento

Para iniciar o servidor de desenvolvimento:

```bash
npm run dev
```

O aplicativo estará disponível em `http://localhost:3000`.

## Build

Para criar uma build de produção:

```bash
npm run build
```

Para iniciar o servidor de produção:

```bash
npm start
```

## Estrutura do Projeto

```
medical-system/
├── src/
│   ├── app/              # Rotas e páginas
│   ├── components/       # Componentes React
│   │   ├── ui/          # Componentes de UI reutilizáveis
│   │   └── billing/     # Componentes específicos do faturamento
│   ├── lib/             # Utilitários e funções auxiliares
│   ├── services/        # Serviços e integrações
│   └── types/           # Definições de tipos TypeScript
├── public/              # Arquivos estáticos
└── ...
```

## Funcionalidades

### Módulo de Glosas

- Listagem de glosas
- Detalhes da glosa
- Registro de nova glosa
- Upload de documentos
- Gestão de recursos
- Respostas do operador
- Resolução de glosas
- Histórico de alterações

## Tecnologias

- [Next.js](https://nextjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [TanStack Table](https://tanstack.com/table/v8)
- [React Dropzone](https://react-dropzone.js.org/)
- [Axios](https://axios-http.com/)

## Contribuição

1. Faça o fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Faça commit das suas alterações (`git commit -m 'Adiciona nova feature'`)
4. Faça push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo [LICENSE](LICENSE) para mais detalhes. 
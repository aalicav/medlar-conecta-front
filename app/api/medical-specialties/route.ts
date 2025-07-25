import { NextRequest, NextResponse } from 'next/server';

// Simulação de dados para demonstração
// Em produção, isso seria uma chamada para o backend real
const mockSpecialties = [
  {
    id: 1,
    name: "Cardiologia",
    tuss_code: "2.01.01.07-0",
    tuss_description: "Consulta em consultório (no horário normal ou preestabelecido) - Cardiologia",
    default_price: 150.00,
    active: true,
    negotiable: true,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z"
  },
  {
    id: 2,
    name: "Dermatologia",
    tuss_code: "2.01.01.10-0",
    tuss_description: "Consulta em consultório (no horário normal ou preestabelecido) - Dermatologia",
    default_price: 120.00,
    active: true,
    negotiable: true,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z"
  }
];

export async function GET(request: NextRequest) {
  try {
    // Simular delay de rede
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return NextResponse.json({
      data: mockSpecialties,
      message: "Especialidades carregadas com sucesso"
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao carregar especialidades" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validação básica
    if (!body.name || !body.tuss_code || !body.tuss_description) {
      return NextResponse.json(
        { error: "Dados obrigatórios não fornecidos" },
        { status: 400 }
      );
    }

    // Simular criação
    const newSpecialty = {
      id: mockSpecialties.length + 1,
      ...body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    mockSpecialties.push(newSpecialty);

    return NextResponse.json(newSpecialty, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao criar especialidade" },
      { status: 500 }
    );
  }
} 
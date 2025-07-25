import { NextRequest, NextResponse } from 'next/server';

// Simulação de dados para demonstração
// Em produção, isso seria uma chamada para o backend real
let mockSpecialties = [
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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const specialty = mockSpecialties.find(s => s.id === id);

    if (!specialty) {
      return NextResponse.json(
        { error: "Especialidade não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(specialty);
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao carregar especialidade" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const body = await request.json();

    const specialtyIndex = mockSpecialties.findIndex(s => s.id === id);

    if (specialtyIndex === -1) {
      return NextResponse.json(
        { error: "Especialidade não encontrada" },
        { status: 404 }
      );
    }

    // Atualizar especialidade
    mockSpecialties[specialtyIndex] = {
      ...mockSpecialties[specialtyIndex],
      ...body,
      updated_at: new Date().toISOString()
    };

    return NextResponse.json(mockSpecialties[specialtyIndex]);
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao atualizar especialidade" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const specialtyIndex = mockSpecialties.findIndex(s => s.id === id);

    if (specialtyIndex === -1) {
      return NextResponse.json(
        { error: "Especialidade não encontrada" },
        { status: 404 }
      );
    }

    // Remover especialidade
    mockSpecialties = mockSpecialties.filter(s => s.id !== id);

    return NextResponse.json(
      { message: "Especialidade excluída com sucesso" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao excluir especialidade" },
      { status: 500 }
    );
  }
} 
import { useState } from 'react'

// Importar o arquivo JSON diretamente
const estadosCidadesData = require('./estados-cidades.json')

interface Estado {
  sigla: string
  nome: string
  cidades: string[]
}

interface EstadosCidadesData {
  estados: Estado[]
}

export const useEstadosCidades = () => {
  const [loading, setLoading] = useState(false) // Sempre false já que o arquivo é carregado diretamente

  const getEstados = () => {
    return estadosCidadesData?.estados || []
  }

  const getCidadesByEstado = (estadoSigla: string) => {
    const estado = estadosCidadesData?.estados.find((e: Estado) => e.sigla === estadoSigla)
    return estado?.cidades || []
  }

  const getEstadoBySigla = (sigla: string) => {
    return estadosCidadesData?.estados.find((e: Estado) => e.sigla === sigla)
  }

  return {
    estadosCidades: estadosCidadesData,
    loading,
    getEstados,
    getCidadesByEstado,
    getEstadoBySigla
  }
} 
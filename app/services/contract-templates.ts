import { ApiResponse, PaginatedResponse } from "@/types/api";
import { axiosInstance } from "./axios-instance";

export interface ContractTemplate {
  id: number;
  name: string;
  entity_type: 'health_plan' | 'clinic' | 'professional';
  content: string;
  placeholders?: string[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TemplatePreview {
  content: string;
}

interface ContractTemplateFormData {
  name: string;
  entity_type: 'health_plan' | 'clinic' | 'professional';
  content: string;
  placeholders?: string[];
  is_active?: boolean;
}

interface PlaceholdersData {
  common: Record<string, string>;
  entity: Record<string, string>;
}

// Get all templates with pagination and filtering
export const getContractTemplates = async (
  page = 1,
  entityType?: string,
  active?: boolean
): Promise<ApiResponse<PaginatedResponse<ContractTemplate>>> => {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  
  if (entityType) {
    params.append('entity_type', entityType);
  }
  
  if (active !== undefined) {
    params.append('active', active ? 'true' : 'false');
  }

  const response = await axiosInstance.get(`/api/contract-templates?${params.toString()}`);
  return response.data;
};

// Get a single template by ID
export const getContractTemplate = async (id: number): Promise<ApiResponse<ContractTemplate>> => {
  const response = await axiosInstance.get(`/api/contract-templates/${id}`);
  return response.data;
};

// Create a new template
export const createContractTemplate = async (
  templateData: ContractTemplateFormData
): Promise<ApiResponse<ContractTemplate>> => {
  try {
    const response = await axiosInstance.post('/api/contract-templates', templateData);
    return response.data;
  } catch (error) {
    console.error("Failed to create contract template:", error);
    return {
      status: 'error',
      message: 'Failed to create contract template',
      data: null as any
    };
  }
};

// Update an existing template
export const updateContractTemplate = async (
  id: number,
  templateData: Partial<ContractTemplateFormData>
): Promise<ApiResponse<ContractTemplate>> => {
  const response = await axiosInstance.put(`/api/contract-templates/${id}`, templateData);
  return response.data;
};

// Delete a template
export const deleteContractTemplate = async (id: number): Promise<ApiResponse<null>> => {
  const response = await axiosInstance.delete(`/api/contract-templates/${id}`);
  return response.data;
};

// Preview a template with data
export const previewContractTemplate = async (
  id: number,
  data: Record<string, string>
): Promise<ApiResponse<TemplatePreview>> => {
  const response = await axiosInstance.post(`/api/contract-templates/${id}/preview`, { data });
  return response.data;
};

// Get available placeholders by entity type
export const getPlaceholders = async (
  entityType: 'health_plan' | 'clinic' | 'professional'
): Promise<ApiResponse<PlaceholdersData>> => {
  const response = await axiosInstance.get(`/api/contract-templates/placeholders/${entityType}`);
  return response.data;
};

// Export template to DOCX
export const exportTemplateToDocx = async (
  id: number,
  data: Record<string, string>
): Promise<Blob> => {
  const response = await axiosInstance.post(
    `/api/contract-templates/${id}/export/docx`,
    { data },
    { responseType: 'blob' }
  );
  return response.data;
};

// Export template to PDF
export const exportTemplateToPdf = async (
  id: number,
  data: Record<string, string>
): Promise<Blob> => {
  const response = await axiosInstance.post(
    `/api/contract-templates/${id}/export/pdf`,
    { data },
    { responseType: 'blob' }
  );
  return response.data;
};

export const TEMPLATE_MODELS: Record<string, string> = {
  health_plan: `<h2 style="text-align: center">CONTRATO DE CREDENCIAMENTO - PLANO DE SAÚDE</h2>
<p>Este Contrato de Credenciamento ("Contrato") é celebrado entre:</p>
<p><strong>PLANO DE SAÚDE</strong>: [NOME_PLANO], inscrito no CNPJ sob o nº [CNPJ_PLANO], com sede em [ENDERECO_PLANO], neste ato representado por seu representante legal, doravante denominado simplesmente "PLANO"; e</p>
<p><strong>PROFISSIONAL DE SAÚDE</strong>: [NOME_PROFISSIONAL], [TITULAÇÃO], inscrito no [CONSELHO_PROFISSIONAL] sob o nº [NUMERO_REGISTRO], e no CPF sob o nº [CPF_PROFISSIONAL], residente e domiciliado em [ENDERECO_PROFISSIONAL], doravante denominado simplesmente "PROFISSIONAL".</p>
<p>As partes acima identificadas têm, entre si, justo e acertado o presente Contrato de Credenciamento para Prestação de Serviços Médicos, que se regerá pelas cláusulas seguintes e pelas condições descritas no presente.</p>
<h3>CLÁUSULA PRIMEIRA - DO OBJETO</h3>
<p>O presente contrato tem como objeto o credenciamento do PROFISSIONAL para prestar serviços médicos aos beneficiários do PLANO, de acordo com sua especialidade e qualificação profissional.</p>
<h3>CLÁUSULA SEGUNDA - DAS OBRIGAÇÕES DO PROFISSIONAL</h3>
<p>São obrigações do PROFISSIONAL:</p>
<ol>
  <li>Prestar atendimento médico aos beneficiários do PLANO, em sua área de especialidade;</li>
  <li>Manter atualizados seus dados cadastrais junto ao PLANO;</li>
  <li>Emitir documentação referente aos atendimentos realizados, conforme exigências do PLANO e da legislação;</li>
  <li>Atestar, sob as penas da lei, a veracidade e correção das informações constantes dos documentos emitidos.</li>
</ol>
<h3>CLÁUSULA TERCEIRA - DAS OBRIGAÇÕES DO PLANO</h3>
<p>São obrigações do PLANO:</p>
<ol>
  <li>Divulgar o nome do PROFISSIONAL como credenciado em sua rede;</li>
  <li>Efetuar os pagamentos devidos pelos serviços prestados pelo PROFISSIONAL, nos prazos e valores estabelecidos neste contrato;</li>
  <li>Fornecer ao PROFISSIONAL as informações necessárias para verificação dos direitos dos beneficiários.</li>
</ol>
<h3>CLÁUSULA QUARTA - DA REMUNERAÇÃO</h3>
<p>Pelos serviços prestados, o PROFISSIONAL será remunerado de acordo com a tabela de procedimentos do PLANO, vigente na data da prestação do serviço.</p>
<p>O pagamento será realizado até o [DIA_PAGAMENTO] dia útil do mês subsequente ao da prestação dos serviços, mediante apresentação da documentação exigida pelo PLANO.</p>
<h3>CLÁUSULA QUINTA - DO PRAZO</h3>
<p>O presente contrato vigorará por prazo indeterminado, podendo ser rescindido por qualquer das partes, mediante notificação prévia de 30 (trinta) dias.</p>
<h3>CLÁUSULA SEXTA - DO FORO</h3>
<p>As partes elegem o Foro da Comarca de [CIDADE], para dirimir quaisquer dúvidas ou litígios decorrentes deste contrato, com renúncia expressa a qualquer outro, por mais privilegiado que seja.</p>
<p>E, por estarem assim justas e contratadas, as partes assinam o presente instrumento em 2 (duas) vias de igual teor e forma, para um só efeito, na presença das testemunhas abaixo.</p>
<p style="text-align: right">[CIDADE], [DATA]</p>
<p style="text-align: center">___________________________________<br/>[NOME_PLANO]<br/>CNPJ: [CNPJ_PLANO]</p>
<p style="text-align: center">___________________________________<br/>[NOME_PROFISSIONAL]<br/>[CONSELHO_PROFISSIONAL]: [NUMERO_REGISTRO]</p>
<p>Testemunhas:</p>
<p>1. _________________________________ 2. _________________________________<br/>Nome:                                      Nome:<br/>CPF:                                        CPF:</p>`,

  clinic: `<h2 style="text-align: center">CONTRATO DE PRESTAÇÃO DE SERVIÇOS MÉDICOS - CLÍNICA</h2>
<p>Este Contrato de Prestação de Serviços Médicos ("Contrato") é celebrado entre:</p>
<p><strong>CLÍNICA</strong>: [NOME_CLINICA], pessoa jurídica de direito privado, inscrita no CNPJ sob o nº [CNPJ_CLINICA], com sede em [ENDERECO_CLINICA], neste ato representada por seu representante legal, doravante denominada simplesmente "CLÍNICA"; e</p>
<p><strong>PACIENTE</strong>: [NOME_PACIENTE], [NACIONALIDADE], [ESTADO_CIVIL], portador(a) da Cédula de Identidade RG nº [RG_PACIENTE], inscrito(a) no CPF sob o nº [CPF_PACIENTE], residente e domiciliado(a) em [ENDERECO_PACIENTE], doravante denominado(a) simplesmente "PACIENTE".</p>
<p>As partes acima identificadas têm, entre si, justo e acertado o presente Contrato de Prestação de Serviços Médicos, que se regerá pelas cláusulas seguintes e pelas condições descritas no presente.</p>
<h3>CLÁUSULA PRIMEIRA - DO OBJETO</h3>
<p>O presente contrato tem como objeto a prestação de serviços médicos pela CLÍNICA ao PACIENTE, nas dependências da CLÍNICA, compreendendo os seguintes serviços: [DESCRICAO_SERVICOS].</p>
<h3>CLÁUSULA SEGUNDA - DO ATENDIMENTO</h3>
<p>O atendimento será realizado nas dependências da CLÍNICA, por médicos e profissionais de saúde qualificados, em dias e horários previamente agendados.</p>
<p>O PACIENTE deverá seguir as recomendações dos profissionais da CLÍNICA, sendo responsável por informar corretamente seu histórico médico e demais informações solicitadas.</p>
<h3>CLÁUSULA TERCEIRA - DO VALOR E FORMA DE PAGAMENTO</h3>
<p>Pela prestação dos serviços médicos, o PACIENTE pagará à CLÍNICA o valor de R$ [VALOR_SERVICOS], a ser quitado da seguinte forma: [FORMA_PAGAMENTO].</p>
<p>Em caso de atraso no pagamento, incidirá multa de 2% (dois por cento) sobre o valor da parcela, juros de mora de 1% (um por cento) ao mês e correção monetária pelo índice [INDICE_CORRECAO].</p>
<h3>CLÁUSULA QUARTA - DAS OBRIGAÇÕES DA CLÍNICA</h3>
<p>São obrigações da CLÍNICA:</p>
<ol>
  <li>Prestar os serviços médicos com zelo, diligência e ética profissional;</li>
  <li>Manter o sigilo e a confidencialidade das informações do PACIENTE;</li>
  <li>Disponibilizar profissionais qualificados para o atendimento;</li>
  <li>Fornecer ao PACIENTE todos os esclarecimentos necessários.</li>
</ol>
<h3>CLÁUSULA QUINTA - DAS OBRIGAÇÕES DO PACIENTE</h3>
<p>São obrigações do PACIENTE:</p>
<ol>
  <li>Fornecer informações verídicas sobre seu estado de saúde;</li>
  <li>Comparecer às consultas e procedimentos agendados;</li>
  <li>Seguir as orientações e prescrições médicas;</li>
  <li>Efetuar o pagamento conforme o acordado.</li>
</ol>
<h3>CLÁUSULA SEXTA - DA VIGÊNCIA</h3>
<p>O presente contrato terá vigência de [PRAZO_CONTRATO], iniciando-se na data de sua assinatura.</p>
<h3>CLÁUSULA SÉTIMA - DA RESCISÃO</h3>
<p>O presente contrato poderá ser rescindido por qualquer das partes, mediante notificação prévia de 30 (trinta) dias, ou imediatamente, em caso de descumprimento de qualquer das cláusulas contratuais.</p>
<h3>CLÁUSULA OITAVA - DO FORO</h3>
<p>As partes elegem o Foro da Comarca de [CIDADE], para dirimir quaisquer dúvidas ou litígios decorrentes deste contrato, com renúncia expressa a qualquer outro, por mais privilegiado que seja.</p>
<p>E, por estarem assim justas e contratadas, as partes assinam o presente instrumento em 2 (duas) vias de igual teor e forma, para um só efeito, na presença das testemunhas abaixo.</p>
<p style="text-align: right">[CIDADE], [DATA]</p>
<p style="text-align: center">___________________________________<br/>[NOME_CLINICA]<br/>CNPJ: [CNPJ_CLINICA]</p>
<p style="text-align: center">___________________________________<br/>[NOME_PACIENTE]<br/>CPF: [CPF_PACIENTE]</p>
<p>Testemunhas:</p>
<p>1. _________________________________ 2. _________________________________<br/>Nome:                                      Nome:<br/>CPF:                                        CPF:</p>`,

  professional: `<h2 style="text-align: center">CONTRATO DE PRESTAÇÃO DE SERVIÇOS PROFISSIONAIS</h2>
<p>Este Contrato de Prestação de Serviços Profissionais ("Contrato") é celebrado entre:</p>
<p><strong>CONTRATANTE</strong>: [NOME_CONTRATANTE], [TIPO_PESSOA], inscrito(a) no [TIPO_DOCUMENTO] sob o nº [NUMERO_DOCUMENTO], com [sede/residência] em [ENDERECO_CONTRATANTE], neste ato representado(a) por seu representante legal, doravante denominado(a) simplesmente "CONTRATANTE"; e</p>
<p><strong>PROFISSIONAL</strong>: [NOME_PROFISSIONAL], [NACIONALIDADE], [ESTADO_CIVIL], [TITULAÇÃO], inscrito(a) no [CONSELHO_PROFISSIONAL] sob o nº [NUMERO_REGISTRO], e no CPF sob o nº [CPF_PROFISSIONAL], residente e domiciliado(a) em [ENDERECO_PROFISSIONAL], doravante denominado(a) simplesmente "PROFISSIONAL".</p>
<p>As partes acima identificadas têm, entre si, justo e acertado o presente Contrato de Prestação de Serviços Profissionais, que se regerá pelas cláusulas seguintes e pelas condições descritas no presente.</p>
<h3>CLÁUSULA PRIMEIRA - DO OBJETO</h3>
<p>O presente contrato tem como objeto a prestação de serviços profissionais pelo PROFISSIONAL ao CONTRATANTE, na área de [AREA_ATUACAO], que compreendem as seguintes atividades: [DESCRICAO_SERVICOS].</p>
<h3>CLÁUSULA SEGUNDA - DA EXECUÇÃO DOS SERVIÇOS</h3>
<p>Os serviços serão prestados pelo PROFISSIONAL de forma [FORMA_EXECUCAO], de acordo com sua qualificação profissional e conforme as necessidades do CONTRATANTE.</p>
<p>O PROFISSIONAL executará os serviços com autonomia técnica, observando as normas éticas e profissionais aplicáveis à sua área de atuação.</p>
<h3>CLÁUSULA TERCEIRA - DO VALOR E FORMA DE PAGAMENTO</h3>
<p>Pela prestação dos serviços contratados, o CONTRATANTE pagará ao PROFISSIONAL o valor de R$ [VALOR_SERVICOS], a ser quitado da seguinte forma: [FORMA_PAGAMENTO].</p>
<p>Em caso de atraso no pagamento, incidirá multa de 2% (dois por cento) sobre o valor da parcela, juros de mora de 1% (um por cento) ao mês e correção monetária pelo índice [INDICE_CORRECAO].</p>
<h3>CLÁUSULA QUARTA - DAS OBRIGAÇÕES DO PROFISSIONAL</h3>
<p>São obrigações do PROFISSIONAL:</p>
<ol>
  <li>Prestar os serviços contratados com zelo, diligência e ética profissional;</li>
  <li>Manter sigilo sobre as informações que tiver acesso em razão da prestação dos serviços;</li>
  <li>Cumprir os prazos estabelecidos para a execução dos serviços;</li>
  <li>Comunicar ao CONTRATANTE quaisquer impedimentos para a execução dos serviços.</li>
</ol>
<h3>CLÁUSULA QUINTA - DAS OBRIGAÇÕES DO CONTRATANTE</h3>
<p>São obrigações do CONTRATANTE:</p>
<ol>
  <li>Fornecer ao PROFISSIONAL as informações e condições necessárias para a execução dos serviços;</li>
  <li>Realizar os pagamentos conforme acordado;</li>
  <li>Comunicar ao PROFISSIONAL, com antecedência, qualquer alteração nas condições de execução dos serviços;</li>
  <li>Respeitar a autonomia técnica do PROFISSIONAL.</li>
</ol>
<h3>CLÁUSULA SEXTA - DA VIGÊNCIA</h3>
<p>O presente contrato terá vigência de [PRAZO_CONTRATO], iniciando-se na data de sua assinatura.</p>
<h3>CLÁUSULA SÉTIMA - DA RESCISÃO</h3>
<p>O presente contrato poderá ser rescindido por qualquer das partes, mediante notificação prévia de 30 (trinta) dias, ou imediatamente, em caso de descumprimento de qualquer das cláusulas contratuais.</p>
<h3>CLÁUSULA OITAVA - DO FORO</h3>
<p>As partes elegem o Foro da Comarca de [CIDADE], para dirimir quaisquer dúvidas ou litígios decorrentes deste contrato, com renúncia expressa a qualquer outro, por mais privilegiado que seja.</p>
<p>E, por estarem assim justas e contratadas, as partes assinam o presente instrumento em 2 (duas) vias de igual teor e forma, para um só efeito, na presença das testemunhas abaixo.</p>
<p style="text-align: right">[CIDADE], [DATA]</p>
<p style="text-align: center">___________________________________<br/>[NOME_CONTRATANTE]<br/>[TIPO_DOCUMENTO]: [NUMERO_DOCUMENTO]</p>
<p style="text-align: center">___________________________________<br/>[NOME_PROFISSIONAL]<br/>[CONSELHO_PROFISSIONAL]: [NUMERO_REGISTRO]</p>
<p>Testemunhas:</p>
<p>1. _________________________________ 2. _________________________________<br/>Nome:                                      Nome:<br/>CPF:                                        CPF:</p>`
}; 
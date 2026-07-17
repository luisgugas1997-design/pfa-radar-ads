window.mockLeads = [
  {
    id: 1,
    name: "João da Silva",
    phone: "(11) 98942-8923",
    email: "joaodasilva@email.com",
    location: "São Paulo - SP",
    cpf: "382.901.884-21",
    endereco: "Rua Augusta, 1200 - Consolação",
    etapa: "Em Triagem",
    tipoCaso: "Lei Seca",
    processo: "2024/0458",
    dataInfra: "02/04/2024",
    autuador: "Detran/SP",
    valorCausa: 5869.40,
    valoresPagos: 1500.00,
    prioridade: "media",
    temperatura: "quente",
    roboAtivo: true,
    responsavelId: 1,
    proximaAcao: "Conferir documentos e protocolar recurso",
    prazoAcao: "20/05/2024 17:00",
    promptCustom: "João está muito preocupado com a suspensão da CNH dele. Dê ênfase na Metodologia PFA (Proteção, Fundamentação e Atuação Estratégica) para tranquilizá-lo.",
    messages: [
      { sender: "client", text: "Olá, preciso de ajuda com minha CNH suspensa por bafômetro.", time: "10:15", read: true },
      { sender: "bot", text: "Olá! Sou o assistente jurídico da PFA Advogados. Entendo a preocupação. Você fez o teste do bafômetro ou recusou?", time: "10:16", read: true },
      { sender: "client", text: "Eu recusei. Falaram que a multa é a mesma coisa.", time: "10:17", read: true },
      { sender: "bot", text: "Exato, a penalidade administrativa de suspensão por 12 meses é a mesma. Mas existem excelentes chances de defesa com base em falhas de fiscalização. Você tem a cópia do Auto de Infração?", time: "10:18", read: true },
      { sender: "client", text: "Tenho sim, o policial me deu um papel azul.", time: "10:20", read: true },
      { sender: "client", text: "Vou mandar a foto aqui.", time: "10:20", read: true, attachment: { name: "Auto_de_Infracao_Digitalized.pdf", type: "document", size: "1.8 MB" } },
      { sender: "bot", text: "Auto de Infração recebido e salvo na sua pasta! Vou encaminhar para a triagem técnica de nossos advogados. Enquanto isso, envie também sua CNH para agilizarmos.", time: "10:22", read: true },
      { sender: "client", text: "Segue a minha CNH.", time: "10:25", read: true, attachment: { name: "CNH_Digital_Frente.pdf", type: "document", size: "1.2 MB" } },
      { sender: "bot", text: "CNH recebida! O Dr. Luis Gustavo já foi associado ao seu caso.", time: "10:27", read: true },
      { sender: "client", text: "Vocês acham que eu consigo continuar dirigindo enquanto recorremos?", time: "10:30", read: true },
      { sender: "bot", text: "Com certeza! Enquanto o processo de recurso estiver em andamento, você mantém o direito de dirigir normalmente, pois a penalidade fica suspensa (efeito suspensivo).", time: "10:32", read: true },
      { sender: "client", text: "Graças a Deus! Trabalho como motorista e não posso parar de forma alguma.", time: "10:35", read: true },
      { sender: "bot", text: "Excelente. Vamos elaborar uma defesa focando na nulidade da abordagem e na falta de calibração do etilômetro oficial.", time: "10:38", read: true },
      { sender: "client", text: "Show! Quanto fica o serviço de vocês?", time: "10:40", read: true },
      { sender: "bot", text: "O valor total para a defesa completa em todas as instâncias administrativas é de R$ 5.869,40. Podemos parcelar.", time: "10:42", read: true },
      { sender: "client", text: "Fechado. Consegue gerar o contrato?", time: "10:45", read: true },
      { sender: "bot", text: "Contrato gerado e enviado na sua pasta de documentos. Segue também uma prévia assinada.", time: "10:48", read: true, attachment: { name: "Contrato_Prestacao_Servicos.pdf", type: "document", size: "850 KB" } },
      { sender: "client", text: "Já fiz o primeiro pagamento de R$ 1.500,00 no PIX.", time: "11:00", read: true },
      { sender: "bot", text: "Confirmado! Seu pagamento inicial foi computado no sistema. Começaremos a redação da defesa imediatamente.", time: "11:05", read: true },
      { sender: "client", text: "Quero saber sobre o andamento do meu processo de Lei Seca.", time: "11:41", read: true },
      { sender: "bot", text: "Claro! Seu processo (2024/0458) está em análise de documentação. Precisamos de alguns documentos adicionais.", time: "11:41", read: true },
      { sender: "bot", text: "Por favor, envie o comprovante de residência atualizado.", time: "11:41", read: true },
      { sender: "client", text: "Perfeito, envio agora os documentos.", time: "11:42", read: true, attachment: { name: "Comprovante_Residencia.pdf", type: "document", size: "2.1 MB" } }
    ],
    documentos: [
      { name: "CNH.pdf", folder: "pessoais", status: "Recebido", size: "1.2 MB", date: "11/05/2024 11:20", author: "João da Silva" },
      { name: "Auto de Infração.pdf", folder: "pessoais", status: "Pendente", size: "1.8 MB", date: "11/05/2024 11:21", author: "João da Silva" },
      { name: "Procuração.docx", folder: "pessoais", status: "Validado", size: "634 KB", date: "10/05/2024 16:45", author: "PFA" },
      { name: "Comprovante.pdf", folder: "pessoais", status: "Pendente", size: "2.1 MB", date: "Aguardando envio", author: "" },
      { name: "Recurso Administrativo.docx", folder: "processo", status: "Pendente", size: "2.7 MB", date: "Aguardando assinatura", author: "" },
      { name: "Contrato Assinado.pdf", folder: "pessoais", status: "Validado", size: "850 KB", date: "11/05/2024 10:50", author: "João da Silva" },
      { name: "Historico_CNH.pdf", folder: "pessoais", status: "Recebido", size: "4.1 MB", date: "14/05/2024 09:30", author: "Sistema" },
      { name: "Notificacao_Autuacao.pdf", folder: "processo", status: "Validado", size: "1.1 MB", date: "12/05/2024 14:20", author: "Detran/SP" },
      { name: "Defesa_Previa_Lei_Seca.pdf", folder: "processo", status: "Recebido", size: "1.9 MB", date: "13/05/2024 15:40", author: "Dr. Luis Gustavo" },
      { name: "Provas_Abordagem_Testemunhas.pdf", folder: "processo", status: "Recebido", size: "3.5 MB", date: "14/05/2024 10:00", author: "João da Silva" },
      { name: "Recibo_Entrada_PIX.pdf", folder: "financeiro", status: "Validado", size: "250 KB", date: "11/05/2024 11:00", author: "Financeiro PFA" },
      { name: "Planilha_Calculos_Reembolso.xlsx", folder: "financeiro", status: "Pendente", size: "1.4 MB", date: "Aguardando envio", author: "" }
    ],
    timeline: [
      { time: "14/05 10:00", type: "Advogado", title: "Documento", desc: "Provas_Abordagem_Testemunhas.pdf anexado pelo cliente" },
      { time: "11/05 11:21", type: "Sistema", title: "Documento", desc: "Auto de Infração.pdf recebido" },
      { time: "11/05 11:20", type: "Sistema", title: "Documento", desc: "CNH.pdf recebido" },
      { time: "10/05 16:45", type: "Advogado", title: "Validação", desc: "Procuração.docx assinada e validada" }
    ]
  },
  {
    id: 2,
    name: "Maria Oliveira",
    phone: "(19) 98765-4321",
    email: "maria.oliveira@gmail.com",
    location: "Campinas - SP",
    cpf: "456.789.012-34",
    endereco: "Av. Brasil, 450 - Centro",
    etapa: "Documentos Pendentes",
    tipoCaso: "CNH Suspensa",
    processo: "2024/0912",
    dataInfra: "15/03/2024",
    autuador: "PRF",
    valorCausa: 2200.00,
    valoresPagos: 800.00,
    prioridade: "alta",
    temperatura: "morno",
    roboAtivo: true,
    responsavelId: 2,
    proximaAcao: "Solicitar comprovante de residência atualizado",
    prazoAcao: "21/05/2024 12:00",
    promptCustom: "",
    messages: [
      { sender: "client", text: "Vocês receberam a cópia da minha certidão?", time: "10:35", read: true },
      { sender: "bot", text: "Ainda não localizei na pasta. Poderia reenviar por aqui?", time: "10:36", read: true },
      { sender: "client", text: "Enviei pelo email, mas vou anexar aqui também.", time: "10:38", read: true },
      { sender: "client", text: "Aqui está.", time: "10:39", read: true, attachment: { name: "Certidao_Prontuario_CNH.pdf", type: "document", size: "640 KB" } },
      { sender: "bot", text: "Excelente, documento recebido com sucesso!", time: "10:40", read: true }
    ],
    documentos: [
      { name: "Prontuario_CNH.pdf", folder: "pessoais", status: "Recebido", size: "840 KB", date: "10/05/2024 10:30", author: "Maria Oliveira" },
      { name: "Certidao_Prontuario_CNH.pdf", folder: "pessoais", status: "Validado", size: "640 KB", date: "10/05/2024 10:39", author: "Maria Oliveira" },
      { name: "Comprovante_Residencia.pdf", folder: "pessoais", status: "Pendente", size: "1.9 MB", date: "Aguardando envio", author: "" },
      { name: "Contrato_Assinado_Maria.pdf", folder: "pessoais", status: "Validado", size: "900 KB", date: "09/05/2024 14:00", author: "Maria Oliveira" },
      { name: "Notificacao_Penalidade_Susp.pdf", folder: "processo", status: "Validado", size: "1.3 MB", date: "10/05/2024 11:00", author: "Detran/SP" },
      { name: "Recibo_Sinal_R800.pdf", folder: "financeiro", status: "Validado", size: "180 KB", date: "09/05/2024 14:30", author: "Financeiro PFA" }
    ],
    timeline: [
      { time: "10/05 10:39", type: "Sistema", title: "Documento", desc: "Certidao_Prontuario_CNH.pdf recebido" },
      { time: "09/05 14:00", type: "Advogado", title: "Contrato", desc: "Contrato fechado e assinado" }
    ]
  },
  {
    id: 3,
    name: "Carlos Mendes",
    phone: "(13) 99122-3344",
    email: "carlos.mendes@hotmail.com",
    location: "Santos - SP",
    cpf: "789.012.345-67",
    endereco: "Rua do Comércio, 88 - Gonzaga",
    etapa: "Novo Lead",
    tipoCaso: "CNH Cassada",
    processo: "Pendente",
    dataInfra: "18/04/2024",
    autuador: "Polícia Rodoviária",
    valorCausa: 2200.00,
    valoresPagos: 0.00,
    prioridade: "alta",
    temperatura: "quente",
    roboAtivo: false,
    responsavelId: 1,
    proximaAcao: "Realizar ligação de fechamento de contrato",
    prazoAcao: "19/05/2024 15:30",
    promptCustom: "",
    messages: [
      { sender: "client", text: "Entendi. Qual o próximo passo?", time: "09:15", read: true },
      { sender: "bot", text: "O próximo passo é assinar digitalmente a procuração para iniciarmos a defesa técnica judicial.", time: "09:16", read: true }
    ],
    documentos: [
      { name: "CNH_Carlos.pdf", folder: "pessoais", status: "Recebido", size: "1.4 MB", date: "15/05/2024 09:00", author: "Carlos Mendes" },
      { name: "Notificacao_Cassacao_CNH.pdf", folder: "processo", status: "Recebido", size: "2.1 MB", date: "15/05/2024 09:05", author: "Carlos Mendes" },
      { name: "Procuracao_Minuta.pdf", folder: "processo", status: "Pendente", size: "520 KB", date: "Aguardando assinatura", author: "" }
    ],
    timeline: [
      { time: "15/05 09:00", type: "Sistema", title: "Criação", desc: "Lead importado via formulário do site" }
    ]
  },
  {
    id: 4,
    name: "Cliente Lei Seca Teste",
    phone: "(11) 99999-8888",
    email: "leisecateste@email.com",
    location: "São Paulo - SP",
    cpf: "123.456.789-00",
    endereco: "Al. Santos, 900 - Jardins",
    etapa: "Fechado",
    tipoCaso: "Recurso de Multa",
    processo: "2024/0912",
    dataInfra: "12/05/2024",
    autuador: "Detran/SP",
    valorCausa: 1500.00,
    valoresPagos: 1500.00,
    prioridade: "baixa",
    temperatura: "frio",
    roboAtivo: false,
    responsavelId: 3,
    proximaAcao: "Falar com Dr. Luis Gustavo urgentemente",
    prazoAcao: "Imediato",
    promptCustom: "",
    messages: [
      { sender: "client", text: "Fui preso em flagrante por bafômetro amanhã tem audiência.", time: "18:00", read: true },
      { sender: "bot", text: "Olá! Recebemos sua mensagem. Como o seu caso envolve uma urgência sensível (prisão/audiência), acabo de pausar a IA e notificar nossa equipe de advogados especialistas.", time: "18:01", read: true }
    ],
    documentos: [
      { name: "CNH_Digital_Teste.pdf", folder: "pessoais", status: "Validado", size: "1.1 MB", date: "12/05/2024 18:00", author: "Cliente" },
      { name: "Termo_Audiencia_Custodia.pdf", folder: "processo", status: "Validado", size: "3.2 MB", date: "13/05/2024 10:00", author: "Fórum Barra Funda" },
      { name: "Recibo_Honorarios_Total.pdf", folder: "financeiro", status: "Validado", size: "300 KB", date: "12/05/2024 18:10", author: "Financeiro PFA" }
    ],
    timeline: [
      { time: "12/05 18:01", type: "Advogado", title: "Pausa", desc: "Bot pausado automaticamente por urgência penal" },
      { time: "12/05 18:00", type: "Sistema", title: "Criação", desc: "Lead sensível recebido" }
    ]
  },
  {
    id: 5,
    name: "Mariana Costa",
    phone: "(21) 98877-6655",
    email: "mariana.costa@yahoo.com.br",
    location: "Niterói - RJ",
    cpf: "234.567.890-12",
    endereco: "Rua das Flores, 120 - Icaraí",
    etapa: "Recurso em Andamento",
    tipoCaso: "CNH Suspensa",
    processo: "2024/1102",
    dataInfra: "28/02/2024",
    autuador: "PRF",
    valorCausa: 3200.00,
    valoresPagos: 1600.00,
    prioridade: "media",
    temperatura: "morno",
    roboAtivo: true,
    responsavelId: 2,
    proximaAcao: "Enviar atualização do julgamento em 1ª Instância",
    prazoAcao: "25/05/2024 14:00",
    promptCustom: "",
    messages: [
      { sender: "client", text: "Tive notícias do julgamento?", time: "16:00", read: true },
      { sender: "bot", text: "Ainda está pendente na JARI. Acompanhamos diariamente e avisaremos assim que sair a decisão.", time: "16:01", read: true }
    ],
    documentos: [
      { name: "CNH_Mariana.pdf", folder: "pessoais", status: "Validado", size: "1.1 MB", date: "10/05/2024", author: "Mariana" },
      { name: "Recurso_JARI.pdf", folder: "processo", status: "Validado", size: "2.3 MB", date: "12/05/2024", author: "Dr. Severton" }
    ],
    timeline: [
      { time: "12/05 10:00", type: "Advogado", title: "Recurso", desc: "Recurso protocolado na JARI" }
    ]
  },
  {
    id: 6,
    name: "Felipe Souza",
    phone: "(11) 97766-5544",
    email: "felipe.souza@outlook.com",
    location: "Guarulhos - SP",
    cpf: "345.678.901-23",
    endereco: "Av. Salgado Filho, 3200 - Vila Rio",
    etapa: "Novo Lead",
    tipoCaso: "Recurso de Multa",
    processo: "Pendente",
    dataInfra: "10/05/2024",
    autuador: "Prefeitura Municipal",
    valorCausa: 1200.00,
    valoresPagos: 0.00,
    prioridade: "baixa",
    temperatura: "quente",
    roboAtivo: true,
    responsavelId: 1,
    proximaAcao: "Enviar proposta comercial via WhatsApp",
    prazoAcao: "15/05/2024",
    promptCustom: "",
    messages: [
      { sender: "client", text: "Gostaria de saber os valores para recorrer de multa de rodízio.", time: "14:15", read: true },
      { sender: "bot", text: "Olá Felipe! Nossos honorários são de R$ 1.200,00. Podemos parcelar em até 4x no cartão. Vamos fechar?", time: "14:16", read: true }
    ],
    documentos: [
      { name: "Notificacao_Rodizio.pdf", folder: "pessoais", status: "Recebido", size: "950 KB", date: "13/05/2024", author: "Felipe" }
    ],
    timeline: [
      { time: "13/05 14:15", type: "Sistema", title: "Entrada", desc: "Lead importado via WhatsApp API" }
    ]
  },
  {
    id: 7,
    name: "Renata Lima",
    phone: "(31) 96655-4433",
    email: "renatalima@hotmail.com",
    location: "Belo Horizonte - MG",
    cpf: "456.789.012-55",
    endereco: "Rua Bahia, 900 - Lourdes",
    etapa: "Em Triagem",
    tipoCaso: "Lei Seca",
    processo: "2024/3490",
    dataInfra: "01/05/2024",
    autuador: "PRF",
    valorCausa: 5869.40,
    valoresPagos: 2000.00,
    prioridade: "alta",
    temperatura: "quente",
    roboAtivo: true,
    responsavelId: 3,
    proximaAcao: "Conferir calibragem do etilômetro no auto",
    prazoAcao: "16/05/2024",
    promptCustom: "",
    messages: [
      { sender: "client", text: "Fiz o teste, deu 0.35 mg/L. É crime?", time: "11:20", read: true },
      { sender: "bot", text: "Olá Renata. Sim, acima de 0.33 mg/L é considerado crime de trânsito. Vamos trabalhar para anular a prova com base no etilômetro.", time: "11:21", read: true }
    ],
    documentos: [
      { name: "Auto_Infracao_Crime.pdf", folder: "pessoais", status: "Recebido", size: "1.7 MB", date: "12/05/2024", author: "Renata" }
    ],
    timeline: [
      { time: "12/05 11:20", type: "Sistema", title: "Entrada", desc: "Lead importado" }
    ]
  },
  {
    id: 8,
    name: "Lucas Rocha",
    phone: "(11) 95544-3322",
    email: "lucasrocha@gmail.com",
    location: "São Bernardo - SP",
    cpf: "567.890.123-66",
    endereco: "Rua Jurubatuba, 450 - Centro",
    etapa: "Fechado",
    tipoCaso: "CNH Cassada",
    processo: "2024/0045",
    dataInfra: "12/12/2023",
    autuador: "Detran/SP",
    valorCausa: 3000.00,
    valoresPagos: 3000.00,
    prioridade: "media",
    temperatura: "frio",
    roboAtivo: false,
    responsavelId: 1,
    proximaAcao: "Monitorar entrega da CNH reabilitada",
    prazoAcao: "Concluído",
    promptCustom: "",
    messages: [
      { sender: "client", text: "Obrigado Dr. Luis! Consegui reaver minha CNH hoje!", time: "09:00", read: true },
      { sender: "bot", text: "Parabéns Lucas! Caso resolvido e arquivado com sucesso. Conte sempre conosco!", time: "09:02", read: true }
    ],
    documentos: [
      { name: "Certidao_Reabilitacao.pdf", folder: "processo", status: "Validado", size: "820 KB", date: "14/05/2024", author: "Detran/SP" }
    ],
    timeline: [
      { time: "14/05 09:00", type: "Advogado", title: "Encerramento", desc: "CNH devolvida e caso arquivado" }
    ]
  }
];

window.mockLawyers = [
  { id: 1, name: "Dr. Luis Gustavo Parreira", initials: "LG", role: "Sócio-Administrador", casosAtivos: 28, especialidade: "Lei Seca" },
  { id: 2, name: "Dr. Severton Roberto", initials: "SR", role: "Sócio-Controlador", casosAtivos: 22, especialidade: "Suspensão" },
  { id: 3, name: "Dra. Deborah Angeli", initials: "DA", role: "Sócia-Precedentes", casosAtivos: 12, especialidade: "Cassação" }
];

window.mockTasks = [
  { id: 1, titulo: "Conferir documentos de João da Silva", leadId: 1, prioridade: "alta", responsavelId: 1, concluida: false, prazo: "11/07/2026", tipo: "Diligência" },
  { id: 4, titulo: "Audiência caso Carlos Mendes", leadId: 3, prioridade: "alta", responsavelId: 1, concluida: false, prazo: "12/07/2026", tipo: "Audiência" },
  { id: 7, titulo: "Prazo de Trânsito em Julgado - Maria Oliveira", leadId: 2, prioridade: "alta", responsavelId: 2, concluida: false, prazo: "14/07/2026", tipo: "Protocolo" },
  { id: 8, titulo: "Recurso administrativo - Fernanda Costa", leadId: 5, prioridade: "alta", responsavelId: 1, concluida: false, prazo: "15/07/2026", tipo: "Petição" },
  { id: 9, titulo: "Enviar procuração assinada ao Detran", leadId: 6, prioridade: "media", responsavelId: 3, concluida: false, prazo: "16/07/2026", tipo: "Diligência" },
  { id: 2, titulo: "Protocolar defesa de Pedro Lima", leadId: 2, prioridade: "media", responsavelId: 2, concluida: false, prazo: "20/07/2026", tipo: "Protocolo" },
  { id: 3, titulo: "Enviar contrato de Lucas Rocha", leadId: 8, prioridade: "baixa", responsavelId: 3, concluida: false, prazo: "25/07/2026", tipo: "Outro" },
  { id: 6, titulo: "Preparar peça de defesa administrativa - Roberto Alves", leadId: 4, prioridade: "alta", responsavelId: 1, concluida: false, prazo: "18/07/2026", tipo: "Petição" },
  { id: 10, titulo: "Consulta de prontuário DETRAN/SP - Ana Beatriz", leadId: 7, prioridade: "media", responsavelId: 2, concluida: false, prazo: "22/07/2026", tipo: "Consulta" },
  { id: 11, titulo: "Protocolar CETRAN/SP - recurso por pontos", leadId: 4, prioridade: "baixa", responsavelId: 3, concluida: false, prazo: "30/07/2026", tipo: "Protocolo" },
  { id: 5, titulo: "Validar procuração assinada", leadId: 1, prioridade: "media", responsavelId: 2, concluida: true, prazo: "10/07/2026", tipo: "Petição" },
  { id: 12, titulo: "Reunião inicial com João da Silva", leadId: 1, prioridade: "baixa", responsavelId: 1, concluida: true, prazo: "05/07/2026", tipo: "Consulta" },
  { id: 13, titulo: "Envio de proposta comercial - Carlos Mendes", leadId: 3, prioridade: "media", responsavelId: 1, concluida: true, prazo: "08/07/2026", tipo: "Outro" }
];

window.tiposTarefa = ["Petição", "Protocolo", "Diligência", "Consulta", "Audiência", "Outro"];

window.crmEtapas = ["Novo Lead", "Em Triagem", "Documentos Pendentes", "Assinatura", "Protocolo", "Recurso em Andamento", "Audiência / Retorno", "Fechado"];
window.tiposCaso = ["Lei Seca", "CNH Suspensa", "CNH Cassada", "Recurso de Multa", "Defesa Prévia", "Suspensão por Pontos"];
window.orgaosAutuadores = ["Detran/SP", "PRF", "Polícia Rodoviária", "CETRAN/SP", "DER/SP", "Prefeitura Municipal"];

window.officeExpenses = [
  { id: 1, descricao: "Facebook Ads - Campanha Maio", categoria: "Marketing", data: "10/05/2024", valor: 2500.00 },
  { id: 2, descricao: "Google Ads - Leads Lei Seca", categoria: "Marketing", data: "12/05/2024", valor: 1800.00 },
  { id: 3, descricao: "Servidor VPS WAHA WhatsApp API", categoria: "Aplicativos", data: "05/05/2024", valor: 150.00 },
  { id: 4, descricao: "Assinatura n8n Cloud Pro", categoria: "Aplicativos", data: "08/05/2024", valor: 240.00 },
  { id: 5, descricao: "Créditos API OpenAI / ChatGPT", categoria: "Aplicativos", data: "11/05/2024", valor: 320.00 }
];

window.mockFollowupLogs = [
  { id: 1, clientName: "João da Silva", type: "Mensagem Livre", date: "12/05/2024 10:15", status: "Enviado via WhatsApp" },
  { id: 2, clientName: "Maria Oliveira", type: "Cobrar CNH", date: "11/05/2024 14:30", status: "Enviado via WhatsApp" },
  { id: 3, clientName: "Renata Lima", type: "Cobrar assinatura Procuração", date: "14/05/2024 09:30", status: "Agendado" }
];
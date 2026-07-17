# 🗺️ Mapa de Contexto — PFA Dashboard (app.js)

Este arquivo serve como índice para que os agentes de IA saibam quais linhas do `app.js` ler, evitando a releitura desnecessária de todo o arquivo e economizando tokens de API.

## Principais Funções e Seções do `app.js`

| Seção / Funcionalidade | Linhas Aproximadas | Descrição / Responsabilidade |
| :--- | :--- | :--- |
| **Inicialização & Eventos Globais** | 1 – 200 | Configuração inicial, Event Listeners do menu lateral, toggle de telas |
| **Renderização do Chat (Esquerda)** | 200 – 340 | `renderChatList()` - Lista de conversas com tags visuais (VIP, URGENTE, etc.) |
| **Painel do Chat Central** | 340 – 480 | `renderChatArea()`, barra de progresso do caso, upload de anexos e envio de mensagens |
| **Abas do Painel Inferior do Chat** | 480 – 660 | Abas de Documentos, Notas do Advogado, Tarefas e Automação/IA do Lead ativo |
| **Envio de Mensagens & Personas** | 660 – 810 | Processamento de mensagens enviadas, formatação por personas (Jurídico, Finanças, etc.) |
| **Aba / Tela de Documentos** | 810 – 1130 | Tabela de Documentos, preview de arquivos em PDF, uploads e validação de CNH/defesas |
| **Filtros e Visualização do Kanban (CRM)** | 1130 – 1450 | `renderFullKanbanScreen()`, renderização dos cards com urgência e etapas do CRM |
| **Visualizador de Documentos (Aba Direita)** | 1450 – 1650 | Visualizador lateral e colapsável de documentos anexados ao lead ativo |
| **Edição e Criação de Leads (Modais)** | 1650 – 1910 | Modais de novo lead, salvar alterações, temperatura e reatribuição de advogados |
| **Ficha Completa do Caso (Slideout)** | 1910 – 2160 | Painel slideout detalhado com seções financeiras, tarefas e timeline do lead |
| **Gestão de Tarefas (Controladoria)** | 2160 – 2430 | Modais de nova tarefa, salvar tarefas, timeline de tarefas do advogado e filtro de urgência |
| **Alertas & Banner de Urgência** | 2430 – 2680 | Lógica que varre tarefas pendentes e exibe o banner global vermelho no topo se prazo < 48h |
| **Logs de Automação & Webhooks** | 3130 – 3200 | Simulação de webhook n8n / WAHA e logs exibidos na tela de configurações |
| **Módulo Financeiro (DRE & Fluxo)** | 3200 – 3720 | Gráfico de forecast, DRE simplificado, registrar pagamentos e despesas |
| **Uploads, Timeline & Outros Utilitários** | 3720 – 4680 | Chamadas de API simuladas, geração de relatórios PDF/Word, validações de CNH e timelines |
| **Controle de Personas & Urgência Máxima** | 4680 – 4740 | `toggleUrgenciaMaxima()`, borders dinâmicos das personas e ativação de urgência penal |
| **Central de Controle de Escala (Filtros Avançados)** | 4740 – 4885 | Filtros de prazo, fases do processo e infrações, busca autocomplete de motoristas |

---

> [!IMPORTANT]
> **Instrução para Agentes:** Sempre consulte este mapa antes de usar `view_file` no `app.js`. Leia apenas a fatia de linhas correspondente ao componente que você está modificando.

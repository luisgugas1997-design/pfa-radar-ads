# Regras Globais — PFA Dashboard & Projetos de Luiz

## 🔒 REGRA OBRIGATÓRIA: Rastreamento de Custos por Interação

**Esta regra se aplica a TODOS os modelos (Gemini Flash, Claude Sonnet, Claude Opus, etc.) em TODAS as interações, sem exceção.**

Ao final de **TODA** resposta (desde "oi" até a última mensagem), incluir uma tabela de rastreamento de custos no seguinte formato:

### Formato obrigatório:

```
---
### 💳 Extrato de Créditos — Atualizado

| | Valor |
|---|---|
| **Saldo anterior** | X créditos |
| **Gasto estimado desta interação** | ~Y créditos |
| **Saldo restante estimado** | **~Z créditos** |

| Modelo | Custo estimado | Recomendação |
|---|---|---|
| Gemini 3.5 Flash | ~0,00 (cota grátis) | 🟢 |
| Claude Sonnet 4.6 | ~X créditos | 🟡 |
| Claude Opus 4.6 | ~X créditos | 🔴 |
```

### Regras de cálculo:

1. **Saldo inicial atual confirmado:** 1.795 créditos (atualizado em 15/jul/2026 às 13:57 via extrato Google One)
2. **Modelo de cobrança do Google Antigravity:** por atividade de IA faturada por bloco de hora ativa. Cada interação ou sessão de ferramenta pesada acumula atividade.
3. **Estimativas de custo reais observadas:**
   - Gemini 3.5 Flash: ~0 a 5 créditos por atividade (extremamente econômico e coberto pela assinatura Pro)
   - Claude Sonnet 4.6 (Thinking): ~15 a 50 créditos por sessão de atividade moderada
   - Claude Opus 4.6 (Thinking): ~100 a 450 créditos por sessão de atividade intensa/complexa (evitar ao máximo!)
4. **Quando o usuário informar saldo real:** atualizar imediatamente o saldo e recalcular as estimativas.
5. **Se o saldo cair abaixo de 1000 créditos:** alertar proativamente e recomendar evitar Claude Opus.
6. **Se o saldo cair abaixo de 500 créditos:** alerta URGENTE e restringir uso apenas para Gemini Flash.

## 📁 Projeto PFA Dashboard

### Estrutura de Arquivos
O projeto está em: `C:\Users\Luiz\.gemini\antigravity\scratch\pfa-dashboard\`

**Arquivos principais:**
- `index.html` — Estrutura HTML (~1000 linhas)
- `style.css` — Estilos CSS (~2000 linhas)
- `mockData.js` — Dados simulados de leads, tarefas, documentos

**Módulos JavaScript** (em `modules/`):
| Módulo | Linhas | Descrição |
|---|---|---|
| `state.js` | 105 | Variáveis globais e referências DOM |
| `helpers.js` | 231 | Funções utilitárias, formatadores |
| `toasts.js` | 414 | Notificações toast, simulação webhook |
| `nav.js` | 86 | Navegação da sidebar entre telas |
| `conversations.js` | 632 | Chat, mensagens, robô IA |
| `documents.js` | 286 | Tela de documentos, upload |
| `crm.js` | 633 | CRM interativo, pipeline, leads |
| `kanban.js` | 428 | Kanban board com drag-and-drop |
| `tasks.js` | 555 | Sistema de tarefas (controladoria) |
| `financeiro.js` | 321 | Tela financeira, cobranças |
| `followup.js` | 78 | Modal de follow-up |
| `docviewport.js` | 268 | Viewport de documentos, drag-drop |
| `reports.js` | 683 | Relatórios Word/PDF, modais |
| `persona.js` | 319 | Personas, urgência, filtros escala |
| `init.js` | 39 | Inicialização DOMContentLoaded |

### Regras de Edição
1. **NUNCA editar o `app.js` diretamente** — ele é um backup do monolito. Editar APENAS os módulos em `modules/`.
2. **Para economizar tokens:** ler apenas o módulo relevante, não todos.
3. **Padrão de exports:** todas as funções acessíveis externamente usam `window.nomeFuncao = nomeFuncao;`
4. **Variáveis globais:** declaradas em `state.js`, acessíveis em todos os módulos via escopo global do browser.
5. **Emojis:** usar emojis Unicode diretamente (✅ 📋 🚨 📄). NUNCA usar sequências como Y' ou Y" que eram corrupções anteriores.

### Stack Tecnológica
- HTML5 + CSS3 + JavaScript vanilla (sem frameworks)
- Sem backend — dados simulados em `mockData.js`
- Design: dark theme com cores dourado (#d4af37), bordô (#600014), laranja (#ff6b35)
- Fontes: Inter (Google Fonts)

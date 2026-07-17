# Painel de Controle PFA Advogados - Versão Visual

Este projeto é uma réplica interativa exata do design que você enviou para o Dashboard de Controle de IA e CRM da PFA Advogados.

## Como Visualizar Localmente (Sem instalações necessárias)

Como estruturamos o código utilizando Javascript nativo e sem dependências complexas de compiladores, você pode abrir e testar no seu navegador com apenas 2 cliques!

1. Vá até a pasta: `C:\Users\Luiz\.gemini\antigravity\scratch\pfa-dashboard\`
2. Dê dois cliques no arquivo **`index.html`** para abri-lo no seu navegador (Google Chrome, Edge, etc.).
3. **Pronto!** Você verá a interface inteira rodando no seu navegador com todas as conversas, chat, abas de arquivos e Kanban ativos.

---

## O Que Está Funcionando Nesta Versão (Dados de Teste):

- **Lista de Conversas (Esquerda):** Você pode clicar nos diferentes clientes (João da Silva, Maria Oliveira, Carlos Mendes, Cliente Lei Seca Teste) para trocar de chat.
- **Painel Central (Chat):** Você pode digitar mensagens na barra inferior e enviar. Se o robô estiver ativo, ele vai te responder simulando a IA após 1 segundo!
- **Parar / Retomar Robô:** Os botões no cabeçalho mudam o status do bot na hora, adicionando o evento na Linha do Tempo e alterando a barra de status verde/vermelha de resposta da IA.
- **Abas de Arquivos (Embaixo):** A aba "Documentos" renderiza as pastas e os arquivos recebidos do cliente selecionado dinamicamente.
- **Formulário CRM & Kanban (Direita):** Exibe as informações do CRM de acordo com o cliente que você clicar na lista. O Kanban destaca onde o cliente ativo está no funil de vendas.
- **Editor de Prompts:** Você pode alterar o prompt personalizado e clicar em "Salvar Prompt".

---

## Como Faremos a Conexão Real (Próxima Fase):

Na fase seguinte, conectaremos os botões e dados com a sua infraestrutura:
1. **NocoDB:** As informações do formulário da direita e Kanban serão lidas e atualizadas diretamente na sua tabela do NocoDB via API.
2. **Chatwoot:** A lista de conversas da esquerda e a janela de chat do centro serão sincronizadas em tempo real com as mensagens que chegam no Chatwoot.
3. **n8n:** O fluxo do n8n que criamos anteriormente fará a ponte entre o WhatsApp (WAHA) e o Chatwoot/NocoDB.

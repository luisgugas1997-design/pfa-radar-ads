# Radar Google Ads — PFA Advogados

MVP sob demanda para observar anúncios públicos no Google, registrar histórico
incremental e analisar as landing pages encontradas sem clicar em anúncios,
preencher formulários ou enviar mensagens.

## O que o painel mede

- concorrentes, anúncios únicos e aparições **observados** nas consultas executadas;
- presença observada por anunciante, consulta, região e dispositivo;
- histórico de anúncios e snapshots de landing pages;
- headline, subtítulos, CTA, WhatsApp, formulários, FAQ e sinais textuais;
- cobertura e data real da observação.

Os números não representam investimento, participação de mercado, volume de busca
nem o inventário completo de anúncios de uma empresa.

## Controle de custo

Nenhuma busca roda automaticamente. O usuário seleciona serviço, regiões,
dispositivo e modo, revisa a matriz e confirma. O planner limita cada plano a
24 consultas e a API revalida o saldo da SerpApi antes de cada busca.

## Configuração

Copie `backend/.env.example` para `backend/.env` somente no ambiente local ou
configure estas variáveis no servidor:

```text
DATABASE_URL=postgresql+asyncpg://usuario:senha@host:5432/banco
SERPAPI_API_KEY=chave_da_serpapi
RADAR_ACCESS_USER=usuario_do_painel
RADAR_ACCESS_PASSWORD=senha_forte_do_painel
```

O arquivo `.env` é ignorado pelo Git e pelo contexto Docker.

## Execução

```bash
pip install -r requirements.txt
uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

Abra `http://localhost:8000/radar` e informe as credenciais HTTP Basic.

## Validação

```bash
pytest -q
```

O container usa a imagem Playwright `v1.40.0-jammy`, e a mesma versão está
fixada em `requirements.txt`.

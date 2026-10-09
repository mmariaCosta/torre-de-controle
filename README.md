# Torre de Controle

[![Testes](https://github.com/mmariacosta/torre-de-controle/actions/workflows/tests.yml/badge.svg)](https://github.com/mmariacosta/torre-de-controle/actions/workflows/tests.yml)

Simulação de um SOC (Security Operations Center) com foco em detecção de ameaças, análise de alertas e resposta a incidentes. Cada log é um "voo", cada alerta é uma "aeronave suspeita", cada decisão é uma ação da torre.

**Demo:** https://torre-de-controle-tawny.vercel.app/
**API:** https://torre-de-controle-6ycb.onrender.com/docs

---

## Sobre o projeto

Sou estudante de Técnico em TI no COTUCA (Unicamp) e fui aprovada em Cibersegurança na FIAP. Trabalho com ADVPL e Protheus no dia a dia e construí esse projeto pra juntar duas coisas que gosto: sistemas e segurança.

A ideia foi criar uma aplicação que qualquer pessoa pudesse abrir no navegador e ver, na prática, o trabalho de um analista de SOC. Não é uma tela estática: o backend gera logs continuamente, aplica regras de detecção em cima desses logs e devolve alertas pro front. Quando você investiga um alerta e o classifica, o estado muda de verdade no servidor.

Usei a metáfora do aeroporto porque SOC e torre de controle fazem a mesma coisa: monitoram um espaço, detectam anomalias, investigam antes que vire problema. A analogia ajuda quem nunca trabalhou em segurança a entender o que está acontecendo.

**Nenhum dado é real.** Todos os logs são gerados por um script Python em memória.

---

## Funcionalidades

### Acesso à torre
- Login simplificado com nome do controlador e turno
- Sessão em `sessionStorage` com limpeza ao sair
- Rate limit contra tentativas excessivas

### Painel de controle
- KPIs em tempo real: voos monitorados, suspeitos, bloqueados e alertas pendentes
- Lista dos últimos voos no radar
- Status do sistema: varredura, última leitura, regras ativas, disponibilidade
- Atualização automática a cada 10 segundos

### Radar de alertas
- Lista de alertas gerados pelas regras de detecção
- Filtros por severidade (crítico, alto, médio, baixo) e status
- Cada alerta tem ID, título, técnica MITRE, passageiro, origem e severidade
- Polling a cada 5 segundos

### Detalhe do voo
- Metadados completos do alerta
- Timeline de eventos relacionados
- Recomendações de remediação
- Ações: investigar, marcar como falso positivo, escalar, concluir
- Botão "Investigar logs" que abre o terminal com filtro pronto

### Relatório
- Documento formatado no estilo corporativo
- Cabeçalho com selo "Confidencial · Demonstração"
- Marca d'água de fundo
- Timeline numerada
- Bloco de assinatura do controlador
- Exportação por impressão do navegador (salvar como PDF)

### Histórico de eventos
- Tabela com todos os alertas finalizados
- Filtros por data, controlador e severidade
- Cálculo de tempo total (da detecção até a resolução)
- Exportação em CSV
- Atalho para ver o relatório de cada alerta

### Terminal de investigação
- Consulta de logs brutos com comandos estilo shell
- Comandos: `ajuda`, `buscar`, `resumo`, `historico`, `limpar`
- Histórico de comandos (setas ↑ ↓)
- Autocomplete com Tab
- IPs e passageiros conhecidos são sugeridos automaticamente

### Tour guiado
- Passa pelas telas principais explicando cada uma
- Roda automaticamente na primeira visita
- Pode ser reaberto pelo botão no canto inferior direito

---

## Arquitetura

```
┌─────────────────────────────┐         ┌──────────────────────────────┐
│  Front-end React            │  HTTP   │  Backend Python              │
│  (Vercel)                   │ ──────► │  (Render)                    │
│                             │         │                              │
│  - Painel                   │         │  - Gerador de logs           │
│  - Radar                    │         │  - Motor de detecção         │
│  - Detalhe                  │         │  - API REST (FastAPI)        │
│  - Histórico                │         │                              │
│  - Investigação (terminal)  │         │                              │
└─────────────────────────────┘         └──────────────────────────────┘
```

**Backend (Python):**
- **Gerador:** cria logs falsos continuamente em thread paralela. A cada 15, 11 e 7 eventos, planta uma anomalia de tipos diferentes (brute force, origem incomum, lista negra).
- **Detector:** varre os logs e aplica 3 regras. Quando encontra um padrão suspeito, gera um alerta com técnica MITRE associada.
- **API:** expõe tudo via REST (FastAPI). Sem banco — estado em memória.

**Front-end (React):**
- Consome a API via polling (5-15s por tela)
- Sistema de tema claro/escuro com variáveis CSS
- Fallback local quando a API não responde

---

## Regras de detecção

| Regra | Descrição | Técnica MITRE |
|---|---|---|
| **Ataque coordenado** | 5+ falhas de login do mesmo IP em menos de 2 minutos | T1110.001 (Brute Force: Password Guessing) |
| **Origem incomum** | Login de conta a partir de país sem histórico de acesso | T1078 (Valid Accounts) |
| **Origem em lista negra** | Tentativa de acesso a partir de IP em lista de ameaças conhecidas | T1078 (Valid Accounts) |

---

## Stack

**Front-end:**
- React 18
- Vite
- JavaScript (sem TypeScript)
- CSS puro com variáveis
- React Router

**Backend:**
- Python 3.12
- FastAPI
- Pydantic
- Uvicorn

**Deploy:**
- Front: Vercel
- Backend: Render (plano gratuito)

---

## Como rodar localmente

### Pré-requisitos
- Node.js 18+
- Python 3.12
- (Opcional) Docker

### Backend

```bash
cd backend
python -m venv venv

# Windows
.\venv\Scripts\Activate.ps1

# Linux/Mac
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --reload-dir app
```

Roda em `http://localhost:8000`. Documentação automática em `http://localhost:8000/docs`.

### Front-end

Em outro terminal:

```bash
npm install
npm run dev
```

Roda em `http://localhost:5173`.

Cria um arquivo `.env` na raiz com:

```
VITE_API_URL=http://localhost:8000
```

### Com Docker (opcional)

```bash
docker compose up
```

---

## Decisões técnicas

**Por que metáfora de aeroporto?**
SOC e torre de controle fazem exatamente a mesma coisa. A analogia não é decorativa — ela ajuda quem está aprendendo a entender o que cada peça faz. "Voo suspeito" comunica melhor que "evento de segurança com score anômalo".

**Por que polling e não WebSocket?**
Polling é mais simples de implementar, testar e debugar. Para uma demo com 3-5 atualizações por minuto, a diferença é imperceptível. WebSocket viraria complexidade sem ganho visível.

**Por que estado em memória e não SQLite?**
O backend é uma simulação. Não precisa persistir entre reinícios. Um banco de verdade viria se fosse adicionar multi-turno ou histórico de longo prazo.

**Por que Python no backend?**
Python é a linguagem mais usada em ferramentas de segurança (regras Sigma, scripts de detecção, ferramentas de análise). Foi escolha pensando no domínio, não na conveniência.

**Por que CSS puro?**
Aprendi muito mais sobre variáveis, media queries e grid escrevendo tudo à mão. Um framework teria escondido o que eu precisava entender.

---

## Roadmap

Coisas que quero adicionar numa próxima versão:

- [ ] Autenticação real com bcrypt + JWT
- [ ] Persistência em SQLite (histórico sobrevive a reinícios)
- [ ] Multi-turno (controladores diferentes veem alertas diferentes)
- [ ] Enriquecimento com Threat Intelligence (VirusTotal, AbuseIPDB)
- [ ] Gráfico de alertas ao longo do tempo
- [ ] Testes automatizados (pytest + vitest)
- [ ] CI/CD com GitHub Actions

---

## Autor

Maria Costa
- E-mail: mmaria.costa@outlook.com
- LinkedIn: [mmariacosta](https://www.linkedin.com/in/mmariacosta)
- GitHub: [mmariacosta](https://github.com/mmariacosta)

---

## Licença

MIT
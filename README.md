# Torre de Controle

[![Testes](https://github.com/mmariacosta/torre-de-controle/actions/workflows/tests.yml/badge.svg)](https://github.com/mmariacosta/torre-de-controle/actions/workflows/tests.yml)

Simulação de um SOC (Security Operations Center) com geração de logs em tempo real, motor de detecção baseado em MITRE ATT&CK, terminal de investigação e histórico de incidentes. Cada log é um "voo", cada alerta é uma "aeronave suspeita" e cada decisão é uma ação da torre.

**Demo:** https://torre-de-controle-tawny.vercel.app/
**API:** https://torre-de-controle-6ycb.onrender.com/docs

---

## Índice

- [Sobre o projeto](#sobre-o-projeto)
- [Arquitetura](#arquitetura)
- [Stack](#stack)
- [Funcionalidades](#funcionalidades)
- [Regras de detecção](#regras-de-detecção)
- [Como rodar](#como-rodar)
- [Desafios e soluções](#desafios-e-soluções)
- [Segurança](#segurança)
- [Testes](#testes)
- [CI/CD](#cicd)
- [Deploy](#deploy)
- [Roadmap](#roadmap)
- [Referências](#referências)
- [Autor](#autor)

---

## Sobre o projeto

Sou desenvolvedora ADVPL em transição para cibersegurança. Construí esse projeto para praticar o trabalho diário de um analista de SOC: gerar logs, aplicar regras de detecção, investigar alertas, classificar incidentes e emitir relatório.

Usei a metáfora do aeroporto porque SOC e torre de controle fazem a mesma coisa — monitoram um espaço, detectam anomalias, decidem o que fazer antes que vire problema. A analogia ajuda quem não trabalha com segurança a entender o que está acontecendo.

O projeto tem três partes:

- **Frontend (React):** dashboard, radar de alertas, histórico, terminal de investigação, relatórios
- **Backend (Python):** gerador de logs, motor de detecção, API REST
- **Segurança:** sanitização, rate limit, sessão, CORS, headers

---

## Arquitetura

```
┌─────────────────────────────┐         ┌──────────────────────────────┐
│  Frontend React             │  HTTP   │  Backend Python              │
│  (Vercel)                   │ ──────► │  (Render)                    │
│                             │         │                              │
│  - Painel                   │         │  - Gerador de logs           │
│  - Radar                    │         │  - Motor de detecção         │
│  - Detalhe                  │         │  - API REST (FastAPI)        │
│  - Histórico                │         │                              │
│  - Investigação             │         │                              │
│  - Protocolos               │         │                              │
│  - Relatórios               │         │                              │
└─────────────────────────────┘         └──────────────────────────────┘
```

**Nota sobre estado:** o backend mantém tudo em memória, sem banco. Cada deploy ou reinício zera os dados. Isso é intencional — é uma simulação, não precisa persistir. O plano free do Render reinicia o container a cada 15 minutos sem acesso.

**Nota sobre polling:** o front consulta a API em intervalos regulares (5-15s por tela). Escolhi polling em vez de WebSocket por simplicidade. Para uma demo com poucas atualizações por minuto, a diferença é imperceptível, e o custo de implementação cai bastante.

---

## Stack

**Frontend**
- React 18
- Vite
- JavaScript puro (sem TypeScript)
- CSS com variáveis customizadas
- React Router
- Recharts (gráfico de alertas)

**Backend**
- Python 3.12
- FastAPI
- Pydantic
- Uvicorn

**Testes**
- Backend: pytest + httpx
- Frontend: vitest + testing-library + jsdom

**Deploy**
- Frontend: Vercel
- Backend: Render (free tier)

---

## Funcionalidades

### Acesso à torre

Login simplificado — só nome e turno. Sem senha, sem banco. Sessão em `sessionStorage` com limpeza ao sair. Rate limit de 5 tentativas por 60 segundos.

### Painel

KPIs em tempo real (voos monitorados, suspeitos, bloqueados, alertas pendentes), lista dos últimos voos, status do radar, gráfico de alertas por hora nas últimas 12h. Atualização a cada 10s.

### Radar

Lista de alertas com filtros por severidade (crítico, alto, médio, baixo) e status (aberto, investigando, escalado). Polling a cada 5s. Clicar em um alerta abre o detalhe.

### Detalhe do voo

Metadados completos, timeline de eventos, recomendações de remediação, ações (investigar, falso positivo, escalar, concluir), botão "Investigar logs" que abre o terminal com filtro pronto.

### Relatório

Documento formatado em estilo corporativo, com selo "Confidencial · Demonstração", marca d'água, timeline numerada e bloco de assinatura. Impressão via navegador (salvar como PDF).

### Histórico

Tabela com todos os alertas finalizados. Filtros por data, controlador e severidade. Cálculo de tempo total (detecção → resolução). Exportação em CSV.

### Terminal de investigação

Consulta de logs brutos com comandos estilo shell:

| Comando | O que faz |
|---|---|
| `ajuda` | Lista os comandos disponíveis |
| `buscar ip=<valor>` | Eventos de um IP |
| `buscar passageiro=<nome>` | Eventos de um usuário |
| `buscar status=<valor>` | Eventos por status |
| `resumo` | Estatísticas do radar |
| `historico` | Últimos comandos digitados |
| `limpar` | Limpa a tela |

Suporta histórico navegável com setas ↑ ↓ e autocomplete com Tab.

### Protocolos

Lista as 3 regras de detecção ativas com descrição, técnica MITRE, contagem de disparos e data do último disparo.

### Relatórios agregados

Análise consolidada do histórico: por controlador, por severidade, por categoria. Cada bloco exportável em CSV.

---

## Regras de detecção

| ID | Regra | Técnica MITRE | Severidade |
|---|---|---|---|
| P-001 | Ataque coordenado: 5+ falhas de login do mesmo IP em menos de 2 minutos | T1110.001 — Brute Force: Password Guessing | Alto |
| P-002 | Origem incomum: login de conta a partir de país sem histórico | T1078 — Valid Accounts | Médio |
| P-003 | Origem em lista negra: acesso a partir de IP catalogado em lista de ameaças | T1078 — Valid Accounts | Crítico |

Cada regra gera um alerta com ID único, timeline dos eventos que a dispararam, recomendações de remediação e classificação MITRE.

---

## Como rodar

**Pré-requisitos:** Node.js 18+, Python 3.12.

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

Roda em `http://localhost:8000`. Documentação automática em `/docs`.

### Frontend

Em outro terminal:

```bash
npm install
npm run dev
```

Roda em `http://localhost:5173`.

Cria um `.env` na raiz com:

```
VITE_API_URL=http://localhost:8000
```

### Docker (opcional)

```bash
docker compose up
```

---

## Desafios e soluções

Durante o desenvolvimento, vários problemas apareceram. Cada um abaixo tem o contexto, a causa e a correção aplicada.

### Frontend

#### 1. Loop infinito de renderização no tour

O tour automático navegava entre rotas e entrava em loop, travando a página com `Maximum update depth exceeded`.

**Causa:** o `useEffect` que dispara a navegação dependia de `step` (objeto recriado a cada render) e `navigate` (referência instável do React Router). As deps disparavam sem parar.

**Solução:** mover `navigate` e `onFinish` para refs e usar apenas valores primitivos como dependência.

```jsx
const navigateRef = useRef(navigate);
useEffect(() => { navigateRef.current = navigate; }, [navigate]);

const onFinishRef = useRef(onFinish);
useEffect(() => { onFinishRef.current = onFinish; }, [onFinish]);

const navigatedRef = useRef(null);
const finishedRef = useRef(false);

useEffect(() => {
  if (!active || !step) return;
  const targetPath = step.path;

  if (location.pathname === targetPath) return;
  if (navigatedRef.current === targetPath) return;

  navigatedRef.current = targetPath;
  navigateRef.current(targetPath);
}, [active, stepIndex, step?.path, location.pathname]);
```

Três proteções: ref do navigate, o path como dependência (não o objeto inteiro) e uma trava que impede navegar duas vezes para o mesmo destino.

#### 2. Dados antigos no localStorage quebravam o app

Quando adicionei campos novos (`prioridade`, `sla`, `solicitante`), o app quebrou em telas que liam esses dados. Motivo: o `localStorage` tinha objetos salvos antes da mudança.

**Solução:** migração automática ao carregar.

```jsx
const migrarEmail = (email, idx) => ({
  protocolo: email.protocolo || `#2024-${String(123 - idx).padStart(4, '0')}`,
  solicitante: email.solicitante || email.remetente?.split('@')[0],
  prioridade: email.prioridade || 'P3',
  sla: email.sla || '8h',
  respostas: email.respostas || [],
  ...email,
});

// Ao carregar do localStorage:
const parsed = JSON.parse(saved);
const migrados = parsed.map(migrarEmail);
setEmails(migrados);
```

Cada campo novo recebe um valor derivado se não existir. O spread no final garante que dados válidos não são sobrescritos.

#### 3. Sincronização de status entre telas

Concluir um alerta no detalhe não atualizava a lista do radar. As telas liam o mesmo dado de fontes diferentes — uma do localStorage, outra da API.

**Solução:** cliente de API único e evento global para as telas reagirem.

```js
// api.js
export const api = {
  atualizarStatus: (id, status, controlador) =>
    buscar(`/alertas/${id}/status`, {
      method: 'POST',
      body: JSON.stringify({ status, controlador }),
    }),
};
```

```jsx
// Radar.jsx
useEffect(() => {
  const recarregar = () => setLista(carregarAlertas());

  window.addEventListener('alertas-atualizados', recarregar);
  window.addEventListener('focus', recarregar);

  return () => {
    window.removeEventListener('alertas-atualizados', recarregar);
    window.removeEventListener('focus', recarregar);
  };
}, []);
```

O `focus` cobre o caso de trocar de aba e voltar — evita dado desatualizado.

#### 4. Cold start do Render

O backend gratuito do Render dorme após 15 minutos sem acesso. A primeira chamada demora 30-50 segundos. Sem aviso, parece que o site quebrou.

**Solução:** faixa amarela que aparece enquanto a API não responde e some quando volta.

```jsx
export default function AvisoConexao({ ativo }) {
  const [segundos, setSegundos] = useState(0);

  useEffect(() => {
    if (!ativo) { setSegundos(0); return; }
    const timer = setInterval(() => setSegundos(s => s + 1), 1000);
    return () => clearInterval(timer);
  }, [ativo]);

  if (!ativo) return null;

  const mensagem = segundos < 5
    ? 'Conectando ao radar…'
    : segundos < 20
    ? 'Acordando o servidor. Aguarde alguns segundos.'
    : 'O servidor estava em repouso. Isso pode levar até 50 segundos.';

  return <div className="aviso-conexao">{mensagem}</div>;
}
```

#### 5. Tema claro/escuro sem duplicar CSS

**Solução:** variáveis CSS no `:root` e `[data-theme="dark"]`. O botão só troca um atributo no `<html>`.

```css
:root, [data-theme="light"] {
  --bg: #f4f4f6;
  --surface: #ffffff;
  --text: #111114;
  --accent: #7c3aed;
}

[data-theme="dark"] {
  --bg: #0d0d0d;
  --surface: #161616;
  --text: #e8e8ea;
  --accent: #a78bfa;
}
```

Persistência em `localStorage`, lida **antes** do React montar (script inline no `<head>` do `index.html`) para evitar flash de tema errado.

#### 6. Ícones com fallback em cascata

Nem toda tecnologia tem ícone no Devicon. Quando faltava, aparecia imagem quebrada.

**Solução:** três níveis de fallback no `TechCard` — Simple Icons, Devicon e emoji.

```jsx
const fallback = (e) => {
  const parent = e.target.parentElement;
  e.target.style.display = 'none';
  const span = document.createElement('span');
  span.textContent = tech.emoji || '📦';
  parent.insertBefore(span, e.target);
};

{tech.simpleIcon ? (
  <img src={`https://cdn.simpleicons.org/${tech.simpleIcon}/${tech.color}`}
       onError={fallback} />
) : tech.icon ? (
  <img src={`https://cdn.jsdelivr.net/gh/devicons/devicon/icons/${tech.icon}.svg`}
       onError={fallback} />
) : (
  <span>{tech.emoji}</span>
)}
```

### Backend

#### 7. Motor de detecção sem duplicar alertas

O detector rodava a cada requisição e gerava alertas duplicados para o mesmo padrão.

**Solução:** chave única por padrão detectado, guardada em dicionário.

```python
def _detectar_brute_force(self, voos: list[Voo]) -> list[Alerta]:
    por_ip: dict[str, list[Voo]] = {}
    for v in voos:
        if v.status == "bloqueado" and "senha incorreta" in v.motivo.lower():
            por_ip.setdefault(v.ip, []).append(v)

    alertas = []
    for ip, lista in por_ip.items():
        if len(lista) < 5:
            continue

        chave = f"bf-{ip}"
        if chave in self.alertas:
            continue  # já existe, não duplica

        alerta = Alerta(...)
        self.alertas[chave] = alerta
        alertas.append(alerta)

    return alertas
```

#### 8. Cálculo de tempo médio de resposta

O endpoint `/relatorios/agregado` precisava calcular quanto tempo cada alerta levou entre detecção e resolução.

**Solução:** parse de datas no formato `%d/%m/%Y %H:%M:%S` e delta em segundos.

```python
from datetime import datetime

tempos = []
for a in resolvidos:
    if not a.resolvidoEm or not a.detectadoEm:
        continue
    try:
        det = datetime.strptime(a.detectadoEm, "%d/%m/%Y %H:%M:%S")
        res = datetime.strptime(a.resolvidoEm, "%d/%m/%Y %H:%M:%S")
        delta = (res - det).total_seconds()
        if delta >= 0:
            tempos.append(delta)
    except Exception:
        continue

tempo_medio = sum(tempos) / len(tempos) if tempos else None
```

#### 9. Gráfico de alertas em 12 buckets

Agregar alertas por hora nas últimas 12 horas, mesmo quando não há alertas em determinada hora.

**Solução:** inicializar todos os buckets com zero e depois incrementar.

```python
@app.get("/stats/grafico")
def stats_grafico():
    agora = datetime.now()
    doze_horas = [agora - timedelta(hours=i) for i in range(11, -1, -1)]

    buckets = []
    for h in doze_horas:
        buckets.append({
            "hora": h.strftime("%H:00"),
            "alertas": 0,
            "criticos": 0,
        })

    for alerta in todos:
        dt = datetime.strptime(alerta.detectadoEm, "%d/%m/%Y %H:%M:%S")
        for b, h in zip(buckets, doze_horas):
            if (dt.year, dt.month, dt.day, dt.hour) == (h.year, h.month, h.day, h.hour):
                b["alertas"] += 1
                if alerta.severidade == "critico":
                    b["criticos"] += 1
                break

    return buckets
```

### Segurança

#### 10. Sanitização de input

Todo campo de texto passa por limpeza antes de ir pro estado ou pra API. Remove tags HTML e caracteres de controle.

```js
export function sanitizeInput(str, maxLen = 100) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/<[^>]*>/g, '')
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maxLen);
}
```

#### 11. Escape no MarkdownRenderer

O renderizador de Markdown injeta HTML com `dangerouslySetInnerHTML`. Sem escape, um Markdown malicioso poderia executar script.

**Solução:** escapar HTML **antes** de gerar as tags permitidas.

```js
function markdownToHtml(md) {
  let html = md;

  // Extrai code blocks primeiro
  const codeBlocks = [];
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) => {
    const idx = codeBlocks.length;
    codeBlocks.push(`<pre><code>${escapeHtml(code)}</code></pre>`);
    return `\u0000CODEBLOCK${idx}\u0000`;
  });

  // Escapa ANTES de gerar tags
  html = escapeHtml(html);

  // Aplica as transformações seguras
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  // ...

  return html;
}
```

A ordem importa: `escapeHtml` roda primeiro, depois as tags permitidas são injetadas. Como o conteúdo já está escapado, tags perigosas no Markdown não passam.

#### 12. Sessão sem armazenar senha

O sistema não tem login real. Ainda assim, a sessão foi projetada para não guardar nada sensível.

```js
const authData = {
  nome: nomeLimpo,
  token: generateToken(),
  loginAt: Date.now(),
};
sessionStorage.setItem('tc_sessao', JSON.stringify(authData));
```

O token é um UUID aleatório. Não é JWT assinado (exigiria backend com chave secreta), mas também não é senha.

#### 13. Rate limit no login

Bloqueia após 5 tentativas seguidas em 60 segundos. Evita automação de tentativa e erro.

```js
export function checkRateLimit() {
  const agora = Date.now();
  const dados = JSON.parse(sessionStorage.getItem('@rl') || '{}');

  if (dados.blockedUntil && agora < dados.blockedUntil) {
    return {
      blocked: true,
      remaining: Math.ceil((dados.blockedUntil - agora) / 1000),
    };
  }

  if (dados.blockedUntil && agora >= dados.blockedUntil) {
    sessionStorage.removeItem('@rl');
  }

  return { blocked: false };
}
```

#### 14. CORS restrito

Em produção, a API só aceita chamadas do próprio frontend.

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://torre-de-controle-tawny.vercel.app",
    ],
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)
```

Durante o desenvolvimento, o CORS aceita `*`. Em produção, lista explícita.

#### 15. Timeout e abort de fetch

Chamadas para a API têm timeout de 45 segundos. Se passar, aborta e o front marca como offline.

```js
const TIMEOUT = 45000;

async function buscar(caminho, opcoes = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT);

  try {
    const resposta = await fetch(`${API_URL}${caminho}`, {
      ...opcoes,
      signal: controller.signal,
    });
    if (!resposta.ok) throw new Error(`API ${resposta.status}`);
    return await resposta.json();
  } finally {
    clearTimeout(timer);
  }
}
```

O timeout é alto de propósito — o backend free tier do Render pode demorar para acordar.

---

## Segurança

Resumo das práticas aplicadas:

| Camada | Prática |
|---|---|
| Input | Sanitização de todo texto antes de estado ou envio |
| Output | Escape de HTML no Markdown renderizado |
| Sessão | Sem senha. Só nome + token aleatório em `sessionStorage` |
| Autenticação | Rate limit de 5 tentativas por 60 segundos |
| API | CORS restrito por origem. Métodos e headers explícitos |
| Rede | Timeout e abort em todas as chamadas |
| Headers | `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy` |
| Transporte | HTTPS forçado em produção |

**Limitações honestas:** sem backend de autenticação real, não tem hash de senha (bcrypt), não tem JWT assinado, não tem log de auditoria no servidor. Essas viriam numa versão com backend persistente.

---

## Testes

### Backend — 21 testes

```bash
cd backend
source venv/bin/activate
pytest -v
```

Cobre:

- Regra de brute force (dispara com 5+ falhas, não dispara com menos)
- Regra de origem incomum (dispara com país suspeito, ignora país normal)
- Regra de lista negra (gera alerta crítico)
- Não duplicação de alertas entre execuções
- Todos os endpoints (retorno 200, formato esperado)
- Retorno 404 em alerta inexistente

### Frontend — 23 testes

```bash
npm test
```

Cobre:

- `parseDataHora` — conversão de string em Date
- `calcularTempo` — formatação de delta entre duas datas
- `dentroDoPeriodo` — filtros de data (hoje, 7d, 30d)
- `AvisoConexao` — troca de mensagem conforme tempo passa

---

## CI/CD

GitHub Actions roda os testes do backend (pytest) e do frontend (vitest) a cada push na `main`. O workflow está em `.github/workflows/tests.yml`.

Os dois jobs rodam em paralelo:

- **Backend (pytest):** 21 testes
- **Frontend (vitest):** 23 testes

O badge no topo mostra o status do último run. Se algum falhar, o badge fica vermelho e o commit aparece com ❌ no GitHub.

---

## Deploy

**Frontend:** Vercel. Detecta o projeto Vite automaticamente. Cada push na `main` rebuilda em ~1 minuto.

**Backend:** Render (free tier). O `Procfile` e o `render.yaml` estão no repositório.

**Variáveis de ambiente:**

- Vercel: `VITE_API_URL=https://torre-de-controle-6ycb.onrender.com`
- Render: `PYTHON_VERSION=3.12.0`

**Cold start:** o backend gratuito dorme após 15 minutos sem acesso. A primeira chamada depois disso demora 30-50 segundos. A faixa de aviso no front cobre isso.

---

## Roadmap

Coisas que pretendo adicionar numa próxima versão:

- **Persistência em SQLite** — histórico sobrevive a reinícios do backend. Resolveria o problema de perder tudo a cada deploy do Render.
- **Autenticação real** — cadastro com senha em hash (bcrypt), login validado, sessão com JWT assinado.
- **Multi-turno** — vários controladores logados ao mesmo tempo, alertas distribuídos por turno, passagem de bastão.
- **Notificações em tempo real** — WebSocket em vez de polling, para receber alertas novos instantaneamente.
- **Enriquecimento de IPs** — integração com AbuseIPDB ou VirusTotal para dar reputação aos IPs detectados.
- **Exportar PDF de verdade** — hoje o relatório usa "Imprimir → Salvar como PDF" do navegador. Poderia gerar PDF direto com `jsPDF`.

---

## Referências

- [MITRE ATT&CK](https://attack.mitre.org/) — framework de táticas e técnicas usadas nas regras de detecção
- [OWASP Top 10](https://owasp.org/www-project-top-ten/) — base para as decisões de segurança
- [FastAPI](https://fastapi.tiangolo.com/) — framework do backend
- [React](https://react.dev/) — biblioteca do frontend
- [Vite](https://vitejs.dev/) — build tool
- [Recharts](https://recharts.org/) — biblioteca do gráfico de alertas
- [pytest](https://docs.pytest.org/) — testes do backend
- [vitest](https://vitest.dev/) — testes do frontend
- [Wazuh](https://wazuh.com/) — SIEM open-source (referência futura)

---

## Autor

Maria Costa
Desenvolvedora ADVPL · Estudante de Cibersegurança (FIAP 2027)

- E-mail: mmaria.costa@outlook.com
- LinkedIn: [mmariacosta](https://www.linkedin.com/in/mmariacosta)
- GitHub: [mmariacosta](https://github.com/mmariacosta)
- Portfólio: https://mmariacosta.vercel.app/

---

## Licença

MIT

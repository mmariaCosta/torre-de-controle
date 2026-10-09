# Torre de Controle

[![Testes](https://github.com/mmariacosta/torre-de-controle/actions/workflows/tests.yml/badge.svg)](https://github.com/mmariacosta/torre-de-controle/actions/workflows/tests.yml)

Simulação de um SOC (Security Operations Center) com geração de logs em tempo real, 3 regras de detecção baseadas em MITRE ATT&CK, terminal de investigação e histórico de incidentes. Cada log é um "voo", cada alerta é uma "aeronave suspeita", cada decisão é uma ação da torre.

**Demo:** https://torre-de-controle-tawny.vercel.app/
**API:** https://torre-de-controle-6cby.onrender.com/docs

---

---

## Sobre

Sou desenvolvedora ADVPL em transição para cibersegurança. Construí esse projeto para praticar o trabalho diário de um analista de SOC — gerar logs, aplicar regras de detecção, investigar alertas, classificar incidentes e emitir relatório.

Usei a metáfora do aeroporto porque SOC e torre de controle fazem a mesma coisa: monitoram um espaço, detectam anomalias, decidem o que fazer. A analogia ajuda quem não trabalha com segurança a entender o que está acontecendo.

O projeto tem três partes:

- **Frontend (React):** dashboard, radar de alertas, histórico, terminal de investigação, relatórios
- **Backend (Python):** gerador de logs, motor de detecção, API REST
- **Security:** sanitização, rate limit, sessão, CORS, headers

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
└─────────────────────────────┘         └──────────────────────────────┘
```

O backend mantém **estado em memória** — sem banco. Cada deploy ou reinício zera os dados. Isso é intencional: é uma simulação, não precisa persistir.

---

## Stack

**Frontend**
- React 18
- Vite
- JavaScript (sem TypeScript)
- CSS puro com variáveis
- React Router

**Backend**
- Python 3.12
- FastAPI
- Pydantic
- Uvicorn

**Testes**
- Backend: pytest + httpx
- Frontend: vitest + testing-library

**Deploy**
- Frontend: Vercel
- Backend: Render (free tier)

---

## Funcionalidades

### Acesso à torre
Login simplificado (só nome + turno). Sessão em `sessionStorage`, sem senha, sem banco. É um ambiente de demonstração.

### Painel
KPIs em tempo real (voos monitorados, suspeitos, bloqueados, alertas pendentes), lista dos últimos voos, status do radar, gráfico de alertas por hora (últimas 12h), atualização a cada 10s.

### Radar
Lista de alertas com filtros por severidade (crítico, alto, médio, baixo) e status (aberto, investigando, escalado). Polling a cada 5s. Clicar abre o detalhe.

### Detalhe do voo
Metadados completos, timeline de eventos, recomendações, ações (investigar, falso positivo, escalar, concluir), botão "Investigar logs" que abre o terminal com filtro pronto.

### Relatório
Documento formatado em estilo corporativo, com selo "Confidencial · Demonstração", marca d'água, timeline numerada, bloco de assinatura. Impressão via navegador (salvar como PDF).

### Histórico
Tabela com todos os alertas finalizados. Filtros por data, controlador, severidade. Cálculo de tempo total (detecção → resolução). Exportação em CSV.

### Terminal de investigação
Consulta de logs brutos com comandos estilo shell. Suporta `ajuda`, `buscar ip=...`, `buscar passageiro=...`, `buscar status=...`, `resumo`, `historico`, `limpar`. Histórico navegável com setas ↑ ↓, autocomplete com Tab.

### Protocolos
Lista das 3 regras de detecção ativas, com descrição, técnica MITRE, contagem de disparos e data do último disparo.

### Relatórios agregados
Análise consolidada do histórico — por controlador, por severidade, por categoria. Cada bloco com exportação em CSV.

---

## Desafios e soluções

### Frontend

#### 1. Loop infinito de renderização no tour

O tour automático navegava entre rotas e entrava em loop, travando a página com `Maximum update depth exceeded`.

**Causa:** o `useEffect` dependia de `step` (objeto recriado a cada render) e `navigate` (referência instável). As deps disparavam sem parar.

**Solução:** mover `navigate` e `onFinish` para refs e usar só valores primitivos nas deps.

```jsx
const navigateRef = useRef(navigate);
useEffect(() => { navigateRef.current = navigate; }, [navigate]);

const navigatedRef = useRef(null);

useEffect(() => {
  if (!active || !step) return;
  const targetPath = step.path;

  if (location.pathname === targetPath) return;
  if (navigatedRef.current === targetPath) return; // trava anti-loop

  navigatedRef.current = targetPath;
  navigateRef.current(targetPath);
}, [active, stepIndex, step?.path, location.pathname]);
```

Três proteções: ref do navigate, path como dep (não objeto) e trava de navegação duplicada.

#### 2. Dados antigos no localStorage quebravam o app

Quando adicionei campos novos (`prioridade`, `sla`, `solicitante`), o app quebrou em telas que liam esses dados. Motivo: o `localStorage` tinha objetos salvos antes da mudança.

**Solução:** migração automática no `useEffect` que carrega os dados.

```jsx
const migrarEmail = (email, idx) => ({
  protocolo: email.protocolo || `#2024-${String(123 - idx).padStart(4, '0')}`,
  solicitante: email.solicitante || email.remetente?.split('@')[0],
  prioridade: email.prioridade || 'P3',
  sla: email.sla || '8h',
  respostas: email.respostas || [],
  ...email,
});
```

Cada campo novo recebe um valor derivado se não existir. O spread no fim garante que dados antigos válidos não são sobrescritos.

#### 3. Sincronização de status entre telas

Concluir um alerta no detalhe não atualizava a lista do radar. As telas liam o mesmo dado de fontes diferentes (uma do localStorage, outra da API).

**Solução:** centralizar em um cliente de API único e disparar evento pra telas reagirem.

```js
// api.js
export const api = {
  atualizarStatus: (id, status, controlador) =>
    buscar(`/alertas/${id}/status`, {
      method: 'POST',
      body: JSON.stringify({ status, controlador }),
    }),
};

// Radar.jsx escuta o evento
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

#### 4. Cold start do Render

O backend gratuito dorme após 15 minutos sem acesso. Quando alguém abre o site, a primeira chamada demora 30-50 segundos. Sem aviso, parece que o site quebrou.

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

Persistência em `localStorage` lida **antes** do React montar (no `<head>` do `index.html`), evitando flash de tema errado.

#### 6. Ícones com fallback em cascata

Nem toda tecnologia tem ícone no Devicon. Se faltasse, aparecia imagem quebrada.

**Solução:** 3 níveis de fallback no `TechCard`.

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

O `/relatorios/agregado` precisava calcular quanto tempo cada alerta levou entre detecção e resolução.

**Solução:** parse de datas com formato `%d/%m/%Y %H:%M:%S` e cálculo de delta em segundos.

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

Precisava agregar alertas por hora nas últimas 12 horas, mesmo quando não há alertas em determinada hora.

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
        data_str = alerta.detectadoEm
        dt = datetime.strptime(data_str, "%d/%m/%Y %H:%M:%S")
        for b, h in zip(buckets, doze_horas):
            if (dt.year, dt.month, dt.day, dt.hour) == (h.year, h.month, h.day, h.hour):
                b["alertas"] += 1
                if alerta.severidade == "critico":
                    b["criticos"] += 1
                break

    return buckets
```

### Security

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

#### 11. Escape no MarkdownRenderer (evita XSS)

O renderizador de Markdown injeta HTML com `dangerouslySetInnerHTML`. Se o conteúdo não for escapado, um lab malicioso pode executar script.

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

  // Agora aplica as transformações seguras
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
    return { blocked: true, remaining: Math.ceil((dados.blockedUntil - agora) / 1000) };
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

Durante o desenvolvimento aceita `*`. Em produção, lista explícita.

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

O timeout é alto porque o backend do Render pode demorar pra acordar.

---

## Testes

### Backend

21 testes cobrindo o motor de detecção e a API.

```bash
cd backend
source venv/bin/activate     # ou .\venv\Scripts\Activate.ps1 no Windows
pytest -v
```

**O que cobre:**
- Regra de brute force (dispara com 5+ falhas, não dispara com menos)
- Regra de origem incomum (dispara com país suspeito, ignora país normal)
- Regra de lista negra (gera alerta crítico)
- Não duplicação de alertas entre execuções
- Endpoints da API (resposta 200, formato esperado)
- Retorno 404 em alerta inexistente

### Frontend

23 testes cobrindo funções utilitárias e componentes.

```bash
npm test
```

**O que cobre:**
- `parseDataHora` — conversão de string em Date
- `calcularTempo` — formatação de delta entre duas datas
- `dentroDoPeriodo` — filtros de data (hoje, 7d, 30d)
- `AvisoConexao` — troca de mensagem conforme tempo passa

---

## Como rodar localmente

**Pré-requisitos:** Node.js 18+ e Python 3.12.

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate     # Windows: .\venv\Scripts\Activate.ps1
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

Roda em `http://localhost:5173`. Cria um `.env` na raiz com:

```
VITE_API_URL=http://localhost:8000
```

### Docker (opcional)

```bash
docker compose up
```

---

## Deploy

**Frontend:** Vercel. Detecta o projeto Vite automaticamente. Cada push na `main` rebuilda em ~1 minuto.

**Backend:** Render (free tier). O `Procfile` e o `render.yaml` estão no repositório.

**Variáveis de ambiente em produção:**

- Vercel: `VITE_API_URL=https://torre-de-controle-6ycb.onrender.com`
- Render: `PYTHON_VERSION=3.12.0`

**Cold start:** o backend gratuito dorme após 15 minutos sem acesso. A primeira chamada depois disso demora 30-50 segundos. A faixa de aviso no front cobre isso.

---
## CI/CD

GitHub Actions roda os testes do backend (pytest) e do frontend (vitest) a cada push na `main`. O workflow está em `.github/workflows/tests.yml`.

Os dois jobs rodam em paralelo:
- **Backend (pytest):** 21 testes
- **Frontend (vitest):** 23 testes

O badge no topo mostra o status do último run. Se algum teste falhar, o badge fica vermelho e o commit aparece com ❌ no GitHub.

---

## Referências

- [MITRE ATT&CK](https://attack.mitre.org/) — framework de táticas e técnicas usadas nas regras
- [OWASP Top 10](https://owasp.org/www-project-top-ten/) — base para as decisões de segurança
- [FastAPI](https://fastapi.tiangolo.com/) — framework do backend
- [React](https://react.dev/) — biblioteca do frontend
- [Vite](https://vitejs.dev/) — build tool
- [Recharts](https://recharts.org/) — biblioteca dos gráficos
- [Devicon](https://devicon.dev/) e [Simple Icons](https://simpleicons.org/) — ícones

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

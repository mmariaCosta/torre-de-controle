from collections import Counter
from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .modelos import Alerta, Estatisticas, Voo
from .repositorio import repo


@asynccontextmanager
async def lifespan(app: FastAPI):
    repo.iniciar()
    yield
    repo.parar()


app = FastAPI(
    title="Torre de Controle API",
    description="Backend de simulação de SOC com geração de logs em tempo real",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def raiz():
    return {
        "servico": "Torre de Controle API",
        "versao": "0.1.0",
        "status": "operacional",
    }


@app.get("/health")
def health():
    return {"status": "ok", "hora": datetime.now().isoformat()}


@app.get("/voos", response_model=list[Voo])
def listar_voos(limite: int = 50):
    repo.varrer()
    return repo.gerador.obter_recentes(limite=limite)


@app.get("/alertas", response_model=list[Alerta])
def listar_alertas():
    repo.varrer()
    return repo.listar_para_radar()


@app.get("/historico", response_model=list[Alerta])
def listar_historico():
    repo.varrer()
    return repo.listar_para_historico()


@app.get("/alertas/{alerta_id}", response_model=Alerta)
def obter_alerta(alerta_id: str):
    repo.varrer()
    alerta = repo.detector.buscar_alerta(alerta_id)
    if not alerta:
        raise HTTPException(status_code=404, detail="Alerta não encontrado")
    return alerta


@app.post("/alertas/{alerta_id}/status")
def atualizar_status(alerta_id: str, payload: dict):
    novo_status = payload.get("status")
    controlador = payload.get("controlador", "desconhecido")

    if not novo_status:
        raise HTTPException(status_code=400, detail="Status não informado")

    sucesso = repo.atualizar_status(alerta_id, novo_status, controlador)
    if not sucesso:
        raise HTTPException(status_code=404, detail="Alerta não encontrado")

    return {"ok": True, "alerta_id": alerta_id, "status": novo_status}


@app.get("/stats", response_model=Estatisticas)
def obter_stats():
    repo.varrer()
    dados = repo.gerador.obter_estatisticas()
    return Estatisticas(
        voosMonitorados=dados["voosMonitorados"],
        voosSuspeitos=dados["voosSuspeitos"],
        voosBloqueados=dados["voosBloqueados"],
        alertasPendentes=repo.detector.contar_pendentes(),
        uptime="99.98%",
        ultimaVarredura=repo._ultima_varredura,
    )


# ============================================================
# INVESTIGAÇÃO — busca em logs
# ============================================================
@app.get("/logs/buscar", response_model=list[Voo])
def buscar_logs(tipo: str, valor: str):
    repo.varrer()
    voos = repo.gerador.voos
    valor_lower = valor.lower().strip()

    if not valor_lower:
        return []

    if tipo == "ip":
        return [v for v in voos if valor_lower in v.ip.lower()]

    if tipo == "passageiro":
        return [v for v in voos if valor_lower in v.passageiro.lower()]

    if tipo == "status":
        return [v for v in voos if v.status == valor_lower]

    return []


@app.get("/logs/resumo")
def resumo_logs():
    repo.varrer()
    voos = repo.gerador.voos

    total = len(voos)
    autorizados = sum(1 for v in voos if v.status == "autorizado")
    suspeitos = sum(1 for v in voos if v.status == "suspeito")
    bloqueados = sum(1 for v in voos if v.status == "bloqueado")

    ips = Counter(v.ip for v in voos if v.status != "autorizado")
    top_ips = ips.most_common(3)

    passageiros = Counter(v.passageiro for v in voos if v.status != "autorizado")
    top_passageiros = passageiros.most_common(3)

    return {
        "total": total,
        "autorizados": autorizados,
        "suspeitos": suspeitos,
        "bloqueados": bloqueados,
        "top_ips": [{"ip": ip, "count": c} for ip, c in top_ips],
        "top_passageiros": [{"passageiro": p, "count": c} for p, c in top_passageiros],
    }


@app.get("/logs/ips")
def listar_ips():
    repo.varrer()
    return sorted(set(v.ip for v in repo.gerador.voos))


@app.get("/logs/passageiros")
def listar_passageiros():
    repo.varrer()
    return sorted(set(v.passageiro for v in repo.gerador.voos))

@app.get("/relatorios/agregado")
def relatorios_agregado():
    """Estatísticas consolidadas do histórico de alertas resolvidos."""
    repo.varrer()
    alertas = repo.detector.listar_alertas()
    resolvidos = [a for a in alertas if a.status in ("concluido", "falso_positivo")]

    if not resolvidos:
        return {
            "total": 0,
            "tempoMedio": None,
            "porControlador": [],
            "porSeveridade": [],
            "porCategoria": [],
            "porStatus": [],
        }

    # --- Tempo médio de resposta ---
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

    # --- Por controlador ---
    por_ctrl: dict[str, int] = {}
    for a in resolvidos:
        c = a.resolvidoPor or "desconhecido"
        por_ctrl[c] = por_ctrl.get(c, 0) + 1

    por_controlador = [
        {"controlador": k, "total": v}
        for k, v in sorted(por_ctrl.items(), key=lambda x: -x[1])
    ]

    # --- Por severidade ---
    por_sev: dict[str, int] = {}
    for a in resolvidos:
        por_sev[a.severidade] = por_sev.get(a.severidade, 0) + 1

    ordem_sev = ["critico", "alto", "medio", "baixo"]
    por_severidade = [
        {"severidade": s, "total": por_sev.get(s, 0)}
        for s in ordem_sev
        if por_sev.get(s, 0) > 0
    ]

    # --- Por categoria (regra) ---
    por_cat: dict[str, int] = {}
    for a in resolvidos:
        por_cat[a.regra] = por_cat.get(a.regra, 0) + 1

    por_categoria = [
        {"categoria": k, "total": v}
        for k, v in sorted(por_cat.items(), key=lambda x: -x[1])
    ]

    # --- Por status final ---
    por_status: dict[str, int] = {}
    for a in resolvidos:
        por_status[a.status] = por_status.get(a.status, 0) + 1

    por_status_lista = [
        {"status": k, "total": v}
        for k, v in sorted(por_status.items(), key=lambda x: -x[1])
    ]

    return {
        "total": len(resolvidos),
        "tempoMedio": tempo_medio,
        "porControlador": por_controlador,
        "porSeveridade": por_severidade,
        "porCategoria": por_categoria,
        "porStatus": por_status_lista,
    }

@app.get("/protocolos")
def listar_protocolos():
    """Lista as regras de detecção ativas com estatísticas."""
    repo.varrer()
    todos = repo.detector.listar_alertas()

    defs = [
        {
            "id": "P-001",
            "nome": "Ataque coordenado",
            "descricao": (
                "Detecta múltiplas tentativas de login falhas do mesmo IP em "
                "um curto intervalo. Indica tentativa de força bruta ou "
                "password spraying contra uma conta específica."
            ),
            "regra": "5 ou mais falhas de login do mesmo IP em menos de 2 minutos",
            "tecnica": "T1110.001",
            "tecnicaNome": "Brute Force: Password Guessing",
            "severidade": "alto",
            "categoria": "Credential Access",
            "match": lambda a: a.regra == "Ataque coordenado",
        },
        {
            "id": "P-002",
            "nome": "Origem incomum",
            "descricao": (
                "Detecta login de uma conta a partir de país diferente do "
                "histórico habitual. Pode indicar credencial comprometida "
                "sendo usada por terceiro."
            ),
            "regra": "Login de país sem histórico prévio para o usuário",
            "tecnica": "T1078",
            "tecnicaNome": "Valid Accounts",
            "severidade": "medio",
            "categoria": "Defense Evasion",
            "match": lambda a: a.regra == "Passageiro de origem incomum",
        },
        {
            "id": "P-003",
            "nome": "Origem em lista negra",
            "descricao": (
                "Detecta tentativa de acesso a partir de IP já catalogado em "
                "lista de ameaças conhecidas. Bloqueio aplicado "
                "automaticamente antes mesmo de qualquer autenticação."
            ),
            "regra": "IP de origem presente em lista de ameaças conhecidas",
            "tecnica": "T1078",
            "tecnicaNome": "Valid Accounts",
            "severidade": "critico",
            "categoria": "Initial Access",
            "match": lambda a: a.regra == "Origem suspeita",
        },
    ]

    resultado = []
    for d in defs:
        matches = [a for a in todos if d["match"](a)]
        ultimo = matches[0] if matches else None

        resultado.append({
            "id": d["id"],
            "nome": d["nome"],
            "descricao": d["descricao"],
            "regra": d["regra"],
            "tecnica": d["tecnica"],
            "tecnicaNome": d["tecnicaNome"],
            "severidade": d["severidade"],
            "categoria": d["categoria"],
            "disparos": len(matches),
            "ultimoDisparo": ultimo.detectadoEm if ultimo else None,
        })

    return resultado

@app.get("/stats/grafico")
def stats_grafico():
    """Alertas gerados por hora nas últimas 12 horas."""
    repo.varrer()
    todos = repo.detector.listar_alertas()

    from datetime import datetime, timedelta
    agora = datetime.now()
    doze_horas = [agora - timedelta(hours=i) for i in range(11, -1, -1)]

    # Inicializa buckets (uma posição por hora)
    buckets = []
    for h in doze_horas:
        buckets.append({
            "hora": h.strftime("%H:00"),
            "alertas": 0,
            "criticos": 0,
        })

    # Conta alertas por hora
    for alerta in todos:
        try:
            # formato: "08/10/2026 18:52:26"
            data_str = alerta.detectadoEm
            dt = datetime.strptime(data_str, "%d/%m/%Y %H:%M:%S")

            # Encontra o bucket correspondente
            for b, h in zip(buckets, doze_horas):
                # Se o alerta caiu na mesma hora
                if dt.year == h.year and dt.month == h.month and dt.day == h.day and dt.hour == h.hour:
                    b["alertas"] += 1
                    if alerta.severidade == "critico":
                        b["criticos"] += 1
                    break
        except Exception:
            continue

    return buckets
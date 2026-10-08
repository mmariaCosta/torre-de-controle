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
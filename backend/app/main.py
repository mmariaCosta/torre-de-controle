from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .modelos import Alerta, Estatisticas, Voo
from .repositorio import repo


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Sobe o gerador quando a API inicia
    repo.iniciar()
    yield
    # Para quando a API desligar
    repo.parar()


app = FastAPI(
    title="Torre de Controle API",
    description="Backend de simulação de SOC com geração de logs em tempo real",
    version="0.1.0",
    lifespan=lifespan,
)

# Libera o front para consumir
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # em produção trocar pelo domínio do front
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
    """Últimos voos gerados (mais recentes primeiro)."""
    repo.varrer()
    return repo.gerador.obter_recentes(limite=limite)


@app.get("/alertas", response_model=list[Alerta])
def listar_alertas():
    """Todos os alertas ativos."""
    repo.varrer()
    return repo.detector.listar_alertas()


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
    if not novo_status:
        raise HTTPException(status_code=400, detail="Status não informado")

    sucesso = repo.atualizar_status(alerta_id, novo_status)
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
@app.post("/alertas/reset")
def resetar_alertas():
    """Limpa todos os alertas. Útil para reiniciar a demonstração."""
    repo.detector.alertas.clear()
    return {"ok": True, "mensagem": "Alertas reiniciados"}
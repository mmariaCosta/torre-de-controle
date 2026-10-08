from pydantic import BaseModel
from typing import Optional


class Voo(BaseModel):
    id: str
    hora: str
    passageiro: str
    origem: str
    destino: str
    ip: str
    status: str
    motivo: str
    tecnica: Optional[str] = None


class EventoAlerta(BaseModel):
    id: str
    hora: str
    acao: str
    ip: str


class Alerta(BaseModel):
    id: str
    titulo: str
    severidade: str
    status: str
    tecnica: str
    tecnicaNome: str
    passageiro: str
    origem: str
    destino: str
    detectadoEm: str
    regra: str
    descricao: str
    recomendacoes: list[str]
    voos: list[EventoAlerta]
    resolvidoEm: Optional[str] = None
    resolvidoPor: Optional[str] = None


class Estatisticas(BaseModel):
    voosMonitorados: int
    voosSuspeitos: int
    voosBloqueados: int
    alertasPendentes: int
    uptime: str
    ultimaVarredura: str
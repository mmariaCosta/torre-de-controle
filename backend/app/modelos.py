from pydantic import BaseModel
from typing import Optional


class Voo(BaseModel):
    """Um voo é uma tentativa de acesso ao sistema."""
    id: str
    hora: str
    passageiro: str
    origem: str
    destino: str
    ip: str
    status: str            # autorizado | suspeito | bloqueado
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
    severidade: str        # critico | alto | medio | baixo
    status: str            # aberto | investigando | escalado | concluido | falso_positivo
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


class Estatisticas(BaseModel):
    voosMonitorados: int
    voosSuspeitos: int
    voosBloqueados: int
    alertasPendentes: int
    uptime: str
    ultimaVarredura: str
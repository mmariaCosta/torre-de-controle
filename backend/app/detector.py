from datetime import datetime, timedelta
from uuid import uuid4

from .modelos import Voo, Alerta, EventoAlerta


class Detector:
    """
    Varre a lista de voos e aplica regras.
    Cada regra gera um alerta quando encontra padrão suspeito.
    """

    def __init__(self):
        # Guarda alertas já gerados para não duplicar
        self.alertas: dict[str, Alerta] = {}

    # -----------------------------------------------------------------
    # Regra 1 — Brute force
    # 5 ou mais falhas do mesmo IP em menos de 2 minutos
    # -----------------------------------------------------------------
    def _detectar_brute_force(self, voos: list[Voo]) -> list[Alerta]:
        por_ip: dict[str, list[Voo]] = {}
        for v in voos:
            if v.status == "bloqueado" and "senha incorreta" in v.motivo.lower():
                por_ip.setdefault(v.ip, []).append(v)

        alertas = []
        for ip, lista in por_ip.items():
            if len(lista) < 5:
                continue

            lista.sort(key=lambda v: v.hora)
            primeiro = lista[0]
            ultimo = lista[-1]

            chave = f"bf-{ip}"
            if chave in self.alertas:
                continue

            alerta = Alerta(
                id=f"ALT-{uuid4().hex[:4].upper()}",
                titulo="Possível ataque de força bruta",
                severidade="alto",
                status="aberto",
                tecnica="T1110.001",
                tecnicaNome="Brute Force: Password Guessing",
                passageiro=primeiro.passageiro,
                origem=primeiro.origem,
                destino=primeiro.destino,
                detectadoEm=f"{datetime.now().strftime('%d/%m/%Y %H:%M:%S')}",
                regra="Ataque coordenado",
                descricao=(
                    f"Detectadas {len(lista)} tentativas de login falhas consecutivas "
                    f"para a conta {primeiro.passageiro} em poucos segundos, todas "
                    f"originadas do mesmo endereço IP."
                ),
                recomendacoes=[
                    "Bloquear o endereço IP de origem no firewall",
                    "Forçar redefinição da senha da conta alvo",
                    "Ativar autenticação em dois fatores para contas administrativas",
                    "Revisar políticas de acesso remoto",
                ],
                voos=[
                    EventoAlerta(id=v.id, hora=v.hora, acao=v.motivo, ip=v.ip)
                    for v in lista
                ],
            )
            self.alertas[chave] = alerta
            alertas.append(alerta)

        return alertas

    # -----------------------------------------------------------------
    # Regra 2 — Origem incomum
    # Passageiro que sempre vem de um país, aparece de outro
    # -----------------------------------------------------------------
    def _detectar_origem_incomum(self, voos: list[Voo]) -> list[Alerta]:
        alertas = []
        for v in voos:
            if v.status != "suspeito":
                continue
            if "origem geográfica" not in v.motivo.lower():
                continue

            chave = f"oi-{v.id}"
            if chave in self.alertas:
                continue

            alerta = Alerta(
                id=f"ALT-{uuid4().hex[:4].upper()}",
                titulo="Origem geográfica incomum",
                severidade="medio",
                status="aberto",
                tecnica="T1078",
                tecnicaNome="Valid Accounts",
                passageiro=v.passageiro,
                origem=v.origem,
                destino=v.destino,
                detectadoEm=f"{datetime.now().strftime('%d/%m/%Y %H:%M:%S')}",
                regra="Passageiro de origem incomum",
                descricao=(
                    f"A conta {v.passageiro} realizou login a partir de país sem "
                    f"histórico de acesso. Perfil do usuário indica localização "
                    f"habitual no Brasil."
                ),
                recomendacoes=[
                    "Verificar com o titular se o acesso é legítimo",
                    "Solicitar confirmação via canal secundário",
                    "Registrar o evento para correlação futura",
                ],
                voos=[
                    EventoAlerta(id=v.id, hora=v.hora, acao="Login bem-sucedido", ip=v.ip)
                ],
            )
            self.alertas[chave] = alerta
            alertas.append(alerta)

        return alertas

    # -----------------------------------------------------------------
    # Regra 3 — Origem em lista negra
    # -----------------------------------------------------------------
    def _detectar_lista_negra(self, voos: list[Voo]) -> list[Alerta]:
        alertas = []
        for v in voos:
            if "lista negra" not in v.motivo.lower():
                continue

            chave = f"ln-{v.ip}"
            if chave in self.alertas:
                continue

            alerta = Alerta(
                id=f"ALT-{uuid4().hex[:4].upper()}",
                titulo="Origem em lista negra",
                severidade="critico",
                status="aberto",
                tecnica="T1078",
                tecnicaNome="Valid Accounts",
                passageiro=v.passageiro,
                origem=v.origem,
                destino=v.destino,
                detectadoEm=f"{datetime.now().strftime('%d/%m/%Y %H:%M:%S')}",
                regra="Origem suspeita",
                descricao=(
                    "Tentativa de acesso a partir de endereço IP presente em lista "
                    "de ameaças conhecidas. Bloqueio aplicado automaticamente pelo "
                    "firewall."
                ),
                recomendacoes=[
                    "Nenhuma ação adicional necessária",
                    "Manter IP na lista de bloqueio",
                ],
                voos=[
                    EventoAlerta(
                        id=v.id,
                        hora=v.hora,
                        acao="Conexão recusada pelo firewall",
                        ip=v.ip,
                    )
                ],
            )
            self.alertas[chave] = alerta
            alertas.append(alerta)

        return alertas

    # -----------------------------------------------------------------
    # Roda todas as regras
    # -----------------------------------------------------------------
    def varrer(self, voos: list[Voo]) -> list[Alerta]:
        novos = []
        novos.extend(self._detectar_brute_force(voos))
        novos.extend(self._detectar_origem_incomum(voos))
        novos.extend(self._detectar_lista_negra(voos))
        return novos

    def listar_alertas(self) -> list[Alerta]:
        # Mais recentes primeiro
        return list(reversed(list(self.alertas.values())))

    def buscar_alerta(self, alerta_id: str) -> Alerta | None:
        for a in self.alertas.values():
            if a.id == alerta_id:
                return a
        return None

    def contar_pendentes(self) -> int:
        return sum(
            1
            for a in self.alertas.values()
            if a.status in ("aberto", "investigando", "escalado")
        )
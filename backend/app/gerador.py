import random
import threading
import time
from datetime import datetime
from uuid import uuid4

from .modelos import Voo


PASSAGEIROS_NORMAIS = [
    "joao.silva", "maria.souza", "carlos.mendes", "ana.paula",
    "fernanda.lima", "lucas.rocha", "juliana.costa", "pedro.santos",
    "camila.oliveira", "roberto.alves",
]

PASSAGEIROS_SUSPEITOS = ["root", "admin", "test", "suporte01", "administrator"]

PAISES_NORMAIS = ["Brasil (BR)", "Brasil (BR)", "Brasil (BR)", "Brasil (BR)", "EUA (US)"]
PAISES_SUSPEITOS = ["Rússia (RU)", "China (CN)", "Coreia do Norte (KP)", "Irã (IR)"]

DESTINOS = [
    "Servidor de Produção",
    "Portal Financeiro",
    "Portal Fiscal",
    "Painel Admin",
    "Banco de Clientes",
]

TECNICAS = {
    "brute_force": "T1110.001",
    "origem_incomum": "T1078",
    "fora_horario": "T1078",
    "lista_negra": "T1078",
}


class Gerador:
    """
    Roda em thread separada. A cada intervalo, gera um voo novo.
    A cada N voos, planta uma anomalia (para o detector encontrar).
    """

    def __init__(self, intervalo_segundos: float = 3.0):
        self.intervalo = intervalo_segundos
        self.voos: list[Voo] = []
        self._parar = False
        self._thread: threading.Thread | None = None
        self._contador = 0
        self._lock = threading.Lock()

    def _hora_atual(self) -> str:
        return datetime.now().strftime("%H:%M:%S")

    def _gerar_voo_normal(self) -> Voo:
        return Voo(
            id=f"VG-{uuid4().hex[:6].upper()}",
            hora=self._hora_atual(),
            passageiro=random.choice(PASSAGEIROS_NORMAIS),
            origem=random.choice(PAISES_NORMAIS),
            destino=random.choice(DESTINOS),
            ip=f"191.{random.randint(1, 254)}.{random.randint(1, 254)}.{random.randint(1, 254)}",
            status="autorizado",
            motivo="Acesso normal",
        )

    def _gerar_brute_force(self) -> list[Voo]:
        """Gera 6 tentativas falhas do mesmo IP em poucos segundos."""
        passageiro = random.choice(PASSAGEIROS_SUSPEITOS)
        ip = f"185.220.101.{random.randint(1, 254)}"
        pais = random.choice(PAISES_SUSPEITOS)

        return [
            Voo(
                id=f"VG-{uuid4().hex[:6].upper()}",
                hora=self._hora_atual(),
                passageiro=passageiro,
                origem=pais,
                destino="Servidor de Produção",
                ip=ip,
                status="bloqueado",
                motivo="Login falhou (senha incorreta)",
                tecnica=TECNICAS["brute_force"],
            )
            for _ in range(6)
        ]

    def _gerar_origem_incomum(self) -> Voo:
        return Voo(
            id=f"VG-{uuid4().hex[:6].upper()}",
            hora=self._hora_atual(),
            passageiro=random.choice(PASSAGEIROS_SUSPEITOS),
            origem=random.choice(PAISES_SUSPEITOS),
            destino=random.choice(DESTINOS),
            ip=f"103.{random.randint(1, 254)}.{random.randint(1, 254)}.{random.randint(1, 254)}",
            status="suspeito",
            motivo="Origem geográfica incomum",
            tecnica=TECNICAS["origem_incomum"],
        )

    def _gerar_lista_negra(self) -> Voo:
        return Voo(
            id=f"VG-{uuid4().hex[:6].upper()}",
            hora=self._hora_atual(),
            passageiro="test",
            origem="Coreia do Norte (KP)",
            destino="Servidor de Produção",
            ip="175.45.176.99",
            status="bloqueado",
            motivo="Origem em lista negra",
            tecnica=TECNICAS["lista_negra"],
        )

    def _loop(self):
        while not self._parar:
            self._contador += 1

            # A cada 15 voos, planta uma anomalia diferente
            if self._contador % 15 == 0:
                novos = self._gerar_brute_force()
            elif self._contador % 11 == 0:
                novos = [self._gerar_origem_incomum()]
            elif self._contador % 7 == 0:
                novos = [self._gerar_lista_negra()]
            else:
                novos = [self._gerar_voo_normal()]

            with self._lock:
                self.voos.extend(novos)
                # Mantém no máximo 200 voos na memória
                if len(self.voos) > 200:
                    self.voos = self.voos[-200:]

            time.sleep(self.intervalo)

    def iniciar(self):
        self._thread = threading.Thread(target=self._loop, daemon=True)
        self._thread.start()

    def parar(self):
        self._parar = True
        if self._thread:
            self._thread.join(timeout=2)

    def obter_recentes(self, limite: int = 50) -> list[Voo]:
        with self._lock:
            return list(reversed(self.voos[-limite:]))

    def obter_estatisticas(self) -> dict:
        with self._lock:
            total = len(self.voos)
            suspeitos = sum(1 for v in self.voos if v.status == "suspeito")
            bloqueados = sum(1 for v in self.voos if v.status == "bloqueado")
        return {
            "voosMonitorados": total,
            "voosSuspeitos": suspeitos,
            "voosBloqueados": bloqueados,
        }
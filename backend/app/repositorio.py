from .detector import Detector
from .gerador import Gerador


class Repositorio:
    """
    Estado global do backend.
    Gerador roda em paralelo, Detector varre o que o gerador produz.
    """

    def __init__(self):
        self.gerador = Gerador(intervalo_segundos=3.0)
        self.detector = Detector()
        self._ultima_varredura: str = "--:--:--"

    def iniciar(self):
        self.gerador.iniciar()

    def parar(self):
        self.gerador.parar()

    def varrer(self):
        """Chamado periodicamente pela API para rodar as regras."""
        from datetime import datetime

        voos = self.gerador.voos
        self.detector.varrer(voos)
        self._ultima_varredura = datetime.now().strftime("%H:%M:%S")

    def atualizar_status(self, alerta_id: str, novo_status: str) -> bool:
        alerta = self.detector.buscar_alerta(alerta_id)
        if not alerta:
            return False
        alerta.status = novo_status
        return True


# Instância única (singleton)
repo = Repositorio()
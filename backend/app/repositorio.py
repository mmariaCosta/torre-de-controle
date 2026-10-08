from datetime import datetime

from .detector import Detector
from .gerador import Gerador


STATUS_FINAIS = ("concluido", "falso_positivo")


class Repositorio:
    def __init__(self):
        self.gerador = Gerador(intervalo_segundos=3.0)
        self.detector = Detector()
        self._ultima_varredura: str = "--:--:--"

    def iniciar(self):
        self.gerador.iniciar()

    def parar(self):
        self.gerador.parar()

    def varrer(self):
        voos = self.gerador.voos
        self.detector.varrer(voos)
        self._ultima_varredura = datetime.now().strftime("%H:%M:%S")

    def atualizar_status(self, alerta_id: str, novo_status: str, controlador: str = "desconhecido") -> bool:
        alerta = self.detector.buscar_alerta(alerta_id)
        if not alerta:
            return False

        alerta.status = novo_status

        if novo_status in STATUS_FINAIS:
            alerta.resolvidoEm = datetime.now().strftime("%d/%m/%Y %H:%M:%S")
            alerta.resolvidoPor = controlador

        return True

    def listar_para_radar(self):
        todos = self.detector.listar_alertas()
        return [a for a in todos if a.status not in STATUS_FINAIS]

    def listar_para_historico(self):
        todos = self.detector.listar_alertas()
        return [a for a in todos if a.status in STATUS_FINAIS]


repo = Repositorio()
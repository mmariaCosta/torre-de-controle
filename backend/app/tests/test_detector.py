"""
Testes do motor de detecção.
Verifica se as 3 regras estão funcionando corretamente.
"""
from app.detector import Detector
from app.modelos import Voo


def criar_voo(id_, hora, passageiro, ip, status, motivo, origem="Brasil (BR)", tecnica=None):
    """Helper pra não repetir código criando voos falsos."""
    return Voo(
        id=id_,
        hora=hora,
        passageiro=passageiro,
        origem=origem,
        destino="Servidor de Produção",
        ip=ip,
        status=status,
        motivo=motivo,
        tecnica=tecnica,
    )


# ============================================================
# Regra 1 — Brute Force
# ============================================================
def test_brute_force_gera_alerta():
    """5+ falhas do mesmo IP devem gerar um alerta."""
    detector = Detector()
    ip = "185.220.101.42"

    voos = [
        criar_voo(f"VG-{i}", "14:32:00", "root", ip, "bloqueado", "Login falhou (senha incorreta)")
        for i in range(6)
    ]

    alertas = detector.varrer(voos)

    assert len(alertas) >= 1

    alerta = alertas[0]
    assert alerta.tecnica == "T1110.001"
    assert alerta.severidade == "alto"
    assert alerta.passageiro == "root"
    assert len(alerta.voos) == 6


def test_menos_de_5_falhas_nao_gera_alerta():
    """4 falhas do mesmo IP não disparam a regra."""
    detector = Detector()
    ip = "185.220.101.42"

    voos = [
        criar_voo(f"VG-{i}", "14:32:00", "root", ip, "bloqueado", "Login falhou (senha incorreta)")
        for i in range(4)
    ]

    alertas = detector.varrer(voos)

    assert len(alertas) == 0


def test_brute_force_de_ips_diferentes_nao_agrupa():
    """Falhas de IPs diferentes não somam."""
    detector = Detector()

    voos = [
        criar_voo(f"VG-{i}", "14:32:00", "root", f"185.220.101.{i}", "bloqueado", "Login falhou (senha incorreta)")
        for i in range(10)
    ]

    alertas = detector.varrer(voos)

    # Cada IP tem só 1 falha, então nenhum agrupa
    assert len(alertas) == 0


# ============================================================
# Regra 2 — Origem incomum
# ============================================================
def test_origem_incomum_gera_alerta():
    """Login de país suspeito deve gerar alerta."""
    detector = Detector()

    voos = [
        criar_voo(
            "VG-1",
            "14:32:00",
            "admin",
            "103.27.185.11",
            "suspeito",
            "Origem geográfica incomum",
            origem="China (CN)",
        )
    ]

    alertas = detector.varrer(voos)

    assert len(alertas) == 1
    assert alertas[0].tecnica == "T1078"
    assert alertas[0].severidade == "medio"
    assert alertas[0].passageiro == "admin"


def test_origem_normal_nao_gera_alerta():
    """Voo autorizado de país normal não dispara regra."""
    detector = Detector()

    voos = [
        criar_voo(
            "VG-1",
            "14:32:00",
            "joao.silva",
            "191.54.72.12",
            "autorizado",
            "Acesso normal",
            origem="Brasil (BR)",
        )
    ]

    alertas = detector.varrer(voos)

    assert len(alertas) == 0


# ============================================================
# Regra 3 — Lista negra
# ============================================================
def test_lista_negra_gera_alerta_critico():
    """IP em lista negra gera alerta crítico."""
    detector = Detector()

    voos = [
        criar_voo(
            "VG-1",
            "14:32:00",
            "test",
            "175.45.176.99",
            "bloqueado",
            "Origem em lista negra",
            origem="Coreia do Norte (KP)",
        )
    ]

    alertas = detector.varrer(voos)

    assert len(alertas) == 1
    assert alertas[0].severidade == "critico"
    assert alertas[0].tecnica == "T1078"
    assert alertas[0].passageiro == "test"


# ============================================================
# Comportamento geral
# ============================================================
def test_detector_nao_duplica_alertas():
    """Varrer duas vezes os mesmos voos não deve criar alertas duplicados."""
    detector = Detector()
    ip = "185.220.101.42"

    voos = [
        criar_voo(f"VG-{i}", "14:32:00", "root", ip, "bloqueado", "Login falhou (senha incorreta)")
        for i in range(6)
    ]

    detector.varrer(voos)
    detector.varrer(voos)

    # Mesmo varrendo 2x, só existe 1 alerta de brute force pra esse IP
    todos = detector.listar_alertas()
    brute_force = [a for a in todos if a.tecnica == "T1110.001"]

    assert len(brute_force) == 1


def test_listar_alertas_vazio_no_inicio():
    """Detector novo não tem alertas."""
    detector = Detector()

    assert detector.listar_alertas() == []


def test_contar_pendentes():
    """Alertas abertos contam como pendentes."""
    detector = Detector()

    voos = [
        criar_voo(
            "VG-1",
            "14:32:00",
            "test",
            "175.45.176.99",
            "bloqueado",
            "Origem em lista negra",
        )
    ]

    detector.varrer(voos)

    assert detector.contar_pendentes() == 1
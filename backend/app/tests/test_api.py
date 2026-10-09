"""
Testes dos endpoints da API.
Usa o TestClient do FastAPI (não precisa subir o servidor).
"""
from fastapi.testclient import TestClient
from app.main import app


client = TestClient(app)


def test_rota_raiz():
    """GET / deve retornar status operacional."""
    resposta = client.get("/")

    assert resposta.status_code == 200
    dados = resposta.json()
    assert dados["status"] == "operacional"
    assert "servico" in dados


def test_health_check():
    """GET /health deve confirmar que o servidor está vivo."""
    resposta = client.get("/health")

    assert resposta.status_code == 200
    dados = resposta.json()
    assert dados["status"] == "ok"
    assert "hora" in dados


def test_listar_voos_retorna_lista():
    """GET /voos deve retornar uma lista (mesmo vazia)."""
    resposta = client.get("/voos")

    assert resposta.status_code == 200
    dados = resposta.json()
    assert isinstance(dados, list)


def test_listar_alertas_retorna_lista():
    """GET /alertas deve retornar uma lista."""
    resposta = client.get("/alertas")

    assert resposta.status_code == 200
    dados = resposta.json()
    assert isinstance(dados, list)


def test_listar_historico_retorna_lista():
    """GET /historico deve retornar uma lista."""
    resposta = client.get("/historico")

    assert resposta.status_code == 200
    dados = resposta.json()
    assert isinstance(dados, list)


def test_stats_tem_campos_esperados():
    """GET /stats deve ter os 4 contadores e uptime."""
    resposta = client.get("/stats")

    assert resposta.status_code == 200
    dados = resposta.json()

    assert "voosMonitorados" in dados
    assert "voosSuspeitos" in dados
    assert "voosBloqueados" in dados
    assert "alertasPendentes" in dados
    assert "uptime" in dados
    assert "ultimaVarredura" in dados


def test_obter_alerta_inexistente_retorna_404():
    """GET /alertas/XXX com ID inválido deve dar 404."""
    resposta = client.get("/alertas/ALT-NAOEXISTE")

    assert resposta.status_code == 404


def test_buscar_logs_por_status():
    """GET /logs/buscar?tipo=status deve retornar lista."""
    resposta = client.get("/logs/buscar?tipo=status&valor=autorizado")

    assert resposta.status_code == 200
    dados = resposta.json()
    assert isinstance(dados, list)


def test_resumo_logs_tem_campos_esperados():
    """GET /logs/resumo deve ter os contadores."""
    resposta = client.get("/logs/resumo")

    assert resposta.status_code == 200
    dados = resposta.json()

    assert "total" in dados
    assert "autorizados" in dados
    assert "suspeitos" in dados
    assert "bloqueados" in dados


def test_grafico_retorna_12_buckets():
    """GET /stats/grafico deve retornar 12 posições (12 horas)."""
    resposta = client.get("/stats/grafico")

    assert resposta.status_code == 200
    dados = resposta.json()

    assert isinstance(dados, list)
    assert len(dados) == 12
    assert "hora" in dados[0]
    assert "alertas" in dados[0]
    assert "criticos" in dados[0]


def test_relatorio_agregado_tem_campos():
    """GET /relatorios/agregado deve ter os blocos esperados."""
    resposta = client.get("/relatorios/agregado")

    assert resposta.status_code == 200
    dados = resposta.json()

    assert "total" in dados
    assert "porControlador" in dados
    assert "porSeveridade" in dados
    assert "porCategoria" in dados
    assert "porStatus" in dados


def test_protocolos_retorna_3_regras():
    """GET /protocolos deve retornar 3 protocolos."""
    resposta = client.get("/protocolos")

    assert resposta.status_code == 200
    dados = resposta.json()

    assert isinstance(dados, list)
    assert len(dados) == 3

    # Confirma que cada protocolo tem os campos esperados
    for p in dados:
        assert "id" in p
        assert "nome" in p
        assert "tecnica" in p
        assert "disparos" in p
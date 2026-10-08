import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import AppHeader from '../components/AppHeader';
import { api } from '../utils/api';
import { labels } from '../utils/dados';

export default function VooDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [alerta, setAlerta] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Busca o alerta na API
  useEffect(() => {
    let ativo = true;

    const carregar = async () => {
      console.log('[VooDetalhe] Buscando alerta:', id);
      setCarregando(true);

      try {
        const dados = await api.obterAlerta(id);
        console.log('[VooDetalhe] Alerta recebido:', dados);
        if (!ativo) return;
        setAlerta(dados);
        setErro(null);
      } catch (e) {
        console.error('[VooDetalhe] Erro ao buscar:', e);
        if (!ativo) return;
        setErro('Alerta não encontrado');
      } finally {
        if (ativo) setCarregando(false);
      }
    };

    carregar();
    return () => { ativo = false; };
  }, [id]);

  const handleAcao = async (acao) => {
    if (!alerta) return;

    const mapa = {
      investigar: { novoStatus: 'investigando', mensagem: 'Alerta movido para "Investigando".' },
      falso:      { novoStatus: 'falso_positivo', mensagem: 'Alerta classificado como falso positivo.' },
      escalar:    { novoStatus: 'escalado', mensagem: 'Alerta escalado para o nível superior.' },
      concluir:   { novoStatus: 'concluido', mensagem: 'Alerta concluído e arquivado.' },
    };

    const cfg = mapa[acao];
    if (!cfg) return;

    try {
      await api.atualizarStatus(alerta.id, cfg.novoStatus);
      setAlerta({ ...alerta, status: cfg.novoStatus });
      setFeedback(cfg.mensagem);
      setTimeout(() => setFeedback(null), 2600);
    } catch {
      setFeedback('Não foi possível atualizar o status. Tente novamente.');
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const irParaRelatorio = () => {
    navigate(`/radar/${id}/relatorio`);
  };

  // Estado de carregamento
  if (carregando) {
    return (
      <div className="app-shell">
        <AppHeader />
        <main className="voo-detalhe">
          <div className="voo-carregando">
            <div className="radar-loading-icon"></div>
            <p>Consultando o radar…</p>
          </div>
        </main>
      </div>
    );
  }

  // Estado de erro
  if (erro || !alerta) {
    return (
      <div className="app-shell">
        <AppHeader />
        <main className="voo-detalhe">
          <div className="voo-404">
            <h1>Alerta não encontrado</h1>
            <p>
              O identificador <span className="mono">{id}</span> não existe no radar.
            </p>
            <button className="btn-voltar" onClick={() => navigate('/radar')}>
              Voltar para o radar
            </button>
          </div>
        </main>
      </div>
    );
  }

  const statusAtual = alerta.status;

  return (
    <div className="app-shell">
      <AppHeader />

      <main className="voo-detalhe">

        <button className="btn-voltar-topo" onClick={() => navigate('/radar')}>
          <span className="btn-voltar-seta"></span> Voltar ao radar
        </button>

        <div className="voo-detalhe-head">
          <div className="voo-detalhe-meta">
            <span className="voo-detalhe-id mono">{alerta.id}</span>
            <span className={`radar-sev radar-sev-${alerta.severidade}`}>
              {labels.severidade[alerta.severidade]}
            </span>
            <span className={`radar-status radar-status-${statusAtual}`}>
              {labels.status[statusAtual] || statusAtual}
            </span>
          </div>

          <h1 className="voo-detalhe-titulo">{alerta.titulo}</h1>
          <p className="voo-detalhe-sub">{alerta.descricao}</p>
        </div>

        <div className="voo-detalhe-metabar">
          <div className="voo-detalhe-campo">
            <span className="voo-detalhe-lbl">Técnica MITRE</span>
            <span className="voo-detalhe-val mono">{alerta.tecnica}</span>
            <span className="voo-detalhe-nome">{alerta.tecnicaNome}</span>
          </div>

          <div className="voo-detalhe-campo">
            <span className="voo-detalhe-lbl">Passageiro</span>
            <span className="voo-detalhe-val">{alerta.passageiro}</span>
          </div>

          <div className="voo-detalhe-campo">
            <span className="voo-detalhe-lbl">Origem</span>
            <span className="voo-detalhe-val">{alerta.origem}</span>
          </div>

          <div className="voo-detalhe-campo">
            <span className="voo-detalhe-lbl">Destino</span>
            <span className="voo-detalhe-val">{alerta.destino}</span>
          </div>

          <div className="voo-detalhe-campo">
            <span className="voo-detalhe-lbl">Detectado em</span>
            <span className="voo-detalhe-val mono">{alerta.detectadoEm}</span>
          </div>

          <div className="voo-detalhe-campo">
            <span className="voo-detalhe-lbl">Regra disparada</span>
            <span className="voo-detalhe-val">{alerta.regra}</span>
          </div>
        </div>

        <div className="voo-detalhe-grid">
          <section className="voo-panel">
            <div className="voo-panel-head">
              <h2>Voos relacionados</h2>
              <span className="voo-panel-sub">{alerta.voos.length} eventos</span>
            </div>

            <div className="voo-timeline">
              {alerta.voos.map((voo, i) => (
                <div key={voo.id} className="voo-evento">
                  <div className="voo-evento-marcador">
                    <span className="voo-evento-dot"></span>
                    {i < alerta.voos.length - 1 && <span className="voo-evento-linha"></span>}
                  </div>
                  <div className="voo-evento-corpo">
                    <div className="voo-evento-top">
                      <span className="voo-evento-hora mono">{voo.hora}</span>
                      <span className="voo-evento-id mono">{voo.id}</span>
                    </div>
                    <div className="voo-evento-acao">{voo.acao}</div>
                    <div className="voo-evento-ip mono">IP: {voo.ip}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="voo-panel">
            <div className="voo-panel-head">
              <h2>Recomendações da torre</h2>
            </div>

            <ol className="voo-recomendacoes">
              {alerta.recomendacoes.map((rec, i) => (
                <li key={i} className="voo-recomendacao">
                  <span className="voo-recomendacao-num mono">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="voo-recomendacao-texto">{rec}</span>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <div className="voo-acoes">
          <div className="voo-acoes-grupo">
            <button
              type="button"
              className={`voo-acao voo-acao-sec ${statusAtual === 'investigando' ? 'voo-acao-ativo' : ''}`}
              onClick={() => handleAcao('investigar')}
              disabled={statusAtual === 'investigando' || statusAtual === 'concluido'}
            >
              {statusAtual === 'investigando' ? '✓ Em investigação' : 'Marcar em investigação'}
            </button>

            <button
              type="button"
              className={`voo-acao voo-acao-sec ${statusAtual === 'falso_positivo' ? 'voo-acao-ativo' : ''}`}
              onClick={() => handleAcao('falso')}
              disabled={statusAtual === 'falso_positivo' || statusAtual === 'concluido'}
            >
              {statusAtual === 'falso_positivo' ? '✓ Falso positivo' : 'Falso positivo'}
            </button>

            <button
              type="button"
              className={`voo-acao voo-acao-warn ${statusAtual === 'escalado' ? 'voo-acao-ativo' : ''}`}
              onClick={() => handleAcao('escalar')}
              disabled={statusAtual === 'escalado' || statusAtual === 'concluido'}
            >
              {statusAtual === 'escalado' ? '✓ Escalado' : 'Escalar'}
            </button>

            <button
              type="button"
              className={`voo-acao voo-acao-ok ${statusAtual === 'concluido' ? 'voo-acao-ativo' : ''}`}
              onClick={() => handleAcao('concluir')}
              disabled={statusAtual === 'concluido'}
            >
              {statusAtual === 'concluido' ? '✓ Concluído' : 'Concluir'}
            </button>
          </div>

          <button
            type="button"
            className="voo-acao voo-acao-primary"
            onClick={irParaRelatorio}
          >
            Emitir relatório do alerta
          </button>
        </div>

      </main>

      {feedback && (
        <div className="voo-toast" role="status">
          <span className="voo-toast-dot"></span>
          {feedback}
        </div>
      )}
    </div>
  );
}
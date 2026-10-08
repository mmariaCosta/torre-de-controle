import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import { api } from '../utils/api';
import { labels } from '../utils/dados';
import AvisoConexao from '../components/AvisoConexao';

const SEVERIDADES = [
  { valor: 'todas', label: 'Todas' },
  { valor: 'critico', label: 'Crítico' },
  { valor: 'alto', label: 'Alto' },
  { valor: 'medio', label: 'Médio' },
  { valor: 'baixo', label: 'Baixo' },
];

const STATUSES = [
  { valor: 'todos', label: 'Todos' },
  { valor: 'aberto', label: 'Abertos' },
  { valor: 'investigando', label: 'Investigando' },
  { valor: 'escalado', label: 'Escalados' },
  { valor: 'falso_positivo', label: 'Falsos positivos' },
  { valor: 'concluido', label: 'Concluídos' },
];

export default function Radar() {
  const navigate = useNavigate();
  const [filtroSev, setFiltroSev] = useState('todas');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [lista, setLista] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [apiOnline, setApiOnline] = useState(false);

  // Busca alertas da API com polling
  useEffect(() => {
    let ativo = true;

    const carregar = async () => {
      console.log('[Radar] Buscando alertas...');
      try {
        const dados = await api.listarAlertas();
        console.log('[Radar] Recebi:', dados.length, 'alertas');
        if (!ativo) return;
        setLista(dados);
        setApiOnline(true);
      } catch (erro) {
        console.error('[Radar] Erro:', erro);
        if (ativo) setApiOnline(false);
      } finally {
        console.log('[Radar] Finalizando carregamento');
        if (ativo) setCarregando(false);
      }
    };

    carregar();
    const timer = setInterval(carregar, 5000);

    return () => {
      ativo = false;
      clearInterval(timer);
    };
  }, []);

  const listaFiltrada = lista.filter((a) => {
    if (filtroSev !== 'todas' && a.severidade !== filtroSev) return false;
    if (filtroStatus !== 'todos' && a.status !== filtroStatus) return false;
    return true;
  });

  const abrirDetalhe = (id) => {
    navigate(`/radar/${id}`);
  };

  const resetar = async () => {
    if (!confirm('Reiniciar todos os alertas? O estado volta ao original.')) return;
    try {
      await api.resetarAlertas();
      const dados = await api.listarAlertas();
      setLista(dados);
    } catch {
      // silencioso
    }
  };

  const totalResolvidos = lista.filter(
    (a) => a.status === 'concluido' || a.status === 'falso_positivo'
  ).length;

  return (
    <div className="app-shell">
      <AppHeader />
      <AvisoConexao ativo={!apiOnline && !carregando} />

      <main className="radar">
        <div className="radar-head">
          <div className="radar-head-top">
            <div className="radar-meta">
              <span className={`radar-meta-item ${apiOnline ? '' : 'offline'}`}>
                <span className="radar-meta-dot"></span>
                {apiOnline ? 'Varredura ativa' : 'Modo offline'}
              </span>
              <span className="radar-meta-sep">/</span>
              <span>
                {carregando
                  ? 'Carregando alertas…'
                  : `${listaFiltrada.length} de ${lista.length} alertas`}
              </span>
            </div>

            {!carregando && totalResolvidos > 0 && (
              <button
                type="button"
                className="radar-reset"
                onClick={resetar}
                title="Voltar todos os alertas ao estado original"
              >
                Reiniciar status
              </button>
            )}
          </div>

          <h1 className="radar-title">
            Radar de <em>alertas.</em>
          </h1>
          <p className="radar-sub">
            Cada alerta representa um voo suspeito detectado pelas regras do sistema.
            Clique em um alerta para investigar, classificar ou emitir relatório.
          </p>
        </div>

        <div className="radar-filtros" data-tour="radar-filtros">
          <div className="radar-filtro-grupo">
            <div className="radar-filtro-lbl">Severidade</div>
            <div className="radar-filtro-opcoes">
              {SEVERIDADES.map((s) => (
                <button
                  key={s.valor}
                  type="button"
                  className={`radar-chip ${filtroSev === s.valor ? 'active' : ''}`}
                  onClick={() => setFiltroSev(s.valor)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="radar-filtro-grupo">
            <div className="radar-filtro-lbl">Status</div>
            <div className="radar-filtro-opcoes">
              {STATUSES.map((s) => (
                <button
                  key={s.valor}
                  type="button"
                  className={`radar-chip ${filtroStatus === s.valor ? 'active' : ''}`}
                  onClick={() => setFiltroStatus(s.valor)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="radar-lista" data-tour="radar-lista">
          {carregando ? (
            <div className="radar-vazio">
              <div className="radar-loading-icon"></div>
              <div className="radar-vazio-titulo">Consultando o radar…</div>
              <p className="radar-vazio-desc">
                Aguarde, buscando alertas no servidor.
              </p>
            </div>
          ) : listaFiltrada.length === 0 ? (
            <div className="radar-vazio">
              <div className="radar-vazio-icon"></div>
              <div className="radar-vazio-titulo">
                {lista.length === 0
                  ? 'Nenhum alerta detectado ainda'
                  : 'Nenhum alerta com esses filtros'}
              </div>
              <p className="radar-vazio-desc">
                {lista.length === 0
                  ? 'O radar está monitorando. Novos alertas aparecerão em instantes.'
                  : 'Ajuste os critérios acima para ver mais resultados.'}
              </p>
            </div>
          ) : (
            listaFiltrada.map((alerta) => (
              <article
                key={alerta.id}
                className={`radar-card radar-card-${alerta.severidade}`}
                onClick={() => abrirDetalhe(alerta.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') abrirDetalhe(alerta.id);
                }}
              >
                <div className="radar-card-top">
                  <span className={`radar-sev radar-sev-${alerta.severidade}`}>
                    {labels.severidade[alerta.severidade]}
                  </span>
                  <span className="radar-id mono">{alerta.id}</span>
                  <span className={`radar-status radar-status-${alerta.status}`}>
                    {labels.status[alerta.status] || alerta.status}
                  </span>
                </div>

                <h3 className="radar-card-titulo">{alerta.titulo}</h3>

                <p className="radar-card-desc">{alerta.descricao}</p>

                <div className="radar-card-foot">
                  <div className="radar-card-info">
                    <span className="radar-info-lbl">Técnica</span>
                    <span className="radar-info-val mono">{alerta.tecnica}</span>
                  </div>
                  <div className="radar-card-info">
                    <span className="radar-info-lbl">Passageiro</span>
                    <span className="radar-info-val">{alerta.passageiro}</span>
                  </div>
                  <div className="radar-card-info">
                    <span className="radar-info-lbl">Origem</span>
                    <span className="radar-info-val">{alerta.origem}</span>
                  </div>
                  <div className="radar-card-info">
                    <span className="radar-info-lbl">Detectado</span>
                    <span className="radar-info-val mono">
                      {alerta.detectadoEm?.split(' ')[1] || '--:--'}
                    </span>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
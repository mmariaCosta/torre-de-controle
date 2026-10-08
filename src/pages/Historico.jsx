import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import { api } from '../utils/api';
import { labels } from '../utils/dados';

const FILTROS_DATA = [
  { valor: 'todas', label: 'Todas' },
  { valor: 'hoje', label: 'Hoje' },
  { valor: '7d', label: 'Últimos 7 dias' },
  { valor: '30d', label: 'Últimos 30 dias' },
];

const FILTROS_SEV = [
  { valor: 'todas', label: 'Todas' },
  { valor: 'critico', label: 'Crítico' },
  { valor: 'alto', label: 'Alto' },
  { valor: 'medio', label: 'Médio' },
  { valor: 'baixo', label: 'Baixo' },
];

function parseDataHora(str) {
  if (!str) return null;
  const [data, hora] = str.split(' ');
  if (!data || !hora) return null;
  const [dia, mes, ano] = data.split('/').map(Number);
  const [h, m, s] = hora.split(':').map(Number);
  return new Date(ano, mes - 1, dia, h, m, s);
}

function calcularTempo(inicio, fim) {
  const d1 = parseDataHora(inicio);
  const d2 = parseDataHora(fim);
  if (!d1 || !d2) return '—';

  const diff = Math.floor((d2 - d1) / 1000);
  if (diff < 0) return '—';
  if (diff < 60) return `${diff}s`;

  const min = Math.floor(diff / 60);
  if (min < 60) return `${min} min`;

  const h = Math.floor(min / 60);
  const restoMin = min % 60;
  return `${h}h ${restoMin}min`;
}

function dentroDoPeriodo(dataStr, filtro) {
  if (filtro === 'todas') return true;
  const data = parseDataHora(dataStr);
  if (!data) return false;

  const agora = new Date();
  const diffMs = agora - data;
  const diffDias = diffMs / (1000 * 60 * 60 * 24);

  if (filtro === 'hoje') {
    return (
      data.getDate() === agora.getDate() &&
      data.getMonth() === agora.getMonth() &&
      data.getFullYear() === agora.getFullYear()
    );
  }
  if (filtro === '7d') return diffDias <= 7;
  if (filtro === '30d') return diffDias <= 30;
  return true;
}

export default function Historico() {
  const navigate = useNavigate();
  const [lista, setLista] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [apiOnline, setApiOnline] = useState(false);

  const [filtroData, setFiltroData] = useState('todas');
  const [filtroSev, setFiltroSev] = useState('todas');
  const [filtroControlador, setFiltroControlador] = useState('todos');

  useEffect(() => {
    let ativo = true;

    const carregar = async () => {
      try {
        const dados = await api.listarHistorico();
        if (!ativo) return;
        setLista(dados);
        setApiOnline(true);
      } catch {
        if (ativo) setApiOnline(false);
      } finally {
        if (ativo) setCarregando(false);
      }
    };

    carregar();
    const timer = setInterval(carregar, 15000);

    return () => {
      ativo = false;
      clearInterval(timer);
    };
  }, []);

  const controladores = useMemo(() => {
    const set = new Set();
    lista.forEach((a) => {
      if (a.resolvidoPor) set.add(a.resolvidoPor);
    });
    return Array.from(set).sort();
  }, [lista]);

  const listaFiltrada = useMemo(() => {
    return lista.filter((a) => {
      if (!dentroDoPeriodo(a.resolvidoEm || a.detectadoEm, filtroData)) return false;
      if (filtroSev !== 'todas' && a.severidade !== filtroSev) return false;
      if (filtroControlador !== 'todos' && a.resolvidoPor !== filtroControlador) return false;
      return true;
    });
  }, [lista, filtroData, filtroSev, filtroControlador]);

  const exportarCSV = () => {
    const cabecalho = [
      'ID', 'Titulo', 'Severidade', 'Status', 'Passageiro',
      'Origem', 'Destino', 'Detectado em', 'Resolvido em',
      'Resolvido por', 'Tempo total',
    ];

    const linhas = listaFiltrada.map((a) => [
      a.id,
      a.titulo,
      labels.severidade[a.severidade],
      labels.status[a.status] || a.status,
      a.passageiro,
      a.origem,
      a.destino,
      a.detectadoEm,
      a.resolvidoEm || '',
      a.resolvidoPor || '',
      calcularTempo(a.detectadoEm, a.resolvidoEm),
    ]);

    const escapar = (v) => `"${String(v).replace(/"/g, '""')}"`;

    const csv = [
      cabecalho.map(escapar).join(';'),
      ...linhas.map((l) => l.map(escapar).join(';')),
    ].join('\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historico-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="app-shell">
      <AppHeader />

      <main className="historico">

        <div className="historico-head">
          <div className="historico-head-top">
            <div className="historico-meta">
              <span className={`historico-meta-item ${apiOnline ? '' : 'offline'}`}>
                <span className="historico-meta-dot"></span>
                {apiOnline ? 'Histórico ativo' : 'Modo offline'}
              </span>
              <span className="historico-meta-sep">/</span>
              <span>
                {carregando
                  ? 'Carregando…'
                  : `${listaFiltrada.length} de ${lista.length} registros`}
              </span>
            </div>

            {!carregando && lista.length > 0 && (
              <button type="button" className="historico-export" onClick={exportarCSV}>
                Exportar CSV
              </button>
            )}
          </div>

          <h1 className="historico-title">
            Histórico de <em>eventos.</em>
          </h1>
          <p className="historico-sub">
            Todos os alertas finalizados (concluídos, escalados ou marcados como falso positivo).
            Filtre por data, controlador ou severidade.
          </p>
        </div>

        <div className="historico-filtros">
          <div className="historico-filtro-grupo">
            <div className="historico-filtro-lbl">Data</div>
            <div className="historico-filtro-opcoes">
              {FILTROS_DATA.map((f) => (
                <button
                  key={f.valor}
                  type="button"
                  className={`radar-chip ${filtroData === f.valor ? 'active' : ''}`}
                  onClick={() => setFiltroData(f.valor)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="historico-filtro-grupo">
            <div className="historico-filtro-lbl">Severidade</div>
            <div className="historico-filtro-opcoes">
              {FILTROS_SEV.map((f) => (
                <button
                  key={f.valor}
                  type="button"
                  className={`radar-chip ${filtroSev === f.valor ? 'active' : ''}`}
                  onClick={() => setFiltroSev(f.valor)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="historico-filtro-grupo">
            <div className="historico-filtro-lbl">Controlador</div>
            <select
              className="historico-select"
              value={filtroControlador}
              onChange={(e) => setFiltroControlador(e.target.value)}
            >
              <option value="todos">Todos</option>
              {controladores.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="historico-tabela">
          {carregando ? (
            <div className="historico-vazio">
              <div className="radar-loading-icon"></div>
              <p>Consultando o histórico…</p>
            </div>
          ) : listaFiltrada.length === 0 ? (
            <div className="historico-vazio">
              <div className="historico-vazio-icon"></div>
              <div className="historico-vazio-titulo">
                {lista.length === 0
                  ? 'Nenhum alerta finalizado ainda'
                  : 'Nenhum alerta com esses filtros'}
              </div>
              <p className="historico-vazio-desc">
                {lista.length === 0
                  ? 'Conclua ou marque alertas como falso positivo para eles aparecerem aqui.'
                  : 'Ajuste os filtros acima para ver mais registros.'}
              </p>
            </div>
          ) : (
            <>
              <div className="historico-linha historico-linha-head">
                <div>Data</div>
                <div>Controlador</div>
                <div>ID</div>
                <div>Título</div>
                <div>Passageiro</div>
                <div>Origem</div>
                <div>Severidade</div>
                <div>Status</div>
                <div>Tempo</div>
                <div>Ação</div>
              </div>

              {listaFiltrada.map((a) => (
                <div key={a.id} className="historico-linha">
                  <div className="historico-data mono">
                    {a.resolvidoEm ? a.resolvidoEm.split(' ')[0] : '—'}
                  </div>
                  <div className="historico-controlador">{a.resolvidoPor || '—'}</div>
                  <div className="historico-id mono">{a.id}</div>
                  <div className="historico-titulo">{a.titulo}</div>
                  <div className="historico-passageiro">{a.passageiro}</div>
                  <div className="historico-origem">{a.origem}</div>
                  <div>
                    <span className={`radar-sev radar-sev-${a.severidade}`}>
                      {labels.severidade[a.severidade]}
                    </span>
                  </div>
                  <div>
                    <span className={`radar-status radar-status-${a.status}`}>
                      {labels.status[a.status] || a.status}
                    </span>
                  </div>
                  <div className="historico-tempo mono">
                    {calcularTempo(a.detectadoEm, a.resolvidoEm)}
                  </div>
                  <div>
                    <button
                      type="button"
                      className="historico-acao"
                      onClick={() => navigate(`/radar/${a.id}/relatorio`)}
                    >
                      Ver relatório
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

      </main>
    </div>
  );
}
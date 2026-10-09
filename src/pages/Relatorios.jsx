import { useEffect, useState } from 'react';
import AppHeader from '../components/AppHeader';
import { api } from '../utils/api';
import { labels } from '../utils/dados';

function formatarTempo(segundos) {
  if (segundos === null || segundos === undefined) return '—';
  if (segundos < 60) return `${Math.round(segundos)}s`;

  const min = Math.floor(segundos / 60);
  if (min < 60) return `${min} min`;

  const h = Math.floor(min / 60);
  const restoMin = min % 60;
  return `${h}h ${restoMin}min`;
}

function getCorSeveridade(sev) {
  switch (sev) {
    case 'critico': return 'var(--danger)';
    case 'alto': return '#f97316';
    case 'medio': return 'var(--warning)';
    case 'baixo': return 'var(--info)';
    default: return 'var(--text-dim)';
  }
}

export default function Relatorios() {
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [apiOnline, setApiOnline] = useState(false);

  useEffect(() => {
    let ativo = true;

    const carregar = async () => {
      try {
        const resposta = await api.obterRelatorioAgregado();
        if (!ativo) return;
        setDados(resposta);
        setApiOnline(true);
      } catch {
        if (ativo) setApiOnline(false);
      } finally {
        if (ativo) setCarregando(false);
      }
    };

    carregar();
    const timer = setInterval(carregar, 20000);

    return () => {
      ativo = false;
      clearInterval(timer);
    };
  }, []);

  const exportarCSV = (bloco, cabecalho, linhas) => {
    const escapar = (v) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [
      cabecalho.map(escapar).join(';'),
      ...linhas.map((l) => l.map(escapar).join(';')),
    ].join('\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-${bloco}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportarControladores = () => {
    if (!dados) return;
    exportarCSV(
      'controladores',
      ['Controlador', 'Total de alertas'],
      dados.porControlador.map((c) => [c.controlador, c.total])
    );
  };

  const exportarSeveridades = () => {
    if (!dados) return;
    exportarCSV(
      'severidades',
      ['Severidade', 'Total'],
      dados.porSeveridade.map((s) => [labels.severidade[s.severidade], s.total])
    );
  };

  const exportarCategorias = () => {
    if (!dados) return;
    exportarCSV(
      'categorias',
      ['Categoria', 'Total'],
      dados.porCategoria.map((c) => [c.categoria, c.total])
    );
  };

  return (
    <div className="app-shell">
      <AppHeader />

      <main className="relatorios">
        <div className="relatorios-head">
          <div className="relatorios-meta">
            <span className={`relatorios-meta-item ${apiOnline ? '' : 'offline'}`}>
              <span className="relatorios-meta-dot"></span>
              {apiOnline ? 'Análise ativa' : 'Modo offline'}
            </span>
            <span className="relatorios-meta-sep">/</span>
            <span>Baseado no histórico de alertas resolvidos</span>
          </div>

          <h1 className="relatorios-title">
            Relatórios <em>agregados.</em>
          </h1>
          <p className="relatorios-sub">
            Análise consolidada dos alertas já resolvidos. Distribuição por
            controlador, severidade e categoria de ataque. Cada bloco é
            exportável em CSV.
          </p>
        </div>

        {carregando ? (
          <div className="relatorios-vazio">
            <div className="radar-loading-icon"></div>
            <p>Analisando histórico…</p>
          </div>
        ) : !dados || dados.total === 0 ? (
          <div className="relatorios-vazio">
            <div className="relatorios-vazio-icon"></div>
            <div className="relatorios-vazio-titulo">Nenhum alerta resolvido ainda</div>
            <p className="relatorios-vazio-desc">
              Conclua ou marque alertas como falso positivo no Radar para
              que eles apareçam aqui.
            </p>
          </div>
        ) : (
          <>
            {/* RESUMO */}
            <div className="relatorios-resumo">
              <div className="relatorios-resumo-item">
                <span className="relatorios-resumo-lbl">Alertas resolvidos</span>
                <span className="relatorios-resumo-val">{dados.total}</span>
              </div>

              <div className="relatorios-resumo-item">
                <span className="relatorios-resumo-lbl">Tempo médio de resposta</span>
                <span className="relatorios-resumo-val accent">
                  {formatarTempo(dados.tempoMedio)}
                </span>
              </div>

              <div className="relatorios-resumo-item">
                <span className="relatorios-resumo-lbl">Controladores ativos</span>
                <span className="relatorios-resumo-val">
                  {dados.porControlador.length}
                </span>
              </div>

              <div className="relatorios-resumo-item">
                <span className="relatorios-resumo-lbl">Categorias distintas</span>
                <span className="relatorios-resumo-val">
                  {dados.porCategoria.length}
                </span>
              </div>
            </div>

            {/* POR CONTROLADOR */}
            <section className="relatorio-bloco">
              <div className="relatorio-bloco-head">
                <h2>Por controlador</h2>
                <button
                  type="button"
                  className="relatorio-bloco-export"
                  onClick={exportarControladores}
                >
                  Exportar CSV
                </button>
              </div>

              <div className="relatorio-barras">
                {dados.porControlador.map((c) => {
                  const max = dados.porControlador[0].total;
                  const pct = Math.round((c.total / max) * 100);
                  return (
                    <div key={c.controlador} className="relatorio-barra-linha">
                      <span className="relatorio-barra-lbl">{c.controlador}</span>
                      <div className="relatorio-barra-track">
                        <div
                          className="relatorio-barra-fill"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="relatorio-barra-val">{c.total}</span>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* POR SEVERIDADE */}
            <section className="relatorio-bloco">
              <div className="relatorio-bloco-head">
                <h2>Por severidade</h2>
                <button
                  type="button"
                  className="relatorio-bloco-export"
                  onClick={exportarSeveridades}
                >
                  Exportar CSV
                </button>
              </div>

              <div className="relatorio-sev-lista">
                {dados.porSeveridade.map((s) => {
                  const pct = Math.round((s.total / dados.total) * 100);
                  return (
                    <div key={s.severidade} className="relatorio-sev-item">
                      <div className="relatorio-sev-top">
                        <span className={`radar-sev radar-sev-${s.severidade}`}>
                          {labels.severidade[s.severidade]}
                        </span>
                        <span className="relatorio-sev-total mono">
                          {s.total} · {pct}%
                        </span>
                      </div>
                      <div className="relatorio-sev-track">
                        <div
                          className="relatorio-sev-fill"
                          style={{
                            width: `${pct}%`,
                            background: getCorSeveridade(s.severidade),
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* POR CATEGORIA */}
            <section className="relatorio-bloco">
              <div className="relatorio-bloco-head">
                <h2>Por categoria de ataque</h2>
                <button
                  type="button"
                  className="relatorio-bloco-export"
                  onClick={exportarCategorias}
                >
                  Exportar CSV
                </button>
              </div>

              <div className="relatorio-barras">
                {dados.porCategoria.map((c) => {
                  const max = dados.porCategoria[0].total;
                  const pct = Math.round((c.total / max) * 100);
                  return (
                    <div key={c.categoria} className="relatorio-barra-linha">
                      <span className="relatorio-barra-lbl">{c.categoria}</span>
                      <div className="relatorio-barra-track">
                        <div
                          className="relatorio-barra-fill"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="relatorio-barra-val">{c.total}</span>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* POR STATUS */}
            <section className="relatorio-bloco">
              <div className="relatorio-bloco-head">
                <h2>Por status final</h2>
              </div>

              <div className="relatorio-status-lista">
                {dados.porStatus.map((s) => (
                  <div key={s.status} className="relatorio-status-item">
                    <span className={`radar-status radar-status-${s.status}`}>
                      {labels.status[s.status] || s.status}
                    </span>
                    <span className="relatorio-status-total mono">{s.total}</span>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
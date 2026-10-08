import { useEffect, useState } from 'react';
import AppHeader from '../components/AppHeader';
import { api } from '../utils/api';
import { voos as voosFallback, resumo, statusRadar as radarFallback } from '../utils/dados';

export default function Painel() {
  const sessao = JSON.parse(sessionStorage.getItem('tc_sessao')) || {};
  const [horaAtual, setHoraAtual] = useState(() => new Date());
  const [voos, setVoos] = useState(voosFallback);
  const [stats, setStats] = useState(resumo);
  const [statusRadar, setStatusRadar] = useState(radarFallback);
  const [apiOnline, setApiOnline] = useState(false);

  // Relógio vivo
  useEffect(() => {
    const timer = setInterval(() => setHoraAtual(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Busca dados da API
  useEffect(() => {
    let ativo = true;

    const carregar = async () => {
      try {
        const [voosAPI, statsAPI] = await Promise.all([
          api.listarVoos(10),
          api.obterStats(),
        ]);

        if (!ativo) return;

        setVoos(voosAPI);
        setStats(statsAPI);
        setApiOnline(true);

        // Atualiza status do radar com dados da API
        setStatusRadar((prev) => ({
          ...prev,
          ultimaVarredura: statsAPI.ultimaVarredura,
          uptime: statsAPI.uptime,
        }));
      } catch (erro) {
        if (ativo) {
          setApiOnline(false);
          // Mantém os dados de fallback
        }
      }
    };

    carregar();
    const timer = setInterval(carregar, 10000); // a cada 10s

    return () => {
      ativo = false;
      clearInterval(timer);
    };
  }, []);

  const horaFormatada = horaAtual.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const dataFormatada = horaAtual.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const getStatusLabel = (status) => {
    switch (status) {
      case 'autorizado': return 'Autorizado';
      case 'suspeito': return 'Suspeito';
      case 'bloqueado': return 'Bloqueado';
      default: return status;
    }
  };

  return (
    <div className="app-shell">
      <AppHeader />

      <main className="painel">

        <div className="painel-head">
          <div>
            <div className="painel-meta">
              <span className="painel-meta-item">
                <span className="painel-meta-dot"></span>
                {apiOnline ? 'Conectado ao radar' : 'Modo offline'}
              </span>
              <span className="painel-meta-sep">/</span>
              <span>{dataFormatada}</span>
            </div>
            <h1 className="painel-title">
              Boa tarde, <em>{sessao.controlador || 'controlador'}.</em>
            </h1>
            <p className="painel-sub">
              Visão geral do espaço aéreo monitorado. Os números são atualizados
              automaticamente conforme novos voos entram no radar.
            </p>
          </div>

          <div className="painel-clock">
            <div className="painel-clock-lbl">Horário da torre</div>
            <div className="painel-clock-val mono">{horaFormatada}</div>
          </div>
        </div>

        <div className="kpis" data-tour="painel-kpis">
          <div className="kpi">
            <div className="kpi-lbl">Voos monitorados</div>
            <div className="kpi-val">{(stats.voosMonitorados || 0).toLocaleString('pt-BR')}</div>
            <div className="kpi-note">Desde o início do turno</div>
          </div>

          <div className="kpi">
            <div className="kpi-lbl">Voos suspeitos</div>
            <div className="kpi-val warn">{stats.voosSuspeitos || 0}</div>
            <div className="kpi-note">Aguardando análise</div>
          </div>

          <div className="kpi">
            <div className="kpi-lbl">Voos bloqueados</div>
            <div className="kpi-val danger">{stats.voosBloqueados || 0}</div>
            <div className="kpi-note">Ação já tomada</div>
          </div>

          <div className="kpi">
            <div className="kpi-lbl">Alertas pendentes</div>
            <div className="kpi-val accent">{stats.alertasPendentes || 0}</div>
            <div className="kpi-note">Na fila da torre</div>
          </div>
        </div>

        <div className="painel-grid">
          <section className="panel" data-tour="painel-voos">
            <div className="panel-head">
              <h2 className="panel-title">Últimos voos no radar</h2>
              <span className="panel-sub">{voos.length} registros</span>
            </div>

            <div className="voos-list">
              {voos.map((voo) => (
                <div key={voo.id} className={`voo voo-${voo.status}`}>
                  <div className="voo-hora mono">{voo.hora}</div>

                  <div className="voo-body">
                    <div className="voo-top">
                      <span className="voo-id mono">{voo.id}</span>
                      <span className="voo-passageiro">{voo.passageiro}</span>
                    </div>
                    <div className="voo-meta">
                      <span>{voo.origem}</span>
                      <span className="voo-arrow">→</span>
                      <span>{voo.destino}</span>
                    </div>
                  </div>

                  <div className="voo-right">
                    <span className={`voo-badge voo-badge-${voo.status}`}>
                      {getStatusLabel(voo.status)}
                    </span>
                    <span className="voo-motivo">{voo.motivo}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="painel-side">
            <section className="panel" data-tour="painel-status">
              <div className="panel-head">
                <h2 className="panel-title">Status do radar</h2>
              </div>

              <div className="status-list">
                <div className="status-row">
                  <span className="status-lbl">Varredura</span>
                  <span className="status-val status-ok">
                    <span className="status-dot"></span>
                    {apiOnline ? 'Ativa' : 'Offline'}
                  </span>
                </div>

                <div className="status-row">
                  <span className="status-lbl">Última leitura</span>
                  <span className="status-val mono">{statusRadar.ultimaVarredura}</span>
                </div>

                <div className="status-row">
                  <span className="status-lbl">Regras ativas</span>
                  <span className="status-val mono">{statusRadar.regrasAtivas}</span>
                </div>

                <div className="status-row">
                  <span className="status-lbl">Disponibilidade</span>
                  <span className="status-val status-ok mono">{statusRadar.uptime}</span>
                </div>
              </div>
            </section>

            <section className="panel">
              <div className="panel-head">
                <h2 className="panel-title">Alertas recentes</h2>
              </div>

              <div className="alertas-list">
                {voos
                  .filter((v) => v.status !== 'autorizado')
                  .slice(0, 4)
                  .map((voo) => (
                    <div key={voo.id} className={`alerta alerta-${voo.status}`}>
                      <div className="alerta-top">
                        <span className="alerta-tipo">{voo.motivo}</span>
                        <span className="alerta-hora mono">{voo.hora}</span>
                      </div>
                      <div className="alerta-body">
                        {voo.tecnica && (
                          <span className="alerta-tecnica mono">{voo.tecnica}</span>
                        )}
                        <span className="alerta-passageiro">{voo.passageiro}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </section>
          </div>
        </div>

      </main>
    </div>
  );
}
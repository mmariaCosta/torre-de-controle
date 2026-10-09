import { useEffect, useState } from 'react';
import AppHeader from '../components/AppHeader';
import { api } from '../utils/api';

export default function Protocolos() {
  const [protocolos, setProtocolos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [apiOnline, setApiOnline] = useState(false);

  useEffect(() => {
    let ativo = true;

    const carregar = async () => {
      try {
        const dados = await api.listarProtocolos();
        if (!ativo) return;
        setProtocolos(dados);
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

  const totalDisparos = protocolos.reduce((s, p) => s + p.disparos, 0);

  return (
    <div className="app-shell">
      <AppHeader />

      <main className="protocolos">
        <div className="protocolos-head">
          <div className="protocolos-meta">
            <span className={`protocolos-meta-item ${apiOnline ? '' : 'offline'}`}>
              <span className="protocolos-meta-dot"></span>
              {apiOnline ? 'Motor ativo' : 'Modo offline'}
            </span>
            <span className="protocolos-meta-sep">/</span>
            <span>{protocolos.length} protocolos · {totalDisparos} disparos</span>
          </div>

          <h1 className="protocolos-title">
            Protocolos de <em>detecção.</em>
          </h1>
          <p className="protocolos-sub">
            Regras que o motor aplica sobre cada log gerado. Cada alerta no radar
            é resultado de um destes protocolos. As estatísticas são atualizadas
            em tempo real conforme novos padrões são detectados.
          </p>
        </div>

        {carregando ? (
          <div className="protocolos-vazio">
            <div className="radar-loading-icon"></div>
            <p>Carregando protocolos…</p>
          </div>
        ) : (
          <div className="protocolos-lista">
            {protocolos.map((p) => (
              <article key={p.id} className={`protocolo protocolo-${p.severidade}`}>
                <header className="protocolo-head">
                  <div className="protocolo-head-left">
                    <span className="protocolo-id mono">{p.id}</span>
                    <span className={`radar-sev radar-sev-${p.severidade}`}>
                      {p.severidade === 'critico' ? 'Crítico' :
                       p.severidade === 'alto' ? 'Alto' :
                       p.severidade === 'medio' ? 'Médio' : 'Baixo'}
                    </span>
                  </div>

                  <div className="protocolo-head-right">
                    <span className="protocolo-disparos mono">
                      {p.disparos} disparo{p.disparos === 1 ? '' : 's'}
                    </span>
                  </div>
                </header>

                <h2 className="protocolo-nome">{p.nome}</h2>

                <p className="protocolo-descricao">{p.descricao}</p>

                <div className="protocolo-grid">
                  <div className="protocolo-campo">
                    <span className="protocolo-lbl">Regra</span>
                    <span className="protocolo-valor">{p.regra}</span>
                  </div>

                  <div className="protocolo-campo">
                    <span className="protocolo-lbl">Categoria MITRE</span>
                    <span className="protocolo-valor">{p.categoria}</span>
                  </div>

                  <div className="protocolo-campo">
                    <span className="protocolo-lbl">Técnica</span>
                    <span className="protocolo-valor">
                      <span className="protocolo-tecnica mono">{p.tecnica}</span>
                      {' '}
                      {p.tecnicaNome}
                    </span>
                  </div>

                  <div className="protocolo-campo">
                    <span className="protocolo-lbl">Último disparo</span>
                    <span className="protocolo-valor mono">
                      {p.ultimoDisparo || '—'}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
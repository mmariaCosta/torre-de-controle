import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import AppHeader from '../components/AppHeader';
import { api } from '../utils/api';
import { labels } from '../utils/dados';

export default function Relatorio() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [alerta, setAlerta] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    let ativo = true;
    const carregar = async () => {
      try {
        const dados = await api.obterAlerta(id);
        if (ativo) setAlerta(dados);
      } catch {
        if (ativo) setErro('Alerta não encontrado');
      } finally {
        if (ativo) setCarregando(false);
      }
    };
    carregar();
    return () => { ativo = false; };
  }, [id]);

  if (carregando) {
    return (
      <div className="app-shell">
        <AppHeader />
        <main className="relatorio-wrap">
          <div className="voo-carregando">
            <div className="radar-loading-icon"></div>
            <p>Gerando relatório…</p>
          </div>
        </main>
      </div>
    );
  }

  if (erro || !alerta) {
    return (
      <div className="app-shell">
        <AppHeader />
        <main className="relatorio-wrap">
          <div className="voo-404">
            <h1>Alerta não encontrado</h1>
            <button className="btn-voltar" onClick={() => navigate('/radar')}>
              Voltar ao radar
            </button>
          </div>
        </main>
      </div>
    );
  }

  const sessao = JSON.parse(sessionStorage.getItem('tc_sessao')) || {};
  const agora = new Date();
  const emitidoEm = `${agora.toLocaleDateString('pt-BR')} às ${agora.toLocaleTimeString('pt-BR')}`;

  const textoRelatorio = `
RELATÓRIO DE VOO SUSPEITO — ${alerta.id}
Emitido em ${emitidoEm} por ${sessao.controlador || 'Controlador'}

RESUMO EXECUTIVO
${alerta.descricao}

METADADOS
Passageiro: ${alerta.passageiro}
Origem: ${alerta.origem}
Destino: ${alerta.destino}
Detectado em: ${alerta.detectadoEm}
Regra disparada: ${alerta.regra}
Severidade: ${labels.severidade[alerta.severidade]}

TÉCNICA MITRE ATT&CK
${alerta.tecnica} — ${alerta.tecnicaNome}

TIMELINE DE EVENTOS
${alerta.voos.map((v) => `${v.hora} — ${v.acao} (IP ${v.ip})`).join('\n')}

RECOMENDAÇÕES
${alerta.recomendacoes.map((r, i) => `${i + 1}. ${r}`).join('\n')}
`.trim();

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(textoRelatorio);
      alert('Relatório copiado para a área de transferência.');
    } catch {
      alert('Não foi possível copiar. Selecione o texto manualmente.');
    }
  };

  const baixar = () => {
    const blob = new Blob([textoRelatorio], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-${alerta.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const imprimir = () => window.print();

  return (
    <div className="app-shell">
      <AppHeader />

      <main className="relatorio-wrap">

        <button className="btn-voltar-topo" onClick={() => navigate(`/radar/${alerta.id}`)}>
          <span className="btn-voltar-seta"></span> Voltar ao detalhe
        </button>

        <div className="relatorio-acoes">
          <button className="rel-btn" onClick={copiar}>Copiar texto</button>
          <button className="rel-btn" onClick={baixar}>Baixar .txt</button>
          <button className="rel-btn rel-btn-primary" onClick={imprimir}>Imprimir</button>
        </div>

        <article className="relatorio-doc">

          <header className="relatorio-head">
            <div className="relatorio-marca">
              <span className="relatorio-marca-dot"></span>
              <span>Torre de Controle · Documento Oficial</span>
            </div>
            <div className="relatorio-id mono">{alerta.id}</div>
          </header>

          <h1 className="relatorio-titulo">
            Relatório de voo suspeito
          </h1>

          <div className="relatorio-meta">
            <span>Emitido em <strong>{emitidoEm}</strong></span>
            <span>Controlador <strong>{sessao.controlador || 'Não identificado'}</strong></span>
          </div>

          <section className="relatorio-sec">
            <h2 className="relatorio-sec-titulo">Resumo executivo</h2>
            <p className="relatorio-texto">{alerta.descricao}</p>
          </section>

          <section className="relatorio-sec">
            <h2 className="relatorio-sec-titulo">Metadados do voo</h2>
            <div className="relatorio-tabela">
              <div className="relatorio-linha">
                <span className="relatorio-chave">Passageiro</span>
                <span className="relatorio-valor">{alerta.passageiro}</span>
              </div>
              <div className="relatorio-linha">
                <span className="relatorio-chave">Origem</span>
                <span className="relatorio-valor">{alerta.origem}</span>
              </div>
              <div className="relatorio-linha">
                <span className="relatorio-chave">Destino</span>
                <span className="relatorio-valor">{alerta.destino}</span>
              </div>
              <div className="relatorio-linha">
                <span className="relatorio-chave">Detectado em</span>
                <span className="relatorio-valor mono">{alerta.detectadoEm}</span>
              </div>
              <div className="relatorio-linha">
                <span className="relatorio-chave">Regra disparada</span>
                <span className="relatorio-valor">{alerta.regra}</span>
              </div>
              <div className="relatorio-linha">
                <span className="relatorio-chave">Severidade</span>
                <span className="relatorio-valor">{labels.severidade[alerta.severidade]}</span>
              </div>
            </div>
          </section>

          <section className="relatorio-sec">
            <h2 className="relatorio-sec-titulo">Técnica MITRE ATT&amp;CK</h2>
            <div className="relatorio-mitre">
              <span className="relatorio-mitre-id mono">{alerta.tecnica}</span>
              <span className="relatorio-mitre-nome">{alerta.tecnicaNome}</span>
            </div>
          </section>

          <section className="relatorio-sec">
            <h2 className="relatorio-sec-titulo">Timeline de eventos</h2>
            <div className="relatorio-timeline">
              {alerta.voos.map((voo, i) => (
                <div key={voo.id} className="relatorio-evento">
                  <div className="relatorio-evento-hora mono">{voo.hora}</div>
                  <div className="relatorio-evento-corpo">
                    <div className="relatorio-evento-acao">{voo.acao}</div>
                    <div className="relatorio-evento-ip mono">IP {voo.ip}</div>
                  </div>
                  <div className="relatorio-evento-num mono">
                    {String(i + 1).padStart(2, '0')}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="relatorio-sec">
            <h2 className="relatorio-sec-titulo">Recomendações</h2>
            <ol className="relatorio-recomendacoes">
              {alerta.recomendacoes.map((rec, i) => (
                <li key={i}>{rec}</li>
              ))}
            </ol>
          </section>

          <footer className="relatorio-foot">
            <span>Documento gerado automaticamente pela Torre de Controle</span>
            <span className="mono">{alerta.id}</span>
          </footer>

        </article>

      </main>
    </div>
  );
}
import { useState, useRef, useEffect, useCallback } from 'react';
import { api } from '../utils/api';

const AJUDA_COMANDOS = [
  { cmd: 'ajuda', desc: 'Mostra esta lista' },
  { cmd: 'buscar ip=<valor>', desc: 'Eventos de um IP' },
  { cmd: 'buscar passageiro=<nome>', desc: 'Eventos de um usuário' },
  { cmd: 'buscar status=<valor>', desc: 'Eventos por status (autorizado, suspeito, bloqueado)' },
  { cmd: 'resumo', desc: 'Estatísticas gerais do radar' },
  { cmd: 'historico', desc: 'Últimos comandos digitados' },
  { cmd: 'limpar', desc: 'Limpa a tela' },
];

const AJUDA_ATALHOS = [
  { key: '↑ ↓', desc: 'Navega entre comandos anteriores' },
  { key: 'Tab', desc: 'Autocomplete' },
];

export default function Terminal({ comandoInicial }) {
  const [linhas, setLinhas] = useState([
    { tipo: 'info', texto: 'Torre de Controle · Terminal de investigação' },
    { tipo: 'info', texto: 'Digite "ajuda" para ver os comandos disponíveis.' },
    { tipo: 'vazio', texto: '' },
  ]);
  const [input, setInput] = useState('');
  const [historico, setHistorico] = useState([]);
  const [idxHistorico, setIdxHistorico] = useState(-1);
  const [ipsCache, setIpsCache] = useState([]);
  const [passageirosCache, setPassageirosCache] = useState([]);
  const [processando, setProcessando] = useState(false);

  const inputRef = useRef(null);
  const fimRef = useRef(null);
  const comandoExecutadoRef = useRef(false);
  const ultimoComandoRef = useRef({ texto: '', quando: 0 });

  // Carrega caches para autocomplete
  useEffect(() => {
    const carregar = async () => {
      try {
        const [ips, passageiros] = await Promise.all([
          api.listarIps(),
          api.listarPassageiros(),
        ]);
        setIpsCache(ips);
        setPassageirosCache(passageiros);
      } catch {
        // silencioso
      }
    };
    carregar();
  }, []);

  // Rola pro fim quando novas linhas chegam
  useEffect(() => {
    if (fimRef.current) {
      fimRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [linhas]);

  const adicionarLinha = useCallback((tipo, texto) => {
    setLinhas((l) => [...l, { tipo, texto }]);
  }, []);

  const executar = useCallback(async (texto) => {
    const comando = texto.trim();
    if (!comando) return;

    // Proteção contra duplo disparo (StrictMode em dev)
    const agora = Date.now();
    if (
      ultimoComandoRef.current.texto === comando &&
      agora - ultimoComandoRef.current.quando < 200
    ) {
      return;
    }
    ultimoComandoRef.current = { texto: comando, quando: agora };

    // Adiciona o comando na tela
    adicionarLinha('prompt', comando);

    // Adiciona ao histórico (50 últimos, sem duplicar consecutivo)
    setHistorico((h) => {
      const semDuplicata = h.filter((c) => c !== comando);
      return [comando, ...semDuplicata].slice(0, 50);
    });
    setIdxHistorico(-1);

    const partes = comando.split(/\s+/);
    const cmd = partes[0].toLowerCase();

    setProcessando(true);

    try {
      // AJUDA
      if (cmd === 'ajuda') {
        adicionarLinha('ajuda-titulo', 'Comandos disponíveis:');
        AJUDA_COMANDOS.forEach((item) => {
          adicionarLinha('ajuda-item', { cmd: item.cmd, desc: item.desc });
        });
        adicionarLinha('vazio', '');
        adicionarLinha('ajuda-titulo', 'Atalhos:');
        AJUDA_ATALHOS.forEach((item) => {
          adicionarLinha('ajuda-item', { cmd: item.key, desc: item.desc });
        });
        adicionarLinha('vazio', '');
        return;
      }

      // LIMPAR
      if (cmd === 'limpar') {
        setLinhas([]);
        return;
      }

      // HISTORICO
      if (cmd === 'historico') {
        if (historico.length === 0) {
          adicionarLinha('saida', 'Nenhum comando no histórico ainda.');
        } else {
          const lista = historico
            .slice(0, 20)
            .map((c, i) => `  ${String(i + 1).padStart(2, '0')}  ${c}`)
            .join('\n');
          adicionarLinha('saida', `Últimos comandos:\n\n${lista}`);
        }
        adicionarLinha('vazio', '');
        return;
      }

      // RESUMO
      if (cmd === 'resumo') {
        const r = await api.obterResumoLogs();
        let texto = 'Resumo do radar:\n\n';
        texto += `  Total de voos monitorados   ${r.total}\n`;
        texto += `  Autorizados                 ${r.autorizados}\n`;
        texto += `  Suspeitos                   ${r.suspeitos}\n`;
        texto += `  Bloqueados                  ${r.bloqueados}\n`;

        if (r.top_ips.length > 0) {
          texto += '\nTop IPs suspeitos:\n';
          r.top_ips.forEach((i) => {
            texto += `  ${i.ip.padEnd(24)} ${i.count} ocorrência${i.count > 1 ? 's' : ''}\n`;
          });
        }

        if (r.top_passageiros.length > 0) {
          texto += '\nTop passageiros visados:\n';
          r.top_passageiros.forEach((p) => {
            texto += `  ${p.passageiro.padEnd(20)} ${p.count} ocorrência${p.count > 1 ? 's' : ''}\n`;
          });
        }

        adicionarLinha('saida', texto);
        adicionarLinha('vazio', '');
        return;
      }

      // BUSCAR
      if (cmd === 'buscar') {
        const resto = comando.slice(6).trim();
        let tipo = null;
        let valor = null;

        const matchIgual = resto.match(/^(\w+)\s*=\s*(.+)$/);
        if (matchIgual) {
          tipo = matchIgual[1].toLowerCase();
          valor = matchIgual[2].trim();
        } else {
          const partes2 = resto.split(/\s+/);
          if (partes2.length >= 2) {
            tipo = partes2[0].toLowerCase();
            valor = partes2.slice(1).join(' ').trim();
          }
        }

        if (!tipo || !valor) {
          adicionarLinha('erro', 'Uso: buscar ip=<valor> | buscar passageiro=<nome> | buscar status=<valor>');
          adicionarLinha('vazio', '');
          return;
        }

        if (!['ip', 'passageiro', 'status'].includes(tipo)) {
          adicionarLinha('erro', `Tipo inválido: "${tipo}". Use ip, passageiro ou status.`);
          adicionarLinha('vazio', '');
          return;
        }

        const eventos = await api.buscarLogs(tipo, valor);

        if (eventos.length === 0) {
          adicionarLinha('saida', `Nenhum evento encontrado para "${tipo}=${valor}".`);
          adicionarLinha('vazio', '');
          return;
        }

        adicionarLinha(
          'saida',
          `Encontrados ${eventos.length} evento${eventos.length > 1 ? 's' : ''}:`
        );
        adicionarLinha('vazio', '');

        eventos.forEach((e) => {
          adicionarLinha('evento', {
            hora: e.hora,
            passageiro: e.passageiro,
            ip: e.ip,
            status: e.status,
            motivo: e.motivo,
          });
        });

        adicionarLinha('vazio', '');
        return;
      }

      adicionarLinha(
        'erro',
        `Comando não reconhecido: "${cmd}". Digite "ajuda" para ver os comandos.`
      );
      adicionarLinha('vazio', '');
    } catch (erro) {
      adicionarLinha('erro', `Erro ao processar comando: ${erro.message}`);
      adicionarLinha('vazio', '');
    } finally {
      setProcessando(false);
    }
  }, [historico, adicionarLinha]);

  // Executa comando inicial (vindo do VooDetalhe) — só uma vez
  useEffect(() => {
    if (comandoInicial && !comandoExecutadoRef.current) {
      comandoExecutadoRef.current = true;
      setInput(comandoInicial);
      setTimeout(() => executar(comandoInicial), 300);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comandoInicial]);

  const handleSubmit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (processando) return;
    const cmd = input;
    setInput('');
    executar(cmd);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      completar();
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historico.length === 0) return;
      const proximo = Math.min(idxHistorico + 1, historico.length - 1);
      setIdxHistorico(proximo);
      setInput(historico[proximo]);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (idxHistorico <= 0) {
        setIdxHistorico(-1);
        setInput('');
        return;
      }
      const anterior = idxHistorico - 1;
      setIdxHistorico(anterior);
      setInput(historico[anterior]);
      return;
    }
  };

  const completar = () => {
    const texto = input;
    const partes = texto.split(/\s+/);
    const ultimo = partes[partes.length - 1];

    if (partes.length === 1) {
      if ('buscar'.startsWith(texto) && texto !== 'buscar') {
        setInput('buscar ');
        return;
      }
      if ('ajuda'.startsWith(texto) && texto !== 'ajuda') {
        setInput('ajuda');
        return;
      }
      if ('resumo'.startsWith(texto) && texto !== 'resumo') {
        setInput('resumo');
        return;
      }
      if ('historico'.startsWith(texto) && texto !== 'historico') {
        setInput('historico');
        return;
      }
      if ('limpar'.startsWith(texto) && texto !== 'limpar') {
        setInput('limpar');
        return;
      }
    }

    if (partes[0] === 'buscar') {
      if (partes.length === 2 && !partes[1].includes('=')) {
        if ('ip='.startsWith(partes[1])) { setInput('buscar ip='); return; }
        if ('passageiro='.startsWith(partes[1])) { setInput('buscar passageiro='); return; }
        if ('status='.startsWith(partes[1])) { setInput('buscar status='); return; }
      }

      if (partes[1]?.startsWith('ip=')) {
        const prefixo = partes[1].slice(3);
        const match = ipsCache.find((ip) => ip.startsWith(prefixo));
        if (match) {
          setInput(`buscar ip=${match}`);
          return;
        }
      }

      if (partes[1]?.startsWith('passageiro=')) {
        const prefixo = partes[1].slice(11);
        const match = passageirosCache.find((p) => p.startsWith(prefixo));
        if (match) {
          setInput(`buscar passageiro=${match}`);
          return;
        }
      }

      if (partes[1]?.startsWith('status=')) {
        const prefixo = partes[1].slice(7);
        const opcoes = ['autorizado', 'suspeito', 'bloqueado'];
        const match = opcoes.find((s) => s.startsWith(prefixo) && s !== prefixo);
        if (match) {
          setInput(`buscar status=${match}`);
          return;
        }
      }
    }
  };

  return (
    <div className="term" onClick={() => inputRef.current?.focus()}>
      <div className="term-body">
        {linhas.map((linha, i) => {
          if (linha.tipo === 'vazio') {
            return <div key={i} className="term-line term-line-vazio">&nbsp;</div>;
          }

          if (linha.tipo === 'prompt') {
            return (
              <div key={i} className="term-line term-line-prompt">
                <span className="term-prompt-user">torre@radar</span>
                <span className="term-prompt-sym">:~$</span>{' '}
                <span className="term-prompt-cmd">{linha.texto}</span>
              </div>
            );
          }

          if (linha.tipo === 'info') {
            return <div key={i} className="term-line term-line-info">{linha.texto}</div>;
          }

          if (linha.tipo === 'erro') {
            return <div key={i} className="term-line term-line-erro">{linha.texto}</div>;
          }

          if (linha.tipo === 'ajuda-titulo') {
            return (
              <div key={i} className="term-line term-ajuda-titulo">
                {linha.texto}
              </div>
            );
          }

          if (linha.tipo === 'ajuda-item') {
            const { cmd, desc } = linha.texto;
            return (
              <div key={i} className="term-line term-ajuda-item">
                <span className="term-ajuda-cmd">{cmd}</span>
                <span className="term-ajuda-desc">{desc}</span>
              </div>
            );
          }

          if (linha.tipo === 'evento') {
            const e = linha.texto;
            return (
              <div key={i} className="term-evento-bloco">
                <div className={`term-line term-line-evento term-evento-${e.status}`}>
                  <span className="term-evento-hora">{e.hora}</span>
                  <span className="term-evento-sep">|</span>
                  <span className="term-evento-passageiro">{e.passageiro}</span>
                  <span className="term-evento-sep">|</span>
                  <span className="term-evento-ip">{e.ip}</span>
                  <span className="term-evento-sep">|</span>
                  <span className={`term-evento-status term-status-${e.status}`}>
                    {e.status}
                  </span>
                </div>
                {e.motivo && (
                  <div className="term-line term-evento-motivo">
                    <span className="term-evento-seta">→</span> {e.motivo}
                  </div>
                )}
              </div>
            );
          }

          return <div key={i} className="term-line term-line-saida">{linha.texto}</div>;
        })}

        <form className="term-line term-line-input" onSubmit={handleSubmit}>
          <span className="term-prompt-user">torre@radar</span>
          <span className="term-prompt-sym">:~$</span>
          <input
            ref={inputRef}
            className="term-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={processando}
            autoFocus
            spellCheck={false}
            autoComplete="off"
          />
        </form>

        <div ref={fimRef} />
      </div>
    </div>
  );
}

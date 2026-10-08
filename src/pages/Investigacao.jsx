import { useSearchParams } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import Terminal from '../components/Terminal';

export default function Investigacao() {
  const [params] = useSearchParams();
  const ipInicial = params.get('ip');

  const comandoInicial = ipInicial ? `buscar ip=${ipInicial}` : null;

  return (
    <div className="app-shell">
      <AppHeader />

      <main className="investigacao">
        <div className="investigacao-head">
          <div className="investigacao-meta">
            <span className="investigacao-meta-item">
              <span className="investigacao-meta-dot"></span>
              Terminal ativo
            </span>
            <span className="investigacao-meta-sep">/</span>
            <span>Consulta de logs em tempo real</span>
          </div>

          <h1 className="investigacao-title">
            Terminal de <em>investigação.</em>
          </h1>
          <p className="investigacao-sub">
            Consulte os logs brutos do radar. Cada comando filtra os eventos gerados
            pelo sistema em tempo real. Digite <code>ajuda</code> para começar.
          </p>
        </div>

        <Terminal comandoInicial={comandoInicial} />

        <div className="investigacao-dicas">
          <span className="investigacao-dica-lbl">Comandos rápidos:</span>
          <code>ajuda</code>
          <code>resumo</code>
          <code>buscar status=bloqueado</code>
          <code>buscar ip=185.220.101.42</code>
        </div>
      </main>
    </div>
  );
}
import { useEffect, useState } from 'react';

export default function AvisoConexao({ ativo }) {
  const [segundos, setSegundos] = useState(0);

  // Conta os segundos desde que o aviso ficou ativo
  useEffect(() => {
    if (!ativo) {
      setSegundos(0);
      return;
    }

    const timer = setInterval(() => {
      setSegundos((s) => s + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [ativo]);

  if (!ativo) return null;

  const mensagem =
    segundos < 5
      ? 'Conectando ao radar…'
      : segundos < 20
      ? 'Acordando o servidor. Aguarde alguns segundos.'
      : 'O servidor estava em repouso. Isso pode levar até 50 segundos na primeira visita.';

  return (
    <div className="aviso-conexao" role="status">
      <span className="aviso-conexao-pulso"></span>
      <span className="aviso-conexao-texto">{mensagem}</span>
      {segundos > 5 && (
        <span className="aviso-conexao-tempo mono">{segundos}s</span>
      )}
    </div>
  );
}
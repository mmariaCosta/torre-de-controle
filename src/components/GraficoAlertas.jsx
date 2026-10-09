import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { api } from '../utils/api';

export default function GraficoAlertas() {
  const [dados, setDados] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;

    const carregar = async () => {
      try {
        const resposta = await api.obterGraficoAlertas();
        if (!ativo) return;
        setDados(resposta);
      } catch {
        if (ativo) setDados([]);
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

  const total = dados.reduce((s, d) => s + d.alertas, 0);

  return (
    <div className="grafico-panel">
      <div className="grafico-head">
        <div>
          <h3 className="grafico-titulo">Alertas nas últimas 12 horas</h3>
          <p className="grafico-sub">
            {total} alerta{total === 1 ? '' : 's'} gerado{total === 1 ? '' : 's'} no período
          </p>
        </div>
      </div>

      <div className="grafico-corpo">
        {carregando ? (
          <div className="grafico-vazio">
            <div className="radar-loading-icon"></div>
          </div>
        ) : total === 0 ? (
          <div className="grafico-vazio-texto">
            Nenhum alerta gerado nas últimas 12 horas.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart
              data={dados}
              margin={{ top: 10, right: 20, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="linhaAlerta" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#4ade80" />
                  <stop offset="100%" stopColor="#22c55e" />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.06)"
                vertical={false}
              />
              <XAxis
                dataKey="hora"
                stroke="#6b6b74"
                tick={{ fill: '#8b93a1', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
              />
              <YAxis
                stroke="#6b6b74"
                tick={{ fill: '#8b93a1', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  background: '#12171f',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 8,
                  fontSize: 12,
                  color: '#e4e7eb',
                }}
                labelStyle={{ color: '#8b93a1', fontSize: 11 }}
                formatter={(value, name) => [
                  value,
                  name === 'alertas' ? 'Alertas' : 'Críticos',
                ]}
              />
              <Line
                type="monotone"
                dataKey="alertas"
                stroke="url(#linhaAlerta)"
                strokeWidth={2}
                dot={{ fill: '#4ade80', r: 3 }}
                activeDot={{ r: 5, fill: '#4ade80' }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
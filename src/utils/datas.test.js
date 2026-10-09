import { describe, it, expect } from 'vitest';
import { parseDataHora, calcularTempo, dentroDoPeriodo } from './datas';

// ============================================================
// parseDataHora
// ============================================================
describe('parseDataHora', () => {
  it('converte string de data/hora válida em Date', () => {
    const d = parseDataHora('08/10/2026 13:09:12');

    expect(d).toBeInstanceOf(Date);
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(9); // outubro = 9 (zero-based)
    expect(d.getDate()).toBe(8);
    expect(d.getHours()).toBe(13);
    expect(d.getMinutes()).toBe(9);
    expect(d.getSeconds()).toBe(12);
  });

  it('retorna null para string vazia', () => {
    expect(parseDataHora('')).toBeNull();
  });

  it('retorna null para null', () => {
    expect(parseDataHora(null)).toBeNull();
  });

  it('retorna null para string sem hora', () => {
    expect(parseDataHora('08/10/2026')).toBeNull();
  });

  it('retorna null para string com formato inválido', () => {
    expect(parseDataHora('abc def')).toBeNull();
  });
});

// ============================================================
// calcularTempo
// ============================================================
describe('calcularTempo', () => {
  it('retorna segundos quando a diferença é menor que 1 minuto', () => {
    const tempo = calcularTempo('08/10/2026 13:00:00', '08/10/2026 13:00:45');
    expect(tempo).toBe('45s');
  });

  it('retorna minutos quando a diferença é menor que 1 hora', () => {
    const tempo = calcularTempo('08/10/2026 13:00:00', '08/10/2026 13:15:00');
    expect(tempo).toBe('15 min');
  });

  it('retorna horas e minutos quando a diferença é maior que 1 hora', () => {
    const tempo = calcularTempo('08/10/2026 13:00:00', '08/10/2026 14:45:00');
    expect(tempo).toBe('1h 45min');
  });

  it('retorna "—" quando a data inicial é nula', () => {
    expect(calcularTempo(null, '08/10/2026 13:00:00')).toBe('—');
  });

  it('retorna "—" quando a data final é nula', () => {
    expect(calcularTempo('08/10/2026 13:00:00', null)).toBe('—');
  });

  it('retorna "—" quando a data final é anterior à inicial', () => {
    expect(calcularTempo('08/10/2026 14:00:00', '08/10/2026 13:00:00')).toBe('—');
  });

  it('retorna "0s" quando as datas são iguais', () => {
    expect(calcularTempo('08/10/2026 13:00:00', '08/10/2026 13:00:00')).toBe('0s');
  });
});

// ============================================================
// dentroDoPeriodo
// ============================================================
describe('dentroDoPeriodo', () => {
  it('retorna true quando o filtro é "todas"', () => {
    expect(dentroDoPeriodo('01/01/2020 00:00:00', 'todas')).toBe(true);
  });

  it('retorna true para data de hoje com filtro "hoje"', () => {
    const hoje = new Date();
    const dia = String(hoje.getDate()).padStart(2, '0');
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const ano = hoje.getFullYear();
    const dataHoje = `${dia}/${mes}/${ano} 10:00:00`;

    expect(dentroDoPeriodo(dataHoje, 'hoje')).toBe(true);
  });

  it('retorna false para data antiga com filtro "hoje"', () => {
    expect(dentroDoPeriodo('01/01/2020 10:00:00', 'hoje')).toBe(false);
  });

  it('retorna true para data de 3 dias atrás com filtro "7d"', () => {
    const d = new Date();
    d.setDate(d.getDate() - 3);

    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const ano = d.getFullYear();
    const data = `${dia}/${mes}/${ano} 10:00:00`;

    expect(dentroDoPeriodo(data, '7d')).toBe(true);
  });

  it('retorna false para data de 10 dias atrás com filtro "7d"', () => {
    const d = new Date();
    d.setDate(d.getDate() - 10);

    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const ano = d.getFullYear();
    const data = `${dia}/${mes}/${ano} 10:00:00`;

    expect(dentroDoPeriodo(data, '7d')).toBe(false);
  });

  it('retorna false quando a data é inválida', () => {
    expect(dentroDoPeriodo(null, 'hoje')).toBe(false);
    expect(dentroDoPeriodo('', '7d')).toBe(false);
  });
});
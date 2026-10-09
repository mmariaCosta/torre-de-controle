import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import AvisoConexao from './AvisoConexao';

describe('AvisoConexao', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('não renderiza nada quando ativo=false', () => {
    const { container } = render(<AvisoConexao ativo={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renderiza a mensagem inicial quando ativo=true', () => {
    render(<AvisoConexao ativo={true} />);
    expect(screen.getByText('Conectando ao radar…')).toBeInTheDocument();
  });

  it('mostra a segunda mensagem após 5 segundos', () => {
    render(<AvisoConexao ativo={true} />);

    act(() => {
      vi.advanceTimersByTime(6000);
    });

    expect(
      screen.getByText('Acordando o servidor. Aguarde alguns segundos.')
    ).toBeInTheDocument();
  });

  it('mostra a terceira mensagem após 20 segundos', () => {
    render(<AvisoConexao ativo={true} />);

    act(() => {
      vi.advanceTimersByTime(21000);
    });

    expect(
      screen.getByText(
        'O servidor estava em repouso. Isso pode levar até 50 segundos na primeira visita.'
      )
    ).toBeInTheDocument();
  });

  it('some quando ativo vira false', () => {
    const { rerender, container } = render(<AvisoConexao ativo={true} />);

    expect(container.firstChild).not.toBeNull();

    rerender(<AvisoConexao ativo={false} />);

    expect(container.firstChild).toBeNull();
  });
});
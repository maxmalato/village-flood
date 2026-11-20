# Simulação com bots

Relatórios da simulação em lote (`packages/sim`). Resumo mais recente com recomendações: [`2026-11-20-summary.md`](2026-11-20-summary.md). Os bots são a régua **relativa** entre configurações: comparam variantes dos dados com as mesmas partidas. A calibração final exige partidas com pessoas (Etapa 7).

## Como rodar

```bash
pnpm simulate                                   # linha de base, 200 partidas por célula
pnpm simulate --games 100 --difficulties normal --sizes 3,4
pnpm simulate --variant packages/sim/variants/minha-variante.json --out docs/simulation/relatorio.md
pnpm simulate --mode compositions --games 60    # todas as composições de papéis
```

Opções: `--games`, `--mode sizes|compositions`, `--difficulties`, `--sizes`, `--variant` (pode repetir), `--workers`, `--out`.

## Variantes

Uma variante é um arquivo JSON com `description` e `patch`. O `patch` é mesclado sobre os dados atuais (`packages/engine/data/`): objetos são mesclados e listas são trocadas. O resultado passa pelo schema, então uma variante inválida é recusada.

```json
{
  "description": "4 ações por turno",
  "patch": { "rules": { "actionsPerTurn": 4 } }
}
```

As variantes mudam **só dados**. Mudar a estrutura das regras é mudança de código e precisa de aprovação.

## Como ler o relatório

- **Vitória (IC 95%)**: taxa de vitória com intervalo de confiança de Wilson.
- **Alvo**: faixa das regras, seção 9 (Tranquilo 70–80%, Normal 45–60%, Tempestade 20–35%).
- **Derrota: ilhados / nível / apanhado**: parte das partidas perdidas por cada motivo.
- **Apanhados**: voluntários apanhados pela água por partida.
- **Margem de nível nas vitórias**: quantos níveis ainda faltavam para a derrota por nível quando a equipe venceu (regras, seção 13, item 10).
- No modo `compositions`: vitória **com** e **sem** cada papel, entregas duplas da Barqueira e a diferença entre a melhor e a pior composição de cada tamanho.

## O bot

Função `botMove` em `packages/bots`: avalia todas as sequências de até 3 ações do turno e escolhe a de maior pontuação. Usa só informação pública: as cartas reveladas pela previsão e a composição do baralho restante, nunca a ordem escondida. Limitação conhecida: o bot não usa o Alerta de temporal (Tempestade), então a Radialista fica subavaliada nessa dificuldade.

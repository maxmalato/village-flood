# Variedade do mapa: cenários de moradores e espelhamento (22/11/2026)

Status: **aprovado pelo dono do projeto em 21/11/2026** (opções 2 e 3) e aplicado em `packages/engine/data/`.

## O problema

O mapa "Vila do Rio" era sempre igual: as mesmas casas recebiam os moradores extras em toda partida. Com o tempo, a partida poderia ficar repetitiva.

## O que a simulação mostrou

A posição dos moradores extras pesa muito no equilíbrio. No Normal, trocar 2 casas leva a taxa de vitória de 49% a 97%. Por isso, sortear as casas livremente quebraria as faixas-alvo.

Triagem (120 partidas por cenário, sem espelho, margem de cerca de ±9 pontos):

| Dificuldade | Candidatos testados | Faixa de vitória dos candidatos |
| --- | ---: | --- |
| Tranquilo (1 extra) | 10 casas | 79% a 96% |
| Normal (2 extras) | 45 pares | 50% a 97% |
| Tempestade (3 extras) | 40 trios (amostra de 120) | 10% a 88% |

## O que foi aplicado

1. **Cenários pré-testados:** cada dificuldade tem uma lista de cenários dentro da faixa-alvo, e cada partida sorteia um.
   - Tranquilo: A4; B5; E5.
   - Normal: A4 e B5; A4 e B1; B1 e B5; A2 e A4; A2 e B5; B1 e E5.
   - Tempestade: A4, B5 e F3; A2, B1 e E5; A4, B5 e E5; B1, B5 e F3; A2, B5 e F3; B1, F3 e E5.
2. **Mapa espelhado de cima para baixo**, sorteado em metade das partidas. O rio continua à esquerda e as regras são as mesmas; a igreja, o cais e as casas trocam de linha.

Combinações por dificuldade: Tranquilo 6, Normal 12, Tempestade 12. O cenário atual ficou como o primeiro de cada lista.

## Confirmação

Relatórios: [`2026-11-22-variety.md`](2026-11-22-variety.md) (sorteio completo, 200 partidas por célula) e [`2026-11-22-variety-scenarios.md`](2026-11-22-variety-scenarios.md) (cada cenário sozinho, com espelho sorteado, 120 partidas).

| | Tranquilo (70–80%) | Normal (45–60%) | Tempestade (20–35%) |
| --- | ---: | ---: | ---: |
| Sorteio completo | 80% (no limite) | 55% | 28% |
| Cada cenário | 75% a 78% | 50% a 59% | 22% a 34% |

Observação: o mapa espelhado é o mesmo jogo para pessoas, mas o bot desempata decisões numa ordem fixa (para cima antes de para baixo) e por isso varia até cerca de 10 pontos entre as duas versões. A régua dos bots tem essa imprecisão.

## Para depois da Etapa 6

Mapas novos e cartas de evento (roadmap, seção "Ideias para depois da Etapa 6").

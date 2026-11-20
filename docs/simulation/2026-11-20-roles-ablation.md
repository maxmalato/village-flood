# Simulação com bots (2026-11-20)

Modo `compositions`, 30 partidas por composição. As mesmas sementes valem para todas as variantes. Os bots são a régua relativa entre configurações; a calibração final exige partidas com pessoas.

"Margem de nível nas vitórias": quantos níveis ainda faltavam para a derrota por nível quando a equipe venceu (regras, seção 13, item 10).

## Variante `baseline`

Dados atuais do repositório

| Dificuldade | Assentos | Partidas | Vitória (IC 95%) | Alvo | Turnos | Derrota: ilhados / nível / apanhado | Ilhados | Apanhados | Margem de nível nas vitórias |
| --- | --- | ---: | --- | --- | ---: | --- | ---: | ---: | ---: |
| Normal | 2 | 450 | 0% (0%–1%) | 45%–60% (abaixo) | 10,8 | 100% / 0% / 0% | 5,9 | 0,01 | – |
| Normal | 3 | 600 | 0% (0%–1%) | 45%–60% (abaixo) | 11,1 | 100% / 0% / 0% | 5,4 | 0,02 | – |
| Normal | 4 | 450 | 0% (0%–1%) | 45%–60% (abaixo) | 11,5 | 100% / 0% / 0% | 5,3 | 0,04 | – |
| Normal | todos | 1500 | 0% (0%–0%) | 45%–60% (abaixo) | 11,1 | 100% / 0% / 0% | 5,5 | 0,02 | – |

#### Normal: com e sem cada papel

| Papel | Vitória com | Vitória sem | Diferença | Entregas duplas por partida (com) |
| --- | ---: | ---: | ---: | ---: |
| Bombeiro | 0% | 0% | 0 p.p. | 0,08 |
| Barqueira | 0% | 0% | 0 p.p. | 0,22 |
| Engenheiro | 0% | 0% | 0 p.p. | 0,10 |
| Médica | 0% | 0% | 0 p.p. | 0,08 |
| Radialista | 0% | 0% | 0 p.p. | 0,07 |
| Vizinha | 0% | 0% | 0 p.p. | 0,00 |

| Assentos | Melhor composição | Pior composição | Diferença |
| --- | --- | --- | ---: |
| 2 | Bombeiro, Barqueira (0%) | Radialista, Vizinha (0%) | 0 p.p. |
| 3 | Bombeiro, Barqueira, Engenheiro (0%) | Médica, Radialista, Vizinha (0%) | 0 p.p. |
| 4 | Bombeiro, Barqueira, Engenheiro, Médica (0%) | Engenheiro, Médica, Radialista, Vizinha (0%) | 0 p.p. |

## Variante `calibration-a`

Pacote A (só dados): metas 8/9/10, todos começam no nível 0; baralhos de média próxima (0,72 / 0,68 / 0,68), com mais Temporais na Tempestade (mais imprevisível) e sem Temporal no Tranquilo.

| Dificuldade | Assentos | Partidas | Vitória (IC 95%) | Alvo | Turnos | Derrota: ilhados / nível / apanhado | Ilhados | Apanhados | Margem de nível nas vitórias |
| --- | --- | ---: | --- | --- | ---: | --- | ---: | ---: | ---: |
| Normal | 2 | 450 | 30% (26%–34%) | 45%–60% (abaixo) | 19,0 | 70% / 0% / 0% | 3,7 | 0,02 | 9,6 |
| Normal | 3 | 600 | 50% (46%–53%) | 45%–60% (dentro) | 22,0 | 50% / 1% / 0% | 3,4 | 0,01 | 7,4 |
| Normal | 4 | 450 | 60% (55%–64%) | 45%–60% (dentro) | 25,1 | 37% / 3% / 0% | 3,2 | 0,01 | 6,4 |
| Normal | todos | 1500 | 47% (44%–49%) | 45%–60% (dentro) | 22,0 | 52% / 1% / 0% | 3,4 | 0,01 | 7,4 |

#### Normal: com e sem cada papel

| Papel | Vitória com | Vitória sem | Diferença | Entregas duplas por partida (com) |
| --- | ---: | ---: | ---: | ---: |
| Bombeiro | 61% | 32% | +30 p.p. | 0,36 |
| Barqueira | 55% | 39% | +16 p.p. | 0,77 |
| Engenheiro | 56% | 37% | +18 p.p. | 0,35 |
| Médica | 42% | 51% | -9 p.p. | 0,33 |
| Radialista | 40% | 53% | -13 p.p. | 0,33 |
| Vizinha | 44% | 49% | -5 p.p. | 0,16 |

| Assentos | Melhor composição | Pior composição | Diferença |
| --- | --- | --- | ---: |
| 2 | Bombeiro, Vizinha (67%) | Médica, Radialista (0%) | 67 p.p. |
| 3 | Bombeiro, Barqueira, Engenheiro (100%) | Médica, Radialista, Vizinha (7%) | 93 p.p. |
| 4 | Bombeiro, Barqueira, Engenheiro, Vizinha (83%) | Barqueira, Médica, Radialista, Vizinha (20%) | 63 p.p. |

## Variante `a-boat-no-surcharge`

Pacote A, Barqueira sem custo extra ao carregar 2 (item 3).

| Dificuldade | Assentos | Partidas | Vitória (IC 95%) | Alvo | Turnos | Derrota: ilhados / nível / apanhado | Ilhados | Apanhados | Margem de nível nas vitórias |
| --- | --- | ---: | --- | --- | ---: | --- | ---: | ---: | ---: |
| Normal | 2 | 450 | 38% (34%–43%) | 45%–60% (abaixo) | 18,9 | 62% / 0% / 0% | 3,5 | 0,01 | 10,3 |
| Normal | 3 | 600 | 52% (48%–56%) | 45%–60% (dentro) | 21,5 | 48% / 0% / 0% | 3,3 | 0,01 | 8,3 |
| Normal | 4 | 450 | 65% (60%–69%) | 45%–60% (acima) | 24,5 | 33% / 3% / 0% | 3,0 | 0,01 | 7,1 |
| Normal | todos | 1500 | 52% (49%–54%) | 45%–60% (dentro) | 21,6 | 47% / 1% / 0% | 3,3 | 0,01 | 8,3 |

#### Normal: com e sem cada papel

| Papel | Vitória com | Vitória sem | Diferença | Entregas duplas por partida (com) |
| --- | ---: | ---: | ---: | ---: |
| Bombeiro | 63% | 40% | +23 p.p. | 0,42 |
| Barqueira | 65% | 39% | +26 p.p. | 0,90 |
| Engenheiro | 61% | 43% | +18 p.p. | 0,40 |
| Médica | 46% | 57% | -11 p.p. | 0,39 |
| Radialista | 45% | 59% | -14 p.p. | 0,38 |
| Vizinha | 46% | 57% | -11 p.p. | 0,20 |

| Assentos | Melhor composição | Pior composição | Diferença |
| --- | --- | --- | ---: |
| 2 | Barqueira, Engenheiro (90%) | Médica, Radialista (0%) | 90 p.p. |
| 3 | Bombeiro, Barqueira, Engenheiro (97%) | Médica, Radialista, Vizinha (7%) | 90 p.p. |
| 4 | Bombeiro, Barqueira, Engenheiro, Radialista (90%) | Engenheiro, Médica, Radialista, Vizinha (23%) | 67 p.p. |

## Variante `a-boat-capacity-1`

Pacote A, Barqueira carrega só 1 (item 3).

| Dificuldade | Assentos | Partidas | Vitória (IC 95%) | Alvo | Turnos | Derrota: ilhados / nível / apanhado | Ilhados | Apanhados | Margem de nível nas vitórias |
| --- | --- | ---: | --- | --- | ---: | --- | ---: | ---: | ---: |
| Normal | 2 | 450 | 26% (22%–30%) | 45%–60% (abaixo) | 18,7 | 74% / 0% / 0% | 3,8 | 0,01 | 9,9 |
| Normal | 3 | 600 | 41% (37%–45%) | 45%–60% (abaixo) | 21,2 | 59% / 1% / 0% | 3,5 | 0,01 | 7,6 |
| Normal | 4 | 450 | 52% (47%–56%) | 45%–60% (dentro) | 24,9 | 44% / 4% / 0% | 3,3 | 0,01 | 6,1 |
| Normal | todos | 1500 | 40% (37%–42%) | 45%–60% (abaixo) | 21,5 | 59% / 2% / 0% | 3,5 | 0,01 | 7,4 |

#### Normal: com e sem cada papel

| Papel | Vitória com | Vitória sem | Diferença | Entregas duplas por partida (com) |
| --- | ---: | ---: | ---: | ---: |
| Bombeiro | 53% | 26% | +27 p.p. | 0,00 |
| Barqueira | 40% | 39% | +1 p.p. | 0,00 |
| Engenheiro | 51% | 29% | +22 p.p. | 0,00 |
| Médica | 36% | 43% | -7 p.p. | 0,00 |
| Radialista | 33% | 46% | -12 p.p. | 0,00 |
| Vizinha | 39% | 40% | 0 p.p. | 0,00 |

| Assentos | Melhor composição | Pior composição | Diferença |
| --- | --- | --- | ---: |
| 2 | Bombeiro, Vizinha (67%) | Médica, Radialista (0%) | 67 p.p. |
| 3 | Bombeiro, Barqueira, Engenheiro (87%) | Médica, Radialista, Vizinha (7%) | 80 p.p. |
| 4 | Bombeiro, Barqueira, Engenheiro, Radialista (73%) | Barqueira, Médica, Radialista, Vizinha (17%) | 57 p.p. |

## Variante `a-firefighter-pickup-2`

Pacote A, Bombeiro paga 2 para pegar ferido, como os outros (item 4).

| Dificuldade | Assentos | Partidas | Vitória (IC 95%) | Alvo | Turnos | Derrota: ilhados / nível / apanhado | Ilhados | Apanhados | Margem de nível nas vitórias |
| --- | --- | ---: | --- | --- | ---: | --- | ---: | ---: | ---: |
| Normal | 2 | 450 | 24% (20%–28%) | 45%–60% (abaixo) | 18,8 | 76% / 0% / 0% | 3,8 | 0,02 | 9,4 |
| Normal | 3 | 600 | 43% (39%–47%) | 45%–60% (abaixo) | 21,9 | 56% / 1% / 0% | 3,5 | 0,01 | 7,0 |
| Normal | 4 | 450 | 55% (51%–60%) | 45%–60% (dentro) | 25,0 | 42% / 3% / 0% | 3,3 | 0,02 | 6,2 |
| Normal | todos | 1500 | 41% (39%–44%) | 45%–60% (abaixo) | 21,9 | 58% / 1% / 0% | 3,5 | 0,02 | 7,1 |

#### Normal: com e sem cada papel

| Papel | Vitória com | Vitória sem | Diferença | Entregas duplas por partida (com) |
| --- | ---: | ---: | ---: | ---: |
| Bombeiro | 50% | 32% | +18 p.p. | 0,37 |
| Barqueira | 51% | 31% | +19 p.p. | 0,77 |
| Engenheiro | 51% | 31% | +19 p.p. | 0,35 |
| Médica | 39% | 43% | -3 p.p. | 0,33 |
| Radialista | 35% | 47% | -12 p.p. | 0,32 |
| Vizinha | 39% | 43% | -4 p.p. | 0,16 |

| Assentos | Melhor composição | Pior composição | Diferença |
| --- | --- | --- | ---: |
| 2 | Barqueira, Engenheiro (53%) | Médica, Radialista (0%) | 53 p.p. |
| 3 | Bombeiro, Barqueira, Engenheiro (87%) | Médica, Radialista, Vizinha (7%) | 80 p.p. |
| 4 | Bombeiro, Barqueira, Engenheiro, Vizinha (77%) | Barqueira, Médica, Radialista, Vizinha (20%) | 57 p.p. |

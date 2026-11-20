# Simulação com bots (2026-11-20)

Modo `compositions`, 30 partidas por composição. As mesmas sementes valem para todas as variantes. Os bots são a régua relativa entre configurações; a calibração final exige partidas com pessoas.

"Margem de nível nas vitórias": quantos níveis ainda faltavam para a derrota por nível quando a equipe venceu (regras, seção 13, item 10).

## Variante `baseline`

Dados atuais do repositório

| Dificuldade | Assentos | Partidas | Vitória (IC 95%) | Alvo | Turnos | Derrota: ilhados / nível / apanhado | Ilhados | Apanhados | Margem de nível nas vitórias |
| --- | --- | ---: | --- | --- | ---: | --- | ---: | ---: | ---: |
| Tranquilo | 2 | 450 | 72% (67%–76%) | 70%–80% (dentro) | 18,9 | 28% / 0% / 0% | 3,0 | 0,00 | 9,2 |
| Tranquilo | 3 | 600 | 76% (73%–80%) | 70%–80% (dentro) | 21,1 | 23% / 1% / 0% | 2,7 | 0,01 | 8,0 |
| Tranquilo | 4 | 450 | 82% (79%–86%) | 70%–80% (acima) | 24,5 | 15% / 3% / 0% | 2,7 | 0,01 | 5,6 |
| Tranquilo | todos | 1500 | 77% (75%–79%) | 70%–80% (dentro) | 21,5 | 22% / 1% / 0% | 2,8 | 0,01 | 7,6 |
| Normal | 2 | 450 | 35% (30%–39%) | 45%–60% (abaixo) | 19,0 | 65% / 0% / 0% | 3,6 | 0,01 | 9,3 |
| Normal | 3 | 600 | 53% (49%–57%) | 45%–60% (dentro) | 22,2 | 45% / 1% / 0% | 3,3 | 0,01 | 7,1 |
| Normal | 4 | 450 | 67% (62%–71%) | 45%–60% (acima) | 25,1 | 30% / 3% / 0% | 3,0 | 0,02 | 6,4 |
| Normal | todos | 1500 | 52% (49%–54%) | 45%–60% (dentro) | 22,1 | 47% / 1% / 0% | 3,3 | 0,01 | 7,3 |
| Tempestade | 2 | 450 | 17% (14%–21%) | 20%–35% (abaixo) | 18,6 | 83% / 0% / 0% | 4,3 | 0,01 | 8,4 |
| Tempestade | 3 | 600 | 31% (27%–35%) | 20%–35% (dentro) | 21,2 | 67% / 2% / 0% | 4,0 | 0,05 | 6,4 |
| Tempestade | 4 | 450 | 33% (29%–37%) | 20%–35% (dentro) | 23,2 | 62% / 5% / 0% | 3,7 | 0,07 | 5,8 |
| Tempestade | todos | 1500 | 27% (25%–30%) | 20%–35% (dentro) | 21,0 | 70% / 2% / 0% | 4,0 | 0,05 | 6,6 |

#### Tranquilo: com e sem cada papel

| Papel | Vitória com | Vitória sem | Diferença | Por partida, com o papel: entregas duplas / curas / chamados pelo rádio |
| --- | ---: | ---: | ---: | ---: |
| Bombeiro | 81% | 73% | +8 p.p. | 0,38 / 1,12 / 2,02 |
| Barqueira | 82% | 72% | +10 p.p. | 0,83 / 1,17 / 2,16 |
| Engenheiro | 82% | 72% | +10 p.p. | 0,37 / 1,20 / 2,19 |
| Médica | 81% | 73% | +7 p.p. | 0,35 / 2,54 / 1,99 |
| Radialista | 76% | 77% | -1 p.p. | 0,39 / 1,07 / 4,95 |
| Vizinha | 66% | 87% | -21 p.p. | 0,19 / 1,19 / 2,05 |

| Assentos | Melhor composição | Pior composição | Diferença |
| --- | --- | --- | ---: |
| 2 | Bombeiro, Barqueira (97%) | Radialista, Vizinha (47%) | 50 p.p. |
| 3 | Bombeiro, Barqueira, Médica (100%) | Barqueira, Médica, Vizinha (40%) | 60 p.p. |
| 4 | Bombeiro, Barqueira, Engenheiro, Médica (97%) | Bombeiro, Engenheiro, Radialista, Vizinha (50%) | 47 p.p. |

#### Normal: com e sem cada papel

| Papel | Vitória com | Vitória sem | Diferença | Por partida, com o papel: entregas duplas / curas / chamados pelo rádio |
| --- | ---: | ---: | ---: | ---: |
| Bombeiro | 56% | 48% | +8 p.p. | 0,36 / 1,19 / 2,06 |
| Barqueira | 59% | 44% | +15 p.p. | 0,82 / 1,19 / 2,13 |
| Engenheiro | 61% | 42% | +19 p.p. | 0,38 / 1,30 / 2,32 |
| Médica | 54% | 50% | +4 p.p. | 0,35 / 2,66 / 2,01 |
| Radialista | 52% | 51% | +1 p.p. | 0,37 / 1,09 / 5,08 |
| Vizinha | 48% | 56% | -8 p.p. | 0,17 / 1,13 / 2,15 |

| Assentos | Melhor composição | Pior composição | Diferença |
| --- | --- | --- | ---: |
| 2 | Radialista, Vizinha (67%) | Médica, Radialista (3%) | 63 p.p. |
| 3 | Bombeiro, Barqueira, Engenheiro (87%) | Barqueira, Médica, Vizinha (17%) | 70 p.p. |
| 4 | Barqueira, Engenheiro, Médica, Radialista (93%) | Bombeiro, Engenheiro, Radialista, Vizinha (43%) | 50 p.p. |

#### Tempestade: com e sem cada papel

| Papel | Vitória com | Vitória sem | Diferença | Por partida, com o papel: entregas duplas / curas / chamados pelo rádio |
| --- | ---: | ---: | ---: | ---: |
| Bombeiro | 28% | 27% | +1 p.p. | 0,32 / 1,38 / 1,90 |
| Barqueira | 32% | 23% | +8 p.p. | 0,81 / 1,44 / 2,02 |
| Engenheiro | 36% | 19% | +17 p.p. | 0,40 / 1,52 / 2,28 |
| Médica | 30% | 25% | +5 p.p. | 0,35 / 3,25 / 1,88 |
| Radialista | 27% | 27% | 0 p.p. | 0,36 / 1,45 / 4,76 |
| Vizinha | 21% | 34% | -13 p.p. | 0,13 / 1,48 / 1,92 |

| Assentos | Melhor composição | Pior composição | Diferença |
| --- | --- | --- | ---: |
| 2 | Barqueira, Engenheiro (33%) | Barqueira, Vizinha (3%) | 30 p.p. |
| 3 | Barqueira, Engenheiro, Médica (63%) | Barqueira, Radialista, Vizinha (0%) | 63 p.p. |
| 4 | Barqueira, Engenheiro, Médica, Radialista (57%) | Bombeiro, Médica, Radialista, Vizinha (7%) | 50 p.p. |

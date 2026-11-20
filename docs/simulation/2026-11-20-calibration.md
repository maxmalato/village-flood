# Simulação com bots (2026-11-20)

Modo `sizes`, 200 partidas por célula (dificuldade × assentos, composições em rodízio). As mesmas sementes valem para todas as variantes. Os bots são a régua relativa entre configurações; a calibração final exige partidas com pessoas.

"Margem de nível nas vitórias": quantos níveis ainda faltavam para a derrota por nível quando a equipe venceu (regras, seção 13, item 10).

## Variante `baseline`

Dados atuais do repositório

| Dificuldade | Assentos | Partidas | Vitória (IC 95%) | Alvo | Turnos | Derrota: ilhados / nível / apanhado | Ilhados | Apanhados | Margem de nível nas vitórias |
| --- | --- | ---: | --- | --- | ---: | --- | ---: | ---: | ---: |
| Tranquilo | 2 | 200 | 57% (51%–64%) | 70%–80% (abaixo) | 17,7 | 43% / 0% / 0% | 2,9 | 0,03 | 10,3 |
| Tranquilo | 3 | 200 | 74% (68%–80%) | 70%–80% (dentro) | 21,1 | 24% / 2% / 0% | 2,8 | 0,02 | 7,6 |
| Tranquilo | 4 | 200 | 76% (70%–81%) | 70%–80% (dentro) | 23,8 | 23% / 1% / 0% | 2,7 | 0,01 | 5,8 |
| Tranquilo | todos | 600 | 69% (65%–73%) | 70%–80% (abaixo) | 20,9 | 30% / 1% / 0% | 2,8 | 0,02 | 7,7 |
| Normal | 2 | 200 | 0% (0%–2%) | 45%–60% (abaixo) | 10,6 | 100% / 0% / 0% | 5,9 | 0,01 | – |
| Normal | 3 | 200 | 0% (0%–2%) | 45%–60% (abaixo) | 11,2 | 100% / 0% / 0% | 5,5 | 0,01 | – |
| Normal | 4 | 200 | 0% (0%–2%) | 45%–60% (abaixo) | 11,8 | 100% / 0% / 0% | 5,2 | 0,02 | – |
| Normal | todos | 600 | 0% (0%–1%) | 45%–60% (abaixo) | 11,2 | 100% / 0% / 0% | 5,5 | 0,01 | – |
| Tempestade | 2 | 200 | 0% (0%–2%) | 20%–35% (abaixo) | 5,4 | 100% / 0% / 0% | 8,3 | 0,01 | – |
| Tempestade | 3 | 200 | 0% (0%–2%) | 20%–35% (abaixo) | 5,5 | 100% / 0% / 0% | 8,2 | 0,04 | – |
| Tempestade | 4 | 200 | 0% (0%–2%) | 20%–35% (abaixo) | 5,3 | 100% / 0% / 0% | 8,6 | 0,00 | – |
| Tempestade | todos | 600 | 0% (0%–1%) | 20%–35% (abaixo) | 5,4 | 100% / 0% / 0% | 8,4 | 0,02 | – |

## Variante `calibration-a`

Pacote A (só dados): metas 8/9/10, todos começam no nível 0; baralhos de média próxima (0,72 / 0,68 / 0,68), com mais Temporais na Tempestade (mais imprevisível) e sem Temporal no Tranquilo.

| Dificuldade | Assentos | Partidas | Vitória (IC 95%) | Alvo | Turnos | Derrota: ilhados / nível / apanhado | Ilhados | Apanhados | Margem de nível nas vitórias |
| --- | --- | ---: | --- | --- | ---: | --- | ---: | ---: | ---: |
| Tranquilo | 2 | 200 | 71% (64%–77%) | 70%–80% (dentro) | 19,0 | 29% / 0% / 0% | 2,6 | 0,00 | 10,5 |
| Tranquilo | 3 | 200 | 82% (76%–86%) | 70%–80% (acima) | 21,5 | 18% / 1% / 0% | 2,5 | 0,00 | 8,3 |
| Tranquilo | 4 | 200 | 86% (80%–90%) | 70%–80% (acima) | 24,4 | 13% / 2% / 0% | 2,3 | 0,01 | 6,9 |
| Tranquilo | todos | 600 | 79% (76%–82%) | 70%–80% (dentro) | 21,6 | 20% / 1% / 0% | 2,5 | 0,00 | 8,4 |
| Normal | 2 | 200 | 26% (20%–32%) | 45%–60% (abaixo) | 18,5 | 75% / 0% / 0% | 3,8 | 0,03 | 9,3 |
| Normal | 3 | 200 | 54% (47%–60%) | 45%–60% (dentro) | 22,1 | 47% / 0% / 0% | 3,3 | 0,01 | 7,2 |
| Normal | 4 | 200 | 60% (53%–67%) | 45%–60% (dentro) | 25,1 | 38% / 2% / 0% | 3,2 | 0,04 | 6,1 |
| Normal | todos | 600 | 46% (42%–50%) | 45%–60% (dentro) | 21,9 | 53% / 1% / 0% | 3,4 | 0,02 | 7,1 |
| Tempestade | 2 | 200 | 20% (15%–26%) | 20%–35% (dentro) | 18,8 | 80% / 1% / 0% | 4,3 | 0,02 | 8,1 |
| Tempestade | 3 | 200 | 31% (25%–37%) | 20%–35% (dentro) | 21,1 | 68% / 2% / 0% | 4,1 | 0,04 | 6,7 |
| Tempestade | 4 | 200 | 22% (17%–28%) | 20%–35% (dentro) | 22,5 | 74% / 5% / 0% | 4,0 | 0,04 | 5,9 |
| Tempestade | todos | 600 | 24% (21%–28%) | 20%–35% (dentro) | 20,8 | 74% / 2% / 0% | 4,1 | 0,03 | 6,8 |

## Variante `calibration-b`

Pacote B: o A com 4 ações por turno e baralhos de média próxima de 1 (1,00 / 0,96 / 1,00).

| Dificuldade | Assentos | Partidas | Vitória (IC 95%) | Alvo | Turnos | Derrota: ilhados / nível / apanhado | Ilhados | Apanhados | Margem de nível nas vitórias |
| --- | --- | ---: | --- | --- | ---: | --- | ---: | ---: | ---: |
| Tranquilo | 2 | 200 | 84% (78%–88%) | 70%–80% (acima) | 14,7 | 17% / 0% / 0% | 2,4 | 0,01 | 9,8 |
| Tranquilo | 3 | 200 | 82% (76%–87%) | 70%–80% (acima) | 16,5 | 17% / 2% / 0% | 2,4 | 0,04 | 7,8 |
| Tranquilo | 4 | 200 | 90% (84%–93%) | 70%–80% (acima) | 17,4 | 9% / 2% / 0% | 2,2 | 0,01 | 7,5 |
| Tranquilo | todos | 600 | 85% (82%–88%) | 70%–80% (acima) | 16,2 | 14% / 1% / 0% | 2,3 | 0,02 | 8,4 |
| Normal | 2 | 200 | 46% (39%–52%) | 45%–60% (dentro) | 14,5 | 55% / 0% / 0% | 3,3 | 0,02 | 9,8 |
| Normal | 3 | 200 | 56% (50%–63%) | 45%–60% (dentro) | 16,6 | 42% / 2% / 0% | 3,2 | 0,03 | 7,4 |
| Normal | 4 | 200 | 66% (59%–72%) | 45%–60% (acima) | 18,4 | 29% / 6% / 0% | 2,9 | 0,06 | 6,1 |
| Normal | todos | 600 | 56% (52%–60%) | 45%–60% (dentro) | 16,5 | 42% / 3% / 0% | 3,2 | 0,04 | 7,5 |
| Tempestade | 2 | 200 | 27% (21%–34%) | 20%–35% (dentro) | 13,8 | 73% / 0% / 0% | 4,1 | 0,04 | 8,4 |
| Tempestade | 3 | 200 | 26% (20%–32%) | 20%–35% (dentro) | 14,7 | 72% / 3% / 0% | 4,0 | 0,06 | 7,1 |
| Tempestade | 4 | 200 | 19% (14%–24%) | 20%–35% (abaixo) | 15,4 | 73% / 9% / 0% | 4,0 | 0,07 | 5,9 |
| Tempestade | todos | 600 | 24% (21%–27%) | 20%–35% (dentro) | 14,6 | 73% / 4% / 0% | 4,0 | 0,06 | 7,3 |

## Variante `a-swept-no-rain`

Pacote A, sem chuva no turno perdido do voluntário apanhado (item 2).

| Dificuldade | Assentos | Partidas | Vitória (IC 95%) | Alvo | Turnos | Derrota: ilhados / nível / apanhado | Ilhados | Apanhados | Margem de nível nas vitórias |
| --- | --- | ---: | --- | --- | ---: | --- | ---: | ---: | ---: |
| Tranquilo | 2 | 200 | 71% (64%–77%) | 70%–80% (dentro) | 19,0 | 29% / 0% / 0% | 2,6 | 0,00 | 10,5 |
| Tranquilo | 3 | 200 | 82% (76%–86%) | 70%–80% (acima) | 21,5 | 18% / 1% / 0% | 2,5 | 0,00 | 8,3 |
| Tranquilo | 4 | 200 | 86% (80%–90%) | 70%–80% (acima) | 24,4 | 13% / 2% / 0% | 2,3 | 0,01 | 6,9 |
| Tranquilo | todos | 600 | 79% (76%–82%) | 70%–80% (dentro) | 21,6 | 20% / 1% / 0% | 2,5 | 0,00 | 8,4 |
| Normal | 2 | 200 | 26% (20%–32%) | 45%–60% (abaixo) | 18,5 | 75% / 0% / 0% | 3,8 | 0,03 | 9,3 |
| Normal | 3 | 200 | 54% (47%–60%) | 45%–60% (dentro) | 22,1 | 47% / 0% / 0% | 3,3 | 0,01 | 7,2 |
| Normal | 4 | 200 | 60% (53%–67%) | 45%–60% (dentro) | 25,2 | 38% / 3% / 0% | 3,2 | 0,04 | 6,1 |
| Normal | todos | 600 | 46% (42%–50%) | 45%–60% (dentro) | 21,9 | 53% / 1% / 0% | 3,4 | 0,02 | 7,1 |
| Tempestade | 2 | 200 | 20% (15%–26%) | 20%–35% (dentro) | 18,8 | 80% / 1% / 0% | 4,3 | 0,02 | 8,1 |
| Tempestade | 3 | 200 | 31% (25%–37%) | 20%–35% (dentro) | 21,1 | 68% / 2% / 0% | 4,1 | 0,04 | 6,7 |
| Tempestade | 4 | 200 | 22% (17%–28%) | 20%–35% (dentro) | 22,5 | 74% / 5% / 0% | 4,0 | 0,04 | 5,9 |
| Tempestade | todos | 600 | 24% (21%–28%) | 20%–35% (dentro) | 20,8 | 74% / 2% / 0% | 4,1 | 0,03 | 6,8 |

## Variante `a-swept-loss-storm`

Pacote A, derrota imediata se alguém for apanhado na Tempestade (item 2).

| Dificuldade | Assentos | Partidas | Vitória (IC 95%) | Alvo | Turnos | Derrota: ilhados / nível / apanhado | Ilhados | Apanhados | Margem de nível nas vitórias |
| --- | --- | ---: | --- | --- | ---: | --- | ---: | ---: | ---: |
| Tranquilo | 2 | 200 | 71% (64%–77%) | 70%–80% (dentro) | 19,0 | 29% / 0% / 0% | 2,6 | 0,00 | 10,5 |
| Tranquilo | 3 | 200 | 82% (76%–86%) | 70%–80% (acima) | 21,5 | 18% / 1% / 0% | 2,5 | 0,00 | 8,3 |
| Tranquilo | 4 | 200 | 86% (80%–90%) | 70%–80% (acima) | 24,4 | 13% / 2% / 0% | 2,3 | 0,01 | 6,9 |
| Tranquilo | todos | 600 | 79% (76%–82%) | 70%–80% (dentro) | 21,6 | 20% / 1% / 0% | 2,5 | 0,00 | 8,4 |
| Normal | 2 | 200 | 26% (20%–32%) | 45%–60% (abaixo) | 18,5 | 75% / 0% / 0% | 3,8 | 0,03 | 9,3 |
| Normal | 3 | 200 | 54% (47%–60%) | 45%–60% (dentro) | 22,1 | 47% / 0% / 0% | 3,3 | 0,01 | 7,2 |
| Normal | 4 | 200 | 60% (53%–67%) | 45%–60% (dentro) | 25,1 | 38% / 2% / 0% | 3,2 | 0,04 | 6,1 |
| Normal | todos | 600 | 46% (42%–50%) | 45%–60% (dentro) | 21,9 | 53% / 1% / 0% | 3,4 | 0,02 | 7,1 |
| Tempestade | 2 | 200 | 20% (15%–26%) | 20%–35% (dentro) | 18,8 | 80% / 1% / 0% | 4,3 | 0,02 | 8,1 |
| Tempestade | 3 | 200 | 31% (25%–37%) | 20%–35% (dentro) | 21,1 | 68% / 2% / 0% | 4,1 | 0,04 | 6,7 |
| Tempestade | 4 | 200 | 22% (17%–28%) | 20%–35% (dentro) | 22,3 | 72% / 5% / 2% | 3,9 | 0,04 | 5,9 |
| Tempestade | todos | 600 | 24% (21%–28%) | 20%–35% (dentro) | 20,7 | 73% / 2% / 1% | 4,1 | 0,03 | 6,8 |

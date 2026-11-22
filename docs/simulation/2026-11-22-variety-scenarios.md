# Simulação com bots (2026-11-22)

Modo `sizes`, 120 partidas por célula (dificuldade × assentos, composições em rodízio). As mesmas sementes valem para todas as variantes. Os bots são a régua relativa entre configurações; a calibração final exige partidas com pessoas.

"Margem de nível nas vitórias": quantos níveis ainda faltavam para a derrota por nível quando a equipe venceu (regras, seção 13, item 10).

## Variante `baseline`

Dados atuais do repositório

| Dificuldade | Assentos | Partidas | Vitória (IC 95%) | Alvo | Turnos | Derrota: ilhados / nível / apanhado | Ilhados | Apanhados | Margem de nível nas vitórias |
| --- | --- | ---: | --- | --- | ---: | --- | ---: | ---: | ---: |
| Tranquilo | 2 | 120 | 68% (60%–76%) | 70%–80% (abaixo) | 18,6 | 32% / 0% / 0% | 3,1 | 0,00 | 9,2 |
| Tranquilo | 3 | 120 | 79% (71%–85%) | 70%–80% (dentro) | 20,8 | 20% / 1% / 0% | 2,8 | 0,00 | 8,0 |
| Tranquilo | 4 | 120 | 81% (73%–87%) | 70%–80% (acima) | 24,7 | 13% / 7% / 0% | 2,6 | 0,01 | 5,4 |
| Tranquilo | todos | 360 | 76% (71%–80%) | 70%–80% (dentro) | 21,4 | 21% / 3% / 0% | 2,8 | 0,00 | 7,4 |
| Normal | 2 | 120 | 44% (36%–53%) | 45%–60% (abaixo) | 19,3 | 56% / 0% / 0% | 3,4 | 0,02 | 9,3 |
| Normal | 3 | 120 | 50% (41%–59%) | 45%–60% (dentro) | 21,4 | 49% / 1% / 0% | 3,3 | 0,03 | 7,3 |
| Normal | 4 | 120 | 73% (64%–80%) | 45%–60% (acima) | 24,2 | 26% / 2% / 0% | 3,0 | 0,04 | 6,7 |
| Normal | todos | 360 | 56% (50%–61%) | 45%–60% (dentro) | 21,6 | 44% / 1% / 0% | 3,2 | 0,03 | 7,6 |
| Tempestade | 2 | 120 | 18% (12%–26%) | 20%–35% (abaixo) | 19,0 | 82% / 0% / 0% | 4,1 | 0,02 | 8,4 |
| Tempestade | 3 | 120 | 31% (23%–40%) | 20%–35% (dentro) | 20,6 | 68% / 1% / 0% | 4,1 | 0,05 | 6,0 |
| Tempestade | 4 | 120 | 33% (26%–42%) | 20%–35% (dentro) | 22,4 | 63% / 4% / 0% | 3,8 | 0,05 | 6,1 |
| Tempestade | todos | 360 | 28% (23%–32%) | 20%–35% (dentro) | 20,7 | 71% / 2% / 0% | 4,0 | 0,04 | 6,6 |

## Variante `easy-A4`

easy: só o cenário A4 (com espelho sorteado)

| Dificuldade | Assentos | Partidas | Vitória (IC 95%) | Alvo | Turnos | Derrota: ilhados / nível / apanhado | Ilhados | Apanhados | Margem de nível nas vitórias |
| --- | --- | ---: | --- | --- | ---: | --- | ---: | ---: | ---: |
| Tranquilo | 2 | 120 | 68% (60%–76%) | 70%–80% (abaixo) | 18,5 | 32% / 0% / 0% | 3,1 | 0,00 | 9,3 |
| Tranquilo | 3 | 120 | 79% (71%–85%) | 70%–80% (dentro) | 20,6 | 20% / 1% / 0% | 2,8 | 0,00 | 8,1 |
| Tranquilo | 4 | 120 | 78% (69%–84%) | 70%–80% (dentro) | 24,4 | 18% / 4% / 0% | 2,8 | 0,00 | 5,6 |
| Tranquilo | todos | 360 | 75% (70%–79%) | 70%–80% (dentro) | 21,1 | 23% / 2% / 0% | 2,9 | 0,00 | 7,6 |
| Normal | 2 | 120 | 44% (36%–53%) | 45%–60% (abaixo) | 19,3 | 56% / 0% / 0% | 3,4 | 0,02 | 9,3 |
| Normal | 3 | 120 | 50% (41%–59%) | 45%–60% (dentro) | 21,4 | 49% / 1% / 0% | 3,3 | 0,03 | 7,3 |
| Normal | 4 | 120 | 73% (64%–80%) | 45%–60% (acima) | 24,2 | 26% / 2% / 0% | 3,0 | 0,04 | 6,7 |
| Normal | todos | 360 | 56% (50%–61%) | 45%–60% (dentro) | 21,6 | 44% / 1% / 0% | 3,2 | 0,03 | 7,6 |
| Tempestade | 2 | 120 | 18% (12%–26%) | 20%–35% (abaixo) | 19,0 | 82% / 0% / 0% | 4,1 | 0,02 | 8,4 |
| Tempestade | 3 | 120 | 31% (23%–40%) | 20%–35% (dentro) | 20,6 | 68% / 1% / 0% | 4,1 | 0,05 | 6,0 |
| Tempestade | 4 | 120 | 33% (26%–42%) | 20%–35% (dentro) | 22,4 | 63% / 4% / 0% | 3,8 | 0,05 | 6,1 |
| Tempestade | todos | 360 | 28% (23%–32%) | 20%–35% (dentro) | 20,7 | 71% / 2% / 0% | 4,0 | 0,04 | 6,6 |

## Variante `easy-B5`

easy: só o cenário B5 (com espelho sorteado)

| Dificuldade | Assentos | Partidas | Vitória (IC 95%) | Alvo | Turnos | Derrota: ilhados / nível / apanhado | Ilhados | Apanhados | Margem de nível nas vitórias |
| --- | --- | ---: | --- | --- | ---: | --- | ---: | ---: | ---: |
| Tranquilo | 2 | 120 | 67% (58%–74%) | 70%–80% (abaixo) | 18,4 | 33% / 0% / 0% | 3,2 | 0,00 | 9,3 |
| Tranquilo | 3 | 120 | 78% (70%–85%) | 70%–80% (dentro) | 20,4 | 22% / 0% / 0% | 2,8 | 0,00 | 8,1 |
| Tranquilo | 4 | 120 | 83% (75%–88%) | 70%–80% (acima) | 24,1 | 14% / 3% / 0% | 2,7 | 0,00 | 5,8 |
| Tranquilo | todos | 360 | 76% (71%–80%) | 70%–80% (dentro) | 21,0 | 23% / 1% / 0% | 2,9 | 0,00 | 7,6 |
| Normal | 2 | 120 | 44% (36%–53%) | 45%–60% (abaixo) | 19,3 | 56% / 0% / 0% | 3,4 | 0,02 | 9,3 |
| Normal | 3 | 120 | 50% (41%–59%) | 45%–60% (dentro) | 21,4 | 49% / 1% / 0% | 3,3 | 0,03 | 7,3 |
| Normal | 4 | 120 | 73% (64%–80%) | 45%–60% (acima) | 24,2 | 26% / 2% / 0% | 3,0 | 0,04 | 6,7 |
| Normal | todos | 360 | 56% (50%–61%) | 45%–60% (dentro) | 21,6 | 44% / 1% / 0% | 3,2 | 0,03 | 7,6 |
| Tempestade | 2 | 120 | 18% (12%–26%) | 20%–35% (abaixo) | 19,0 | 82% / 0% / 0% | 4,1 | 0,02 | 8,4 |
| Tempestade | 3 | 120 | 31% (23%–40%) | 20%–35% (dentro) | 20,6 | 68% / 1% / 0% | 4,1 | 0,05 | 6,0 |
| Tempestade | 4 | 120 | 33% (26%–42%) | 20%–35% (dentro) | 22,4 | 63% / 4% / 0% | 3,8 | 0,05 | 6,1 |
| Tempestade | todos | 360 | 28% (23%–32%) | 20%–35% (dentro) | 20,7 | 71% / 2% / 0% | 4,0 | 0,04 | 6,6 |

## Variante `easy-E5`

easy: só o cenário E5 (com espelho sorteado)

| Dificuldade | Assentos | Partidas | Vitória (IC 95%) | Alvo | Turnos | Derrota: ilhados / nível / apanhado | Ilhados | Apanhados | Margem de nível nas vitórias |
| --- | --- | ---: | --- | --- | ---: | --- | ---: | ---: | ---: |
| Tranquilo | 2 | 120 | 71% (62%–78%) | 70%–80% (dentro) | 19,3 | 29% / 0% / 0% | 3,0 | 0,00 | 8,9 |
| Tranquilo | 3 | 120 | 78% (70%–85%) | 70%–80% (dentro) | 21,3 | 18% / 3% / 0% | 2,6 | 0,02 | 7,8 |
| Tranquilo | 4 | 120 | 83% (76%–89%) | 70%–80% (acima) | 25,0 | 10% / 7% / 0% | 2,5 | 0,02 | 5,3 |
| Tranquilo | todos | 360 | 78% (73%–82%) | 70%–80% (dentro) | 21,9 | 19% / 3% / 0% | 2,7 | 0,01 | 7,2 |
| Normal | 2 | 120 | 44% (36%–53%) | 45%–60% (abaixo) | 19,3 | 56% / 0% / 0% | 3,4 | 0,02 | 9,3 |
| Normal | 3 | 120 | 50% (41%–59%) | 45%–60% (dentro) | 21,4 | 49% / 1% / 0% | 3,3 | 0,03 | 7,3 |
| Normal | 4 | 120 | 73% (64%–80%) | 45%–60% (acima) | 24,2 | 26% / 2% / 0% | 3,0 | 0,04 | 6,7 |
| Normal | todos | 360 | 56% (50%–61%) | 45%–60% (dentro) | 21,6 | 44% / 1% / 0% | 3,2 | 0,03 | 7,6 |
| Tempestade | 2 | 120 | 18% (12%–26%) | 20%–35% (abaixo) | 19,0 | 82% / 0% / 0% | 4,1 | 0,02 | 8,4 |
| Tempestade | 3 | 120 | 31% (23%–40%) | 20%–35% (dentro) | 20,6 | 68% / 1% / 0% | 4,1 | 0,05 | 6,0 |
| Tempestade | 4 | 120 | 33% (26%–42%) | 20%–35% (dentro) | 22,4 | 63% / 4% / 0% | 3,8 | 0,05 | 6,1 |
| Tempestade | todos | 360 | 28% (23%–32%) | 20%–35% (dentro) | 20,7 | 71% / 2% / 0% | 4,0 | 0,04 | 6,6 |

## Variante `normal-A2-A4`

normal: só o cenário A2, A4 (com espelho sorteado)

| Dificuldade | Assentos | Partidas | Vitória (IC 95%) | Alvo | Turnos | Derrota: ilhados / nível / apanhado | Ilhados | Apanhados | Margem de nível nas vitórias |
| --- | --- | ---: | --- | --- | ---: | --- | ---: | ---: | ---: |
| Tranquilo | 2 | 120 | 68% (60%–76%) | 70%–80% (abaixo) | 18,6 | 32% / 0% / 0% | 3,1 | 0,00 | 9,2 |
| Tranquilo | 3 | 120 | 79% (71%–85%) | 70%–80% (dentro) | 20,8 | 20% / 1% / 0% | 2,8 | 0,00 | 8,0 |
| Tranquilo | 4 | 120 | 81% (73%–87%) | 70%–80% (acima) | 24,7 | 13% / 7% / 0% | 2,6 | 0,01 | 5,4 |
| Tranquilo | todos | 360 | 76% (71%–80%) | 70%–80% (dentro) | 21,4 | 21% / 3% / 0% | 2,8 | 0,00 | 7,4 |
| Normal | 2 | 120 | 43% (35%–52%) | 45%–60% (abaixo) | 19,7 | 57% / 0% / 0% | 3,5 | 0,02 | 9,3 |
| Normal | 3 | 120 | 56% (47%–64%) | 45%–60% (dentro) | 22,4 | 43% / 2% / 0% | 3,3 | 0,03 | 7,1 |
| Normal | 4 | 120 | 71% (62%–78%) | 45%–60% (acima) | 24,8 | 28% / 1% / 0% | 2,9 | 0,04 | 6,4 |
| Normal | todos | 360 | 57% (52%–62%) | 45%–60% (dentro) | 22,3 | 43% / 1% / 0% | 3,2 | 0,03 | 7,4 |
| Tempestade | 2 | 120 | 18% (12%–26%) | 20%–35% (abaixo) | 19,0 | 82% / 0% / 0% | 4,1 | 0,02 | 8,4 |
| Tempestade | 3 | 120 | 31% (23%–40%) | 20%–35% (dentro) | 20,6 | 68% / 1% / 0% | 4,1 | 0,05 | 6,0 |
| Tempestade | 4 | 120 | 33% (26%–42%) | 20%–35% (dentro) | 22,4 | 63% / 4% / 0% | 3,8 | 0,05 | 6,1 |
| Tempestade | todos | 360 | 28% (23%–32%) | 20%–35% (dentro) | 20,7 | 71% / 2% / 0% | 4,0 | 0,04 | 6,6 |

## Variante `normal-A2-B5`

normal: só o cenário A2, B5 (com espelho sorteado)

| Dificuldade | Assentos | Partidas | Vitória (IC 95%) | Alvo | Turnos | Derrota: ilhados / nível / apanhado | Ilhados | Apanhados | Margem de nível nas vitórias |
| --- | --- | ---: | --- | --- | ---: | --- | ---: | ---: | ---: |
| Tranquilo | 2 | 120 | 68% (60%–76%) | 70%–80% (abaixo) | 18,6 | 32% / 0% / 0% | 3,1 | 0,00 | 9,2 |
| Tranquilo | 3 | 120 | 79% (71%–85%) | 70%–80% (dentro) | 20,8 | 20% / 1% / 0% | 2,8 | 0,00 | 8,0 |
| Tranquilo | 4 | 120 | 81% (73%–87%) | 70%–80% (acima) | 24,7 | 13% / 7% / 0% | 2,6 | 0,01 | 5,4 |
| Tranquilo | todos | 360 | 76% (71%–80%) | 70%–80% (dentro) | 21,4 | 21% / 3% / 0% | 2,8 | 0,00 | 7,4 |
| Normal | 2 | 120 | 38% (30%–47%) | 45%–60% (abaixo) | 18,9 | 62% / 0% / 0% | 3,5 | 0,01 | 9,6 |
| Normal | 3 | 120 | 46% (37%–55%) | 45%–60% (dentro) | 21,1 | 52% / 3% / 0% | 3,5 | 0,03 | 7,1 |
| Normal | 4 | 120 | 72% (63%–79%) | 45%–60% (acima) | 23,8 | 28% / 0% / 0% | 3,0 | 0,04 | 6,6 |
| Normal | todos | 360 | 52% (47%–57%) | 45%–60% (dentro) | 21,2 | 47% / 1% / 0% | 3,3 | 0,03 | 7,5 |
| Tempestade | 2 | 120 | 18% (12%–26%) | 20%–35% (abaixo) | 19,0 | 82% / 0% / 0% | 4,1 | 0,02 | 8,4 |
| Tempestade | 3 | 120 | 31% (23%–40%) | 20%–35% (dentro) | 20,6 | 68% / 1% / 0% | 4,1 | 0,05 | 6,0 |
| Tempestade | 4 | 120 | 33% (26%–42%) | 20%–35% (dentro) | 22,4 | 63% / 4% / 0% | 3,8 | 0,05 | 6,1 |
| Tempestade | todos | 360 | 28% (23%–32%) | 20%–35% (dentro) | 20,7 | 71% / 2% / 0% | 4,0 | 0,04 | 6,6 |

## Variante `normal-A4-B1`

normal: só o cenário A4, B1 (com espelho sorteado)

| Dificuldade | Assentos | Partidas | Vitória (IC 95%) | Alvo | Turnos | Derrota: ilhados / nível / apanhado | Ilhados | Apanhados | Margem de nível nas vitórias |
| --- | --- | ---: | --- | --- | ---: | --- | ---: | ---: | ---: |
| Tranquilo | 2 | 120 | 68% (60%–76%) | 70%–80% (abaixo) | 18,6 | 32% / 0% / 0% | 3,1 | 0,00 | 9,2 |
| Tranquilo | 3 | 120 | 79% (71%–85%) | 70%–80% (dentro) | 20,8 | 20% / 1% / 0% | 2,8 | 0,00 | 8,0 |
| Tranquilo | 4 | 120 | 81% (73%–87%) | 70%–80% (acima) | 24,7 | 13% / 7% / 0% | 2,6 | 0,01 | 5,4 |
| Tranquilo | todos | 360 | 76% (71%–80%) | 70%–80% (dentro) | 21,4 | 21% / 3% / 0% | 2,8 | 0,00 | 7,4 |
| Normal | 2 | 120 | 39% (31%–48%) | 45%–60% (abaixo) | 18,9 | 61% / 0% / 0% | 3,6 | 0,02 | 9,6 |
| Normal | 3 | 120 | 49% (40%–58%) | 45%–60% (dentro) | 21,3 | 50% / 1% / 0% | 3,4 | 0,03 | 7,1 |
| Normal | 4 | 120 | 68% (60%–76%) | 45%–60% (acima) | 23,7 | 31% / 1% / 0% | 3,1 | 0,04 | 6,6 |
| Normal | todos | 360 | 52% (47%–57%) | 45%–60% (dentro) | 21,3 | 47% / 1% / 0% | 3,4 | 0,03 | 7,5 |
| Tempestade | 2 | 120 | 18% (12%–26%) | 20%–35% (abaixo) | 19,0 | 82% / 0% / 0% | 4,1 | 0,02 | 8,4 |
| Tempestade | 3 | 120 | 31% (23%–40%) | 20%–35% (dentro) | 20,6 | 68% / 1% / 0% | 4,1 | 0,05 | 6,0 |
| Tempestade | 4 | 120 | 33% (26%–42%) | 20%–35% (dentro) | 22,4 | 63% / 4% / 0% | 3,8 | 0,05 | 6,1 |
| Tempestade | todos | 360 | 28% (23%–32%) | 20%–35% (dentro) | 20,7 | 71% / 2% / 0% | 4,0 | 0,04 | 6,6 |

## Variante `normal-A4-B5`

normal: só o cenário A4, B5 (com espelho sorteado)

| Dificuldade | Assentos | Partidas | Vitória (IC 95%) | Alvo | Turnos | Derrota: ilhados / nível / apanhado | Ilhados | Apanhados | Margem de nível nas vitórias |
| --- | --- | ---: | --- | --- | ---: | --- | ---: | ---: | ---: |
| Tranquilo | 2 | 120 | 68% (60%–76%) | 70%–80% (abaixo) | 18,6 | 32% / 0% / 0% | 3,1 | 0,00 | 9,2 |
| Tranquilo | 3 | 120 | 79% (71%–85%) | 70%–80% (dentro) | 20,8 | 20% / 1% / 0% | 2,8 | 0,00 | 8,0 |
| Tranquilo | 4 | 120 | 81% (73%–87%) | 70%–80% (acima) | 24,7 | 13% / 7% / 0% | 2,6 | 0,01 | 5,4 |
| Tranquilo | todos | 360 | 76% (71%–80%) | 70%–80% (dentro) | 21,4 | 21% / 3% / 0% | 2,8 | 0,00 | 7,4 |
| Normal | 2 | 120 | 34% (26%–43%) | 45%–60% (abaixo) | 19,3 | 66% / 0% / 0% | 3,6 | 0,02 | 9,9 |
| Normal | 3 | 120 | 58% (49%–67%) | 45%–60% (dentro) | 22,0 | 42% / 0% / 0% | 3,2 | 0,03 | 7,7 |
| Normal | 4 | 120 | 78% (69%–84%) | 45%–60% (acima) | 24,7 | 21% / 2% / 0% | 2,9 | 0,04 | 6,8 |
| Normal | todos | 360 | 57% (52%–62%) | 45%–60% (dentro) | 22,0 | 43% / 1% / 0% | 3,2 | 0,03 | 7,7 |
| Tempestade | 2 | 120 | 18% (12%–26%) | 20%–35% (abaixo) | 19,0 | 82% / 0% / 0% | 4,1 | 0,02 | 8,4 |
| Tempestade | 3 | 120 | 31% (23%–40%) | 20%–35% (dentro) | 20,6 | 68% / 1% / 0% | 4,1 | 0,05 | 6,0 |
| Tempestade | 4 | 120 | 33% (26%–42%) | 20%–35% (dentro) | 22,4 | 63% / 4% / 0% | 3,8 | 0,05 | 6,1 |
| Tempestade | todos | 360 | 28% (23%–32%) | 20%–35% (dentro) | 20,7 | 71% / 2% / 0% | 4,0 | 0,04 | 6,6 |

## Variante `normal-B1-B5`

normal: só o cenário B1, B5 (com espelho sorteado)

| Dificuldade | Assentos | Partidas | Vitória (IC 95%) | Alvo | Turnos | Derrota: ilhados / nível / apanhado | Ilhados | Apanhados | Margem de nível nas vitórias |
| --- | --- | ---: | --- | --- | ---: | --- | ---: | ---: | ---: |
| Tranquilo | 2 | 120 | 68% (60%–76%) | 70%–80% (abaixo) | 18,6 | 32% / 0% / 0% | 3,1 | 0,00 | 9,2 |
| Tranquilo | 3 | 120 | 79% (71%–85%) | 70%–80% (dentro) | 20,8 | 20% / 1% / 0% | 2,8 | 0,00 | 8,0 |
| Tranquilo | 4 | 120 | 81% (73%–87%) | 70%–80% (acima) | 24,7 | 13% / 7% / 0% | 2,6 | 0,01 | 5,4 |
| Tranquilo | todos | 360 | 76% (71%–80%) | 70%–80% (dentro) | 21,4 | 21% / 3% / 0% | 2,8 | 0,00 | 7,4 |
| Normal | 2 | 120 | 36% (28%–45%) | 45%–60% (abaixo) | 18,8 | 64% / 0% / 0% | 3,6 | 0,01 | 9,6 |
| Normal | 3 | 120 | 46% (37%–55%) | 45%–60% (dentro) | 20,8 | 53% / 2% / 0% | 3,5 | 0,03 | 7,2 |
| Normal | 4 | 120 | 68% (59%–75%) | 45%–60% (acima) | 23,3 | 31% / 2% / 0% | 3,2 | 0,04 | 6,8 |
| Normal | todos | 360 | 50% (45%–55%) | 45%–60% (dentro) | 21,0 | 49% / 1% / 0% | 3,4 | 0,03 | 7,6 |
| Tempestade | 2 | 120 | 18% (12%–26%) | 20%–35% (abaixo) | 19,0 | 82% / 0% / 0% | 4,1 | 0,02 | 8,4 |
| Tempestade | 3 | 120 | 31% (23%–40%) | 20%–35% (dentro) | 20,6 | 68% / 1% / 0% | 4,1 | 0,05 | 6,0 |
| Tempestade | 4 | 120 | 33% (26%–42%) | 20%–35% (dentro) | 22,4 | 63% / 4% / 0% | 3,8 | 0,05 | 6,1 |
| Tempestade | todos | 360 | 28% (23%–32%) | 20%–35% (dentro) | 20,7 | 71% / 2% / 0% | 4,0 | 0,04 | 6,6 |

## Variante `normal-B1-E5`

normal: só o cenário B1, E5 (com espelho sorteado)

| Dificuldade | Assentos | Partidas | Vitória (IC 95%) | Alvo | Turnos | Derrota: ilhados / nível / apanhado | Ilhados | Apanhados | Margem de nível nas vitórias |
| --- | --- | ---: | --- | --- | ---: | --- | ---: | ---: | ---: |
| Tranquilo | 2 | 120 | 68% (60%–76%) | 70%–80% (abaixo) | 18,6 | 32% / 0% / 0% | 3,1 | 0,00 | 9,2 |
| Tranquilo | 3 | 120 | 79% (71%–85%) | 70%–80% (dentro) | 20,8 | 20% / 1% / 0% | 2,8 | 0,00 | 8,0 |
| Tranquilo | 4 | 120 | 81% (73%–87%) | 70%–80% (acima) | 24,7 | 13% / 7% / 0% | 2,6 | 0,01 | 5,4 |
| Tranquilo | todos | 360 | 76% (71%–80%) | 70%–80% (dentro) | 21,4 | 21% / 3% / 0% | 2,8 | 0,00 | 7,4 |
| Normal | 2 | 120 | 49% (40%–58%) | 45%–60% (dentro) | 19,9 | 51% / 0% / 0% | 3,3 | 0,02 | 9,5 |
| Normal | 3 | 120 | 57% (48%–65%) | 45%–60% (dentro) | 22,5 | 43% / 1% / 0% | 3,2 | 0,03 | 7,1 |
| Normal | 4 | 120 | 72% (63%–79%) | 45%–60% (acima) | 24,8 | 25% / 3% / 0% | 2,9 | 0,06 | 6,2 |
| Normal | todos | 360 | 59% (54%–64%) | 45%–60% (dentro) | 22,4 | 39% / 1% / 0% | 3,1 | 0,04 | 7,4 |
| Tempestade | 2 | 120 | 18% (12%–26%) | 20%–35% (abaixo) | 19,0 | 82% / 0% / 0% | 4,1 | 0,02 | 8,4 |
| Tempestade | 3 | 120 | 31% (23%–40%) | 20%–35% (dentro) | 20,6 | 68% / 1% / 0% | 4,1 | 0,05 | 6,0 |
| Tempestade | 4 | 120 | 33% (26%–42%) | 20%–35% (dentro) | 22,4 | 63% / 4% / 0% | 3,8 | 0,05 | 6,1 |
| Tempestade | todos | 360 | 28% (23%–32%) | 20%–35% (dentro) | 20,7 | 71% / 2% / 0% | 4,0 | 0,04 | 6,6 |

## Variante `storm-A2-B1-E5`

storm: só o cenário A2, B1, E5 (com espelho sorteado)

| Dificuldade | Assentos | Partidas | Vitória (IC 95%) | Alvo | Turnos | Derrota: ilhados / nível / apanhado | Ilhados | Apanhados | Margem de nível nas vitórias |
| --- | --- | ---: | --- | --- | ---: | --- | ---: | ---: | ---: |
| Tranquilo | 2 | 120 | 68% (60%–76%) | 70%–80% (abaixo) | 18,6 | 32% / 0% / 0% | 3,1 | 0,00 | 9,2 |
| Tranquilo | 3 | 120 | 79% (71%–85%) | 70%–80% (dentro) | 20,8 | 20% / 1% / 0% | 2,8 | 0,00 | 8,0 |
| Tranquilo | 4 | 120 | 81% (73%–87%) | 70%–80% (acima) | 24,7 | 13% / 7% / 0% | 2,6 | 0,01 | 5,4 |
| Tranquilo | todos | 360 | 76% (71%–80%) | 70%–80% (dentro) | 21,4 | 21% / 3% / 0% | 2,8 | 0,00 | 7,4 |
| Normal | 2 | 120 | 44% (36%–53%) | 45%–60% (abaixo) | 19,3 | 56% / 0% / 0% | 3,4 | 0,02 | 9,3 |
| Normal | 3 | 120 | 50% (41%–59%) | 45%–60% (dentro) | 21,4 | 49% / 1% / 0% | 3,3 | 0,03 | 7,3 |
| Normal | 4 | 120 | 73% (64%–80%) | 45%–60% (acima) | 24,2 | 26% / 2% / 0% | 3,0 | 0,04 | 6,7 |
| Normal | todos | 360 | 56% (50%–61%) | 45%–60% (dentro) | 21,6 | 44% / 1% / 0% | 3,2 | 0,03 | 7,6 |
| Tempestade | 2 | 120 | 13% (8%–21%) | 20%–35% (abaixo) | 19,1 | 85% / 2% / 0% | 4,3 | 0,01 | 8,9 |
| Tempestade | 3 | 120 | 23% (17%–32%) | 20%–35% (dentro) | 21,0 | 75% / 2% / 0% | 4,2 | 0,05 | 5,3 |
| Tempestade | 4 | 120 | 30% (23%–39%) | 20%–35% (dentro) | 22,1 | 66% / 4% / 0% | 4,0 | 0,06 | 5,3 |
| Tempestade | todos | 360 | 22% (18%–27%) | 20%–35% (dentro) | 20,7 | 75% / 3% / 0% | 4,1 | 0,04 | 6,0 |

## Variante `storm-A2-B5-F3`

storm: só o cenário A2, B5, F3 (com espelho sorteado)

| Dificuldade | Assentos | Partidas | Vitória (IC 95%) | Alvo | Turnos | Derrota: ilhados / nível / apanhado | Ilhados | Apanhados | Margem de nível nas vitórias |
| --- | --- | ---: | --- | --- | ---: | --- | ---: | ---: | ---: |
| Tranquilo | 2 | 120 | 68% (60%–76%) | 70%–80% (abaixo) | 18,6 | 32% / 0% / 0% | 3,1 | 0,00 | 9,2 |
| Tranquilo | 3 | 120 | 79% (71%–85%) | 70%–80% (dentro) | 20,8 | 20% / 1% / 0% | 2,8 | 0,00 | 8,0 |
| Tranquilo | 4 | 120 | 81% (73%–87%) | 70%–80% (acima) | 24,7 | 13% / 7% / 0% | 2,6 | 0,01 | 5,4 |
| Tranquilo | todos | 360 | 76% (71%–80%) | 70%–80% (dentro) | 21,4 | 21% / 3% / 0% | 2,8 | 0,00 | 7,4 |
| Normal | 2 | 120 | 44% (36%–53%) | 45%–60% (abaixo) | 19,3 | 56% / 0% / 0% | 3,4 | 0,02 | 9,3 |
| Normal | 3 | 120 | 50% (41%–59%) | 45%–60% (dentro) | 21,4 | 49% / 1% / 0% | 3,3 | 0,03 | 7,3 |
| Normal | 4 | 120 | 73% (64%–80%) | 45%–60% (acima) | 24,2 | 26% / 2% / 0% | 3,0 | 0,04 | 6,7 |
| Normal | todos | 360 | 56% (50%–61%) | 45%–60% (dentro) | 21,6 | 44% / 1% / 0% | 3,2 | 0,03 | 7,6 |
| Tempestade | 2 | 120 | 18% (12%–25%) | 20%–35% (abaixo) | 18,2 | 83% / 0% / 0% | 4,1 | 0,02 | 8,6 |
| Tempestade | 3 | 120 | 32% (24%–40%) | 20%–35% (dentro) | 20,1 | 68% / 0% / 0% | 4,0 | 0,06 | 6,2 |
| Tempestade | 4 | 120 | 38% (30%–47%) | 20%–35% (acima) | 22,0 | 57% / 4% / 0% | 3,8 | 0,04 | 6,3 |
| Tempestade | todos | 360 | 29% (25%–34%) | 20%–35% (dentro) | 20,1 | 69% / 1% / 0% | 4,0 | 0,04 | 6,7 |

## Variante `storm-A4-B5-E5`

storm: só o cenário A4, B5, E5 (com espelho sorteado)

| Dificuldade | Assentos | Partidas | Vitória (IC 95%) | Alvo | Turnos | Derrota: ilhados / nível / apanhado | Ilhados | Apanhados | Margem de nível nas vitórias |
| --- | --- | ---: | --- | --- | ---: | --- | ---: | ---: | ---: |
| Tranquilo | 2 | 120 | 68% (60%–76%) | 70%–80% (abaixo) | 18,6 | 32% / 0% / 0% | 3,1 | 0,00 | 9,2 |
| Tranquilo | 3 | 120 | 79% (71%–85%) | 70%–80% (dentro) | 20,8 | 20% / 1% / 0% | 2,8 | 0,00 | 8,0 |
| Tranquilo | 4 | 120 | 81% (73%–87%) | 70%–80% (acima) | 24,7 | 13% / 7% / 0% | 2,6 | 0,01 | 5,4 |
| Tranquilo | todos | 360 | 76% (71%–80%) | 70%–80% (dentro) | 21,4 | 21% / 3% / 0% | 2,8 | 0,00 | 7,4 |
| Normal | 2 | 120 | 44% (36%–53%) | 45%–60% (abaixo) | 19,3 | 56% / 0% / 0% | 3,4 | 0,02 | 9,3 |
| Normal | 3 | 120 | 50% (41%–59%) | 45%–60% (dentro) | 21,4 | 49% / 1% / 0% | 3,3 | 0,03 | 7,3 |
| Normal | 4 | 120 | 73% (64%–80%) | 45%–60% (acima) | 24,2 | 26% / 2% / 0% | 3,0 | 0,04 | 6,7 |
| Normal | todos | 360 | 56% (50%–61%) | 45%–60% (dentro) | 21,6 | 44% / 1% / 0% | 3,2 | 0,03 | 7,6 |
| Tempestade | 2 | 120 | 18% (12%–25%) | 20%–35% (abaixo) | 19,0 | 83% / 0% / 0% | 4,3 | 0,01 | 8,1 |
| Tempestade | 3 | 120 | 23% (16%–31%) | 20%–35% (dentro) | 21,2 | 75% / 3% / 0% | 4,1 | 0,04 | 5,4 |
| Tempestade | 4 | 120 | 25% (18%–33%) | 20%–35% (dentro) | 22,2 | 70% / 5% / 0% | 3,9 | 0,06 | 5,9 |
| Tempestade | todos | 360 | 22% (18%–26%) | 20%–35% (dentro) | 20,8 | 76% / 3% / 0% | 4,1 | 0,04 | 6,3 |

## Variante `storm-A4-B5-F3`

storm: só o cenário A4, B5, F3 (com espelho sorteado)

| Dificuldade | Assentos | Partidas | Vitória (IC 95%) | Alvo | Turnos | Derrota: ilhados / nível / apanhado | Ilhados | Apanhados | Margem de nível nas vitórias |
| --- | --- | ---: | --- | --- | ---: | --- | ---: | ---: | ---: |
| Tranquilo | 2 | 120 | 68% (60%–76%) | 70%–80% (abaixo) | 18,6 | 32% / 0% / 0% | 3,1 | 0,00 | 9,2 |
| Tranquilo | 3 | 120 | 79% (71%–85%) | 70%–80% (dentro) | 20,8 | 20% / 1% / 0% | 2,8 | 0,00 | 8,0 |
| Tranquilo | 4 | 120 | 81% (73%–87%) | 70%–80% (acima) | 24,7 | 13% / 7% / 0% | 2,6 | 0,01 | 5,4 |
| Tranquilo | todos | 360 | 76% (71%–80%) | 70%–80% (dentro) | 21,4 | 21% / 3% / 0% | 2,8 | 0,00 | 7,4 |
| Normal | 2 | 120 | 44% (36%–53%) | 45%–60% (abaixo) | 19,3 | 56% / 0% / 0% | 3,4 | 0,02 | 9,3 |
| Normal | 3 | 120 | 50% (41%–59%) | 45%–60% (dentro) | 21,4 | 49% / 1% / 0% | 3,3 | 0,03 | 7,3 |
| Normal | 4 | 120 | 73% (64%–80%) | 45%–60% (acima) | 24,2 | 26% / 2% / 0% | 3,0 | 0,04 | 6,7 |
| Normal | todos | 360 | 56% (50%–61%) | 45%–60% (dentro) | 21,6 | 44% / 1% / 0% | 3,2 | 0,03 | 7,6 |
| Tempestade | 2 | 120 | 18% (12%–25%) | 20%–35% (abaixo) | 19,4 | 83% / 0% / 0% | 4,1 | 0,02 | 8,9 |
| Tempestade | 3 | 120 | 36% (28%–45%) | 20%–35% (acima) | 21,0 | 63% / 1% / 0% | 3,9 | 0,06 | 6,3 |
| Tempestade | 4 | 120 | 37% (29%–46%) | 20%–35% (acima) | 22,4 | 57% / 6% / 0% | 3,7 | 0,07 | 6,4 |
| Tempestade | todos | 360 | 30% (25%–35%) | 20%–35% (dentro) | 20,9 | 68% / 2% / 0% | 3,9 | 0,05 | 6,8 |

## Variante `storm-B1-B5-F3`

storm: só o cenário B1, B5, F3 (com espelho sorteado)

| Dificuldade | Assentos | Partidas | Vitória (IC 95%) | Alvo | Turnos | Derrota: ilhados / nível / apanhado | Ilhados | Apanhados | Margem de nível nas vitórias |
| --- | --- | ---: | --- | --- | ---: | --- | ---: | ---: | ---: |
| Tranquilo | 2 | 120 | 68% (60%–76%) | 70%–80% (abaixo) | 18,6 | 32% / 0% / 0% | 3,1 | 0,00 | 9,2 |
| Tranquilo | 3 | 120 | 79% (71%–85%) | 70%–80% (dentro) | 20,8 | 20% / 1% / 0% | 2,8 | 0,00 | 8,0 |
| Tranquilo | 4 | 120 | 81% (73%–87%) | 70%–80% (acima) | 24,7 | 13% / 7% / 0% | 2,6 | 0,01 | 5,4 |
| Tranquilo | todos | 360 | 76% (71%–80%) | 70%–80% (dentro) | 21,4 | 21% / 3% / 0% | 2,8 | 0,00 | 7,4 |
| Normal | 2 | 120 | 44% (36%–53%) | 45%–60% (abaixo) | 19,3 | 56% / 0% / 0% | 3,4 | 0,02 | 9,3 |
| Normal | 3 | 120 | 50% (41%–59%) | 45%–60% (dentro) | 21,4 | 49% / 1% / 0% | 3,3 | 0,03 | 7,3 |
| Normal | 4 | 120 | 73% (64%–80%) | 45%–60% (acima) | 24,2 | 26% / 2% / 0% | 3,0 | 0,04 | 6,7 |
| Normal | todos | 360 | 56% (50%–61%) | 45%–60% (dentro) | 21,6 | 44% / 1% / 0% | 3,2 | 0,03 | 7,6 |
| Tempestade | 2 | 120 | 17% (11%–24%) | 20%–35% (abaixo) | 18,2 | 83% / 0% / 0% | 4,1 | 0,02 | 8,7 |
| Tempestade | 3 | 120 | 32% (24%–40%) | 20%–35% (dentro) | 19,7 | 68% / 0% / 0% | 4,1 | 0,04 | 6,5 |
| Tempestade | 4 | 120 | 36% (28%–45%) | 20%–35% (acima) | 21,7 | 57% / 8% / 0% | 3,8 | 0,05 | 6,3 |
| Tempestade | todos | 360 | 28% (24%–33%) | 20%–35% (dentro) | 19,9 | 69% / 3% / 0% | 4,0 | 0,04 | 6,9 |

## Variante `storm-B1-F3-E5`

storm: só o cenário B1, F3, E5 (com espelho sorteado)

| Dificuldade | Assentos | Partidas | Vitória (IC 95%) | Alvo | Turnos | Derrota: ilhados / nível / apanhado | Ilhados | Apanhados | Margem de nível nas vitórias |
| --- | --- | ---: | --- | --- | ---: | --- | ---: | ---: | ---: |
| Tranquilo | 2 | 120 | 68% (60%–76%) | 70%–80% (abaixo) | 18,6 | 32% / 0% / 0% | 3,1 | 0,00 | 9,2 |
| Tranquilo | 3 | 120 | 79% (71%–85%) | 70%–80% (dentro) | 20,8 | 20% / 1% / 0% | 2,8 | 0,00 | 8,0 |
| Tranquilo | 4 | 120 | 81% (73%–87%) | 70%–80% (acima) | 24,7 | 13% / 7% / 0% | 2,6 | 0,01 | 5,4 |
| Tranquilo | todos | 360 | 76% (71%–80%) | 70%–80% (dentro) | 21,4 | 21% / 3% / 0% | 2,8 | 0,00 | 7,4 |
| Normal | 2 | 120 | 44% (36%–53%) | 45%–60% (abaixo) | 19,3 | 56% / 0% / 0% | 3,4 | 0,02 | 9,3 |
| Normal | 3 | 120 | 50% (41%–59%) | 45%–60% (dentro) | 21,4 | 49% / 1% / 0% | 3,3 | 0,03 | 7,3 |
| Normal | 4 | 120 | 73% (64%–80%) | 45%–60% (acima) | 24,2 | 26% / 2% / 0% | 3,0 | 0,04 | 6,7 |
| Normal | todos | 360 | 56% (50%–61%) | 45%–60% (dentro) | 21,6 | 44% / 1% / 0% | 3,2 | 0,03 | 7,6 |
| Tempestade | 2 | 120 | 31% (23%–40%) | 20%–35% (dentro) | 20,0 | 68% / 1% / 0% | 3,9 | 0,02 | 8,2 |
| Tempestade | 3 | 120 | 37% (29%–46%) | 20%–35% (acima) | 21,1 | 61% / 3% / 0% | 3,8 | 0,03 | 6,3 |
| Tempestade | 4 | 120 | 36% (28%–45%) | 20%–35% (acima) | 22,5 | 58% / 6% / 0% | 3,8 | 0,05 | 5,8 |
| Tempestade | todos | 360 | 34% (30%–39%) | 20%–35% (dentro) | 21,2 | 63% / 3% / 0% | 3,8 | 0,03 | 6,7 |

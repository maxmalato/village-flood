# Partidas de teste com pessoas (Etapa 7)

Roteiro para as partidas com família e amigos. O objetivo é saber se as taxas de vitória reais ficam perto das faixas-alvo e decidir os pontos "a testar" das regras. O jogo não coleta nada sozinho (sem analytics, LGPD): os resultados são anotados à mão, sem nome completo nem dado pessoal. Use só apelidos ou "Jogador 1, 2...".

## Faixas-alvo de vitória (regras, seção 9)

| Dificuldade | Meta | Vitória alvo |
| --- | --- | --- |
| Tranquilo | 8 | 70 a 80% |
| Normal | 9 | 45 a 60% |
| Tempestade | 10 | 20 a 35% |

Com poucas partidas, a taxa varia muito. Como referência, 10 partidas por dificuldade já mostram se ela está muito fora da faixa.

## Plano sugerido

1. **Primeira partida de cada grupo no Tranquilo**, com a legenda aberta no começo. Observe sem explicar: onde as pessoas travam?
2. Depois, Normal e Tempestade, alternando o tamanho da equipe (2, 3 e 4 assentos; bots podem completar).
3. Varie os papéis entre as partidas, para todos aparecerem. Interessa principalmente a **Vizinha** e o **Engenheiro** (ponto em aberto 22) e a **Barqueira** carregando 2 (regras, seção 3).
4. Misture os modos: neste aparelho, online e mesa.

## O que anotar em cada partida

Copie a tabela para um arquivo `docs/playtests/AAAA-MM-DD.md` (um por dia de teste) ou mande para mim do jeito que for mais fácil.

| # | Modo | Dificuldade | Assentos (pessoas + bots) | Papéis | Resultado | Motivo (se perdeu) | Turno final | Salvos | Ilhados | Voluntário apanhado? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | local | Tranquilo | 3 + 1 | Bombeiro, Médica, Engenheiro, Vizinha (bot) | venceu | — | 18 | 9 | 1 | não |

A tela final já mostra salvos, nível final e turno final.

## Perguntas rápidas depois de cada partida

- Foi fácil, justo ou difícil demais?
- Alguém achou que já tinha vencido antes de levar todos ao cais?
- Algum papel pareceu fraco ou forte demais?
- Alguma regra, ícone ou texto confundiu? Qual?
- A partida demorou quanto tempo? (meta das regras: 30 a 45 minutos)

## Pontos "a testar" que essas partidas ajudam a decidir

- Voluntário apanhado pela água: penalidade (hoje) ou derrota na Tempestade (regras, seção 8).
- Barqueira: +1 ação por passo carregando 2 (regras, seção 3).
- Vizinha fraca e Engenheiro forte (pontos em aberto, item 22).
- Equipes de 2 assentos no Normal (pontos em aberto, item 7).
- Entrega automática na igreja (pontos em aberto, item 5) e marcas ✓/✗ entendidas sem explicação (item 12).

## Depois dos testes

Com as anotações, eu rodo a simulação com a mudança proposta, registro o resultado em `docs/simulation/` e ajusto **só os dados** (nunca o código), com a decisão registrada nas regras.

## Leitor de tela

Uma partida curta com TalkBack (Android) ou VoiceOver (iPhone ou Mac): dá para saber de quem é a vez, o que tem em cada quadra e o que aconteceu depois da chuva?

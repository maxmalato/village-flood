# Checklist de acessibilidade e desempenho

Etapa 6 (acabamento), 22/11/2026. Cada item diz como é verificado. Os testes automáticos rodam no CI a cada envio; os itens manuais são feitos pelo dono do projeto em aparelho real.

## Acessibilidade

| Item | Situação | Como é verificado |
| --- | --- | --- |
| axe-core sem violações em todas as telas (início, lobby, partida, legenda, fim, entrada online, lobby online, partida online, mesa), nos temas claro e escuro | Cumprido | E2E (`home`, `game`, `online`, `table`) |
| Alvos de toque de pelo menos 44 × 44 px (botões, campos, listas; rádio e caixa pelo rótulo clicável) | Cumprido | E2E `a11y`: mede todos os controles visíveis no modo local, na legenda e nas telas online, no desktop e no celular |
| Contraste mínimo de 4,5:1 | Cumprido | axe-core (regra `color-contrast`), nos dois temas |
| Foco visível e partida jogável só pelo teclado (Tab, setas no tabuleiro, Enter) | Cumprido | E2E `a11y`: uma jogada inteira só com o teclado; contorno de foco presente |
| Tabuleiro com uma quadra na ordem do Tab e setas para andar | Cumprido | E2E `game` e `a11y` |
| Rótulo de acessibilidade em cada quadra (altura, água, casa, moradores, voluntários, custo, sugestões) | Cumprido | Testes de unidade de `tileViews` |
| Eventos anunciados (`aria-live`), recusas em `role="status"`, alertas em `role="alert"` | Cumprido | Revisão de código; E2E confere os textos |
| Estados sem depender só de cor (água, marcas ✓/✗, ferido, sugestões com forma) | Cumprido | Revisão das telas; regras, seção 14 |
| `prefers-reduced-motion` respeitado | Cumprido | E2E `a11y`: com "reduzir movimento", as animações ficam com duração zero |
| Telas grandes: tabuleiro ocupa a altura da janela sem rolagem (quadra de 118 px em 1920 × 937 e 146 px em 2560 × 1297; sem mudança em 1366 px) | Cumprido | Medido com Playwright em 23/11/2026 |
| Telas de menu sem rolagem lateral em 320 px (zoom de 400%) | Cumprido | E2E `a11y` (o tabuleiro de 6 colunas tem largura mínima própria, como permite a WCAG para jogos e mapas) |
| Idioma da página (`lang`) e textos em PT-BR e inglês | Cumprido | E2E `home`; teste de unidade garante as mesmas chaves nos dois idiomas |
| Legenda em diálogo nativo: prende o foco e devolve ao botão que abriu | Cumprido | E2E `game` |
| Som com botão de ligar/desligar em todas as telas, lembrado no aparelho | Cumprido | Revisão de código; sons nunca carregam informação que não esteja também na tela |
| Leitor de tela real (TalkBack no Android, VoiceOver no iPhone ou Mac) | Manual, pendente | Dono do projeto, na Etapa 7 |

## Desempenho

Medido em 22/11/2026 com Playwright e Chromium, simulando celular modesto: CPU 6 vezes mais lenta e rede 3G (1,6 Mb/s, 150 ms de latência).

| Item | Meta | Medido |
| --- | --- | --- |
| JavaScript do jogo (comprimido com gzip) | até 150 KB | 86 KB |
| CSS (comprimido) | até 20 KB | 6 KB |
| Primeira pintura na primeira visita (3G + CPU 6×) | até 2,5 s | 1,2 s |
| Visita seguinte (service worker) | até 1 s | 0,3 s |
| Começar a partida (CPU 6×) | até 0,5 s | 0,4 s |
| Tocar numa quadra e ver as ações (CPU 6×) | até 0,4 s | 0,15 s a 0,17 s |
| Andar (CPU 6×) | até 0,4 s | 0,25 s a 0,32 s |
| Jogada do bot (Node, 8.173 jogadas, 4 assentos, 3 dificuldades) | até 50 ms | mediana 1,4 ms; p95 8,4 ms; p99 23 ms; máximo 39 ms |

Observações:

- O bot do modo local joga na mesma linha do navegador; com a espera de 0,7 s entre jogadas, mesmo o pior caso (cerca de 0,2 s com CPU 6×) não trava a tela.
- No online e na mesa, o bot roda no servidor.
- O tabuleiro é HTML/CSS: 36 quadras, sem canvas nem WebGL.
- Teste em aparelho real (celular, tablet e navegador de Smart TV) feito pelo dono do projeto na Etapa 5. Repetir na Etapa 7, depois da publicação com HTTPS, para conferir também a instalação do app.

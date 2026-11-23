# Enchente na Vila: roadmap

Cada etapa termina com testes passando, commit e tag. Uma etapa só começa quando a anterior fechou. Atualize a tabela de situação sempre que uma etapa começar ou fechar.

## Ordem e motivo

A ordem é **motor, bots e simulação antes de qualquer tela**. Os números ainda abertos (regras marcadas "a testar", a dúvida sobre a igreja deixar o jogo fácil, equipes de 2 assentos) são calibrados na Etapa 2, quando mudar custa quase nada. A interface só começa depois disso.

## Situação

| Etapa | Situação | Tag |
| --- | --- | --- |
| 0 – Fundação | Concluída | `v0.1-foundation` |
| 1 – Motor | Concluída | `v0.2-engine` |
| 2 – Bots e simulação | Concluída | `v0.3-bots-sim` |
| 3 – Telas (um aparelho) | Concluída | `v0.4-local-ui` |
| 4 – Vários aparelhos (online) | Concluída | `v0.5-online` |
| 5 – Mesa e PWA | Concluída | `v0.6-table-pwa` |
| 6 – Acabamento | Concluída | `v0.9-polish` |
| 7 – Calibração com partidas reais e publicação | Em andamento (branch `develop/release-prep`) | `v1.0` |

## Etapa 0 – Fundação

Deixa o projeto pronto para receber código.

- Confirmar a stack com o dono do projeto.
- `CLAUDE.md`, `README.md` (PT-BR) e `README.en.md` (inglês), `docs/` com regras, especificação técnica e este roadmap, `docs/mockups/` com as telas exportadas e `assets/logo/` com a logo.
- Monorepo pnpm com `packages/engine`, `protocol`, `kit`, `bots`, `sim` e `apps/web`, `apps/server`, ainda sem lógica de jogo.
- TypeScript estrito, ESLint, Prettier, Vitest, fast-check e Playwright configurados, com um teste mínimo em cada pacote.
- CI no GitHub Actions: instalação, lint, tipos, testes e build.
- Seção "Registro de decisões" criada no fim do documento de regras.

**Pronto quando:** CI verde na `main`.

## Etapa 1 – Motor

`packages/engine`, sem I/O. Segue as seções 4 a 6 da especificação.

- **Antes de implementar:** apresentar ao dono do projeto, para aprovação, o schema completo dos dados e os tipos `SeatId`, `Snapshot`, `Ctx` e `Result`. Proposta aprovada em 20/11/2026: `docs/engine-data-proposal.md`.
- Tipos, estado e eventos. `homeTileId` em cada morador.
- Dados validados por schema: mapa "Vila do Rio", baralho de chuva, tabela de dificuldades e `RoleParams`.
- `WaterModel` com a implementação `river-level` (limiares por altura, sacos de areia, ligação com o rio por busca em largura).
- `transition` com todas as ações: `move`, `pick-up`, `heal`, `reinforce`, `forecast`, `undo`, `end-turn`.
- Chuva, transições de ferido e ilhado, entrega automática na igreja, voluntário apanhado pela água, `checkOutcome` e `houseMark`.
- Testes de unidade e propriedades da seção 10 da especificação.

**Pronto quando:** testes de unidade e de propriedades passam; mesma semente e mesmas ações geram o mesmo resultado; nenhuma regra fica fixa no código (tudo vem dos dados).

## Etapa 2 – Bots e simulação

`packages/bots` e `packages/sim`.

- `botMove` (busca de até 3 ações, só informação pública, determinística) e `suggest`.
- CLI de simulação em lote: milhares de partidas por dificuldade × tamanho da equipe (2, 3, 4) × composição de papéis.
- Métricas: taxa de vitória, duração, causa de derrota, ilhados, voluntários apanhados pela água e **turnos que sobram quando a equipe vence**.
- Relatório em tabela e primeira calibração, **só mexendo nos dados**, nunca no código das regras.

**Pronto quando:** o relatório existe e foi apresentado ao dono do projeto, com recomendação para cada ponto aberto: Barqueira e Bombeiro (itens 3 e 4 da seção 13 das regras), igreja como porto seguro (item 10), equipes de 2 assentos (item 7) e voluntário apanhado pela água (item 2). As taxas de vitória por dificuldade ficam dentro das faixas alvo ou a diferença está explicada. **Portão:** a Etapa 3 só começa depois da aprovação do dono.

## Etapa 3 – Telas (um aparelho)

`apps/web`, modo local, com bots completando a equipe.

- Tabuleiro em HTML/SVG, quadras de pelo menos 44 px, alcançáveis com custo, painel de ações, desfazer, "Encerrar turno", nível do rio com limiares, previsão, aviso de voluntário apanhado.
- Marcas ✓/✗ nas casas, legenda rápida e legenda completa (mesa e celular).
- Telas de início, lobby (papéis, bots, dificuldade) e fim de partida com dica.
- i18n PT-BR e inglês, acessibilidade (`aria-live`, `prefers-reduced-motion`).
- Telas fiéis aos mockups em `docs/mockups/`.

**Pronto quando:** uma partida completa no celular e no desktop, de ponta a ponta, sem erro; axe-core sem violações graves; testes E2E do fluxo básico.

## Etapa 4 – Vários aparelhos (online)

`packages/kit` (extraído do `senhorio-web`), `apps/server`, `packages/protocol`.

- Salas com código (sem senha), assentos, token como hash, limites e expiração.
- Desconexão: bot assume, aviso à equipe, volta do jogador no início do próprio turno.
- Opinar (ping): 3 por jogador, efêmero, limpo ao fim do turno.
- `resync` na reconexão. O servidor valida toda ação.

**Pronto quando:** E2E com dois ou mais navegadores cobrindo criar sala, entrar, jogar um turno, desfazer, ping, desconexão com bot assumindo e volta do jogador; teste de que ação de quem não é da vez é recusada.

**Feito (22/11/2026):**

- `packages/kit`: sala pura e agnóstica de jogo (lobby, partida, presença `connected`/`away`/`bot`/`returning`, bot assumindo após 20 s na vez da pessoa ou no início do turno dela, volta no início do próprio turno, pings, expiração, limite de mensagens). 21 testes.
- `packages/protocol`: ações e configuração validadas com Zod; `apps/server`: Worker + Durable Object por sala (WebSocket com hibernação, alarme para bots e expiração). Testes de integração no runtime dos Workers, incluindo a recusa de ação de quem não tem a vez e de ação malformada.
- `apps/web`: criar sala, entrar com código ou link (`?sala=`), lobby online (código, link, papéis livres, dificuldade, bots), a mesma tela da partida (interface `GameController`), sugestões com forma própria na quadra, avisos de queda, bot e volta, reconexão automática pelo token guardado no aparelho.
- E2E com dois navegadores contra o servidor local (`wrangler dev`), axe-core nos temas claro e escuro.

**Ficou para depois:** QR code do convite (precisa de dependência nova, pedir aprovação), resumo "Enquanto você estava fora" e contagem regressiva visível até o bot assumir. Os destaques da tela final contam só os eventos que o aparelho viu (quem entrou de novo no meio da partida vê números menores).

## Etapa 5 – Mesa e PWA

- Modo mesa: tabuleiro grande na TV ou notebook, celulares como controle.
- Decidir como abrir a legenda completa na TV sem toque (regras, item 11 da seção 13).
- PWA: instalável, funciona offline no modo local. Ícones a partir de `assets/logo/`.
- Teste no navegador de uma Smart TV real.

**Pronto quando:** partida completa em modo mesa (TV + celulares) e o modo local funcionando sem internet depois do primeiro acesso.

**Feito (22/11/2026):**

- `packages/kit`: assento da mesa (`TABLE_SEAT`) com token próprio guardado como hash; a mesa só pode pedir o estado e abrir ou fechar uma tela por cima do jogo (`table-overlay`); quem comanda é a primeira pessoa que entra.
- `apps/server`: `POST /api/rooms` com `table: true` devolve o token da mesa; a mesa que tenta jogar recebe `tableCannotPlay`.
- `apps/web`: "Abrir mesa (TV ou notebook)" na tela inicial; tela da TV com código grande, QR code (`uqr`) e endereço no lobby, e, na partida, tabuleiro só para ver, rio, moradores, previsão, equipe, "Sugestões da equipe" e legenda rápida; legenda completa pelo controle/teclado da TV ou pelo botão "Mostrar legenda na TV" dos celulares. A TV que recarrega volta sozinha como mesa. QR code também no lobby online.
- PWA (`vite-plugin-pwa`): manifesto, ícones de `assets/logo/`, service worker com o jogo em cache; o modo local funciona offline e a tela inicial avisa quando não há internet.
- Testes: kit (mesa e legenda), integração no servidor (mesa), E2E da mesa (TV + celular, legenda pelo celular e pelo teclado, TV recarregando) e do PWA (manifesto e jogo offline), axe-core nos temas claro e escuro.

**Teste em aparelhos reais:** feito pelo dono do projeto em 22/11/2026, pela rede local (mesa e online); a instalação do PWA no celular será conferida com HTTPS na publicação (Etapa 7).

## Etapa 6 – Acabamento

- Revisão de acessibilidade, sons (originais), animações com `prefers-reduced-motion`, desempenho em aparelhos modestos.
- `README.md` e `README.en.md` finais, com os dois idiomas equivalentes.

**Pronto quando:** checklist de acessibilidade e de desempenho cumprido; READMEs revisados.

**Feito (22/11/2026):**

- Sons sintetizados (Web Audio), ligados por padrão, com o botão "Som" em todas as telas.
- Animações curtas em CSS, desligadas com `prefers-reduced-motion`.
- Revisão de acessibilidade com testes novos (`e2e/a11y.e2e.ts`): alvos de toque de 44 px em todas as telas, jogada inteira pelo teclado, reduzir movimento e telas de menu em 320 px. A revisão achou e corrigiu rolagem lateral no lobby em tela estreita. axe-core nos dois temas em todas as telas.
- Medições de desempenho com CPU 6× mais lenta e rede 3G, todas dentro das metas.
- Telas grandes (a partir de 1400 px): o tabuleiro cresce até caber na altura da janela, com peões, ícones e números maiores (quadra de 83 px para 118 px num monitor Full HD), pedido do dono do projeto em 23/11/2026.
- Igreja e cais mais claros na legenda e aviso "Meta alcançada! Agora levem todos os voluntários ao cais." (pedido do dono do projeto em 23/11/2026).
- Checklist em `docs/quality-checklist.md`.
- Three.js avaliado e deixado para a v2 (registro de decisões, 22/11/2026).
- `README.md` e `README.en.md` finais.

**Ficou para a Etapa 7:** teste com leitor de tela real (TalkBack ou VoiceOver) e novo teste em aparelhos reais depois da publicação com HTTPS.

## Etapa 7 – Calibração com partidas reais e publicação

- Partidas com pessoas (família e amigos) em cada dificuldade e tamanho de equipe; ajuste dos valores iniciais e das regras "a testar" **nos dados**.
- Publicação na Cloudflare e tag `v1.0`.

**Pronto quando:** taxas de vitória reais próximas das faixas alvo e nenhum ponto "a testar" sem decisão registrada.

**Feito até agora (23/11/2026):**

- Preparação para publicar: cabeçalhos de segurança e de cache (`apps/web/cloudflare/_headers`, com CSP), teste E2E do site servido pelo Worker com a CSP ativa, comando `pnpm cf:deploy` e o passo a passo em `docs/deploy.md`.
- Roteiro e modelo de anotação das partidas de teste em `docs/playtests/README.md`.

**Falta:** publicação na conta da Cloudflare (feita pelo dono do projeto), partidas com pessoas e ajustes nos dados, teste com leitor de tela e novo teste em aparelhos com HTTPS.

## Ideias para depois da Etapa 6

Registradas em 21/11/2026, a pedido do dono do projeto, para aumentar a variedade entre partidas (ponto em aberto 23 das regras):

- **Mapas novos:** outras vilas com formato, alturas, casas, igreja e cais diferentes. O motor e o tabuleiro já aceitam qualquer mapa vindo dos dados; cada mapa precisa ser desenhado e calibrado na simulação, e o lobby ganha a escolha (ou o sorteio) do mapa.
- **Cartas de evento:** pequenos imprevistos por partida, como "ponte caída" ou "morador idoso pesa mais". Mudam regras, então pedem nova calibração.
- **Tabuleiro em 3D (Three.js):** avaliado na Etapa 6 e deixado para depois da v1 (registro de decisões, 22/11/2026). Se voltar, entra como opção, com o tabuleiro HTML como alternativa acessível.

## Depois da v1

Modelo de água B (chuva que escorre), registrado na seção 12 das regras e da especificação. Só começa depois que a v1 estiver finalizada.

## Prompt sugerido para a primeira sessão

> Leia `CLAUDE.md`, `docs/village-flood-rules.md`, `docs/village-flood-tech-spec.md` e `docs/ROADMAP.md`. Faça a **Etapa 0 – Fundação**. Antes de criar qualquer arquivo, confirme comigo a stack proposta e liste dúvidas ou contradições que encontrar nos documentos. Trabalhe numa branch `develop/foundation`. Não comece a Etapa 1 sem eu aprovar.

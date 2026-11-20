# Enchente na Vila (`village-flood`): regras v1

Status: decisões aprovadas em conversa (19/11/2026). Valores marcados como **(inicial)** e regras marcadas como **(a testar)** são pontos de partida: serão calibrados com simulações de bots e partidas reais e **podem mudar**. Identificadores de código em inglês (glossário no fim). Tudo (nomes, arte, textos, sons) é original e segue o padrão do Senhorio.

## 1. Resumo

Uma chuva forte faz o rio transbordar. A equipe de voluntários leva os moradores até a igreja, no alto do morro, e depois todos embarcam no barco de resgate. A equipe ganha ou perde junta. Ninguém "morre": a derrota termina com uma dica para a próxima partida. Duração prevista: 30 a 45 minutos.

## 2. Decisões fechadas

| Tema | Decisão |
| --- | --- |
| Jogadores | 2 a 4 assentos (pessoa ou bot), com pelo menos 1 pessoa. Recomendado 3 ou 4. Com 1 pessoa, o jogo oferece completar com bots. |
| Modos | Um aparelho, vários aparelhos (salas online) e mesa (tabuleiro na TV ou notebook, celulares como controle). |
| Informação escondida | Nenhuma. Tudo é público, inclusive a previsão da Radialista. |
| Água | Opção A: nível do rio (seção 5). A opção B (chuva que escorre) fica como extra da v2 (seção 12). |
| Moradores feridos | Opção 1: ferido pelo nível da água (seção 6). |
| Voluntário apanhado pela água | Penalidade em vez de derrota (seção 8). **(a testar)** |
| Equilíbrio dos papéis | Barqueira com +1 ação por passo enquanto carrega 2 moradores; Bombeiro paga 2 para pegar ferido; Médica cura de graça e pega ferido por 1; Radialista tem o Chamado pelo rádio (seção 3). Calibrado por simulação em 20/11/2026. **(a testar com pessoas)** |
| Bots | Entram na v1. Completam a equipe, substituem quem desconecta e permitem jogo solo. |
| Desconexão | Bot assume e todos são avisados. A pessoa pode voltar a qualquer momento e retoma o controle no início do próprio turno seguinte. |
| Opinar no online | Qualquer jogador pode "apontar" quadras (ping) durante o turno de outro. Quem tem a vez decide. |
| Desfazer | Permitido durante o turno, até encerrar o turno. Ações que revelam informação não podem ser desfeitas. |
| Dados pessoais | Salas só com apelido, sem conta e sem dado pessoal. |
| Previsão da Radialista | Pública para todos. Poder reduzido conforme a dificuldade (seção 9). |
| Marcas nas casas | Casa vazia mostra "✓" (todos retirados) ou "✗" (algum morador ficou ilhado). Regra na seção 4. |
| Legenda | Tela com a legenda rápida (só o essencial) e botão "Legenda" que abre a legenda completa. Regra na seção 4. |

## 3. Equipe e papéis

Cada assento tem um papel diferente, escolhido livremente na ordem de entrada (bots recebem papéis sorteados entre os que sobram). Não é obrigatório ter todos os papéis. Sem Radialista não há previsão.

| Papel (`RoleId`) | Habilidade |
| --- | --- |
| Bombeiro (`firefighter`) | Anda em quadra alagada gastando 1 ação em vez de 2. |
| Barqueira (`boat-pilot`) | Única que entra em quadra submersa (de barco, custo 1). Carrega até 2 moradores, mas cada passo custa +1 ação enquanto ela carrega 2. **(a testar)** Imune à penalidade de quadra submersa. |
| Engenheiro (`engineer`) | Coloca saco de areia gastando 1 ação, na quadra atual ou vizinha. |
| Médica (`medic`) | Cura 1 morador ferido na mesma quadra ou numa quadra vizinha, **sem gastar ação**. Pega morador ferido gastando 1 ação em vez de 2. |
| Radialista (`radio-host`) | Habilita a previsão da chuva para toda a equipe. **Chamado pelo rádio:** uma vez por turno, por 1 ação, o próximo voluntário na ordem ganha 1 ação extra no turno dele (perdida se o turno dele for perdido). **(inicial)** |
| Vizinha (`neighbor`) | Anda também na diagonal. |

Todos podem carregar 1 morador por vez, exceto a Barqueira (2).

> **Observação (a testar):** os ajustes da Barqueira e do Bombeiro são hipóteses de equilíbrio. Precisam ser testados com simulações de bots (comparando a taxa de vitória por composição de equipe) e com partidas reais, e **podem mudar**. Critério (decidido em 20/11/2026): o efeito de cada papel na taxa de vitória (com o papel × sem ele) fica entre −10 e +10 pontos. O critério anterior (nenhuma composição com mais de 10 pontos de diferença) é impossível com equipes de 2. Alternativas já pensadas, caso o ajuste não baste: passar a capacidade 2 para a Vizinha, ou dar a qualquer voluntário um jeito caro de cruzar quadra submersa (3 ações), que foi analisado como pouco útil neste mapa.

## 4. Tabuleiro

Grade 6×6 (colunas A a F, linhas 1 a 6). O rio fica à esquerda da coluna A. Cada quadra tem altura de 1 a 3 e um tipo: simples, casa, igreja ou cais. A igreja e o cais **nunca alagam**.

### Mapa v1 "Vila do Rio" (provisório)

Alturas:

```
      A B C D E F
  1   1 1 2 2 1 1
  2   1 2 2 3 2 1
  3   1 2 3 3 2 1
  4   1 2 3 2 2 1
  5   1 1 2 2 1 1
  6   1 1 1 1 1 1
```

- Igreja: D3 (altura 3). Cais: B3 (altura 2). Todos os voluntários começam no cais.
- Casas (10): A2, A4, B1, B5, F3, E5 (altura 1) e C2, C5, E2, E4 (altura 2). Cada casa começa com 1 morador.
- Moradores extras, nesta ordem de casas: A4, B5, F3, E5, C5. Tranquilo usa 1 extra, Normal usa 2 e Tempestade usa 3.

### Igreja e cais: funções diferentes

| Lugar | Função | Encerra a partida? |
| --- | --- | --- |
| Igreja (`church`) | Abrigo dos moradores. Quem é entregue lá vira **salvo** e fica lá até o fim. Ninguém precisa levar o morador da igreja ao cais. | Não. |
| Cais (`dock`) | Saída da equipe. Os voluntários começam nele, o voluntário apanhado pela água volta para ele (seção 8) e, para vencer, **todos os voluntários** precisam estar nele quando a meta de salvos for atingida. | Sim, junto com a meta de moradores salvos. |

Percurso típico: morador vai da casa à igreja (levado por um voluntário) e, no fim, os voluntários vão da igreja ao cais.

### Marcas nas casas

A casa mostra o que aconteceu com os moradores dela. A marca é **calculada** a partir do estado dos moradores (não é guardada) e usa o identificador da casa de origem de cada morador (`homeTileId`).

| O que se vê na casa | Significado |
| --- | --- |
| Ícone cheio | Ainda há morador esperando na casa. Se houver feridos, aparece o número de feridos. |
| Ícone vazio com "✓" (`cleared`) | Todos os moradores foram retirados da casa (já salvos ou sendo carregados). |
| Ícone vazio com "✗" (`lost`) | Pelo menos um morador dessa casa ficou ilhado. |
| Ícone vazio sem marca | Não ocorre: casa vazia sempre tem "✓" ou "✗". |

Regra: a casa só ganha marca quando nenhum morador de origem dela está mais na quadra. Ganha "✗" se pelo menos um deles estiver ilhado; caso contrário, ganha "✓". Casas com morador extra (2 moradores) seguem a mesma regra. Quando um voluntário apanhado pela água deixa moradores ilhados (seção 8), a casa de origem deles passa a "✗".

### Legenda

- **Legenda rápida (sempre na tela):** só o essencial: as três quadras (seca, alagada, submersa), "Igreja: abrigo", "Cais: saída" e o botão "Ver legenda completa".
- **Legenda completa:** abre pelo botão "Legenda", presente no cabeçalho de todas as telas de jogo (mesa e celular). Reúne todos os símbolos em três grupos: **Quadras** (seca, alagada, submersa e o custo de andar), **Lugares** (igreja, cais, casa com ferido, casa vazia com ✓, casa vazia com ✗) e **Pessoas e avisos** (voluntário e anel dourado, "+1" de carregando, sugestão/ping, número dourado de custo). Começa com a frase "Como ler o mapa: o número no canto de cada quadra é a altura dela." e fecha com "Fechar" ou "Voltar ao jogo".
- Na mesa, a TV mostra a legenda rápida e a completa em tela cheia em 3 colunas. No celular, a legenda completa ocupa a tela inteira.

## 5. Água: nível do rio (opção A)

Existe um único medidor, o **nível do rio** (`riverLevel`), de 0 a 24. Ele só sobe. Chegou a 24 ou mais, a equipe perde.

Cada quadra tem dois limiares, que dependem da altura:

| Altura | Alaga a partir do nível | Submerge a partir do nível |
| --- | --- | --- |
| 1 | 5 | 12 |
| 2 | 12 | 19 |
| 3 | 19 | 26 (na prática, nunca) |

Regras:

1. **Ligação com o rio:** uma quadra só molha se estiver encostada no rio (coluna A) ou numa quadra já molhada. Assim a água avança pelo vale e o morro protege o que está atrás dele. A ligação considera só as 4 vizinhas ortogonais, o mesmo critério do andar. A igreja e o cais nunca molham e, por isso, não passam a água adiante; as vizinhas deles ainda podem molhar por outros caminhos.
2. **Estados da quadra:** seca, alagada ou submersa (`dry`, `flooded`, `submerged`). O estado é recalculado a cada subida do nível e a cada saco de areia.
3. **Saco de areia:** cada saco soma +3 aos dois limiares da quadra (máximo 2 sacos por quadra). Não vale para igreja e cais. Se o recálculo fizer a quadra voltar a um estado menos molhado, ela seca.
4. **Custo de andar** (pelo estado da quadra de destino): seca 1, alagada 2 (Bombeiro 1), submersa proibida (só a Barqueira, custo 1). A Barqueira paga +1 ação por passo enquanto carrega 2 moradores. **(a testar)**

Exemplo: o nível está em 10 e sai uma carta Chuva (+2), levando-o a 12. As quadras de altura 1 ligadas ao rio passam a submersas. As de altura 2 ligadas a elas passam a alagadas. Moradores nas casas de altura 1 viram ilhados, e os das casas de altura 2 ficam feridos.

## 6. Moradores

| Estado (`ResidentStatus`) | Significado |
| --- | --- |
| Saudável (`healthy`) | Na casa, esperando resgate. |
| Ferido (`injured`) | A quadra dele ficou alagada. Pegar um ferido custa 2 ações (1 para a Médica). A Médica cura (volta a saudável). |
| Ilhado (`stranded`) | A quadra dele ficou submersa. Está perdido e conta para a derrota. |
| Salvo (`safe`) | Entregue na igreja. |

- Moradores são carregados: pegar um morador na mesma quadra custa 1 ação (2 se estiver ferido; a Médica paga 1).
- Ao entrar na igreja, todo morador carregado é entregue automaticamente, sem gastar ação. O morador entregue fica salvo para sempre e não precisa ir ao cais.
- Morador carregado não sofre efeito da água. O voluntário sofre (seção 8).
- **Ferimento e isolamento acontecem na transição da quadra**, não por ela estar molhada. Quando a quadra passa para um estado mais molhado, os moradores saudáveis dela ficam feridos (seca → alagada) ou todos ficam ilhados (→ submersa). Estar alagada, por si só, não fere ninguém de novo.
- O ferido continua ferido mesmo que a quadra seque depois (por saco de areia). O ilhado nunca volta, mesmo que a quadra seque.
- O morador curado pela Médica fica saudável, mesmo numa quadra que continua alagada. Ele só volta a ficar ferido se a quadra passar de novo para um estado mais molhado (por exemplo, secar e alagar outra vez).
- Não há contador de tempo: o perigo vem do nível da água.
- Moradores no mapa = meta + 3. Assim, o 4º ilhado torna a meta impossível, e a regra da derrota por ilhados fica coerente.

## 7. Turno e ações

Ordem fixa por assento. O jogador da vez tem 3 ações (as que não usar são perdidas) e depois encerra o turno:

1. **Ações** (até 3), com desfazer disponível.
2. **Encerrar turno** (botão explícito, para dar tempo de desfazer).
3. **Chuva:** compra-se 1 carta do baralho de chuva e o nível sobe.
4. A água é recalculada, moradores mudam de estado, voluntários apanhados pela água são levados ao cais (seção 8) e o jogo verifica vitória e derrota.
5. Passa a vez ao próximo assento.

| Ação (`ActionType`) | Custo | Quem |
| --- | --- | --- |
| Andar (`move`) | pelo estado da quadra de destino (seção 5), mais 1 se a Barqueira carrega 2. | Todos |
| Pegar morador (`pick-up`) | 1 (2 se ferido; Médica paga 1). | Todos |
| Curar (`heal`) | 0. | Médica |
| Saco de areia (`reinforce`) | 2 (Engenheiro 1, e pode ser em quadra vizinha). | Todos |
| Alerta de temporal (`forecast`) | 1. | Radialista, só na Tempestade |
| Chamado pelo rádio (`radio-call`) | 1 (uma vez por turno). | Radialista |
| Desfazer (`undo`) | 0. | Quem tem a vez |

A altura não afeta o movimento na v1.

**Desfazer e Alerta de temporal:** o alerta é um ponto sem volta. Ao usá-lo, o histórico do turno é limpo, e o desfazer só alcança as ações feitas depois dele.

## 8. Vitória e derrota

- **Vitória:** moradores salvos ≥ meta **e** todos os voluntários no cais. Vale na hora em que as duas condições forem verdadeiras.
- **Derrota:**
  1. 4 moradores ilhados.
  2. Nível do rio chegou a 24 ou mais.
- **Voluntário apanhado pela água (não é derrota)** **(a testar)**: depois da chuva, se um voluntário (exceto a Barqueira) estiver numa quadra submersa, o barco de resgate o leva ao cais. Ele perde o turno seguinte: não tem ações, mas a carta de chuva desse turno ainda é comprada, porque a água não espera. Os moradores que ele carregava ficam ilhados e contam para a derrota. Se as simulações mostrarem que o jogo ficou fácil demais, a derrota imediata pode voltar só na Tempestade.
- Ao perder, a tela final mostra uma dica relacionada ao motivo.

## 9. Dificuldades e baralho de chuva

Cartas de chuva (`RainCardKind`): Nublado (`cloudy`, +0), Garoa (`drizzle`, +1), Chuva (`rain`, +2), Temporal (`storm`, +3). O baralho tem 25 cartas e é embaralhado com semente guardada no estado. Ao esgotar, o descarte é embaralhado de novo.

| | Tranquilo (`easy`) | Normal (`normal`) | Tempestade (`storm`) |
| --- | --- | --- | --- |
| Meta de moradores salvos | 8 | 9 | 10 |
| Moradores no mapa | 11 | 12 | 13 |
| Nível inicial | 0 | 0 | 0 |
| Cartas Nublado / Garoa / Chuva / Temporal | 10 / 11 / 4 / 0 | 13 / 8 / 3 / 1 | 16 / 4 / 2 / 3 |
| Subida média por carta | 0,76 (sem Temporal) | 0,68 | 0,68 (mais Temporais: imprevisível) |
| Previsão (com Radialista) | próximas 2 cartas, grátis | próxima carta, grátis | só "vem Temporal?" (sim/não), custa 1 ação |
| Taxa de vitória alvo (inicial) | 70 a 80% | 45 a 60% | 20 a 35% |

Todos os valores desta tabela são **(inicial)**.

## 10. Modos de jogo

- **Um aparelho:** todos em volta de um tablet ou notebook. Sem tela de "passe o aparelho", porque não há segredo.
- **Vários aparelhos (online):** sala com código e senha, como no Senhorio. Cada pessoa vê o tabuleiro inteiro, o próprio papel e os botões de ação. Só o jogador da vez age.
- **Mesa:** tabuleiro grande na TV ou notebook (assento de mesa, como no Senhorio), celulares como controle. Funciona como o modo online mais uma tela espelhada.
- **Opinar (ping):** fora da sua vez, o jogador toca numa quadra e escolhe "ir para cá", "cuidado" ou "pegar daqui". Máximo de 3 pings por jogador, apagados ao fim do turno. Pings não fazem parte do estado do jogo e têm limite de frequência.
- **Desconexão:**
  1. A equipe é avisada ("Diego desconectou, o bot assumiu").
  2. O bot entra após cerca de 20 s de espera na vez da pessoa, ou no início do próximo turno dela, para evitar acionar por oscilação de Wi-Fi.
  3. A pessoa volta com o código e a senha da sala (ou o token do assento) e retoma o controle no início do próprio turno seguinte, nunca no meio do turno de um bot.
  4. O assento não é removido por inatividade.

## 11. Bots

- Função pura `botMove(state, seat)`, usando só informação pública (sem trapacear). Primeira versão heurística: avalia sequências de até 3 ações e escolhe a de maior pontuação (moradores salvos, risco da quadra e do voluntário, distância até o próximo morador, uso da habilidade).
- A mesma lógica serve como botão "sugerir jogada" para iniciantes.
- Simulações obrigatórias antes de fechar os números: milhares de partidas por combinação de dificuldade × tamanho da equipe × papéis, medindo taxa de vitória, duração, causas de derrota, ilhados e quantos voluntários foram apanhados pela água. Os bots são a régua relativa entre configurações. A calibração final exige partidas com pessoas.

## 12. Extra para a v2: chuva que escorre (opção B)

Registrada para depois que a v1 estiver finalizada. Ideia: cada carta de chuva traz uma intensidade e uma região do mapa. A água cai em quadras dessa região (sorteadas com a semente) e, ao fim do turno, escorre para vizinhas de altura igual ou menor. Lugares altos só molham com chuva direta. A previsão da Radialista mostraria a região. Seria uma regra extra do nível Tempestade. Para isso, o código da v1 deve isolar o cálculo da água atrás de uma interface (`WaterModel`), de modo que o modelo A possa ser trocado ou estendido sem reescrever o resto.

## 13. Pontos em aberto e hipóteses a validar

1. Valores do mapa e do baralho: tudo **(inicial)**, calibrar por simulação.
2. ~~Voluntário apanhado pela água.~~ **Decidido (20/11/2026):** manter a penalidade como está, com a chuva caindo no turno perdido e sem derrota imediata. Nas simulações, acontece de 0,01 a 0,04 vez por partida e as variantes não mudaram o resultado. Rever com pessoas (Etapa 7).
3. ~~Barqueira dominante.~~ **Decidido (20/11/2026):** manter capacidade 2 e +1 por passo; ela não é dominante (+16 pontos no Normal). Contexto original: no mapa v1, atravessar quadra submersa vale pouco, porque os moradores dessas quadras já viraram ilhados e as quadras de altura 2 e 3 ficam ligadas em volta do morro. O que mais pesa é a capacidade 2. Os ajustes leves já aplicados (+1 ação por passo com 2 moradores) são hipóteses. Medir a taxa de vitória por composição de equipe, inclusive sem Barqueira.
4. ~~Bombeiro pegando ferido por 1 ação.~~ **Decidido (20/11/2026):** era o papel mais forte (+30 pontos no Normal); passa a pagar 2, e a vantagem de pegar ferido por 1 vai para a Médica.
5. Entrega automática na igreja é uma escolha para reduzir toques no celular. Confirmar nos testes.
6. Nível inicial 4 na Tempestade e +3 por saco de areia são hipóteses.
7. ~~Equipes de 2 assentos.~~ **Decidido (20/11/2026):** não mudar a regra agora. Tranquilo e Tempestade ficaram nas faixas; o Normal com 2 assentos ficou baixo, mas a meta reduzida passou do ponto. Manter a recomendação de 3 ou 4 assentos e reavaliar com pessoas (Etapa 7).
8. Tempo limite opcional por turno no online.
9. Mockups no celular: validar tamanho das quadras (6 colunas em 390 px) e a legibilidade dos estados sem depender de cor.
10. ~~Igreja como porto seguro pode deixar o jogo fácil?~~ **Decidido (20/11/2026):** manter. As derrotas são quase todas por ilhados e nas vitórias ainda sobram de 6 a 10 níveis; a pressão vem de tirar os moradores a tempo. Contexto original: Como a igreja nunca alaga e o morador entregue fica salvo para sempre, o jogo vira uma corrida de entregas (casa → igreja), e a dificuldade vem só do relógio da água. Medir nas simulações: quantos turnos sobram quando a equipe vence, taxa de vitória por dificuldade e quanto a Barqueira transportando 2 moradores encurta o trajeto. Se o jogo ficar fácil, as alavancas são: aumentar a meta, subir a média de chuva, aumentar o custo extra da Barqueira com 2 moradores ou afastar o cais/a igreja no mapa. Se ficar difícil demais, o caminho é o inverso.
11. Legenda na mesa: a TV costuma não ter toque. Definir como abrir a legenda completa na TV (controle remoto/teclado, ou pelo celular de quem controla) e se a legenda rápida basta na TV.
12. Marcas "✓" e "✗" nas casas: confirmar nos testes com pessoas se o símbolo é entendido sem explicação ou se precisa de texto curto.
13. ~~Mockup "Sua vez" contradiz a regra do Bombeiro.~~ **Decidido (20/11/2026):** vale a regra (o Bombeiro paga 1 para pegar ferido). O texto do mockup não muda; se um mockup contradisser as regras, valem as regras.
14. ~~Imagens exportadas dos mockups incompletas.~~ **Resolvido (20/11/2026):** as telas foram reexportadas com o tabuleiro desenhado.
15. ~~Vizinhança da água.~~ **Decidido (20/11/2026):** só as 4 vizinhas ortogonais; igreja e cais não passam a água adiante (seção 5, regra 1).
16. ~~Morador ferido em quadra que seca ou continua alagada.~~ **Decidido (20/11/2026):** ferido e ilhado não revertem quando a quadra seca; o curado só volta a ficar ferido numa nova transição para um estado mais molhado (seção 6).
17. ~~Desfazer depois do Alerta de temporal.~~ **Decidido (20/11/2026):** o alerta é um ponto sem volta e limpa o histórico do turno (seção 7).
18. ~~Valores fora do `RoleParams`.~~ **Decidido (20/11/2026):** todos os números vão para os dados; só a estrutura das regras fica no código. O schema completo será apresentado para aprovação no início da Etapa 1, antes de implementar.
19. ~~Tipos sem definição na especificação.~~ **Decidido (20/11/2026):** `SeatId`, `Snapshot`, `Ctx` e `Result` serão propostos e aprovados no início da Etapa 1. O motor continua puro: sem relógio e sem acesso a nada externo.
20. ~~Three.js no acabamento.~~ **Decidido (20/11/2026):** a v1 é em SVG; o 3D só entra se for avaliado e aprovado na Etapa 6 (ver Registro de decisões).
21. **Ajustes de tela vistos nos mockups (resolver na Etapa 3).**
    - O "+1" tem dois sentidos: na casa (borda vermelha), número de feridos; no voluntário (fundo escuro), carregando 1 morador. A diferença é quase só de cor e posição. Avaliar um símbolo diferente para ferido, porque os estados não podem depender só de cor.
    - Ordem dos turnos: no painel "Equipe" da mesa a ordem é Bruno, Lia, Carla, Diego; nas telas "Bot assumiu" e "Diego volta", depois do Bruno (T13) vem o Diego (T14) e depois a Lia (T15). O painel deve mostrar a ordem real dos assentos.
    - Em "Bot assumiu", o aviso diz que o bot já joga, mas a contagem "Esperando o Diego voltar 0:12" mostra que ele ainda não entrou (o bot só entra após cerca de 20 s, seção 10). O texto deve acompanhar a contagem.
    - Em "Opinar", "Vez do Bruno" e "Você é a Carla, Médica" ficam colados em 390 px. Quebrar a linha em telas estreitas.
    - Na mesa (T13), a Lia aparece carregando 1 morador ("+1" em A3), mas nas telas do celular do mesmo turno o "+1" não aparece.
22. **Vizinha fraca e Engenheiro forte (simulação de 20/11/2026).** Depois dos ajustes, o efeito de cada papel (com × sem) ficou dentro de ±10 pontos para Bombeiro, Médica e Radialista, mas a Vizinha ficou em −21 (Tranquilo), −8 (Normal) e −13 (Tempestade), e o Engenheiro em +10, +19 e +17; a Barqueira ficou em +15 no Normal. Andar na diagonal economiza pouco neste mapa, e o saco de areia por 1 ação, também em quadra vizinha, segura as casas por mais tempo. Decidir antes da Etapa 7 (ideias: dar à Vizinha uma segunda habilidade; Engenheiro pagando 1 só na própria quadra e 2 na vizinha). Ver `docs/simulation/2026-11-20-summary.md`.

## 14. Acessibilidade

- Os estados da água não dependem só de cor: altura em número em cada quadra, ondas para alagada e ondas com hachura para submersa.
- As marcas das casas também não dependem só de cor: "✓" e "✗" têm formas diferentes (verde e vermelho só reforçam) e cada quadra anuncia no rótulo de acessibilidade "casa vazia, todos retirados" ou "casa vazia, algum morador ficou ilhado".
- Alvos de toque de pelo menos 44 px (inclusive o botão "Legenda"), contraste mínimo 4,5:1, foco visível por teclado, rótulos de acessibilidade por quadra e anúncio dos eventos (`aria-live`).
- Respeitar `prefers-reduced-motion`.

## 15. Glossário PT para EN (nomes no código)

| PT | EN |
| --- | --- |
| Enchente na Vila | `village-flood` |
| Voluntário | `volunteer` |
| Morador | `resident` |
| Quadra | `tile` |
| Nível do rio | `riverLevel` |
| Seca, alagada, submersa | `dry`, `flooded`, `submerged` |
| Saudável, ferido, ilhado, salvo | `healthy`, `injured`, `stranded`, `safe` |
| Saco de areia | `sandbag` |
| Carta de chuva | `rainCard` |
| Igreja, cais | `church`, `dock` |
| Previsão | `forecast` |
| Apanhado pela água | `swept` |
| Perde o próximo turno | `skipNextTurn` |
| Casa de origem do morador | `homeTileId` |
| Marca da casa (✓, ✗) | `houseMark`: `cleared`, `lost` |
| Legenda (rápida, completa) | `legend`, `quickLegend` |

## 16. Registro de decisões

Decisão nova entra no topo, com data e motivo.

### 20/11/2026: calibração da Etapa 2 e ajustes de papéis

- **Decisão:** aprovados pelo dono do projeto, com base na simulação com bots (`docs/simulation/2026-11-20-summary.md`):
  1. **Dificuldades (pacote A):** metas 8 / 9 / 10 (moradores no mapa 11 / 12 / 13), todas começam no nível 0, baralhos 10/11/4/0 (Tranquilo, média 0,76, sem Temporal), 13/8/3/1 (Normal, 0,68) e 16/4/2/3 (Tempestade, 0,68, mais Temporais e mais imprevisível). O baralho do Tranquilo foi reajustado de 10/12/3/0 para 10/11/4/0 depois dos ajustes de papéis, para voltar à faixa.
  2. **Bombeiro** paga 2 para pegar ferido (era 1). Continua andando por 1 em quadra alagada.
  3. **Médica:** curar não gasta ação e ela pega ferido por 1.
  4. **Radialista:** além da previsão, ganha o **Chamado pelo rádio** (uma vez por turno, por 1 ação, o próximo voluntário na ordem ganha +1 ação no turno dele; perdida se o turno for perdido). Com +2, a Radialista passou a ser o papel mais forte (+21 pontos no Normal).
  5. **Pontos em aberto 2, 3, 7 e 10:** manter como estão.
  6. **Critério de equilíbrio:** o efeito de cada papel (com × sem) fica entre −10 e +10 pontos.
- **Motivo:** com os dados iniciais, o Normal e a Tempestade venciam 0% (faltavam ações para tirar os moradores das casas de altura 1 antes do nível 12), o Bombeiro era forte demais (+30) e a Médica (−9) e a Radialista (−13) eram fracas. Resultado final da simulação: Tranquilo 74%, Normal 51%, Tempestade 26% (todos nas faixas); Bombeiro +8, Médica +4 e Radialista +1 no Normal.
- **Consequências:** com metas mais próximas, a dificuldade passa a vir mais da meta que da média da chuva; a Tempestade se distingue pelo formato do baralho. Vizinha fraca e Engenheiro forte ficam no ponto em aberto 22. Os números continuam **(inicial)** até as partidas com pessoas (Etapa 7).

### 20/11/2026: dados, tipos e detalhes de regra do motor aprovados

- **Decisão:** aprovada a proposta `docs/engine-data-proposal.md`: arquivos de dados em `packages/engine/data/` (`rules.json`, `difficulties.json`, `maps/village-river.json`), validados por schema com **Zod 4** (nova dependência de produção do motor); tipos `SeatId`, `Ctx`, `Result` e `Snapshot`; números da partida guardados no estado (`config`); eventos novos `forecast-revealed`, `action-undone` e `turn-ended`. Detalhes de regra fixados:
  1. O Alerta de temporal olha só a próxima carta.
  2. O baralho é reembaralhado logo depois da compra que o esvazia; a previsão mostra só as cartas que restam.
  3. Se a derrota e a vitória acontecem no mesmo momento, vale a derrota.
  4. O voluntário levado ao cais pela água conta para a vitória.
  5. A Médica cura só moradores em quadra (não os carregados), na quadra dela ou numa vizinha ortogonal.
  6. O saco de areia vale em quadra submersa.
  7. Igreja e cais têm custo de quadra seca.
  8. Encerrar o turno com ações sobrando é permitido.
  9. Não há limite de voluntários na mesma quadra.
  10. A vitória é verificada depois de cada ação e depois da chuva.
- **Motivo:** cumprir a decisão "todos os números nos dados" e fechar pontos que as regras não diziam com todas as letras antes de implementar o motor. Zod: o schema gera os tipos TypeScript (fonte única) e servirá para validar as mensagens do servidor na Etapa 4.

### 20/11/2026: Three.js só se for aprovado na Etapa 6

- **Decisão:** a v1 é feita em SVG. O 3D só entra se for avaliado na Etapa 6 e cumprir três condições: rodar bem em Smart TV e em celular modesto, manter a acessibilidade e deixar o SVG como alternativa. Até lá, nenhuma dependência nova.
- **Motivo:** detalha a decisão de 19/11/2026 com critérios objetivos.

### 20/11/2026: tipos do motor e schema dos dados aprovados no início da Etapa 1

- **Decisão:** todos os números do jogo ficam nos dados, não só os do `RoleParams`: 3 ações por turno, nível máximo 24, limite de 4 ilhados, limiares por altura, sacos de areia (bônus e máximo) e custos (andar, pegar, saco de areia, alerta). Só a estrutura das regras fica no código (por exemplo, "só a Barqueira entra em quadra submersa"). O schema completo e os tipos `SeatId`, `Snapshot`, `Ctx` e `Result` são apresentados ao dono do projeto e aprovados antes de implementar. O motor continua puro: sem relógio e sem acesso a nada externo.
- **Motivo:** regra do `CLAUDE.md` (nenhum valor inicial fixo no código) e calibração da Etapa 2 só mexendo nos dados.

### 20/11/2026: desfazer depois do Alerta de temporal

- **Decisão:** o alerta é um ponto sem volta. Ao usá-lo, o histórico do turno é limpo, e o desfazer só alcança as ações feitas depois dele.
- **Motivo:** o alerta revela informação (a próxima carta), e desfazer as ações anteriores permitiria refazer o turno sabendo o resultado.

### 20/11/2026: ferido, ilhado e curado

- **Decisão:** ferimento e isolamento acontecem só na transição da quadra para um estado mais molhado. O ferido continua ferido se a quadra secar (saco de areia), e o ilhado nunca volta. O curado pela Médica fica saudável mesmo numa quadra que continua alagada e só volta a ficar ferido numa nova transição para um estado mais molhado.
- **Motivo:** mantém simples a regra "ferimento acontece na transição" e evita que o saco de areia desfaça perdas.

### 20/11/2026: vizinhança da água

- **Decisão:** a ligação com o rio usa só as 4 vizinhas ortogonais, o mesmo critério do andar (a Vizinha é a única exceção do jogo). A igreja e o cais nunca molham e, por isso, não passam a água adiante; as vizinhas deles ainda podem molhar por outros caminhos.
- **Motivo:** coerência com o movimento e com a regra "a água só se espalha a partir de quadras molhadas".

### 20/11/2026: mockups reexportados e prioridade das regras

- **Decisão:** se um mockup contradisser as regras, valem as regras. O texto do mockup "Sua vez" ("pegar o ferido custa 2") fica como está; o Bombeiro paga 1. As imagens dos mockups foram reexportadas com o tabuleiro desenhado.
- **Motivo:** os mockups são referência de layout, cores e textos, não de regras. Assim, essa dúvida não volta.

### 19/11/2026: Three.js fica em avaliação para o acabamento

- **Decisão:** o Three.js pode ser usado no acabamento, e a decisão fica para a Etapa 6. Até lá, o tabuleiro segue em HTML/SVG, como na especificação.
- **Motivo:** pedido do dono do projeto. Decidir no fim evita atrasar o motor e as telas. Como a interface só desenha o estado, trocar ou somar uma camada 3D não muda o motor.
- **Consequências:** o Three.js seria uma dependência de produção nova e precisa de aprovação. Na decisão, avaliar o desempenho em aparelhos modestos e em Smart TV, a acessibilidade (rótulos por quadra, `prefers-reduced-motion`) e o tamanho do pacote. Registrado também em "Pontos em aberto" (item 20).

### 19/11/2026: stack da Etapa 0 confirmada

- **Decisão:** TypeScript, Svelte 5, Vite, Vitest, fast-check, Playwright com axe-core, ESLint, Prettier e Cloudflare Workers com Durable Objects (SQLite), num monorepo pnpm, como propõe a especificação. Versões e ajustes:
  - **TypeScript 6.0**, não o 7: o typescript-eslint e o svelte-check ainda não aceitam o TypeScript 7. Rever quando aceitarem.
  - **Vitest 5** com **`@cloudflare/vitest-plugin`** para os testes do servidor dentro do runtime dos Workers. O pacote antigo, `@cloudflare/vitest-pool-workers`, foi descontinuado e renomeado.
  - **Tipos do Worker gerados pelo `wrangler types`**, como recomenda a documentação da Cloudflare, em vez do pacote `@cloudflare/workers-types`. O arquivo gerado não é versionado e é criado de novo a cada `pnpm typecheck`.
  - **pnpm 12** pelo Corepack, com `minimumReleaseAge` de 1 dia e scripts de instalação permitidos só para `esbuild` e `workerd`.
  - **Node.js 24 LTS** no CI (`.nvmrc`). Mínimo aceito: 22.12.
  - Telemetria do Wrangler desligada (`send_metrics: false`).
  - Actions do GitHub fixadas pelo SHA do commit, com permissão só de leitura no CI.
  - Dependabot semanal com espera de 7 dias para versões novas.
- **Motivo:** mesma stack do Senhorio Web, nas versões atuais e compatíveis entre si, seguindo as documentações oficiais e evitando pacotes descontinuados.
- **Ainda não incluído:** o `vite-plugin-pwa` entra na Etapa 5 (PWA). O `packages/kit` será extraído do `senhorio-web` na Etapa 4.

### 19/11/2026: primeiro commit direto na `main`

- **Decisão:** o repositório estava vazio, e a `main` foi criada com um único commit com os arquivos do pacote inicial (documentação, mockups e logo), sem alterações. Todo o resto vai para branches `develop/...`.
- **Motivo:** a branch `develop/foundation` precisa partir de uma `main` existente. Exceção única, aprovada pelo dono do projeto.

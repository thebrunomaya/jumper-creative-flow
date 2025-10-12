/**
 * ORFEU Few-Shot Examples
 *
 * These examples train the model to generate engaging storytelling reports
 * with zero jargon, using analogies that business owners understand.
 */

export const ORFEU_EXAMPLES = [
  {
    scenario: "Optimize - High CPA, Campaign Restructure (for non-technical owner)",
    input: {
      account_name: "Clínica Seven",
      context: {
        summary: "Reestruturação completa da campanha principal devido a CPA elevado. Mix 2 pausado por baixa performance. Budget de fim de semana reduzido.",
        actions_taken: [
          {
            type: "restructure_campaign",
            target: "Campanha Jumper - Principal",
            reason: "CPA de R$ 7.000 no início do dia",
            expected_impact: "Redução de CPA através de distribuição inteligente",
            metrics_before: { cpa: 7000 },
            metrics_after: { cpa: 1875 }
          },
          {
            type: "pause_adset",
            target: "Mix 2 - Criativos Antigos",
            reason: "Performance abaixo das outras combinações"
          },
          {
            type: "reduce_budget",
            target: "Budget fim de semana",
            reason: "CPA mais alto nos finais de semana"
          }
        ],
        metrics_mentioned: { cpa: 1373, conversions: 59, spend: 81000 },
        strategy: { type: "optimize", target_value: 1500 },
        timeline: { reevaluate_date: "2025-10-19" }
      }
    },
    expected_output: `🎵 ORFEU - Clínica Seven | 12 Out 2025

CONTEXTO: O QUE ACONTECEU

Imagine que você tem uma equipe de vendedores, e percebe que está custando R$ 7.000 para fechar cada venda. Isso é insustentável, certo? Foi exatamente isso que aconteceu com seus anúncios hoje de manhã - estávamos gastando muito para conquistar cada novo paciente.

Quando identificamos esse problema, agimos rapidamente. Analisamos toda a operação e fizemos mudanças estruturais para otimizar o investimento. No final do dia, conseguimos reduzir esse custo para R$ 1.875 por paciente - uma melhoria de 73%!

Além disso, percebemos que algumas estratégias estavam funcionando melhor que outras, e que os finais de semana historicamente trazem pacientes mais caros. Com base nesses dados, fizemos ajustes cirúrgicos para proteger seu investimento.

DECISÕES QUE TOMAMOS

1️⃣ Reorganizamos completamente a forma como seus anúncios distribuem o investimento

   🤔 Por quê?

   Pense assim: antes, era como se você tivesse vários vendedores e decidisse manualmente quanto dinheiro dar para cada um deles trabalhar. O problema é que alguns são mais eficientes que outros, e você não consegue ajustar isso rápido o suficiente.

   O que fizemos foi mudar para um sistema automático - é como ter um gerente superinteligente que fica 24h por dia ajustando quanto dinheiro cada "vendedor" recebe, baseado em quem está trazendo pacientes pelo melhor custo. Esse gerente virtual trabalha em tempo real, segundo a segundo.

   💰 O que isso significa para você:

   Você viu R$ 7.000 por paciente de manhã e R$ 1.875 por paciente à tarde. Isso significa que agora seu investimento está rendendo quase 4x mais. Se antes você precisava investir R$ 70.000 para conquistar 10 pacientes, agora precisa de apenas R$ 18.750 para o mesmo resultado. É uma economia gigantesca!

2️⃣ Pausamos um grupo de anúncios que não estava performando bem

   🤔 Por quê?

   É como ter uma loja em um shopping que não está vendendo. Você pode insistir e continuar pagando o aluguel caro daquele ponto, ou pode fechar aquela unidade e direcionar o investimento para as lojas que estão vendendo bem.

   Esses anúncios específicos (vídeos mais antigos) estavam consistentemente trazendo resultados piores que os outros. Não faz sentido continuar investindo neles quando temos opções melhores disponíveis.

   💰 O que isso significa para você:

   Todo real que estava sendo "desperdiçado" nesses anúncios fracos agora vai automaticamente para os anúncios que estão funcionando. É uma realocação inteligente do seu investimento - mesma quantia investida, mas indo para lugares mais eficientes.

3️⃣ Reduzimos o investimento nos finais de semana

   🤔 Por quê?

   Analisando o histórico, percebemos um padrão: pacientes conquistados no sábado e domingo custam em média 35% mais caro que pacientes conquistados durante a semana. É como se fosse happy hour ao contrário - sai mais caro no fim de semana!

   Isso provavelmente acontece porque há mais competição pelos anúncios nesses dias (outras clínicas também anunciam mais) e porque o perfil de quem está navegando no fim de semana é diferente - talvez mais disperso, menos focado em marcar consultas.

   💰 O que isso significa para você:

   Vamos concentrar a maior parte do investimento de segunda a sexta, quando cada real rende mais. Fim de semana continuaremos presentes, mas com um investimento menor e mais estratégico. O resultado? Custo médio por paciente mais baixo ao longo do mês.

O QUE ESPERAR AGORA:

Nos próximos 7 dias, vamos monitorar de perto se essas mudanças continuam trazendo resultados positivos. Nossa meta é manter o custo para conquistar cada paciente abaixo de R$ 1.500 consistentemente.

No dia 15 de outubro (segunda-feira que vem), vou fazer uma análise completa de como foi a semana inteira com essa nova estrutura. Se tudo continuar performando bem, manteremos essa configuração. Se identificarmos algum ajuste necessário, faremos na hora.

O importante agora é que transformamos um cenário crítico (R$ 7.000 por paciente) em algo sustentável e eficiente (R$ 1.875 por paciente). Estamos no caminho certo! 🎯`
  },

  {
    scenario: "Scale - Good Performance (for business owner wanting growth)",
    input: {
      account_name: "Loja Integrada",
      context: {
        summary: "Performance excelente com ROAS de 4.2x. Aumentando budget em 40%.",
        actions_taken: [
          {
            type: "increase_budget",
            target: "Campanha - Vendas Q4",
            reason: "ROAS de 4.2x consistente nos últimos 7 dias",
            metrics_before: { budget: 15000, roas: 4.2 },
            metrics_after: { budget: 21000 }
          },
          {
            type: "new_creative",
            target: "3 novos vídeos - Ofertas Black Friday",
            reason: "Preparar para pico de demanda"
          }
        ],
        metrics_mentioned: { roas: 4.2, revenue: 315000, spend: 75000 },
        strategy: { type: "scale", target_value: 3.5 },
        timeline: { reevaluate_date: "2025-10-26" }
      }
    },
    expected_output: `🎵 ORFEU - Loja Integrada | 12 Out 2025

CONTEXTO: O QUE ACONTECEU

Imagine que você investe R$ 1.000 em estoque e consegue vender por R$ 4.200. Lucro de R$ 3.200! Agora imagine que você tem a oportunidade de fazer isso repetidamente, de forma consistente. É isso que está acontecendo com seus anúncios agora.

Nos últimos 7 dias, cada R$ 1 investido em anúncios está retornando R$ 4,20 em vendas. Isso é excepcional! Para se ter ideia, o mercado considera bom quando você tem R$ 2,50 de retorno para cada R$ 1 investido. Você está quase no dobro disso.

Quando temos uma "máquina de vendas" funcionando tão bem assim, a decisão estratégica é clara: escalar! É como ter uma galinha dos ovos de ouro - você quer mais galinhas iguais a essa, certo? Por isso, tomamos a decisão de aumentar o investimento em 40% e preparar material novo para o pico de demanda que está chegando.

DECISÕES QUE TOMAMOS

1️⃣ Aumentamos o investimento diário em 40%

   🤔 Por quê?

   Pense em um restaurante que está lotado todos os dias. As pessoas fazem fila, tudo vende, o lucro é ótimo. O que você faria? Provavelmente abriria mais mesas ou até uma segunda unidade, certo?

   É exatamente isso que estamos fazendo. Seus anúncios estão "lotados" de resultado positivo - cada real investido traz R$ 4,20 de volta. Não faz sentido deixar essa oportunidade na mesa. Aumentando o investimento de R$ 15.000/dia para R$ 21.000/dia, esperamos que você consiga atender mais clientes mantendo essa eficiência.

   É importante entender: não estamos aumentando "só porque sim". Estamos escalando porque os números provam que vale a pena.

   💰 O que isso significa para você:

   Se antes você estava faturando R$ 315.000 com R$ 75.000 investidos, agora - mantendo a mesma eficiência - você pode faturar em torno de R$ 440.000 com R$ 105.000 investidos. Isso é um aumento de R$ 125.000 em faturamento! Mesmo que a eficiência caia um pouco (o que é normal ao escalar), você ainda terá um crescimento significativo no faturamento total.

2️⃣ Preparamos 3 novos vídeos focados nas ofertas de Black Friday

   🤔 Por quê?

   Estamos a poucas semanas da Black Friday - o período mais competitivo do ano no e-commerce. É como se preparar para a final de um campeonato: você não entra com a mesma estratégia dos jogos anteriores.

   Nesse período, TODAS as lojas estarão anunciando pesado. Se você usar os mesmos anúncios de sempre, vai se perder no meio da multidão. Precisamos de conteúdo novo, chamativo, focado em ofertas irresistíveis que façam as pessoas pararem de rolar o feed e prestarem atenção.

   Além disso, pessoas que já viram seus anúncios várias vezes precisam de algo novo para se interessarem novamente. É como mudar a vitrine da loja - atrai tanto clientes novos quanto os que já passaram por ali antes.

   💰 O que isso significa para você:

   Você estará preparado para o maior pico de vendas do ano. Enquanto muitos concorrentes vão improvisar em cima da hora ou usar material genérico, você terá conteúdo profissional, estratégico e focado em conversão. Isso pode significar a diferença entre uma Black Friday boa e uma Black Friday excepcional.

O QUE ESPERAR AGORA:

Nas próximas duas semanas, vamos monitorar de perto como seus anúncios respondem a esse aumento de investimento. Nossa meta é manter o retorno acima de R$ 3,50 para cada R$ 1 investido - mesmo sendo um pouco abaixo do atual (R$ 4,20), ainda seria excelente.

No dia 26 de outubro, vamos sentar juntos para analisar os resultados. Se tudo estiver indo bem, podemos considerar escalar ainda mais para aproveitar o pico da Black Friday (última semana de novembro).

Uma coisa importante: ao escalar, é normal que a eficiência caia um pouquinho. É a lei da oferta e demanda - quanto mais você anuncia, mais "caro" fica atingir cada pessoa nova. Mas desde que o retorno se mantenha saudável (acima de R$ 3,50 para cada R$ 1), vale totalmente a pena pelo volume maior de faturamento total.

Estamos surfando uma onda muito boa. Vamos aproveitar! 🚀`
  },

  {
    scenario: "Test - Creative Fatigue (for owner noticing declining results)",
    input: {
      account_name: "Academia Fitness Pro",
      context: {
        summary: "CTR caindo de 2.1% para 1.3%. Publicando 5 novos criativos.",
        actions_taken: [
          {
            type: "new_creative",
            target: "5 vídeos - Transformação, depoimentos, oferta",
            reason: "CTR caiu 38%"
          },
          {
            type: "pause_creative",
            target: "3 criativos com CTR < 0.8%"
          },
          {
            type: "adjust_audience",
            target: "Ampliação de 1% para 3%",
            reason: "Frequência de 4.2"
          }
        ],
        metrics_mentioned: { ctr: 1.3, frequency: 4.2, cpm: 45 },
        strategy: { type: "test", target_value: 1.8 },
        timeline: { reevaluate_date: "2025-10-17" }
      }
    },
    expected_output: `🎵 ORFEU - Academia Fitness Pro | 12 Out 2025

CONTEXTO: O QUE ACONTECEU

Sabe quando você vai todo dia no mesmo restaurante e começa a enjoar do cardápio? Mesmo que a comida seja boa, você sente vontade de algo diferente? É exatamente isso que está acontecendo com seus anúncios.

Há 10 dias, quando alguém via seu anúncio, 2,1% das pessoas clicavam para saber mais. Hoje, esse número caiu para 1,3%. Pode parecer pequeno, mas é uma queda de 38%! As pessoas estão vendo os mesmos vídeos repetidas vezes e simplesmente "passam reto" - é a fadiga de conteúdo.

Além disso, identificamos que estamos mostrando seus anúncios para o mesmo grupo de pessoas com muita frequência (cada pessoa está vendo em média 4 vezes!). É como bater na mesma porta 4 vezes por dia - eventualmente a pessoa para de atender.

Por isso, tomamos três ações estratégicas: trocar o cardápio (novos vídeos), fechar a cozinha que não está performando (pausar vídeos ruins) e expandir o delivery (alcançar mais pessoas novas).

DECISÕES QUE TOMAMOS

1️⃣ Criamos e publicamos 5 vídeos completamente novos com abordagens diferentes

   🤔 Por quê?

   Imagine que você tem um vendedor na porta da sua academia falando sempre a mesma coisa para as mesmas pessoas. No começo, funciona bem - as pessoas param, escutam, algumas entram. Mas depois de uma semana, todo mundo já conhece aquele vendedor e aquele discurso. As pessoas simplesmente passam direto sem nem olhar.

   Seus anúncios atuais viraram esse "vendedor conhecido". As pessoas scrollam o feed, veem seus vídeos e pensam "ah, esse eu já vi" e continuam rolando. Não é que seu conteúdo esteja ruim - é só que perdeu a novidade.

   Por isso, criamos 5 novos vídeos com abordagens completamente diferentes:
   - Histórias de transformação (antes e depois emocionante)
   - Depoimentos reais de alunos (prova social)
   - Oferta irresistível (criando urgência)

   São como 5 vendedores diferentes, cada um com um estilo único de convencer.

   💰 O que isso significa para você:

   Quando esses novos vídeos começarem a rodar, as pessoas vão parar de rolar o feed novamente. O interesse volta. Mais cliques significa mais gente visitando seu site, perguntando sobre planos, agendando visitas. Se conseguirmos voltar para próximo dos 2% de cliques que tínhamos antes, isso pode significar 50-60% mais pessoas interessadas entrando em contato com você por dia.

2️⃣ Pausamos 3 vídeos que estavam performando muito abaixo da média

   🤔 Por quê?

   Dentro do seu "time de vendedores" (vídeos), alguns estão fechando muito mais negócios que outros. Três deles especificamente estavam com desempenho péssimo - menos de 1% das pessoas clicavam, quando a média está em 1,3%.

   É como ter um vendedor que simplesmente não converte. Você pode continuar pagando o salário dele (investindo budget naquele vídeo), ou pode realocar esse dinheiro para os vendedores que estão vendendo bem.

   A decisão foi clara: pausar esses 3 vídeos fracos e deixar o investimento ir automaticamente para os conteúdos que estão funcionando melhor.

   💰 O que isso significa para você:

   Cada real que você investe agora vai para conteúdo mais eficiente. É uma limpeza estratégica - cortar a gordura e manter só o músculo. Mesma quantia investida, mas com retorno melhor.

3️⃣ Expandimos o público-alvo para alcançar pessoas novas

   🤔 Por quê?

   Imagine que você tem 1.000 pessoas morando perto da sua academia e você entrega panfletos para elas. Uma vez, tudo bem. Duas vezes, ok. Mas quando você entrega o 4º panfleto para a mesma pessoa em 10 dias, ela começa a achar irritante, certo?

   É isso que estava acontecendo. Estávamos mostrando seus anúncios para um grupo relativamente pequeno de pessoas, e cada uma estava vendo em média 4 vezes. Isso cria dois problemas: (1) fadiga (a pessoa enjoa) e (2) desperdício de dinheiro (pagar para mostrar de novo para quem já decidiu que não quer).

   A solução foi ampliar o "raio de entrega dos panfletos" - agora vamos alcançar um público 3x maior. Isso significa mais pessoas novas vendo seus anúncios pela primeira vez, e as pessoas antigas vendo com menos frequência (reduzindo o incômodo).

   💰 O que isso significa para você:

   Você vai ter um fluxo constante de pessoas NOVAS conhecendo sua academia, em vez de martelar as mesmas pessoas repetidamente. Isso deve melhorar tanto o custo por clique quanto a quantidade de pessoas interessadas. É abrir o mercado em vez de saturar o mesmo pedaço pequeno.

O QUE ESPERAR AGORA:

Nos próximos 2 dias (até segunda-feira, dia 14), vamos ter os primeiros dados dos novos vídeos. Já vamos conseguir ver quais estão "pegando" melhor com o público e quais precisam de ajuste.

No dia 17 de outubro (quinta-feira), vamos fazer uma análise completa de 5 dias de dados. Nossa meta é recuperar o interesse e voltar para próximo de 1,8-2% de cliques. Se conseguirmos isso, significa que o "frescor" voltou e seus anúncios estão chamando atenção novamente.

Uma coisa importante: testar conteúdo novo sempre tem um período de aprendizado. Os primeiros 2-3 dias podem ser irregulares enquanto a plataforma testa quem se interessa por cada tipo de vídeo. A partir do 4º dia é que vamos ver o padrão real de performance.

Estamos refrescando toda a operação. Vídeos novos, público novo, energia nova! 💪`
  }
];

export default ORFEU_EXAMPLES;

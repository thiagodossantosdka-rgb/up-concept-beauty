/* ==========================================================================
   Up Concept Beauty — scripts
   JavaScript puro + GSAP/ScrollTrigger (cdnjs). Sem build.
   ========================================================================== */
(function () {
  'use strict';

  /* ---------------------------------------------------------------------
     CONFIGURAÇÃO — dados do salão
     --------------------------------------------------------------------- */
  var CONFIG = {
    whatsapp: '5561984021530',
    mensagemPadrao: 'Olá, Up Concept Beauty! Vim pelo site e gostaria de agendar um horário.',
    // Nome amigável de cada categoria (usado nas mensagens de WhatsApp)
    categorias: { hair: 'Cabelo', make: 'Maquiagem', nail: 'Unhas' }
  };

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  var root = document.documentElement;
  var reduzMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var temGSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';

  // Sem GSAP (CDN fora do ar) → cai no layout estático, igual ao de movimento reduzido
  if (!temGSAP) root.classList.remove('motion');
  var animar = temGSAP && !reduzMovimento;
  if (temGSAP) gsap.registerPlugin(ScrollTrigger);

  /* Estado compartilhado: categoria que a cliente demonstrou interesse */
  var estado = { categoria: null };

  /* ---------------------------------------------------------------------
     WHATSAPP — ÚNICA função que gera links (sempre com encodeURIComponent)
     --------------------------------------------------------------------- */
  function whatsappLink(mensagem) {
    return 'https://wa.me/' + CONFIG.whatsapp + '?text=' + encodeURIComponent(mensagem || CONFIG.mensagemPadrao);
  }

  /** Mensagem que acompanha o contexto (painel/aba clicados) */
  function mensagemContextual() {
    var nome = estado.categoria && CONFIG.categorias[estado.categoria];
    if (!nome) return CONFIG.mensagemPadrao;
    return 'Olá, Up Concept Beauty! Vim pelo site e gostaria de agendar um horário de ' + nome + '.';
  }

  /** Mensagem de um link específico: serviço (data-servico), fixa (data-wa-msg) ou contextual */
  function mensagemPara(a) {
    if (a.dataset.waMsg) return a.dataset.waMsg;
    if (a.dataset.servico) {
      var painel = a.closest('[data-categoria]');
      var cat = painel && CONFIG.categorias[painel.dataset.categoria];
      return 'Olá, Up Concept Beauty! Vim pelo site e gostaria de agendar: ' + a.dataset.servico + (cat ? ' (' + cat + ')' : '') + '.';
    }
    return mensagemContextual();
  }

  /** Atualiza o href de todos os links de WhatsApp */
  function atualizarLinksWhatsApp() {
    $$('[data-wa]').forEach(function (a) { a.href = whatsappLink(mensagemPara(a)); });
  }

  function definirCategoria(cat) {
    if (!CONFIG.categorias[cat]) return;
    estado.categoria = cat;
    atualizarLinksWhatsApp();
  }

  /* ---------------------------------------------------------------------
     RASTREAMENTO — GTM/GA4 (dataLayer) + Meta Pixel (fbq), sem quebrar
     se nenhum estiver instalado.
     --------------------------------------------------------------------- */
  var EVENTOS_PIXEL_PADRAO = { whatsapp_click: 'Contact', form_submit: 'Schedule' };

  function track(evento, dados) {
    dados = dados || {};
    try {
      window.dataLayer = window.dataLayer || [];
      var payload = { event: evento };
      for (var k in dados) payload[k] = dados[k];
      window.dataLayer.push(payload);
    } catch (e) { /* silencioso */ }
    try {
      if (typeof window.fbq === 'function') {
        if (EVENTOS_PIXEL_PADRAO[evento]) window.fbq('track', EVENTOS_PIXEL_PADRAO[evento], dados);
        else window.fbq('trackCustom', evento, dados);
      }
    } catch (e) { /* silencioso */ }
  }

  // Clique em qualquer WhatsApp: monta o link na hora e registra a origem
  function initWhatsApp() {
    atualizarLinksWhatsApp();
    document.addEventListener('click', function (e) {
      var a = e.target.closest('[data-wa]');
      if (!a) return;
      if (a.dataset.servico) {
        var painel = a.closest('[data-categoria]');
        if (painel) definirCategoria(painel.dataset.categoria);
      }
      a.href = whatsappLink(mensagemPara(a));
      var dados = { origem: a.dataset.wa, categoria: estado.categoria || 'geral' };
      if (a.dataset.servico) dados.servico = a.dataset.servico;
      track('whatsapp_click', dados);
    });
  }

  /* ---------------------------------------------------------------------
     HEADER — fundo com blur ao rolar
     --------------------------------------------------------------------- */
  function initHeader() {
    var header = $('.site-header');
    var ticking = false;
    function update() {
      header.classList.toggle('is-scrolled', window.scrollY > 24);
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  /* ---------------------------------------------------------------------
     MENU MOBILE — tela cheia
     --------------------------------------------------------------------- */
  function initMenuMobile() {
    var btn = $('.menu-toggle');
    var menu = $('#menu-mobile');
    var label = $('.sr-only', btn);
    if (!btn || !menu) return;

    function abrir() {
      menu.hidden = false;
      void menu.offsetWidth; // força o layout para a transição de abertura rodar
      menu.classList.add('is-open');
      btn.setAttribute('aria-expanded', 'true');
      label.textContent = 'Fechar menu';
      document.body.classList.add('is-locked');
      $('.site-header').classList.add('is-scrolled');
      var primeiro = $('a', menu);
      if (primeiro) setTimeout(function () { primeiro.focus(); }, 300);
    }
    function fechar(devolverFoco) {
      menu.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');
      label.textContent = 'Abrir menu';
      document.body.classList.remove('is-locked');
      setTimeout(function () { if (!menu.classList.contains('is-open')) menu.hidden = true; }, reduzMovimento ? 0 : 600);
      if (devolverFoco) btn.focus();
    }
    btn.addEventListener('click', function () {
      btn.getAttribute('aria-expanded') === 'true' ? fechar(false) : abrir();
    });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) fechar(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') fechar(true);
    });
    // Se a tela crescer para desktop com o menu aberto, fecha
    window.matchMedia('(min-width: 1024px)').addEventListener('change', function (mq) {
      if (mq.matches) fechar(false);
    });
  }

  /* ---------------------------------------------------------------------
     HERO
     --------------------------------------------------------------------- */
  function initHero() {
    var hero = $('#hero');
    if (!hero) return;
    var stage = $('.hero-stage', hero);
    var video = $('.hero-video', hero);
    var svg = $('.hero-mask', hero);
    var grupos = $$('.up-mark', svg);          // máscara + brilho (mesmos traços)
    var maskMark = $('.mask-mark', svg);
    var shineMark = $('.shine-mark', svg);
    var blur = $('#upBlur feGaussianBlur', svg);
    var gradiente = $('#upShine', svg);
    var intro = $('.hero-intro', hero);
    var lockup = $('.hero-lockup', hero);
    var shade = $('.hero-shade', hero);
    var conteudo = $$('.hero-content > *', hero);
    var paineis = $$('.universe', hero);
    var floatBtn = $('.wa-float');
    var header = $('.site-header');
    var brilhoLoop = null; // tween do brilho que se repete (pausado fora da tela)

    /* --- Vídeo: só aparece se carregar; senão o fallback animado fica visível --- */
    var videoOk = false;
    if (video) {
      video.addEventListener('loadeddata', function () {
        videoOk = true;
        video.classList.add('is-ready');
        hero.classList.add('com-video'); // desliga o fallback animado (economiza GPU)
      });
      var fonte = $('source', video);
      var falhou = function () { videoOk = false; video.classList.remove('is-ready'); hero.classList.add('sem-video'); };
      if (fonte) fonte.addEventListener('error', falhou);
      video.addEventListener('error', falhou);
    }
    function tocar() {
      if (!video || reduzMovimento || hero.classList.contains('sem-video')) return;
      var p = video.play();
      if (p && p.catch) p.catch(function () { /* autoplay bloqueado: fica o poster/fallback */ });
    }

    /* --- Pausa o vídeo fora da tela + mostra o botão flutuante depois da hero --- */
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          // Fora da tela: pausa vídeo, animações CSS do fallback e o brilho em loop
          hero.classList.toggle('is-offscreen', !en.isIntersecting);
          if (en.isIntersecting) { tocar(); if (brilhoLoop) brilhoLoop.resume(); }
          else { if (video) video.pause(); if (brilhoLoop) brilhoLoop.pause(); }
        });
      }, { threshold: 0 }).observe(hero);
      // Botão flutuante: aparece quando o fim da hero passa da metade da tela
      new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          var passou = !en.isIntersecting && en.boundingClientRect.top < 0;
          if (floatBtn) floatBtn.classList.toggle('is-visible', passou);
          header.classList.toggle('passou-hero', passou); // blur do header só depois da hero
        });
      }, { threshold: 0, rootMargin: '-50% 0px 0px 0px' }).observe(hero);
    } else {
      tocar();
      if (floatBtn) floatBtn.classList.add('is-visible');
    }

    /* --- Painéis: guardam a categoria escolhida e levam à aba de serviços --- */
    paineis.forEach(function (p) {
      p.addEventListener('mouseenter', function () { definirCategoria(p.dataset.categoria); });
    });
    $$('.universe-link', hero).forEach(function (link) {
      link.addEventListener('click', function () {
        definirCategoria(link.dataset.categoria);
        track('painel_hero_click', { categoria: link.dataset.categoria });
      });
    });

    if (!animar) return; // movimento reduzido ou sem GSAP: layout estático

    /* --- Geometria do monograma "UP" (recalculada ao redimensionar) ---
       Medidas em unidades do desenho (iguais ao sprite #up-mark):
       caixa com o traço = 314 × 224; haste compartilhada U/P em x = 153; traço = 14 */
    var MARCA = { x0: -7, y0: -11, w: 314, h: 228, hasteX: 153, hasteY: 105, traco: 14 };
    var geo = { w: 0, h: 0, ox: 0, oy: 0, maxS: 40 };
    var zoom = { p: 0 };

    function aplicarZoom() {
      // Durante o zoom o brilho em loop fica parado (evita redesenhar a máscara à toa)
      if (brilhoLoop) { if (zoom.p > 0.001) brilhoLoop.pause(); else if (!hero.classList.contains('is-offscreen')) brilhoLoop.resume(); }
      var s = Math.pow(geo.maxS, zoom.p);
      svg.setAttribute('viewBox',
        (geo.ox - geo.ox / s).toFixed(2) + ' ' + (geo.oy - geo.oy / s).toFixed(2) + ' ' +
        (geo.w / s).toFixed(2) + ' ' + (geo.h / s).toFixed(2));
    }

    function layoutUP() {
      var w = stage.clientWidth, h = stage.clientHeight;
      geo.w = w; geo.h = h;
      svg.setAttribute('preserveAspectRatio', 'none');

      var alturaHeader = $('.site-header').offsetHeight;
      var alturaLockup = lockup.offsetHeight;
      var espaco = Math.max(18, h * 0.03);
      var reservaHint = 96; // espaço do "Role para descobrir"

      // Escala: ~72% da largura no celular, 60% no desktop, limitada pela altura disponível
      var k = Math.min(
        (w * (w < 768 ? 0.72 : 0.6)) / MARCA.w,
        (h * 0.46) / MARCA.h,
        (h - alturaHeader - alturaLockup - espaco - reservaHint) / MARCA.h
      );
      var larg = MARCA.w * k, alt = MARCA.h * k;
      var total = alt + espaco + alturaLockup;
      var topo = Math.max(alturaHeader + 8, alturaHeader + (h - alturaHeader - reservaHint - total) / 2);
      var tx = (w - larg) / 2 - MARCA.x0 * k;
      var ty = topo - MARCA.y0 * k;

      grupos.forEach(function (g) {
        g.setAttribute('transform', 'translate(' + tx.toFixed(2) + ' ' + ty.toFixed(2) + ') scale(' + k.toFixed(4) + ')');
      });
      hero.style.setProperty('--tag-top', (topo + alt + espaco).toFixed(1) + 'px');

      // Origem do zoom: meio da haste compartilhada do U e do P
      geo.ox = tx + MARCA.hasteX * k;
      geo.oy = ty + MARCA.hasteY * k;
      // Escala para o traço da haste cobrir a tela inteira (+ folga)
      geo.maxS = Math.min(180, (2 * Math.max(geo.ox, w - geo.ox) / (MARCA.traco * k)) * 1.3);
      aplicarZoom();
    }

    /* --- Entrada: os traços do monograma se desenham, o desfoque se dissipa
           e um brilho rose gold atravessa as letras --- */
    function entrada() {
      var tl = gsap.timeline({
        defaults: { ease: 'power3.out' },
        onComplete: function () { maskMark.removeAttribute('filter'); } // libera desempenho para o zoom
      });
      // Desfoque só em desktop: o filtro é redesenhado a cada quadro e pesa em celular
      var comDesfoque = window.matchMedia('(min-width: 1024px) and (hover: hover)').matches;
      if (!comDesfoque) maskMark.removeAttribute('filter');
      tl.set(blur, { attr: { stdDeviation: comDesfoque ? 10 : 0 } })
        .set(svg, { scale: 1.05, transformOrigin: '50% 40%' })
        .to(maskMark, { attr: { 'stroke-dashoffset': 0 }, duration: 2.2, ease: 'power2.inOut' }, 0.15)
        .to(blur, { attr: { stdDeviation: 0 }, duration: 2 }, 0.15)
        .to(svg, { scale: 1, duration: 2.6, ease: 'power2.out' }, 0)
        .to(shineMark, { opacity: 1, duration: 0.3 }, 1.9)
        .fromTo(gradiente, { attr: { x1: -200, x2: -60 } }, Object.assign({ duration: 1.6, ease: 'power2.inOut' }, { attr: { x1: 340, x2: 480 } }), 1.9)
        .from(lockup.children, { autoAlpha: 0, y: 14, stagger: 0.15, duration: 1.2 }, 1.2)
        .from('.scroll-hint', { autoAlpha: 0, y: 10, duration: 1 }, 2.2);

      // Brilho volta a passar suavemente a cada ~7s enquanto a cliente não rola
      brilhoLoop = gsap.fromTo(gradiente, { attr: { x1: -200, x2: -60 } }, Object.assign({
        duration: 1.8, ease: 'power2.inOut', repeat: -1, repeatDelay: 6, delay: 9
      }, { attr: { x1: 340, x2: 480 } }));
    }

    /* --- Linha do tempo do scroll (desktop × mobile) --- */
    function montarScroll() {
      var mm = gsap.matchMedia();
      mm.add({
        desktop: '(min-width: 1024px) and (hover: hover)',
        mobile: '(max-width: 1023px), (hover: none)'
      }, function (c) {
        var desktop = c.conditions.desktop;
        if (desktop) hero.classList.add('is-cinematic');

        var tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: hero,
            start: 'top top',
            end: desktop ? '+=200%' : '+=120%',
            pin: desktop ? hero : stage,
            scrub: 0.8,
            anticipatePin: 1,
            invalidateOnRefresh: true
          }
        });

        // Momento A — zoom para dentro das letras
        tl.to(intro, { autoAlpha: 0, y: -30, duration: 0.6 }, 0)
          .to(shineMark, { autoAlpha: 0, duration: 0.3 }, 0)      // menos coisa para redesenhar no zoom
          .to(zoom, { p: 1, duration: 3, ease: 'power1.in', onUpdate: aplicarZoom }, 0)
          .to(svg, { autoAlpha: 0, duration: 0.7 }, 2.3)        // invisível = o navegador para de desenhar a máscara           // garante tela 100% vídeo
          .to(shade, { opacity: 1, duration: 1 }, 2.5)
          .fromTo(conteudo, { autoAlpha: 0, y: 40 },
            { autoAlpha: 1, y: 0, stagger: 0.3, duration: 1, ease: 'power2.out' }, 2.9);

        if (desktop) {
          // pausa com o título na tela, depois Momento B
          tl.to(conteudo, { autoAlpha: 0, y: -40, stagger: 0.1, duration: 0.8, ease: 'power2.in' }, 6.2)
            .fromTo(paineis, { clipPath: 'inset(100% 0% 0% 0%)' },
              { clipPath: 'inset(0% 0% 0% 0%)', stagger: 0.35, duration: 1.6, ease: 'power3.inOut' }, 6.3)
            .fromTo($$('.universe-img', hero), { scale: 1.25 },
              { scale: 1.04, stagger: 0.35, duration: 2, ease: 'power2.out', clearProps: 'transform' }, 6.3)
            .to({}, { duration: 0.4 }); // respiro final antes de soltar o pin
        } else {
          tl.to({}, { duration: 1.2 }); // segura o título um pouco no celular
          // Mobile: cards entram com um deslize simples
          gsap.from(paineis, {
            autoAlpha: 0, x: 60, stagger: 0.12, duration: 0.9, ease: 'power3.out',
            scrollTrigger: { trigger: '.universes', start: 'top 80%' }
          });
        }

        return function () { hero.classList.remove('is-cinematic'); };
      });
    }

    /* --- Inicialização: espera a fonte (com limite de tempo) --- */
    var fonte = document.fonts && document.fonts.load
      ? Promise.race([
          Promise.all([document.fonts.load('400 16px Jost'), document.fonts.load('500 16px Jost')]), // o lockup é medido
          new Promise(function (r) { setTimeout(r, 2500); })
        ])
      : Promise.resolve();

    function iniciar() {
      // Palco ainda sem tamanho (aba em segundo plano, layout pendente): tenta no próximo quadro
      if (!stage.clientWidth || !stage.clientHeight) { requestAnimationFrame(iniciar); return; }
      layoutUP();
      entrada();
      montarScroll();
      ScrollTrigger.refresh();
    }
    fonte.then(iniciar);
    // As fontes carregam de forma assíncrona: quando chegarem, reposiciona o lockup
    if (document.fonts && document.fonts.addEventListener) {
      // (só move o SVG e o lockup; não precisa recalcular os ScrollTriggers, que é caro)
      var agendado = 0;
      document.fonts.addEventListener('loadingdone', function () {
        cancelAnimationFrame(agendado);
        agendado = requestAnimationFrame(function () { if (geo.w && zoom.p === 0) layoutUP(); });
      });
    }

    var timer;
    window.addEventListener('resize', function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        if (stage.clientWidth === geo.w && Math.abs(stage.clientHeight - geo.h) < 120) return; // ignora barra do navegador mobile
        if (!stage.clientWidth) return;
        layoutUP();
        ScrollTrigger.refresh();
      }, 200);
    });
  }

  /* ---------------------------------------------------------------------
     ÂNCORAS de categoria (#servicos-hair etc.) → seção de serviços
     --------------------------------------------------------------------- */
  function initHashCategoria() {
    function aplicar(hash) {
      var m = /^#servicos-(hair|make|nail)$/.exec(hash || '');
      if (!m) return false;
      definirCategoria(m[1]);
      document.dispatchEvent(new CustomEvent('categoria:selecionada', { detail: m[1] }));
      var alvo = document.getElementById('servicos');
      if (alvo) alvo.scrollIntoView({ behavior: reduzMovimento ? 'auto' : 'smooth' });
      return true;
    }
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href^="#servicos-"]');
      if (!a) return;
      var hash = a.getAttribute('href');
      if (aplicar(hash)) {
        e.preventDefault();
        history.replaceState(null, '', hash);
      }
    });
    window.addEventListener('hashchange', function () { aplicar(location.hash); });
    if (location.hash) window.addEventListener('load', function () { aplicar(location.hash); });
  }

  /* ---------------------------------------------------------------------
     3. FAIXA DE DESTAQUES — letreiro infinito
     Velocidade varia com a velocidade do scroll; pausa no hover.
     --------------------------------------------------------------------- */
  function initMarquee() {
    var marquee = $('.marquee');
    if (!marquee || !animar) return;
    var track = $('.marquee-track', marquee);
    var lista = $('.marquee-list', track);
    // Duplica a lista para o loop não ter emenda (cópia escondida de leitores de tela)
    var copia = lista.cloneNode(true);
    copia.setAttribute('aria-hidden', 'true');
    track.appendChild(copia);

    var loop = gsap.to(track, { xPercent: -50, ease: 'none', duration: 38, repeat: -1 });
    var base = 1, alvo = 1, hover = false;

    // Acelera levemente conforme a velocidade do scroll e volta ao normal
    ScrollTrigger.create({
      trigger: marquee,
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: function (self) {
        alvo = 1 + Math.min(Math.abs(self.getVelocity()) / 900, 3);
      },
      onToggle: function (self) { self.isActive ? loop.resume() : loop.pause(); } // fora da tela não anima
    });
    gsap.ticker.add(function () {
      if (loop.paused()) return;
      base += ((hover ? 0 : alvo) - base) * 0.08; // no hover desacelera até parar
      alvo += (1 - alvo) * 0.05;
      loop.timeScale(Math.max(base, 0.0001));
    });
    marquee.addEventListener('mouseenter', function () { hover = true; });
    marquee.addEventListener('mouseleave', function () { hover = false; });
  }

  /* ---------------------------------------------------------------------
     4. SERVIÇOS — abas (Cabelo / Maquiagem / Unhas)
     --------------------------------------------------------------------- */
  function initServicos() {
    var abas = $$('.tabs [role="tab"]');
    if (!abas.length) return;
    var indicador = $('.tab-indicator');

    function moverIndicador(aba) {
      if (!indicador) return;
      indicador.style.width = aba.offsetWidth + 'px';
      indicador.style.transform = 'translateX(' + aba.offsetLeft + 'px)';
    }

    function ativar(aba, opcoes) {
      opcoes = opcoes || {};
      var atual = $('.tabs [aria-selected="true"]');
      var cat = aba.dataset.categoria;
      abas.forEach(function (a) {
        var sel = a === aba;
        a.setAttribute('aria-selected', sel ? 'true' : 'false');
        a.tabIndex = sel ? 0 : -1;
      });
      moverIndicador(aba);
      if (opcoes.foco) aba.focus();
      var painelNovo = document.getElementById(aba.getAttribute('aria-controls'));
      var painelVelho = atual && atual !== aba ? document.getElementById(atual.getAttribute('aria-controls')) : null;

      if (painelVelho) {
        if (animar) {
          gsap.to(painelVelho, {
            autoAlpha: 0, x: -24, duration: 0.25, ease: 'power2.in',
            onComplete: function () {
              painelVelho.hidden = true;
              gsap.set(painelVelho, { clearProps: 'all' });
              mostrar(painelNovo);
            }
          });
        } else { painelVelho.hidden = true; mostrar(painelNovo); }
      } else { mostrar(painelNovo); }

      if (!opcoes.silencioso) {
        definirCategoria(cat);
        track('servicos_aba', { categoria: cat });
      }
    }

    function mostrar(painel) {
      painel.hidden = false;
      if (!animar) return;
      gsap.fromTo(painel, { autoAlpha: 0, x: 24 }, { autoAlpha: 1, x: 0, duration: 0.45, ease: 'power3.out', clearProps: 'transform' });
      gsap.fromTo($$('.service-card', painel), { autoAlpha: 0, y: 28 },
        { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.07, ease: 'power3.out', clearProps: 'transform' });
    }

    abas.forEach(function (aba, i) {
      aba.addEventListener('click', function () { if (aba.getAttribute('aria-selected') !== 'true') ativar(aba); });
      // Navegação por teclado (setas, Home, End) — padrão ARIA de abas
      aba.addEventListener('keydown', function (e) {
        var n = null;
        if (e.key === 'ArrowRight') n = abas[(i + 1) % abas.length];
        else if (e.key === 'ArrowLeft') n = abas[(i - 1 + abas.length) % abas.length];
        else if (e.key === 'Home') n = abas[0];
        else if (e.key === 'End') n = abas[abas.length - 1];
        if (n) { e.preventDefault(); ativar(n, { foco: true }); }
      });
    });

    // Painéis da hero / links #servicos-hair etc. escolhem a aba
    document.addEventListener('categoria:selecionada', function (e) {
      var aba = $('.tabs [data-categoria="' + e.detail + '"]');
      if (aba && aba.getAttribute('aria-selected') !== 'true') ativar(aba, { silencioso: true });
    });

    var inicial = $('.tabs [aria-selected="true"]');
    moverIndicador(inicial);
    window.addEventListener('resize', function () { moverIndicador($('.tabs [aria-selected="true"]')); });
    if (document.fonts) document.fonts.ready.then(function () { moverIndicador($('.tabs [aria-selected="true"]')); });
  }

  /* ---------------------------------------------------------------------
     5a. ANTES E DEPOIS — slider arrastável (mouse, toque e teclado)
     Troque os pares aqui (e as imagens em assets/img/antes-N / depois-N).
     --------------------------------------------------------------------- */
  var PARES_ANTES_DEPOIS = [
    { antes: 'assets/img/antes-1.webp', depois: 'assets/img/depois-1.webp', titulo: '[PLACEHOLDER: Coloração · descrição]' },
    { antes: 'assets/img/antes-2.webp', depois: 'assets/img/depois-2.webp', titulo: '[PLACEHOLDER: Mechas · descrição]' },
    { antes: 'assets/img/antes-3.webp', depois: 'assets/img/depois-3.webp', titulo: '[PLACEHOLDER: Maquiagem · descrição]' }
  ];

  function initAntesDepois() {
    var frame = $('.ba-frame');
    if (!frame) return;
    var handle = $('.ba-handle', frame);
    var imgAntes = $('.ba-before', frame);
    var imgDepois = $('.ba-after', frame);
    var contador = $('.ba-count');
    var titulo = $('.ba-title');
    var indice = 0, pos = 50, usado = false, arrastando = false;

    function definir(p) {
      pos = Math.max(0, Math.min(100, p));
      frame.style.setProperty('--pos', pos + '%');
      handle.setAttribute('aria-valuenow', Math.round(pos));
      handle.setAttribute('aria-valuetext', Math.round(pos) + '% mostrando o antes');
      if (!usado) { usado = true; track('antes_depois_uso', { par: indice + 1 }); }
    }
    function posDoPonteiro(e) {
      var r = frame.getBoundingClientRect();
      return ((e.clientX - r.left) / r.width) * 100;
    }

    frame.addEventListener('pointerdown', function (e) {
      if (e.button !== undefined && e.button !== 0) return;
      arrastando = true;
      frame.classList.add('is-dragging');
      frame.setPointerCapture(e.pointerId);
      definir(posDoPonteiro(e));
    });
    frame.addEventListener('pointermove', function (e) { if (arrastando) definir(posDoPonteiro(e)); });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (ev) {
      frame.addEventListener(ev, function () { arrastando = false; frame.classList.remove('is-dragging'); });
    });

    handle.addEventListener('keydown', function (e) {
      var passo = e.shiftKey ? 10 : 5;
      var novo = null;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') novo = pos - passo;
      else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') novo = pos + passo;
      else if (e.key === 'Home') novo = 0;
      else if (e.key === 'End') novo = 100;
      if (novo !== null) { e.preventDefault(); definir(novo); }
    });

    function irPara(i) {
      indice = (i + PARES_ANTES_DEPOIS.length) % PARES_ANTES_DEPOIS.length;
      var par = PARES_ANTES_DEPOIS[indice];
      usado = false;
      frame.classList.add('is-switching');
      setTimeout(function () {
        imgAntes.src = par.antes;
        imgDepois.src = par.depois;
        imgAntes.alt = 'Antes: ' + par.titulo;
        imgDepois.alt = 'Depois: ' + par.titulo;
        titulo.textContent = par.titulo;
        contador.textContent = String(indice + 1).padStart(2, '0') + ' / ' + String(PARES_ANTES_DEPOIS.length).padStart(2, '0');
        frame.style.setProperty('--pos', '50%');
        pos = 50;
        handle.setAttribute('aria-valuenow', 50);
        frame.classList.remove('is-switching');
      }, reduzMovimento ? 0 : 300);
    }
    $('.ba-prev').addEventListener('click', function () { irPara(indice - 1); });
    $('.ba-next').addEventListener('click', function () { irPara(indice + 1); });

    // Pré-carrega os próximos pares quando o slider se aproxima da tela
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (en) {
        if (!en[0].isIntersecting) return;
        PARES_ANTES_DEPOIS.forEach(function (p) { new Image().src = p.antes; new Image().src = p.depois; });
        io.disconnect();
      }, { rootMargin: '300px' });
      io.observe(frame);
    }
  }

  /* ---------------------------------------------------------------------
     5b. GALERIA — filtro por categoria + lightbox
     --------------------------------------------------------------------- */
  function initGaleria() {
    var itens = $$('.gallery-item');
    if (!itens.length) return;
    var filtros = $$('.filter');

    filtros.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var f = btn.dataset.filtro;
        filtros.forEach(function (b) { b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); });
        var mostrar = itens.filter(function (it) { return f === 'todos' || it.dataset.categoria === f; });
        var esconder = itens.filter(function (it) { return mostrar.indexOf(it) === -1; });
        track('galeria_filtro', { filtro: f });

        function trocar() {
          esconder.forEach(function (it) { it.classList.add('is-hidden'); });
          mostrar.forEach(function (it) { it.classList.remove('is-hidden'); });
          if (animar) {
            gsap.fromTo(mostrar, { autoAlpha: 0, y: 20, scale: 0.97 },
              { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.05, ease: 'power3.out', clearProps: 'all' });
            ScrollTrigger.refresh();
          }
        }
        if (animar) {
          var visiveis = itens.filter(function (it) { return !it.classList.contains('is-hidden'); });
          gsap.to(visiveis, { autoAlpha: 0, scale: 0.97, duration: 0.2, ease: 'power2.in', onComplete: trocar });
        } else trocar();
      });
    });

    /* Lightbox com <dialog> (Esc fecha nativamente; o foco volta ao botão) */
    var dialog = $('.lightbox');
    if (!dialog || typeof dialog.showModal !== 'function') return;
    var img = $('.lightbox-img', dialog);
    var legenda = $('.lightbox-caption', dialog);
    var atual = 0;

    function visiveis() { return itens.filter(function (it) { return !it.classList.contains('is-hidden'); }); }
    function mostrarFoto(i) {
      var lista = visiveis();
      atual = (i + lista.length) % lista.length;
      var fonte = $('img', lista[atual]);
      img.src = fonte.currentSrc || fonte.src;
      img.alt = fonte.alt;
      img.width = fonte.width; img.height = fonte.height;
      img.setAttribute('width', fonte.getAttribute('width'));
      img.setAttribute('height', fonte.getAttribute('height'));
      legenda.textContent = fonte.alt;
      if (animar) gsap.fromTo(img, { autoAlpha: 0, scale: 0.97 }, { autoAlpha: 1, scale: 1, duration: 0.35, ease: 'power2.out' });
    }
    itens.forEach(function (it) {
      $('.gallery-btn', it).setAttribute('aria-label', 'Ampliar foto: ' + $('img', it).alt);
      $('.gallery-btn', it).addEventListener('click', function () {
        mostrarFoto(visiveis().indexOf(it));
        dialog.showModal();
        document.body.classList.add('is-locked');
      });
    });
    $('.lightbox-close', dialog).addEventListener('click', function () { dialog.close(); });
    $('.lightbox-prev', dialog).addEventListener('click', function () { mostrarFoto(atual - 1); });
    $('.lightbox-next', dialog).addEventListener('click', function () { mostrarFoto(atual + 1); });
    dialog.addEventListener('close', function () { document.body.classList.remove('is-locked'); });
    dialog.addEventListener('click', function (e) { if (e.target === dialog) dialog.close(); }); // clique no fundo
    dialog.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') mostrarFoto(atual - 1);
      if (e.key === 'ArrowRight') mostrarFoto(atual + 1);
    });
    // Swipe no celular
    var x0 = null;
    dialog.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    dialog.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 50) mostrarFoto(atual + (dx < 0 ? 1 : -1));
      x0 = null;
    });
  }

  /* ---------------------------------------------------------------------
     6. O ESPAÇO — parallax suave nas fotos em arco
     --------------------------------------------------------------------- */
  function initParallax() {
    if (!animar) return;
    $$('[data-parallax]').forEach(function (el) {
      var desloc = parseFloat(el.dataset.parallax) || 40;
      gsap.fromTo(el, { y: -desloc / 2 }, {
        y: desloc / 2, ease: 'none',
        scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });
  }

  /* ---------------------------------------------------------------------
     7. DEPOIMENTOS — carrossel (scroll-snap nativo + setas + indicadores)
     --------------------------------------------------------------------- */
  function initDepoimentos() {
    var trilho = $('.t-track');
    if (!trilho) return;
    var cards = $$('.t-card', trilho);
    var pontos = $('.t-dots');
    cards.forEach(function () { pontos.appendChild(document.createElement('span')); });
    var spans = $$('span', pontos);

    function passo() { return cards[0].offsetWidth + parseFloat(getComputedStyle(trilho).columnGap || 16); }
    function atualizar() {
      var i = Math.round(trilho.scrollLeft / passo());
      spans.forEach(function (s, k) { s.classList.toggle('is-active', k === Math.min(i, spans.length - 1)); });
    }
    $('.t-prev').addEventListener('click', function () { trilho.scrollBy({ left: -passo(), behavior: reduzMovimento ? 'auto' : 'smooth' }); });
    $('.t-next').addEventListener('click', function () {
      var fim = trilho.scrollLeft + trilho.clientWidth >= trilho.scrollWidth - 4;
      trilho.scrollTo({ left: fim ? 0 : trilho.scrollLeft + passo(), behavior: reduzMovimento ? 'auto' : 'smooth' });
    });
    var t;
    trilho.addEventListener('scroll', function () { clearTimeout(t); t = setTimeout(atualizar, 60); }, { passive: true });
    atualizar();

    // Link de avaliação do Google ainda não definido: não navega
    $$('[data-google-review]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        if (a.getAttribute('href') === '#') { e.preventDefault(); }
        track('google_review_click');
      });
    });
  }

  /* ---------------------------------------------------------------------
     8. AGENDAMENTO — formulário em 4 etapas → mensagem no WhatsApp
     --------------------------------------------------------------------- */
  var AGENDA = {
    // Dias em que o salão NÃO atende (0 = domingo, 1 = segunda … 6 = sábado)
    // [PLACEHOLDER: confirmar dias de funcionamento com o salão]
    diasFechados: [0],
    quantidadeDias: 14
  };

  function initAgendamento() {
    var form = $('.booking');
    if (!form) return;
    var etapas = $$('.booking-step', form);
    var btnVoltar = $('[data-voltar]', form);
    var btnAvancar = $('[data-avancar]', form);
    var btnEnviar = $('[data-enviar]', form);
    var erro = $('.booking-error', form);
    var numero = $('.booking-step-num', form);
    var etapa = 0;

    /* Calendário: próximos 14 dias, sem os dias fechados */
    var semana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    var meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    var caixaDias = $('[data-dias]', form);
    var hoje = new Date(); hoje.setHours(0, 0, 0, 0);
    for (var d = 0; d < AGENDA.quantidadeDias; d++) {
      var data = new Date(hoje); data.setDate(hoje.getDate() + d);
      if (AGENDA.diasFechados.indexOf(data.getDay()) !== -1) continue;
      var rotulo = d === 0 ? 'Hoje' : d === 1 ? 'Amanhã' : semana[data.getDay()];
      var texto = (d <= 1 ? rotulo + ', ' : semana[data.getDay()] + ', ') +
        String(data.getDate()).padStart(2, '0') + '/' + String(data.getMonth() + 1).padStart(2, '0');
      var label = document.createElement('label');
      label.className = 'choice day';
      label.innerHTML =
        '<input type="radio" name="dia" value="' + texto + '">' +
        '<span class="choice-box"><span class="day-week">' + rotulo + '</span>' +
        '<span class="day-num">' + data.getDate() + '</span>' +
        '<span class="day-month">' + meses[data.getMonth()] + '</span></span>';
      caixaDias.appendChild(label);
    }

    /* "Ainda não sei" é exclusivo das outras categorias */
    form.addEventListener('change', function (e) {
      var el = e.target;
      if (el.name === 'servico' && el.checked) {
        $$('input[name="servico"]', form).forEach(function (c) {
          if (c === el) return;
          if (el.hasAttribute('data-exclusivo') || c.hasAttribute('data-exclusivo')) c.checked = false;
        });
        if (el.dataset.categoria) definirCategoria(el.dataset.categoria);
      }
      erro.textContent = '';
      if (el.getAttribute('aria-invalid')) el.removeAttribute('aria-invalid');
    });

    /* Máscara de telefone brasileiro: (61) 98402-1530 */
    var tel = $('#b-whats', form);
    tel.addEventListener('input', function () {
      var dg = tel.value.replace(/\D/g, '').slice(0, 11);
      var v = dg;
      if (dg.length > 0) v = '(' + dg.slice(0, 2);
      if (dg.length >= 3) v += ') ' + dg.slice(2, dg.length === 11 ? 7 : 6);
      if (dg.length >= 7) v += '-' + dg.slice(dg.length === 11 ? 7 : 6);
      tel.value = v;
    });

    function valores(nome) {
      return $$('input[name="' + nome + '"]:checked', form).map(function (i) { return i.value; });
    }

    function validar(i) {
      if (i === 0 && !valores('servico').length) return 'Escolha pelo menos uma opção.';
      if (i === 1 && !valores('dia').length) return 'Escolha um dia.';
      if (i === 2 && !valores('periodo').length) return 'Escolha um período.';
      if (i === 3) {
        var nome = $('#b-nome', form), lgpd = $('input[name="lgpd"]', form);
        if (nome.value.trim().length < 2) { nome.setAttribute('aria-invalid', 'true'); nome.focus(); return 'Digite seu nome.'; }
        if (tel.value.replace(/\D/g, '').length < 10) { tel.setAttribute('aria-invalid', 'true'); tel.focus(); return 'Digite um WhatsApp válido com DDD.'; }
        if (!lgpd.checked) { lgpd.setAttribute('aria-invalid', 'true'); lgpd.focus(); return 'Marque a autorização de contato para continuar.'; }
      }
      return '';
    }

    function irPara(nova, focar) {
      var velha = etapas[etapa];
      var proxima = etapas[nova];
      var dir = nova > etapa ? 1 : -1;
      etapa = nova;
      numero.textContent = nova + 1;
      form.style.setProperty('--progresso', ((nova + 1) / etapas.length * 100) + '%');
      btnVoltar.hidden = nova === 0;
      btnAvancar.hidden = nova === etapas.length - 1;
      btnEnviar.hidden = nova !== etapas.length - 1;
      erro.textContent = '';
      var focarPrimeiro = function () {
        if (!focar) return;
        var alvo = $('input', proxima);
        if (alvo) alvo.focus({ preventScroll: true });
      };
      if (animar && velha !== proxima) {
        gsap.to(velha, {
          autoAlpha: 0, x: -30 * dir, duration: 0.22, ease: 'power2.in',
          onComplete: function () {
            velha.hidden = true; gsap.set(velha, { clearProps: 'all' });
            proxima.hidden = false;
            gsap.fromTo(proxima, { autoAlpha: 0, x: 30 * dir }, { autoAlpha: 1, x: 0, duration: 0.4, ease: 'power3.out', clearProps: 'all' });
            focarPrimeiro();
          }
        });
      } else {
        velha.hidden = true; proxima.hidden = false; focarPrimeiro();
      }
      track('form_etapa', { etapa: nova + 1 });
    }

    btnAvancar.addEventListener('click', function () {
      var msg = validar(etapa);
      if (msg) { erro.textContent = msg; return; }
      irPara(etapa + 1, true);
    });
    btnVoltar.addEventListener('click', function () { irPara(etapa - 1, true); });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var msg = validar(3);
      if (msg) { erro.textContent = msg; return; }
      var texto = 'Olá, Up Concept Beauty! Gostaria de agendar: ' + valores('servico').join(', ') +
        ' · Dia: ' + valores('dia')[0] +
        ' · Período: ' + valores('periodo')[0] +
        ' · Nome: ' + $('#b-nome', form).value.trim() +
        ' · WhatsApp: ' + tel.value;
      track('form_submit', { servicos: valores('servico').join(', '), periodo: valores('periodo')[0] });
      track('whatsapp_click', { origem: 'formulario', categoria: estado.categoria || 'geral' });
      window.open(whatsappLink(texto), '_blank', 'noopener');
      erro.textContent = '';
      var nota = $('.booking-note', form);
      nota.lastChild.textContent = ' Pronto! Sua mensagem foi aberta no WhatsApp. O salão vai confirmar o horário por lá.';
    });

    // Enter nos campos de texto avança/envia em vez de recarregar
    form.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type !== 'submit') {
        e.preventDefault();
        etapa < etapas.length - 1 ? btnAvancar.click() : btnEnviar.click();
      }
    });
  }

  /* ---------------------------------------------------------------------
     RODAPÉ + entradas suaves ao rolar
     --------------------------------------------------------------------- */
  function initRodape() {
    $$('[data-ano]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
    // Política de privacidade ainda não definida
    $$('.footer-bottom a[href="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) { e.preventDefault(); });
    });
  }

  function initReveal() {
    if (!animar) return;
    var alvos = $$('[data-reveal]');
    gsap.set(alvos, { autoAlpha: 0, y: 36 });
    ScrollTrigger.batch(alvos, {
      start: 'top 88%',
      once: true,
      onEnter: function (lote) {
        gsap.to(lote, { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.1, ease: 'power3.out', clearProps: 'transform' });
      }
    });
    // Cards de serviço da aba inicial entram em cascata
    var painel = $('.tab-panel:not([hidden])');
    if (painel) {
      var cards = $$('.service-card', painel);
      gsap.set(cards, { autoAlpha: 0, y: 28 });
      ScrollTrigger.create({
        trigger: painel, start: 'top 85%', once: true,
        onEnter: function () { gsap.to(cards, { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.08, ease: 'power3.out', clearProps: 'transform' }); }
      });
    }
  }

  /* ---------------------------------------------------------------------
     START
     --------------------------------------------------------------------- */
  initWhatsApp();
  initHeader();
  initMenuMobile();
  initHero();
  initHashCategoria();
  initMarquee();
  initServicos();
  initAntesDepois();
  initGaleria();
  initParallax();
  initDepoimentos();
  initAgendamento();
  initRodape();
  initReveal();
})();

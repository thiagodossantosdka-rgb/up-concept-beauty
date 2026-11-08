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

  /** Atualiza o href de todos os links de WhatsApp sem mensagem fixa */
  function atualizarLinksWhatsApp() {
    $$('[data-wa]').forEach(function (a) {
      if (a.dataset.waMsg) return; // links com mensagem própria (ex.: serviço específico)
      a.href = whatsappLink(mensagemContextual());
    });
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
      var msg = a.dataset.waMsg || mensagemContextual();
      a.href = whatsappLink(msg);
      track('whatsapp_click', { origem: a.dataset.wa, categoria: estado.categoria || 'geral' });
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

    /* --- Vídeo: só aparece se carregar; senão o fallback animado fica visível --- */
    var videoOk = false;
    if (video) {
      video.addEventListener('loadeddata', function () { videoOk = true; video.classList.add('is-ready'); });
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
          if (en.isIntersecting) tocar();
          else if (video) video.pause();
        });
      }, { threshold: 0 }).observe(hero);
      // Botão flutuante: aparece quando o fim da hero passa da metade da tela
      new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          var passou = !en.isIntersecting && en.boundingClientRect.top < 0;
          if (floatBtn) floatBtn.classList.toggle('is-visible', passou);
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
      tl.set(blur, { attr: { stdDeviation: 10 } })
        .set(svg, { scale: 1.05, transformOrigin: '50% 40%' })
        .to(maskMark, { attr: { 'stroke-dashoffset': 0 }, duration: 2.2, ease: 'power2.inOut' }, 0.15)
        .to(blur, { attr: { stdDeviation: 0 }, duration: 2 }, 0.15)
        .to(svg, { scale: 1, duration: 2.6, ease: 'power2.out' }, 0)
        .to(shineMark, { opacity: 1, duration: 0.3 }, 1.9)
        .fromTo(gradiente, { attr: { x1: -200, x2: -60 } }, Object.assign({ duration: 1.6, ease: 'power2.inOut' }, { attr: { x1: 340, x2: 480 } }), 1.9)
        .from(lockup.children, { autoAlpha: 0, y: 14, stagger: 0.15, duration: 1.2 }, 1.2)
        .from('.scroll-hint', { autoAlpha: 0, y: 10, duration: 1 }, 2.2);

      // Brilho volta a passar suavemente a cada ~7s enquanto a cliente não rola
      gsap.fromTo(gradiente, { attr: { x1: -200, x2: -60 } }, Object.assign({
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
          .to(zoom, { p: 1, duration: 3, ease: 'power1.in', onUpdate: aplicarZoom }, 0)
          .to(svg, { opacity: 0, duration: 0.7 }, 2.3)           // garante tela 100% vídeo
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
     START
     --------------------------------------------------------------------- */
  initWhatsApp();
  initHeader();
  initMenuMobile();
  initHero();
  initHashCategoria();
})();

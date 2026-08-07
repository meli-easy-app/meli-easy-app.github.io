(async function () {
  if (window.__meb) return;
  window.__meb = true;
  window.__mebc = false;

  /* ── utilitários ─────────────────────────────────────────────────────────── */
  var _w  = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  var _wc = async function (fn, ms) {
    var t = Date.now();
    while (Date.now() - t < (ms || 10000)) {
      try { if (fn()) return true; } catch (e) {}
      await _w(400);
    }
    return false;
  };
  var _n = function (s) {
    return (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  };
  var _d = function (el) {
    if (!el) return;
    ['mouseenter', 'mouseover', 'mousedown', 'mouseup', 'click'].forEach(function (e) {
      el.dispatchEvent(new MouseEvent(e, { bubbles: true, cancelable: true, view: window }));
    });
  };
  var _sv = function (inp, val) {
    try { var c = angular.element(inp).controller('ngModel'); if (c) { c.$setViewValue(val); c.$render(); } } catch (e) {}
    try {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(inp, val);
      ['input', 'change', 'keyup'].forEach(function (ev) { inp.dispatchEvent(new Event(ev, { bubbles: true })); });
    } catch (e) {}
    try {
      var m = inp.getAttribute('ng-model');
      if (m) {
        var sc = angular.element(inp).scope(); var p = m.split('.'); var o = sc;
        for (var i = 0; i < p.length - 1; i++) o = o[p[i]];
        o[p[p.length - 1]] = val; sc.$apply();
      }
    } catch (e) {}
  };

  /* ── banner ──────────────────────────────────────────────────────────────── */
  var _bkb = document.createElement('div');
  _bkb.id = '__meb_b';
  _bkb.style.cssText = [
    'position:fixed;top:10px;right:10px;z-index:99999',
    'padding:10px 16px;border-radius:8px;min-width:260px;max-width:380px',
    'font:700 12px/1.5 sans-serif;box-shadow:0 2px 12px rgba(0,0,0,.45)',
    'cursor:pointer;text-align:center;transition:background .3s'
  ].join(';');
  _bkb.title = 'Clique para fechar';
  _bkb.onclick = function () { _bkb.remove(); };
  document.body.appendChild(_bkb);

  var _step = function (txt, bg, fg) {
    _bkb.style.background = bg || '#e6a800';
    _bkb.style.color = fg || (bg ? '#fff' : '#333');
    _bkb.innerHTML = txt;
    console.info('[MeliEasy]', txt.replace(/<[^>]*>/g, ''));
  };

  /* ── leitura de dados: window.name → hash ────────────────────────────────── */
  var _inputData = null;
  var _dataSource = '?';

  // 1) window.name (método principal — persiste sobre roteamento AngularJS)
  try {
    var _wn = window.name || '';
    if (_wn.startsWith('melidata_')) {
      _inputData = JSON.parse(decodeURIComponent(escape(atob(_wn.slice(9)))));
      _dataSource = 'window.name';
    }
  } catch (e) { console.warn('[MeliEasy] window.name parse error', e); }

  // 2) hash (fallback — pode ter sido limpo pelo AngularJS)
  if (!_inputData) {
    try {
      var _h = window.location.hash, _mi = _h.indexOf('_med=');
      if (_mi !== -1) {
        _inputData = JSON.parse(decodeURIComponent(escape(atob(_h.substring(_mi + 5).split('&')[0].split('#')[0]))));
        history.replaceState(null, '', window.location.pathname + window.location.search);
        _dataSource = 'hash';
      }
    } catch (e) { console.warn('[MeliEasy] hash parse error', e); }
  }

  if (!_inputData) {
    _step(
      '⚠️ <b>Sem dados para processar.</b><br>' +
      'Clique em <b>"Buscar QR"</b> no app Meli Easy <i>antes</i> de usar este favorito.<br>' +
      '<small>window.name: ' + (window.name || '(vazio)').substring(0, 40) + '</small>',
      '#c0392b'
    );
    console.warn('[MeliEasy] _inputData null — window.name:', window.name, 'hash:', window.location.hash);
    window.__meb = false;
    return;
  }

  console.info('[MeliEasy] Dados lidos de:', _dataSource, '—', _inputData.length, 'colaboradores');

  /* ── descoberta de estados AngularJS ─────────────────────────────────────── */
  var _states = [];
  var _getState = function () { return null; };
  try {
    var $inj = angular.element(document.body).injector();
    var $st  = $inj.get('$state');
    _states = $st.get().map(function (s) { return s.name; });
    _getState = function () { return $st; };
    console.info('[MeliEasy] AngularJS states:', _states.join(', '));
  } catch (e) { console.warn('[MeliEasy] AngularJS state not found', e); }

  /* ── helpers de navegação ────────────────────────────────────────────────── */
  var _notify = function (d) {};   // placeholder, filled below if opener exists
  window.addEventListener('message', function (ev) {
    var msg = ev.data;
    if (msg && msg.__meliEasyCmd) {
      _notify = function (d) { try { ev.source.postMessage(Object.assign({ __meliEasyPush: true }, d), '*'); } catch (e) {} };
      if (msg.action === 'cancel') window.__mebc = true;
    }
  });

  /* ── s1: ir para Configurações ───────────────────────────────────────────── */
  var s1 = async function () {
    var u = location.href, nav = false;
    // Tenta via $state.go() — mais confiável
    try {
      var st = _getState();
      if (st) {
        var a = _states.find(function (n) { return /configur/i.test(_n(n)); });
        if (a) { st.go(a); nav = true; }
      }
    } catch (e) {}
    // Tenta por hash direto
    if (!nav) {
      var hashTargets = ['configuracoes', 'configurações', 'config', 'settings'];
      for (var ht of hashTargets) {
        if (!nav) { try { location.hash = '/' + ht; nav = true; } catch (e) {} }
      }
    }
    // Tenta clique no elemento
    if (!nav) {
      var el = [...document.querySelectorAll('a,button,[ng-click],[ui-sref],li,div')]
        .find(function (e) { return /configurações|configuracoes/i.test(e.textContent.trim()) && e.textContent.trim().length < 30; });
      if (el) { _d(el); nav = true; }
    }
    if (!nav) return { error: 'config_not_found — states: ' + _states.slice(0, 10).join(',') };

    var ok = await _wc(function () {
      var txt = _n(document.body.innerText);
      return location.href !== u || /funcionari|funcionário|colaborador/i.test(txt);
    }, 12000);
    return ok ? { ok: true } : { error: 'config_timeout' };
  };

  /* ── s2: ir para Funcionários ────────────────────────────────────────────── */
  var s2 = async function () {
    var u = location.href, nav = false;
    try {
      var st = _getState();
      if (st) {
        var a = _states.find(function (n) { return /funcionar|colabor|employee|staff/i.test(_n(n)); });
        if (a) { st.go(a); nav = true; }
      }
    } catch (e) {}
    if (!nav) {
      var el = [...document.querySelectorAll('a,li,button,[ng-click],[ui-sref]')]
        .find(function (e) {
          var t = _n(e.textContent.trim());
          return (t === 'funcionarios' || t === 'funcionários' || t.includes('funcionari')) && e.textContent.trim().length < 30;
        });
      if (el) {
        var cur = el;
        while (cur && cur !== document.body) {
          var nc = cur.getAttribute('ng-click');
          if (nc) {
            try { angular.element(cur).scope().$apply(function (sc) { sc.$eval(nc); }); nav = true; } catch (e) { cur.click(); nav = true; }
            break;
          }
          cur = cur.parentElement;
        }
        if (!nav) { el.click(); nav = true; }
      }
    }
    if (!nav) return { error: 'funcionarios_not_found — page: ' + document.title };
    var ok = await _wc(function () {
      return location.href !== u ||
        !!(document.querySelector('table tbody tr,[ng-repeat]') && document.body.innerText.length > 300);
    }, 10000);
    return ok ? { ok: true } : { error: 'funcionarios_timeout — url: ' + location.hash };
  };

  /* ── s3: abrir filtro de pesquisa ────────────────────────────────────────── */
  var s3 = async function () {
    await _w(600);
    if (document.querySelector('input[ng-model*="egistro"],input[ng-model*="Registro"],input[ng-model*="egistration"],input[placeholder*="RE"],input[placeholder*="CPF"]'))
      return { ok: true };
    var lupa = document.querySelector('[ng-click*="pesquis"],[ng-click*="search"],[ng-click*="filtro"],[ng-click*="Filtro"]') ||
      (document.querySelector('.fa-search') && document.querySelector('.fa-search').closest('a,button')) ||
      (document.querySelector('.glyphicon-search') && document.querySelector('.glyphicon-search').closest('a,button')) ||
      (document.querySelector('.glyphicon-filter') && document.querySelector('.glyphicon-filter').closest('a,button')) ||
      [...document.querySelectorAll('a,button')].find(function (e) { return /pesquisar|filtrar|buscar|search/i.test(e.textContent); });
    if (!lupa) {
      // Talvez o campo de busca já esteja visível com outro ng-model
      var anyInput = document.querySelector('input[type="text"],input[type="search"]');
      if (anyInput) return { ok: true };
      return { error: 'filter_button_not_found — inputs: ' + document.querySelectorAll('input').length };
    }
    lupa.click();
    var ok = await _wc(function () {
      return !!document.querySelector('input[ng-model],input[type="text"],input[type="search"]');
    }, 7000);
    return ok ? { ok: true } : { error: 'filter_open_timeout' };
  };

  /* ── s4: preencher e pesquisar ───────────────────────────────────────────── */
  var s4 = async function (term) {
    term = (term || '').replace(/\D/g, '');
    await _w(300);
    // Tenta vários seletores de campo
    var selectors = [
      'input[ng-model*="egistro"]', 'input[ng-model*="Registro"]', 'input[ng-model*="egistration"]',
      'input[ng-model*="cpf"]', 'input[ng-model*="CPF"]',
      'input[placeholder*="RE"]', 'input[placeholder*="CPF"]', 'input[placeholder*="egistro"]',
      'input[type="text"]', 'input[type="search"]'
    ];
    var inp = null;
    for (var sel of selectors) { inp = document.querySelector(sel); if (inp) break; }
    if (!inp) return { error: 'search_input_not_found — all inputs: ' + [...document.querySelectorAll('input')].map(function(i){return i.getAttribute('ng-model')||i.type;}).join(',') };

    var snap = (document.querySelector('table tbody,[ng-repeat]') || {}).innerHTML || document.body.innerHTML.slice(0, 4000);
    inp.focus(); _sv(inp, term); await _w(700);

    var btn = [...document.querySelectorAll('button,input[type="submit"],a')].find(function (e) {
      return /filtrar|buscar|pesquisar|search|procurar/i.test((e.textContent || e.value || '').trim());
    }) || document.querySelector('[ng-click*="filtrar"],[ng-click*="buscar"],[ng-click*="pesquis"],[ng-click*="search"]');

    if (btn) {
      btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
    } else {
      var form = inp.closest('form');
      if (form) {
        var ns = form.getAttribute('ng-submit');
        if (ns) try { angular.element(form).scope().$apply(function (sc) { sc.$eval(ns); }); } catch (e) {}
        else form.dispatchEvent(new Event('submit', { bubbles: true }));
      } else {
        inp.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, bubbles: true }));
        inp.dispatchEvent(new KeyboardEvent('keyup',  { key: 'Enter', keyCode: 13, bubbles: true }));
      }
    }
    var ok = await _wc(function () {
      var now = (document.querySelector('table tbody,[ng-repeat]') || {}).innerHTML || document.body.innerHTML.slice(0, 4000);
      return now !== snap && now.trim().length > 10;
    }, 12000);
    return ok ? { ok: true } : { error: 'search_no_change — term: ' + term };
  };

  /* ── s5: abrir detalhe do colaborador ────────────────────────────────────── */
  var s5 = async function () {
    await _w(400);
    var el = document.querySelector('a[ng-click*="edit"],button[ng-click*="edit"],a[ng-click*="detalhe"],[title*="ditar"],[title*="etalhe"],[title*="isualizar"]');
    if (!el) {
      var icon = document.querySelector('.fa-pencil,.fa-edit,.fa-pencil-alt,.glyphicon-pencil,.fa-eye,.fa-search-plus');
      if (icon) el = icon.closest('a,button') || icon;
    }
    if (!el) {
      var rows = [...document.querySelectorAll('table tbody tr[ng-repeat],table tbody tr,li[ng-repeat],li')].filter(function (r) { return r.textContent.trim().length > 5; });
      if (rows.length) {
        var btns = [...rows[0].querySelectorAll('a,button,[ng-click]')];
        el = btns.find(function (b) {
          var t = b.textContent + (b.getAttribute('ng-click') || '') + b.className;
          return /editar|edit|detalhe|ver|ficha|visualizar|show|detail/i.test(t);
        }) || btns[btns.length - 1];
      }
    }
    if (!el) return { error: 'edit_button_not_found — rows: ' + document.querySelectorAll('tr,li[ng-repeat]').length };
    el.click();
    var ok = await _wc(function () {
      var labels = [...document.querySelectorAll('label,span,td,.control-label')];
      return labels.some(function (n) { return /qr|código|codigo|cracha|crachá|passe|pass/i.test(n.textContent); }) ||
        !!document.querySelector('form .form-control, form input');
    }, 10000);
    return ok ? { ok: true } : { error: 'detail_timeout — title: ' + document.title };
  };

  /* ── s6: extrair QR Code e foto ──────────────────────────────────────────── */
  var s6 = async function () {
    await _w(600);
    var qrCode = null, photoUrl = null;

    // Tenta extrair foto do perfil
    try {
      var imgEl = document.querySelector(
        '.foto-perfil img,.foto-funcionario img,.profile-photo img,.avatar img,' +
        'img[ng-src*="foto"],img[ng-src*="photo"],img[ng-src*="avatar"],img[ng-src*="profile"],' +
        'img[src*="foto"],img[src*="photo"],img[src*="avatar"],img[src*="profile"]'
      );
      if (!imgEl) {
        // Qualquer img que não seja logo/ícone
        imgEl = [...document.querySelectorAll('img')].find(function (i) {
          return i.naturalWidth > 50 && i.naturalHeight > 50 && !/(logo|icon|sprite|flag)/i.test(i.src);
        });
      }
      if (imgEl && imgEl.src && imgEl.src.startsWith('http')) photoUrl = imgEl.src;
    } catch (e) {}

    // Tenta extrair QR Code — vários métodos
    // 1) Label + input adjacente
    for (var node of document.querySelectorAll('label,span,td,.control-label,th,div,p')) {
      if (!/qr|código|codigo|cracha|crachá|passe|pass|acesso|cartão|cartao/i.test(node.textContent.trim())) continue;
      var candidates = [];
      var fi = node.getAttribute && node.getAttribute('for');
      if (fi) { var byId = document.getElementById(fi); if (byId) candidates.push(byId); }
      var sv = node.nextElementSibling;
      while (sv && candidates.length < 3) { candidates.push(sv); sv = sv.nextElementSibling; }
      var pn = node.closest('div,tr,.form-group,.row,li,dd');
      if (pn) [...pn.querySelectorAll('input,span,p,td')].forEach(function (x) { candidates.push(x); });
      for (var c of candidates) {
        var val = (c.value || c.textContent || '').trim();
        if (val && /^\d{4,}$/.test(val.replace(/\s/g, ''))) { qrCode = val.replace(/\s/g, ''); break; }
      }
      if (qrCode) break;
    }

    // 2) Seletores diretos por ng-model
    if (!qrCode) {
      for (var sel of [
        'input[ng-model*="Qr"]','input[ng-model*="qr"]','input[ng-model*="QR"]',
        'input[ng-model*="codigo"]','input[ng-model*="Codigo"]','input[ng-model*="code"]',
        'input[ng-model*="cracha"]','input[ng-model*="pass"]','input[ng-model*="Pass"]',
        'input[id*="qr" i]','input[id*="codigo" i]','input[id*="cracha" i]'
      ]) {
        var el = document.querySelector(sel);
        if (el && el.value && /\d/.test(el.value)) { qrCode = el.value.trim(); break; }
      }
    }

    // 3) Qualquer input somente-leitura com dígitos
    if (!qrCode) {
      var cands = [...document.querySelectorAll('input[readonly],input[disabled]')]
        .filter(function (i) { return i.value && /^\d{4,}$/.test(i.value.trim()); });
      if (cands.length) qrCode = cands[0].value.trim();
    }

    // 4) Imagem de QR Code no DOM
    if (!qrCode) {
      var qrImg = document.querySelector('img[alt*="qr" i],img[src*="qr" i],canvas[id*="qr" i]');
      if (qrImg) console.info('[MeliEasy] QR Image found:', qrImg.src || qrImg.id);
    }

    if (qrCode) return { qrCode: qrCode, photoUrl: photoUrl };

    // Diagnóstico: mostra todos os inputs/labels encontrados
    var allInputs = [...document.querySelectorAll('input')].map(function(i){
      return (i.getAttribute('ng-model')||'') + '=' + i.value.substring(0,20);
    }).join(' | ');
    var allLabels = [...document.querySelectorAll('label,.control-label')].map(function(l){
      return l.textContent.trim().substring(0,25);
    }).join(', ');
    return { error: 'qr_not_found — inputs: [' + allInputs + '] labels: [' + allLabels + ']' };
  };

  /* ── loop principal ──────────────────────────────────────────────────────── */
  var collabs = _inputData, total = collabs.length;
  _step('⏳ Meli Easy: navegando para Configurações... (0/' + total + ')');

  var r = await s1();
  if (r.error) {
    _step('❌ Não encontrou Configurações<br><small>' + r.error + '</small>', '#c0392b');
    window.__meb = false; return;
  }

  for (var i = 0; i < total; i++) {
    if (window.__mebc) break;
    var d = collabs[i];
    var term = (d.re || d.cpf || '').replace(/\D/g, '');
    d._qr = null; d._photo = null;
    _step('⏳ Meli Easy: ' + (i + 1) + '/' + total + ' — ' + ((d.fname || '') + ' ' + (d.lname || '')).trim());

    for (var att = 1; att <= 3; att++) {
      if (window.__mebc) break;
      r = await s2();
      if (r.error) { console.warn('[MeliEasy] s2 error:', r.error); break; }
      r = await s3();
      if (r.error) { console.warn('[MeliEasy] s3 error:', r.error); break; }
      r = await s4(term);
      if (r.error) { console.warn('[MeliEasy] s4 error:', r.error); break; }
      r = await s5();
      if (r.error) { console.warn('[MeliEasy] s5 error:', r.error); break; }
      r = await s6();
      if (r.qrCode) { d._qr = r.qrCode; d._photo = r.photoUrl; break; }
      console.warn('[MeliEasy] s6 error att=' + att + ':', r.error);
      if (att < 3) await _w(2500);
    }

    _notify(d._qr
      ? { action: 'qr_found', index: i, re: d.re, cpf: d.cpf, qrCode: d._qr, photoUrl: d._photo }
      : { action: 'qr_not_found', index: i, re: d.re, cpf: d.cpf }
    );
  }

  /* ── enviar resultados ───────────────────────────────────────────────────── */
  var allQR = collabs.map(function (c) { return { re: c.re, cpf: c.cpf, qrCode: c._qr || null, photoUrl: c._photo || null }; });
  var enc;
  try { enc = btoa(unescape(encodeURIComponent(JSON.stringify(allQR)))); } catch (e) { enc = btoa(JSON.stringify(allQR)); }

  try { window.open('https://meli-easy-app.github.io/#_mer=' + enc, 'meliEasyMain'); } catch (e) {}

  _step('✅ Concluído! QR codes enviados ao app Meli Easy.', '#00a650');
  console.info('[MeliEasy] Resultados enviados:', allQR);
})();

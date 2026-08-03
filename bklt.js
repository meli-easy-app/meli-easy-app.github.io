(async function () {
  if (window.__meb) return;
  window.__meb = true;
  window.__mebc = false;

  var _w = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  var _wc = async function (fn, ms) {
    var t = Date.now();
    while (Date.now() - t < (ms || 10000)) {
      try { if (fn()) return true; } catch (e) {}
      await _w(400);
    }
    return false;
  };
  var _n = function (s) { return (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim(); };
  var _f = function (t) {
    var a = [...document.querySelectorAll('a,button,li,span,div,p,td')];
    return a.find(function (e) { return e.textContent.trim() === t; }) || a.find(function (e) { return e.textContent.trim().includes(t); });
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
        var sc = angular.element(inp).scope();
        var p = m.split('.'); var o = sc;
        for (var i = 0; i < p.length - 1; i++) o = o[p[i]];
        o[p[p.length - 1]] = val; sc.$apply();
      }
    } catch (e) {}
  };

  var _src = null;
  var notify = function (d) {
    var t = _src;
    if (t && !t.closed) try { t.postMessage(Object.assign({ __meliEasyPush: true }, d), '*'); } catch (e) {}
  };

  // Read input data: try hash first, then window.name
  var _inputData = null;
  try {
    var _h = window.location.hash, _mi = _h.indexOf('_med=');
    if (_mi !== -1) {
      _inputData = JSON.parse(decodeURIComponent(escape(atob(_h.substring(_mi + 5).split('&')[0].split('#')[0]))));
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  } catch (e) {}
  if (!_inputData) {
    try {
      var _wn = window.name || '';
      if (_wn.startsWith('melidata_')) {
        _inputData = JSON.parse(decodeURIComponent(escape(atob(_wn.slice(9)))));
      }
    } catch (e) {}
  }

  // ── Navigation helpers ──────────────────────────────────────────────────────

  var s1 = async function () {
    var u = location.href, nav = false;
    try {
      var $s = angular.element(document.body).injector().get('$state');
      var a = $s.get().map(function (s) { return s.name; }).find(function (s) { return /configur/i.test(_n(s)); });
      if (a) { $s.go(a); nav = true; }
    } catch (e) {}
    if (!nav) {
      var tile = [...document.querySelectorAll('[ng-click],[ui-sref],a')].find(function (el) { return _n(el.textContent).includes('configura'); });
      if (tile) {
        try { var nc = tile.getAttribute('ng-click'); if (nc) { angular.element(tile).scope().$apply(function (sc) { sc.$eval(nc); }); nav = true; } } catch (e) {}
        _d(tile); nav = true;
      }
    }
    if (!nav) { var el = _f('Configurações'); if (el) { _d(el); nav = true; } }
    if (!nav) return { error: 'config_not_found' };
    var ok = await _wc(function () { return location.href !== u && /funcionári|funcionario/i.test(document.body.innerText); }, 12000);
    return ok ? { ok: true } : { error: 'config_timeout' };
  };

  var s2 = async function () {
    var u = location.href, nav = false;
    try {
      var $s = angular.element(document.body).injector().get('$state');
      var a = $s.get().map(function (s) { return s.name; }).find(function (s) { return /funcionar/i.test(s); });
      if (a) { $s.go(a); nav = true; }
    } catch (e) {}
    if (!nav) {
      var txt = _f('Funcionários') || _f('Funcionarios');
      var cur = txt;
      while (cur && cur !== document.body) {
        var nc = cur.getAttribute('ng-click');
        if (nc) { try { angular.element(cur).scope().$apply(function (sc) { sc.$eval(nc); }); nav = true; } catch (e) { cur.click(); nav = true; } break; }
        cur = cur.parentElement;
      }
      if (!nav && txt) {
        cur = txt;
        while (cur && !['A', 'BUTTON'].includes(cur.tagName) && !cur.getAttribute('ng-click')) cur = cur.parentElement;
        if (cur && cur !== document.body) { cur.click(); nav = true; }
      }
    }
    if (!nav) return { error: 'func_not_found' };
    var ok = await _wc(function () {
      return location.href !== u || !!(document.querySelector('table tbody tr,[ng-repeat]') && document.body.innerText.length > 200);
    }, 10000);
    return ok ? { ok: true } : { error: 'func_timeout' };
  };

  var s3 = async function () {
    await _w(500);
    if (document.querySelector('input[ng-model*="egistro"],input[ng-model*="Registro"],input[ng-model*="registro"]')) return { ok: true };
    var lupa = document.querySelector('[ng-click*="pesquis"],[ng-click*="search"],[ng-click*="filtro"]') ||
      (document.querySelector('.fa-search') && document.querySelector('.fa-search').closest('a,button')) ||
      (document.querySelector('.glyphicon-search') && document.querySelector('.glyphicon-search').closest('a,button')) ||
      [...document.querySelectorAll('a,button')].find(function (e) { return /pesquisar|filtrar|buscar/i.test(e.textContent); });
    if (!lupa) return { error: 'lupa_not_found' };
    lupa.click();
    var ok = await _wc(function () { return !!document.querySelector('input[ng-model*="egistro"],input[ng-model*="Registro"],input[ng-model*="registro"]'); }, 7000);
    return ok ? { ok: true } : { error: 'filter_timeout' };
  };

  var s4 = async function (t) {
    t = (t || '').replace(/\D/g, '');
    await _w(300);
    var inp = document.querySelector('input[ng-model*="egistro"],input[ng-model*="Registro"],input[ng-model*="registro"]');
    if (!inp) {
      for (var lbl of document.querySelectorAll('label,.control-label,td')) {
        if (!/^registro$/i.test((lbl.textContent || '').trim().replace(/:+$/, ''))) continue;
        var fi = lbl.getAttribute('for');
        if (fi) { inp = document.getElementById(fi); if (inp) break; }
        var col = lbl.closest('.form-group,[class*="col-"]');
        if (col) { inp = col.querySelector('input'); if (inp) break; }
      }
    }
    if (!inp) return { error: 'input_not_found' };
    inp.focus();
    _sv(inp, t);
    await _w(700);
    var snap = (document.querySelector('table tbody,[ng-repeat]') || {}).innerHTML || document.body.innerHTML.substring(0, 6000);
    var btn = [...document.querySelectorAll('button,input[type="submit"]')].find(function (e) {
      return /filtrar|buscar|pesquisar/i.test((e.textContent || e.value || '').trim());
    }) || document.querySelector('[ng-click*="filtrar"],[ng-click*="buscar"],[ng-click*="pesquis"]');
    var clicked = false;
    if (btn) { btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window })); clicked = true; }
    if (!clicked) {
      var form = document.querySelector('form[ng-submit],form');
      if (form) {
        var ns = form.getAttribute('ng-submit');
        if (ns) try { angular.element(form).scope().$apply(function (sc) { sc.$eval(ns); }); clicked = true; } catch (e) {}
        if (!clicked) { form.dispatchEvent(new Event('submit', { bubbles: true })); clicked = true; }
      }
    }
    if (!clicked) return { error: 'button_not_found' };
    var ok = await _wc(function () {
      var now = (document.querySelector('table tbody,[ng-repeat]') || {}).innerHTML || document.body.innerHTML.substring(0, 6000);
      return now !== snap && now.trim().length > 10;
    }, 12000);
    return ok ? { ok: true } : { error: 'search_no_result' };
  };

  var s5 = async function () {
    await _w(300);
    var el = document.querySelector('a[ng-click*="edit"],button[ng-click*="edit"],a[ng-click*="detalhe"],[title*="ditar"],[title*="etalhe"]');
    if (!el) {
      var icon = document.querySelector('.fa-pencil,.fa-edit,.fa-pencil-alt,.glyphicon-pencil,.fa-eye');
      if (icon) el = icon.closest('a,button') || icon;
    }
    if (!el) {
      var rows = [...document.querySelectorAll('table tbody tr[ng-repeat],table tbody tr,li[ng-repeat]')].filter(function (r) { return r.textContent.trim().length > 3; });
      if (rows.length) {
        var btns = [...rows[0].querySelectorAll('a,button')];
        el = btns.find(function (b) { return /editar|edit|detalhe|ver|ficha/i.test(b.textContent + (b.getAttribute('ng-click') || '') + b.className); }) || btns[btns.length - 1];
      }
    }
    if (!el) return { error: 'edit_not_found' };
    el.click();
    var ok = await _wc(function () {
      return [...document.querySelectorAll('label,span,td')].some(function (n) { return /qr.?code/i.test(n.textContent); }) || !!document.querySelector('form input,.form-control');
    }, 10000);
    return ok ? { ok: true } : { error: 'detail_timeout' };
  };

  var s6 = async function () {
    await _w(500);
    for (var node of document.querySelectorAll('label,span,td,.control-label,div,p')) {
      if (!/qr.?code/i.test(node.textContent.trim())) continue;
      var fi = node.getAttribute && node.getAttribute('for');
      var inp = fi ? document.getElementById(fi) : null;
      if (!inp) {
        var sv = node.nextElementSibling;
        while (sv && !['INPUT', 'SPAN', 'P'].includes(sv.tagName)) sv = sv.nextElementSibling;
        inp = sv;
      }
      if (!inp) { var pn = node.closest('div,tr,.form-group,.row,li'); if (pn) inp = pn.querySelector('input') || pn; }
      var val = (inp && (inp.value || inp.textContent || '')).trim();
      if (val && /\d/.test(val)) return { qrCode: val };
    }
    for (var sel of ['input[ng-model*="QrCode"]', 'input[ng-model*="qrCode"]', 'input[ng-model*="qr_code"]', 'input[id*="qr" i]']) {
      var el = document.querySelector(sel);
      if (el && el.value) return { qrCode: el.value.trim() };
    }
    var cands = [...document.querySelectorAll('input[readonly],input[disabled],input')].filter(function (i) { return i.value && /^\d{4,}$/.test(i.value.trim()); });
    if (cands.length) return { qrCode: cands[0].value.trim() };
    return { error: 'qr_not_found' };
  };

  // ── Message listener ────────────────────────────────────────────────────────
  window.addEventListener('message', function (ev) {
    var msg = ev.data;
    if (msg && msg.__meliEasyCmd) { _src = ev.source; if (msg.action === 'cancel') window.__mebc = true; }
  });

  // ── Progress banner ─────────────────────────────────────────────────────────
  var _bkb = document.createElement('div');
  _bkb.id = '__meb_b';
  _bkb.style.cssText = 'position:fixed;top:10px;right:10px;background:#e6a800;color:#333;padding:10px 16px;border-radius:8px;z-index:99999;font-size:13px;font-weight:700;box-shadow:0 2px 10px rgba(0,0,0,.4);cursor:pointer;min-width:240px;text-align:center';
  _bkb.title = 'Clique para fechar';
  _bkb.onclick = function () { _bkb.remove(); };
  document.body.appendChild(_bkb);

  if (!_inputData) {
    _bkb.style.background = '#c0392b';
    _bkb.style.color = '#fff';
    _bkb.innerHTML = '⚠️ Clique em "Buscar QR" no app Meli Easy antes deste favorito';
    window.__meb = false;
    return;
  }

  // ── Main automation loop ────────────────────────────────────────────────────
  var collabs = _inputData, total = collabs.length;
  _bkb.innerHTML = '⏳ Meli Easy: 0/' + total + ' — navegando...';

  var r = await s1();
  if (r.error) {
    _bkb.style.background = '#c0392b'; _bkb.style.color = '#fff';
    _bkb.innerHTML = '❌ Não encontrou "Configurações": ' + r.error;
    return;
  }

  for (var i = 0; i < total; i++) {
    if (window.__mebc) break;
    var d = collabs[i];
    var term = (d.re || d.cpf || '').replace(/\D/g, '');
    d._qr = null;
    _bkb.innerHTML = '⏳ Meli Easy: ' + (i + 1) + '/' + total + ' — ' + ((d.fname || '') + ' ' + (d.lname || '')).trim();

    for (var att = 1; att <= 3; att++) {
      if (window.__mebc) break;
      r = await s2(); if (r.error) break;
      var fail = false;
      for (var st = 3; st <= 6; st++) {
        if (window.__mebc) break;
        var res = st === 3 ? await s3() : st === 4 ? await s4(term) : st === 5 ? await s5() : await s6();
        if (res.error) { fail = true; break; }
        if (st === 6 && res.qrCode) d._qr = res.qrCode;
      }
      if (d._qr) break;
      if (!fail) break;
      if (att < 3 && !window.__mebc) await _w(3000);
    }
    notify(d._qr
      ? { action: 'qr_found', index: i, re: d.re, cpf: d.cpf, qrCode: d._qr }
      : { action: 'qr_not_found', index: i, re: d.re, cpf: d.cpf }
    );
  }

  // ── Send results back ───────────────────────────────────────────────────────
  var allQR = collabs.map(function (c) { return { re: c.re, cpf: c.cpf, qrCode: c._qr || null }; });
  var enc;
  try { enc = btoa(unescape(encodeURIComponent(JSON.stringify(allQR)))); } catch (e) { enc = btoa(JSON.stringify(allQR)); }

  try { window.open('https://meli-easy-app.github.io/#_mer=' + enc, 'meliEasyMain'); } catch (e) {}

  _bkb.style.background = '#00a650';
  _bkb.style.color = '#fff';
  _bkb.innerHTML = '✅ Meli Easy: QR codes enviados ao app!';
})();

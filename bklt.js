// Meli Easy — bookmarklet automation v4 (ngRoute + $location, rotas reais)
// Rotas descobertas via leitura do appMercadoLivre.js:
//   /employee         — lista de funcionários (search.RecordNumber, filtrar)
//   /employee/edit/:id — edição (employee.IdentifierQR)
(async function () {
  if (window.__meb) return;
  window.__meb = true;
  window.__mebc = false;

  /* ── utilidades ────────────────────────────────────────────────────────── */
  var _w  = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  var _wc = async function (fn, ms) {
    var t = Date.now();
    while (Date.now() - t < (ms || 12000)) {
      try { if (fn()) return true; } catch (e) {}
      await _w(300);
    }
    return false;
  };
  var _sv = function (inp, val) {
    // Seta valor em input AngularJS via várias estratégias
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

  /* ── banner ───────────────────────────────────────────────────────────── */
  var _bkb = document.createElement('div');
  _bkb.id = '__meb_b';
  _bkb.style.cssText = 'position:fixed;top:10px;right:10px;z-index:99999;padding:10px 16px;border-radius:8px;min-width:260px;max-width:380px;font:700 12px/1.5 sans-serif;box-shadow:0 2px 12px rgba(0,0,0,.45);cursor:pointer;text-align:center';
  _bkb.onclick = function () { _bkb.remove(); };
  document.body.appendChild(_bkb);

  var _step = function (txt, bg) {
    _bkb.style.background = bg || '#e6a800';
    _bkb.style.color = bg ? '#fff' : '#333';
    _bkb.innerHTML = txt;
    console.info('[MeliEasy]', txt.replace(/<[^>]*>/g, ''));
  };

  /* ── leitura de dados ─────────────────────────────────────────────────── */
  var _inputData = null;

  // 1) window.name (principal — persiste sobre roteamento ngRoute)
  try {
    var _wn = window.name || '';
    if (_wn.startsWith('melidata_')) {
      _inputData = JSON.parse(decodeURIComponent(escape(atob(_wn.slice(9)))));
      console.info('[MeliEasy] Dados lidos de window.name —', _inputData.length, 'colaboradores');
    }
  } catch (e) { console.warn('[MeliEasy] window.name parse error', e); }

  // 2) hash (fallback)
  if (!_inputData) {
    try {
      var _h = window.location.hash, _mi = _h.indexOf('_med=');
      if (_mi !== -1) {
        _inputData = JSON.parse(decodeURIComponent(escape(atob(_h.substring(_mi + 5).split('&')[0].split('#')[0]))));
        history.replaceState(null, '', window.location.pathname + window.location.search);
        console.info('[MeliEasy] Dados lidos do hash —', _inputData.length, 'colaboradores');
      }
    } catch (e) { console.warn('[MeliEasy] hash parse error', e); }
  }

  // 3) Aba errada — redirecionar para go.html (mesma origem do app) que abre a aba certa
  if (!_inputData) {
    _step('🔄 Detectada aba errada. Abrindo aba correta…', '#555');
    await _w(600);
    window.__meb = false; // libera flag para nova execução na aba certa
    window.location.href = 'https://meli-easy-app.github.io/go.html?_=' + Date.now();
    return;
  }

  /* ── helper $location (ngRoute) ──────────────────────────────────────── */
  var _goto = function (path) {
    try {
      var inj = angular.element(document.body).injector();
      inj.get('$location').path(path);
      inj.get('$rootScope').$apply();
      return true;
    } catch (e) {
      // Fallback: troca hash diretamente
      location.hash = path;
      return false;
    }
  };

  /* ── PASSO 1: ir para /employee ──────────────────────────────────────── */
  var goToList = async function () {
    var already = location.hash.replace(/^#/, '') === '/employee' ||
                  location.hash.startsWith('#/employee') && !location.hash.includes('/edit');
    if (!already) {
      _goto('/employee');
    }
    // Aguarda o campo de busca aparecer
    var ok = await _wc(function () {
      return !!document.querySelector('input[ng-model="search.RecordNumber"]');
    }, 15000);
    return ok ? { ok: true } : { error: 'employee_list_timeout — hash: ' + location.hash };
  };

  /* ── PASSO 2: buscar por RE e aguardar resultado ──────────────────────── */
  var searchEmployee = async function (term) {
    term = (term || '').replace(/\D/g, '');

    var inp = document.querySelector('input[ng-model="search.RecordNumber"]');
    if (!inp) return { error: 'RecordNumber_input_not_found' };

    // Limpa e preenche
    _sv(inp, '');
    await _w(200);
    _sv(inp, term);
    await _w(500);

    // Snapshot antes de buscar
    var snap = (document.querySelector('.tableNoBorder tbody, table tbody') || {}).innerHTML || '';

    // Clica no botão "filtrar"
    var btn = document.querySelector('input[type="button"][value="filtrar"]') ||
              [...document.querySelectorAll('input[type="button"],button')].find(function (b) {
                return /filtrar|buscar|search/i.test(b.value || b.textContent);
              });
    if (!btn) {
      // Tenta via scope
      try {
        var sc = angular.element(inp).scope();
        sc.$apply(function () { sc.executeSearch(); sc.paginator && sc.paginator.firstPage && sc.paginator.firstPage(); });
      } catch (e) { return { error: 'filtrar_button_not_found' }; }
    } else {
      btn.click();
    }

    // Aguarda mudança na tabela
    var ok = await _wc(function () {
      var now = (document.querySelector('.tableNoBorder tbody, table tbody') || {}).innerHTML || '';
      return now !== snap && now.trim().length > 20;
    }, 12000);
    return ok ? { ok: true } : { error: 'search_no_result — term: ' + term };
  };

  /* ── PASSO 3: clicar no lápis de edição ──────────────────────────────── */
  var openEdit = async function () {
    await _w(300);
    var pencil = document.querySelector('span.icon-pencil.action, span[title="editar"], .icon-pencil');
    if (!pencil) {
      // Verifica se há resultado ou mensagem de vazio
      var empty = document.querySelector('[ng-show="employees.length == 0"]');
      if (empty && empty.offsetParent) return { error: 'employee_not_found_in_list' };
      return { error: 'pencil_icon_not_found' };
    }
    // Dispara via ng-click (edit(item)) pelo scope do elemento
    try {
      var sc = angular.element(pencil).scope();
      sc.$apply(function () { sc.edit(sc.item || sc.employee); });
    } catch (e) { pencil.click(); }

    var ok = await _wc(function () {
      return !!document.querySelector('input[ng-model="employee.IdentifierQR"]');
    }, 12000);
    return ok ? { ok: true } : { error: 'edit_page_timeout — url: ' + location.hash };
  };

  /* ── PASSO 4: ler QR Code da página de edição ────────────────────────── */
  var readQR = async function () {
    await _w(500);
    var qrInput = document.querySelector('input[ng-model="employee.IdentifierQR"]');
    if (!qrInput) return { error: 'IdentifierQR_not_found' };

    var val = qrInput.value || '';
    // Tenta também via AngularJS scope
    if (!val) {
      try {
        var sc = angular.element(qrInput).scope();
        val = (sc.employee && sc.employee.IdentifierQR) || '';
      } catch (e) {}
    }

    if (val && val.trim()) return { qrCode: val.trim() };
    return { error: 'IdentifierQR_empty — inputs: ' + [...document.querySelectorAll('input[ng-model]')].map(function(i){return i.getAttribute('ng-model')+'='+i.value.substring(0,15);}).join(' | ') };
  };

  /* ── LOOP PRINCIPAL ──────────────────────────────────────────────────── */
  var collabs  = _inputData;
  var total    = collabs.length;

  _step('⏳ Meli Easy: navegando para funcionários... (0/' + total + ')');

  var r = await goToList();
  if (r.error) {
    _step('❌ Não abriu a lista: ' + r.error, '#c0392b');
    window.__meb = false; return;
  }

  for (var i = 0; i < total; i++) {
    if (window.__mebc) break;
    var d = collabs[i];
    var term = (d.re || d.cpf || '').replace(/\D/g, '');
    d._qr = null;

    _step('⏳ Meli Easy: ' + (i + 1) + '/' + total + ' — ' + ((d.fname || '') + ' ' + (d.lname || '')).trim());

    for (var att = 1; att <= 3; att++) {
      if (window.__mebc) break;

      // Garante que está na lista antes de cada busca
      r = await goToList();
      if (r.error) { console.warn('[MeliEasy] goToList error att=' + att, r.error); break; }

      r = await searchEmployee(term);
      if (r.error) { console.warn('[MeliEasy] search error att=' + att, r.error); if (att < 3) await _w(2000); continue; }

      r = await openEdit();
      if (r.error) { console.warn('[MeliEasy] openEdit error att=' + att, r.error); if (att < 3) await _w(2000); continue; }

      r = await readQR();
      if (r.qrCode) { d._qr = r.qrCode; break; }
      console.warn('[MeliEasy] readQR error att=' + att, r.error);
      if (att < 3) await _w(2000);
    }

    if (d._qr) {
      console.info('[MeliEasy] ✓ QR encontrado para', term, ':', d._qr);
    } else {
      console.warn('[MeliEasy] ✗ QR não encontrado para', term);
    }
  }

  /* ── ENVIO DE RESULTADOS ────────────────────────────────────────────── */
  var allQR = collabs.map(function (c) { return { re: c.re, cpf: c.cpf, qrCode: c._qr || null }; });
  var enc;
  try { enc = btoa(unescape(encodeURIComponent(JSON.stringify(allQR)))); }
  catch (e) { enc = btoa(JSON.stringify(allQR)); }

  try { window.open('https://meli-easy-app.github.io/#_mer=' + enc, 'meliEasyMain'); } catch (e) {}

  var found = allQR.filter(function (r) { return r.qrCode; }).length;
  _step('✅ ' + found + '/' + total + ' QR codes encontrados e enviados ao app!', '#00a650');
  console.info('[MeliEasy] Resultados:', allQR);
})();

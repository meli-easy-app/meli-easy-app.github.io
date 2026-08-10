// Meli Easy — extensão Chrome (world: MAIN)
// Roda automaticamente no Meli Pass quando a aba foi aberta pelo app Meli Easy
(async function () {
  if (!window.name || !window.name.startsWith('melidata_')) return;

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

  var _inputData = null;
  try {
    _inputData = JSON.parse(decodeURIComponent(escape(atob(window.name.slice(9)))));
  } catch (e) { console.error('[MeliEasy] parse error', e); return; }
  if (!_inputData || !_inputData.length) return;

  var _goto = function (path) {
    try {
      var inj = angular.element(document.body).injector();
      inj.get('$location').path(path);
      inj.get('$rootScope').$apply();
      return true;
    } catch (e) { location.hash = path; return false; }
  };

  var goToList = async function () {
    var already = location.hash.replace(/^#/, '') === '/employee' ||
                  (location.hash.startsWith('#/employee') && !location.hash.includes('/edit'));
    if (!already) _goto('/employee');
    var ok = await _wc(function () {
      return !!document.querySelector('input[ng-model="search.RecordNumber"]');
    }, 15000);
    return ok ? { ok: true } : { error: 'employee_list_timeout' };
  };

  var searchEmployee = async function (term) {
    term = (term || '').replace(/\D/g, '');
    var inp = document.querySelector('input[ng-model="search.RecordNumber"]');
    if (!inp) return { error: 'RecordNumber_input_not_found' };
    _sv(inp, ''); await _w(200); _sv(inp, term); await _w(500);
    var snap = (document.querySelector('.tableNoBorder tbody, table tbody') || {}).innerHTML || '';
    var btn = document.querySelector('input[type="button"][value="filtrar"]') ||
              [...document.querySelectorAll('input[type="button"],button')].find(function (b) {
                return /filtrar|buscar|search/i.test(b.value || b.textContent);
              });
    if (!btn) {
      try { var sc = angular.element(inp).scope(); sc.$apply(function () { sc.executeSearch(); }); }
      catch (e) { return { error: 'filtrar_button_not_found' }; }
    } else { btn.click(); }
    var ok = await _wc(function () {
      var now = (document.querySelector('.tableNoBorder tbody, table tbody') || {}).innerHTML || '';
      return now !== snap && now.trim().length > 20;
    }, 12000);
    return ok ? { ok: true } : { error: 'search_no_result — term: ' + term };
  };

  var openEdit = async function () {
    await _w(300);
    var pencil = document.querySelector('span.icon-pencil.action, span[title="editar"], .icon-pencil');
    if (!pencil) {
      var empty = document.querySelector('[ng-show="employees.length == 0"]');
      if (empty && empty.offsetParent) return { error: 'employee_not_found_in_list' };
      return { error: 'pencil_icon_not_found' };
    }
    try { var sc = angular.element(pencil).scope(); sc.$apply(function () { sc.edit(sc.item || sc.employee); }); }
    catch (e) { pencil.click(); }
    var ok = await _wc(function () {
      return !!document.querySelector('input[ng-model="employee.IdentifierQR"]');
    }, 12000);
    return ok ? { ok: true } : { error: 'edit_page_timeout' };
  };

  var readQR = async function () {
    await _w(500);
    var qrInput = document.querySelector('input[ng-model="employee.IdentifierQR"]');
    if (!qrInput) return { error: 'IdentifierQR_not_found' };
    var val = qrInput.value || '';
    if (!val) {
      try { var sc = angular.element(qrInput).scope(); val = (sc.employee && sc.employee.IdentifierQR) || ''; } catch (e) {}
    }
    if (val && val.trim()) return { qrCode: val.trim() };
    return { error: 'IdentifierQR_empty' };
  };

  var collabs = _inputData, total = collabs.length;
  _step('⏳ Meli Easy: auto-iniciando… (0/' + total + ')');

  var r = await goToList();
  if (r.error) { _step('❌ ' + r.error, '#c0392b'); return; }

  for (var i = 0; i < total; i++) {
    var d = collabs[i];
    var term = (d.re || d.cpf || '').replace(/\D/g, '');
    d._qr = null;
    _step('⏳ ' + (i + 1) + '/' + total + ' — ' + ((d.fname || '') + ' ' + (d.lname || '')).trim());
    for (var att = 1; att <= 3; att++) {
      r = await goToList(); if (r.error) break;
      r = await searchEmployee(term); if (r.error) { if (att < 3) await _w(2000); continue; }
      r = await openEdit();           if (r.error) { if (att < 3) await _w(2000); continue; }
      r = await readQR();
      if (r.qrCode) { d._qr = r.qrCode; break; }
      if (att < 3) await _w(2000);
    }
    if (d._qr) console.info('[MeliEasy] ✓', term, ':', d._qr);
    else        console.warn('[MeliEasy] ✗', term);
  }

  var allQR = collabs.map(function (c) { return { re: c.re, cpf: c.cpf, qrCode: c._qr || null }; });
  var enc;
  try { enc = btoa(unescape(encodeURIComponent(JSON.stringify(allQR)))); }
  catch (e) { enc = btoa(JSON.stringify(allQR)); }
  try { window.open('https://meli-easy-app.github.io/#_mer=' + enc, 'meliEasyMain'); } catch (e) {}

  var found = allQR.filter(function (r) { return r.qrCode; }).length;
  _step('✅ ' + found + '/' + total + ' QR codes enviados ao app!', '#00a650');
})();

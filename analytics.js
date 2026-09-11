/* Suivi d'audience anonyme — Groupe Scolaire Le Miri.
   Écrit uniquement des compteurs agrégés + un journal de pages vues dans
   Firebase (analytics/). Aucune donnée personnelle : pas d'IP, pas de nom,
   pas d'email, pas de cookie tiers. Un identifiant aléatoire est stocké en
   local (localStorage) pour approximer les visiteurs uniques.
   Lecture des statistiques réservée à l'admin connecté (voir admin/index.html). */
(function () {
  var FIREBASE_URL = 'https://lemiri-cms-default-rtdb.europe-west1.firebasedatabase.app';

  function randomId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  }
  function getOrSet(storage, key) {
    try {
      var v = storage.getItem(key);
      if (v) return { value: v, isNew: false };
      v = randomId();
      storage.setItem(key, v);
      return { value: v, isNew: true };
    } catch (e) {
      return { value: randomId(), isNew: true };
    }
  }
  function sanitizeKey(s) {
    return String(s).replace(/[.#$\[\]\/]/g, '_').slice(0, 40);
  }
  function deviceCategory() {
    var w = window.innerWidth || document.documentElement.clientWidth;
    if (w < 640) return 'mobile';
    if (w < 1024) return 'tablet';
    return 'desktop';
  }
  function browserCategory() {
    var ua = navigator.userAgent || '';
    if (/Edg\//.test(ua)) return 'edge';
    if (/Firefox\//.test(ua)) return 'firefox';
    if (/Chrome\//.test(ua) && !/Edg\//.test(ua)) return 'chrome';
    if (/Safari\//.test(ua) && !/Chrome/.test(ua)) return 'safari';
    return 'autre';
  }
  function pageKey() {
    var p = location.pathname.replace(/^\/+|\/+$/g, '');
    if (!p || p === 'index.html') return 'accueil';
    return sanitizeKey(p.replace(/\.html$/, '')) || 'accueil';
  }
  function referrerKey() {
    if (!document.referrer) return 'direct';
    try {
      var host = new URL(document.referrer).hostname.replace(/^www\./, '');
      if (!host || host === location.hostname) return 'direct';
      return sanitizeKey(host);
    } catch (e) {
      return 'autre';
    }
  }

  // Ne pas tracker l'espace admin
  if (location.pathname.indexOf('/admin') === 0) return;

  var visitor = getOrSet(window.localStorage, 'lm_vid');
  var now = new Date();
  var day = now.toISOString().slice(0, 10);
  var hour = now.getHours();       // heure locale du visiteur (0-23)
  var dow = now.getDay();          // jour local du visiteur (0=dimanche..6=samedi)
  var page = pageKey();
  var device = deviceCategory();
  var browser = browserCategory();
  var ref = referrerKey();
  var evId = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

  var updates = {};
  updates['pageviews/' + day + '/' + evId] = { p: page, r: ref, d: device, b: browser, t: { '.sv': 'timestamp' } };
  updates['daily/' + day + '/visits'] = { '.sv': { increment: 1 } };
  updates['daily/' + day + '/pages/' + page] = { '.sv': { increment: 1 } };
  updates['daily/' + day + '/devices/' + device] = { '.sv': { increment: 1 } };
  updates['daily/' + day + '/browsers/' + browser] = { '.sv': { increment: 1 } };
  updates['daily/' + day + '/referrers/' + ref] = { '.sv': { increment: 1 } };
  updates['daily/' + day + '/hours/' + hour] = { '.sv': { increment: 1 } };
  updates['daily/' + day + '/dow/' + dow] = { '.sv': { increment: 1 } };
  if (visitor.isNew) updates['daily/' + day + '/uniques'] = { '.sv': { increment: 1 } };

  fetch(FIREBASE_URL + '/analytics/.json', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  }).catch(function () {});
})();

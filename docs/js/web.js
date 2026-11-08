/* Reliquias de Primer Bloque - pestanas accesibles y enlace de descarga al dia. */
(function () {
  "use strict";

  /* ---------- Pestanas (patron WAI-ARIA, activacion automatica) ---------- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('[role="tab"]'));

  function activar(tab, enfocar, actualizarHash) {
    tabs.forEach(function (t) {
      var sel = t === tab;
      t.setAttribute("aria-selected", sel ? "true" : "false");
      t.tabIndex = sel ? 0 : -1;
      var panel = document.getElementById(t.getAttribute("aria-controls"));
      if (panel) panel.hidden = !sel;
    });
    if (enfocar) tab.focus();
    if (actualizarHash && history.replaceState) {
      history.replaceState(null, "", "#" + tab.id.replace(/^tab-/, ""));
    }
  }

  tabs.forEach(function (tab, i) {
    tab.addEventListener("click", function () { activar(tab, false, true); });
    tab.addEventListener("keydown", function (e) {
      var destino = null;
      switch (e.key) {
        case "ArrowRight": destino = tabs[(i + 1) % tabs.length]; break;
        case "ArrowLeft": destino = tabs[(i - 1 + tabs.length) % tabs.length]; break;
        case "Home": destino = tabs[0]; break;
        case "End": destino = tabs[tabs.length - 1]; break;
        default: return;
      }
      e.preventDefault();
      activar(destino, true, true);
    });
  });

  function desdeHash() {
    var h = (location.hash || "").replace("#", "");
    if (!h) return;
    var tab = document.getElementById("tab-" + h);
    if (tab) {
      activar(tab, false, false);
      var nav = document.getElementById("pestanas");
      if (nav) nav.scrollIntoView();
    }
  }
  desdeHash();
  window.addEventListener("hashchange", desdeHash);

  /* ---------- Descarga: la version portable mas nueva ---------- */
  // La release "Latest" del repositorio es la de imagenes, asi que NO se usa
  // releases/latest: se busca la mas nueva cuyo tag empiece por "v" y que
  // traiga un *_portable.zip. Si la API falla queda el enlace fijo del HTML.
  var API = "https://api.github.com/repos/mechjook/Myl2D-imagenes/releases?per_page=30";
  var boton = document.getElementById("boton-descarga");
  var pie = document.getElementById("pie-descarga");
  var spanVersion = document.getElementById("descarga-version");
  var spanTamano = document.getElementById("descarga-tamano");
  var spanFecha = document.getElementById("descarga-fecha");

  function mb(bytes) { return Math.round(bytes / 1e6) + " MB"; }

  function fechaLarga(iso) {
    try {
      return new Date(iso).toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" });
    } catch (e) { return ""; }
  }

  if (!window.fetch || !boton) return;
  fetch(API, { headers: { Accept: "application/vnd.github+json" } })
    .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
    .then(function (releases) {
      var mejor = null;
      (releases || []).forEach(function (rel) {
        if (!rel || rel.draft || rel.prerelease) return;
        if (typeof rel.tag_name !== "string" || rel.tag_name.charAt(0) !== "v") return;
        var zip = (rel.assets || []).filter(function (a) { return /_portable\.zip$/i.test(a.name); })[0];
        if (!zip) return;
        var fecha = rel.published_at || rel.created_at || "";
        if (!mejor || fecha > mejor.fecha) mejor = { rel: rel, zip: zip, fecha: fecha };
      });
      if (!mejor) return;
      var url = mejor.zip.browser_download_url;
      boton.href = url;
      if (pie) pie.href = url;
      spanVersion.textContent = mejor.rel.tag_name.replace(/^v/, "");
      spanTamano.textContent = mb(mejor.zip.size);
      var f = fechaLarga(mejor.fecha);
      if (f && spanFecha) spanFecha.textContent = "Publicada el " + f + ".";
    })
    .catch(function () { /* se queda el enlace fijo */ });
})();

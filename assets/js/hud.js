/* ── HUD del tema «austral» ────────────────────────────────────────────────
   Marca cada slide con el capítulo vigente (según el último .divisor visto)
   y lo muestra en el cabezal: «CAP 02 · Aspectos económicos del desarrollo».
   ───────────────────────────────────────────────────────────────────────── */
(function () {
  function iniciar() {
    var reveal = document.querySelector('.reveal');
    var hud = document.createElement('div');
    hud.className = 'hud-cap';
    hud.setAttribute('aria-hidden', 'true');
    reveal.appendChild(hud);

    var cap = null;
    Reveal.getSlides().forEach(function (s) {
      var div = s.querySelector('.divisor');
      if (div) {
        cap = { num: div.querySelector('.div-num').textContent.trim(),
                tit: div.querySelector('.div-titulo').textContent.trim() };
      }
      if (s.classList.contains('cierre-slide')) cap = null;
      if (cap) { s.dataset.capNum = cap.num; s.dataset.capTit = cap.tit; }
    });

    function pintar(s) {
      if (s && s.dataset.capNum) {
        hud.innerHTML = '<b>CAP ' + s.dataset.capNum + '</b><span>' + s.dataset.capTit + '</span>';
        hud.classList.add('activo');
      } else hud.classList.remove('activo');
    }
    // Medidor proporcional bajo cada KPI en porcentaje
    document.querySelectorAll('.kpi').forEach(function (k) {
      var c = k.querySelector('.countup'), u = k.querySelector('.kpi-unidad');
      if (!c || !u || u.textContent.trim() !== '%' || k.querySelector('.kpi-barra')) return;
      var b = document.createElement('span');
      b.className = 'kpi-barra';
      b.innerHTML = '<i style="--v:' + Math.min(parseFloat(c.dataset.to), 100) + '%"></i>';
      k.querySelector('.kpi-valor').after(b);
    });

    Reveal.on('slidechanged', function (e) { pintar(e.currentSlide); });
    pintar(Reveal.getCurrentSlide());
  }
  function cuandoListo() {
    if (typeof Reveal === 'undefined') return setTimeout(cuandoListo, 50);
    if (Reveal.isReady()) iniciar(); else Reveal.on('ready', iniciar);
  }
  cuandoListo();
})();

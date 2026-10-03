/* ── Gráficos ECharts · tema «austral» ─────────────────────────────────────
   Cada gráfico es un <div class="echart" data-tipo="…"> con sus datos en un
   <script type="application/json"> (lo genera echart() en R/echarts_umag.R).
   - Se inicializa al entrar a su slide y se vuelve a desplegar cada vez.
   - Pasos con fragmentos: un [ ]{.fragment .paso} en el mismo slide
     avanza el argumento `paso` del constructor (0, 1, 2…).
   ───────────────────────────────────────────────────────────────────────── */
(function () {
  var reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Paleta austral (coherente con theme/umag-austral.scss)
  var C = {
    tinta:   '#E6EDF1',
    suave:   '#93A6B2',
    tenue:   '#5E707C',
    linea:   'rgba(143, 211, 222, 0.14)',
    pizarra: '#5B6B78',   // contexto: nacional, años base, «resto»
    glaciar: '#6FD3E0',   // hielo de campo: serie principal
    magenta: '#E82D88',   // dato destacado UMAG / Magallanes
    magTxt:  '#FF6FB2',   // magenta para texto chico sobre noche
    estepa:  '#D9B26F',   // coirón
    lenga:   '#E0673A',   // lenga en otoño
    noche:   '#0B1117'
  };
  var MONO = '"JetBrains Mono", ui-monospace, Menlo, monospace';
  var SANS = 'Asap, "Helvetica Neue", Arial, sans-serif';

  function fmt(v, dec) {
    if (v === null || v === undefined || isNaN(v)) return '–';
    dec = dec === undefined ? 1 : dec;
    return Number(v).toLocaleString('es-CL', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  }
  function signo(v, dec) { return (v > 0 ? '+' : v < 0 ? '−' : '±') + fmt(Math.abs(v), dec); }
  function pct(v, dec) { return fmt(v, dec) + ' %'; }

  // Piezas comunes ──────────────────────────────────────────────────────────
  var base = {
    backgroundColor: 'transparent',
    textStyle: { fontFamily: MONO, color: C.suave },
    animationDuration: 1300,
    animationDurationUpdate: 900,
    animationEasing: 'cubicOut',
    animationEasingUpdate: 'cubicInOut'
  };
  function tooltip(extra) {
    return Object.assign({
      backgroundColor: 'rgba(11, 17, 23, 0.94)',
      borderColor: 'rgba(143, 211, 222, 0.45)',
      borderWidth: 1,
      padding: [10, 14],
      textStyle: { fontFamily: MONO, fontSize: 16, color: C.tinta },
      extraCssText: 'border-radius:0;box-shadow:0 8px 28px rgba(0,0,0,.45);',
      axisPointer: { type: 'line', lineStyle: { color: 'rgba(143,211,222,.5)', type: 'dashed' },
                     shadowStyle: { color: 'rgba(143,211,222,.06)' } }
    }, extra || {});
  }
  function leyenda(extra) {
    return Object.assign({
      top: 0, left: 0, icon: 'rect', itemWidth: 14, itemHeight: 14, itemGap: 28,
      textStyle: { fontFamily: MONO, fontSize: 16, color: C.suave }
    }, extra || {});
  }
  function ejeValor(extra) {
    return Object.assign({
      type: 'value',
      axisLine: { show: false }, axisTick: { show: false },
      splitLine: { lineStyle: { color: C.linea } },
      axisLabel: { fontFamily: MONO, fontSize: 16, color: C.tenue }
    }, extra || {});
  }
  function ejeCat(datos, extra) {
    return Object.assign({
      type: 'category', data: datos,
      axisLine: { lineStyle: { color: 'rgba(143,211,222,.3)' } }, axisTick: { show: false },
      axisLabel: { fontFamily: SANS, fontSize: 19, color: C.tinta, lineHeight: 22 }
    }, extra || {});
  }
  function fila(t) { return t.tooltipTitulo || t; }
  function cabTip(t) { return '<div style="font-family:' + SANS + ';font-size:17px;font-weight:600;margin-bottom:6px;color:#fff">' + t + '</div>'; }
  function lineaTip(color, nombre, valor) {
    return '<div style="display:flex;gap:18px;justify-content:space-between"><span><span style="display:inline-block;width:10px;height:10px;margin-right:8px;background:' + color + '"></span>' + nombre + '</span><b>' + valor + '</b></div>';
  }
  function retraso(i) { return reducir ? 0 : i * 70; }

  // Envuelve etiquetas largas en varias líneas
  function envolver(t, n) {
    var pal = String(t).split(' '), out = [], cur = '';
    pal.forEach(function (w) {
      if ((cur + ' ' + w).trim().length > n) { out.push(cur.trim()); cur = w; } else cur += ' ' + w;
    });
    out.push(cur.trim());
    return out.join('\n');
  }

  // ═════════════════════════════════════════════════════════════════════════
  // CONSTRUCTORES
  // ═════════════════════════════════════════════════════════════════════════
  var G = {};

  // Líneas con etiqueta al final. o.series: [{campo, nombre, color, ancho, destacar}]
  G.lineas = function (d, o, paso) {
    var x = d.map(function (r) { return r[o.x]; });
    var visibles = o.series.filter(function (s) { return (s.paso || 0) <= paso; });
    return {
      grid: { left: 70, right: o.derecha || 210, top: 30, bottom: 44 },
      tooltip: tooltip({
        trigger: 'axis',
        formatter: function (ps) {
          return cabTip(ps[0].axisValue) + ps.map(function (p) {
            return lineaTip(p.color, p.seriesName, fmt(p.value, o.dec) + (o.unidad || ''));
          }).join('');
        }
      }),
      xAxis: ejeCat(x, { boundaryGap: false, axisLabel: { fontFamily: MONO, fontSize: 17, color: C.suave } }),
      yAxis: ejeValor({ min: o.min, max: o.max, interval: o.intervalo,
                        axisLabel: { fontFamily: MONO, fontSize: 16, color: C.tenue,
                                     formatter: function (v) { return fmt(v, 0) + (o.unidad || ''); } } }),
      series: visibles.map(function (s, i) {
        return {
          type: 'line', name: s.nombre, id: s.campo,
          data: d.map(function (r, i) {
            if (!s.etiquetas) return r[s.campo];
            var lab = i === 0 ? { position: 'right', distance: 14 } : i === d.length - 1 ? { show: false } : undefined;
            return lab ? { value: r[s.campo], label: lab } : r[s.campo];
          }),
          smooth: false, symbol: 'circle', symbolSize: s.destacar ? 13 : 9,
          lineStyle: { width: s.ancho || 3, color: s.color },
          itemStyle: { color: s.color, borderColor: C.noche, borderWidth: 2 },
          emphasis: { focus: 'series' },
          z: s.destacar ? 5 : 2,
          label: s.etiquetas ? { show: true, position: 'bottom', distance: 12, fontFamily: MONO, fontSize: 16,
                                 fontWeight: 600, color: s.colorTexto || s.color,
                                 formatter: function (p) { return fmt(p.value, o.dec); } } : { show: false },
          endLabel: { show: true, distance: 14, offset: s.offset || [0, 0], fontFamily: MONO, fontSize: 17, fontWeight: s.destacar ? 700 : 500,
                      color: s.colorTexto || s.color,
                      formatter: function (p) { return s.nombre + (o.valorFinal ? '  ' + fmt(p.value, o.dec) : ''); } },
          markLine: o.cero ? { silent: true, symbol: 'none', label: { show: false },
                               lineStyle: { color: 'rgba(230,237,241,.45)', type: 'solid', width: 1 },
                               data: [{ yAxis: 0 }] } : undefined,
          markPoint: s.marca ? {
            symbol: 'circle', symbolSize: 0,
            label: { show: true, position: 'right', distance: 10, fontFamily: MONO, fontSize: 18, fontWeight: 700,
                     color: s.colorTexto || s.color, formatter: s.marca.texto },
            data: [{ coord: [String(s.marca.x), s.marca.y] }]
          } : undefined,
          animationDelay: function (idx) { return retraso(idx) * 0.6; }
        };
      })
    };
  };

  // Dumbbell: dos momentos por categoría + columna Δ a la derecha.
  // o: {cat, a, b, la, lb, orden:'b'|null, direccional:true, colorA, colorB, unidad:' %'}
  G.dumbbell = function (d, o) {
    var filas = d.slice();
    if (o.orden !== false) filas.sort(function (p, q) { return p[o.b] - q[o.b]; });
    var cats = filas.map(function (r) { return envolver(r[o.cat], o.envolver || 40); });
    var colA = o.colorA || C.pizarra, colB = o.colorB || C.glaciar;
    function colSeg(r) {
      if (o.direccional === false) return 'rgba(147,166,178,.55)';
      return r[o.b] >= r[o.a] ? C.glaciar : C.lenga;
    }
    var deltas = filas.map(function (r) { return r[o.b] - r[o.a]; });
    return {
      grid: { left: 20, right: 150, top: 56, bottom: 24, containLabel: true },
      legend: leyenda({ data: [o.la, o.lb] }),
      tooltip: tooltip({
        trigger: 'axis', axisPointer: { type: 'shadow' },
        formatter: function (ps) {
          var i = ps[0].dataIndex, r = filas[i];
          return cabTip(r[o.cat]) +
            lineaTip(colA, o.la, fmt(r[o.a]) + (o.unidad || '')) +
            lineaTip(colB, o.lb, fmt(r[o.b]) + (o.unidad || '')) +
            lineaTip(colSeg(r), 'Δ', signo(deltas[i]) + ' pp');
        }
      }),
      xAxis: ejeValor({ min: o.min, max: o.max, scale: o.min === undefined, boundaryGap: [0, '10%'],
                        axisLabel: { fontFamily: MONO, fontSize: 15, color: C.tenue,
                                     formatter: function (v) { return fmt(v, 0) + (o.unidad || ''); } } }),
      yAxis: [
        ejeCat(cats, { axisLine: { show: false },
                       axisLabel: { fontFamily: SANS, fontSize: o.tam || 18, color: C.tinta, lineHeight: 21 } }),
        ejeCat(cats, { position: 'right', axisLine: { show: false }, offset: 16,
          name: 'Δ pp', nameLocation: 'end', nameGap: 26,
          nameTextStyle: { fontFamily: MONO, fontSize: 14, color: C.tenue, align: 'left', padding: [0, 0, 0, 0] },
          axisLabel: {
            align: 'left', fontFamily: MONO, fontSize: 17, fontWeight: 600,
            formatter: function (v, i) { return '{' + (deltas[i] >= 0 ? 'up' : 'dn') + '|' + signo(deltas[i]) + '}'; },
            rich: { up: { color: o.direccional === false ? C.magTxt : C.glaciar, fontFamily: MONO, fontSize: 17, fontWeight: 600 },
                    dn: { color: o.direccional === false ? C.suave : C.lenga, fontFamily: MONO, fontSize: 17, fontWeight: 600 } }
          } })
      ],
      series: [
        {
          type: 'custom', name: 'tramo', silent: true, z: 1,
          renderItem: function (params, api) {
            var p1 = api.coord([api.value(0), api.value(2)]);
            var p2 = api.coord([api.value(1), api.value(2)]);
            return {
              type: 'line',
              shape: { x1: p1[0], y1: p1[1], x2: p2[0], y2: p2[1] },
              style: { stroke: colSeg(filas[params.dataIndex]), lineWidth: 5, opacity: 0.6 },
              enterFrom: { shape: { x2: p1[0] } },
              enterAnimation: { duration: reducir ? 0 : 900, delay: retraso(params.dataIndex) + 250 }
            };
          },
          encode: { x: [0, 1], y: 2 },
          data: filas.map(function (r, i) { return { value: [r[o.a], r[o.b], i], itemStyle: { color: colSeg(r) } }; })
        },
        {
          type: 'scatter', name: o.la, symbolSize: 16, z: 3,
          itemStyle: { color: C.noche, borderColor: colA, borderWidth: 3 },
          data: filas.map(function (r, i) { return [r[o.a], i]; }),
          animationDelay: retraso
        },
        {
          type: 'scatter', name: o.lb, symbolSize: 18, z: 4,
          itemStyle: { color: colB },
          label: { show: true, fontFamily: MONO, fontSize: 16, fontWeight: 700, color: C.tinta,
                   position: 'right', distance: 12,
                   formatter: function (p) { return fmt(p.value[0]); } },
          labelLayout: function (p) {
            var r = filas[p.dataIndex];
            return r[o.b] < r[o.a] ? { dx: -(p.labelRect.width + 34) } : {};
          },
          data: filas.map(function (r, i) { return [r[o.b], i]; }),
          animationDelay: function (i) { return retraso(i) + 500; }
        }
      ]
    };
  };

  // Barras horizontales con una o varias series.
  // o: {cat, series:[{campo,nombre,color}], destacar:{campo,valor,color}, colores:{campoTipo, mapa}}
  G.barrasH = function (d, o) {
    var filas = d.slice();
    if (o.ordenar) filas.sort(function (p, q) { return p[o.ordenar] - q[o.ordenar]; });
    var cats = filas.map(function (r) { return envolver(r[o.cat], o.envolver || 44); });
    var multi = o.series.length > 1;
    function colorFila(r, s) {
      if (o.destacar) return r[o.destacar.campo] === o.destacar.valor ? C.magenta : C.pizarra;
      if (o.colores) return o.colores.mapa[r[o.colores.campo]];
      return s.color;
    }
    return {
      grid: { left: 10, right: 90, top: multi ? 56 : 12, bottom: 10, containLabel: true },
      legend: multi ? leyenda({ data: o.series.map(function (s) { return s.nombre; }) }) : undefined,
      tooltip: tooltip({
        trigger: 'axis', axisPointer: { type: 'shadow' },
        formatter: function (ps) {
          return cabTip(filas[ps[0].dataIndex][o.cat]) + ps.map(function (p) {
            return lineaTip(p.color, p.seriesName, fmt(p.value, o.dec) + (o.unidad || ''));
          }).join('');
        }
      }),
      xAxis: ejeValor({ show: false, max: o.max }),
      yAxis: ejeCat(cats, { inverse: !!o.inverso,
                            axisLabel: { fontFamily: SANS, fontSize: o.tam || 18, color: C.tinta, lineHeight: 21,
                                         formatter: function (v) {
                                           return o.destacar && v === o.destacar.valor ? '{b|' + v + '}' : v;
                                         },
                                         rich: { b: { fontFamily: SANS, fontSize: o.tam || 18, fontWeight: 700, color: C.magTxt } } } }),
      series: o.series.map(function (s, k) {
        return {
          type: 'bar', name: s.nombre, barWidth: multi ? '34%' : '62%', barGap: '18%',
          data: filas.map(function (r) {
            var c = colorFila(r, s);
            return { value: r[s.campo], itemStyle: { color: c } };
          }),
          label: { show: true, position: 'right', distance: 10, fontFamily: MONO, fontSize: o.tamValor || 16, fontWeight: 600,
                   color: s.colorTexto || C.tinta,
                   formatter: function (p) { return fmt(p.value, o.dec) + (o.unidadEtiqueta || ''); } },
          emphasis: { focus: 'series' },
          animationDelay: function (i) { return retraso(o.inverso ? i : filas.length - i) + k * 180; }
        };
      })
    };
  };

  // Barras verticales con la primera categoría destacada
  G.barrasV = function (d, o) {
    return {
      grid: { left: 10, right: 10, top: 48, bottom: 10, containLabel: true },
      tooltip: tooltip({ trigger: 'axis', axisPointer: { type: 'shadow' },
        formatter: function (ps) { return cabTip(ps[0].name) + lineaTip(ps[0].color, o.nombre, pct(ps[0].value)); } }),
      xAxis: ejeCat(d.map(function (r) { return envolver(r[o.cat], 12); }),
                    { axisLabel: { fontFamily: SANS, fontSize: 19, color: C.tinta, lineHeight: 22, interval: 0 } }),
      yAxis: ejeValor({ show: false }),
      series: [{
        type: 'bar', name: o.nombre, barWidth: '58%',
        data: d.map(function (r, i) { return { value: r[o.valor], itemStyle: { color: i === 0 ? C.magenta : C.glaciar, opacity: i === 0 ? 1 : 0.78 } }; }),
        label: { show: true, position: 'top', distance: 10, fontFamily: MONO, fontSize: 22, fontWeight: 700,
                 formatter: function (p) { return pct(p.value); },
                 color: C.tinta },
        animationDelay: retraso
      }]
    };
  };

  // Barras 100 % apiladas con filas de encabezado por variable
  G.apiladas = function (d, o) {
    var cats = [], filas = [], ultima = null;
    d.forEach(function (r) {
      if (r[o.grupo] !== ultima && r[o.grupo] !== 'Total') { cats.push('{h|' + r[o.grupo].toUpperCase() + '}'); filas.push(null); }
      ultima = r[o.grupo];
      cats.push(r[o.cat] === 'Total regional' ? '{t|' + r[o.cat] + '}' : r[o.cat]);
      filas.push(r);
    });
    return {
      grid: { left: 10, right: 76, top: 50, bottom: 0, containLabel: true },
      legend: leyenda({ data: o.series.map(function (s) { return s.nombre; }) }),
      tooltip: tooltip({
        trigger: 'axis', axisPointer: { type: 'shadow' },
        formatter: function (ps) {
          var r = filas[ps[0].dataIndex]; if (!r) return '';
          return cabTip(r[o.grupo] + ' · ' + r[o.cat]) + ps.map(function (p) { return lineaTip(p.color, p.seriesName, pct(p.value)); }).join('');
        }
      }),
      xAxis: ejeValor({ show: false, max: 100 }),
      yAxis: ejeCat(cats, {
        inverse: true, axisLine: { show: false },
        axisLabel: { fontFamily: SANS, fontSize: 16, color: C.tinta,
                     rich: { h: { fontFamily: MONO, fontSize: 13, fontWeight: 600, color: C.glaciar, padding: [8, 0, 0, 0] },
                             t: { fontFamily: SANS, fontSize: 17, fontWeight: 700, color: '#fff' } } }
      }),
      series: o.series.map(function (s, k) {
        var ultimo = k === o.series.length - 1;
        return {
          type: 'bar', name: s.nombre, stack: 't', barWidth: '72%',
          itemStyle: { color: s.color, borderColor: C.noche, borderWidth: 1 },
          data: filas.map(function (r) { return r ? r[s.campo] : null; }),
          label: { show: true, position: ultimo ? 'right' : 'inside', distance: ultimo ? 12 : 0,
                   fontFamily: MONO, fontSize: 14, fontWeight: 600,
                   color: ultimo ? C.magTxt : (s.colorTexto || C.noche),
                   formatter: function (p) { return p.value === null ? '' : fmt(p.value); } },
          emphasis: { focus: 'series' },
          animationDelay: function (i) { return retraso(i) * 0.5 + k * 350; }
        };
      })
    };
  };

  // Barras divergentes: positivo a la derecha, negativo a la izquierda
  G.divergente = function (d, o) {
    var cats = d.map(function (r) { return envolver(r[o.cat], 30); });
    return {
      grid: { left: 10, right: 30, top: 50, bottom: 0, containLabel: true },
      legend: leyenda({ data: [o.der.nombre, o.izq.nombre] }),
      tooltip: tooltip({
        trigger: 'axis', axisPointer: { type: 'shadow' },
        formatter: function (ps) {
          return cabTip(d[ps[0].dataIndex][o.cat]) + ps.map(function (p) { return lineaTip(p.color, p.seriesName, pct(Math.abs(p.value))); }).join('');
        }
      }),
      xAxis: ejeValor({ show: false, min: -85, max: 100 }),
      yAxis: ejeCat(cats, { axisLine: { show: false, onZero: false },
                            axisLabel: { fontFamily: SANS, fontSize: 18, color: C.tinta, lineHeight: 21, margin: 18 } }),
      series: [
        { type: 'bar', name: o.der.nombre, stack: 's', barWidth: '64%', itemStyle: { color: C.glaciar },
          data: d.map(function (r) { return r[o.der.campo]; }),
          label: { show: true, position: 'right', fontFamily: MONO, fontSize: 16, fontWeight: 700, color: C.glaciar,
                   formatter: function (p) { return pct(p.value); } },
          markLine: { silent: true, symbol: 'none', label: { show: false },
                      lineStyle: { color: 'rgba(230,237,241,.55)', type: 'solid', width: 1 }, data: [{ xAxis: 0 }] },
          animationDelay: retraso },
        { type: 'bar', name: o.izq.nombre, stack: 's', itemStyle: { color: C.pizarra },
          data: d.map(function (r) { return -r[o.izq.campo]; }),
          label: { show: true, position: 'left', fontFamily: MONO, fontSize: 16, fontWeight: 600, color: C.suave,
                   formatter: function (p) { return pct(-p.value); } },
          animationDelay: function (i) { return retraso(i) + 300; } }
      ]
    };
  };

  // Ingresos: dos líneas con banda de brecha y porcentaje al centro
  G.brecha = function (d, o) {
    var x = d.map(function (r) { return String(r.anio); });
    var h = d.map(function (r) { return r.hombre / 1000; }), m = d.map(function (r) { return r.mujer / 1000; });
    return {
      grid: { left: 80, right: 150, top: 30, bottom: 44 },
      tooltip: tooltip({
        trigger: 'axis',
        formatter: function (ps) {
          var i = ps[0].dataIndex, r = d[i];
          return cabTip(r.anio) + lineaTip(C.glaciar, 'Hombres', '$' + fmt(r.hombre / 1000, 0) + ' mil') +
            lineaTip(C.magenta, 'Mujeres', '$' + fmt(r.mujer / 1000, 0) + ' mil') +
            lineaTip('transparent', 'Brecha', r.brecha + ' %');
        }
      }),
      xAxis: ejeCat(x, { boundaryGap: false, axisLabel: { fontFamily: MONO, fontSize: 17, color: C.suave } }),
      yAxis: ejeValor({ min: 600, max: 1100, interval: 100,
                        axisLabel: { fontFamily: MONO, fontSize: 16, color: C.tenue, formatter: function (v) { return '$' + fmt(v, 0); } } }),
      series: [
        { type: 'line', name: 'base', stack: 'banda', data: m, symbol: 'none', lineStyle: { opacity: 0 }, silent: true, tooltip: { show: false } },
        { type: 'line', name: 'banda', stack: 'banda', data: h.map(function (v, i) { return v - m[i]; }), symbol: 'none',
          lineStyle: { opacity: 0 }, areaStyle: { color: 'rgba(232,45,136,.13)' }, silent: true },
        { type: 'line', name: 'Hombres', data: h, symbol: 'circle', symbolSize: 12, lineStyle: { width: 4, color: C.glaciar },
          itemStyle: { color: C.glaciar, borderColor: C.noche, borderWidth: 2 },
          endLabel: { show: true, distance: 14, fontFamily: MONO, fontSize: 18, fontWeight: 700, color: C.glaciar, formatter: 'Hombres' } },
        { type: 'line', name: 'Mujeres', data: m, symbol: 'circle', symbolSize: 12, lineStyle: { width: 4, color: C.magenta },
          itemStyle: { color: C.magenta, borderColor: C.noche, borderWidth: 2 },
          endLabel: { show: true, distance: 14, fontFamily: MONO, fontSize: 18, fontWeight: 700, color: C.magTxt, formatter: 'Mujeres' } },
        { type: 'scatter', name: 'Brecha', symbolSize: 0, silent: true, z: 6,
          data: d.map(function (r, i) {
            return i === 0 ? { value: [x[i], (h[i] + m[i]) / 2], label: { offset: [36, 0] } } : [x[i], (h[i] + m[i]) / 2];
          }),
          label: { show: true, position: 'inside', fontFamily: MONO, fontSize: 21, fontWeight: 700, color: '#fff',
                   backgroundColor: 'rgba(11,17,23,.72)', padding: [4, 8],
                   formatter: function (p) { return d[p.dataIndex].brecha + '%'; } },
          animationDelay: function (i) { return 900 + retraso(i) * 1.5; } }
      ]
    };
  };

  // ACM: nube de categorías con casco convexo por grupo
  function casco(pts) {
    pts = pts.slice().sort(function (a, b) { return a[0] - b[0] || a[1] - b[1]; });
    if (pts.length < 3) return pts;
    function cruz(o, a, b) { return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]); }
    var lo = [], up = [];
    pts.forEach(function (p) { while (lo.length >= 2 && cruz(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); });
    pts.slice().reverse().forEach(function (p) { while (up.length >= 2 && cruz(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); });
    return lo.slice(0, -1).concat(up.slice(0, -1));
  }
  G.acm = function (d, o) {
    var grupos = [['Progreso', C.glaciar], ['Estancamiento', C.estepa], ['Decadencia', C.magenta]];
    var series = [];
    grupos.forEach(function (g, k) {
      var filas = d.filter(function (r) { return r.grupo === g[0]; });
      var poli = casco(filas.map(function (r) { return [r.dim1, r.dim2]; }));
      series.push({
        type: 'custom', name: g[0] + ' casco', silent: true, z: 1,
        renderItem: function (params, api) {
          if (params.dataIndex > 0) return;
          var p = poli.map(function (q) { return api.coord(q); });
          return { type: 'polygon', shape: { points: p },
                   style: { fill: g[1], opacity: 0.1, stroke: g[1], lineWidth: 1, lineDash: [4, 4] },
                   enterFrom: { style: { opacity: 0 } },
                   enterAnimation: { duration: reducir ? 0 : 900, delay: 700 + k * 250 } };
        },
        data: [0]
      });
      series.push({
        type: 'scatter', name: g[0], z: 4,
        data: filas.map(function (r) {
          var vecino = d.some(function (q) { return q !== r && q.dim1 > r.dim1 && q.dim1 - r.dim1 < 0.35 && Math.abs(q.dim2 - r.dim2) < 0.12; });
          return { value: [r.dim1, r.dim2], nombre: r.categoria, variable: r.variable, clave: r.variable === 'Percepción',
                   label: vecino ? { position: 'left' } : undefined };
        }),
        symbolSize: function (v, p) { return p.data.clave ? 22 : 12; },
        itemStyle: { color: g[1], borderColor: C.noche, borderWidth: 2 },
        label: { show: true, position: 'right', distance: 8, color: C.tinta,
                 formatter: function (p) { return p.data.clave ? '{k|' + p.data.nombre + '}' : p.data.nombre; },
                 fontFamily: SANS, fontSize: 17,
                 rich: { k: { fontFamily: MONO, fontSize: 19, fontWeight: 700, color: g[1] === C.magenta ? C.magTxt : g[1] } } },
        labelLayout: { hideOverlap: false, moveOverlap: 'shiftY' },
        animationDelay: function (i) { return k * 250 + retraso(i); }
      });
    });
    function eje(nombre, lo, hi, vertical) {
      return ejeValor({ min: lo, max: hi, name: nombre, nameLocation: 'end', nameGap: vertical ? 14 : 16,
        nameTextStyle: { fontFamily: MONO, fontSize: 15, color: C.suave, align: vertical ? 'left' : 'right',
                         verticalAlign: vertical ? 'bottom' : 'top', padding: vertical ? [0, 0, 0, 0] : [22, 0, 0, 0] },
        splitLine: { show: false },
        axisLine: { show: true, onZero: true, lineStyle: { color: 'rgba(230,237,241,.35)', type: 'dashed' } },
        axisLabel: { show: false } });
    }
    return {
      grid: { left: 30, right: 150, top: 40, bottom: 40 },
      legend: leyenda({ data: grupos.map(function (g) { return g[0]; }), icon: 'circle', right: 0, left: 'auto' }),
      tooltip: tooltip({ trigger: 'item',
        formatter: function (p) { return p.data && p.data.nombre ? cabTip(p.data.nombre) + lineaTip(p.color, p.data.variable, 'D1 ' + fmt(p.value[0], 2) + ' · D2 ' + fmt(p.value[1], 2)) : ''; } }),
      xAxis: eje(o.dim1, -1, 1.85, false),
      yAxis: eje(o.dim2, -1, 1.5, true),
      series: series
    };
  };

  // ═════════════════════════════════════════════════════════════════════════
  // CICLO DE VIDA con reveal.js
  // ═════════════════════════════════════════════════════════════════════════
  var registro = new Map();   // div → {chart, spec}

  function spec(div) {
    if (!div._spec) div._spec = JSON.parse(div.querySelector('script[type="application/json"]').textContent);
    return div._spec;
  }
  function pasoActual(slide) {
    return slide ? slide.querySelectorAll('.fragment.paso.visible').length : 0;
  }
  function opcion(div, paso) {
    var s = spec(div), f = G[div.dataset.tipo];
    if (!f) { console.warn('Gráfico desconocido', div.dataset.tipo); return null; }
    var op = Object.assign({}, base, f(s.datos, s.opciones || {}, paso));
    if (reducir) op.animation = false;
    return op;
  }
  function desplegar(div, slide) {
    var r = registro.get(div);
    if (r) r.chart.dispose();
    var chart = echarts.init(div, null, { renderer: 'svg' });
    var op = opcion(div, pasoActual(slide));
    if (op) chart.setOption(op);
    registro.set(div, { chart: chart });
  }
  function actualizarPaso(slide) {
    slide.querySelectorAll('.echart').forEach(function (div) {
      var r = registro.get(div); if (!r) return;
      var op = opcion(div, pasoActual(slide));
      if (op) r.chart.setOption(op, { replaceMerge: ['series'] });
    });
  }
  function entrar(slide) {
    if (!slide) return;
    slide.querySelectorAll('.echart').forEach(function (div) { desplegar(div, slide); });
  }
  function salir(slide) {
    if (!slide) return;
    slide.querySelectorAll('.echart').forEach(function (div) {
      var r = registro.get(div); if (r) { r.chart.dispose(); registro.delete(div); }
    });
  }

  function iniciar() {
    var impresion = /print-pdf/.test(location.search);
    var listo = document.fonts ? document.fonts.ready : Promise.resolve();
    listo.then(function () {
      if (impresion) {
        // PDF: todos los gráficos, sin animación y en su último paso
        base.animation = false;
        document.querySelectorAll('.echart').forEach(function (div) {
          var s = div.closest('section');
          var chart = echarts.init(div, null, { renderer: 'svg' });
          var op = opcion(div, s ? s.querySelectorAll('.fragment.paso').length : 0);
          if (op) chart.setOption(op);
        });
        return;
      }
      entrar(Reveal.getCurrentSlide());
    });
    Reveal.on('slidechanged', function (e) { salir(e.previousSlide); entrar(e.currentSlide); });
    Reveal.on('fragmentshown', function (e) { if (e.fragment.classList.contains('paso')) actualizarPaso(Reveal.getCurrentSlide()); });
    Reveal.on('fragmenthidden', function (e) { if (e.fragment.classList.contains('paso')) actualizarPaso(Reveal.getCurrentSlide()); });
    Reveal.on('resize', function () { registro.forEach(function (r) { r.chart.resize(); }); });
  }

  function cuandoListo() {
    if (typeof Reveal === 'undefined' || typeof echarts === 'undefined') return setTimeout(cuandoListo, 50);
    if (Reveal.isReady()) iniciar(); else Reveal.on('ready', iniciar);
  }
  cuandoListo();
})();

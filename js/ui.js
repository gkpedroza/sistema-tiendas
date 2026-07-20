/* ============================================================
   ui.js — helpers DOM, formato es-VE, iconos, sheets, toasts,
   y gráficas SVG propias (línea glow, barras, dona, sparkline)
   ============================================================ */
window.App = window.App || {};

(function () {
  "use strict";

  /* ---------- DOM ---------- */
  App.$ = function (sel, root) { return (root || document).querySelector(sel); };
  App.$$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  App.esc = function (s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  };
  App.delegar = function (root, evento, selector, fn) {
    root.addEventListener(evento, function (e) {
      var t = e.target.closest(selector);
      if (t && root.contains(t)) fn(e, t);
    });
  };

  /* ---------- formato es-VE ---------- */
  var nfUsd = new Intl.NumberFormat("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  var nfBs = new Intl.NumberFormat("es-VE", { maximumFractionDigits: 0 });
  var nfNum = new Intl.NumberFormat("es-VE", { maximumFractionDigits: 1 });
  var MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  var DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

  App.fmt = {
    usd: function (n) { return "$" + nfUsd.format(+n || 0); },
    usd0: function (n) { return "$" + nfBs.format(Math.round(+n || 0)); },
    bs: function (n) { return "Bs " + nfBs.format(Math.round(+n || 0)); },
    num: function (n) { return nfNum.format(+n || 0); },
    pct: function (n, dec) { return nfNum.format(+n || 0) + "%"; },
    fecha: function (iso) {
      if (!iso) return "—";
      var d = App.fromISO(iso);
      return d.getDate() + " " + MESES[d.getMonth()] + (d.getFullYear() !== new Date().getFullYear() ? " " + d.getFullYear() : "");
    },
    fechaLarga: function (iso) {
      var d = App.fromISO(iso);
      return DIAS[d.getDay()] + " " + d.getDate() + " de " + MESES[d.getMonth()] + " " + d.getFullYear();
    },
    fechaRel: function (iso) {
      var hoy = App.hoyISO();
      if (iso === hoy) return "Hoy";
      if (iso === App.toISO(App.addDays(new Date(), -1))) return "Ayer";
      return App.fmt.fecha(iso);
    },
    hora: function (fechaHora) { return fechaHora && fechaHora.length > 10 ? fechaHora.slice(11, 16) : ""; },
    dual: function (usd) {
      return '<div class="money-dual num"><div>' + App.fmt.usd(usd) + '</div><div class="bs">' + App.fmt.bs(App.calc.bsDe(usd)) + "</div></div>";
    }
  };
  App.iniciales = function (nombre) {
    var p = String(nombre || "?").trim().split(/\s+/);
    return (p[0][0] + (p[1] ? p[1][0] : "")).toUpperCase();
  };

  /* ---------- iconos (stroke 1.8, 24px) ---------- */
  function I(paths) {
    return '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + paths + "</svg>";
  }
  App.ICONS = {
    inicio: I('<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h5v-6h4v6h5V9.5"/>'),
    ventas: I('<path d="M6 7h12l1.5 14h-15L6 7Z"/><path d="M8.5 10V6a3.5 3.5 0 0 1 7 0v4"/>'),
    envios: I('<path d="M1.5 6h13v11h-13z"/><path d="M14.5 10h4l3 3.5V17h-7"/><circle cx="6" cy="18.5" r="1.8"/><circle cx="17.5" cy="18.5" r="1.8"/>'),
    inventario: I('<path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5v-9Z"/><path d="M3.5 7.5 12 12l8.5-4.5M12 12v9"/>'),
    clientes: I('<circle cx="9" cy="8" r="3.4"/><path d="M2.8 20c.7-3.4 3.2-5.2 6.2-5.2s5.5 1.8 6.2 5.2"/><circle cx="17.2" cy="9.2" r="2.6"/><path d="M15.5 14.5c2.8.1 5 1.7 5.7 4.6"/>'),
    promos: I('<path d="M3 12V4h8l10 10-8 8L3 12Z"/><circle cx="8" cy="9" r="1.6"/>'),
    proveedores: I('<path d="M3 21V9l6 4V9l6 4V5h6v16H3Z"/><path d="M17 9h0M17 13h0M17 17h0"/>'),
    finanzas: I('<path d="M4 20V10M10 20V4M16 20v-8M21 20H3"/>'),
    calendario: I('<rect x="3.5" y="5" width="17" height="16" rx="3"/><path d="M8 3v4M16 3v4M3.5 10.5h17"/>'),
    ajustes: I('<circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M21.5 12h-3M5.5 12h-3M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1M18.7 18.7l-2.1-2.1M7.4 7.4 5.3 5.3"/>'),
    mas: I('<circle cx="5" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.6" fill="currentColor" stroke="none"/>'),
    plus: I('<path d="M12 5v14M5 12h14"/>'),
    buscar: I('<circle cx="11" cy="11" r="6.5"/><path d="m20 20-3.8-3.8"/>'),
    x: I('<path d="M6 6l12 12M18 6 6 18"/>'),
    chevR: I('<path d="m9 5 7 7-7 7"/>'),
    atras: I('<path d="M15 5l-7 7 7 7"/>'),
    wa: I('<path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.7-1.2A9 9 0 1 0 12 3Z"/><path d="M8.8 9.2c.3 2.6 3.4 5.7 6 6l1.4-1.4-2-1.3-1 .7c-.8-.4-1.9-1.5-2.3-2.3l.7-1-1.3-2-1.5 1.3Z"/>'),
    copiar: I('<rect x="9" y="9" width="12" height="12" rx="2.5"/><path d="M5 15H4a1.5 1.5 0 0 1-1.5-1.5v-9A1.5 1.5 0 0 1 4 3h9A1.5 1.5 0 0 1 14.5 4.5V5"/>'),
    editar: I('<path d="M4 20h4L20.5 7.5a2.1 2.1 0 0 0-3-3L5 17l-1 4Z"/><path d="m14.5 6 3 3"/>'),
    basura: I('<path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 14h9l1-14"/><path d="M10 11v6M14 11v6"/>'),
    camara: I('<path d="M4 8h3l2-2.5h6L17 8h3a1.5 1.5 0 0 1 1.5 1.5V19a1.5 1.5 0 0 1-1.5 1.5H4A1.5 1.5 0 0 1 2.5 19V9.5A1.5 1.5 0 0 1 4 8Z"/><circle cx="12" cy="13.7" r="3.6"/>'),
    sol: I('<circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2M12 19.5v2M21.5 12h-2M4.5 12h-2M18.9 5.1l-1.5 1.5M6.6 17.4l-1.5 1.5M18.9 18.9l-1.5-1.5M6.6 6.6 5.1 5.1"/>'),
    luna: I('<path d="M20.5 14.5A8.5 8.5 0 1 1 9.5 3.5a7 7 0 0 0 11 11Z"/>'),
    salir: I('<path d="M14 4h-9v16h9M10 12h11M18 8.5 21.5 12 18 15.5"/>'),
    check: I('<path d="m4.5 12.5 5 5L19.5 7"/>'),
    alerta: I('<path d="M12 3.5 22 20H2L12 3.5Z"/><path d="M12 10v4.5M12 17.5h0"/>'),
    estrella: I('<path d="m12 3 2.7 5.8 6.3.8-4.6 4.3 1.2 6.1L12 17l-5.6 3 1.2-6.1L3 9.6l6.3-.8L12 3Z"/>'),
    descargar: I('<path d="M12 3v11M7.5 10 12 14.5 16.5 10"/><path d="M4 17v3.5h16V17"/>'),
    subir: I('<path d="M12 14V3M7.5 7 12 2.5 16.5 7"/><path d="M4 17v3.5h16V17"/>'),
    mail: I('<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="m3.5 6.5 8.5 6 8.5-6"/>'),
    tel: I('<path d="M5 3.5h4L10.5 8 8.5 10a12 12 0 0 0 5.5 5.5l2-2 4.5 1.5v4a1.5 1.5 0 0 1-1.6 1.5C10.3 20 4 13.7 3.5 5.1A1.5 1.5 0 0 1 5 3.5Z"/>'),
    faceid: I('<path d="M3 8V5.5A2.5 2.5 0 0 1 5.5 3H8M16 3h2.5A2.5 2.5 0 0 1 21 5.5V8M21 16v2.5a2.5 2.5 0 0 1-2.5 2.5H16M8 21H5.5A2.5 2.5 0 0 1 3 18.5V16"/><path d="M8.5 9v1.5M15.5 9v1.5M12 9v4h-1M8.5 15.7a5 5 0 0 0 7 0"/>'),
    candado: I('<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>'),
    tasa: I('<path d="M4 17c3-1 4.5-7 7-7s3 5 6 5c1.5 0 2.5-1 3-2"/><path d="M4 21h16M4 3v18"/>'),
    guia: I('<rect x="4" y="3" width="16" height="18" rx="2.5"/><path d="M8 7.5h8M8 11.5h8M8 15.5h5"/>'),
    fiesta: I('<path d="m5 21 3.5-10L15 17.5 5 21Z"/><path d="M13 6.5c1-1.5 3-1.5 4 0M17.5 11c1.5-1 1.5-3 0-4M14.5 3.5 15 5M20 8.5l-1.5.5"/>'),
    ojo: I('<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3"/>')
  };
  App.icon = function (n) { return App.ICONS[n] || ""; };

  /* ---------- toasts ---------- */
  var toastStack = null;
  App.toast = function (msg, tipo) {
    if (!toastStack) {
      toastStack = document.createElement("div");
      toastStack.className = "toast-stack";
      document.body.appendChild(toastStack);
    }
    var t = document.createElement("div");
    t.className = "toast " + (tipo === "err" ? "err" : "ok");
    t.innerHTML = App.icon(tipo === "err" ? "alerta" : "check") + "<span>" + App.esc(msg) + "</span>";
    toastStack.appendChild(t);
    requestAnimationFrame(function () { requestAnimationFrame(function () { t.classList.add("show"); }); });
    setTimeout(function () {
      t.classList.remove("show");
      setTimeout(function () { t.remove(); }, 300);
    }, 2600);
  };

  /* ---------- sheet (móvil: bottom sheet con gesto / desktop: modal) ---------- */
  App.sheet = function (opts) {
    var bd = document.createElement("div");
    bd.className = "sheet-backdrop";
    bd.innerHTML =
      '<div class="sheet" role="dialog" aria-modal="true">' +
      '<div class="sheet-handle"></div>' +
      '<div class="sheet-head"><h2>' + App.esc(opts.titulo || "") + "</h2>" +
      '<button class="btn icon" data-cerrar aria-label="Cerrar">' + App.icon("x") + "</button></div>" +
      '<div class="sheet-body"></div>' +
      (opts.pie ? '<div class="sheet-foot"></div>' : "") +
      "</div>";
    var sheet = App.$(".sheet", bd);
    var body = App.$(".sheet-body", bd);
    var foot = App.$(".sheet-foot", bd);
    if (typeof opts.cuerpo === "string") body.innerHTML = opts.cuerpo;
    else if (opts.cuerpo) body.appendChild(opts.cuerpo);
    if (foot && typeof opts.pie === "string") foot.innerHTML = opts.pie;

    document.body.appendChild(bd);
    document.body.style.overflow = "hidden";
    requestAnimationFrame(function () { requestAnimationFrame(function () { bd.classList.add("open"); }); });

    var cerrado = false;
    function cerrar(res) {
      if (cerrado) return; cerrado = true;
      bd.classList.add("closing"); bd.classList.remove("open");
      document.body.style.overflow = "";
      setTimeout(function () { bd.remove(); }, 380);
      if (opts.alCerrar) opts.alCerrar(res);
    }
    bd.addEventListener("click", function (e) { if (e.target === bd) cerrar(); });
    /* iOS: evita que arrastrar sobre el fondo oscuro scrollee la página de atrás */
    bd.addEventListener("touchmove", function (e) { if (e.target === bd) e.preventDefault(); }, { passive: false });
    App.$("[data-cerrar]", bd).addEventListener("click", function () { cerrar(); });
    function onKey(e) { if (e.key === "Escape") { cerrar(); document.removeEventListener("keydown", onKey); } }
    document.addEventListener("keydown", onKey);

    /* gesto: arrastrar hacia abajo para cerrar (1:1 + velocidad) */
    (function () {
      var y0 = null, dy = 0, t0 = 0, historia = [];
      var zona = [App.$(".sheet-handle", bd), App.$(".sheet-head", bd)];
      zona.forEach(function (z) {
        if (!z) return;
        z.addEventListener("pointerdown", function (e) {
          if (window.innerWidth > 900) return;
          y0 = e.clientY; dy = 0; historia = [{ y: e.clientY, t: e.timeStamp }];
          sheet.style.transition = "none";
          z.setPointerCapture(e.pointerId);
        });
        z.addEventListener("pointermove", function (e) {
          if (y0 == null) return;
          dy = Math.max(0, e.clientY - y0);
          historia.push({ y: e.clientY, t: e.timeStamp });
          if (historia.length > 5) historia.shift();
          sheet.style.transform = "translateY(" + dy + "px)";
        });
        function fin(e) {
          if (y0 == null) return;
          var h0 = historia[0], h1 = historia[historia.length - 1];
          var v = h1.t > h0.t ? (h1.y - h0.y) / (h1.t - h0.t) : 0; // px/ms
          sheet.style.transition = "";
          if (dy > 130 || v > 0.55) { sheet.style.transform = ""; cerrar(); }
          else { sheet.style.transform = ""; }
          y0 = null;
        }
        z.addEventListener("pointerup", fin);
        z.addEventListener("pointercancel", fin);
      });
    })();

    return { el: bd, body: body, foot: foot, cerrar: cerrar };
  };

  App.confirmar = function (msg, opciones) {
    var op = opciones || {};
    return new Promise(function (resolve) {
      var s = App.sheet({
        titulo: op.titulo || "Confirmar",
        cuerpo: '<p style="font-size:14.5px">' + App.esc(msg) + "</p>",
        pie: '<button class="btn" data-no>Cancelar</button><button class="btn ' + (op.peligro ? "danger" : "primary") + '" data-si>' + App.esc(op.accion || "Confirmar") + "</button>",
        alCerrar: function (r) { resolve(r === true); }
      });
      App.$("[data-no]", s.foot).addEventListener("click", function () { s.cerrar(false); });
      App.$("[data-si]", s.foot).addEventListener("click", function () { s.cerrar(true); });
    });
  };

  /* ---------- portapapeles ---------- */
  App.copiar = function (texto, aviso) {
    function ok() { App.toast(aviso || "Copiado al portapapeles"); }
    function fallback() {
      var ta = document.createElement("textarea");
      ta.value = texto; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); ok(); } catch (e) { App.toast("No se pudo copiar", "err"); }
      ta.remove();
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(texto).then(ok, fallback);
    } else fallback();
  };

  /* ---------- teléfono / WhatsApp ---------- */
  App.telLimpio = function (tel) {
    var d = String(tel || "").replace(/\D/g, "");
    if (d.slice(0, 2) === "58") return d;
    if (d[0] === "0") return "58" + d.slice(1);
    return "58" + d;
  };
  App.waLink = function (tel, texto) {
    return "https://wa.me/" + App.telLimpio(tel) + (texto ? "?text=" + encodeURIComponent(texto) : "");
  };

  /* ---------- imágenes ---------- */
  App.comprimirImagen = function (file, maxLado) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      var url = URL.createObjectURL(file);
      img.onload = function () {
        var esc = Math.min(1, (maxLado || 900) / Math.max(img.width, img.height));
        var cv = document.createElement("canvas");
        cv.width = Math.round(img.width * esc);
        cv.height = Math.round(img.height * esc);
        cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
        URL.revokeObjectURL(url);
        resolve(cv.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error("Imagen inválida")); };
      img.src = url;
    });
  };

  /* ---------- descargas: respaldo JSON y CSV para Excel ---------- */
  App.descargarRespaldo = function () {
    var blob = new Blob([App.exportar()], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "respaldo-tiendas-" + App.hoyISO() + ".json";
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
    App.marcarRespaldo();
  };
  App.descargarCSV = function (nombre, filas) {
    // BOM + ";" para que Excel en español lo abra directo en columnas
    var csv = "﻿" + filas.map(function (fila) {
      return fila.map(function (c) {
        var s = String(c == null ? "" : c);
        return /[";\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
      }).join(";");
    }).join("\r\n");
    var blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = nombre + "-" + App.hoyISO() + ".csv";
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
  };

  /* ---------- escáner de códigos de barras ----------
     1) Pistola USB/Bluetooth: escribe como teclado — funciona YA en cualquier
        buscador con Enter (ver App.buscarPorCodigo).
     2) Cámara: BarcodeDetector nativo del navegador (gratis). Requiere HTTPS
        o localhost — plenamente operativo en la versión online. */
  App.buscarPorCodigo = function (txt) {
    var t = String(txt || "").trim();
    if (!t) return null;
    var tl = t.toLowerCase();
    return App.db.productos.filter(function (p) {
      return (p.codigoBarras && String(p.codigoBarras).trim() === t) ||
        (p.sku && p.sku.toLowerCase() === tl);
    })[0] || null;
  };
  App.escanear = function (alLeer) {
    if (!("BarcodeDetector" in window)) {
      App.toast("Este navegador no soporta cámara-escáner. Usa una pistola lectora (funciona ya) o escribe el código.", "err");
      return;
    }
    var stream = null, activo = true;
    var s = App.sheet({
      titulo: "📷 Escanear código",
      cuerpo: '<video id="esc-video" playsinline muted style="width:100%;max-height:320px;border-radius:14px;background:#000"></video>' +
        '<div class="chart-note">Apunta al código de barras. Si la cámara no abre aquí (requiere HTTPS), usa una pistola lectora USB/Bluetooth: escribe el código sola en el buscador.</div>',
      alCerrar: function () {
        activo = false;
        if (stream) stream.getTracks().forEach(function (t) { t.stop(); });
      }
    });
    var video = App.$("#esc-video", s.el);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      s.cerrar();
      App.toast("Sin acceso a cámara en este entorno — se activa en la versión online (HTTPS).", "err");
      return;
    }
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }).then(function (st) {
      stream = st;
      video.srcObject = st;
      video.play();
      var det = new BarcodeDetector({ formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39", "qr_code"] });
      (function loop() {
        if (!activo) return;
        det.detect(video).then(function (codes) {
          if (activo && codes && codes.length && codes[0].rawValue) {
            activo = false;
            if (stream) stream.getTracks().forEach(function (t) { t.stop(); });
            s.cerrar();
            alLeer(codes[0].rawValue);
            return;
          }
          requestAnimationFrame(loop);
        }).catch(function () { if (activo) requestAnimationFrame(loop); });
      })();
    }).catch(function () {
      s.cerrar();
      App.toast("La cámara no está disponible aquí (requiere HTTPS/versión online). La pistola lectora sí funciona ya.", "err");
    });
  };

  /* ---------- selects encadenados Estado → Ciudad (Venezuela) ---------- */
  App.geo = {
    html: function (pref, estadoVal, ciudadVal) {
      var estados = Object.keys(App.VZLA);
      var eSel = estados.filter(function (k) { return k.toLowerCase() === (estadoVal || "").toLowerCase(); })[0] || "";
      return '<div class="field"><label>Estado</label><select class="select" id="' + pref + '-estado"><option value="">Elegir…</option>' +
        estados.map(function (k) { return "<option" + (eSel === k ? " selected" : "") + ">" + k + "</option>"; }).join("") +
        "</select></div>" +
        '<div class="field"><label>Ciudad</label><span id="' + pref + '-ciudad-wrap">' + ciudadHtml(pref, eSel, ciudadVal) + "</span></div>";
    },
    wire: function (pref, root) {
      var selE = App.$("#" + pref + "-estado", root);
      if (!selE) return;
      selE.addEventListener("change", function () {
        App.$("#" + pref + "-ciudad-wrap", root).innerHTML = ciudadHtml(pref, selE.value, "");
        wireCiudad(pref, root);
      });
      wireCiudad(pref, root);
    },
    valor: function (pref, root) {
      var e = App.$("#" + pref + "-estado", root);
      var c = App.$("#" + pref + "-ciudad", root);
      return {
        estado: e ? e.value : "",
        ciudad: c ? (c.value === "__otra" ? "" : c.value.trim()) : ""
      };
    }
  };
  function ciudadHtml(pref, estado, ciudadVal) {
    var ciudades = App.VZLA[estado] || [];
    if (!ciudades.length || (ciudadVal && ciudades.indexOf(ciudadVal) < 0)) {
      return '<input class="input" id="' + pref + '-ciudad" value="' + App.esc(ciudadVal || "") + '" placeholder="Ciudad">';
    }
    return '<select class="select" id="' + pref + '-ciudad"><option value="">Elegir…</option>' +
      ciudades.map(function (c) { return "<option" + (ciudadVal === c ? " selected" : "") + ">" + App.esc(c) + "</option>"; }).join("") +
      '<option value="__otra">✏️ Otra…</option></select>';
  }
  function wireCiudad(pref, root) {
    var c = App.$("#" + pref + "-ciudad", root);
    if (c && c.tagName === "SELECT") {
      c.addEventListener("change", function () {
        if (c.value === "__otra") {
          App.$("#" + pref + "-ciudad-wrap", root).innerHTML = '<input class="input" id="' + pref + '-ciudad" placeholder="Escribe la ciudad">';
          var inp = App.$("#" + pref + "-ciudad", root);
          if (inp) inp.focus();
        }
      });
    }
  }

  /* ---------- plantilla WhatsApp de producto ---------- */
  App.textoProducto = function (p) {
    var t = App.tienda(p.tienda);
    var tallasCon = p.tallas && p.tallas.length
      ? p.tallas.filter(function (x) { return +x.stock > 0; }).map(function (x) { return x.talla; }).join(", ")
      : "";
    var txt = App.db.settings.plantillaWhatsApp || "";
    return txt
      .replace(/{{producto}}/g, p.nombre)
      .replace(/{{descripcion}}/g, p.descripcion || "")
      .replace(/{{precio_usd}}/g, nfUsd.format(p.precio))
      .replace(/{{precio_bs}}/g, nfBs.format(Math.round(App.calc.bsDe(p.precio))))
      .replace(/{{tallas_linea}}/g, tallasCon ? "📏 Tallas disponibles: " + tallasCon + "\n" : "")
      .replace(/{{tallas}}/g, tallasCon || "única")
      .replace(/{{tienda}}/g, t ? t.nombre : "")
      .replace(/{{categoria}}/g, p.categoria || "");
  };

  /* ============================================================
     GRÁFICAS SVG
     ============================================================ */
  var tip = null, chartSeq = 0;
  function tipEl() {
    if (!tip) { tip = document.createElement("div"); tip.className = "chart-tip"; document.body.appendChild(tip); }
    return tip;
  }
  function tipShow(html, x, y) {
    var el = tipEl();
    el.innerHTML = html;
    el.classList.add("show");
    var r = el.getBoundingClientRect();
    var px = Math.min(Math.max(8, x - r.width / 2), window.innerWidth - r.width - 8);
    var py = y - r.height - 14;
    if (py < 8) py = y + 18;
    el.style.left = px + "px";
    el.style.top = py + "px";
  }
  function tipHide() { if (tip) tip.classList.remove("show"); }
  document.addEventListener("scroll", tipHide, true);
  /* tooltip reutilizable fuera de las gráficas (p. ej. el mapa de Venezuela) */
  App.tipMostrar = tipShow;
  App.tipOcultar = tipHide;

  var redraws = [];
  App.chart = {};
  App.chart.limpiar = function () { redraws = []; tipHide(); };
  var resizeT = null;
  window.addEventListener("resize", function () {
    clearTimeout(resizeT);
    resizeT = setTimeout(function () { redraws.forEach(function (f) { f(); }); }, 180);
  });
  function registrar(f) { redraws.push(f); f(); }

  function cssVar(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }

  /* --- línea con área y glow --- */
  App.chart.linea = function (el, opts) {
    registrar(function () { dibujarLinea(el, opts); });
  };
  function dibujarLinea(el, opts) {
    var W = el.clientWidth || 320;
    var H = opts.alto || 190;
    var padL = 42, padR = 14, padT = 14, padB = 24;
    var series = opts.series.filter(function (s) { return s.puntos.length; });
    if (!series.length) { el.innerHTML = '<div class="empty"><p>Sin datos aún</p></div>'; return; }
    var n = series[0].puntos.length;
    var max = 0;
    series.forEach(function (s) { s.puntos.forEach(function (p) { if (p.y > max) max = p.y; }); });
    if (max <= 0) max = 10;
    max *= 1.12;
    var X = function (i) { return padL + (n === 1 ? 0.5 : i / (n - 1)) * (W - padL - padR); };
    var Y = function (v) { return padT + (1 - v / max) * (H - padT - padB); };

    var id = "ch" + (++chartSeq);
    var fmtV = opts.fmtV || App.fmt.usd0;
    var svg = '<svg viewBox="0 0 ' + W + " " + H + '" width="' + W + '" height="' + H + '">';
    svg += "<defs>";
    series.forEach(function (s, si) {
      svg += '<linearGradient id="' + id + "g" + si + '" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" stop-color="' + s.color + '" stop-opacity="0.22"/>' +
        '<stop offset="1" stop-color="' + s.color + '" stop-opacity="0"/></linearGradient>';
    });
    svg += '<filter id="' + id + 'glow" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="3.2"/></filter>';
    svg += "</defs>";

    // grid horizontal (3 líneas) + etiquetas
    var ink3 = "var(--ink-3)";
    for (var gi = 0; gi <= 3; gi++) {
      var gv = max * gi / 3;
      var gy = Y(gv);
      svg += '<line x1="' + padL + '" y1="' + gy + '" x2="' + (W - padR) + '" y2="' + gy + '" stroke="currentColor" stroke-opacity="0.07"/>';
      svg += '<text x="' + (padL - 7) + '" y="' + (gy + 3.5) + '" text-anchor="end" font-size="10.5" fill="' + ink3 + '">' + fmtV(gv) + "</text>";
    }
    // etiquetas X (cada ~n/6)
    var paso = Math.max(1, Math.ceil(n / 6));
    for (var xi = 0; xi < n; xi += paso) {
      svg += '<text x="' + X(xi) + '" y="' + (H - 7) + '" text-anchor="middle" font-size="10.5" fill="' + ink3 + '">' + App.esc(series[0].puntos[xi].label) + "</text>";
    }

    series.forEach(function (s, si) {
      var pts = s.puntos.map(function (p, i) { return [X(i), Y(p.y)]; });
      var d = suave(pts);
      var area = d + " L" + pts[pts.length - 1][0].toFixed(1) + "," + Y(0).toFixed(1) + " L" + pts[0][0].toFixed(1) + "," + Y(0).toFixed(1) + " Z";
      svg += '<path d="' + area + '" fill="url(#' + id + "g" + si + ')"/>';
      svg += '<path d="' + d + '" fill="none" stroke="' + s.color + '" stroke-width="2.6" stroke-opacity="0.5" filter="url(#' + id + 'glow)"/>';
      svg += '<path d="' + d + '" fill="none" stroke="' + s.color + '" stroke-width="2" stroke-linecap="round"/>';
    });
    svg += '<circle class="hoverDot" r="4.5" fill="var(--card-solid)" stroke-width="2.5" style="display:none"/>';
    svg += '<rect class="hitzone" x="' + padL + '" y="0" width="' + (W - padL - padR) + '" height="' + H + '" fill="transparent"/>';
    svg += "</svg>";
    el.innerHTML = svg;

    // interacción: punto más cercano
    var svgEl = el.firstChild;
    var dot = App.$(".hoverDot", svgEl);
    var zona = App.$(".hitzone", svgEl);
    function mover(e) {
      var r = svgEl.getBoundingClientRect();
      var px = (e.clientX - r.left) * (W / r.width);
      var i = Math.round((px - padL) / ((W - padL - padR) / Math.max(1, n - 1)));
      i = Math.max(0, Math.min(n - 1, i));
      var html = '<div class="tip-title">' + App.esc(series[0].puntos[i].labelLargo || series[0].puntos[i].label) + "</div>";
      series.forEach(function (s) {
        html += '<div class="tip-row"><span class="legend-dot" style="background:' + s.color + '"></span>' +
          App.esc(s.nombre) + "<b>" + fmtV(s.puntos[i].y) + "</b></div>";
      });
      var s0 = series[0];
      dot.style.display = "";
      dot.setAttribute("cx", X(i));
      dot.setAttribute("cy", Y(s0.puntos[i].y));
      dot.setAttribute("stroke", s0.color);
      tipShow(html, r.left + X(i) * (r.width / W), r.top + Y(s0.puntos[i].y) * (r.height / H));
    }
    zona.addEventListener("pointermove", mover);
    zona.addEventListener("pointerdown", mover);
    zona.addEventListener("pointerleave", function () { dot.style.display = "none"; tipHide(); });
  }
  function suave(pts) {
    if (pts.length < 3) {
      return "M" + pts.map(function (p) { return p[0].toFixed(1) + "," + p[1].toFixed(1); }).join(" L");
    }
    var d = "M" + pts[0][0].toFixed(1) + "," + pts[0][1].toFixed(1);
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
      var c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
      var c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += "C" + c1x.toFixed(1) + "," + c1y.toFixed(1) + " " + c2x.toFixed(1) + "," + c2y.toFixed(1) + " " + p2[0].toFixed(1) + "," + p2[1].toFixed(1);
    }
    return d;
  }

  /* --- barras verticales --- */
  App.chart.barras = function (el, opts) {
    registrar(function () { dibujarBarras(el, opts); });
  };
  function dibujarBarras(el, opts) {
    var W = el.clientWidth || 320;
    var H = opts.alto || 180;
    var padL = 10, padR = 10, padT = 20, padB = 24;
    var data = opts.data;
    if (!data.length) { el.innerHTML = '<div class="empty"><p>Sin datos aún</p></div>'; return; }
    var max = Math.max.apply(null, data.map(function (d) { return d.valor; }));
    if (max <= 0) max = 10;
    max *= 1.1;
    var bw = (W - padL - padR) / data.length;
    var barW = Math.min(46, bw * 0.62);
    var fmtV = opts.fmtV || App.fmt.usd0;
    var svg = '<svg viewBox="0 0 ' + W + " " + H + '" width="' + W + '" height="' + H + '">';
    var base = H - padB;
    svg += '<line x1="' + padL + '" y1="' + base + '" x2="' + (W - padR) + '" y2="' + base + '" stroke="currentColor" stroke-opacity="0.12"/>';
    data.forEach(function (d, i) {
      var cx = padL + bw * i + bw / 2;
      var h = Math.max(5, (d.valor / max) * (base - padT));
      var y = base - h;
      svg += '<path class="barra" data-i="' + i + '" d="M' + (cx - barW / 2) + "," + base +
        " v-" + (h - 4).toFixed(1) + " q0,-4 4,-4 h" + (barW - 8).toFixed(1) + " q4,0 4,4 v" + (h - 4).toFixed(1) +
        ' Z" fill="' + d.color + '"/>';
      if (data.length <= 8 && bw >= 48) {
        svg += '<text x="' + cx + '" y="' + (y - 6) + '" text-anchor="middle" font-size="10.5" font-weight="700" fill="var(--ink-2)">' + fmtV(d.valor) + "</text>";
      }
      svg += '<text x="' + cx + '" y="' + (H - 7) + '" text-anchor="middle" font-size="10.5" fill="var(--ink-3)">' + App.esc(d.label) + "</text>";
    });
    svg += "</svg>";
    el.innerHTML = svg;
    App.$$(".barra", el).forEach(function (b) {
      function m(e) {
        var d = data[+b.dataset.i];
        tipShow('<div class="tip-row"><span class="legend-dot" style="background:' + d.color + '"></span>' + App.esc(d.label) + "<b>" + fmtV(d.valor) + "</b></div>", e.clientX, e.clientY);
      }
      b.addEventListener("pointermove", m);
      b.addEventListener("pointerdown", m);
      b.addEventListener("pointerleave", tipHide);
      if (opts.alClick) {
        b.style.cursor = "pointer";
        b.addEventListener("click", function () { tipHide(); opts.alClick(data[+b.dataset.i], +b.dataset.i); });
      }
    });
  }

  /* --- dona --- */
  App.chart.dona = function (el, opts) {
    registrar(function () { dibujarDona(el, opts); });
  };
  function dibujarDona(el, opts) {
    var data = opts.data.filter(function (d) { return d.valor > 0; });
    var total = data.reduce(function (s, d) { return s + d.valor; }, 0);
    var fmtV = opts.fmtV || App.fmt.usd0;
    if (!total) { el.innerHTML = '<div class="empty"><p>Sin datos aún</p></div>'; return; }
    var S = 200, cx = 100, cy = 100, r = 78, grosor = 25;
    var gapDeg = data.length > 1 ? 2.4 : 0;
    var svg = '<svg viewBox="0 0 ' + S + " " + S + '" style="max-width:230px;margin:0 auto">';
    var ang = -90;
    if (data.length === 1) {
      // un solo segmento: un arco de 360° no se dibuja — usar círculo completo
      svg += '<circle class="seg" data-i="0" cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="' + data[0].color + '" stroke-width="' + grosor + '"/>';
    } else data.forEach(function (d, i) {
      var span = (d.valor / total) * 360 - gapDeg;
      if (span <= 0) span = 0.5;
      var a1 = ang + gapDeg / 2, a2 = a1 + span;
      var x1 = cx + r * Math.cos(a1 * Math.PI / 180), y1 = cy + r * Math.sin(a1 * Math.PI / 180);
      var x2 = cx + r * Math.cos(a2 * Math.PI / 180), y2 = cy + r * Math.sin(a2 * Math.PI / 180);
      var largo = span > 180 ? 1 : 0;
      svg += '<path class="seg" data-i="' + i + '" d="M' + x1.toFixed(2) + "," + y1.toFixed(2) +
        " A" + r + "," + r + " 0 " + largo + " 1 " + x2.toFixed(2) + "," + y2.toFixed(2) +
        '" fill="none" stroke="' + d.color + '" stroke-width="' + grosor + '"/>';
      ang += (d.valor / total) * 360;
    });
    svg += '<text x="' + cx + '" y="' + (cy - 4) + '" text-anchor="middle" font-size="21" font-weight="800" fill="var(--ink-1)" style="font-variant-numeric:tabular-nums">' + fmtV(total) + "</text>";
    svg += '<text x="' + cx + '" y="' + (cy + 15) + '" text-anchor="middle" font-size="10.5" fill="var(--ink-3)">' + App.esc(opts.centro || "Total") + "</text>";
    svg += "</svg>";
    var leyenda = '<div class="legend">';
    data.forEach(function (d) {
      leyenda += '<span class="legend-item"><span class="legend-dot" style="background:' + d.color + '"></span>' +
        App.esc(d.label) + ' <span class="val">' + fmtV(d.valor) + "</span> · " + Math.round(d.valor / total * 100) + "%</span>";
    });
    leyenda += "</div>";
    el.innerHTML = svg + leyenda;
    App.$$(".seg", el).forEach(function (seg) {
      function m(e) {
        var d = data[+seg.dataset.i];
        tipShow('<div class="tip-row"><span class="legend-dot" style="background:' + d.color + '"></span>' + App.esc(d.label) + "<b>" + fmtV(d.valor) + "</b></div>", e.clientX, e.clientY);
      }
      seg.addEventListener("pointermove", m);
      seg.addEventListener("pointerdown", m);
      seg.addEventListener("pointerleave", tipHide);
      if (opts.alClick) {
        seg.style.cursor = "pointer";
        seg.addEventListener("click", function () { tipHide(); opts.alClick(data[+seg.dataset.i], +seg.dataset.i); });
      }
    });
  }

  /* --- sparkline (KPI) --- */
  App.chart.spark = function (puntos, color, w, h) {
    w = w || 74; h = h || 26;
    if (!puntos.length) return "";
    var max = Math.max.apply(null, puntos), min = Math.min.apply(null, puntos);
    if (max === min) max = min + 1;
    var pts = puntos.map(function (v, i) {
      return [(i / (puntos.length - 1)) * (w - 4) + 2, h - 3 - ((v - min) / (max - min)) * (h - 6)];
    });
    return '<svg viewBox="0 0 ' + w + " " + h + '" width="' + w + '" height="' + h + '"><path d="' + suave(pts) + '" fill="none" stroke="' + color + '" stroke-width="1.6" stroke-linecap="round" opacity="0.85"/></svg>';
  };

  /* --- barras horizontales (top productos) --- */
  App.hbars = function (items, opts) {
    var o = opts || {};
    var max = Math.max.apply(null, items.map(function (x) { return x.valor; }).concat([1]));
    var fmtV = o.fmtV || App.fmt.usd0;
    return items.map(function (x) {
      return '<div class="hbar-row">' +
        '<span class="hbar-label">' + App.esc(x.label) + "</span>" +
        '<span class="hbar-track"><span class="hbar-fill" style="width:' + Math.max(3, x.valor / max * 100) + "%;background:" + (x.color || "var(--c1)") + '"></span></span>' +
        '<span class="hbar-val num">' + fmtV(x.valor) + "</span></div>";
    }).join("");
  };

  /* ---------- píldoras de apoyo ---------- */
  App.pillTienda = function (tiendaId) {
    var t = App.tienda(tiendaId);
    if (!t) return "";
    return '<span class="pill brand-' + t.id + '">' + t.emoji + " " + App.esc(t.corto) + "</span>";
  };
  App.deltaPill = function (pct) {
    if (pct == null) return '<span class="stat-delta flat">—</span>';
    var cls = pct > 0.5 ? "up" : (pct < -0.5 ? "down" : "flat");
    var flecha = pct > 0.5 ? "▲" : (pct < -0.5 ? "▼" : "•");
    return '<span class="stat-delta ' + cls + '">' + flecha + " " + App.fmt.num(Math.abs(pct)) + "%</span>";
  };

  /* ---------- dropdown bonito para <select class="select"> ----------
     El popup nativo no se estiliza con CSS, así que lo interceptamos y
     mostramos un panel glass propio. El <select> sigue siendo la fuente
     de verdad: al elegir se le asigna el valor y se dispara "change". */
  var ddPanel = null, ddSelect = null;
  function cerrarDD() {
    if (ddPanel) { ddPanel.remove(); ddPanel = null; ddSelect = null; }
  }
  function abrirDD(sel) {
    ddSelect = sel;
    var r = sel.getBoundingClientRect();
    ddPanel = document.createElement("div");
    ddPanel.className = "dd-panel";
    var html = "";
    Array.prototype.forEach.call(sel.options, function (op, i) {
      html += '<button type="button" class="dd-opt' + (i === sel.selectedIndex ? " active" : "") + '" data-i="' + i + '">' +
        "<span>" + App.esc(op.textContent) + "</span>" + (i === sel.selectedIndex ? App.icon("check") : "") + "</button>";
    });
    ddPanel.innerHTML = html;
    document.body.appendChild(ddPanel);
    var w = Math.max(r.width, 180);
    ddPanel.style.width = w + "px";
    ddPanel.style.left = Math.max(8, Math.min(r.left, window.innerWidth - w - 8)) + "px";
    var h = ddPanel.offsetHeight;
    /* iOS: con teclado abierto innerHeight no cambia — usar visualViewport y dejar margen del home indicator */
    var vpH = window.visualViewport ? window.visualViewport.height + window.visualViewport.offsetTop : window.innerHeight;
    var abajo = r.bottom + 6 + h <= vpH - 42;
    ddPanel.style.top = (abajo ? r.bottom + 6 : Math.max(8, r.top - 6 - h)) + "px";
    ddPanel.style.transformOrigin = abajo ? "top center" : "bottom center";
    requestAnimationFrame(function () { if (ddPanel) ddPanel.classList.add("open"); });
    ddPanel.addEventListener("click", function (e) {
      var b = e.target.closest(".dd-opt");
      if (!b) return;
      sel.selectedIndex = +b.dataset.i;
      sel.dispatchEvent(new Event("change", { bubbles: true }));
      cerrarDD();
    });
  }
  document.addEventListener("mousedown", function (e) {
    var sel = e.target.closest ? e.target.closest("select.select") : null;
    if (sel) {
      e.preventDefault();
      if (ddSelect === sel) { cerrarDD(); return; }
      cerrarDD();
      abrirDD(sel);
    } else if (ddPanel && !e.target.closest(".dd-panel")) {
      cerrarDD();
    }
  }, true);
  document.addEventListener("click", function (e) {
    var sel = e.target.closest ? e.target.closest("select.select") : null;
    if (sel) {
      e.preventDefault();
      if (!ddPanel) abrirDD(sel); // iOS: el picker abre en click, no en mousedown
    }
  }, true);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") cerrarDD(); });
  window.addEventListener("resize", cerrarDD);
  document.addEventListener("scroll", function (e) {
    if (ddPanel && !(e.target.closest && e.target.closest(".dd-panel"))) cerrarDD();
  }, true);
})();

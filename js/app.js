/* ============================================================
   app.js — router hash, shell (sidebar/dock/FAB), tema e inicio
   ============================================================ */
window.App = window.App || {};

(function () {
  "use strict";

  var MODS = [];
  var rutaActual = "dashboard";

  function modulos() {
    if (!MODS.length) {
      MODS = [App.modDashboard, App.modVentas, App.modEnvios, App.modInventario, App.modClientes,
        App.modPromos, App.modProveedores, App.modFinanzas, App.modCalendario, App.modAjustes];
    }
    return MODS;
  }
  function modulo(id) {
    return modulos().filter(function (m) { return m.id === id; })[0] || null;
  }
  function visibles() {
    return modulos().filter(function (m) { return App.auth.puede(m.id); });
  }

  /* ---------- tema ---------- */
  var mediaOscuro = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
  function aplicarTema() {
    var pref = localStorage.getItem("ljt_tema") || "sistema";
    var oscuro = pref === "oscuro" || (pref === "sistema" && mediaOscuro && mediaOscuro.matches);
    document.documentElement.setAttribute("data-theme", oscuro ? "dark" : "light");
    var meta = App.$("meta[name=theme-color]");
    if (meta) meta.setAttribute("content", oscuro ? "#0d0e12" : "#f2f3f8");
  }
  App.setTema = function (pref) {
    localStorage.setItem("ljt_tema", pref);
    aplicarTema();
    App.toast("Tema: " + (pref === "sistema" ? "según el sistema" : pref));
  };
  if (mediaOscuro && mediaOscuro.addEventListener) mediaOscuro.addEventListener("change", aplicarTema);

  /* ---------- shell ---------- */
  App.montarShell = function () {
    var u = App.auth.user;
    var vis = visibles();

    /* sidebar */
    var side = App.$("#sidebar");
    side.innerHTML =
      '<div class="logo-row"><div class="logo-mark">🧸</div><div><div class="logo-name">La Teacher · En Vzla</div>' +
      '<div class="logo-sub">Sistema de gestión</div></div></div>' +
      '<button class="rate-pill" id="side-tasa" title="Tasa de cobro del día"><span class="flag">💱</span> €1 = <b>' +
      App.fmt.num(App.db.settings.tasas.eur) + " Bs</b></button>" +
      (App.MODO_NUBE ? '<div class="small muted" data-sync-estado style="padding:0 8px">' + etiquetaSync() + "</div>" : "") +
      '<nav class="side-nav">' + vis.map(function (m) {
        return '<a class="side-item" data-nav="' + m.id + '" href="#/' + m.id + '">' + App.icon(m.icono) + "<span>" + m.titulo + "</span></a>";
      }).join("") + "</nav>" +
      '<div class="side-user"><div class="avatar">' + (u.emoji || App.iniciales(u.nombre)) + "</div>" +
      '<div style="flex:1;min-width:0"><div class="side-user-name">' + App.esc(u.nombre) + "</div>" +
      '<div class="side-user-rol">' + (u.rol === "super" ? "Súper usuario" : "Vendedor") + "</div></div>" +
      '<button class="btn icon" id="side-tema" title="Tema">' + App.icon(document.documentElement.getAttribute("data-theme") === "dark" ? "sol" : "luna") + "</button>" +
      '<button class="btn icon" id="side-salir" title="Cerrar sesión">' + App.icon("salir") + "</button></div>";

    App.$("#side-tasa").addEventListener("click", function () { location.hash = "#/finanzas"; });
    App.$("#side-salir").addEventListener("click", App.auth.logout);
    App.$("#side-tema").addEventListener("click", function () {
      var esOscuro = document.documentElement.getAttribute("data-theme") === "dark";
      App.setTema(esOscuro ? "claro" : "oscuro");
      App.montarShell();
    });

    /* dock móvil */
    var dockIds = ["dashboard", "ventas", "envios"].filter(function (id) { return App.auth.puede(id); });
    while (dockIds.length < 3) dockIds.push(vis[dockIds.length] ? vis[dockIds.length].id : "dashboard");
    var dock = App.$("#dock");
    dock.innerHTML =
      dockItem(modulo(dockIds[0])) +
      dockItem(modulo(dockIds[1])) +
      '<button class="fab" id="fab" aria-label="Nueva venta">' + App.icon("plus") + "</button>" +
      dockItem(modulo(dockIds[2])) +
      '<button class="dock-item" id="dock-mas">' + App.icon("mas") + "<span>Más</span></button>";

    App.$("#fab").addEventListener("click", function () {
      if (App.auth.puede("ventas")) App.modVentas.nueva();
      else App.toast("No tienes permiso para registrar ventas", "err");
    });
    App.$("#dock-mas").addEventListener("click", abrirMas);
    App.$$("[data-nav]", dock).forEach(function (a) {
      a.addEventListener("click", function () { });
    });
    marcarActivos();
  };

  function dockItem(m) {
    if (!m) return "<span></span>";
    return '<a class="dock-item" data-nav="' + m.id + '" href="#/' + m.id + '">' + App.icon(m.icono) + "<span>" + m.titulo + "</span></a>";
  }

  /* etiqueta del indicador ☁️ según el estado real (no siempre "Sincronizado") */
  function etiquetaSync() {
    var e = App.estadoSyncActual ? App.estadoSyncActual() : "ok";
    return e === "offline" ? "⚠️ Sin conexión — cambios en cola"
      : e === "sync" ? "☁️ Sincronizando…"
        : "☁️ Sincronizado";
  }

  function abrirMas() {
    var u = App.auth.user;
    var enDock = ["dashboard", "ventas", "envios"];
    var resto = visibles().filter(function (m) { return enDock.indexOf(m.id) < 0; });
    var esOscuro = document.documentElement.getAttribute("data-theme") === "dark";

    var cuerpo = '<div class="row-item static"><div class="avatar">' + (u.emoji || App.iniciales(u.nombre)) + "</div>" +
      '<div class="row-main"><div class="row-title">' + App.esc(u.nombre) + '</div><div class="row-sub">' +
      (u.rol === "super" ? "Súper usuario" : "Vendedor") + "</div></div>" +
      '<button class="rate-pill" data-mas-tasa>💱 €1 = <b>' + App.fmt.num(App.db.settings.tasas.eur) + " Bs</b></button></div>" +
      (App.MODO_NUBE ? '<div class="small muted" data-sync-estado style="padding:2px 4px 6px">' + etiquetaSync() + "</div>" : "") +
      '<div class="list">' + resto.map(function (m) {
        return '<a class="row-item" data-mas-ir="' + m.id + '" href="#/' + m.id + '"><div class="thumb">' + App.icon(m.icono) + "</div>" +
          '<div class="row-main"><div class="row-title">' + m.titulo + "</div></div>" + App.icon("chevR") + "</a>";
      }).join("") + "</div>" +
      '<div class="flex" style="gap:8px;margin-top:6px">' +
      '<button class="btn" data-mas-tema style="flex:1">' + App.icon(esOscuro ? "sol" : "luna") + " Tema " + (esOscuro ? "claro" : "oscuro") + "</button>" +
      '<button class="btn danger" data-mas-salir style="flex:1">' + App.icon("salir") + " Salir</button></div>";

    var s = App.sheet({ titulo: "Más", cuerpo: cuerpo });
    /* los enlaces navegan y rutear() cierra el sheet — cerrarlo aquí haría history.back()
       en plena navegación y podría comerse el destino */
    var bt = App.$("[data-mas-tasa]", s.el);
    if (bt) bt.addEventListener("click", function () {
      if (App.auth.puede("finanzas")) location.hash = "#/finanzas";
      else s.cerrar();
    });
    App.$("[data-mas-tema]", s.el).addEventListener("click", function () {
      App.setTema(esOscuro ? "claro" : "oscuro");
      App.montarShell(); s.cerrar();
    });
    App.$("[data-mas-salir]", s.el).addEventListener("click", App.auth.logout);
  }

  function marcarActivos() {
    App.$$("[data-nav]").forEach(function (a) {
      a.classList.toggle("active", a.dataset.nav === rutaActual);
    });
  }

  /* ---------- router ---------- */
  function rutear() {
    if (App.cerrarSheets) App.cerrarSheets(); // navegar cierra cualquier sheet abierto
    var id = (location.hash || "#/dashboard").replace(/^#\//, "") || "dashboard";
    var m = modulo(id);
    if (!m || !App.auth.puede(id)) {
      if (id !== "dashboard") { location.hash = "#/dashboard"; return; }
      m = App.modDashboard;
    }
    rutaActual = m.id;
    App.chart.limpiar();
    // reemplazar el nodo de la vista mata los listeners delegados del módulo
    // anterior; si no, se acumulan y un click abre N sheets apilados
    var viejo = App.$("#view");
    var view = document.createElement("div");
    view.id = "view";
    viejo.replaceWith(view);
    m.render(view);
    marcarActivos();
    window.scrollTo(0, 0);
  }
  App.render = function () { rutear(); };

  /* ---------- recordatorios (retiros con hora, pedidos varados) ---------- */
  function notificar(titulo, cuerpo, key) {
    var hoy = App.hoyISO();
    var avisos = {};
    try { avisos = JSON.parse(localStorage.getItem("ljt_avisos") || "{}"); } catch (e) { }
    if (avisos.dia !== hoy) avisos = { dia: hoy }; // se limpian cada día
    if (avisos[key]) return;
    avisos[key] = 1;
    localStorage.setItem("ljt_avisos", JSON.stringify(avisos));
    if (window.Notification && Notification.permission === "granted") {
      try { new Notification(titulo, { body: cuerpo }); } catch (e2) { }
    }
    App.toast(titulo + " — " + cuerpo);
  }
  function chequearRecordatorios() {
    if (!App.auth.user) return;
    var hoy = App.hoyISO();
    App.calc.retirosPendientes().forEach(function (v) {
      var e = v.entrega;
      if (e.fechaRetiro !== hoy || !e.horaRetiro) return;
      var hm = e.horaRetiro.split(":");
      var ahora = new Date();
      var mins = (+hm[0] * 60 + (+hm[1] || 0)) - (ahora.getHours() * 60 + ahora.getMinutes());
      if (mins > 0 && mins <= 60) {
        var cli = App.cliente(v.clienteId);
        notificar("🏪 Retiro a las " + e.horaRetiro,
          (cli ? cli.nombre : "Un cliente") + " pasa en " + mins + " min — ten listo el pedido", "ret-" + v.id);
      }
    });
    App.calc.porLlevar().forEach(function (v) {
      if (v.fecha.slice(0, 10) < hoy) {
        var cli2 = App.cliente(v.clienteId);
        notificar("🚚 Pedido por llevar",
          "El de " + (cli2 ? cli2.nombre : "un cliente") + " sigue sin salir — llévalo a la agencia", "llevar-" + v.id);
      }
    });
  }
  App.pedirPermisoNotif = function () {
    if (!window.Notification) { App.toast("Este navegador no soporta notificaciones", "err"); return; }
    Notification.requestPermission().then(function (p) {
      if (p === "granted") App.toast("Notificaciones del navegador activadas 🔔");
      else App.toast("Permiso no concedido — seguirás viendo avisos dentro de la app", "err");
    });
  };

  App.iniciarApp = function () {
    App.$("#login-root").classList.add("hidden");
    App.$("#app").classList.remove("hidden");
    App.$("#dock").classList.remove("hidden");
    App.montarShell();
    if (!location.hash) location.hash = "#/dashboard";
    rutear();

    /* tasa BCV: si la de hoy no está, intenta buscarla sola (best effort) */
    if (App.db.settings.tasas.fecha < App.hoyISO()) {
      App.actualizarTasas().then(function (r) {
        if (r.usd || r.eur) {
          App.toast("Tasa BCV actualizada: € " + App.fmt.num(App.db.settings.tasas.eur) + " Bs");
          App.montarShell();
          App.render();
        }
      });
    }
    chequearRecordatorios();
    setInterval(chequearRecordatorios, 60000);
  };

  /* ---------- arranque ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    App.load();
    aplicarTema();
    /* PWA: solo con HTTPS (versión online) — permite instalarla como app */
    if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
      navigator.serviceWorker.register("sw.js").catch(function () { });
    }
    window.addEventListener("hashchange", rutear);

    /* modo nube: la sesión vive en Supabase Auth (asíncrono) */
    if (App.MODO_NUBE) {
      App.sb.auth.onAuthStateChange(function (evento) {
        if (evento === "PASSWORD_RECOVERY" && App.mostrarNuevaClave) App.mostrarNuevaClave();
      });
      App.sb.auth.getSession().then(function (r) {
        var ses = r.data ? r.data.session : null;
        if (!ses) { App.renderLogin(); return; }
        function splash() {
          var root = App.$("#login-root");
          root.className = "login-screen";
          root.classList.remove("hidden");
          root.innerHTML = '<div class="login-card view"><div class="logo-mark">☁️</div>' +
            '<div class="login-title">Cargando tus datos…</div>' +
            '<div class="login-sub">Un momento</div></div>';
        }
        function arrancar() {
          splash();
          App.iniciarNube(ses).then(function () { App.iniciarApp(); }, function (e2) {
            /* sin conexión pero con caché local: se puede trabajar igual (los cambios quedan en cola) */
            var uid = ses.user.id;
            var perfil = (App.db.usuarios || []).filter(function (u) { return u.id === uid; })[0];
            if (!(e2 && e2.sinPerfil) && perfil) {
              App.auth.user = perfil;
              App.auth.user.email = ses.user.email || "";
              App.iniciarApp();
              App.toast("Sin conexión — estás viendo la última copia guardada en este equipo");
              return;
            }
            App.toast(e2 && e2.sinPerfil ? e2.message : "No se pudo conectar con el servidor — revisa tu internet y recarga", "err");
            App.renderLogin();
          });
        }
        function conBio() {
          if (App.bioActivo && App.bioActivo()) App.renderBloqueo(arrancar);
          else arrancar();
        }
        /* si el 2FA está activado, también protege el arranque con sesión guardada */
        splash();
        App.verificar2FASiHaceFalta(conBio, function () {
          App.sb.auth.signOut().then(function () { App.renderLogin(); });
        });
      });
      return;
    }

    if (App.auth.sesionActiva()) App.iniciarApp();
    else App.renderLogin();
  });
})();

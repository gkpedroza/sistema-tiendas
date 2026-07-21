/* ============================================================
   ajustes.js — perfil, seguridad, usuarios/permisos, tiendas,
   plantilla WhatsApp, listas, apariencia y respaldo de datos
   ============================================================ */
window.App = window.App || {};

(function () {
  "use strict";

  var MODULOS_PERMISO = [
    ["dashboard", "Inicio"], ["ventas", "Ventas"], ["envios", "Envíos"], ["inventario", "Inventario"],
    ["clientes", "Clientes"], ["promos", "Promos"], ["proveedores", "Proveedores"],
    ["finanzas", "Finanzas"], ["calendario", "Calendario"], ["ajustes", "Ajustes"]
  ];

  App.modAjustes = {
    id: "ajustes", titulo: "Ajustes", icono: "ajustes",
    render: function (el) {
      var u = App.auth.user;
      var esSuper = App.auth.esSuper();
      var s = App.db.settings;

      var html = '<div class="view"><h1 style="margin-bottom:12px">⚙️ Ajustes</h1>';

      /* perfil */
      html += '<div class="card"><div class="card-head"><h2>👤 Tu perfil</h2><span class="pill tint">' + (u.rol === "super" ? "Súper usuario" : "Vendedor") + "</span></div>" +
        '<div class="form-grid">' +
        '<div class="field"><label>Nombre</label><input class="input" id="aj-nombre" value="' + App.esc(u.nombre) + '"></div>' +
        '<div class="field"><label>Emoji</label><input class="input" id="aj-emoji" value="' + App.esc(u.emoji || "👑") + '" maxlength="4"></div>' +
        '<div class="field"><label>Email</label><input class="input" id="aj-email" type="email" value="' + App.esc(u.email || "") + '"' + (App.MODO_NUBE ? " disabled" : "") + "></div>" +
        '<div class="field"><label>Nueva contraseña</label><input class="input" id="aj-clave" type="password" placeholder="(sin cambios)"></div>' +
        "</div>" +
        '<button class="btn primary" id="aj-guardar-perfil" style="margin-top:10px">Guardar perfil</button></div>';

      /* seguridad */
      html += '<div class="card section-gap"><div class="card-head"><h2>🔐 Seguridad</h2></div><div class="list">' +
        (App.MODO_NUBE
          ? '<div class="row-item static"><div class="thumb">☁️</div><div class="row-main"><div class="row-title">Login real con servidor</div>' +
          '<div class="row-sub">Cuentas y contraseñas protegidas en Supabase · 2FA TOTP llega en la fase 2.2</div></div><span class="pill ok">✓</span></div>'
          : '<div class="row-item static"><div class="thumb">🔐</div><div class="row-main"><div class="row-title">Verificación en dos pasos</div>' +
          '<div class="row-sub">Activada (demo: código 246810)</div></div><span class="pill ok">✓</span></div>') +
        (esSuper ? '<div class="row-item static"><div class="thumb">🔒</div><div class="row-main"><div class="row-title">Candado de precios</div>' +
          '<div class="row-sub">Los vendedores no pueden modificar precios al vender (tú sí)</div></div>' +
          '<span class="switch"><input type="checkbox" id="aj-lock-precio"' + (s.bloquearPrecioVendedor !== false ? " checked" : "") + "><i></i></span></div>" : "") +
        '<div class="row-item static"><div class="thumb">👤</div><div class="row-main"><div class="row-title">Face ID / huella</div>' +
        '<div class="row-sub">Disponible en la versión online (passkeys)</div></div><span class="pill">Fase 2</span></div>' +
        "</div>" +
        '<div class="flex" style="gap:8px;margin-top:10px">' +
        (App.MODO_NUBE ? "" : '<button class="btn sm ghost" id="aj-reset2fa">Restablecer 2FA</button>') +
        '<button class="btn sm danger" id="aj-logout">' + App.icon("salir") + " Cerrar sesión</button></div></div>";

      /* recordatorios / notificaciones */
      var notifOn = window.Notification && Notification.permission === "granted";
      html += '<div class="card section-gap"><div class="card-head"><h2>🔔 Recordatorios</h2>' +
        (notifOn ? '<span class="pill ok">activados</span>' : "") + "</div>" +
        '<p class="small muted">Te aviso 1 hora antes de cada retiro con hora programada y cuando un pedido lleva días sin salir. ' +
        "Dentro de la app siempre; si activas las notificaciones del navegador, también con la app en segundo plano. En la versión online llegarán al teléfono.</p>" +
        (notifOn ? "" : '<button class="btn ghost" id="aj-notif" style="margin-top:8px">🔔 Activar notificaciones del navegador</button>') +
        "</div>";

      if (esSuper) {
        /* usuarios */
        html += '<div class="card section-gap"><div class="card-head"><h2>👥 Usuarios y permisos</h2>' +
          (App.MODO_NUBE ? '<span class="pill">las cuentas nuevas las crea Manuel</span>' : '<button class="btn sm ghost" id="aj-user-nuevo">+ Usuario</button>') +
          '</div><div class="list">';
        App.db.usuarios.forEach(function (us) {
          html += '<div class="row-item" data-user="' + us.id + '"><div class="avatar">' + (us.emoji || App.iniciales(us.nombre)) + "</div>" +
            '<div class="row-main"><div class="row-title">' + App.esc(us.nombre) + "</div>" +
            '<div class="row-sub">' + App.esc(us.email) + " · " + (us.rol === "super" ? "súper usuario" : "vendedor" + (us.comision ? " · " + us.comision + "% comisión" : "")) + "</div></div>" +
            App.icon("chevR") + "</div>";
        });
        html += "</div></div>";

        /* tiendas */
        html += '<div class="card section-gap"><div class="card-head"><h2>🏬 Tiendas</h2></div>';
        s.tiendas.forEach(function (t, i) {
          html += '<div class="form-grid" style="margin-bottom:8px">' +
            '<div class="field"><label>Emoji + nombre completo</label><div class="flex">' +
            '<input class="input" data-t-emoji="' + i + '" value="' + App.esc(t.emoji) + '" maxlength="4" style="width:58px;flex:none">' +
            '<input class="input" data-t-nombre="' + i + '" value="' + App.esc(t.nombre) + '"></div></div>' +
            '<div class="field"><label>Nombre corto</label><input class="input" data-t-corto="' + i + '" value="' + App.esc(t.corto) + '"></div></div>';
        });
        html += '<button class="btn sm primary" id="aj-guardar-tiendas">Guardar tiendas</button></div>';

        /* plantilla WhatsApp */
        var prodDemo = App.db.productos[0];
        html += '<div class="card section-gap"><div class="card-head"><h2>💬 Plantilla de WhatsApp</h2></div>' +
          '<p class="small muted">Se usa al tocar “Copiar para WhatsApp” en un producto. Variables disponibles:</p>' +
          '<div class="chips" style="margin:8px 0">' +
          ["{{producto}}", "{{descripcion}}", "{{precio_usd}}", "{{precio_bs}}", "{{tallas}}", "{{tallas_linea}}", "{{tienda}}", "{{categoria}}"].map(function (v) {
            return '<span class="pill num">' + v + "</span>";
          }).join("") + "</div>" +
          '<textarea class="textarea" id="aj-plantilla" style="min-height:150px">' + App.esc(s.plantillaWhatsApp) + "</textarea>" +
          '<div class="flex" style="gap:8px;margin-top:8px">' +
          '<button class="btn sm primary" id="aj-guardar-plantilla">Guardar</button>' +
          (prodDemo ? '<button class="btn sm ghost" id="aj-prev-plantilla">Ver ejemplo</button>' : "") + "</div></div>";

        /* listas editables */
        html += '<div class="card section-gap"><div class="card-head"><h2>📋 Listas del negocio</h2></div>' +
          listaEditable("Métodos de pago", "mp") +
          listaEditable("Categorías de producto", "cat") +
          listaEditable("Categorías de gastos", "cg") +
          listaEditable("Agencias de envío", "ag") +
          "</div>";
      }

      /* apariencia */
      var temaActual = localStorage.getItem("ljt_tema") || "sistema";
      html += '<div class="card section-gap"><div class="card-head"><h2>🎨 Apariencia</h2></div><div class="seg">' +
        [["claro", "☀️ Claro"], ["oscuro", "🌙 Oscuro"], ["sistema", "⚙️ Sistema"]].map(function (t) {
          return '<button class="seg-btn' + (temaActual === t[0] ? " active" : "") + '" data-tema="' + t[0] + '">' + t[1] + "</button>";
        }).join("") + "</div></div>";

      /* datos */
      html += '<div class="card section-gap"><div class="card-head"><h2>💾 Datos y respaldo</h2></div>' +
        (App.MODO_NUBE
          ? '<p class="small muted">☁️ Tus datos viven en el servidor y se sincronizan solos entre dispositivos. El respaldo JSON es una copia adicional de seguridad.</p>'
          : '<p class="small muted">Los datos viven en este navegador. Descarga un respaldo antes de limpiar caché o cambiar de equipo.</p>') +
        '<div class="small" style="margin-top:6px">Último respaldo: <b>' +
        (App.db.meta.ultimoRespaldo ? App.fmt.fechaRel(App.db.meta.ultimoRespaldo) : "nunca — descárgalo hoy") + "</b></div>" +
        '<div class="flex wrap" style="gap:8px;margin-top:10px">' +
        '<button class="btn" id="aj-exportar">' + App.icon("descargar") + " Descargar respaldo</button>" +
        (App.MODO_NUBE
          ? '<button class="btn" id="aj-recargar">🔄 Recargar del servidor</button>'
          : '<button class="btn" id="aj-importar">' + App.icon("subir") + " Importar respaldo</button>" +
          '<input type="file" id="aj-file" accept="application/json" class="hidden">') +
        (esSuper && !App.MODO_NUBE ? '<button class="btn danger" id="aj-reset">Restaurar demo</button>' : "") +
        (esSuper && !App.MODO_NUBE && App.db.meta.esDemo !== false
          ? '<button class="btn primary" id="aj-estreno">🚀 Empezar de cero (borrar datos de ejemplo)</button>' : "") +
        "</div>" +
        (esSuper ? '<div class="flex wrap" style="gap:8px;margin-top:8px">' +
          '<button class="btn sm ghost" id="aj-csv-v">📊 CSV ventas</button>' +
          '<button class="btn sm ghost" id="aj-csv-c">📊 CSV clientes</button>' +
          '<button class="btn sm ghost" id="aj-csv-i">📊 CSV inventario</button></div>' : "") +
        "</div>";

      html += '<div class="small muted" style="margin:16px 4px">Sistema La Teacher · En Vzla — prototipo v0.1 (local). ' +
        "Fase 2: versión online con seguridad real, tasa BCV automática, lectura de guías con IA y notificaciones.</div></div>";

      el.innerHTML = html;

      /* --- eventos --- */
      App.$("#aj-guardar-perfil").addEventListener("click", function () {
        var nombre = App.$("#aj-nombre").value.trim();
        if (!nombre) { App.toast("El nombre no puede quedar vacío", "err"); return; }
        u.nombre = nombre;
        u.emoji = App.$("#aj-emoji").value.trim() || u.emoji;
        var clave = App.$("#aj-clave").value;
        if (App.MODO_NUBE) {
          if (clave) {
            if (clave.length < 8) { App.toast("La contraseña nueva necesita mínimo 8 caracteres", "err"); return; }
            App.sb.auth.updateUser({ password: clave }).then(function (r) {
              App.toast(r.error ? "Perfil guardado, pero la clave no se pudo cambiar: " + r.error.message : "Perfil y contraseña actualizados ✓", r.error ? "err" : undefined);
            });
          }
        } else {
          u.email = App.$("#aj-email").value.trim();
          if (clave) u.clave = clave;
        }
        App.save(); App.toast("Perfil actualizado");
        App.montarShell(); App.render();
      });
      var bReset2fa = App.$("#aj-reset2fa");
      if (bReset2fa) bReset2fa.addEventListener("click", function () {
        App.sheet({
          titulo: "Restablecer 2FA",
          cuerpo: "<p>En la versión online: se envía un enlace al email, se invalida el autenticador anterior y se configura uno nuevo escaneando un código QR.</p><p class='muted small' style='margin-top:8px'>En el prototipo el código siempre es <b>246810</b>.</p>"
        });
      });
      App.$("#aj-logout").addEventListener("click", App.auth.logout);
      var bn = App.$("#aj-notif");
      if (bn) bn.addEventListener("click", App.pedirPermisoNotif);
      var lockP = App.$("#aj-lock-precio");
      if (lockP) lockP.addEventListener("change", function () {
        s.bloquearPrecioVendedor = lockP.checked;
        App.save();
        App.toast(lockP.checked ? "Candado de precios activado 🔒" : "Candado desactivado — cualquiera puede cambiar precios");
      });

      App.$$("[data-tema]", el).forEach(function (b) {
        b.addEventListener("click", function () { App.setTema(b.dataset.tema); App.render(); });
      });

      App.$("#aj-exportar").addEventListener("click", function () {
        App.descargarRespaldo();
        App.toast("Respaldo descargado 💾");
        App.render();
      });
      var bcv = App.$("#aj-csv-v");
      if (bcv) bcv.addEventListener("click", function () {
        var filas = [["fecha", "hora", "cliente", "canal", "productos", "totalUsd", "totalBs", "tasaEur", "metodoPago", "estadoPago", "apartado", "entrega", "estadoEnvio", "vendedor"]];
        App.db.ventas.slice().sort(function (a, b) { return a.fecha < b.fecha ? 1 : -1; }).forEach(function (v) {
          var cli = App.cliente(v.clienteId);
          filas.push([
            v.fecha.slice(0, 10), v.fecha.slice(11, 16),
            cli ? cli.nombre : "Casual", v.canal,
            v.items.map(function (i) { return i.cant + "x " + i.nombre + (i.talla ? " (" + i.talla + ")" : ""); }).join(" | "),
            App.calc.ventaTotal(v).toFixed(2), v.totalBs || "", v.tasaEur || "",
            v.metodoPago, v.estadoPago, v.apartado ? "sí" : "",
            v.entrega ? v.entrega.tipo : "", v.entrega ? v.entrega.estado : "",
            (App.usuario(v.vendedorId) || {}).nombre || ""
          ]);
        });
        App.descargarCSV("ventas", filas);
        App.toast("CSV de ventas descargado 📊");
      });
      var bcc = App.$("#aj-csv-c");
      if (bcc) bcc.addEventListener("click", function () {
        var stats = App.calc.clientesStats();
        var filas = [["nombre", "telefono", "email", "estado", "ciudad", "compras", "totalUsd", "ultimaCompra"]];
        App.db.clientes.forEach(function (c) {
          var st = stats[c.id];
          filas.push([c.nombre, c.telefono, c.email || "", c.estado || "", c.ciudad || "",
            st ? st.compras : 0, st ? st.total.toFixed(2) : "0", st ? st.ultima : ""]);
        });
        App.descargarCSV("clientes", filas);
        App.toast("CSV de clientes descargado 📊");
      });
      var bci = App.$("#aj-csv-i");
      if (bci) bci.addEventListener("click", function () {
        var filas = [["sku", "codigoBarras", "nombre", "tienda", "categoria", "stock", "precioUsd", "costoChina", "flete", "adsPorUnidad", "unidadesVendidas", "ingresosUsd", "primeraVenta", "ultimaVenta"]];
        App.calc.productosAnalisis().forEach(function (st) {
          var p = st.producto;
          filas.push([p.sku || "", p.codigoBarras || "", p.nombre, (App.tienda(p.tienda) || {}).corto || "", p.categoria,
            st.stock, p.precio, p.costoChina || 0, p.flete || 0, p.costoAds || 0,
            st.unidades, st.usd.toFixed(2), st.primera || "", st.ultima || ""]);
        });
        App.descargarCSV("inventario", filas);
        App.toast("CSV de inventario descargado 📊");
      });
      var bRecargar = App.$("#aj-recargar");
      if (bRecargar) bRecargar.addEventListener("click", function () {
        bRecargar.disabled = true;
        App.cargarNube().then(function () {
          bRecargar.disabled = false;
          App.toast("Datos recargados del servidor ☁️");
          App.render();
        }, function () {
          bRecargar.disabled = false;
          App.toast("No se pudo conectar con el servidor", "err");
        });
      });
      var bImp = App.$("#aj-importar");
      if (bImp) bImp.addEventListener("click", function () { App.$("#aj-file").click(); });
      var inpFile = App.$("#aj-file");
      if (inpFile) inpFile.addEventListener("change", function (e) {
        var f = e.target.files[0];
        if (!f) return;
        var lector = new FileReader();
        lector.onload = function () {
          App.confirmar("Esto reemplaza TODOS los datos actuales por los del respaldo. ¿Continuar?", { peligro: true, accion: "Sí, importar" }).then(function (si) {
            if (!si) return;
            try { App.importar(lector.result); App.toast("Respaldo importado"); location.reload(); }
            catch (err) { App.toast("Archivo inválido: " + err.message, "err"); }
          });
        };
        lector.readAsText(f);
      });
      var bEstreno = App.$("#aj-estreno");
      if (bEstreno) bEstreno.addEventListener("click", function () {
        App.confirmar("Se borran TODOS los datos de ejemplo (productos, ventas, clientes, proveedores, gastos…) y el sistema queda vacío para cargar tu negocio real. Se conservan usuarios, tiendas, agencias, categorías, plantilla y festividades. ¿Lista para estrenar?", { peligro: true, accion: "🚀 Sí, empezar de cero" }).then(function (si) {
          if (si) App.empezarDeCero();
        });
      });
      var br = App.$("#aj-reset");
      if (br) br.addEventListener("click", function () {
        App.confirmar("Se borra TODO y vuelve la data demo inicial. ¿Seguro?", { peligro: true, accion: "Sí, restaurar" }).then(function (si) {
          if (si) App.resetDemo();
        });
      });

      if (esSuper) {
        var bUserNuevo = App.$("#aj-user-nuevo");
        if (bUserNuevo) bUserNuevo.addEventListener("click", function () { formUsuario(null); });
        App.delegar(el, "click", "[data-user]", function (e, t) {
          var us = App.usuario(t.dataset.user);
          if (us) formUsuario(us);
        });
        App.$("#aj-guardar-tiendas").addEventListener("click", function () {
          s.tiendas.forEach(function (t, i) {
            t.emoji = App.$("[data-t-emoji='" + i + "']").value.trim() || t.emoji;
            t.nombre = App.$("[data-t-nombre='" + i + "']").value.trim() || t.nombre;
            t.corto = App.$("[data-t-corto='" + i + "']").value.trim() || t.corto;
          });
          App.save(); App.toast("Tiendas actualizadas"); App.montarShell();
        });
        App.$("#aj-guardar-plantilla").addEventListener("click", function () {
          s.plantillaWhatsApp = App.$("#aj-plantilla").value;
          App.save(); App.toast("Plantilla guardada");
        });
        var bp = App.$("#aj-prev-plantilla");
        if (bp) bp.addEventListener("click", function () {
          s.plantillaWhatsApp = App.$("#aj-plantilla").value;
          App.sheet({
            titulo: "Así se ve",
            cuerpo: '<div class="card" style="white-space:pre-wrap;font-size:13.5px;box-shadow:none;background:var(--ok-soft)">' +
              App.esc(App.textoProducto(App.db.productos[0])) + "</div>"
          });
        });
        wireListas(el);
      }
    }
  };

  /* ---------- listas editables (chips + agregar) ---------- */
  function listaEditable(titulo, key) {
    var arr = key === "mp" ? App.db.settings.metodosPago :
      key === "cat" ? App.db.settings.categorias :
        key === "cg" ? (App.db.settings.categoriasGasto || []) :
          App.db.settings.agencias.map(function (a) { return a.nombre; });
    return '<div class="field" style="margin-bottom:12px"><label>' + titulo + "</label>" +
      '<div class="chips" style="margin:6px 0">' + arr.map(function (v, i) {
        return '<span class="chip" style="cursor:default">' + App.esc(v) +
          ' <button data-l-del="' + key + ":" + i + '" style="margin-left:2px;padding:8px 10px;margin-top:-8px;margin-bottom:-8px;color:var(--danger);font-weight:800">×</button></span>';
      }).join("") + "</div>" +
      '<div class="input-row"><div class="field" style="flex:1"><input class="input" data-l-input="' + key + '" placeholder="Agregar…"></div>' +
      '<button class="btn sm" data-l-add="' + key + '">+ Agregar</button></div></div>';
  }
  function wireListas(el) {
    App.delegar(el, "click", "[data-l-del]", function (e, t) {
      var p = t.dataset.lDel.split(":"), key = p[0], i = +p[1];
      if (key === "mp") App.db.settings.metodosPago.splice(i, 1);
      else if (key === "cat") App.db.settings.categorias.splice(i, 1);
      else if (key === "cg") App.db.settings.categoriasGasto.splice(i, 1);
      else App.db.settings.agencias.splice(i, 1);
      App.save(); App.render();
    });
    App.delegar(el, "click", "[data-l-add]", function (e, t) {
      var key = t.dataset.lAdd;
      var inp = App.$("[data-l-input='" + key + "']", el);
      var v = inp.value.trim();
      if (!v) return;
      if (key === "mp") App.db.settings.metodosPago.push(v);
      else if (key === "cat") App.db.settings.categorias.push(v);
      else if (key === "cg") (App.db.settings.categoriasGasto = App.db.settings.categoriasGasto || []).push(v);
      else App.db.settings.agencias.push({ id: App.uid("ag"), nombre: v });
      App.save(); App.toast("Agregado"); App.render();
    });
  }

  /* ---------- alta / edición de usuarios ---------- */
  function formUsuario(orig) {
    var esNuevo = !orig;
    var permisosDe = function () {
      if (!orig) return ["dashboard", "ventas", "envios", "inventario", "clientes", "calendario"];
      return orig.permisos === "*" ? MODULOS_PERMISO.map(function (m) { return m[0]; }) : (orig.permisos || []).slice();
    };
    var FU = {
      rol: orig ? orig.rol : "vendedor",
      permisos: permisosDe()
    };

    var s = App.sheet({
      titulo: esNuevo ? "Nuevo usuario" : "Editar usuario",
      cuerpo: '<div class="form-grid">' +
        '<div class="field"><label>Nombre</label><input class="input" id="fu-nombre" value="' + App.esc(orig ? orig.nombre : "") + '"></div>' +
        '<div class="field"><label>Emoji</label><input class="input" id="fu-emoji" value="' + App.esc(orig ? orig.emoji || "" : "🧑‍💼") + '" maxlength="4"></div>' +
        (App.MODO_NUBE
          ? '<div class="field full"><label>Cuenta</label><div class="small muted" style="padding:6px 2px">El email y la contraseña se gestionan en el servidor (con Manuel). Aquí editas nombre, rol, comisión y permisos.</div></div>'
          : '<div class="field"><label>Email (para entrar)</label><input class="input" id="fu-email" type="email" value="' + App.esc(orig ? orig.email : "") + '"></div>' +
          '<div class="field"><label>Contraseña</label><input class="input" id="fu-clave" placeholder="' + (esNuevo ? "obligatoria" : "(sin cambios)") + '"></div>') +
        '<div class="field full"><label>Rol</label><div class="seg" id="fu-rol">' +
        '<button type="button" class="seg-btn' + (FU.rol === "super" ? " active" : "") + '" data-v="super">👑 Súper</button>' +
        '<button type="button" class="seg-btn' + (FU.rol === "vendedor" ? " active" : "") + '" data-v="vendedor">Vendedor</button></div></div>' +
        '<div class="field"><label>Comisión sobre sus ventas (%)</label><input class="input num" id="fu-comision" type="number" min="0" max="50" step="0.5" value="' + (orig ? orig.comision || 0 : 5) + '"></div>' +
        "</div>" +
        '<h3 style="margin-top:12px">Qué puede ver</h3>' +
        '<div class="small muted" style="margin-bottom:6px">El súper usuario siempre ve todo (incluidos costos y finanzas).</div>' +
        '<div id="fu-permisos" class="chips" style="margin-top:4px"></div>',
      pie: (orig && orig.id !== App.auth.user.id && !App.MODO_NUBE ? '<button class="btn danger" data-borrar style="flex:0 0 auto">' + App.icon("basura") + "</button>" : "") +
        '<button class="btn primary" data-ok>' + (esNuevo ? "Crear usuario" : "Guardar") + "</button>"
    });

    function pintarPermisos() {
      var box = App.$("#fu-permisos", s.el);
      if (FU.rol === "super") { box.innerHTML = '<span class="pill ok">Acceso total ✓</span>'; return; }
      box.innerHTML = MODULOS_PERMISO.filter(function (m) { return ["finanzas", "ajustes"].indexOf(m[0]) < 0; }).map(function (m) {
        var activo = FU.permisos.indexOf(m[0]) >= 0;
        return '<button class="chip' + (activo ? " active" : "") + '" data-perm="' + m[0] + '">' + m[1] + "</button>";
      }).join("");
      App.$$("[data-perm]", box).forEach(function (b) {
        b.addEventListener("click", function () {
          var i = FU.permisos.indexOf(b.dataset.perm);
          if (i >= 0) FU.permisos.splice(i, 1); else FU.permisos.push(b.dataset.perm);
          pintarPermisos();
        });
      });
    }
    App.$$("#fu-rol .seg-btn", s.el).forEach(function (b) {
      b.addEventListener("click", function () {
        FU.rol = b.dataset.v;
        App.$$("#fu-rol .seg-btn", s.el).forEach(function (x) { x.classList.toggle("active", x === b); });
        pintarPermisos();
      });
    });
    pintarPermisos();

    App.$("[data-ok]", s.foot).addEventListener("click", function () {
      var nombre = App.$("#fu-nombre", s.el).value.trim();
      var campoEmail = App.$("#fu-email", s.el);
      var campoClave = App.$("#fu-clave", s.el);
      var email = campoEmail ? campoEmail.value.trim() : (orig ? orig.email : "");
      var clave = campoClave ? campoClave.value : "";
      if (!nombre || (!App.MODO_NUBE && !email)) { App.toast("Nombre y email son obligatorios", "err"); return; }
      if (esNuevo && App.MODO_NUBE) { App.toast("Las cuentas nuevas se crean en el servidor (con Manuel)", "err"); return; }
      if (esNuevo && !clave) { App.toast("Ponle contraseña", "err"); return; }
      var data = orig || { id: App.uid("u") };
      data.nombre = nombre;
      if (!App.MODO_NUBE) data.email = email;
      data.emoji = App.$("#fu-emoji", s.el).value.trim();
      if (clave && !App.MODO_NUBE) data.clave = clave;
      data.rol = FU.rol;
      data.comision = parseFloat(App.$("#fu-comision", s.el).value) || 0;
      data.permisos = FU.rol === "super" ? "*" : FU.permisos;
      if (esNuevo) App.db.usuarios.push(data);
      App.save(); App.toast(esNuevo ? "Usuario creado" : "Usuario actualizado");
      s.cerrar(); App.render();
    });
    var bb = App.$("[data-borrar]", s.foot);
    if (bb) bb.addEventListener("click", function () {
      var superRestantes = App.db.usuarios.filter(function (x) { return x.rol === "super" && x.id !== orig.id; }).length;
      if (orig.rol === "super" && !superRestantes) { App.toast("No puedes borrar al único súper usuario", "err"); return; }
      App.confirmar("¿Eliminar a " + orig.nombre + "? Sus ventas quedan registradas.", { peligro: true, accion: "Eliminar" }).then(function (si) {
        if (!si) return;
        App.db.usuarios = App.db.usuarios.filter(function (x) { return x.id !== orig.id; });
        App.save(); App.toast("Usuario eliminado"); s.cerrar(); App.render();
      });
    });
  }
})();

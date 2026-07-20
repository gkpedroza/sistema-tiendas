/* ============================================================
   proveedores.js — proveedores China (Alibaba/1688) y agentes
   de carga, con contactos y direcciones de fábrica
   ============================================================ */
window.App = window.App || {};

(function () {
  "use strict";

  App.modProveedores = {
    id: "proveedores", titulo: "Proveedores", icono: "proveedores",
    render: function (el) {
      var C = App.calc;
      var provs = App.db.proveedores || [];
      var html = '<div class="view"><div class="spread" style="margin-bottom:12px"><div><h1>🏭 Proveedores</h1>' +
        '<div class="small muted">A quién le compras en China y quién te lo trae</div></div>' +
        '<button class="btn primary" id="btn-prov-nuevo">' + App.icon("plus") + " Proveedor</button></div>";

      /* pedidos a proveedores: pedida → en tránsito → recibida (suma stock y costos) */
      var compras = (App.db.compras || []).slice().sort(function (a, b) { return a.fecha < b.fecha ? 1 : -1; });
      var pendC = compras.filter(function (c) { return c.estado !== "recibida"; });
      var recibidasC = compras.filter(function (c) { return c.estado === "recibida"; }).slice(0, 3);
      html += '<div class="card" style="margin-bottom:12px"><div class="card-head"><h2>📦 Pedidos a proveedores</h2>' +
        '<button class="btn sm primary" id="btn-compra">+ Pedido</button></div>';
      if (!pendC.length && !recibidasC.length) {
        html += '<div class="empty" style="padding:14px"><p>Registra aquí lo que pidas a China: al marcarlo recibido, el stock y los costos de reposición se actualizan solos.</p></div>';
      }
      pendC.forEach(function (co) {
        var prov = provs.filter(function (p) { return p.id === co.proveedorId; })[0];
        var tot = C.compraTotales(co);
        var dl = co.llegadaEst ? C.diasHasta(co.llegadaEst) : null;
        var llegadaPill = co.llegadaEst
          ? (dl < 0 ? '<span class="pill danger">debió llegar hace ' + (-dl) + " días</span>"
            : dl === 0 ? '<span class="pill warn">llega HOY</span>'
              : '<span class="pill info">llega ~' + App.fmt.fecha(co.llegadaEst) + " (en " + dl + " días)</span>")
          : "";
        html += '<div class="card' + (dl != null && dl < 0 ? " late" : "") + '" style="padding:13px 14px;box-shadow:none;border:1px solid var(--card-border);margin-bottom:8px">' +
          '<div class="spread"><div class="row-title" style="font-size:14px">' + App.esc(prov ? prov.nombre : "Proveedor") + "</div>" +
          '<span class="pill ' + (co.estado === "pedida" ? "warn" : "info") + '">' + (co.estado === "pedida" ? "🛒 Pedida" : "🚢 En tránsito") + "</span></div>" +
          '<div class="row-sub">pedido ' + App.fmt.fecha(co.fecha) + " · " + llegadaPill + "</div>" +
          (co.notas ? '<div class="row-sub">' + App.esc(co.notas) + "</div>" : "") +
          '<div class="small" style="margin:6px 0 2px">' + (co.items || []).map(function (it) {
            var p = App.prod(it.productoId);
            return "• " + it.cant + "× " + App.esc(p ? p.nombre : "?") + (it.talla ? " (" + App.esc(it.talla) + ")" : "") + " a " + App.fmt.usd(it.costoUnit);
          }).join("<br>") + "</div>" +
          '<div class="spread small muted"><span>' + tot.uds + " uds · mercancía " + App.fmt.usd(tot.mercancia) + " + flete " + App.fmt.usd(+co.fleteTotal || 0) + '</span><b class="num">' + App.fmt.usd(tot.total) + "</b></div>" +
          '<div class="flex wrap" style="gap:8px;margin-top:9px">' +
          (co.estado === "pedida" ? '<button class="btn sm" data-co-transito="' + co.id + '">🚢 Ya salió</button>' : "") +
          '<button class="btn sm primary" data-co-recibir="' + co.id + '">✓ Recibida — sumar stock</button>' +
          '<button class="btn sm ghost" data-co-editar="' + co.id + '">' + App.icon("editar") + "</button>" +
          '<button class="btn sm ghost" data-co-borrar="' + co.id + '" style="color:var(--danger)">' + App.icon("basura") + "</button>" +
          "</div></div>";
      });
      if (recibidasC.length) {
        html += '<div class="list">' + recibidasC.map(function (co) {
          var prov = provs.filter(function (p) { return p.id === co.proveedorId; })[0];
          var tot = C.compraTotales(co);
          return '<div class="row-item static"><div class="thumb">✅</div><div class="row-main"><div class="row-sub">Recibida ' + App.fmt.fecha(co.recibidaEl || co.fecha) + " · " + App.esc(prov ? prov.nombre : "") + " · " + tot.uds + ' uds</div></div><span class="num small">' + App.fmt.usd(tot.total) + "</span></div>";
        }).join("") + "</div>";
      }
      html += "</div>";

      if (!provs.length) html += '<div class="empty"><div class="big">🏭</div><p>Registra tus proveedores de Alibaba/1688 y tu agente de carga.</p></div>';
      provs.forEach(function (pr) {
        html += '<div class="card lift" data-prov="' + pr.id + '" style="cursor:pointer">' +
          '<div class="spread"><div class="row-title" style="font-size:15px">🏭 ' + App.esc(pr.nombre) + "</div>" +
          '<span class="pill info">' + App.esc(pr.plataforma || "—") + "</span></div>" +
          (pr.contacto ? '<div class="row-sub">Contacto: ' + App.esc(pr.contacto) + (pr.wechat ? " · WeChat: " + App.esc(pr.wechat) : "") + "</div>" : "") +
          (pr.direccion ? '<div class="row-sub">📍 ' + App.esc(pr.direccion) + "</div>" : "") +
          (pr.productos ? '<div class="small" style="margin-top:6px">' + App.esc(pr.productos) + "</div>" : "") +
          (pr.notas ? '<div class="small muted" style="margin-top:4px">💡 ' + App.esc(pr.notas) + "</div>" : "") +
          '<div class="flex wrap" style="gap:8px;margin-top:10px">' +
          (pr.telefono ? '<a class="btn sm wa" target="_blank" rel="noopener" href="' + App.waLink(pr.telefono) + '" data-stop>' + App.icon("wa") + " WhatsApp</a>" : "") +
          (pr.url ? '<a class="btn sm ghost" target="_blank" rel="noopener" href="' + App.esc(pr.url) + '" data-stop>🔗 Ver tienda</a>' : "") +
          (pr.wechat ? '<button class="btn sm ghost" data-copiar-wc="' + App.esc(pr.wechat) + '" data-stop>' + App.icon("copiar") + " WeChat</button>" : "") +
          "</div></div>";
      });
      html += "</div>";
      el.innerHTML = html;

      App.$("#btn-prov-nuevo").addEventListener("click", function () { formProveedor(null); });
      App.$("#btn-compra").addEventListener("click", function () { formCompra(null); });
      App.delegar(el, "click", "[data-co-transito]", function (e, t) {
        e.stopPropagation();
        var co = App.compraDe(t.dataset.coTransito);
        if (co) { co.estado = "transito"; App.save(); App.toast("Pedido en tránsito 🚢"); App.render(); }
      });
      App.delegar(el, "click", "[data-co-recibir]", function (e, t) {
        e.stopPropagation();
        var co = App.compraDe(t.dataset.coRecibir);
        if (!co) return;
        App.confirmar("¿Recibiste este pedido? Se sumará el stock y se actualizarán los costos de reposición de cada producto.", { accion: "Sí, recibido" }).then(function (si) {
          if (!si) return;
          App.calc.compraRecibir(co);
          App.save(); App.toast("Recibido: stock y costos actualizados 📦");
          App.render();
        });
      });
      App.delegar(el, "click", "[data-co-editar]", function (e, t) {
        e.stopPropagation();
        var co = App.compraDe(t.dataset.coEditar);
        if (co) formCompra(co);
      });
      App.delegar(el, "click", "[data-co-borrar]", function (e, t) {
        e.stopPropagation();
        App.confirmar("¿Eliminar este pedido? (No toca el stock.)", { peligro: true, accion: "Eliminar" }).then(function (si) {
          if (!si) return;
          App.db.compras = App.db.compras.filter(function (c) { return c.id !== t.dataset.coBorrar; });
          App.save(); App.toast("Pedido eliminado"); App.render();
        });
      });
      App.delegar(el, "click", "[data-copiar-wc]", function (e, t) {
        e.stopPropagation();
        App.copiar(t.dataset.copiarWc, "ID de WeChat copiado");
      });
      App.delegar(el, "click", "[data-prov]", function (e, t) {
        if (e.target.closest("[data-stop]")) return;
        var pr = (App.db.proveedores || []).filter(function (x) { return x.id === t.dataset.prov; })[0];
        if (pr) formProveedor(pr);
      });
    }
  };

  /* ---------- pedido a proveedor (con escáner) ---------- */
  function formCompra(orig) {
    var C = App.calc;
    if (!(App.db.proveedores || []).length) { App.toast("Primero registra un proveedor", "err"); return; }
    var FC = orig ? JSON.parse(JSON.stringify(orig)) : {
      id: null, proveedorId: App.db.proveedores[0].id,
      fecha: App.hoyISO(), llegadaEst: App.toISO(App.addDays(new Date(), 20)),
      estado: "pedida", recibidaEl: null, fleteTotal: 0, notas: "", items: []
    };

    var s = App.sheet({
      titulo: orig ? "✏️ Editar pedido" : "📦 Nuevo pedido a proveedor",
      cuerpo: '<div class="form-grid">' +
        '<div class="field"><label>Proveedor</label><select class="select" id="fc2-prov">' +
        App.db.proveedores.map(function (p) { return '<option value="' + p.id + '"' + (FC.proveedorId === p.id ? " selected" : "") + ">" + App.esc(p.nombre) + "</option>"; }).join("") +
        "</select></div>" +
        '<div class="field"><label>Fecha del pedido</label><input class="input" id="fc2-fecha" type="date" value="' + FC.fecha + '"></div>' +
        '<div class="field"><label>Llegada estimada</label><input class="input" id="fc2-lleg" type="date" value="' + (FC.llegadaEst || "") + '"></div>' +
        '<div class="field"><label>Flete total del embarque (USD)</label><input class="input num" id="fc2-flete" type="number" step="0.01" min="0" value="' + (FC.fleteTotal || 0) + '"></div>' +
        '<div class="field full"><label>Notas</label><input class="input" id="fc2-notas" value="' + App.esc(FC.notas || "") + '"></div>' +
        "</div>" +
        '<h3 style="margin-top:10px">🧸 Productos del pedido</h3>' +
        '<div class="flex" style="margin-top:6px;gap:8px"><div class="search-bar" style="flex:1">' + App.icon("buscar") +
        '<input class="input" id="fc2-bus" placeholder="Busca o escanea (pistola + Enter)…"></div>' +
        '<button class="btn icon" id="fc2-scan" title="Escanear con cámara" style="width:42px;height:42px;flex:none">' + App.icon("camara") + "</button></div>" +
        '<div class="list" id="fc2-res"></div><div id="fc2-items"></div>' +
        '<div id="fc2-tot" class="small muted" style="margin-top:8px"></div>',
      pie: '<button class="btn primary" data-ok>' + (orig ? "Guardar cambios" : "Registrar pedido") + "</button>"
    });

    function pintarTot() {
      FC.fleteTotal = parseFloat(App.$("#fc2-flete", s.el).value) || 0;
      var tot = C.compraTotales(FC);
      App.$("#fc2-tot", s.el).innerHTML = tot.uds + " uds · mercancía <b>" + App.fmt.usd(tot.mercancia) +
        "</b> + flete <b>" + App.fmt.usd(FC.fleteTotal) + "</b> = <b>" + App.fmt.usd(tot.total) + "</b>" +
        (tot.uds ? " · flete por unidad ≈ " + App.fmt.usd(tot.fletePorUd) : "");
    }
    function agregarItem(p) {
      var sinTallas = !p.tallas || !p.tallas.length;
      var ya = sinTallas ? FC.items.filter(function (i) { return i.productoId === p.id; })[0] : null;
      if (ya) ya.cant++;
      else FC.items.push({ productoId: p.id, cant: 1, costoUnit: p.costoChina || 0, talla: sinTallas ? null : p.tallas[0].talla });
      pintarItems(); pintarTot();
    }
    function pintarItems() {
      var box = App.$("#fc2-items", s.el);
      box.innerHTML = FC.items.length ? '<div class="list" style="margin-top:8px">' + FC.items.map(function (it, ix) {
        var p = App.prod(it.productoId);
        var tallaSel = "";
        if (p && p.tallas && p.tallas.length) {
          tallaSel = '<select class="select" data-fc2-talla="' + ix + '" style="width:auto;padding:6px 26px 6px 8px">' +
            p.tallas.map(function (t) { return "<option" + (it.talla === t.talla ? " selected" : "") + ">" + App.esc(t.talla) + "</option>"; }).join("") + "</select>";
        }
        return '<div class="row-item static"><div class="thumb ' + (p ? p.tienda : "") + '">' + (p ? p.emoji : "❓") + "</div>" +
          '<div class="row-main"><div class="row-title" style="font-size:13px">' + App.esc(p ? p.nombre : "?") + "</div>" +
          '<div class="flex wrap" style="gap:6px;margin-top:4px">' +
          '<span class="stepper"><button data-fc2-menos="' + ix + '">−</button><span>' + it.cant + '</span><button data-fc2-mas="' + ix + '">+</button></span>' +
          tallaSel +
          '<input class="input num" data-fc2-costo="' + ix + '" type="number" step="0.01" min="0" value="' + it.costoUnit + '" title="Costo unitario en China (USD)" style="width:92px;padding:6px 9px">' +
          "</div></div>" +
          '<div class="row-end"><span class="row-amount num">' + App.fmt.usd(it.cant * it.costoUnit) + "</span>" +
          '<button class="btn icon" data-fc2-quitar="' + ix + '" style="width:36px;height:36px">' + App.icon("x") + "</button></div></div>";
      }).join("") + "</div>" : '<div class="empty" style="padding:14px"><p>Agrega los productos que pediste (el costo China se precarga y lo ajustas).</p></div>';

      App.$$("[data-fc2-mas]", box).forEach(function (b) { b.addEventListener("click", function () { FC.items[+b.dataset.fc2Mas].cant++; pintarItems(); pintarTot(); }); });
      App.$$("[data-fc2-menos]", box).forEach(function (b) {
        b.addEventListener("click", function () {
          var it = FC.items[+b.dataset.fc2Menos];
          if (it.cant > 1) it.cant--; else FC.items.splice(+b.dataset.fc2Menos, 1);
          pintarItems(); pintarTot();
        });
      });
      App.$$("[data-fc2-quitar]", box).forEach(function (b) { b.addEventListener("click", function () { FC.items.splice(+b.dataset.fc2Quitar, 1); pintarItems(); pintarTot(); }); });
      App.$$("[data-fc2-costo]", box).forEach(function (inp) {
        inp.addEventListener("change", function () { FC.items[+inp.dataset.fc2Costo].costoUnit = Math.max(0, parseFloat(inp.value) || 0); pintarItems(); pintarTot(); });
      });
      App.$$("[data-fc2-talla]", box).forEach(function (sel) {
        sel.addEventListener("change", function () { FC.items[+sel.dataset.fc2Talla].talla = sel.value; });
      });
    }

    var bus = App.$("#fc2-bus", s.el);
    bus.addEventListener("input", function () {
      var t = bus.value.toLowerCase().trim();
      var res = App.$("#fc2-res", s.el);
      if (!t) { res.innerHTML = ""; return; }
      var hits = App.db.productos.filter(function (p) {
        return p.nombre.toLowerCase().indexOf(t) >= 0 || (p.sku || "").toLowerCase().indexOf(t) >= 0 ||
          (p.codigoBarras && String(p.codigoBarras).indexOf(t) >= 0);
      }).slice(0, 5);
      res.innerHTML = hits.map(function (p) {
        return '<div class="row-item" data-fc2-add="' + p.id + '"><div class="thumb ' + p.tienda + '">' + p.emoji + "</div>" +
          '<div class="row-main"><div class="row-title">' + App.esc(p.nombre) + '</div><div class="row-sub">stock actual: ' + C.prodStock(p) + " · China " + App.fmt.usd(p.costoChina || 0) + "</div></div>" + App.pillTienda(p.tienda) + "</div>";
      }).join("");
      App.$$("[data-fc2-add]", res).forEach(function (r) {
        r.addEventListener("click", function () {
          agregarItem(App.prod(r.dataset.fc2Add));
          bus.value = ""; res.innerHTML = "";
        });
      });
    });
    bus.addEventListener("keydown", function (ev) {
      if (ev.key !== "Enter") return;
      ev.preventDefault();
      var p = App.buscarPorCodigo(bus.value);
      if (p) { agregarItem(p); App.toast("➕ " + p.nombre); bus.value = ""; App.$("#fc2-res", s.el).innerHTML = ""; }
    });
    App.$("#fc2-scan", s.el).addEventListener("click", function () {
      App.escanear(function (codigo) {
        var p = App.buscarPorCodigo(codigo);
        if (p) { agregarItem(p); App.toast("➕ " + p.nombre); }
        else App.toast("El código " + codigo + " no está asignado a ningún producto", "err");
      });
    });
    App.$("#fc2-flete", s.el).addEventListener("input", pintarTot);
    pintarItems(); pintarTot();

    App.$("[data-ok]", s.foot).addEventListener("click", function () {
      if (!FC.items.length) { App.toast("Agrega al menos un producto al pedido", "err"); return; }
      FC.proveedorId = App.$("#fc2-prov", s.el).value;
      FC.fecha = App.$("#fc2-fecha", s.el).value || App.hoyISO();
      FC.llegadaEst = App.$("#fc2-lleg", s.el).value || null;
      FC.fleteTotal = parseFloat(App.$("#fc2-flete", s.el).value) || 0;
      FC.notas = App.$("#fc2-notas", s.el).value.trim();
      App.db.compras = App.db.compras || [];
      if (orig) {
        var ix = App.db.compras.findIndex(function (c) { return c.id === orig.id; });
        App.db.compras[ix] = FC;
      } else {
        FC.id = App.uid("co");
        App.db.compras.push(FC);
      }
      App.save(); App.toast(orig ? "Pedido actualizado" : "Pedido registrado 📦");
      s.cerrar(); App.render();
    });
  }

  function formProveedor(orig) {
    var s = App.sheet({
      titulo: orig ? "✏️ Editar proveedor" : "🏭 Nuevo proveedor",
      cuerpo: '<div class="form-grid">' +
        '<div class="field full"><label>Nombre</label><input class="input" id="pv-nombre" value="' + App.esc(orig ? orig.nombre : "") + '" placeholder="Yiwu Happy Toys Co."></div>' +
        '<div class="field"><label>Plataforma</label><select class="select" id="pv-plat">' +
        ["Alibaba", "1688", "AliExpress", "Agente de carga", "Otro"].map(function (p) {
          return "<option" + (orig && orig.plataforma === p ? " selected" : "") + ">" + p + "</option>";
        }).join("") + "</select></div>" +
        '<div class="field"><label>Persona de contacto</label><input class="input" id="pv-contacto" value="' + App.esc(orig ? orig.contacto : "") + '"></div>' +
        '<div class="field"><label>WeChat</label><input class="input" id="pv-wechat" value="' + App.esc(orig ? orig.wechat : "") + '"></div>' +
        '<div class="field"><label>Teléfono / WhatsApp</label><input class="input" id="pv-tel" value="' + App.esc(orig ? orig.telefono : "") + '"></div>' +
        '<div class="field full"><label>Link de la tienda</label><input class="input" id="pv-url" value="' + App.esc(orig ? orig.url : "") + '" placeholder="https://…"></div>' +
        '<div class="field full"><label>Dirección de fábrica</label><input class="input" id="pv-dir" value="' + App.esc(orig ? orig.direccion : "") + '"></div>' +
        '<div class="field full"><label>Qué le compras</label><input class="input" id="pv-prods" value="' + App.esc(orig ? orig.productos : "") + '" placeholder="Juguetes, peluches…"></div>' +
        '<div class="field full"><label>Notas (MOQ, tiempos, tarifas…)</label><textarea class="textarea" id="pv-notas">' + App.esc(orig ? orig.notas : "") + "</textarea></div>" +
        "</div>",
      pie: (orig ? '<button class="btn danger" data-borrar style="flex:0 0 auto">' + App.icon("basura") + "</button>" : "") +
        '<button class="btn primary" data-ok>' + (orig ? "Guardar" : "Agregar") + "</button>"
    });

    App.$("[data-ok]", s.foot).addEventListener("click", function () {
      var nombre = App.$("#pv-nombre", s.el).value.trim();
      if (!nombre) { App.toast("El proveedor necesita nombre", "err"); return; }
      var data = {
        id: orig ? orig.id : App.uid("pr"),
        nombre: nombre,
        plataforma: App.$("#pv-plat", s.el).value,
        contacto: App.$("#pv-contacto", s.el).value.trim(),
        wechat: App.$("#pv-wechat", s.el).value.trim(),
        telefono: App.$("#pv-tel", s.el).value.trim(),
        url: App.$("#pv-url", s.el).value.trim(),
        direccion: App.$("#pv-dir", s.el).value.trim(),
        productos: App.$("#pv-prods", s.el).value.trim(),
        notas: App.$("#pv-notas", s.el).value.trim()
      };
      App.db.proveedores = App.db.proveedores || [];
      if (orig) {
        var ix = App.db.proveedores.findIndex(function (x) { return x.id === orig.id; });
        App.db.proveedores[ix] = data;
      } else App.db.proveedores.push(data);
      App.save(); App.toast(orig ? "Proveedor actualizado" : "Proveedor agregado");
      s.cerrar(); App.render();
    });
    var bb = App.$("[data-borrar]", s.foot);
    if (bb) bb.addEventListener("click", function () {
      App.confirmar("¿Eliminar este proveedor?", { peligro: true, accion: "Eliminar" }).then(function (si) {
        if (!si) return;
        App.db.proveedores = App.db.proveedores.filter(function (x) { return x.id !== orig.id; });
        App.save(); App.toast("Proveedor eliminado"); s.cerrar(); App.render();
      });
    });
  }
})();

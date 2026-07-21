/* ============================================================
   auth.js — login demo, 2FA maqueta, sesión y permisos
   (la seguridad REAL llega en Fase 2: bcrypt+TOTP+passkeys)
   ============================================================ */
window.App = window.App || {};

(function () {
  "use strict";

  var SS_KEY = "ljt_sesion";
  var CODIGO_DEMO = "246810";
  var pendiente = null; // usuario esperando 2FA

  App.auth = {
    user: null,
    sesionActiva: function () {
      if (App.MODO_NUBE) return false; // en nube la sesión la maneja Supabase (arranque asíncrono en app.js)
      var id = sessionStorage.getItem(SS_KEY);
      if (!id) return false;
      var u = App.usuario(id);
      if (!u) return false;
      App.auth.user = u;
      return true;
    },
    login: function (email, clave) {
      var u = App.db.usuarios.filter(function (x) {
        return x.email.toLowerCase() === String(email).trim().toLowerCase() && x.clave === clave;
      })[0];
      if (!u) return null;
      pendiente = u;
      return u;
    },
    verificar: function (codigo) {
      if (!pendiente || codigo !== CODIGO_DEMO) return false;
      App.auth.user = pendiente;
      sessionStorage.setItem(SS_KEY, pendiente.id);
      pendiente = null;
      return true;
    },
    logout: function () {
      if (App.MODO_NUBE && App.sb) {
        App.sb.auth.signOut().then(function () { location.reload(); }, function () { location.reload(); });
        return;
      }
      sessionStorage.removeItem(SS_KEY);
      location.reload();
    },
    esSuper: function () { return App.auth.user && App.auth.user.rol === "super"; },
    puede: function (modId) {
      var u = App.auth.user;
      if (!u) return false;
      if (u.permisos === "*" || u.rol === "super") return true;
      return (u.permisos || []).indexOf(modId) >= 0;
    }
  };

  /* ---------- pantallas de login ---------- */
  App.renderLogin = function () {
    var root = App.$("#login-root");
    root.className = "login-screen";

    /* ---- login REAL (Supabase Auth) cuando hay conexión configurada ---- */
    if (App.MODO_NUBE) {
      root.innerHTML =
        '<div class="login-card view">' +
        '<div class="logo-mark">🧸</div>' +
        '<div class="login-title">La Teacher · En Vzla</div>' +
        '<div class="login-sub">Entra con tu cuenta</div>' +
        '<form id="f-login-nube">' +
        '<div class="field"><label>Email</label><input class="input" name="email" type="email" autocomplete="username" required></div>' +
        '<div class="field"><label>Contraseña</label><input class="input" name="clave" type="password" autocomplete="current-password" required></div>' +
        '<button class="btn primary block" type="submit" id="btn-entrar-nube">Entrar</button>' +
        "</form>" +
        '<div class="login-alt"><button class="btn ghost block" id="btn-olvide">¿Olvidaste tu contraseña?</button></div>' +
        '<div class="login-hint">☁️ Conectado al servidor — tus datos se sincronizan entre todos tus dispositivos.</div>' +
        "</div>";

      App.$("#f-login-nube").addEventListener("submit", function (e) {
        e.preventDefault();
        var fd = new FormData(e.target);
        var btn = App.$("#btn-entrar-nube");
        btn.disabled = true; btn.textContent = "Entrando…";
        App.sb.auth.signInWithPassword({ email: String(fd.get("email")).trim(), password: String(fd.get("clave")) }).then(function (r) {
          if (r.error) {
            btn.disabled = false; btn.textContent = "Entrar";
            App.toast(/invalid/i.test(r.error.message) ? "Email o contraseña incorrectos" : "No se pudo entrar: " + r.error.message, "err");
            return;
          }
          App.iniciarNube(r.data.session).then(function () { App.iniciarApp(); }, function () {
            btn.disabled = false; btn.textContent = "Entrar";
            App.toast("Entraste, pero no se pudieron cargar los datos. Revisa la conexión y reintenta.", "err");
          });
        });
      });
      App.$("#btn-olvide").addEventListener("click", function () {
        var campo = App.$("#f-login-nube input[name=email]");
        var email = campo ? campo.value.trim() : "";
        if (!email) { App.toast("Escribe tu email arriba y vuelve a tocar aquí", "err"); return; }
        App.sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname }).then(function (r) {
          if (r.error) App.toast("No se pudo enviar: " + r.error.message, "err");
          else App.toast("Te enviamos un correo para restablecerla 📧");
        });
      });
      return;
    }

    root.innerHTML =
      '<div class="login-card view">' +
      '<div class="logo-mark">🧸</div>' +
      '<div class="login-title">La Teacher · En Vzla</div>' +
      '<div class="login-sub">Sistema de gestión de tus tiendas</div>' +
      '<form id="f-login">' +
      '<div class="field"><label>Email</label><input class="input" name="email" type="email" autocomplete="username" value="admin@tienda.com" required></div>' +
      '<div class="field"><label>Contraseña</label><input class="input" name="clave" type="password" autocomplete="current-password" placeholder="••••••••" required></div>' +
      '<button class="btn primary block" type="submit">Entrar</button>' +
      "</form>" +
      '<div class="login-alt">' +
      '<button class="btn ghost block" id="btn-faceid">' + App.icon("faceid") + " Entrar con Face ID</button>" +
      "</div>" +
      (App.db.meta.esDemo !== false
        ? '<div class="login-hint"><b>Modo demo:</b> clave <code>demo123</code> · código 2FA <code>246810</code>.<br>Vendedor: vendedor@tienda.com / vende123.</div>'
        : "") +
      "</div>";

    App.$("#f-login").addEventListener("submit", function (e) {
      e.preventDefault();
      var fd = new FormData(e.target);
      var u = App.auth.login(fd.get("email"), fd.get("clave"));
      if (!u) { App.toast("Email o contraseña incorrectos", "err"); return; }
      render2FA(u);
    });
    App.$("#btn-faceid").addEventListener("click", function () {
      App.toast("Face ID estará disponible en la versión online (passkeys)", "err");
    });
  };

  function render2FA(u) {
    var root = App.$("#login-root");
    root.innerHTML =
      '<div class="login-card view">' +
      '<div class="logo-mark">🔐</div>' +
      '<div class="login-title">Verificación en dos pasos</div>' +
      '<div class="login-sub">Hola ' + App.esc(u.nombre) + ". Escribe el código de tu app de autenticación o del email.</div>" +
      '<form id="f-2fa">' +
      '<div class="otp-row"><input class="input" name="codigo" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="••••••" required></div>' +
      '<button class="btn primary block" type="submit">Verificar</button>' +
      "</form>" +
      '<div class="login-alt">' +
      '<button class="btn ghost block" id="btn-reset2fa">¿Perdiste el acceso? Restablecer 2FA</button>' +
      '<button class="btn block" id="btn-volver">Volver</button>' +
      "</div>" +
      '<div class="login-hint">Código demo: <code>246810</code></div>' +
      "</div>";

    App.$("#f-2fa").addEventListener("submit", function (e) {
      e.preventDefault();
      var codigo = new FormData(e.target).get("codigo");
      if (App.auth.verificar(String(codigo).trim())) {
        App.iniciarApp();
      } else {
        App.toast("Código incorrecto", "err");
      }
    });
    App.$("#btn-volver").addEventListener("click", App.renderLogin);
    App.$("#btn-reset2fa").addEventListener("click", function () {
      App.sheet({
        titulo: "Restablecer 2FA",
        cuerpo: '<p>En la versión online, esto enviará un enlace de restablecimiento al email de la cuenta y desactivará el autenticador anterior tras confirmarlo.</p>' +
          '<p class="muted small" style="margin-top:10px">En este prototipo usa el código demo <b>246810</b>.</p>'
      });
    });
  }

  /* llega desde el correo de "olvidé mi contraseña" (evento PASSWORD_RECOVERY) */
  App.mostrarNuevaClave = function () {
    var s = App.sheet({
      titulo: "🔐 Nueva contraseña",
      cuerpo: '<div class="field"><label>Escribe tu nueva contraseña (mínimo 8 caracteres)</label>' +
        '<input class="input" id="nclave" type="password" autocomplete="new-password"></div>',
      pie: '<button class="btn primary" data-ok>Guardar contraseña</button>'
    });
    App.$("[data-ok]", s.foot).addEventListener("click", function () {
      var clave = App.$("#nclave", s.el).value;
      if (clave.length < 8) { App.toast("Mínimo 8 caracteres", "err"); return; }
      App.sb.auth.updateUser({ password: clave }).then(function (r) {
        if (r.error) { App.toast("No se pudo: " + r.error.message, "err"); return; }
        App.toast("Contraseña actualizada ✓ — ya puedes entrar con ella");
        s.cerrar();
      });
    });
  };
})();

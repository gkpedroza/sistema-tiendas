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
})();

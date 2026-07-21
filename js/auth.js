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
          function continuar() {
            App.iniciarNube(r.data.session).then(function () { App.iniciarApp(); }, function (e2) {
              btn.disabled = false; btn.textContent = "Entrar";
              App.toast(e2 && e2.sinPerfil ? e2.message : "Entraste, pero no se pudieron cargar los datos. Revisa la conexión y reintenta.", "err");
            });
          }
          App.verificar2FASiHaceFalta(continuar, function () {
            btn.disabled = false; btn.textContent = "Entrar";
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

  /* ---------- 2FA real (TOTP de Supabase): pide el código si está activada ---------- */
  App.verificar2FASiHaceFalta = function (alOk, alCancelar) {
    if (!App.MODO_NUBE) { alOk(); return; }
    App.sb.auth.mfa.getAuthenticatorAssuranceLevel().then(function (r) {
      var d = (r && r.data) || {};
      if (d.nextLevel === "aal2" && d.currentLevel !== "aal2") {
        App.sb.auth.mfa.listFactors().then(function (rf) {
          var tot = ((rf.data && rf.data.totp) || []).filter(function (f) { return f.status === "verified"; })[0];
          if (!tot) { alOk(); return; }
          var pasado = false;
          var s = App.sheet({
            titulo: "🔐 Verificación en dos pasos",
            cuerpo: '<p class="small muted">Escribe el código de 6 dígitos de tu app autenticadora (Google Authenticator, 1Password…).</p>' +
              '<div class="field" style="margin-top:8px"><label>Código</label>' +
              '<input class="input num" id="cod2fa" inputmode="numeric" maxlength="6" autocomplete="one-time-code"></div>',
            pie: '<button class="btn primary" data-ok>Verificar</button>',
            alCerrar: function () { if (!pasado && alCancelar) alCancelar(); }
          });
          App.$("[data-ok]", s.foot).addEventListener("click", function () {
            var code = App.$("#cod2fa", s.el).value.trim();
            if (code.length !== 6) { App.toast("El código tiene 6 dígitos", "err"); return; }
            App.sb.auth.mfa.challenge({ factorId: tot.id }).then(function (rc) {
              if (rc.error) { App.toast(rc.error.message, "err"); return; }
              App.sb.auth.mfa.verify({ factorId: tot.id, challengeId: rc.data.id, code: code }).then(function (rv) {
                if (rv.error) { App.toast("Código incorrecto", "err"); return; }
                pasado = true;
                s.cerrar();
                alOk();
              });
            });
          });
        });
      } else alOk();
    }, function () { alOk(); });
  };

  /* ---------- Face ID / huella: candado local del dispositivo (WebAuthn) ---------- */
  App.bioActivo = function () {
    try { return !!localStorage.getItem("ljt_bio_id"); } catch (e) { return false; }
  };
  App.activarBiometria = function () {
    return new Promise(function (resolve, reject) {
      if (!window.PublicKeyCredential || !navigator.credentials || !window.crypto) { reject(new Error("no soportado")); return; }
      var reto = new Uint8Array(32);
      window.crypto.getRandomValues(reto);
      var uid = new TextEncoder().encode(String(App.auth.user.id).slice(0, 32));
      navigator.credentials.create({
        publicKey: {
          challenge: reto,
          rp: { name: "La Teacher · En Vzla" },
          user: { id: uid, name: App.auth.user.email || App.auth.user.nombre || "usuario", displayName: App.auth.user.nombre || "Usuario" },
          pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }],
          authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required", residentKey: "preferred" },
          timeout: 60000
        }
      }).then(function (cred) {
        var b = new Uint8Array(cred.rawId), str = "";
        for (var i = 0; i < b.length; i++) str += String.fromCharCode(b[i]);
        localStorage.setItem("ljt_bio_id", btoa(str));
        resolve();
      }, reject);
    });
  };
  App.desactivarBiometria = function () {
    try { localStorage.removeItem("ljt_bio_id"); } catch (e) { }
  };
  App.pedirBiometria = function () {
    return new Promise(function (resolve, reject) {
      try {
        var idB64 = localStorage.getItem("ljt_bio_id");
        if (!idB64 || !navigator.credentials || !window.crypto) { reject(new Error("sin credencial")); return; }
        var raw = Uint8Array.from(atob(idB64), function (c) { return c.charCodeAt(0); });
        var reto = new Uint8Array(32);
        window.crypto.getRandomValues(reto);
        navigator.credentials.get({
          publicKey: {
            challenge: reto,
            allowCredentials: [{ type: "public-key", id: raw.buffer }],
            userVerification: "required",
            timeout: 60000
          }
        }).then(function (cred) { if (cred) resolve(); else reject(new Error("cancelado")); }, reject);
      } catch (e) { reject(e); }
    });
  };
  App.renderBloqueo = function (alOk) {
    var root = App.$("#login-root");
    root.className = "login-screen";
    root.classList.remove("hidden");
    root.innerHTML =
      '<div class="login-card view">' +
      '<div class="logo-mark">🔒</div>' +
      '<div class="login-title">Sistema bloqueado</div>' +
      '<div class="login-sub">Desbloquéalo con tu Face ID o huella</div>' +
      '<button class="btn primary block" id="btn-bio">' + App.icon("faceid") + " Desbloquear</button>" +
      '<div class="login-alt"><button class="btn block" id="btn-bio-salir">Cerrar sesión y entrar con contraseña</button></div>' +
      "</div>";
    function intentar() {
      App.pedirBiometria().then(function () { alOk(); }, function () {
        App.toast("No se pudo verificar — toca Desbloquear para reintentar", "err");
      });
    }
    App.$("#btn-bio").addEventListener("click", intentar);
    App.$("#btn-bio-salir").addEventListener("click", function () {
      App.desactivarBiometria();
      App.auth.logout();
    });
    intentar();
  };

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

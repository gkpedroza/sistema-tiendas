/* ============================================================
   supabase-config.js — conexión a la nube (Fase 2)
   La publishable key es pública por diseño: la seguridad real
   la ponen las políticas RLS del servidor (solo usuarios con
   login pueden leer/escribir; kardex y auditoría inmutables).
   Si este archivo no está o falla, la app funciona en modo
   local (localStorage), como el prototipo original.
   ============================================================ */
window.SUPABASE_URL = "https://qqyraefesdhstqwbzliy.supabase.co";
window.SUPABASE_KEY = "sb_publishable_0CkOvFl_k8oVWdU0Qpp7gg_7jG6vqUR";

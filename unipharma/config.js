// ============================================================
// UNIPHARMA — Cloud configuration
// ============================================================
// Leave both values empty to run fully OFFLINE (data stays in this
// browser's localStorage — exactly how the app works today).
//
// To enable the shared Supabase database across all 3 branches:
//   1. Create a free project at https://supabase.com
//   2. Run database/schema.sql in the Supabase SQL Editor
//   3. Project Settings → API → copy "Project URL" and the "anon public" key
//   4. Paste them below and re-deploy.
//
// NOTE: the anon key is meant to be public (safe to ship in the browser).
// Keep your site URL private to limit who can reach the data.
// ============================================================
window.UNI_CONFIG = {
  SUPABASE_URL: "https://vgrhhjvcctdvbbhqhvtw.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZncmhoanZjY3RkdmJiaHFodnR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0NDMyMjAsImV4cCI6MjA5NzAxOTIyMH0.JNlXAE3Nbqx8QU7wr7RSUfa_DhILHt7mvaTAScPkedo",
};

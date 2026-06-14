// auth.jsx — Login screen (shown only when cloud is enabled & no session)
// Users log in with a USERNAME; we append a fixed internal domain so the
// Supabase email/password provider works without anyone typing an email.
const LOGIN_DOMAIN = 'unipharma.local';
function LoginScreen({ L, onSignedIn }) {
  const { useState } = React;
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setBusy(true);
    const u = username.trim();
    const loginId = u.includes('@') ? u : `${u}@${LOGIN_DOMAIN}`;
    const res = await window.UNI_DB.signIn(loginId, password);
    setBusy(false);
    if (res.error) { setErr(res.error); return; }
    onSignedIn();
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg0)', padding: 20 }}>
      <form onSubmit={submit} className="card" style={{ width: '100%', maxWidth: 380, padding: 32, boxShadow: 'var(--shadow2)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <img src="assets/logo.png" alt="Unipharma" style={{ height: 48, objectFit: 'contain', marginBottom: 12 }} />
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--acc2)', letterSpacing: '.5px' }}>UNIPHARMA</div>
          <div style={{ fontSize: 12, color: 'var(--txt3)' }}>{L('ระบบจัดการการสั่งซื้อ', 'Purchasing Management')}</div>
        </div>

        <div className="form-group">
          <label className="label">{L('ชื่อผู้ใช้', 'Username')}</label>
          <input className="input" type="text" autoComplete="username" value={username}
            onChange={e => setUsername(e.target.value)} placeholder={L('เช่น admin', 'e.g. admin')} required />
        </div>
        <div className="form-group">
          <label className="label">{L('รหัสผ่าน', 'Password')}</label>
          <input className="input" type="password" autoComplete="current-password" value={password}
            onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
        </div>

        {err && (
          <div style={{ background: 'var(--err-bg)', color: 'var(--err)', padding: '8px 12px', borderRadius: 'var(--r2)', fontSize: 12, marginBottom: 14 }}>
            {L('เข้าสู่ระบบไม่สำเร็จ: ', 'Sign-in failed: ')}{err}
          </div>
        )}

        <button className="btn btn-primary w-full" type="submit" disabled={busy} style={{ justifyContent: 'center', padding: '10px' }}>
          {busy ? L('กำลังเข้าสู่ระบบ…', 'Signing in…') : L('เข้าสู่ระบบ', 'Sign in')}
        </button>

        <div style={{ fontSize: 11, color: 'var(--txt4)', textAlign: 'center', marginTop: 16 }}>
          {L('ติดต่อผู้ดูแลระบบเพื่อขอบัญชีผู้ใช้', 'Contact your admin for an account')}
        </div>
      </form>
    </div>
  );
}

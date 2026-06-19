// CategoryManager.jsx — add / edit / delete drug categories + sub-categories
function CategoryManagerModal({ lang, L, categories, setCategories, drugs = [], notify, onClose }) {
  const uid = (p) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  const [list, setList] = React.useState(() => JSON.parse(JSON.stringify(categories || [])));
  const [removedIds, setRemovedIds] = React.useState([]);
  const cloudOn = !!(window.UNI_DB && window.UNI_DB.enabled);

  // how many drugs reference each category (so deletes are informed)
  const drugCount = (catId) => drugs.filter(d => d.catId === catId).length;

  const updateCat = (id, k, v) => setList(prev => prev.map(c => c.id === id ? { ...c, [k]: v } : c));
  const removeCat = (id) => { setList(prev => prev.filter(c => c.id !== id)); setRemovedIds(prev => [...prev, id]); };
  const addCat = () => setList(prev => [...prev, { id: uid('CAT'), name: '', nameEN: '', color: '#1177cc', subs: [] }]);

  const addSub = (cid) => setList(prev => prev.map(c => c.id === cid ? { ...c, subs: [...(c.subs || []), { id: uid('S'), name: '', nameEN: '' }] } : c));
  const updateSub = (cid, sid, k, v) => setList(prev => prev.map(c => c.id === cid ? { ...c, subs: c.subs.map(s => s.id === sid ? { ...s, [k]: v } : s) } : c));
  const removeSub = (cid, sid) => setList(prev => prev.map(c => c.id === cid ? { ...c, subs: (c.subs || []).filter(s => s.id !== sid) } : c));

  const save = async () => {
    const clean = list
      .filter(c => (c.name || '').trim() || (c.nameEN || '').trim())
      .map(c => ({ ...c, subs: (c.subs || []).filter(s => (s.name || '').trim() || (s.nameEN || '').trim()) }));
    setCategories(clean);
    if (cloudOn) {
      try {
        if (window.UNI_DB.saveCategoriesBulk) await window.UNI_DB.saveCategoriesBulk(clean);
        if (window.UNI_DB.deleteCategory) for (const id of removedIds) await window.UNI_DB.deleteCategory(id);
      } catch (e) { console.warn('save categories:', e); }
    }
    notify(L('บันทึกหมวดหมู่แล้ว ✓', 'Categories saved ✓'), 'success');
    onClose();
  };

  const lbl = { fontSize: 11, color: 'var(--txt3)', marginBottom: 2 };
  const inp = { width: '100%' };

  return (
    <Modal title={'🏷️ ' + L('จัดการหมวดหมู่ยา', 'Manage Drug Categories')} onClose={onClose} size={780}
      footer={<>
        <button className="btn btn-ghost" onClick={onClose}>{L('ยกเลิก', 'Cancel')}</button>
        <button className="btn btn-primary" onClick={save}>💾 {L('บันทึก', 'Save')}</button>
      </>}>
      <div style={{ fontSize: 12, color: 'var(--txt3)', marginBottom: 12 }}>
        {L('เพิ่ม/แก้ไข/ลบ หมวดหลักและหมวดย่อย (2 ภาษา) — บันทึกแล้วแชร์ขึ้นคลาวด์',
          'Add/edit/delete main & sub-categories (bilingual) — saved & shared to the cloud')}
      </div>

      {list.map((c, ci) => (
        <div key={c.id} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 12, marginBottom: 12, background: 'var(--bg2)' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <div style={{ width: 44 }}>
              <div style={lbl}>{L('สี', 'Color')}</div>
              <input type="color" value={c.color || '#1177cc'} onChange={e => updateCat(c.id, 'color', e.target.value)}
                style={{ width: 40, height: 34, padding: 0, border: '1px solid var(--border)', borderRadius: 6, background: 'none', cursor: 'pointer' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={lbl}>{ci + 1}. {L('ชื่อหมวดหลัก (ไทย)', 'Main category (TH)')}</div>
              <input className="input" style={inp} value={c.name || ''} onChange={e => updateCat(c.id, 'name', e.target.value)} placeholder={L('เช่น โรคหัวใจและหลอดเลือด', 'e.g., Cardiovascular')} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={lbl}>{L('ชื่อหมวดหลัก (อังกฤษ)', 'Main category (EN)')}</div>
              <input className="input" style={inp} value={c.nameEN || ''} onChange={e => updateCat(c.id, 'nameEN', e.target.value)} placeholder="e.g., Cardiovascular Disease" />
            </div>
            <button className="btn btn-ghost" style={{ padding: '8px 10px', color: 'var(--err)' }}
              title={L('ลบหมวดหลัก', 'Delete category')} onClick={() => removeCat(c.id)}>🗑</button>
          </div>

          {drugCount(c.id) > 0 && (
            <div style={{ fontSize: 11, color: 'var(--warn)', marginTop: 6 }}>
              ⚠️ {L('มียา', 'Has')} {drugCount(c.id)} {L('รายการในหมวดนี้ (ถ้าลบ ยาจะกลายเป็นไม่มีหมวด)', 'drugs (deleting leaves them uncategorized)')}
            </div>
          )}

          {/* Sub-categories */}
          <div style={{ marginTop: 10, marginLeft: 16, borderLeft: '2px solid var(--border)', paddingLeft: 12 }}>
            {(c.subs || []).map((s, si) => (
              <div key={s.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: 6 }}>
                <div style={{ width: 36, fontSize: 11, color: 'var(--txt4)', paddingBottom: 8 }}>{ci + 1}.{si + 1}</div>
                <div style={{ flex: 1 }}>
                  {si === 0 && <div style={lbl}>{L('หมวดย่อย (ไทย)', 'Sub-category (TH)')}</div>}
                  <input className="input" style={inp} value={s.name || ''} onChange={e => updateSub(c.id, s.id, 'name', e.target.value)} placeholder={L('เช่น ยาลดความดัน', 'e.g., Antihypertensives')} />
                </div>
                <div style={{ flex: 1 }}>
                  {si === 0 && <div style={lbl}>{L('หมวดย่อย (อังกฤษ)', 'Sub-category (EN)')}</div>}
                  <input className="input" style={inp} value={s.nameEN || ''} onChange={e => updateSub(c.id, s.id, 'nameEN', e.target.value)} placeholder="e.g., Antihypertensives" />
                </div>
                <button className="btn btn-ghost" style={{ padding: '6px 8px', color: 'var(--err)' }}
                  title={L('ลบหมวดย่อย', 'Delete sub')} onClick={() => removeSub(c.id, s.id)}>✕</button>
              </div>
            ))}
            <button className="btn btn-ghost btn-sm" style={{ fontSize: 12, marginTop: 4 }} onClick={() => addSub(c.id)}>
              + {L('เพิ่มหมวดย่อย', 'Add sub-category')}
            </button>
          </div>
        </div>
      ))}

      <button className="btn btn-primary" style={{ width: '100%' }} onClick={addCat}>
        + {L('เพิ่มหมวดหลัก', 'Add main category')}
      </button>
    </Modal>
  );
}
Object.assign(window, { CategoryManagerModal });

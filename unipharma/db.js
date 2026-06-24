// ============================================================
// UNIPHARMA — Cloud data layer (Supabase)  [plain JS, no JSX]
// ------------------------------------------------------------
// Exposes a small async API on window.UNI_DB. If Supabase is not
// configured (config.js empty) or the library failed to load, every
// method is a safe no-op and `enabled` is false — the app then runs
// exactly as before, on localStorage only.
//
// Storage strategy: each entity row keeps its FULL app object in a
// `data` jsonb column, so what we read back is the exact shape the UI
// already uses. We only map a few flat columns for indexing on write.
// ============================================================
(function () {
  var cfg = window.UNI_CONFIG || {};
  var url = (cfg.SUPABASE_URL || "").trim();
  var key = (cfg.SUPABASE_ANON_KEY || "").trim();
  var lib = window.supabase; // supabase-js UMD global
  var client = null;

  if (url && key && lib && typeof lib.createClient === "function") {
    try {
      client = lib.createClient(url, key);
    } catch (e) {
      console.warn("[UNI_DB] Supabase init failed:", e);
      client = null;
    }
  }

  var enabled = !!client;

  // ---- write mappers: app object -> table row ----
  function drugRow(d) {
    return {
      code: d.code, name_th: d.nameTH, name_en: d.nameEN,
      cat_id: d.catId, sub_id: d.subId, supplier_id: d.supplierId,
      has_vat: !!d.hasVat, cost_ex: d.costEx, sell_ex: d.sellEx,
      total_stock: d.totalStock, data: d,
    };
  }
  function supplierRow(s) {
    return {
      id: s.id, code: s.code, name: s.name, name_en: s.nameEN,
      category: s.category, data: s,
    };
  }
  function poRow(p) {
    return {
      id: p.id, po_number: p.poNumber, branch: p.branch,
      supplier_id: p.supplierId, status: p.status, po_date: p.poDate,
      grand_total: p.grandTotal, is_non_po: !!p.isNonPO, data: p,
    };
  }
  function oosRow(r) {
    return {
      id: r.id, product_code: r.productCode || "", product_name: r.productName || "",
      notes: r.notes || "", image: r.image || null, reported_by: r.reportedBy || "",
      period_start: r.periodStart || null, created_at: r.createdAt,
      resolved_at: r.resolvedAt || null, resolved_by: r.resolvedBy || null,
    };
  }
  function oosFromRow(row) {
    return {
      id: row.id, productCode: row.product_code, productName: row.product_name,
      notes: row.notes, image: row.image, reportedBy: row.reported_by,
      periodStart: row.period_start, createdAt: row.created_at,
      resolvedAt: row.resolved_at || null, resolvedBy: row.resolved_by || null,
      timestamp: new Date(row.created_at).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
    };
  }
  function categoryRow(c) {
    return { id: c.id, name_th: c.name || "", name_en: c.nameEN || "", color: c.color || null, subs: c.subs || [] };
  }
  function categoryFromRow(row) {
    return { id: row.id, name: row.name_th, nameEN: row.name_en, color: row.color, subs: row.subs || [] };
  }

  // chunk helper for large bulk upserts (10k+ drugs)
  function chunk(arr, n) {
    var out = [];
    for (var i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
    return out;
  }

  async function selectAll(table) {
    // First, get the total count so we can fetch all pages in parallel
    // (10k+ rows over sequential requests is too slow on first load).
    var size = 1000;
    var head = await client.from(table).select("data", { count: "exact", head: true });
    if (head.error) throw head.error;
    var total = head.count || 0;
    if (total === 0) return [];
    var pages = Math.ceil(total / size);
    var jobs = [];
    for (var p = 0; p < pages; p++) {
      jobs.push(client.from(table).select("data").range(p * size, p * size + size - 1));
    }
    var results = await Promise.all(jobs);
    var all = [];
    for (var i = 0; i < results.length; i++) {
      if (results[i].error) throw results[i].error;
      var rows = results[i].data || [];
      for (var j = 0; j < rows.length; j++) all.push(rows[j].data);
    }
    return all;
  }

  window.UNI_DB = {
    enabled: enabled,
    requireLogin: enabled && !!cfg.REQUIRE_LOGIN,

    // Returns {drugs,suppliers,orders} from the cloud, or null if not
    // enabled / nothing stored yet.
    async loadAll() {
      if (!enabled) return null;
      try {
        // Run startup SQL (warehouse auto-sync) BEFORE loading — so fetched data is already updated
        var startupSql = '';
        try { startupSql = (localStorage.getItem('uni_startup_sql') || '').trim(); } catch(e) {}
        if (startupSql) {
          try {
            var sr = await client.rpc('exec_sql', { sql: startupSql });
            var status = sr.error ? ('error: ' + (sr.error.message || sr.error)) : 'ok';
            try { localStorage.setItem('uni_startup_sql_last_run', new Date().toISOString()); localStorage.setItem('uni_startup_sql_last_status', status); } catch(e) {}
            if (sr.error) console.warn('[UNI_DB] Startup SQL error:', sr.error);
            else console.info('[UNI_DB] Startup SQL executed OK');
          } catch(e) {
            try { localStorage.setItem('uni_startup_sql_last_status', 'error: ' + (e.message || String(e))); } catch(_) {}
            console.warn('[UNI_DB] Startup SQL failed (continuing):', e);
          }
        }

        // Fetch all three tables in parallel instead of sequentially
        var results = await Promise.all([
          selectAll("drugs"),
          selectAll("suppliers"),
          selectAll("purchase_orders"),
        ]);
        var drugs = results[0], suppliers = results[1], orders = results[2];
        if (!drugs.length && !suppliers.length && !orders.length) return null;
        // Normalize bilingual fields on load so EN mode never shows blank or drug-code as name
        drugs = drugs.map(function(d) {
          var en = (d.nameEN || '').trim();
          if (!en || en === d.code) en = (d.nameTH || d.code || '');
          return en === d.nameEN ? d : Object.assign({}, d, { nameEN: en });
        });
        suppliers = suppliers.map(function(s) {
          var en = (s.nameEN || '').trim();
          return en ? s : Object.assign({}, s, { nameEN: (s.name || s.id || '') });
        });
        // newest POs first
        orders.sort(function (a, b) {
          return (b.poDate || "").localeCompare(a.poDate || "");
        });
        return { drugs: drugs, suppliers: suppliers, orders: orders };
      } catch (e) {
        console.warn("[UNI_DB] loadAll failed:", e);
        return null;
      }
    },

    async isEmpty() {
      if (!enabled) return true;
      try {
        var res = await client.from("drugs").select("code", { count: "exact", head: true });
        return !res.count;
      } catch (e) { return true; }
    },

    // Run arbitrary SQL via the exec_sql Postgres function.
    // Returns { rows, rowsAffected } — throws on error.
    async execSql(sql) {
      if (!enabled) throw new Error('Supabase not configured');
      const { data, error } = await client.rpc('exec_sql', { sql });
      if (error) throw error;
      // SELECT → array of row objects; DML → { rowsAffected, type:'write' }
      if (Array.isArray(data)) return { rows: data, rowsAffected: data.length };
      return { rows: [], rowsAffected: data?.rowsAffected ?? 0 };
    },

    async saveDrug(d) {
      if (!enabled) return;
      try { await client.from("drugs").upsert(drugRow(d)); }
      catch (e) { console.warn("[UNI_DB] saveDrug:", e); }
    },
    async saveSupplier(s) {
      if (!enabled) return;
      try { await client.from("suppliers").upsert(supplierRow(s)); }
      catch (e) { console.warn("[UNI_DB] saveSupplier:", e); }
    },
    async savePO(p) {
      if (!enabled) return;
      try { await client.from("purchase_orders").upsert(poRow(p)); }
      catch (e) { console.warn("[UNI_DB] savePO:", e); }
    },
    async savePOWithUnits(p, items, drugs) {
      if (!enabled) return;
      try {
        await client.from("purchase_orders").upsert(poRow(p));
        for (const item of items) {
          const drug = drugs.find(d => d.code === item.code);
          if (drug && drug.unit !== item.unit) {
            await client.from("drugs").upsert(drugRow({ ...drug, unit: item.unit }));
          }
        }
      }
      catch (e) { console.warn("[UNI_DB] savePOWithUnits:", e); }
    },
    async deleteDrug(code) {
      if (!enabled) return;
      try { await client.from("drugs").delete().eq("code", code); }
      catch (e) { console.warn("[UNI_DB] deleteDrug:", e); }
    },
    async deletePO(id) {
      if (!enabled) return;
      try { await client.from("purchase_orders").delete().eq("id", id); }
      catch (e) { console.warn("[UNI_DB] deletePO:", e); }
    },

    // Bulk push — used by Data Sync import & first-time seed.
    async saveDrugsBulk(arr) {
      if (!enabled || !arr || !arr.length) return;
      for (var c of chunk(arr.map(drugRow), 500)) {
        var res = await client.from("drugs").upsert(c);
        if (res.error) throw res.error;
      }
    },
    async saveSuppliersBulk(arr) {
      if (!enabled || !arr || !arr.length) return;
      for (var c of chunk(arr.map(supplierRow), 500)) {
        var res = await client.from("suppliers").upsert(c);
        if (res.error) throw res.error;
      }
    },
    async saveOrdersBulk(arr) {
      if (!enabled || !arr || !arr.length) return;
      for (var c of chunk(arr.map(poRow), 500)) {
        var res = await client.from("purchase_orders").upsert(c);
        if (res.error) throw res.error;
      }
    },

    async logSync(source, kind, count) {
      if (!enabled) return;
      try { await client.from("sync_history").insert({ source: source, kind: kind, count: count }); }
      catch (e) { /* non-critical */ }
    },

    // ---- Out of stock reports (shared across all users) ----
    async loadOutOfStock(sinceISO) {
      if (!enabled) return null;
      try {
        var q = client.from("out_of_stock").select("*").order("created_at", { ascending: true });
        if (sinceISO) q = q.gte("created_at", sinceISO);
        var res = await q;
        if (res.error) throw res.error;
        return (res.data || []).map(oosFromRow);
      } catch (e) { console.warn("[UNI_DB] loadOutOfStock:", e); return null; }
    },
    async saveOutOfStock(report) {
      if (!enabled) return false;
      try {
        var res = await client.from("out_of_stock").upsert(oosRow(report));
        if (res.error) throw res.error;
        return true;
      } catch (e) { console.warn("[UNI_DB] saveOutOfStock:", e); return false; }
    },
    async deleteOutOfStock(id) {
      if (!enabled) return;
      try { await client.from("out_of_stock").delete().eq("id", id); }
      catch (e) { console.warn("[UNI_DB] deleteOutOfStock:", e); }
    },
    // ---- Drug categories (shared master list) ----
    async loadCategories() {
      if (!enabled) return null;
      try {
        var res = await client.from("categories").select("*").order("id", { ascending: true });
        if (res.error) throw res.error;
        return (res.data || []).map(categoryFromRow);
      } catch (e) { console.warn("[UNI_DB] loadCategories:", e); return null; }
    },
    async saveCategoriesBulk(arr) {
      if (!enabled || !arr || !arr.length) return false;
      try {
        var res = await client.from("categories").upsert(arr.map(categoryRow));
        if (res.error) throw res.error;
        return true;
      } catch (e) { console.warn("[UNI_DB] saveCategoriesBulk:", e); return false; }
    },
    async deleteCategory(id) {
      if (!enabled) return;
      try { await client.from("categories").delete().eq("id", id); }
      catch (e) { console.warn("[UNI_DB] deleteCategory:", e); }
    },

    // Soft-remove: mark handled (kept in the table as history/statistics).
    async setOutOfStockResolved(id, by) {
      if (!enabled) return false;
      try {
        var res = await client.from("out_of_stock")
          .update({ resolved_at: new Date().toISOString(), resolved_by: by || "" })
          .eq("id", id);
        if (res.error) throw res.error;
        return true;
      } catch (e) { console.warn("[UNI_DB] setOutOfStockResolved:", e); return false; }
    },
    // Live subscription for the out_of_stock table. cb() is called on any change.
    onOutOfStockChange(cb) {
      if (!enabled || !client.channel) return function () {};
      var ch = client.channel("uni-oos-" + Math.random().toString(36).slice(2))
        .on("postgres_changes", { event: "*", schema: "public", table: "out_of_stock" }, function () { cb(); })
        .subscribe();
      return function () { try { client.removeChannel(ch); } catch (e) {} };
    },
    // Live subscription for master/transactional data. cb(kind, payload) per change.
    onDataChange(cb) {
      if (!enabled || !client.channel) return function () {};
      var ch = client.channel("uni-data-" + Math.random().toString(36).slice(2))
        .on("postgres_changes", { event: "*", schema: "public", table: "drugs" }, function (p) { cb("drugs", p); })
        .on("postgres_changes", { event: "*", schema: "public", table: "suppliers" }, function (p) { cb("suppliers", p); })
        .on("postgres_changes", { event: "*", schema: "public", table: "purchase_orders" }, function (p) { cb("orders", p); })
        .on("postgres_changes", { event: "*", schema: "public", table: "categories" }, function (p) { cb("categories", p); })
        .subscribe();
      return function () { try { client.removeChannel(ch); } catch (e) {} };
    },

    // ---- Authentication ----
    async getSession() {
      if (!enabled) return null;
      try { const { data } = await client.auth.getSession(); return (data.session && data.session.user) ? data.session : null; }
      catch (e) { return null; }
    },
    async signIn(email, password) {
      if (!enabled) return { error: "Cloud not configured" };
      const { data, error } = await client.auth.signInWithPassword({ email: email, password: password });
      return { session: data && data.session, error: error && error.message };
    },
    async signOut() {
      if (!enabled) return;
      try { await client.auth.signOut(); } catch (e) {}
    },
    // role of the logged-in user: 'admin' | 'manager' | 'viewer'
    // Retries a few times: right after login the profile row can be briefly
    // unreadable (auth context / RLS settling), and we must NOT downgrade a
    // real admin/manager to viewer because of that transient miss.
    async getMyRole() {
      if (!enabled) return null;
      try {
        const { data: u } = await client.auth.getUser();
        if (!u || !u.user) return null;
        for (var attempt = 0; attempt < 4; attempt++) {
          var res = await client.from("profiles").select("role, full_name, email").eq("id", u.user.id).maybeSingle();
          if (!res.error && res.data) {
            return { role: res.data.role, full_name: res.data.full_name, email: res.data.email };
          }
          await new Promise(function (r) { setTimeout(r, 400); });
        }
        // Profile genuinely missing after retries → safe default.
        return { role: "viewer", email: u.user.email };
      } catch (e) { return { role: "viewer" }; }
    },
    onAuthChange(cb) {
      if (!enabled || !client.auth.onAuthStateChange) return function () {};
      const { data } = client.auth.onAuthStateChange(function (_evt, session) { cb(session); });
      return function () { data && data.subscription && data.subscription.unsubscribe(); };
    },

    _client: client,
  };

  if (enabled) console.info("[UNI_DB] Supabase cloud sync ENABLED.");
  else console.info("[UNI_DB] Running offline (localStorage only).");
})();

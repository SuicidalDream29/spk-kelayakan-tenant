let kriteriaList = [];
let allData = [];
let filtered = [];

function escHtml(str) {
  return String(str).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

function renderSummary() {
  const total   = allData.length;
  const lengkap = allData.filter(d => kriteriaList.every(k => d.nilaiMap[k.id] !== undefined)).length;
  const belum   = total - lengkap;
  document.getElementById("summaryCards").innerHTML = `
    <div class="stat-card">
      <div class="stat-icon" style="background:#eff6ff"><i class="bi bi-people" style="color:#3b82f6"></i></div>
      <div class="stat-body"><div class="stat-value">${total}</div><div class="stat-label">Total Tenant</div></div>
    </div>
    <div class="stat-card">
      <div class="stat-icon" style="background:#f0fdf4"><i class="bi bi-check-circle" style="color:#22c55e"></i></div>
      <div class="stat-body"><div class="stat-value">${lengkap}</div><div class="stat-label">Nilai Lengkap</div></div>
    </div>
    <div class="stat-card">
      <div class="stat-icon" style="background:#fff7ed"><i class="bi bi-exclamation-circle" style="color:#f97316"></i></div>
      <div class="stat-body"><div class="stat-value">${belum}</div><div class="stat-label">Belum Lengkap</div></div>
    </div>
    <div class="stat-card">
      <div class="stat-icon" style="background:#faf5ff"><i class="bi bi-sliders" style="color:#a855f7"></i></div>
      <div class="stat-body"><div class="stat-value">${kriteriaList.length}</div><div class="stat-label">Jumlah Kriteria</div></div>
    </div>`;
}

function renderHead() {
  document.getElementById("matrixHead").innerHTML = `
    <tr>
      <th style="min-width:40px">#</th>
      <th style="min-width:160px">Nama Tenant</th>
      ${kriteriaList.map(k => `
        <th style="min-width:120px;text-align:center">
          ${escHtml(k.nama)}
          <br><span class="badge ${k.jenis==='benefit'?'badge-green':'badge-orange'}" style="font-size:10px;margin-top:3px">${k.jenis} &middot; ${k.bobot}</span>
        </th>`).join("")}
      <th style="min-width:110px;text-align:center">Status</th>
      <th style="min-width:70px;text-align:center">Aksi</th>
    </tr>`;
}

function applyFilter() {
  const q = (document.getElementById("searchInput").value || "").toLowerCase();
  filtered = q ? allData.filter(d => d.tenant.nama.toLowerCase().includes(q)) : [...allData];
  renderBody();
  document.getElementById("tableInfo").textContent =
    filtered.length === allData.length
      ? `${allData.length} tenant`
      : `${filtered.length} dari ${allData.length} tenant`;
}

function renderBody() {
  const tbody = document.getElementById("matrixBody");
  if (!filtered.length) {
    const cols = 3 + kriteriaList.length;
    tbody.innerHTML = `<tr><td colspan="${cols}" style="text-align:center;padding:32px;color:#94a3b8">Tidak ada data.</td></tr>`;
    return;
  }
  tbody.innerHTML = filtered.map(d => {
    const isLengkap = kriteriaList.every(k => d.nilaiMap[k.id] !== undefined);
    const cells = kriteriaList.map(k => {
      const val = d.nilaiMap[k.id];
      return `<td style="text-align:center">
        ${val !== undefined
          ? `<strong>${val}</strong>`
          : `<span style="color:#d1d5db;font-size:18px">&mdash;</span>`}
      </td>`;
    }).join("");
    return `<tr>
      <td style="color:#94a3b8">#${d.tenant.id}</td>
      <td>
        <strong>${escHtml(d.tenant.nama)}</strong><br>
        <span style="font-size:11px;color:#94a3b8;font-family:monospace">${escHtml(d.tenant.nik)}</span>
      </td>
      ${cells}
      <td style="text-align:center">
        ${isLengkap
          ? '<span class="badge badge-green"><i class="bi bi-check-circle"></i> Lengkap</span>'
          : '<span class="badge badge-orange"><i class="bi bi-exclamation-circle"></i> Belum</span>'}
      </td>
      <td style="text-align:center">
        <button class="btn btn-ghost btn-sm btn-icon" title="Edit Nilai"
          data-action="edit" data-id="${d.tenant.id}">
          <i class="bi bi-pencil-square"></i>
        </button>
      </td>
    </tr>`;
  }).join("");
}

function openEditModal(tenantData) {
  const { tenant, nilaiMap } = tenantData;
  document.getElementById("nilaiTenantNama").textContent = tenant.nama;
  document.getElementById("nilaiFields").innerHTML = kriteriaList.map(k => `
    <div class="form-group">
      <label class="form-label">
        ${escHtml(k.nama)}
        <span class="badge ${k.jenis==='benefit'?'badge-green':'badge-orange'}" style="margin-left:6px">${k.jenis}</span>
      </label>
      <input type="number" step="any" class="form-control" id="nilai_${k.id}"
        placeholder="Masukkan nilai"
        value="${nilaiMap[k.id] !== undefined ? nilaiMap[k.id] : ''}"
        required>
    </div>`).join("");

  document.getElementById("formNilai").onsubmit = async (ev) => {
    ev.preventDefault();
    const btn = document.getElementById("btnSubmitNilai");
    btn.disabled = true; btn.innerHTML = '<span class="spinner"></span>';
    const nilai = kriteriaList.map(k => ({
      kriteria_id: k.id,
      nilai: parseFloat(document.getElementById(`nilai_${k.id}`).value)
    }));
    try {
      await api.post(`/tenants/${tenant.id}/nilai`, { nilai });
      closeModal("modalNilai");
      toast("Nilai berhasil disimpan", "success");
      load();
    } catch(err) { toast(err.message, "error"); }
    finally { btn.disabled = false; btn.textContent = "Simpan Nilai"; }
  };
  openModal("modalNilai");
}

document.getElementById("matrixBody").addEventListener("click", e => {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;
  const id = parseInt(btn.dataset.id);
  const d  = allData.find(x => x.tenant.id === id);
  if (d) openEditModal(d);
});

document.getElementById("searchInput").addEventListener("input", applyFilter);
document.getElementById("btnRefresh").addEventListener("click", load);

async function load() {
  const cols = 3 + (kriteriaList.length || 1);
  document.getElementById("matrixBody").innerHTML =
    `<tr><td colspan="${cols}"><div class="empty-state"><span class="spinner"></span></div></td></tr>`;

  const [tenants, kriteria] = await Promise.all([api.get("/tenants/"), api.get("/kriteria/")]);
  kriteriaList = kriteria;

  allData = await Promise.all(tenants.map(async t => {
    try {
      const rows = await api.get(`/tenants/${t.id}/nilai`);
      const nilaiMap = {};
      rows.forEach(r => { nilaiMap[r.kriteria_id] = r.nilai; });
      return { tenant: t, nilaiMap };
    } catch {
      return { tenant: t, nilaiMap: {} };
    }
  }));

  document.getElementById("lastUpdated").textContent =
    "Diperbarui: " + new Date().toLocaleTimeString("id-ID");

  renderSummary();
  renderHead();
  applyFilter();
}

load();

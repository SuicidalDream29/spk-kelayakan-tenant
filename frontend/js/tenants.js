let editId = null;
let kriteriaList = [];
let tenantsData  = [];

function escHtml(str) {
  return String(str).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

const table = new TableManager({
  tbodyId:  "tbody",
  searchId: "searchInput",
  infoId:   "tableInfo",
  columns: [
    { key: "id",      numeric: true },
    { key: "nama" },
    { key: "nik" },
    { key: "no_telp" },
    { key: "alamat" },
    { key: "nilai_lengkap", numeric: true },
  ],
  emptyMsg: "Belum ada data tenant.",
  renderRow: t => `
    <tr>
      <td style="color:#94a3b8">#${t.id}</td>
      <td><strong>${escHtml(t.nama)}</strong></td>
      <td style="font-family:monospace;font-size:12px">${escHtml(t.nik)}</td>
      <td>${escHtml(t.no_telp)}</td>
      <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"
          title="${escHtml(t.alamat)}">${escHtml(t.alamat)}</td>
      <td>
        ${t.nilai_lengkap
          ? '<span class="badge badge-green"><i class="bi bi-check-circle"></i> Lengkap</span>'
          : '<span class="badge badge-orange"><i class="bi bi-exclamation-circle"></i> Belum diisi</span>'}
      </td>
      <td>
        <button class="btn btn-ghost btn-sm btn-icon" title="Input Nilai"
          data-action="nilai" data-id="${t.id}"><i class="bi bi-clipboard-data"></i></button>
        <button class="btn btn-ghost btn-sm btn-icon" title="Edit"
          data-action="edit" data-id="${t.id}"><i class="bi bi-pencil"></i></button>
        <button class="btn btn-ghost btn-sm btn-icon" title="Hapus" style="color:#ef4444"
          data-action="hapus" data-id="${t.id}"><i class="bi bi-trash"></i></button>
      </td>
    </tr>`,
});

async function load() {
  const [tenants, kriteria] = await Promise.all([api.get("/tenants/"), api.get("/kriteria/")]);
  kriteriaList = kriteria;

  // Enrich each tenant with nilai_lengkap flag
  const enriched = await Promise.all(tenants.map(async t => {
    try {
      const nilaiRows = await api.get(`/tenants/${t.id}/nilai`);
      const filled = kriteriaList.every(k => nilaiRows.some(n => n.kriteria_id === k.id));
      return { ...t, _nilaiRows: nilaiRows, nilai_lengkap: filled };
    } catch {
      return { ...t, _nilaiRows: [], nilai_lengkap: false };
    }
  }));

  tenantsData = enriched;
  table.setData(enriched);
}

function resetForm() {
  editId = null;
  document.getElementById("formTenant").reset();
  document.getElementById("modalTitle").textContent = "Tambah Tenant";
}

document.getElementById("tbody").addEventListener("click", async e => {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;
  const id = parseInt(btn.dataset.id);
  const t  = tenantsData.find(x => x.id === id);
  if (!t) return;

  if (btn.dataset.action === "edit") {
    editId = id;
    document.getElementById("nama").value    = t.nama;
    document.getElementById("nik").value     = t.nik;
    document.getElementById("no_telp").value = t.no_telp;
    document.getElementById("alamat").value  = t.alamat;
    document.getElementById("modalTitle").textContent = "Edit Tenant";
    openModal("modalTenant");
  }

  if (btn.dataset.action === "nilai") {
    if (!kriteriaList.length) { toast("Tambahkan kriteria dulu sebelum input nilai", "error"); return; }
    document.getElementById("nilaiTenantNama").textContent = t.nama;

    // Pre-fill existing values
    const existingMap = {};
    (t._nilaiRows || []).forEach(n => { existingMap[n.kriteria_id] = n.nilai; });

    document.getElementById("nilaiFields").innerHTML = kriteriaList.map(k => `
      <div class="form-group">
        <label class="form-label">
          ${escHtml(k.nama)}
          <span class="badge ${k.jenis === 'benefit' ? 'badge-green' : 'badge-orange'}" style="margin-left:6px">${k.jenis}</span>
        </label>
        <input type="number" step="any" class="form-control" id="nilai_${k.id}"
          placeholder="Masukkan nilai"
          value="${existingMap[k.id] !== undefined ? existingMap[k.id] : ''}"
          required>
      </div>`).join("");

    document.getElementById("formNilai").onsubmit = async (ev) => {
      ev.preventDefault();
      const submitBtn = document.getElementById("btnSubmitNilai");
      submitBtn.disabled = true; submitBtn.innerHTML = '<span class="spinner"></span>';
      const nilai = kriteriaList.map(k => ({
        kriteria_id: k.id,
        nilai: parseFloat(document.getElementById(`nilai_${k.id}`).value)
      }));
      try {
        await api.post(`/tenants/${id}/nilai`, { nilai });
        closeModal("modalNilai");
        toast("Nilai berhasil disimpan", "success");
        load();
      } catch(err) { toast(err.message, "error"); }
      finally { submitBtn.disabled = false; submitBtn.textContent = "Simpan Nilai"; }
    };
    openModal("modalNilai");
  }

  if (btn.dataset.action === "hapus") {
    if (!confirm("Hapus tenant ini?")) return;
    try { await api.delete(`/tenants/${id}`); toast("Tenant berhasil dihapus", "success"); load(); }
    catch(err) { toast(err.message, "error"); }
  }
});

async function submitTenant(e) {
  e.preventDefault();
  const btn = document.getElementById("btnSubmitTenant");
  btn.disabled = true; btn.innerHTML = '<span class="spinner"></span>';
  const payload = {
    nama:    document.getElementById("nama").value,
    nik:     document.getElementById("nik").value,
    no_telp: document.getElementById("no_telp").value,
    alamat:  document.getElementById("alamat").value,
  };
  try {
    if (editId) await api.put(`/tenants/${editId}`, payload);
    else        await api.post("/tenants/", payload);
    closeModal("modalTenant");
    toast(editId ? "Tenant berhasil diperbarui" : "Tenant berhasil ditambahkan", "success");
    load();
  } catch(err) {
    toast(err.message, "error");
  } finally {
    btn.disabled = false; btn.textContent = "Simpan";
  }
}

load();

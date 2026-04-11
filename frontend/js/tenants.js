let editId = null;
let kriteriaList = [];
let tenantsData  = [];

function escHtml(str) {
  return String(str).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

async function load() {
  const [tenants, kriteria] = await Promise.all([api.get("/tenants/"), api.get("/kriteria/")]);
  kriteriaList = kriteria;
  tenantsData  = tenants;
  document.getElementById("tenantCount").textContent = `${tenants.length} tenant terdaftar`;

  document.getElementById("tbody").innerHTML = tenants.length ? tenants.map(t => `
    <tr>
      <td style="color:#94a3b8">#${t.id}</td>
      <td><strong>${escHtml(t.nama)}</strong></td>
      <td style="font-family:monospace;font-size:12px">${escHtml(t.nik)}</td>
      <td>${escHtml(t.no_telp)}</td>
      <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"
          title="${escHtml(t.alamat)}">${escHtml(t.alamat)}</td>
      <td>
        <button class="btn btn-ghost btn-sm btn-icon" title="Input Nilai"
          data-action="nilai" data-id="${t.id}"><i class="bi bi-clipboard-data"></i></button>
        <button class="btn btn-ghost btn-sm btn-icon" title="Edit"
          data-action="edit" data-id="${t.id}"><i class="bi bi-pencil"></i></button>
        <button class="btn btn-ghost btn-sm btn-icon" title="Hapus" style="color:#ef4444"
          data-action="hapus" data-id="${t.id}"><i class="bi bi-trash"></i></button>
      </td>
    </tr>`).join("") :
    `<tr><td colspan="6"><div class="empty-state"><i class="bi bi-people"></i><p>Belum ada data tenant.</p></div></td></tr>`;
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
    document.getElementById("nilaiFields").innerHTML = kriteriaList.map(k => `
      <div class="form-group">
        <label class="form-label">
          ${escHtml(k.nama)}
          <span class="badge ${k.jenis === 'benefit' ? 'badge-green' : 'badge-orange'}" style="margin-left:6px">${k.jenis}</span>
        </label>
        <input type="number" step="any" class="form-control" id="nilai_${k.id}" placeholder="Masukkan nilai" required>
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

function resetForm() {
  editId = null;
  document.getElementById("formTenant").reset();
  document.getElementById("modalTitle").textContent = "Tambah Tenant";
}

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

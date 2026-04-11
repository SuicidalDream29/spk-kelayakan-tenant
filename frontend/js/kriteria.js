let editId = null;
let kriteriaData = [];

async function load() {
  const data = await api.get("/kriteria/");
  kriteriaData = data;
  const total = data.reduce((s, k) => s + k.bobot, 0);
  document.getElementById("bobotTotal").textContent = `Total bobot: ${total.toFixed(2)}`;

  document.getElementById("tbody").innerHTML = data.length ? data.map(k => `
    <tr>
      <td style="color:#94a3b8">#${k.id}</td>
      <td><strong>${escHtml(k.nama)}</strong></td>
      <td>${k.bobot}</td>
      <td><span class="badge ${k.jenis === 'benefit' ? 'badge-green' : 'badge-orange'}">${k.jenis}</span></td>
      <td>
        <button class="btn btn-ghost btn-sm btn-icon" title="Edit"
          data-action="edit" data-id="${k.id}"><i class="bi bi-pencil"></i></button>
        <button class="btn btn-ghost btn-sm btn-icon" title="Hapus" style="color:#ef4444"
          data-action="hapus" data-id="${k.id}"><i class="bi bi-trash"></i></button>
      </td>
    </tr>`).join("") :
    `<tr><td colspan="5"><div class="empty-state"><i class="bi bi-sliders"></i><p>Belum ada kriteria.</p></div></td></tr>`;
}

function escHtml(str) {
  return String(str).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

document.getElementById("tbody").addEventListener("click", async e => {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;
  const id = parseInt(btn.dataset.id);
  const k  = kriteriaData.find(x => x.id === id);
  if (btn.dataset.action === "edit" && k) {
    editId = id;
    document.getElementById("nama").value  = k.nama;
    document.getElementById("bobot").value = k.bobot;
    document.getElementById("jenis").value = k.jenis;
    document.getElementById("modalTitle").textContent = "Edit Kriteria";
    openModal("modalKriteria");
  }
  if (btn.dataset.action === "hapus") {
    if (!confirm("Hapus kriteria ini? Data nilai tenant terkait akan ikut terhapus.")) return;
    try {
      await api.delete(`/kriteria/${id}`);
      toast("Kriteria berhasil dihapus", "success");
      load();
    } catch(err) { toast(err.message, "error"); }
  }
});

function resetForm() {
  editId = null;
  document.getElementById("form").reset();
  document.getElementById("modalTitle").textContent = "Tambah Kriteria";
}

async function submitForm(e) {
  e.preventDefault();
  const btn = document.getElementById("btnSubmit");
  btn.disabled = true; btn.innerHTML = '<span class="spinner"></span>';
  const payload = {
    nama:  document.getElementById("nama").value,
    bobot: parseFloat(document.getElementById("bobot").value),
    jenis: document.getElementById("jenis").value,
  };
  try {
    if (editId) await api.put(`/kriteria/${editId}`, payload);
    else        await api.post("/kriteria/", payload);
    closeModal("modalKriteria");
    toast(editId ? "Kriteria berhasil diperbarui" : "Kriteria berhasil ditambahkan", "success");
    load();
  } catch(err) {
    toast(err.message, "error");
  } finally {
    btn.disabled = false; btn.textContent = "Simpan";
  }
}

load();

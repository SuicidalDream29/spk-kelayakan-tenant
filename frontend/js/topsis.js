const rankClass = r => r === 1 ? "rank-1" : r === 2 ? "rank-2" : r === 3 ? "rank-3" : "rank-n";
let polling = null;

const table = new TableManager({
  tbodyId:  "tbody",
  searchId: "searchInput",
  infoId:   "tableInfo",
  columns: [
    { key: "ranking",          numeric: true },
    { key: "tenant.nama",      label: "Nama" },
    { key: "tenant.nik",       label: "NIK" },
    { key: "nilai_preferensi", numeric: true },
    { key: "status" },
  ],
  emptyMsg: "Belum ada hasil kalkulasi.",
  renderRow: h => `
    <tr>
      <td><span class="rank-badge ${rankClass(h.ranking)}">${h.ranking}</span></td>
      <td><strong>${h.tenant.nama}</strong></td>
      <td style="font-family:monospace;font-size:12px;color:#64748b">${h.tenant.nik}</td>
      <td>
        <div style="display:flex;align-items:center;gap:8px">
          <div style="flex:1;background:#f1f5f9;border-radius:99px;height:6px;max-width:80px">
            <div style="width:${(h.nilai_preferensi*100).toFixed(1)}%;background:#6366f1;height:6px;border-radius:99px"></div>
          </div>
          <strong>${h.nilai_preferensi.toFixed(4)}</strong>
        </div>
      </td>
      <td><span class="badge ${h.status === 'LAYAK' ? 'badge-green' : 'badge-red'}">${h.status}</span></td>
    </tr>`,
});

async function loadHasil() {
  try {
    const data = await api.get("/topsis/hasil");
    if (data.length) {
      const d = new Date(data[0].dihitung_at);
      document.getElementById("lastCalc").textContent = `Terakhir dihitung: ${d.toLocaleString("id-ID")}`;
    }
    table.setData(data);
    return data.length > 0;
  } catch(_) {
    table.setData([]);
    return false;
  }
}

async function hitung() {
  const btn = document.getElementById("btnHitung");
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Memproses...';
  try {
    await api.post("/topsis/hitung");
    toast("Kalkulasi sedang berjalan di background...", "info");
    let attempts = 0;
    polling = setInterval(async () => {
      attempts++;
      const ok = await loadHasil();
      if (ok || attempts >= 10) {
        clearInterval(polling); polling = null;
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-calculator"></i> Hitung TOPSIS';
        if (ok) toast("Kalkulasi selesai!", "success");
        else    toast("Kalkulasi memakan waktu lebih lama, coba refresh.", "error");
      }
    }, 1500);
  } catch(err) {
    toast(err.message, "error");
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-calculator"></i> Hitung TOPSIS';
  }
}

async function downloadPDF() {
  try {
    await api.get("/topsis/hasil");
    window.open("/laporan/pdf", "_blank");
  } catch(_) {
    toast("Belum ada hasil kalkulasi untuk dicetak", "error");
  }
}

document.getElementById("btnHitung").onclick = hitung;
document.getElementById("btnPDF").onclick     = downloadPDF;

loadHasil();

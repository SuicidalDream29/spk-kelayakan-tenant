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
      <td style="font-family:monospace;font-size:12px;color:var(--text-3)">${h.tenant.nik}</td>
      <td>
        <div class="prog-wrap">
          <div class="prog-bar"><div class="prog-fill" style="width:${(h.nilai_preferensi*100).toFixed(1)}%"></div></div>
          <strong style="font-size:12px;min-width:46px;text-align:right">${h.nilai_preferensi.toFixed(4)}</strong>
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
      const el = document.getElementById("lastCalc");
      if (el) el.textContent = `Terakhir dihitung: ${d.toLocaleString("id-ID")}`;
    }
    table.setData(data);
    if (typeof window._onTopsisData === "function") window._onTopsisData(data);
    return data.length > 0;
  } catch(_) {
    table.setData([]);
    if (typeof window._onTopsisData === "function") window._onTopsisData([]);
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

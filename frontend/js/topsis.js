const rankClass = r => r === 1 ? "rank-1" : r === 2 ? "rank-2" : r === 3 ? "rank-3" : "rank-n";
let polling = null;
let barChart = null;

function renderTopsisChart(data) {
  const card = document.getElementById("chartCard");
  if (!card) return;
  if (!data || !data.length) {
    card.style.display = "none";
    if (barChart) { barChart.destroy(); barChart = null; }
    return;
  }
  card.style.display = "";
  const ctx = document.getElementById("chartBar").getContext("2d");
  if (barChart) barChart.destroy();
  const sorted = [...data].sort((a,b) => b.nilai_preferensi - a.nilai_preferensi);
  barChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: sorted.map(h => h.tenant.nama),
      datasets: [{
        label: "Nilai Preferensi",
        data: sorted.map(h => h.nilai_preferensi),
        backgroundColor: sorted.map(h => h.status === "LAYAK" ? "rgba(16,185,129,.8)" : "rgba(239,68,68,.75)"),
        borderRadius: 6,
        borderSkipped: false,
      }]
    },
    options: {
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${ctx.raw.toFixed(4)}` } } },
      scales: {
        y: { beginAtZero: true, max: 1, grid: { color: "#f1f5f9" }, ticks: { font: { size: 11 } } },
        x: { grid: { display: false }, ticks: { font: { size: 11 }, maxRotation: 30 } }
      },
      animation: { duration: 700 }
    }
  });
}

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
      const el = document.getElementById("lastCalc");
      if (el) el.textContent = `Terakhir dihitung: ${new Date(data[0].dihitung_at).toLocaleString("id-ID")}`;
    }
    table.setData(data);
    renderTopsisChart(data);
    return data.length > 0;
  } catch(_) {
    table.setData([]);
    renderTopsisChart([]);
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
  const btn = document.getElementById("btnPDF");
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>';
  try {
    const token = localStorage.getItem("token");
    const res = await fetch("/laporan/pdf", {
      headers: { Authorization: "Bearer " + token }
    });
    if (res.status === 404) { toast("Belum ada hasil kalkulasi untuk dicetak", "error"); return; }
    if (!res.ok) throw new Error(await res.text());
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = "laporan_topsis.pdf";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    toast("PDF berhasil diunduh", "success");
  } catch(err) {
    toast(err.message || "Gagal mengunduh PDF", "error");
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-file-earmark-pdf"></i> PDF';
  }
}

document.getElementById("btnHitung").addEventListener("click", hitung);
document.getElementById("btnPDF").addEventListener("click", downloadPDF);

loadHasil();

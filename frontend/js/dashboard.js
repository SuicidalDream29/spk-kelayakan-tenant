// Greeting date
const now = new Date();
document.getElementById("greetingDate").textContent = now.toLocaleDateString("id-ID", {
  weekday: "long", day: "numeric", month: "long", year: "numeric"
});

let donutChart = null;

function renderDonut(layak, tidak) {
  const ctx = document.getElementById("chartDonut").getContext("2d");
  if (donutChart) donutChart.destroy();
  if (layak === 0 && tidak === 0) {
    document.getElementById("chartLegend").innerHTML = '<span style="color:var(--text-3)">Belum ada data kalkulasi</span>';
    return;
  }
  donutChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Layak", "Tidak Layak"],
      datasets: [{ data: [layak, tidak], backgroundColor: ["#10b981","#ef4444"], borderWidth: 0, hoverOffset: 6 }]
    },
    options: {
      cutout: "68%",
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.raw}` } } },
      animation: { animateRotate: true, duration: 800 }
    }
  });
  const total = layak + tidak;
  document.getElementById("chartLegend").innerHTML = `
    <div style="display:flex;align-items:center;gap:6px"><span style="width:10px;height:10px;border-radius:50%;background:#10b981;flex-shrink:0"></span> Layak <strong>${layak}</strong> <span style="color:var(--text-3)">(${(layak/total*100).toFixed(0)}%)</span></div>
    <div style="display:flex;align-items:center;gap:6px"><span style="width:10px;height:10px;border-radius:50%;background:#ef4444;flex-shrink:0"></span> Tidak Layak <strong>${tidak}</strong></div>`;
}

const rankClass = r => r === 1 ? "rank-1" : r === 2 ? "rank-2" : r === 3 ? "rank-3" : "rank-n";

function animateCount(id, target) {
  const el = document.getElementById(id);
  let current = 0;
  const step = Math.max(1, Math.round(target / 20));
  const interval = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = current;
    if (current >= target) clearInterval(interval);
  }, 40);
}

async function loadDashboard() {
  try {
    const [kriteria, tenants] = await Promise.all([api.get("/kriteria/"), api.get("/tenants/")]);
    animateCount("totalKriteria", kriteria.length);
    animateCount("totalTenant", tenants.length);
  } catch(e) {
    document.getElementById("totalKriteria").textContent = "-";
    document.getElementById("totalTenant").textContent   = "-";
  }

  try {
    const hasil = await api.get("/topsis/hasil");
    const layak = hasil.filter(h => h.status === "LAYAK").length;
    animateCount("totalLayak", layak);
    animateCount("totalTidak", hasil.length - layak);
    renderDonut(layak, hasil.length - layak);

    document.getElementById("tbody").innerHTML = hasil.slice(0, 5).map(h => `
      <tr>
        <td><span class="rank-badge ${rankClass(h.ranking)}">${h.ranking}</span></td>
        <td><strong>${h.tenant.nama}</strong></td>
        <td style="color:var(--text-3);font-family:monospace;font-size:12px">${h.tenant.nik}</td>
        <td>
          <div class="prog-wrap">
            <div class="prog-bar"><div class="prog-fill" style="width:${(h.nilai_preferensi*100).toFixed(1)}%"></div></div>
            <strong style="font-size:12px;min-width:46px;text-align:right">${h.nilai_preferensi.toFixed(4)}</strong>
          </div>
        </td>
        <td><span class="badge ${h.status === 'LAYAK' ? 'badge-green' : 'badge-red'}">${h.status}</span></td>
      </tr>`).join("");
  } catch(_) {
    document.getElementById("totalLayak").textContent = "-";
    document.getElementById("totalTidak").textContent = "-";
    renderDonut(0, 0);
    document.getElementById("tbody").innerHTML = `
      <tr><td colspan="5">
        <div class="empty-state">
          <i class="bi bi-bar-chart"></i>
          <p>Belum ada kalkulasi TOPSIS. <a href="/topsis.html">Hitung sekarang</a></p>
        </div>
      </td></tr>`;
  }
}

loadDashboard();

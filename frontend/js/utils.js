// ── Toast notifications ───────────────────────
function toast(msg, type = "info") {
  const icons = { success: "bi-check-circle-fill", error: "bi-x-circle-fill", info: "bi-info-circle-fill" };
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.innerHTML = `<i class="bi ${icons[type]}"></i><span>${msg}</span>`;
  document.getElementById("toast-container").appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

// ── Active nav item ───────────────────────────
function setActiveNav() {
  const path = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-item").forEach(a => {
    a.classList.toggle("active",
      a.getAttribute("href") === "/" + path ||
      (path === "index.html" && a.getAttribute("href") === "/")
    );
  });
}

// ── Modal helpers ─────────────────────────────
function openModal(id)  { document.getElementById(id).classList.add("open"); }
function closeModal(id) { document.getElementById(id).classList.remove("open"); }
document.addEventListener("click", e => {
  if (e.target.classList.contains("modal-overlay")) e.target.classList.remove("open");
});

// ── Table Manager (sort + search) ────────────
class TableManager {
  constructor({ tbodyId, searchId, infoId, columns, renderRow, emptyMsg = "Tidak ada data." }) {
    this.tbody    = document.getElementById(tbodyId);
    this.searchEl = document.getElementById(searchId);
    this.infoEl   = document.getElementById(infoId);
    this.columns  = columns;   // [{ key, label, searchable?, numeric? }]
    this.renderRow = renderRow;
    this.emptyMsg = emptyMsg;
    this.data     = [];
    this.filtered = [];
    this.sortKey  = null;
    this.sortDir  = "asc";
    this._bindSearch();
    this._bindHeaders();
  }

  setData(data) {
    this.data = data;
    this._apply();
  }

  _bindSearch() {
    if (!this.searchEl) return;
    this.searchEl.addEventListener("input", () => this._apply());
  }

  _bindHeaders() {
    document.querySelectorAll("th[data-col]").forEach(th => {
      th.innerHTML += '<span class="sort-icon"></span>';
      th.addEventListener("click", () => {
        const col = th.dataset.col;
        if (this.sortKey === col) {
          this.sortDir = this.sortDir === "asc" ? "desc" : "asc";
        } else {
          this.sortKey = col;
          this.sortDir = "asc";
        }
        this._apply();
      });
    });
  }

  _apply() {
    const q = this.searchEl ? this.searchEl.value.toLowerCase().trim() : "";

    // Filter
    this.filtered = q
      ? this.data.filter(row =>
          this.columns
            .filter(c => c.searchable !== false)
            .some(c => {
              const val = this._getVal(row, c.key);
              return String(val ?? "").toLowerCase().includes(q);
            })
        )
      : [...this.data];

    // Sort
    if (this.sortKey) {
      const col = this.columns.find(c => c.key === this.sortKey);
      this.filtered.sort((a, b) => {
        let va = this._getVal(a, this.sortKey);
        let vb = this._getVal(b, this.sortKey);
        if (col?.numeric) { va = parseFloat(va) || 0; vb = parseFloat(vb) || 0; }
        else { va = String(va ?? "").toLowerCase(); vb = String(vb ?? "").toLowerCase(); }
        return this.sortDir === "asc"
          ? (va > vb ? 1 : va < vb ? -1 : 0)
          : (va < vb ? 1 : va > vb ? -1 : 0);
      });
    }

    // Update headers
    document.querySelectorAll("th[data-col]").forEach(th => {
      th.classList.remove("asc", "desc");
      if (th.dataset.col === this.sortKey) th.classList.add(this.sortDir);
    });

    // Update info
    if (this.infoEl) {
      this.infoEl.textContent = q
        ? `${this.filtered.length} dari ${this.data.length} hasil`
        : `${this.data.length} data`;
    }

    // Render
    this.tbody.innerHTML = this.filtered.length
      ? this.filtered.map(row => this.renderRow(row)).join("")
      : `<tr><td colspan="99"><div class="empty-state"><i class="bi bi-search"></i><p>${q ? `Tidak ditemukan hasil untuk "<strong>${q}</strong>"` : this.emptyMsg}</p></div></td></tr>`;
  }

  _getVal(row, key) {
    // support dot notation: "tenant.nama"
    return key.split(".").reduce((o, k) => o?.[k], row);
  }
}

document.addEventListener("DOMContentLoaded", setActiveNav);

/* Demo state. Later replace these localStorage functions with Flask API requests. */
const STORE = "parkease_demo_v2",
  TODAY = "24 Aug 2026";
const icon = (name, size = 18) =>
  `<i data-lucide="${name}" style="width:${size}px;height:${size}px"></i>`;
const layouts = {
  A: [
    "available",
    "occupied",
    "available",
    "reserved",
    "available",
    "occupied",
    "available",
    "available",
    "occupied",
    "available",
    "available",
    "occupied",
  ],
  B: [
    "occupied",
    "available",
    "available",
    "occupied",
    "available",
    "reserved",
    "available",
    "occupied",
    "available",
    "available",
    "occupied",
    "available",
  ],
  C: [
    "available",
    "available",
    "occupied",
    "available",
    "occupied",
    "available",
    "reserved",
    "available",
    "available",
    "occupied",
    "available",
    "available",
  ],
};
const get = () =>
  JSON.parse(localStorage.getItem(STORE) || '{"users":{},"bookings":[]}');
const put = (x) => localStorage.setItem(STORE, JSON.stringify(x));
function makeUser(email, name = "Rahul Sharma", vehicle = "DL 01 AB 1234") {
  return {
    email,
    name,
    vehicle,
    visits: email.includes("rahul")
      ? [
          {
            id: "PE-20260821-128",
            date: "21 Aug 2026",
            location: "North Campus",
            level: "A",
            slot: "A-12",
            arrival: "10:15 AM",
            departure: "1:00 PM",
            duration: "2h 45m",
            amount: 90,
            status: "Completed",
          },
          {
            id: "PE-20260818-304",
            date: "18 Aug 2026",
            location: "North Campus",
            level: "B",
            slot: "B-04",
            arrival: "9:45 AM",
            departure: "4:10 PM",
            duration: "6h 25m",
            amount: 180,
            status: "Completed",
          },
          {
            id: "PE-20260812-881",
            date: "12 Aug 2026",
            location: "South Campus",
            level: "C",
            slot: "C-08",
            arrival: "11:30 AM",
            departure: "12:30 PM",
            duration: "1h",
            amount: 30,
            status: "Completed",
          },
        ]
      : [],
  };
}
function user() {
  const data = get(),
    email =
      localStorage.getItem("parkease_current_user") ||
      "rahul.sharma@example.com";
  if (!data.users[email]) {
    data.users[email] = makeUser(email);
    put(data);
  }
  return data.users[email];
}
function setUser(email, name, vehicle) {
  const data = get(),
    id = email.trim().toLowerCase();
  if (!data.users[id])
    data.users[id] = makeUser(id, name || id.split("@")[0], vehicle);
  else {
    data.users[id].name = name || data.users[id].name;
    data.users[id].vehicle = vehicle || data.users[id].vehicle;
  }
  put(data);
  localStorage.setItem("parkease_current_user", id);
}
const currency = (x) => `₹${Number(x).toLocaleString("en-IN")}`;
function slots(level) {
  const data = get(),
    list = layouts[level].map((status, i) => ({
      id: `${level}-${String(i + 1).padStart(2, "0")}`,
      status,
    }));
  data.bookings
    .filter(
      (b) =>
        b.level === level &&
        (b.status === "Reserved" || b.status === "Checked In"),
    )
    .forEach((b) => {
      const s = list.find((s) => s.id === b.slot);
      if (s) s.status = "reserved";
    });
  return list;
}
function slotHTML(s) {
  return `<button class="slot ${s.status}" data-slot="${s.id}" ${s.status === "available" ? "" : "disabled"}><b>${s.id}</b><small class="mt-1 block text-xs">${s.status[0].toUpperCase() + s.status.slice(1)}</small></button>`;
}
function toast(msg) {
  const e = document.createElement("div");
  e.className =
    "fixed bottom-5 right-5 z-50 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-2xl fade-in";
  e.innerHTML = `<div class="flex items-center gap-2">${icon("check-circle", 17)} ${msg}</div>`;
  document.body.append(e);
  lucide.createIcons();
  setTimeout(() => e.remove(), 2600);
}
function activeNav() {
  const page = location.pathname.split("/").pop() || "index.html";
  document
    .querySelectorAll("[data-page]")
    .forEach((x) => x.classList.toggle("active", x.dataset.page === page));
}
function labels() {
  const u = user();
  document
    .querySelectorAll("[data-user-name]")
    .forEach((x) => (x.textContent = u.name));
  document.querySelectorAll("[data-user-initials]").forEach(
    (x) =>
      (x.textContent = u.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)),
  );
  document
    .querySelectorAll("[data-vehicle]")
    .forEach((x) => (x.textContent = u.vehicle));
}
function initMap() {
  const map =
    document.querySelector("[data-slot-map]") ||
    (location.pathname.endsWith("booking.html")
      ? document.querySelector(".grid.grid-cols-3.gap-3.sm\\:grid-cols-4")
      : null);
  if (!map) return;
  let level = "A",
    chosen = "";
  const levelGroup = [...document.querySelectorAll("button")].find(
    (x) => x.textContent.trim() === "Level B",
  )?.parentElement;
  if (levelGroup && !levelGroup.textContent.includes("Level C"))
    levelGroup.insertAdjacentHTML(
      "beforeend",
      '<button class="px-3 py-1.5 text-slate-500">Level C</button>',
    );
  const levelButtons = [
    ...document.querySelectorAll("[data-level]"),
    ...document.querySelectorAll("button"),
  ].filter(
    (x, i, a) => /Level [ABC]/.test(x.textContent) && a.indexOf(x) === i,
  );
  const draw = () => {
    const list = slots(level);
    map.innerHTML = list.map(slotHTML).join("");
    const label = document.querySelector("[data-level-label]"),
      count = document.querySelector("[data-available-count]");
    if (label) label.textContent = `Level ${level}`;
    if (count)
      count.textContent = list.filter((x) => x.status === "available").length;
    map.querySelectorAll(".available").forEach(
      (x) =>
        (x.onclick = () => {
          map
            .querySelectorAll(".slot")
            .forEach((y) => y.classList.remove("selected"));
          x.classList.add("selected");
          chosen = x.dataset.slot;
          document
            .querySelectorAll("[data-selected-slot]")
            .forEach((y) => (y.textContent = chosen));
          document
            .querySelectorAll("[data-book-button]")
            .forEach((y) => (y.disabled = false));
        }),
    );
    lucide.createIcons();
  };
  levelButtons.forEach(
    (x) =>
      (x.onclick = () => {
        level = x.dataset.level || x.textContent.trim().slice(-1);
        chosen = "";
        levelButtons.forEach((y) =>
          y.classList.remove("bg-white", "shadow-sm", "text-brand"),
        );
        x.classList.add("bg-white", "shadow-sm", "text-brand");
        document
          .querySelectorAll("[data-selected-slot]")
          .forEach((y) => (y.textContent = "—"));
        document
          .querySelectorAll("[data-book-button]")
          .forEach((y) => (y.disabled = true));
        draw();
      }),
  );
  document.querySelectorAll("[data-book-button]").forEach(
    (x) =>
      (x.onclick = () => {
        if (!chosen) return;
        const u = user(),
          data = get(),
          b = {
            id: `PE-${Date.now().toString().slice(-8)}`,
            email: u.email,
            date: TODAY,
            location: "North Campus",
            level,
            slot: chosen,
            arrival: "10:30 AM",
            departure: "12:30 PM",
            duration: "2h",
            estimatedDurationHours: 2,
            estimatedAmount: 60,
            checkInTime: null,
            expectedExitTime: "12:30 PM",
            checkOutTime: null,
            baseAmount: 0,
            overtimeAmount: 0,
            finalAmount: 0,
            status: "Reserved",
            paymentStatus: "Pending",
            createdAt: Date.now(),
          };
        data.bookings.push(b);
        put(data);
        toast(`Slot ${chosen} reserved successfully`);
        setTimeout(() => (location.href = "history.html"), 650);
      }),
  );
  draw();
}
function bookingList() {
  const u = user(),
    data = get();
  return [
    ...u.visits,
    ...data.bookings.filter((x) => x.email === u.email),
  ].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}
function completeParking(bookingId) {
  const data = get();
  const booking = data.bookings.find((item) => item.id === bookingId);
  if (!booking) return;

  // Demo checkout duration. Flask will calculate this from gate timestamps.
  const actualHours = 3;
  const hourlyRate = 30;
  const overtimeHours = Math.max(0, actualHours - booking.estimatedDurationHours);

  booking.checkInTime = booking.arrival;
  booking.checkOutTime = "1:30 PM";
  booking.departure = booking.checkOutTime;
  booking.duration = `${actualHours}h`;
  booking.baseAmount = booking.estimatedDurationHours * hourlyRate;
  booking.overtimeAmount = overtimeHours * hourlyRate;
  booking.finalAmount = booking.baseAmount + booking.overtimeAmount;
  booking.status = "Completed";
  booking.paymentStatus = "Paid";
  put(data);
}

async function loadPdfLibrary() {
  if (window.jspdf) return;
  await new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js";
    script.onload = resolve;
    script.onerror = () => reject(new Error("PDF library could not be loaded."));
    document.head.appendChild(script);
  });
}

async function receipt(b) {
  try {
    await loadPdfLibrary();
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ unit: "mm", format: "a4" });
    const u = user();
    const baseAmount = b.baseAmount ?? b.amount ?? b.estimatedAmount ?? 0;
    const overtimeAmount = b.overtimeAmount ?? 0;
    const finalAmount = b.finalAmount ?? b.amount ?? b.estimatedAmount ?? 0;

    pdf.setFillColor(12, 38, 35);
    pdf.rect(0, 0, 210, 46, "F");
    pdf.setTextColor(216, 245, 91);
    pdf.setFontSize(20);
    pdf.setFont("helvetica", "bold");
    pdf.text("ParkEase", 18, 21);
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.text("AUTOMATED PARKING MANAGEMENT SYSTEM", 18, 29);
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.text("PARKING RECEIPT", 145, 22);
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Receipt ID: ${b.id}`, 145, 30);

    const line = (label, value, y) => {
      pdf.setTextColor(100, 116, 139);
      pdf.setFontSize(9);
      pdf.text(label.toUpperCase(), 18, y);
      pdf.setTextColor(16, 32, 31);
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "bold");
      pdf.text(String(value), 18, y + 6);
      pdf.setFont("helvetica", "normal");
    };
    line("Customer", u.name, 63);
    line("Vehicle", u.vehicle, 81);
    line("Location", `${b.location} - Level ${b.level}`, 99);
    line("Parking slot", b.slot, 117);
    line("Parking time", `${b.arrival} - ${b.departure}`, 135);
    line("Duration", b.duration, 153);

    pdf.setFillColor(244, 248, 246);
    pdf.roundedRect(18, 169, 174, 50, 4, 4, "F");
    pdf.setTextColor(16, 32, 31);
    pdf.setFontSize(11);
    pdf.text("Base charge", 26, 184);
    pdf.text(`Rs. ${baseAmount}`, 174, 184, { align: "right" });
    pdf.text("Overtime charge", 26, 196);
    pdf.text(`Rs. ${overtimeAmount}`, 174, 196, { align: "right" });
    pdf.setDrawColor(203, 213, 225);
    pdf.line(26, 202, 174, 202);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.text("TOTAL PAID", 26, 212);
    pdf.text(`Rs. ${finalAmount}`, 174, 212, { align: "right" });

    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(100, 116, 139);
    pdf.setFontSize(9);
    pdf.text(`Payment status: ${b.paymentStatus || "Paid"}`, 18, 236);
    pdf.text("Thank you for using ParkEase.", 18, 249);
    pdf.save(`ParkEase-receipt-${b.id}.pdf`);
    toast("PDF receipt downloaded");
  } catch (error) {
    toast("Could not create the PDF receipt. Please check your internet connection.");
  }
}
function history() {
  const root =
    document.querySelector("[data-history-body]") ||
    (location.pathname.endsWith("history.html")
      ? document.querySelector("tbody")
      : null);
  if (!root) return;
  const list = bookingList();
  root.innerHTML = list.length
    ? list
        .map(
          (b) => {
            const displayedAmount =
              b.status === "Completed"
                ? b.finalAmount ?? b.amount ?? 0
                : b.estimatedAmount ?? b.amount ?? 0;
            const action =
              b.status === "Completed"
                ? `<button data-receipt="${b.id}" class="text-xs font-bold text-brand hover:underline">PDF receipt</button>`
                : `<button data-checkout="${b.id}" class="text-xs font-bold text-brand hover:underline">Demo checkout</button>`;
            const statusClass =
              b.status === "Completed"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-blue-100 text-blue-700";
            return `<tr class="table-row"><td class="px-5 py-4 font-semibold">${b.date}<br><span class="font-normal text-slate-500">${b.arrival} - ${b.departure}</span></td><td class="px-5 py-4">${b.location}</td><td class="px-5 py-4 font-bold">${b.slot}</td><td class="px-5 py-4">${b.duration}</td><td class="px-5 py-4 font-bold">${currency(displayedAmount)}</td><td class="px-5 py-4"><span class="rounded-full ${statusClass} px-2.5 py-1 text-xs font-bold">${b.status}</span></td><td class="px-5 py-4">${action}</td></tr>`;
          },
        )
        .join("")
    : `<tr><td colspan="7" class="px-5 py-10 text-center text-slate-500">No visits yet. <a href="booking.html" class="font-bold text-brand">Book your first slot.</a></td></tr>`;
  const cards = [...document.querySelectorAll(".stat-card b")],
    v = document.querySelector("[data-total-visits]") || cards[0],
    s = document.querySelector("[data-total-spend]") || cards[2];
  if (v) v.textContent = list.length;
  if (s)
    s.textContent = currency(
      list.reduce(
        (n, b) => n + Number(b.finalAmount ?? b.amount ?? b.estimatedAmount ?? 0),
        0,
      ),
    );
  root
    .querySelectorAll("[data-receipt]")
    .forEach(
      (x) =>
        (x.onclick = () =>
          receipt(list.find((b) => b.id === x.dataset.receipt))),
    );
  root.querySelectorAll("[data-checkout]").forEach(
    (x) =>
      (x.onclick = () => {
        completeParking(x.dataset.checkout);
        toast("Parking session completed. Your final PDF receipt is ready.");
        history();
      }),
  );
  document.querySelectorAll("button").forEach((x) => {
    if (x.textContent.includes("Download receipt"))
      x.onclick = () => {
        const completed = list.find((b) => b.status === "Completed");
        if (completed) receipt(completed);
        else toast("A final receipt is available after checkout.");
      };
  });
}
function dashboard() {
  const root =
    document.querySelector("[data-dashboard-map]") ||
    (location.pathname.endsWith("dashboard.html")
      ? document.querySelector(".mt-5.grid.grid-cols-4.gap-3.sm\\:grid-cols-6")
      : null);
  if (root) {
    root.innerHTML = slots("A").map(slotHTML).join("");
    root
      .querySelectorAll(".available")
      .forEach((x) => (x.onclick = () => (location.href = "booking.html")));
  }
  const count =
    document.querySelector("[data-dashboard-available]") ||
    document.querySelector(".stat-card .text-3xl");
  if (count)
    count.textContent = slots("A").filter(
      (x) => x.status === "available",
    ).length;
}
function admin() {
  if (!location.pathname.endsWith("admin.html")) return;
  const d = get(),
    all = [...d.bookings, ...Object.values(d.users).flatMap((x) => x.visits)],
    cards = [...document.querySelectorAll(".stat-card b")],
    book = document.querySelector("[data-admin-bookings]") || cards[2],
    revenue = document.querySelector("[data-admin-revenue]") || cards[3],
    users = document.querySelector("[data-admin-users]");
  if (book) book.textContent = 91 + d.bookings.length;
  if (revenue)
    revenue.textContent = currency(
      4860 + all.reduce((s, b) => s + Number(b.amount), 0),
    );
  if (users) users.textContent = Object.keys(d.users).length;
}
function auth() {
  const form = document.querySelector("form");
  if (!form) return;
  if (location.pathname.endsWith("login.html"))
    form.onsubmit = (e) => {
      e.preventDefault();
      setUser(form.querySelector("input[type=email]").value);
      location.href = "dashboard.html";
    };
  if (location.pathname.endsWith("register.html"))
    form.onsubmit = (e) => {
      e.preventDefault();
      const inputs = form.querySelectorAll("input"),
        email = form.querySelector("input[type=email]").value;
      setUser(email, `${inputs[0].value} ${inputs[1].value}`, inputs[3].value);
      location.href = "dashboard.html";
    };
}
document.addEventListener("DOMContentLoaded", () => {
  activeNav();
  auth();
  labels();
  dashboard();
  initMap();
  history();
  admin();
  document
    .querySelectorAll("[data-menu]")
    .forEach(
      (x) =>
        (x.onclick = () =>
          document
            .querySelector("[data-sidebar]")
            ?.classList.toggle("-translate-x-full")),
    );
  lucide.createIcons();
});

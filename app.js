let client = null;
let currentUser = null;
let allRecords = [];

const authScreen = document.getElementById("authScreen");
const appScreen = document.getElementById("appScreen");
const authMessage = document.getElementById("authMessage");
const loadingBox = document.getElementById("loadingBox");

const monthFilter = document.getElementById("monthFilter");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const recordsBody = document.getElementById("recordsBody");
const form = document.getElementById("shiftForm");

const formIds = [
  "recordId", "date", "shiftName", "company", "supervisor", "supervisorContact",
  "location", "startTime", "endTime", "breakMinutes", "rate", "paymentStatus",
  "paymentReceivedDate", "shiftType", "referenceNo", "description", "incidentNotes", "expenses"
];

function initSupabase() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || SUPABASE_URL.includes("PASTE_") || SUPABASE_ANON_KEY.includes("PASTE_")) {
    authMessage.textContent = "Add your Supabase URL and anon key in config.js first.";
    return false;
  }

  client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return true;
}

async function boot() {
  if (!initSupabase()) return;

  const { data } = await client.auth.getSession();
  currentUser = data.session?.user || null;

  client.auth.onAuthStateChange((_event, session) => {
    currentUser = session?.user || null;
    if (currentUser) showApp();
    else showAuth();
  });

  if (currentUser) showApp();
  else showAuth();
}

function showAuth() {
  authScreen.classList.remove("hidden");
  appScreen.classList.add("hidden");
}

async function showApp() {
  authScreen.classList.add("hidden");
  appScreen.classList.remove("hidden");
  document.getElementById("userEmail").textContent = currentUser.email;
  await fetchRecords();
}

async function login() {
  authMessage.textContent = "Logging in...";
  const email = document.getElementById("authEmail").value.trim();
  const password = document.getElementById("authPassword").value;

  const { error } = await client.auth.signInWithPassword({ email, password });
  authMessage.textContent = error ? error.message : "";
}

async function signup() {
  authMessage.textContent = "Creating account...";
  const email = document.getElementById("authEmail").value.trim();
  const password = document.getElementById("authPassword").value;

  const { error } = await client.auth.signUp({ email, password });
  authMessage.textContent = error ? error.message : "Account created. Check your email if confirmation is enabled, then login.";
}

async function logout() {
  await client.auth.signOut();
}

async function fetchRecords() {
  setLoading(true);

  const { data, error } = await client
    .from("security_shifts")
    .select("*")
    .order("shift_date", { ascending: false });

  setLoading(false);

  if (error) {
    alert("Could not load records: " + error.message);
    allRecords = [];
  } else {
    allRecords = data || [];
  }

  render();
}

async function saveShift(e) {
  e.preventDefault();

  const record = getFormData();

  if (!record.shift_date || !record.shift_name || !record.company || !record.start_time || !record.end_time || !record.rate_per_hour) {
    alert("Please fill date, shift/site, company, start/end time and rate.");
    return;
  }

  const recordId = document.getElementById("recordId").value;

  if (recordId) {
    const { error } = await client
      .from("security_shifts")
      .update(record)
      .eq("id", recordId);

    if (error) return alert("Could not update shift: " + error.message);
  } else {
    record.user_id = currentUser.id;
    const { error } = await client
      .from("security_shifts")
      .insert(record);

    if (error) return alert("Could not save shift: " + error.message);
  }

  resetForm();
  await fetchRecords();
}

async function deleteRecord(id) {
  if (!confirm("Delete this shift record?")) return;

  const { error } = await client
    .from("security_shifts")
    .delete()
    .eq("id", id);

  if (error) return alert("Could not delete shift: " + error.message);

  await fetchRecords();
}

function editRecord(id) {
  const r = allRecords.find(item => item.id === id);
  if (!r) return;

  document.getElementById("recordId").value = r.id;
  document.getElementById("date").value = r.shift_date || "";
  document.getElementById("shiftName").value = r.shift_name || "";
  document.getElementById("company").value = r.company || "";
  document.getElementById("supervisor").value = r.supervisor || "";
  document.getElementById("supervisorContact").value = r.supervisor_contact || "";
  document.getElementById("location").value = r.location || "";
  document.getElementById("startTime").value = r.start_time || "";
  document.getElementById("endTime").value = r.end_time || "";
  document.getElementById("breakMinutes").value = r.break_minutes ?? 0;
  document.getElementById("rate").value = r.rate_per_hour ?? "";
  document.getElementById("paymentStatus").value = r.payment_status || "Pending";
  document.getElementById("paymentReceivedDate").value = r.payment_received_date || "";
  document.getElementById("shiftType").value = r.shift_type || "Retail Security";
  document.getElementById("referenceNo").value = r.reference_no || "";
  document.getElementById("description").value = r.description || "";
  document.getElementById("incidentNotes").value = r.incident_notes || "";
  document.getElementById("expenses").value = r.expenses || "";

  updatePreview();
  window.location.hash = "#add-shift";
}

function getFormData() {
  const start = document.getElementById("startTime").value;
  const end = document.getElementById("endTime").value;
  const breakMins = Number(document.getElementById("breakMinutes").value || 0);
  const rate = Number(document.getElementById("rate").value || 0);
  const hours = calculateHours(start, end, breakMins);
  const total = Math.round(hours * rate * 100) / 100;

  const paymentDate = document.getElementById("paymentReceivedDate").value || null;

  return {
    shift_date: document.getElementById("date").value,
    shift_name: document.getElementById("shiftName").value.trim(),
    company: document.getElementById("company").value.trim(),
    supervisor: document.getElementById("supervisor").value.trim(),
    supervisor_contact: document.getElementById("supervisorContact").value.trim(),
    location: document.getElementById("location").value.trim(),
    start_time: start,
    end_time: end,
    break_minutes: breakMins,
    rate_per_hour: rate,
    hours_worked: hours,
    total_pay: total,
    payment_status: document.getElementById("paymentStatus").value,
    payment_received_date: paymentDate,
    shift_type: document.getElementById("shiftType").value,
    reference_no: document.getElementById("referenceNo").value.trim(),
    description: document.getElementById("description").value.trim(),
    incident_notes: document.getElementById("incidentNotes").value.trim(),
    expenses: document.getElementById("expenses").value.trim()
  };
}

function resetForm() {
  form.reset();
  document.getElementById("recordId").value = "";
  document.getElementById("breakMinutes").value = 0;
  document.getElementById("paymentStatus").value = "Pending";
  document.getElementById("shiftType").value = "Retail Security";
  updatePreview();
}

function calculateHours(start, end, breakMinutes = 0) {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);

  let startMins = sh * 60 + sm;
  let endMins = eh * 60 + em;

  // Handles overnight shifts, e.g. 22:00 to 06:00
  if (endMins < startMins) endMins += 24 * 60;

  const worked = Math.max(0, endMins - startMins - Number(breakMinutes || 0));
  return Math.round((worked / 60) * 100) / 100;
}

function updatePreview() {
  const start = document.getElementById("startTime").value;
  const end = document.getElementById("endTime").value;
  const breakMinutes = Number(document.getElementById("breakMinutes").value || 0);
  const rate = Number(document.getElementById("rate").value || 0);
  const hours = calculateHours(start, end, breakMinutes);

  document.getElementById("previewHours").textContent = hours.toFixed(2);
  document.getElementById("previewPay").textContent = money(hours * rate);
}

function filteredRecords() {
  const month = monthFilter.value;
  const search = searchInput.value.toLowerCase();
  const status = statusFilter.value;

  return allRecords
    .filter(r => !month || (r.shift_date || "").startsWith(month))
    .filter(r => !status || r.payment_status === status)
    .filter(r => {
      const haystack = [
        r.shift_name, r.company, r.supervisor, r.supervisor_contact,
        r.location, r.shift_type, r.description, r.incident_notes, r.expenses
      ].join(" ").toLowerCase();

      return !search || haystack.includes(search);
    });
}

function render() {
  const rows = filteredRecords();

  recordsBody.innerHTML = rows.length ? rows.map(r => `
    <tr>
      <td>${escapeHtml(r.shift_date)}</td>
      <td><strong>${escapeHtml(r.shift_name)}</strong><br><small>${escapeHtml(r.location || "")}</small></td>
      <td>${escapeHtml(r.company)}</td>
      <td>${escapeHtml(r.supervisor || "-")}<br><small>${escapeHtml(r.supervisor_contact || "")}</small></td>
      <td>${escapeHtml(trimTime(r.start_time))} - ${escapeHtml(trimTime(r.end_time))}<br><small>Break: ${Number(r.break_minutes || 0)} min</small></td>
      <td>${Number(r.hours_worked || 0).toFixed(2)}</td>
      <td>${money(r.rate_per_hour)}</td>
      <td><strong>${money(r.total_pay)}</strong></td>
      <td><span class="badge ${escapeHtml(r.payment_status)}">${escapeHtml(r.payment_status)}</span></td>
      <td>
        <div class="row-actions">
          <button class="icon-btn" onclick="editRecord('${r.id}')">Edit</button>
          <button class="icon-btn" onclick="deleteRecord('${r.id}')">Delete</button>
        </div>
      </td>
    </tr>
  `).join("") : `<tr><td colspan="10">No records found. Add your first shift above.</td></tr>`;

  updateStats(rows);
}

function updateStats(rows) {
  const totalHours = rows.reduce((sum, r) => sum + Number(r.hours_worked || 0), 0);
  const grossPay = rows.reduce((sum, r) => sum + Number(r.total_pay || 0), 0);
  const pendingPay = rows
    .filter(r => r.payment_status === "Pending" || r.payment_status === "Disputed")
    .reduce((sum, r) => sum + Number(r.total_pay || 0), 0);

  document.getElementById("totalShifts").textContent = rows.length;
  document.getElementById("totalHours").textContent = totalHours.toFixed(2);
  document.getElementById("grossPay").textContent = money(grossPay);
  document.getElementById("pendingPay").textContent = money(pendingPay);
}

function reportHeaders() {
  return [
    "Date", "Shift/Site", "Company/Agency", "Supervisor", "Supervisor Contact",
    "Location", "Start", "End", "Break Minutes", "Hours", "Rate Per Hour",
    "Total Pay", "Payment Status", "Payment Received Date", "Shift Type",
    "Invoice/Reference No", "Description/Duty Notes", "Incident Notes", "Expenses/Travel Notes"
  ];
}

function reportRow(r) {
  return [
    r.shift_date, r.shift_name, r.company, r.supervisor, r.supervisor_contact,
    r.location, trimTime(r.start_time), trimTime(r.end_time), r.break_minutes,
    Number(r.hours_worked || 0).toFixed(2), Number(r.rate_per_hour || 0).toFixed(2),
    Number(r.total_pay || 0).toFixed(2), r.payment_status, r.payment_received_date || "",
    r.shift_type, r.reference_no, r.description, r.incident_notes, r.expenses
  ];
}

function downloadExcel() {
  const rows = filteredRecords();
  const totalHours = rows.reduce((sum, r) => sum + Number(r.hours_worked || 0), 0);
  const totalPay = rows.reduce((sum, r) => sum + Number(r.total_pay || 0), 0);
  const pendingPay = rows
    .filter(r => r.payment_status === "Pending" || r.payment_status === "Disputed")
    .reduce((sum, r) => sum + Number(r.total_pay || 0), 0);

  const html = `
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; }
          .title { font-size: 22px; font-weight: bold; color: #111827; }
          .meta { color: #555; }
          table { border-collapse: collapse; width: 100%; }
          th { background: #1f2937; color: white; font-weight: bold; }
          th, td { border: 1px solid #9ca3af; padding: 8px; vertical-align: top; }
          .summary th { background: #d7a84f; color: #111; }
        </style>
      </head>
      <body>
        <p class="title">Security Shift Report</p>
        <p class="meta">Generated: ${new Date().toLocaleString()}</p>
        <p class="meta">User: ${escapeHtml(currentUser.email)}</p>

        <table class="summary">
          <tr>
            <th>Total Shifts</th>
            <th>Total Hours</th>
            <th>Gross Pay</th>
            <th>Pending/Disputed Pay</th>
          </tr>
          <tr>
            <td>${rows.length}</td>
            <td>${totalHours.toFixed(2)}</td>
            <td>£${totalPay.toFixed(2)}</td>
            <td>£${pendingPay.toFixed(2)}</td>
          </tr>
        </table>

        <br>

        <table>
          <tr>${reportHeaders().map(h => `<th>${escapeHtml(h)}</th>`).join("")}</tr>
          ${rows.map(r => `<tr>${reportRow(r).map(v => `<td>${escapeHtml(v)}</td>`).join("")}</tr>`).join("")}
        </table>
      </body>
    </html>
  `;

  downloadFile(`security-shift-report-${todayStamp()}.xls`, html, "application/vnd.ms-excel;charset=utf-8");
}

function downloadCsv() {
  const rows = filteredRecords();
  const csv = [
    reportHeaders().join(","),
    ...rows.map(r => reportRow(r).map(csvCell).join(","))
  ].join("\n");

  downloadFile(`security-shift-report-${todayStamp()}.csv`, csv, "text/csv;charset=utf-8");
}

function backupJson() {
  const payload = {
    app: "Security Shift Manager Supabase",
    user: currentUser.email,
    exportedAt: new Date().toISOString(),
    records: filteredRecords()
  };

  downloadFile(`security-shifts-backup-${todayStamp()}.json`, JSON.stringify(payload, null, 2), "application/json");
}

function money(value) {
  return `£${Number(value || 0).toFixed(2)}`;
}

function trimTime(value) {
  if (!value) return "";
  return String(value).slice(0, 5);
}

function csvCell(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function todayStamp() {
  return new Date().toISOString().slice(0, 10);
}

function setLoading(isLoading) {
  loadingBox.classList.toggle("hidden", !isLoading);
}

document.getElementById("loginBtn").addEventListener("click", login);
document.getElementById("signupBtn").addEventListener("click", signup);
document.getElementById("logoutBtn").addEventListener("click", logout);
document.getElementById("refreshBtn").addEventListener("click", fetchRecords);
document.getElementById("resetFormBtn").addEventListener("click", resetForm);
document.getElementById("backupBtn").addEventListener("click", backupJson);
document.getElementById("downloadExcelBtn").addEventListener("click", downloadExcel);
document.getElementById("downloadCsvBtn").addEventListener("click", downloadCsv);
document.getElementById("printReportBtn").addEventListener("click", () => window.print());

form.addEventListener("submit", saveShift);
[monthFilter, searchInput, statusFilter].forEach(el => el.addEventListener("input", render));
["startTime", "endTime", "breakMinutes", "rate"].forEach(id => {
  document.getElementById(id).addEventListener("input", updatePreview);
});

monthFilter.value = new Date().toISOString().slice(0, 7);
resetForm();
boot();

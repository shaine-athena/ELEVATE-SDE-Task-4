const API_BASE = "http://localhost:8080";
const DEFAULT_ADMIN_TOKEN = "CREDVAULT-ADMIN-TOKEN";

let adminToken = sessionStorage.getItem("credvault_admin_token") || "";
let cachedApplications = [];
let cachedCertificates = [];

function getAuthHeaders() {
  const token = adminToken || DEFAULT_ADMIN_TOKEN;
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  };
}

function setAdminLoggedIn(isLoggedIn, token = "") {
  if (isLoggedIn) {
    adminToken = token || DEFAULT_ADMIN_TOKEN;
    sessionStorage.setItem("credvault_admin_token", adminToken);
    document.getElementById("public-nav").classList.add("hidden");
    document.getElementById("admin-nav").classList.remove("hidden");
  } else {
    adminToken = "";
    sessionStorage.removeItem("credvault_admin_token");
    document.getElementById("admin-nav").classList.add("hidden");
    document.getElementById("public-nav").classList.remove("hidden");
  }
}

// 1. NAVIGATION BETWEEN PAGES
function showPage(pageName) {
  document.querySelectorAll(".page").forEach((page) => {
    page.classList.remove("active");
  });

  const targetPage = document.getElementById("page-" + pageName);
  if (targetPage) {
    targetPage.classList.add("active");
  }

  if (pageName === "admin-applications") {
    renderApplicationsTable();
  } else if (pageName === "admin-certificates") {
    renderCertificatesTable();
  }
}

// 2. CITIZEN: REQUEST CERTIFICATE (POST /api/applications)
async function submitRequest(event) {
  event.preventDefault();

  const payload = {
    name: document.getElementById("req-name").value.trim(),
    phone: document.getElementById("req-phone").value.trim(),
    gender: document.querySelector('input[name="gender"]:checked').value,
    city: document.getElementById("req-city").value.trim(),
    state: document.getElementById("req-state").value
  };

  const successBox = document.getElementById("request-success");
  successBox.classList.add("hidden");

  try {
    const res = await fetch(`${API_BASE}/api/applications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || data.message || `Request failed (${res.status})`);
    }

    const appId = data.applicationId || data.id || "Submitted";
    successBox.className = "alert success";
    successBox.innerHTML = `
      <strong>Application submitted successfully!</strong><br>
      Application ID: <strong>${appId}</strong> (Status: <strong>${data.status || "Pending"}</strong>)
    `;
    successBox.classList.remove("hidden");

    document.getElementById("request-form").reset();
  } catch (err) {
    successBox.className = "alert error";
    successBox.textContent = `Error submitting application: ${err.message}`;
    successBox.classList.remove("hidden");
  }
}

// 3. CITIZEN: TRACK APPLICATION (GET /api/applications/track/{id})
async function trackApplication(event) {
  event.preventDefault();
  const inputId = document
    .getElementById("track-input")
    .value.trim()
    .replace(/^#/, "")
    .toUpperCase();
  const resultDiv = document.getElementById("track-result");

  resultDiv.innerHTML = `<div class="result-box">Checking application status...</div>`;

  try {
    const res = await fetch(`${API_BASE}/api/applications/track/${encodeURIComponent(inputId)}`);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || data.message || "Application ID not found.");
    }

    const submittedValue = data.submittedAt || data.date || "N/A";
    resultDiv.innerHTML = `
      <div class="result-box">
        <p><strong>Application ID:</strong> ${data.applicationId || inputId}</p>
        <p><strong>Name:</strong> ${data.name || "N/A"}</p>
        <p><strong>Status:</strong> ${data.status || "N/A"}</p>
        <p><strong>Submission Date:</strong> ${submittedValue}</p>
      </div>
    `;
  } catch (err) {
    resultDiv.innerHTML = `<div class="alert error">Error: ${err.message}</div>`;
  }
}

// 4. PUBLIC: VERIFY CERTIFICATE (GET /api/certificates/verify/{certificateId})
async function verifyCertificate(event) {
  event.preventDefault();
  const inputId = document
    .getElementById("verify-input")
    .value.trim()
    .replace(/^#/, "")
    .toUpperCase();
  const resultDiv = document.getElementById("verify-result");

  resultDiv.innerHTML = `<div class="result-box">Verifying certificate...</div>`;

  try {
    const res = await fetch(`${API_BASE}/api/certificates/verify/${encodeURIComponent(inputId)}`);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || data.message || "Not Found (Invalid Certificate ID)");
    }

    resultDiv.innerHTML = `
      <div class="result-box">
        <p><strong>Certificate ID:</strong> ${data.certificateId || inputId}</p>
        <p><strong>Name:</strong> ${data.name || "N/A"}</p>
        <p><strong>Phone:</strong> ${data.phone || "N/A"}</p>
        <p><strong>Issued on Date:</strong> ${data.issuedOn || "N/A"}</p>
        <p><strong>Status:</strong> ${data.status || "N/A"}</p>
      </div>
    `;
  } catch (err) {
    resultDiv.innerHTML = `<div class="alert error">Status: ${err.message}</div>`;
  }
}

// 5. ADMIN: LOGIN & LOGOUT (POST /api/admin/login)
async function handleAdminLogin(event) {
  event.preventDefault();
  const username = document.getElementById("admin-user").value.trim();
  const password = document.getElementById("admin-pass").value;
  const errorBox = document.getElementById("login-error");

  errorBox.classList.add("hidden");

  try {
    const res = await fetch(`${API_BASE}/api/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || data.message || "Invalid username or password.");
    }

    const receivedToken = data.token || DEFAULT_ADMIN_TOKEN;
    setAdminLoggedIn(true, receivedToken);
    showPage("admin-applications");
  } catch (err) {
    errorBox.textContent = err.message;
    errorBox.classList.remove("hidden");
  }
}

function logoutAdmin() {
  setAdminLoggedIn(false);
  showPage("home");
}

// 6. ADMIN: MANAGE APPLICATIONS (GET /api/admin/applications, PATCH .../approve)
async function renderApplicationsTable() {
  const tbody = document.getElementById("applications-table-body");
  tbody.innerHTML = `<tr><td colspan="8">Loading applications...</td></tr>`;

  try {
    const res = await fetch(`${API_BASE}/api/admin/applications`, {
      method: "GET",
      headers: getAuthHeaders()
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || `Failed to load applications (${res.status})`);
    }

    cachedApplications = Array.isArray(data) ? data : [];
    tbody.innerHTML = "";

    if (cachedApplications.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8">No applications found.</td></tr>`;
      return;
    }

    cachedApplications.forEach((app) => {
      const appId = app.applicationId || app.id;
      const isPending = app.status === "Pending";

      tbody.innerHTML += `
        <tr>
          <td>${appId}</td>
          <td>${app.name || ""}</td>
          <td>${app.phone || ""}</td>
          <td>${app.gender || ""}</td>
          <td>${app.city || ""}</td>
          <td>${app.state || ""}</td>
          <td><strong>${app.status || ""}</strong></td>
          <td>
            <button class="btn-small btn-issue" ${!isPending ? "disabled" : ""} onclick="issueCert('${appId}')">Issue</button>
            <button class="btn-small btn-reject" ${!isPending ? "disabled" : ""} onclick="rejectApp('${appId}')">Reject</button>
          </td>
        </tr>
      `;
    });
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8">Error: ${err.message}</td></tr>`;
  }
}

async function issueCert(appId) {
  try {
    const approveRes = await fetch(`${API_BASE}/api/admin/applications/${encodeURIComponent(appId)}/approve`, {
      method: "PATCH",
      headers: getAuthHeaders()
    });

    if (!approveRes.ok) {
      const errData = await approveRes.json().catch(() => ({}));
      throw new Error(errData.error || `Failed to approve application (${approveRes.status})`);
    }

    let generatedCertId = "";
    const certsRes = await fetch(`${API_BASE}/api/admin/certificates`, {
      method: "GET",
      headers: getAuthHeaders()
    });

    if (certsRes.ok) {
      const certs = await certsRes.json();
      if (Array.isArray(certs)) {
        const match = certs.find((c) => c.applicationId === appId);
        if (match) {
          generatedCertId = match.certificateId;
        }
      }
    }

    await renderApplicationsTable();
    alert(
      generatedCertId
        ? `Certificate Issued! Certificate ID: ${generatedCertId}`
        : `Application ${appId} approved and certificate issued.`
    );
  } catch (err) {
    alert(`Error issuing certificate: ${err.message}`);
  }
}

async function rejectApp(appId) {
  try {
    const res = await fetch(`${API_BASE}/api/admin/applications/${encodeURIComponent(appId)}/reject`, {
      method: "PATCH",
      headers: getAuthHeaders()
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Failed to reject application (${res.status})`);
    }

    await renderApplicationsTable();
  } catch (err) {
    alert(`Error rejecting application: ${err.message}`);
  }
}

// 7. ADMIN: MANAGE CERTIFICATES (GET /api/admin/certificates, GET .../revoke)
async function renderCertificatesTable() {
  const tbody = document.getElementById("certificates-table-body");
  tbody.innerHTML = `<tr><td colspan="8">Loading certificates...</td></tr>`;

  try {
    const [certsRes, appsRes] = await Promise.all([
      fetch(`${API_BASE}/api/admin/certificates`, {
        method: "GET",
        headers: getAuthHeaders()
      }),
      fetch(`${API_BASE}/api/admin/applications`, {
        method: "GET",
        headers: getAuthHeaders()
      })
    ]);

    const certsData = await certsRes.json();
    if (!certsRes.ok) {
      throw new Error(certsData.error || `Failed to load certificates (${certsRes.status})`);
    }

    if (appsRes.ok) {
      const appsData = await appsRes.json();
      if (Array.isArray(appsData)) {
        cachedApplications = appsData;
      }
    }

    cachedCertificates = Array.isArray(certsData) ? certsData : [];
    tbody.innerHTML = "";

    if (cachedCertificates.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8">No certificates found.</td></tr>`;
      return;
    }

    cachedCertificates.forEach((cert) => {
      const certId = cert.certificateId || cert.id;
      const linkedApp = cachedApplications.find((a) => (a.applicationId || a.id) === cert.applicationId) || {};
      const isValid = cert.status === "Valid";

      tbody.innerHTML += `
        <tr>
          <td>${certId}</td>
          <td>${cert.name || linkedApp.name || "N/A"}</td>
          <td>${cert.phone || linkedApp.phone || "N/A"}</td>
          <td>${cert.city || linkedApp.city || "N/A"}</td>
          <td>${cert.state || linkedApp.state || "N/A"}</td>
          <td>${cert.issuedOn || ""}</td>
          <td><strong>${cert.status || ""}</strong></td>
          <td>
            <button class="btn-small btn-reject" ${!isValid ? "disabled" : ""} onclick="revokeCert('${certId}')">Revoke</button>
          </td>
        </tr>
      `;
    });
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8">Error: ${err.message}</td></tr>`;
  }
}

async function revokeCert(certId) {
  try {
    const res = await fetch(`${API_BASE}/api/admin/certificates/${encodeURIComponent(certId)}/revoke`, {
      method: "GET",
      headers: getAuthHeaders()
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Failed to revoke certificate (${res.status})`);
    }

    await renderCertificatesTable();
  } catch (err) {
    alert(`Error revoking certificate: ${err.message}`);
  }
}
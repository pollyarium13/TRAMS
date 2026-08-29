const $ = (s) => document.querySelector(s),
        $$ = (s) => document.querySelectorAll(s);
      let selectedPhoto = "";
      function showAccountForm(){
        $("#accountFormPanel").classList.add("active");
        $("#accountsTablePanel").classList.add("hidden");
      }

      function showAccountTable(){
        $("#accountFormPanel").classList.remove("active");
        $("#accountsTablePanel").classList.remove("hidden");
      }

      const read = (k, d = []) => {
          try {
            return JSON.parse(localStorage.getItem(k) || JSON.stringify(d));
          } catch (e) {
            return d;
          }
        },
        write = (k, v) => localStorage.setItem(k, JSON.stringify(v));
      let employees = read("tramsEmployees", read("navytime_employees", [])),
        admins = read("tramsAdmins", []),
        logs = [];
      let currentPage = 1;
      let rowsPerPage = 10;
      let attendancePage = 1;
      let attendanceRowsPerPage = 10;
      /* chartFrame removed */
      function fullName(x) {
        return (
          [x.firstName || x.first_name, x.middleInitial || x.middle_initial, x.lastName || x.last_name, x.extensionName]
            .filter(Boolean)
            .join(" ") ||
          x.name ||
          ""
        );
      }
      function esc(v) {
        return String(v || "").replace(
          /[&<>"']/g,
          (c) =>
            ({
              "&": "&amp;",
              "<": "&lt;",
              ">": "&gt;",
              '"': "&quot;",
              "'": "&#39;",
            })[c],
        );
      }
      function payload(a) {
        return 'TRAMS:' + (a.backendId || a.id);
      }
      function qr(a) {
        return (
          "https://api.qrserver.com/v1/create-qr-code/?size=360x360&ecc=M&margin=16&data=" +
          encodeURIComponent(payload(a))
        );
      }
      function saveAll() {
        write("tramsEmployees", employees);
        write(
          "navytime_employees",
          employees.map((e) => ({ ...e, name: fullName(e) })),
        );
        write("tramsAdmins", admins);
      }
      function accountType(a, fallback = "User") {
        return a.type || (a.role === "Super Admin" ? "Super Admin" : fallback);
      }
      function accountTypeLabel(type) {
        if (type === "Admin") return "Administrator";
        if (type === "Super Admin") return "Super Administrator";
        return type || "Administrator";
      }
      function temporaryPassword() {
        return Math.random().toString(36).slice(2, 6).toUpperCase() + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();
      }

      function hasGeneratedPassword(type) {
        const normalized = normalizePortalRole(type);
        return normalized === "Admin" || normalized === "Super Admin";
      }

      function authHeaders() {
        const token = sessionStorage.getItem('tramsToken') || '';
        return token ? { Authorization: 'Bearer ' + token } : {};
      }

      function jsonHeaders() {
        return { 'Content-Type': 'application/json', ...authHeaders() };
      }

      function dataUrlByteLength(dataUrl) {
        const base64 = String(dataUrl || "").split(",")[1] || "";
        return Math.ceil(base64.length * 3 / 4);
      }

      function photoFileToDataUrl(file) {
        return new Promise((resolve, reject) => {
          const img = new Image();
          const url = URL.createObjectURL(file);

          img.onload = () => {
            const maxSide = 360;
            const maxPhotoBytes = 700 * 1024;
            const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
            const canvas = document.createElement("canvas");
            canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
            canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            URL.revokeObjectURL(url);
            let quality = 0.72;
            let dataUrl = canvas.toDataURL("image/jpeg", quality);
            while (dataUrlByteLength(dataUrl) > maxPhotoBytes && quality > 0.42) {
              quality -= 0.08;
              dataUrl = canvas.toDataURL("image/jpeg", quality);
            }
            if (dataUrlByteLength(dataUrl) > maxPhotoBytes) {
              reject(new Error("Photo is too large after compression. Please choose a smaller image."));
              return;
            }
            resolve(dataUrl);
          };

          img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error("Could not read the selected photo"));
          };

          img.src = url;
        });
      }

      function backendAccountPayload(item, type) {
        const payload = {
          client_id: item.id,
          account_type: type,
          rank: item.rank || item.role || "",
          first_name: item.firstName || "",
          middle_initial: item.middleInitial || "",
          last_name: item.lastName || "",
          serial_number: item.serialNumber || "",
          username: item.username || item.serialNumber || "",
          email_address: item.emailAddress || item.email || "",
          contact_number: item.contactNumber || "",
          service: item.service || "PN",
          department: item.department || ""
        };
        if (hasGeneratedPassword(type)) {
          payload.password = item.password || temporaryPassword();
        }
        if (Object.prototype.hasOwnProperty.call(item, "photo")) {
          payload.photo = item.photo || "";
        }
        return payload;
      }
      async function createBackendAccount(item, type) {
        const response = await fetch("http://localhost:3000/api/accounts", {
          method: "POST",
          headers: jsonHeaders(),
          body: JSON.stringify(backendAccountPayload(item, type))
        });
        let data = {};
        try { data = await response.json(); } catch (e) {}
        if (!response.ok && response.status !== 201) {
          throw new Error(data.message || data.sqlMessage || "Backend account creation failed");
        }
        return data;
      }

      async function updateBackendAccount(item, type) {
        if (!item.backendId) return null;
        const payload = backendAccountPayload(item, type);
        if (item.photoChanged !== true) {
          delete payload.photo;
        }
        if (!item.password) {
          delete payload.password;
        }
        const response = await fetch("http://localhost:3000/api/accounts/" + encodeURIComponent(item.backendId), {
          method: "PUT",
          headers: jsonHeaders(),
          body: JSON.stringify(payload)
        });
        let data = {};
        try { data = await response.json(); } catch (e) {}
        if (!response.ok) {
          throw new Error(data.message || data.sqlMessage || "Backend account update failed");
        }
        return data;
      }

      async function deleteBackendAccount(item) {
        if (!item) return null;
        if (!item.backendId) return null;
        const response = await fetch("http://localhost:3000/api/accounts/" + encodeURIComponent(item.backendId), {
          method: "DELETE",
          headers: authHeaders()
        });
        let data = {};
        try { data = await response.json(); } catch (e) {}
        if (!response.ok) {
          throw new Error(data.message || data.sqlMessage || "Backend account deletion failed");
        }
        return data;
      }

      function accountIdFromQr(row) {
        try {
          const payload = JSON.parse(row.qr_payload || "{}");
          return payload.employeeId || payload.id || String(row.id);
        } catch (e) {
          return String(row.id);
        }
      }

      function findLocalAccountForBackend(row) {
        const keyValues = [
          row.username,
          row.serial_number,
          row.email_address
        ].map((value) => String(value || "").toLowerCase()).filter(Boolean);
        return [...admins, ...employees].find((item) => {
          const localValues = [
            item.username,
            item.serialNumber,
            item.serial_number,
            item.email,
            item.emailAddress,
            item.email_address
          ].map((value) => String(value || "").toLowerCase());
          return keyValues.some((value) => localValues.includes(value));
        }) || {};
      }

      function mapBackendAccount(row) {
        const type = normalizePortalRole(row.account_type) || "User";
        const local = findLocalAccountForBackend(row);
        return {
          id: accountIdFromQr(row),
          backendId: row.id,
          type,
          accountType: type,
          rank: row.rank || "",
          role: type === "User" ? (row.rank || "") : type,
          firstName: row.first_name || "",
          middleInitial: row.middle_initial || "",
          lastName: row.last_name || "",
          serialNumber: row.serial_number || "",
          username: row.username || row.serial_number || "",
          department: row.department || "",
          service: row.service || "PN",
          emailAddress: row.email_address || "",
          email: row.email_address || "",
          contactNumber: row.contact_number || "",
          photo: row.photo || local.photo || "",
          active: row.active !== 0
        };
      }

      async function syncAccountsFromBackend() {
        const response = await fetch("http://localhost:3000/api/accounts", { headers: authHeaders() });
        if (!response.ok) throw new Error("Backend account sync failed");
        const rows = await response.json();
        const mapped = uniqueAccounts(rows.map(mapBackendAccount));
        employees = mapped.filter((item) => item.type === "User");
        admins = mapped.filter((item) => item.type === "Admin" || item.type === "Super Admin");
        saveAll();
        return mapped;
      }

      function normalizePortalRole(value) {
        const role = String(value || "").toLowerCase();
        if (role === "admin" || role === "administrator") return "Admin";
        if (role === "super admin" || role === "super administrator") return "Super Admin";
        return role === "user" ? "User" : "";
      }

      function superProfileStorageKey(user) {
        const key = user.id || user.username || user.serial_number || user.email_address || "current";
        return "tramsProfileSuper:" + String(key).toLowerCase();
      }

      function isCurrentLoginAccount(item, loginName, user) {
        const values = [
          item.id,
          item.username,
          item.serial_number,
          item.serialNumber,
          item.email,
          item.emailAddress,
          item.email_address
        ].map((value) => String(value || "").toLowerCase());
        return values.includes(loginName) || (user.id && String(item.id || "") === String(user.id));
      }

      function currentSuperProfileData() {
        const user = JSON.parse(sessionStorage.getItem("tramsUser") || "{}");
        const session = JSON.parse(sessionStorage.getItem("tramsSession") || "{}");
        const loginName = String(session.userName || user.username || "").toLowerCase();
        const currentAdmin = JSON.parse(localStorage.getItem("tramsCurrentAdmin") || "null") || {};
        const localMatch = admins.find((item) =>
          normalizePortalRole(item.type || item.accountType || item.role || item.account_type) === "Super Admin" &&
          isCurrentLoginAccount(item, loginName, user)
        ) || {};
        const currentMatch = (
          normalizePortalRole(currentAdmin.type || currentAdmin.accountType || currentAdmin.role || currentAdmin.account_type) === "Super Admin" &&
          isCurrentLoginAccount(currentAdmin, loginName, user)
        ) ? currentAdmin : {};
        const savedProfile = JSON.parse(localStorage.getItem(superProfileStorageKey(user)) || "{}");
        const merged = { ...localMatch, ...currentMatch, ...user, ...savedProfile, role: "Super Admin", accountType: "Super Admin" };
        merged.photo = savedProfile.photo || user.photo || currentMatch.photo || localMatch.photo || "";
        return merged;
      }

      function applyAdminProfile() {
        try {
          const admin = currentSuperProfileData();
          if (normalizePortalRole(admin.account_type || admin.accountType || admin.role) !== "Super Admin") return;
          const displayName = fullName(admin) || admin.name || admin.username || admin.serial_number || admin.serialNumber || "Super Admin";
          const avatar = $(".admin-avatar");
          const info = $(".admin-info");
          if (avatar) {
            avatar.innerHTML = admin.photo
              ? '<img src="' + admin.photo + '" alt="Super admin photo">'
              : esc(displayName.charAt(0).toUpperCase());
          }
          if (info) {
            info.innerHTML =
              '<div style="font-weight: 700" id="sidebarName">' + esc(displayName) + '</div>' +
              '<div style="font-size: 13px; color: #7fc3f5" id="sidebarRole">Super Administrator</div>';
          }
          localStorage.setItem("tramsCurrentAdmin", JSON.stringify(admin));
        } catch (e) {}
      }
      function allAccounts() {
        return uniqueAccounts([
          ...admins.map((a) => ({ ...a, type: accountType(a, "Admin") })),
          ...employees.map((e) => ({ ...e, type: "User" })),
        ]);
      }
      function accountIdentity(a) {
        const type = normalizePortalRole(a.type || a.accountType || a.role || a.account_type) || "User";
        const keys = [
          a.username ? "username:" + a.username : "",
          a.serialNumber ? "serial:" + a.serialNumber : "",
          a.serial_number ? "serial:" + a.serial_number : "",
          a.emailAddress ? "email:" + a.emailAddress : "",
          a.email ? "email:" + a.email : "",
          a.email_address ? "email:" + a.email_address : "",
          a.backendId ? "backend:" + a.backendId : ""
        ].map((value) => String(value || "").toLowerCase()).filter(Boolean);
        return type + "|" + (keys[0] || "id:" + String(a.id || "").toLowerCase());
      }
      function preferAccount(next, current) {
        if (!current) return next;
        if (next.backendId && !current.backendId) return { ...current, ...next };
        if (!next.backendId && current.backendId) return { ...next, ...current };
        if (next.backendId && current.backendId) return current;
        return { ...current, ...next };
      }
      function uniqueAccounts(list) {
        const byKey = new Map();
        list.forEach((item) => {
          const key = accountIdentity(item);
          byKey.set(key, preferAccount(item, byKey.get(key)));
        });
        return [...byKey.values()];
      }
      function saveDedupedAccounts() {
        const deduped = uniqueAccounts([
          ...admins.map((a) => ({ ...a, type: accountType(a, "Admin") })),
          ...employees.map((e) => ({ ...e, type: "User" }))
        ]);
        employees = deduped.filter((item) => item.type === "User");
        admins = deduped.filter((item) => item.type === "Admin" || item.type === "Super Admin");
        saveAll();
      }
      function departmentNames() {
        const formDepartmentSelect = $("#department");
        if (formDepartmentSelect) {
          return [...formDepartmentSelect.options]
            .map((option) => option.value)
            .filter(Boolean);
        }
        return [...new Set(allAccounts().map((a) => a.department).filter(Boolean))].sort();
      }
      function populateDepartmentSelect(selector) {
        const select = $(selector);
        if (!select) return;
        const current = select.value;
        select.innerHTML =
          '<option value="">Select Department</option>' +
          departmentNames().map((d) => '<option value="' + esc(d) + '">' + esc(d) + "</option>").join("");
        select.value = departmentNames().includes(current) ? current : "";
      }
      function isSameDate(date, value) {
        if (!value) return true;
        const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 10);
        return local === value;
      }
      function mailLink(a, type) {
        const typeLabel = type === "Admin" ? "Administrator" : (type === "Super Admin" ? "Super Administrator" : "User");
        const passwordLine = hasGeneratedPassword(type) ? "\nPassword: " + a.password + "\n" : "";
        let subject = encodeURIComponent("TRAMS " + typeLabel + " QR Code"),
          body = encodeURIComponent(
            "Good day " +
              fullName(a) +
              ",\n\nYour " +
              typeLabel +
              " account has been created.\nAccount Type: " +
              typeLabel +
              "\n" +
              passwordLine +
              "\nQR Code Link:\n" +
              qr(a) +
              "\n\nQR Payload:\n" +
              payload(a),
          );
        return (
          "mailto:" +
          (a.emailAddress || a.email) +
          "?subject=" +
          subject +
          "&body=" +
          body
        );
      }
      function setPage(id) {
        // Close Appearance Settings
        $("#themeFloatingPanel").classList.remove("active");
        $("#settingsPanel").style.display = "none";

        // Open selected page
        $$(".page").forEach((p) =>
          p.classList.toggle("active", p.id === id)
        );

        // Update active menu state
        $$(".menu-item").forEach((m) =>
          m.classList.toggle("active", m.dataset.page === id)
        );

        renderAll();
      }
      $$(".menu-item[data-page]").forEach(
        (m) => (m.onclick = () => setPage(m.dataset.page)),
      );
      $("#settingsBtn").onclick = () => {
        const panel = $("#settingsPanel");
        const appearance = $("#themeFloatingPanel");
        const isOpen = appearance.classList.contains("active");

        // Remove active state from all menu items
        $$(".menu-item").forEach((m) => m.classList.remove("active"));
        if (isOpen) {
          // Close Settings
          panel.style.display = "none";
          appearance.classList.remove("active");

          // Return to Dashboard
          setPage("dashboardPage");

        } else {

          // Open Settings
          panel.style.display = "flex";
          appearance.classList.add("active");

          // Hide all pages
          $$(".page").forEach((p) => p.classList.remove("active"));
          $("#settingsBtn").classList.add("active");
        }
      };
      $("#settingsAccountsField").onclick = () => {
        $("#settingsPanel").style.display = "none";
        $("#themeFloatingPanel").classList.remove("active");
        setPage("accountsPage");
      };
      $("#toggleSidebarBtn").onclick = () => {
        $(".sidebar").classList.toggle("collapsed");
        const isCollapsed = $(".sidebar").classList.contains("collapsed");
        $(".toggle-sidebar-text").textContent = isCollapsed ? "" : "Hide Sidebar";
        $("#toggleSidebarBtn").setAttribute(
          "data-tooltip",
          isCollapsed ? "Show the navigation sidebar" : "Toggle the navigation sidebar"
        );
      };

      const loadingScreen = $("#loadingScreen");
      const loaderCard = $("#loaderCard");
      const logoutConfirm = $("#logoutConfirm");
      const logoutLoadingScreen = $("#logoutLoadingScreen");

      function hideLoadingScreen() {
        document.body.classList.remove("app-loading");
        loadingScreen.classList.add("is-hidden");
      }
      function showLoadingScreen() {
        document.body.classList.add("app-loading");
        loadingScreen.classList.remove("is-hidden");
      }
      window.addEventListener("load", () => {
        setTimeout(hideLoadingScreen, 2000);
      });
      loadingScreen.addEventListener("mousemove", (event) => {
        const bounds = loaderCard.getBoundingClientRect();
        const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 8;
        const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * -8;
        loaderCard.style.transform = `rotateX(${y}deg) rotateY(${x}deg)`;
      });
      loadingScreen.addEventListener("mouseleave", () => {
        loaderCard.style.transform = "";
      });
      $("#logoutBtn").onclick = () => {
        logoutConfirm.classList.add("active");
      };
      $("#cancelLogoutBtn").onclick = () => {
        logoutConfirm.classList.remove("active");
      };
      logoutConfirm.addEventListener("click", (event) => {
        if (event.target === logoutConfirm) logoutConfirm.classList.remove("active");
      });
      $("#confirmLogoutBtn").onclick = () => {
        logoutConfirm.classList.remove("active");
        logoutLoadingScreen.classList.add("active");

        // Clear ALL session data so auto-redirect doesn't fire
        sessionStorage.clear();
        localStorage.removeItem('tramsCurrentAdmin');

        setTimeout(() => {
          location.href = "/login";
        }, 3500);
      };
      $("#lightThemeCard").onclick = () => {
        document.body.classList.add("light-mode");
        localStorage.setItem("theme", "light");
        $("#lightThemeCard").classList.add("active");
        $("#darkThemeCard").classList.remove("active");
      };
      $("#darkThemeCard").onclick = () => {
        document.body.classList.remove("light-mode");
        localStorage.setItem("theme", "dark");
        $("#darkThemeCard").classList.add("active");
        $("#lightThemeCard").classList.remove("active");
      };

      if (localStorage.getItem("theme") === "light")
        $("#lightThemeCard").click();

      $("#addAccountBtn").onclick = () => {
        $("#accountForm").reset();
        $("#accountId").value = "";
        selectedPhoto = "";
        $("#photoPreview").textContent = "Photo";
        $("#saveAccountBtn").textContent = "Create Account";
        $("#deleteAccountBtn").style.display = "none";
        $("#toggleAccountBtn").style.display = "none";
        showAccountForm();
      };
        
      $("#accountPhoto").onchange = async (e) => {
        let f = e.target.files[0];
        if (!f) return;
        if (f.size > 5 * 1024 * 1024) {
          alert("Photo must be under 5MB.");
          return;
        }
        try {
          selectedPhoto = await photoFileToDataUrl(f);
          $("#photoPreview").innerHTML =
            '<img src="' + selectedPhoto + '" alt="Photo">';
        } catch (error) {
          alert("Could not read the selected photo. Please choose another image.");
        }
      };
      $("#cancelFormBtn").onclick = () => {
        $("#cancelAccountModal").classList.add("active");
      };
      $("#keepEditingBtn").onclick = () => {
        $("#cancelAccountModal").classList.remove("active");
      };
      $("#confirmCancelAccountBtn").onclick = () => {
        $("#cancelAccountModal").classList.remove("active");
        $("#accountForm").reset();
        $("#accountId").value = "";
        selectedPhoto = "";
        $("#photoPreview").textContent = "Photo";
        showAccountTable();
      };

      $("#accountForm").onsubmit = async (e) => {
        e.preventDefault();
        const saveBtn = $("#saveAccountBtn");
        if (saveBtn.disabled) return;
        let type = $("#accountType").value,
          existingId = $("#accountId").value,
          previousAccount = allAccounts().find((a) => a.id === existingId),
          generatedPassword = hasGeneratedPassword(type) ? (existingId ? (previousAccount?.password || "") : temporaryPassword()) : "",
          item = {
            id:
              existingId ||
              (type === "User" ? "EMP-" : "ADM-") + Date.now(),
            type,
            rank: $("#rankRole").value,
            role: type === "Super Admin" ? "Super Admin" : (type === "Admin" ? "Admin" : $("#rankRole").value),
            firstName: $("#firstName").value.trim(),
            middleInitial: $("#middleInitial").value.trim(),
            lastName: $("#lastName").value.trim(),
            serialNumber: $("#serialNumber").value.trim(),
            username: $("#serialNumber").value.trim(),
            department: $("#department").value.trim(),
            service: "PN",
            emailAddress: $("#emailAddress").value.trim(),
            email: $("#emailAddress").value.trim(),
            contactNumber: $("#contactNumber").value.trim(),
            photo: selectedPhoto,
            photoChanged: false,
            active: true,
          };
        if (hasGeneratedPassword(type)) {
          item.password = generatedPassword;
        }
        if (!existingId || selectedPhoto !== (previousAccount?.photo || "")) {
          item.photoChanged = true;
        }
        if (existingId && !confirm("Confirm changes to this account?")) return;
        saveBtn.disabled = true;
        if (!existingId) {
          try {
            const result = await createBackendAccount(item, type);
            item.backendId = result.id;
            if (result.email_status === "failed") {
              alert("Account was created and can log in, but the email was not sent. Check the backend email settings.");
              location.href = mailLink(item, type);
            } else {
              alert("Account created successfully. The login account is ready.");
            }
          } catch (error) {
            alert("The account was not created because the backend login account failed: " + error.message);
            renderAll();
            saveBtn.disabled = false;
            return;
          }
        } else {
          item.backendId = previousAccount?.backendId;
          try {
            await updateBackendAccount(item, type);
            alert("Account updated successfully.");
          } catch (error) {
            alert("The account was not updated because the backend update failed: " + error.message);
            renderAll();
            saveBtn.disabled = false;
            return;
          }
        }
        const itemKey = accountIdentity(item);
        employees = employees.filter((a) => a.id !== item.id && accountIdentity({ ...a, type: "User" }) !== itemKey);
        admins = admins.filter((a) => a.id !== item.id && accountIdentity(a) !== itemKey);
        if (hasGeneratedPassword(type)) {
          admins.unshift(item);
        } else {
          delete item.password;
          employees.unshift(item);
        }
        saveDedupedAccounts();
        $("#accountForm").reset();
        $("#accountId").value = "";
        selectedPhoto = "";
        $("#photoPreview").textContent = "Photo";
        showAccountTable();
        renderAll();
        saveBtn.disabled = false;
      };
      function findPerson(id) {
        return (
          employees.find((e) => String(e.id) === String(id) || String(e.backendId) === String(id)) ||
          admins.find((a) => String(a.id) === String(id) || String(a.backendId) === String(id)) ||
          logs.find((log) => String(log.employeeId) === String(id))?.employee ||
          { id, name: id }
        );
      }
      function renderAccounts() {
        let q = ($("#accountSearch").value || "").toLowerCase();
        let department = $("#accountDepartmentFilter")?.value || "";
        let type = $("#accountTypeFilter")?.value || "";
        populateDepartmentSelect("#accountDepartmentFilter");
        let rows = allAccounts().filter(a =>
          (!q ||
            fullName(a).toLowerCase().includes(q) ||
            (a.emailAddress || a.email || "").toLowerCase().includes(q)) &&
          (!department || a.department === department) &&
          (!type || a.type === type)
        );

        const totalRows = rows.length;

        const totalPages = Math.max(
          1,
          Math.ceil(totalRows / rowsPerPage)
        );
        if (currentPage > totalPages) {
          currentPage = totalPages;
        }
        const start = (currentPage - 1) * rowsPerPage;
        const pagedRows =
          rows.slice(start, start + rowsPerPage);
        const end =
          Math.min(
            start + rowsPerPage,
            totalRows
          );

        $("#currentPage").textContent = currentPage;
        $("#currentPage").textContent = currentPage;
        $("#totalPages").textContent = totalPages;

        $("#prevPageBtn").disabled =
          currentPage === 1;
        $("#nextPageBtn").disabled =
          currentPage === totalPages;
        $("#accountsBody").innerHTML = pagedRows.length
          ? pagedRows.map(a =>
            '<tr data-id="' +
            a.id +
            '" data-type="' +
            a.type +
            '" tabindex="0"><td>' +
            esc(a.type) +
            "</td><td>" +
            esc(fullName(a)) +
            "</td><td>" +
            esc(a.rank || a.role) +
            "</td><td>" +
            esc(a.department) +
            "</td><td>" +
            esc(a.emailAddress || a.email) +
            '</td><td><img class="qr" src="' +
            qr(a) +
            '" alt="QR"></td></tr>'
          ).join("")
          : '<tr><td colspan="6">No accounts found.</td></tr>';
      }

      window.editAccount = (id, type) => {
        let a = (type === "User" ? employees : admins).find(
          (x) => x.id === id,
        );
        if (!a) return;
        $("#accountId").value = a.id;
        $("#accountType").value = accountType(a, type);
        $("#rankRole").value = a.rank || a.role || "";
        $("#department").value = a.department || "";
        $("#firstName").value = a.firstName || "";
        $("#middleInitial").value = a.middleInitial || "";
        $("#lastName").value = a.lastName || "";
        $("#serialNumber").value = a.serialNumber || a.username || "";
        $("#emailAddress").value = a.emailAddress || a.email || "";
        $("#contactNumber").value = a.contactNumber || "";
        selectedPhoto = a.photo || "";
        $("#photoPreview").innerHTML = selectedPhoto
          ? '<img src="' + selectedPhoto + '">'
          : "Photo";
        $("#saveAccountBtn").textContent = "Update Account";
        $("#deleteAccountBtn").style.display = "inline-flex";
        $("#toggleAccountBtn").style.display = "inline-flex";
        $("#toggleAccountBtn").textContent = a.active ? "Deactivate" : "Activate";
        showAccountForm();
        scrollTo(0, 0);
      };
      window.toggleAccount = (id, type) => {
        let list = type === "User" ? employees : admins,
          a = list.find((x) => x.id === id);
        if (a) {
          a.active = !a.active;
          saveAll();
          renderAll();
        }
      };
      async function syncAttendanceFromBackend() {
        const response = await fetch("http://localhost:3000/api/attendance", { headers: authHeaders() });
        if (!response.ok) throw new Error("Backend attendance sync failed");
        const rows = await response.json();
        logs = rows.map((row) => ({
          id: row.id,
          employeeId: String(row.employee_id || row.employeeId || row.account_id || ''),
          type: row.type || row.log_type,
          timestamp: row.timestamp,
          accountType: row.account_type,
          employee: {
            id: String(row.employee_id || row.employeeId || row.account_id || ''),
            type: row.account_type,
            accountType: row.account_type,
            rank: row.rank || '',
            firstName: row.first_name || '',
            middleInitial: row.middle_initial || '',
            lastName: row.last_name || '',
            serialNumber: row.serial_number || row.username || '',
            emailAddress: row.email_address || '',
            department: row.department || '',
            service: row.service || '',
            photo: row.photo || ''
          }
        }));
        return logs;
      }

      function renderLogs() {
        if (!logs.length) logs = [];
        populateDepartmentSelect("#attendanceDepartmentFilter");
        let q = ($("#attendanceSearch")?.value || "").toLowerCase();
        let day = $("#attendanceDateFilter")?.value || "";
        let department = $("#attendanceDepartmentFilter")?.value || "";
        let type = $("#attendanceTypeFilter")?.value || "";
        let rows = logs
          .slice()
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .filter((l) => {
            let p = findPerson(l.employeeId);
            let d = new Date(l.timestamp);
            let name = fullName(p) || l.employeeId;
            return (
              (!q || name.toLowerCase().includes(q)) &&
              isSameDate(d, day) &&
              (!department || p.department === department) &&
              (!type || accountType(findPerson(l.employeeId), employees.some(e=>e.id===l.employeeId)?"User":"Admin") === type)
            );
          });
        const totalPages = Math.max(1, Math.ceil(rows.length / attendanceRowsPerPage));
        if (attendancePage > totalPages) attendancePage = totalPages;
        const start = (attendancePage - 1) * attendanceRowsPerPage;
        const paged = rows.slice(start, start + attendanceRowsPerPage);
        $("#attendanceCurrentPage").textContent = attendancePage;
        $("#attendanceTotalPages").textContent = totalPages;
        $("#attendancePrevBtn").disabled = attendancePage === 1;
        $("#attendanceNextBtn").disabled = attendancePage === totalPages;
        $("#attendanceBody").innerHTML = paged.length
          ? paged
              .map((l) => {
                let p = findPerson(l.employeeId),
                  d = new Date(l.timestamp);
                let accType = accountType(p, employees.some(e => e.id === l.employeeId) ? "User" : "Admin");
                return (
                  "<tr><td>" +
                  d.toLocaleDateString() +
                  "</td><td>" +
                  esc(fullName(p) || l.employeeId) +
                  "</td><td>" +
                  esc(p.department || "") +
                  "</td><td>" +
                  esc(accType) +
                  "</td><td>" +
                  (l.type === "IN" ? d.toLocaleTimeString() : "-") +
                  "</td><td>" +
                  (l.type === "OUT" ? d.toLocaleTimeString() : "-") +
                  '</td><td><span class="status-badge status-' + (l.type === "IN" ? "in" : "out") + '">' +
                  '<i class="fa-solid ' + (l.type === "IN" ? "fa-right-to-bracket" : "fa-right-from-bracket") + '"></i> ' +
                  (l.type === "IN" ? "IN" : "OUT") +
                  "</span></td></tr>"
                );
              })
              .join("")
          : '<tr><td colspan="7">No attendance logs found.</td></tr>';
      }
      function countBy(items, getter) {
        return items.reduce((acc, item) => {
          const key = getter(item) || "Unassigned";
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {});
      }
      /* â”€â”€ Per-canvas hover state storage â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
      const _chartMeta = {};   // canvasId -> { labels, values, kind, colors, layout }

      function drawChart(canvasId, labels, values, kind, colors) {
        colors = colors || ["#3c8dff", "#54d6ff", "#f2b72a", "#29a35a", "#d25f5f"];
        const canvas = $("#" + canvasId);
        if (!canvas) return;

        /* â”€â”€ Store metadata for hover & re-draw â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
        _chartMeta[canvasId] = { labels, values, kind, colors };

        /* â”€â”€ Build / reuse .chart-body wrapper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
        let body = canvas.closest(".chart-body");
        if (!body) {
          /* Wrap canvas in .chart-canvas-wrap then in .chart-body */
          const wrap = document.createElement("div");
          wrap.className = "chart-canvas-wrap";
          canvas.parentNode.insertBefore(wrap, canvas);
          wrap.appendChild(canvas);

          /* Tooltip element */
          const tip = document.createElement("div");
          tip.className = "chart-tooltip";
          tip.id = canvasId + "_tip";
          wrap.appendChild(tip);

          body = document.createElement("div");
          body.className = "chart-body";
          wrap.parentNode.insertBefore(body, wrap);
          body.appendChild(wrap);
        }

        /* â”€â”€ Legend pills (beside the graph) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
        const legendId = canvasId + "_legend";
        let legendEl = document.getElementById(legendId);
        if (!legendEl) {
          legendEl = document.createElement("div");
          legendEl.id = legendId;
          legendEl.className = "chart-legend";
          body.appendChild(legendEl);
        }
        legendEl.innerHTML = "";
        labels.forEach((label, i) => {
          const pill = document.createElement("div");
          pill.className = "legend-pill";
          const dot = document.createElement("span");
          dot.className = "legend-dot";
          dot.style.background = colors[i % colors.length];
          const txt = document.createElement("span");
          txt.className = "legend-text";
          txt.textContent = label + ": " + values[i];
          pill.appendChild(dot);
          pill.appendChild(txt);
          legendEl.appendChild(pill);
        });

        /* â”€â”€ Canvas drawing â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
        _paintChart(canvasId, 1, null);   // full render at progress=1

        /* â”€â”€ Hover listener (attach once) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
        if (!canvas._hoverBound) {
          canvas._hoverBound = true;
          canvas.style.cursor = "crosshair";
          canvas.addEventListener("mousemove", (e) => {
            const rect2 = canvas.getBoundingClientRect();
            const mx = e.clientX - rect2.left;
            const my = e.clientY - rect2.top;
            _handleHover(canvasId, mx, my, rect2.width, rect2.height);
          });
          canvas.addEventListener("mouseleave", () => {
            const tip = document.getElementById(canvasId + "_tip");
            if (tip) tip.style.display = "none";
            _paintChart(canvasId, 1, null);
          });
        }
      }

      /* â”€â”€ Internal: paint chart at a given progress & optional highlight â”€â”€ */
      function _paintChart(canvasId, progress, highlight) {
        const canvas = $("#" + canvasId);
        if (!canvas) return;
        const meta = _chartMeta[canvasId];
        if (!meta) return;
        const { labels, values, kind, colors } = meta;

        const ctx = canvas.getContext("2d");
        const rect = canvas.getBoundingClientRect();
        const ratio = window.devicePixelRatio || 1;
        canvas.width  = Math.max(1, rect.width  * ratio);
        canvas.height = Math.max(1, rect.height * ratio);
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        const w = rect.width, h = rect.height;
        ctx.clearRect(0, 0, w, h);
        const max = Math.max(1, ...values);

        if (kind === "pie") {
          const total = values.reduce((a, b) => a + b, 0) || 1;
          let start = -Math.PI / 2;
          const cx = w / 2, cy = h / 2;
          const r  = Math.min(w, h) * 0.42;
          values.forEach((value, i) => {
            const slice = (value / total) * Math.PI * 2 * progress;
            const isHl  = highlight === i;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            if (isHl) {
              /* Slightly explode highlighted slice */
              const midAngle = start + slice / 2;
              const ox = Math.cos(midAngle) * 6;
              const oy = Math.sin(midAngle) * 6;
              ctx.save();
              ctx.translate(ox, oy);
            }
            ctx.arc(cx, cy, isHl ? r * 1.06 : r, start, start + slice);
            ctx.closePath();
            ctx.fillStyle = colors[i % colors.length];
            ctx.globalAlpha = isHl ? 1 : (highlight !== null ? 0.72 : 1);
            ctx.fill();
            if (isHl) ctx.restore();
            ctx.globalAlpha = 1;
            start += (value / total) * Math.PI * 2;
          });
          /* Donut hole */
          ctx.globalCompositeOperation = "destination-out";
          ctx.beginPath();
          ctx.arc(cx, cy, r * 0.52, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalCompositeOperation = "source-over";
          /* Centre text */
          ctx.fillStyle = "#7a9ab8";
          ctx.font = "bold 11px Rajdhani";
          ctx.textAlign = "center";
          ctx.fillText("Accounts", cx, cy + 4);
          ctx.textAlign = "left";
          return;
        }

        /* Axes */
        const left = 42, top = 14, bottom = h - 32, barWidth = w - left - 12, barHeight = bottom - top;
        ctx.strokeStyle = "rgba(157,182,207,.22)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(left, top);
        ctx.lineTo(left, bottom);
        ctx.lineTo(w - 10, bottom);
        ctx.stroke();

        /* Y-axis guide lines */
        const steps = 4;
        ctx.font = "600 11px Rajdhani";
        for (let s = 1; s <= steps; s++) {
          const yy = bottom - (s / steps) * barHeight;
          ctx.strokeStyle = "rgba(157,182,207,.10)";
          ctx.beginPath(); ctx.moveTo(left, yy); ctx.lineTo(w - 10, yy); ctx.stroke();
          ctx.fillStyle = "#7a9ab8";
          ctx.fillText(Math.round((s / steps) * max), 2, yy + 4);
        }

        if (kind === "line") {
          /* Fill gradient under line */
          const grad = ctx.createLinearGradient(0, top, 0, bottom);
          grad.addColorStop(0, "rgba(84,214,255,0.18)");
          grad.addColorStop(1, "rgba(84,214,255,0)");
          ctx.beginPath();
          values.forEach((value, i) => {
            const x = left + (labels.length <= 1 ? barWidth / 2 : (i / (labels.length - 1)) * barWidth);
            const y = bottom - (value / max) * barHeight * progress;
            i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
          });
          ctx.lineTo(left + barWidth, bottom);
          ctx.lineTo(left, bottom);
          ctx.closePath();
          ctx.fillStyle = grad;
          ctx.fill();
          /* Line */
          ctx.strokeStyle = "#54d6ff";
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          values.forEach((value, i) => {
            const x = left + (labels.length <= 1 ? barWidth / 2 : (i / (labels.length - 1)) * barWidth);
            const y = bottom - (value / max) * barHeight * progress;
            i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
          });
          ctx.stroke();
          /* Dots */
          values.forEach((value, i) => {
            const x = left + (labels.length <= 1 ? barWidth / 2 : (i / (labels.length - 1)) * barWidth);
            const y = bottom - (value / max) * barHeight * progress;
            const isHl = highlight === i;
            ctx.fillStyle = isHl ? "#fff" : "#f2b72a";
            ctx.beginPath();
            ctx.arc(x, y, isHl ? 6 : 4, 0, Math.PI * 2);
            ctx.fill();
            if (isHl) {
              ctx.strokeStyle = "#f2b72a";
              ctx.lineWidth = 2;
              ctx.stroke();
              ctx.lineWidth = 1;
            }
          });
          /* X labels */
          ctx.font = "600 10px Rajdhani";
          ctx.fillStyle = "#7a9ab8";
          values.forEach((_, i) => {
            const x = left + (labels.length <= 1 ? barWidth / 2 : (i / (labels.length - 1)) * barWidth);
            ctx.save();
            ctx.translate(x, bottom + 14);
            ctx.rotate(-0.45);
            ctx.fillText(labels[i], -14, 0);
            ctx.restore();
          });
        } else {
          /* Bar chart */
          const gap = 6;
          const bw = Math.max(10, (barWidth - gap * (labels.length - 1)) / Math.max(1, labels.length));
          values.forEach((value, i) => {
            const bh   = (value / max) * barHeight * progress;
            const x    = left + i * (bw + gap);
            const y    = bottom - bh;
            const isHl = highlight === i;
            ctx.globalAlpha = isHl ? 1 : (highlight !== null ? 0.58 : 1);
            /* Bar with rounded top */
            const rad = Math.min(4, bw / 2);
            ctx.beginPath();
            ctx.moveTo(x + rad, y);
            ctx.lineTo(x + bw - rad, y);
            ctx.quadraticCurveTo(x + bw, y, x + bw, y + rad);
            ctx.lineTo(x + bw, bottom);
            ctx.lineTo(x, bottom);
            ctx.lineTo(x, y + rad);
            ctx.quadraticCurveTo(x, y, x + rad, y);
            ctx.closePath();
            ctx.fillStyle = isHl
              ? colors[i % colors.length]
              : colors[i % colors.length];
            if (isHl) {
              ctx.shadowColor = colors[i % colors.length];
              ctx.shadowBlur  = 10;
            }
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1;
            /* Value label */
            if (value > 0) {
              ctx.fillStyle = isHl ? "#fff" : "rgba(255,255,255,0.75)";
              ctx.font = isHl ? "bold 11px Rajdhani" : "600 10px Rajdhani";
              ctx.textAlign = "center";
              ctx.fillText(value, x + bw / 2, y - 5);
              ctx.textAlign = "left";
            }
            /* X label */
            ctx.fillStyle = "#9db6cf";
            ctx.font = "600 10px Rajdhani";
            ctx.save();
            ctx.translate(x + bw / 2, bottom + 14);
            ctx.rotate(-0.45);
            ctx.fillText(labels[i], -14, 0);
            ctx.restore();
          });
        }
      }

      /* â”€â”€ Hover handler â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
      function _handleHover(canvasId, mx, my, cw, ch) {
        const meta = _chartMeta[canvasId];
        if (!meta) return;
        const { labels, values, kind } = meta;
        const tip = document.getElementById(canvasId + "_tip");
        if (!tip) return;

        let hitIdx = null;

        if (kind === "pie") {
          const cx = cw / 2, cy = ch / 2;
          const r  = Math.min(cw, ch) * 0.42;
          const ri = r * 0.52;
          const dx = mx - cx, dy = my - cy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist >= ri && dist <= r * 1.06) {
            const total = values.reduce((a, b) => a + b, 0) || 1;
            let angle = Math.atan2(dy, dx) - (-Math.PI / 2);
            if (angle < 0) angle += Math.PI * 2;
            let start = 0;
            values.forEach((v, i) => {
              const slice = (v / total) * Math.PI * 2;
              if (angle >= start && angle < start + slice) hitIdx = i;
              start += slice;
            });
          }
        } else if (kind === "line") {
          const left = 42, bottom = ch - 32, bw = cw - left - 12, bh = bottom - 14;
          const max  = Math.max(1, ...values);
          let bestD  = 20;
          values.forEach((v, i) => {
            const x = left + (labels.length <= 1 ? bw / 2 : (i / (labels.length - 1)) * bw);
            const y = bottom - (v / max) * bh;
            const d = Math.sqrt((mx - x) ** 2 + (my - y) ** 2);
            if (d < bestD) { bestD = d; hitIdx = i; }
          });
        } else {
          const left = 42, bottom = ch - 32, bw_total = cw - left - 12;
          const gap  = 6;
          const bw   = Math.max(10, (bw_total - gap * (labels.length - 1)) / Math.max(1, labels.length));
          values.forEach((v, i) => {
            const x = left + i * (bw + gap);
            if (mx >= x && mx <= x + bw && my >= 14 && my <= bottom) hitIdx = i;
          });
        }

        _paintChart(canvasId, 1, hitIdx);

        if (hitIdx !== null) {
          const pct = kind === "pie"
            ? " (" + Math.round((values[hitIdx] / (values.reduce((a,b)=>a+b,0)||1)) * 100) + "%)"
            : "";
          tip.textContent = labels[hitIdx] + ": " + values[hitIdx] + pct;
          /* Position tooltip near cursor but keep it inside the canvas */
          const canvasRect = document.getElementById(canvasId).closest(".chart-canvas-wrap").getBoundingClientRect();
          let tx = mx + 14, ty = my - 10;
          if (tx + 160 > cw) tx = mx - 170;
          if (ty < 0) ty = my + 16;
          tip.style.left = tx + "px";
          tip.style.top  = ty + "px";
          tip.style.display = "block";
        } else {
          tip.style.display = "none";
        }
      }
      function logBuckets() {
        const buckets = {};
        for (let hour = 0; hour < 24; hour++) buckets[hour] = 0;
        logs.forEach((l) => {
          const hour = new Date(l.timestamp).getHours();
          buckets[hour] = (buckets[hour] || 0) + 1;
        });
        return Object.entries(buckets)
          .filter(([, value]) => value > 0)
          .map(([hour, value]) => ({ label: `${Number(hour) % 12 || 12}${Number(hour) < 12 ? "AM" : "PM"}`, value }));
      }
      function trendBuckets(mode) {
        const buckets = {};
        logs.forEach((l) => {
          const d = new Date(l.timestamp);
          let key = d.toLocaleDateString();
          if (mode === "weekly") key = "Week " + Math.ceil(d.getDate() / 7) + " " + d.toLocaleString(undefined, { month: "short" });
          if (mode === "monthly") key = d.toLocaleString(undefined, { month: "short", year: "numeric" });
          buckets[key] = (buckets[key] || 0) + 1;
        });
        return Object.entries(buckets).slice(-12).map(([label, value]) => ({ label, value }));
      }
      function reportPersonType(log) {
        const p = findPerson(log.employeeId);
        if (log.accountType) return accountType({ type: log.accountType }, log.accountType);
        return accountType(p, employees.some((e) => String(e.id) === String(log.employeeId) || String(e.backendId) === String(log.employeeId)) ? "User" : "Admin");
      }
      function reportPersonName(log) {
        const p = findPerson(log.employeeId);
        return fullName(p) || p.name || log.employeeId || "Unknown";
      }
      function reportPersonDepartment(log) {
        const p = findPerson(log.employeeId);
        return p.department || log.employee?.department || "Unassigned";
      }
      function pad2(value) {
        return String(value).padStart(2, "0");
      }
      function localDateKey(date) {
        return date.getFullYear() + "-" + pad2(date.getMonth() + 1) + "-" + pad2(date.getDate());
      }
      function weekStart(date) {
        const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const day = d.getDay() || 7;
        d.setDate(d.getDate() - day + 1);
        return d;
      }
      function dateRangeLabel(start, end) {
        return start.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) +
          " - " +
          end.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
      }
      function timeLabel(date) {
        return date ? date.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" }) : "-";
      }
      function normalizeReportLogType(log) {
        return String(log.type || log.log_type || "").toUpperCase();
      }
      function reportDateBounds() {
        const startValue = $("#timeReportStartDate")?.value || "";
        const endValue = $("#timeReportEndDate")?.value || "";
        return {
          start: startValue ? new Date(startValue + "T00:00:00") : null,
          end: endValue ? new Date(endValue + "T23:59:59.999") : null
        };
      }
      function reportScopeLabel() {
        const bounds = reportDateBounds();
        if (!bounds.start && !bounds.end) return "all available attendance dates";
        if (bounds.start && bounds.end) return dateRangeLabel(bounds.start, bounds.end);
        if (bounds.start) return "from " + bounds.start.toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
        return "until " + bounds.end.toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
      }
      function filteredTimeReportLogs(ignoreTypeFilter = false) {
        const selectedType = $("#timeReportTypeFilter")?.value || "All";
        const bounds = reportDateBounds();
        return logs
          .map((log) => ({ log, date: new Date(log.timestamp) }))
          .filter(({ log, date }) => {
            if (Number.isNaN(date.getTime())) return false;
            if (bounds.start && date < bounds.start) return false;
            if (bounds.end && date > bounds.end) return false;
            const type = reportPersonType(log);
            return ignoreTypeFilter || selectedType === "All" || type === selectedType;
          })
          .map(({ log }) => log);
      }
      function reportDurationMinutes(groupLogs) {
        let openIn = null;
        let minutes = 0;
        let pairs = 0;
        groupLogs
          .slice()
          .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
          .forEach((log) => {
            const d = new Date(log.timestamp);
            const type = normalizeReportLogType(log);
            if (type === "IN") {
              openIn = d;
            } else if (type === "OUT" && openIn && d > openIn) {
              minutes += Math.round((d - openIn) / 60000);
              pairs += 1;
              openIn = null;
            }
          });
        return { minutes, pairs };
      }
      function durationLabel(minutes) {
        const total = Math.max(0, Number(minutes) || 0);
        const hours = Math.floor(total / 60);
        const mins = total % 60;
        return hours + "h " + pad2(mins) + "m";
      }
      function buildTimeReportRows(period) {
        const grouped = {};

        filteredTimeReportLogs().forEach((log) => {
          const d = new Date(log.timestamp);
          const type = reportPersonType(log);

          let key = "";
          let label = "";
          if (period === "daily") {
            key = localDateKey(d);
            label = d.toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
          } else if (period === "weekly") {
            const start = weekStart(d);
            const end = new Date(start);
            end.setDate(start.getDate() + 6);
            key = localDateKey(start);
            label = dateRangeLabel(start, end);
          } else {
            key = d.getFullYear() + "-" + pad2(d.getMonth() + 1);
            label = d.toLocaleDateString("en-PH", { year: "numeric", month: "long" });
          }

          const personKey = String(log.employeeId || reportPersonName(log));
          const groupKey = period + "|" + key + "|" + type + "|" + personKey;
          if (!grouped[groupKey]) {
            grouped[groupKey] = {
              label,
              sortKey: key,
              type,
              person: reportPersonName(log),
              department: reportPersonDepartment(log),
              firstIn: null,
              lastOut: null,
              logs: []
            };
          }

          grouped[groupKey].logs.push(log);
          const logType = normalizeReportLogType(log);
          if (logType === "IN" && (!grouped[groupKey].firstIn || d < grouped[groupKey].firstIn)) grouped[groupKey].firstIn = d;
          if (logType === "OUT" && (!grouped[groupKey].lastOut || d > grouped[groupKey].lastOut)) grouped[groupKey].lastOut = d;
        });

        return Object.values(grouped).map((row) => {
          const duration = reportDurationMinutes(row.logs);
          return {
            ...row,
            total: row.logs.length,
            completePairs: duration.pairs,
            totalMinutes: duration.minutes
          };
        }).sort((a, b) => {
          if (a.sortKey !== b.sortKey) return a.sortKey < b.sortKey ? 1 : -1;
          if (a.type !== b.type) return a.type.localeCompare(b.type);
          return a.person.localeCompare(b.person);
        });
      }
      function renderTimeReportRoleSummary() {
        const summary = {
          User: { people: new Set(), logs: 0, minutes: 0 },
          Admin: { people: new Set(), logs: 0, minutes: 0 },
          "Super Admin": { people: new Set(), logs: 0, minutes: 0 }
        };
        const grouped = {};
        filteredTimeReportLogs(true).forEach((log) => {
          const d = new Date(log.timestamp);
          const type = reportPersonType(log);
          if (!summary[type]) return;
          const personKey = String(log.employeeId || reportPersonName(log));
          const dayKey = localDateKey(d);
          const groupKey = type + "|" + personKey + "|" + dayKey;
          if (!grouped[groupKey]) grouped[groupKey] = { type, logs: [] };
          grouped[groupKey].logs.push(log);
          summary[type].people.add(personKey);
          summary[type].logs += 1;
        });
        Object.values(grouped).forEach((group) => {
          summary[group.type].minutes += reportDurationMinutes(group.logs).minutes;
        });
        Object.entries(summary).forEach(([type, data]) => {
          const card = document.querySelector('[data-report-role="' + type + '"]');
          if (!card) return;
          const strong = card.querySelector("strong");
          const small = card.querySelector("small");
          if (strong) strong.textContent = data.people.size + (data.people.size === 1 ? " person" : " people");
          if (small) small.textContent = data.logs + " logs | " + durationLabel(data.minutes);
        });
      }
      function renderTimeReportTable(period, bodySelector, countSelector) {
        const rows = buildTimeReportRows(period);
        const body = $(bodySelector);
        const count = $(countSelector);
        if (count) count.textContent = rows.length + (rows.length === 1 ? " entry" : " entries");
        if (!body) return rows.length;
        body.innerHTML = rows.length
          ? rows.map((row) =>
              "<tr><td>" + esc(row.label) +
              "</td><td>" + esc(row.type) +
              "</td><td>" + esc(row.person) +
              "</td><td>" + esc(row.department) +
              "</td><td>" + esc(timeLabel(row.firstIn)) +
              "</td><td>" + esc(timeLabel(row.lastOut)) +
              "</td><td>" + row.completePairs +
              "</td><td>" + esc(durationLabel(row.totalMinutes)) +
              "</td><td>" + row.total +
              "</td></tr>"
            ).join("")
          : '<tr><td colspan="9">No time in/time out records found for this selection.</td></tr>';
        return rows.length;
      }
      function renderTimeReports() {
        const visiblePeriod = $("#timeReportPeriodFilter")?.value || "all";
        const counts = {
          daily: renderTimeReportTable("daily", "#dailyTimeReportBody", "#dailyReportCount"),
          weekly: renderTimeReportTable("weekly", "#weeklyTimeReportBody", "#weeklyReportCount"),
          monthly: renderTimeReportTable("monthly", "#monthlyTimeReportBody", "#monthlyReportCount")
        };
        $$("[data-period-section]").forEach((section) => {
          const period = section.getAttribute("data-period-section");
          section.classList.toggle("report-period-hidden", !(visiblePeriod === "all" || visiblePeriod === period));
        });
        const selectedType = $("#timeReportTypeFilter")?.value || "All";
        const total = Object.values(counts).reduce((sum, value) => sum + value, 0);
        const summary = $("#timeReportSummary");
        renderTimeReportRoleSummary();
        if (summary) summary.textContent = selectedType + " report view for " + reportScopeLabel() + " with " + total + " generated summary rows.";
      }
      function renderCharts() {
        const accounts = allAccounts();
        const accountCounts = countBy(accounts, (a) => a.type);
        const departmentCounts = countBy(accounts, (a) => a.department);
        const histogram = logBuckets();
        const trend = trendBuckets($("#reportTrendFilter")?.value || "daily");

        drawChart("reportAccountChart",      Object.keys(accountCounts),      Object.values(accountCounts),      "pie");
        drawChart("analyticsAccountChart",   Object.keys(accountCounts),      Object.values(accountCounts),      "pie");
        drawChart("reportDepartmentChart",   Object.keys(departmentCounts),   Object.values(departmentCounts),   "bar");
        drawChart("analyticsDepartmentChart",Object.keys(departmentCounts),   Object.values(departmentCounts),   "bar");
        drawChart("reportHistogramChart",    histogram.map((x) => x.label),   histogram.map((x) => x.value),    "bar", ["#54d6ff", "#f2b72a"]);
        drawChart("reportLineChart",         trend.map((x) => x.label),       trend.map((x) => x.value),        "line");

        const peak = histogram.slice().sort((a, b) => b.value - a.value)[0];
        $("#reportHistogramInsight").textContent  = peak ? "Peak log activity is around " + peak.label + "." : "No time-in/time-out logs yet.";
        $("#reportLineInsight").textContent       = trend.length ? "Showing " + ($("#reportTrendFilter")?.value || "daily") + " attendance trend." : "No trend data yet.";
        $("#reportAccountInsight").textContent    = accounts.length + " total accounts in the database.";
        $("#analyticsAccountInsight").textContent = accounts.length + " total accounts in the database.";
        $("#reportDepartmentInsight").textContent  = Object.keys(departmentCounts).length + " departments represented.";
        $("#analyticsDepartmentInsight").textContent = Object.keys(departmentCounts).length + " departments represented.";
      }
      function renderAnalytics() {
        let ins = logs.filter((l) => l.type === "IN").length,
          outs = logs.filter((l) => l.type === "OUT").length,
          active = [...employees, ...admins].filter((a) => a.active).length,
          total = [...employees, ...admins].length || 1;
        $("#analyticIn").textContent = ins;
        $("#analyticOut").textContent = outs;
        $("#analyticUsers").textContent = active;
        let vals = {
          coverage: Math.min(
            100,
            Math.round((logs.length / (employees.length || 1)) * 30),
          ),
          scanner: Math.min(100, logs.length * 10),
          active: Math.round((active / total) * 100),
        };
        Object.entries(vals).forEach(([id, v]) => {
          $("#" + id + "Text").textContent = v + "%";
          $("#" + id + "Fill").style.setProperty("--w", v + "%");
        });
      }
      function renderAll() {
        employees = read("tramsEmployees", read("navytime_employees", []));
        admins = read("tramsAdmins", []);
        applyAdminProfile();
        $("#statEmployees").textContent = employees.length;
        $("#statAdmins").textContent = admins.length;
        $("#statLogs").textContent = logs.length;
        renderAccounts();
        renderLogs();
        renderAnalytics();
        renderTimeReports();
        renderCharts();
      }
      $("#accountsBody").onclick = (e) => {
        let b = e.target.closest("button[data-action]");
        let row = e.target.closest("tr[data-id]");
        if (!b && row) {
          editAccount(row.dataset.id, row.dataset.type);
          return;
        }
        if (!b) return;
        if (b.dataset.action === "edit")
          editAccount(b.dataset.id, b.dataset.type);
        if (b.dataset.action === "toggle")
          toggleAccount(b.dataset.id, b.dataset.type);
      };
      $("#accountSearch").oninput = () => {
        currentPage = 1;
        renderAccounts();
      };
      ["#accountDepartmentFilter", "#accountTypeFilter"].forEach((selector) => {
        const el = $(selector);
        if (el) {
          el.onchange = () => {
            currentPage = 1;
            renderAccounts();
          };
        }
      });

      $("#prevPageBtn").onclick = () => {
        if(currentPage > 1){
          currentPage--;
          renderAccounts();
        }
      };
      $("#nextPageBtn").onclick = () => {
        currentPage++;
        renderAccounts();
      };

      $("#rowsPerPage").onchange = function(){

        rowsPerPage = Number(this.value);

        currentPage = 1;

        renderAccounts();
      };
      ["#attendanceSearch", "#attendanceDateFilter", "#attendanceDepartmentFilter", "#attendanceTypeFilter"].forEach((selector) => {
        const el = $(selector);
        if (el) {
          el.oninput = el.onchange = () => {
            attendancePage = 1;
            renderLogs();
          };
        }
      });
      $("#attendancePrevBtn").onclick = () => {
        if (attendancePage > 1) {
          attendancePage--;
          renderLogs();
        }
      };
      $("#attendanceNextBtn").onclick = () => {
        attendancePage++;
        renderLogs();
      };
      $("#attendanceRowsPerPage").onchange = function () {
        attendanceRowsPerPage = Number(this.value);
        attendancePage = 1;
        renderLogs();
      };
      ["#timeReportTypeFilter", "#timeReportPeriodFilter", "#timeReportStartDate", "#timeReportEndDate"].forEach((selector) => {
        const el = $(selector);
        if (el) el.oninput = el.onchange = renderTimeReports;
      });
      $("#resetTimeReportBtn").onclick = () => {
        $("#timeReportStartDate").value = "";
        $("#timeReportEndDate").value = "";
        renderTimeReports();
      };
      $("#reportTrendFilter").onchange = renderCharts;

      $("#deleteAccountBtn").onclick = async () => {
        const id = $("#accountId").value;
        const type = $("#accountType").value;
        if (!id || !confirm("Delete this account?")) return;
        const list = type === "User" ? employees : admins;
        const account = list.find((a) => a.id === id);
        const btn = $("#deleteAccountBtn");
        btn.disabled = true;
        try {
          await deleteBackendAccount(account);
          if (type === "User") {
            employees = employees.filter((a) => a.id !== id);
          } else {
            admins = admins.filter((a) => a.id !== id);
          }
        } catch (error) {
          console.error("Delete account failed:", error);
          alert(error.message || "Could not delete this account from the server.");
          btn.disabled = false;
          return;
        }
        saveAll();
        $("#accountForm").reset();
        $("#accountId").value = "";
        selectedPhoto = "";
        $("#photoPreview").textContent = "Photo";
        btn.disabled = false;
        showAccountTable();
        renderAll();
      };

      $("#toggleAccountBtn").onclick = () => {
        const id = $("#accountId").value;
        const type = $("#accountType").value;
        if (!id) return;
        toggleAccount(id, type);
        const list = type === "User" ? employees : admins;
        const account = list.find((a) => a.id === id);
        if (account) $("#toggleAccountBtn").textContent = account.active ? "Deactivate" : "Activate";
      };

      $("#syncBtn").onclick = async () => {
        const btn = $("#syncBtn");
        const icon = btn.querySelector(".sync-icon");
        const text = btn.querySelector(".sync-text");

        if(btn.classList.contains("syncing")) return;

        btn.classList.remove("synced");
        btn.classList.add("syncing");
        btn.disabled = true;
        icon.classList.remove("fa-rotate", "fa-circle-check", "fa-triangle-exclamation");
        icon.classList.add("fa-arrows-rotate", "fa-spin");
        text.textContent = "Synchronizing...";

        try{
          await Promise.all([syncAccountsFromBackend(), syncAttendanceFromBackend()]);

          setTimeout(() => {
            renderAll();
            icon.classList.remove("fa-spin", "fa-arrows-rotate");
            icon.classList.add("fa-circle-check");
            btn.classList.remove("syncing");
            btn.classList.add("synced");
            text.textContent = "Synced";

            setTimeout(() => {
              icon.classList.remove("fa-circle-check");
              icon.classList.add("fa-rotate");
              text.textContent = "Sync Records";
              btn.disabled = false;
              btn.classList.remove("synced");
            }, 1800);
          }, 1500);
        }catch(error){
          console.error("Sync failed:", error);
          icon.classList.remove("fa-spin", "fa-arrows-rotate");
          icon.classList.add("fa-triangle-exclamation");
          text.textContent = "Sync Failed";

          setTimeout(() => {
            icon.classList.remove("fa-triangle-exclamation");
            icon.classList.add("fa-rotate");
            text.textContent = "Sync Records";
            btn.disabled = false;
            btn.classList.remove("syncing", "synced");
          }, 2000);
        }
      };

      $("#exportPdfBtn").onclick = () => {
        renderAll();

        /* â”€â”€ Stamp date/time on the header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
        const now     = new Date();
        const dateStr = now.toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });
        const timeStr = now.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" });
        const dateEl  = $("#pdfPrintDate");
        if (dateEl) dateEl.textContent = "Generated: " + dateStr + " at " + timeStr;

        /* â”€â”€ Sync summary stats from live analytics data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
        /* Stat card values â€” mirror what renderAnalytics() computes */
        const pdfIn    = $("#pdfStatIn"),
              pdfOut   = $("#pdfStatOut"),
              pdfUsers = $("#pdfStatUsers");
        if (pdfIn)    pdfIn.textContent    = ($("#analyticIn")?.textContent    || "0");
        if (pdfOut)   pdfOut.textContent   = ($("#analyticOut")?.textContent   || "0");
        if (pdfUsers) pdfUsers.textContent = ($("#analyticUsers")?.textContent || "0");

        /* Progress bar values â€” read live text & fill percentages */
        const bars = [
          { pct: "pdfCoverageText", fill: "pdfCoverageFill", srcPct: "coverageText", srcFill: "coverageFill" },
          { pct: "pdfScannerText",  fill: "pdfScannerFill",  srcPct: "scannerText",  srcFill: "scannerFill"  },
          { pct: "pdfActiveText",   fill: "pdfActiveFill",   srcPct: "activeText",   srcFill: "activeFill"   },
        ];
        bars.forEach(({ pct, fill, srcPct, srcFill }) => {
          const pctVal  = $("#" + srcPct)?.textContent  || "0%";
          const fillPct = (getComputedStyle($("#" + srcFill) || document.body)
                          .getPropertyValue("--w") || pctVal).trim();
          const pdfPct  = $("#" + pct);
          const pdfFill = $("#" + fill);
          if (pdfPct)  pdfPct.textContent   = pctVal;
          if (pdfFill) pdfFill.style.width  = fillPct;
        });

        /* Allow re-draw to settle before printing */
        setTimeout(() => window.print(), 400);
      };

      /* Hide Account Form on Page Load */
      $("#accountFormPanel").classList.remove("active");

      renderAll();
      Promise.all([syncAccountsFromBackend(), syncAttendanceFromBackend()]).then(renderAll).catch(() => {});
      setInterval(() => syncAttendanceFromBackend().then(renderAll).catch(() => {}), 15000);

      /* â”€â”€ PROFILE EDIT MODAL â”€â”€ */
      (function(){

        // â”€â”€ Shared field styles â”€â”€
        const S = {
          fg:  'background:#10243d;border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:10px 12px;color:#fff;font-size:14px;font-family:Rajdhani,sans-serif;width:100%;',
          lbl: 'font-size:13px;font-weight:700;color:#bdd4ec;margin-bottom:4px;display:block;',
          grp: 'display:flex;flex-direction:column;gap:4px;'
        };

        // â”€â”€ Build modal HTML (mirrors Add Account form exactly) â”€â”€
        const modalHTML = `
        <style>
          @keyframes profileModalIn{from{opacity:0;transform:scale(0.94)}to{opacity:1;transform:scale(1)}}
          #profileModal select option { background:#10243d; color:#fff; }
          #profileModal input::placeholder { color:rgba(255,255,255,0.3); }
        </style>

        <div id="profileModal" style="
          display:none;position:fixed;inset:0;z-index:99000;
          background:rgba(0,0,0,0.75);backdrop-filter:blur(6px);
          align-items:center;justify-content:center;">
          <div style="
            background:linear-gradient(180deg,#0b1d33,#091d33);
            border:1px solid rgba(80,140,220,0.25);border-radius:18px;
            padding:32px;width:min(700px,94vw);max-height:92vh;overflow-y:auto;
            box-shadow:0 32px 80px rgba(0,0,0,0.6);animation:profileModalIn 0.25s ease;">

            <!-- Header -->
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;">
              <div>
                <div style="font-size:20px;font-weight:700;color:#fff;">Edit Profile</div>
                <div style="font-size:13px;color:#7ea8d8;margin-top:2px;">Update your Super Admin information</div>
              </div>
              <button id="closeProfileModal" style="
                background:rgba(255,255,255,0.08);border:none;color:#fff;
                width:34px;height:34px;border-radius:8px;cursor:pointer;font-size:18px;
                display:flex;align-items:center;justify-content:center;"><i class="fa-solid fa-xmark"></i></button>
            </div>

            <!-- Profile Photo (same as Add Account photo-row) -->
            <div style="margin-bottom:22px;">
              <label style="${S.lbl}">Profile Photo</label>
              <div style="display:flex;gap:14px;align-items:center;">
                <div id="profilePhotoPreview" style="
                  width:110px;height:110px;border-radius:10px;
                  background:#102844;border:1px solid rgba(255,255,255,0.1);
                  display:flex;align-items:center;justify-content:center;
                  overflow:hidden;color:#7ea8d8;font-weight:700;font-size:28px;flex-shrink:0;">S</div>
                <div>
                  <button type="button" class="btn" onclick="document.getElementById('profilePhotoInput').click();"
                    style="background:linear-gradient(135deg,#1b4c7d,#2867a5);border:none;color:#fff;
                    padding:9px 18px;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;
                    font-family:Rajdhani,sans-serif;">Upload Photo</button>
                  <div style="font-size:11px;color:#7ea8d8;margin-top:8px;">JPG, PNG - max 2MB</div>
                  <input type="file" id="profilePhotoInput" accept="image/*" hidden>
                </div>
              </div>
            </div>

            <!-- Form grid â€” 3 columns matching Add Account layout -->
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;">

              <!-- Row 1: Rank/Role dropdown, Department dropdown -->
              <div style="${S.grp}">
                <label style="${S.lbl}">Rank / Role</label>
                <select id="pf_rank" style="${S.fg}">
                  <option value="">Select Rank or Role</option>
                  <option>Civilian Employee</option>
                  <option>ASN</option>
                  <option>SN2</option>
                  <option>SN1</option>
                  <option>PO3</option>
                  <option>PO2</option>
                  <option>PO1</option>
                  <option>CPO</option>
                  <option>SCPO</option>
                  <option>MCPO</option>
                  <option>ENS</option>
                  <option>LTJG</option>
                  <option>LT</option>
                  <option>LCDR</option>
                  <option>CDR</option>
                  <option>CAPT</option>
                </select>
              </div>
              <div style="${S.grp}">
                <label style="${S.lbl}">Department</label>
                <select id="pf_department" style="${S.fg}">
                  <option value="">Select Department</option>
                  <option value="Personnel Information System (PIS)">Personnel Information System (PIS)</option>
                  <option value="Software Development / Support">Software Development / Support</option>
                  <option value="Hardware Support Unit">Hardware Support Unit</option>
                  <option value="Account Management">Account Management</option>
                  <option value="IT Maintenance Team">IT Maintenance Team</option>
                  <option value="General IT Helpdesk">General IT Helpdesk</option>
                  <option value="Cybersecurity Division">Cybersecurity Division</option>
                </select>
              </div>

              <!-- Row 2: First Name, Middle Initial, Last Name -->
              <div style="${S.grp}">
                <label style="${S.lbl}">First Name</label>
                <input id="pf_first_name" type="text" placeholder="First name" style="${S.fg}">
              </div>
              <div style="${S.grp}">
                <label style="${S.lbl}">Middle Initial</label>
                <input id="pf_middle_name" type="text" placeholder="Middle Initial" style="${S.fg}">
              </div>
              <div style="${S.grp}">
                <label style="${S.lbl}">Last Name</label>
                <input id="pf_last_name" type="text" placeholder="Last name" style="${S.fg}">
              </div>

              <!-- Row 3: Serial/Username, Email, Contact -->
              <div style="${S.grp}">
                <label style="${S.lbl}">Serial / Username</label>
                <input id="pf_serial" type="text" placeholder="Serial or username" style="${S.fg}">
              </div>
              <div style="${S.grp}">
                <label style="${S.lbl}">Email</label>
                <input id="pf_email" type="email" placeholder="Email address" style="${S.fg}">
              </div>
              <div style="${S.grp}">
                <label style="${S.lbl}">Contact</label>
                <input id="pf_contact" type="text" placeholder="Contact number" style="${S.fg}">
              </div>

            </div>

            <!-- Action buttons -->
            <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:28px;padding-top:20px;border-top:1px solid rgba(80,140,220,0.15);">
              <button id="cancelProfileBtn" style="
                padding:10px 22px;border-radius:8px;border:1px solid rgba(255,255,255,0.15);
                background:transparent;color:#bdd4ec;font-size:14px;font-weight:600;
                cursor:pointer;font-family:Rajdhani,sans-serif;">Cancel</button>
              <button id="saveProfileBtn" style="
                padding:10px 28px;border-radius:8px;border:none;
                background:linear-gradient(135deg,#1b4c7d,#2867a5);
                color:#fff;font-size:14px;font-weight:700;cursor:pointer;
                font-family:Rajdhani,sans-serif;">Save Changes</button>
            </div>
          </div>
        </div>

        <!-- âœ… Confirmation modal -->
        <div id="profileConfirmModal" style="
          display:none;position:fixed;inset:0;z-index:99999;
          background:rgba(0,0,0,0.8);backdrop-filter:blur(4px);
          align-items:center;justify-content:center;">
          <div style="
            background:linear-gradient(180deg,#0b1d33,#091d33);
            border:1px solid rgba(80,140,220,0.3);
            border-radius:16px;padding:36px;width:min(420px,90vw);
            text-align:center;box-shadow:0 24px 60px rgba(0,0,0,0.6);">
            <div style="font-size:48px;margin-bottom:14px;"><i class="fa-solid fa-circle-check"></i></div>
            <div style="font-size:18px;font-weight:700;color:#fff;margin-bottom:8px;">Profile Updated!</div>
            <div style="font-size:14px;color:#7ea8d8;margin-bottom:28px;">Your profile information has been saved successfully.</div>
            <button id="closeConfirmBtn" style="
              padding:10px 32px;border-radius:8px;border:none;
              background:linear-gradient(135deg,#1b4c7d,#2867a5);
              color:#fff;font-size:14px;font-weight:700;cursor:pointer;
              font-family:Rajdhani,sans-serif;">OK</button>
          </div>
        </div>`;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        let profilePhoto = '';
        let profilePhotoChanged = false;

        function loadProfile(){
          applyAdminProfile();
        }
        loadProfile();

        $('#adminProfileBtn').onclick = function(){
          $('#profileModal').style.display = 'flex';
          try {
            const m = currentSuperProfileData();

            $('#pf_rank').value       = m.rank       || '';
            $('#pf_department').value = m.department  || '';

            $('#pf_first_name').value  = m.first_name || m.firstName || '';
            $('#pf_middle_name').value = m.middle_name || m.middle_initial || m.middleInitial || '';
            $('#pf_last_name').value   = m.last_name || m.lastName || '';
            $('#pf_serial').value      = m.serial_number || m.serialNumber || m.username || '';
            $('#pf_email').value       = m.email_address || m.emailAddress || m.email || '';
            $('#pf_contact').value     = m.contact_number || m.contactNumber || '';

            profilePhoto = m.photo || '';
            profilePhotoChanged = false;
            const prev = $('#profilePhotoPreview');
            if(profilePhoto){
              prev.innerHTML = `<img src="${profilePhoto}" style="width:100%;height:100%;object-fit:cover;border-radius:10px;">`;
            } else {
              prev.textContent = (m.first_name || m.username || 'S').charAt(0).toUpperCase();
            }
          } catch(e){}
        };

        // â”€â”€ Photo upload â”€â”€
        $('#profilePhotoInput').onchange = async function(){
          const file = this.files[0];
          if(!file) return;
          if(file.size > 5 * 1024 * 1024){ alert('Photo must be under 5MB'); return; }
          try {
            profilePhoto = await photoFileToDataUrl(file);
            profilePhotoChanged = true;
            $('#profilePhotoPreview').innerHTML = `<img src="${profilePhoto}" style="width:100%;height:100%;object-fit:cover;border-radius:10px;">`;
          } catch (error) {
            alert('Could not read the selected photo. Please choose another image.');
          }
        };

        // â”€â”€ Close modal â”€â”€
        function closeModal(){ $('#profileModal').style.display = 'none'; }
        $('#closeProfileModal').onclick = closeModal;
        $('#cancelProfileBtn').onclick  = closeModal;
        $('#profileModal').onclick = function(e){ if(e.target === this) closeModal(); };

        // â”€â”€ Save changes â”€â”€
        $('#saveProfileBtn').onclick = async function(){
          const previous = currentSuperProfileData();
          const data = {
            rank:           $('#pf_rank').value,
            department:     $('#pf_department').value,
            first_name:     $('#pf_first_name').value.trim(),
            middle_name:    $('#pf_middle_name').value.trim(),
            last_name:      $('#pf_last_name').value.trim(),
            serial_number:  $('#pf_serial').value.trim(),
            email_address:  $('#pf_email').value.trim(),
            contact_number: $('#pf_contact').value.trim(),
            photo:          profilePhoto,
            backendId:      previous.backendId
          };

          try {
            const backendProfileData = {
              ...previous,
              ...data,
              type: 'Super Admin',
              accountType: 'Super Admin',
              firstName: data.first_name,
              middleInitial: data.middle_name,
              lastName: data.last_name,
              serialNumber: data.serial_number,
              emailAddress: data.email_address,
              contactNumber: data.contact_number
            };
            backendProfileData.photoChanged = profilePhotoChanged;
            await updateBackendAccount(backendProfileData, 'Super Admin');
          } catch (error) {
            alert('Profile was not saved because the backend update failed: ' + error.message);
            return;
          }

          const user = JSON.parse(sessionStorage.getItem('tramsUser') || '{}');
          localStorage.setItem(superProfileStorageKey(user), JSON.stringify(data));
          applyAdminProfile();

          closeModal();
          $('#profileConfirmModal').style.display = 'flex';
        };

        // â”€â”€ Close confirmation â”€â”€
        $('#closeConfirmBtn').onclick = function(){
          $('#profileConfirmModal').style.display = 'none';
        };

      })();
      /* ===================================================
         BODY-PORTAL TOOLTIP ENGINE
         Appends tooltip directly to <body> using fixed
         positioning via getBoundingClientRect() — fully
         escapes any overflow/scroll clipping ancestor.
      =================================================== */
      (function() {
        const tip = document.createElement('div');
        tip.className = 'body-tooltip-el';
        document.body.appendChild(tip);

        let hideTimer = null;

        function positionTip(el) {
          const r = el.getBoundingClientRect();
          const tipW = tip.offsetWidth || 10;
          // Center below the button
          let left = r.left + r.width / 2 - tipW / 2;
          // Clamp to viewport edges
          left = Math.max(8, Math.min(left, window.innerWidth - tipW - 8));
          const top = r.bottom + 10;
          tip.style.left = left + 'px';
          tip.style.top  = top  + 'px';
        }

        function showTip(el) {
          clearTimeout(hideTimer);
          const text = el.getAttribute('data-body-tooltip');
          if (!text) return;
          tip.textContent = text;
          // Make visible first so offsetWidth is measurable
          tip.style.opacity = '0';
          tip.style.display = 'block';
          positionTip(el);
          tip.classList.add('visible');
          tip.style.opacity = '';
        }

        function hideTip() {
          hideTimer = setTimeout(() => {
            tip.classList.remove('visible');
          }, 80);
        }

        document.querySelectorAll('[data-body-tooltip]').forEach(function(el) {
          el.addEventListener('mouseenter', function() { showTip(el); });
          el.addEventListener('mousemove',  function() { positionTip(el); });
          el.addEventListener('mouseleave', hideTip);
          el.addEventListener('focus',      function() { showTip(el); });
          el.addEventListener('blur',       hideTip);
        });
      })();

// ===== LOADING SCREEN =====

    const loadingScreen = document.getElementById('loadingScreen');
    const loaderCard = document.getElementById('loaderCard');
    const logoutLoadingScreen = document.getElementById('logoutLoadingScreen');

    function hideLoadingScreen(){
      document.body.classList.remove('app-loading');
      loadingScreen.classList.add('is-hidden');
    }

    function showLoadingScreen(){
      document.body.classList.add('app-loading');
      loadingScreen.classList.remove('is-hidden');
    }

    function showLogoutLoadingScreen(){
      document.body.classList.add('app-loading');
      logoutLoadingScreen.classList.remove('is-hidden');
    }

    window.addEventListener('load', () => {
      setTimeout(hideLoadingScreen, 1900);
    });

    loadingScreen.addEventListener('click', hideLoadingScreen);

    loadingScreen.addEventListener('mousemove', event => {
      const bounds = loaderCard.getBoundingClientRect();
      const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 8;
      const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * -8;
      loaderCard.style.transform = `rotateX(${y}deg) rotateY(${x}deg)`;
    });

    loadingScreen.addEventListener('mouseleave', () => {
      loaderCard.style.transform = '';
    });

    function closeThemeDrawer() {
      themeFloatingPanel.style.display = 'none';
    }

    // Sidebar interaction
    const menuItems = document.querySelectorAll('.menu-item');

    const dashboardMenu = document.getElementById('dashboardMenu');
    const employeesMenu = document.getElementById('employeesMenu');
    const reportsMenu = document.getElementById('reportsMenu');

    const dashboardContent = document.getElementById('dashboardContent');
    const employeeContent = document.getElementById('employeeContent');
    const reportsContent = document.getElementById('reportsContent');
    const logoutBtn = document.getElementById('logoutBtn');

    menuItems.forEach(item => {

      item.addEventListener('click', () => {
        
        menuItems.forEach(i => i.classList.remove('active'));

        item.classList.add('active');

        // DO NOTCLOSE THEME PANEL
        closeThemeDrawer();

        // AUTO CLOSE APPEARANCE FIELD
        if(item.id !== 'settingsBtn'){
          settingsPanel.style.display = 'none';
        }

        // SHOW SELECTED CONTENT PAGE
        if(item.id === 'dashboardMenu'){
          dashboardContent.style.display = 'block';
          employeeContent.style.display = 'none';
          if(reportsContent) reportsContent.style.display = 'none';
          renderAttendanceLogs();
        }else if(item.id === 'employeesMenu'){
          dashboardContent.style.display = 'none';
          employeeContent.style.display = 'block';
          if(reportsContent) reportsContent.style.display = 'none';
          renderEmployees();
        }else if(item.id === 'reportsMenu'){
          dashboardContent.style.display = 'none';
          employeeContent.style.display = 'none';
          if(reportsContent) reportsContent.style.display = 'block';
          renderReports();
        }else{
          dashboardContent.style.display = 'none';
          employeeContent.style.display = 'none';
          if(reportsContent) reportsContent.style.display = 'none';
        }

      });

    });

    // ===== SIDEBAR TOGGLE =====

    const toggleSidebarBtn = document.getElementById('toggleSidebarBtn');
    const sidebar = document.querySelector('.sidebar');
    const toggleSidebarText = document.querySelector('.toggle-sidebar-text');

    toggleSidebarBtn.addEventListener('click', () => {

      sidebar.classList.toggle('collapsed');

      // Change button text and tooltip
      if(sidebar.classList.contains('collapsed')){

        toggleSidebarText.textContent = '';
        toggleSidebarBtn.setAttribute('data-tooltip', 'Show the navigation sidebar');

      }else{

        toggleSidebarText.textContent = 'Hide Sidebar';
        toggleSidebarBtn.setAttribute('data-tooltip', 'Toggle the navigation sidebar');

      }

    });

    // ===== SETTINGS PANEL =====

    const settingsBtn = document.getElementById('settingsBtn');
    const settingsPanel = document.getElementById('settingsPanel');

    const themeFloatingPanel = document.getElementById('themeFloatingPanel');

    settingsBtn.addEventListener('click', () => {

      // ALWAYS SHOW APPEARANCE FIELD
      settingsPanel.style.display = 'flex';

      // AUTOMATICALLY SHOW APPEARANCE SETTINGS PAGE
      themeFloatingPanel.style.display = 'flex';

    });

    const settingsAccountsField = document.getElementById('settingsAccountsField');
    if(settingsAccountsField){
      settingsAccountsField.addEventListener('click', () => {
        settingsPanel.style.display = 'none';
        closeThemeDrawer();
        menuItems.forEach(item => item.classList.remove('active'));
        employeesMenu.classList.add('active');
        dashboardContent.style.display = 'none';
        employeeContent.style.display = 'block';
        if(reportsContent) reportsContent.style.display = 'none';
        renderEmployees();
      });
    }

    // ===== APPEARANCE FIELD CLICK =====
    const appearanceField = document.getElementById('appearanceField');
    if(appearanceField){
      appearanceField.addEventListener('click', () => {
        settingsPanel.style.display = 'flex';
        themeFloatingPanel.style.display = 'flex';
      });
    }

    // ===== INTERACTIVE THEME CARDS =====

    const lightThemeCard =
      document.getElementById('lightThemeCard');

    const darkThemeCard =
      document.getElementById('darkThemeCard');

    // LIGHT MODE
    lightThemeCard.addEventListener('click', () => {

      document.body.classList.add('light-mode');

      localStorage.setItem('theme','light');

      lightThemeCard.classList.add('active');
      darkThemeCard.classList.remove('active');

    });

    // DARK MODE
    darkThemeCard.addEventListener('click', () => {

      document.body.classList.remove('light-mode');

      localStorage.setItem('theme','dark');

      darkThemeCard.classList.add('active');
      lightThemeCard.classList.remove('active');

    });

    const logoutConfirm = document.getElementById('logoutConfirm');
    const cancelLogoutBtn = document.getElementById('cancelLogoutBtn');
    const confirmLogoutBtn = document.getElementById('confirmLogoutBtn');

    logoutBtn.addEventListener('click', () => {
      settingsPanel.style.display = 'none';
      closeThemeDrawer();
      logoutConfirm.classList.add('active');
    });

    cancelLogoutBtn.addEventListener('click', () => {
      logoutConfirm.classList.remove('active');
    });


    confirmLogoutBtn.addEventListener('click', () => {
      logoutConfirm.classList.remove('active');

      showLogoutLoadingScreen();
      sessionStorage.removeItem('tramsSession');
      sessionStorage.removeItem('navhelp_session_v1');
      sessionStorage.removeItem('tramsToken');
      sessionStorage.removeItem('tramsUser');
      localStorage.removeItem('tramsCurrentAdmin');

      setTimeout(() => {
        window.location.href = '/login';
      }, 2500);
    });

    // ===== EMPLOYEE ACCOUNT MANAGEMENT =====

    const employeeForm = document.getElementById('employeeForm');
    const employeeFormTitle = document.getElementById('employeeFormTitle');
    const employeeId = document.getElementById('employeeId');
    const rank = document.getElementById('rank');
    const firstName = document.getElementById('firstName');
    const middleInitial = document.getElementById('middleInitial');
    const lastName = document.getElementById('lastName');
    const serialNumber = document.getElementById('serialNumber');
    const service = document.getElementById('service');
    const department = document.getElementById('department');
    const contactNumber = document.getElementById('contactNumber');
    const emailAddress = document.getElementById('emailAddress');
    const employeePhoto = document.getElementById('employeePhoto');
    const photoPreview = document.getElementById('photoPreview');
    const saveEmployeeBtn = document.getElementById('saveEmployeeBtn');
    const employeeSearch = document.getElementById('employeeSearch');
    const rowsPerPage = document.getElementById('rowsPerPage');
    const pageNumberInput = document.getElementById('pageNumberInput');
    const pageCountText = document.getElementById('pageCountText');
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');
    const employeeTableBody = document.getElementById('employeeTableBody');
    const employeePaginationInfo = document.getElementById('employeePaginationInfo');
    const employeeDetailPanel = document.getElementById('employeeDetailPanel');
    const totalEmployeesStat = document.getElementById('totalEmployeesStat');
    const presentTodayStat = document.getElementById('presentTodayStat');
    const departmentsStat = document.getElementById('departmentsStat');
    const employeeDepartmentFilter = document.getElementById('employeeDepartmentFilter');
    const attendanceDepartmentFilter = document.getElementById('attendanceDepartmentFilter');
    const attendanceDateFilter = document.getElementById('attendanceDateFilter');
    const attendanceRowsPerPage = document.getElementById('attendanceRowsPerPage');
    const attendancePageInput = document.getElementById('attendancePageInput');
    const attendancePageCountText = document.getElementById('attendancePageCountText');
    const attendancePrevPageBtn = document.getElementById('attendancePrevPageBtn');
    const attendanceNextPageBtn = document.getElementById('attendanceNextPageBtn');
    const reportTrendFilter = document.getElementById('reportTrendFilter');
    const addUserPanel = document.getElementById('addUserPanel');
    const showAddUserBtn = document.getElementById('showAddUserBtn');

    const userAccountsTablePanel =
      document.getElementById('userAccountsTablePanel');

    const cancelAddUserBtn =
      document.getElementById('cancelAddUserBtn');

    const cancelAddUserConfirm =
      document.getElementById('cancelAddUserConfirm');

    const keepEditingBtn =
      document.getElementById('keepEditingBtn');

    const confirmCancelAddUserBtn =
      document.getElementById('confirmCancelAddUserBtn');

    let employees = JSON.parse(localStorage.getItem('tramsEmployees') || localStorage.getItem('navytime_employees') || '[]');
    let currentPage = 1;
    let attendanceCurrentPage = 1;
    let chartFrame = 0;
    let sortField = "";
    let sortDirection = "asc";
    let selectedPhoto = '';


    function saveEmployees(){
      employees = uniqueAccounts(employees);
      localStorage.setItem('tramsEmployees', JSON.stringify(employees));
      localStorage.setItem('navytime_employees', JSON.stringify(employees.map(employee => ({...employee, name:getFullName(employee)}))));
    }

    function accountIdentity(account){
      const type = normalizePortalRole(account.type || account.accountType || account.role || account.account_type) || 'User';
      const keys = [
        account.username ? 'username:' + account.username : '',
        account.serialNumber ? 'serial:' + account.serialNumber : '',
        account.serial_number ? 'serial:' + account.serial_number : '',
        account.emailAddress ? 'email:' + account.emailAddress : '',
        account.email ? 'email:' + account.email : '',
        account.email_address ? 'email:' + account.email_address : '',
        account.backendId ? 'backend:' + account.backendId : ''
      ].map(value => String(value || '').toLowerCase()).filter(Boolean);
      return type + '|' + (keys[0] || 'id:' + String(account.id || '').toLowerCase());
    }

    function preferAccount(next, current){
      if(!current) return next;
      if(next.backendId && !current.backendId) return {...current, ...next};
      if(!next.backendId && current.backendId) return {...next, ...current};
      if(next.backendId && current.backendId) return current;
      return {...current, ...next};
    }

    function uniqueAccounts(list){
      const byKey = new Map();
      list.forEach(item => {
        const key = accountIdentity(item);
        byKey.set(key, preferAccount(item, byKey.get(key)));
      });
      return [...byKey.values()];
    }

    function getFullName(employee){
      return [
        employee.firstName,
        employee.middleName,
        employee.lastName,
      ].filter(Boolean).join(' ') || employee.name || '';
    }

    function escapeHtml(value){
      return String(value || '').replace(/[&<>"']/g, character => ({
        '&':'&amp;',
        '<':'&lt;',
        '>':'&gt;',
        '"':'&quot;',
        "'":'&#39;'
      }[character]));
    }

    function getDepartmentNames(){
      const formDepartmentSelect = document.getElementById('department');
      if(formDepartmentSelect){
        return [...formDepartmentSelect.options]
          .map(option => option.value)
          .filter(Boolean);
      }
      return [...new Set(employees.map(employee => employee.department).filter(Boolean))].sort();
    }

    function populateDepartmentSelect(select){
      if(!select) return;
      const current = select.value;
      const departments = getDepartmentNames();
      select.innerHTML = '<option value="">Select Department</option>' +
        departments.map(name => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`).join('');
      select.value = departments.includes(current) ? current : '';
    }

    function isSameLocalDate(date, value){
      if(!value) return true;
      const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 10);
      return local === value;
    }

    function getEmployeePayload(employee){
      return 'TRAMS:' + (employee.backendId || employee.id);
    }

    function getQrImageUrl(employee){
      return `https://api.qrserver.com/v1/create-qr-code/?size=360x360&ecc=M&margin=16&data=${encodeURIComponent(getEmployeePayload(employee))}`;
    }

    function updatePhotoPreview(src){
      if(src){
        photoPreview.innerHTML = `<img src="${src}" alt="Employee photo">`;
      }else{
        photoPreview.textContent = 'Photo';
      }
    }

    function resetEmployeeForm(){
      employeeForm.reset();
      employeeId.value = '';
      selectedPhoto = '';
      employeeFormTitle.textContent = 'Add New User';
      saveEmployeeBtn.textContent = 'Create User';
      updatePhotoPreview('');
    }

    function getFilteredEmployees(){
      employees = uniqueAccounts(employees);
      const term = employeeSearch.value.trim().toLowerCase();
      const departmentValue = employeeDepartmentFilter ? employeeDepartmentFilter.value : "";

      return employees.filter(employee => {
        const name = getFullName(employee).toLowerCase();
        return (!term || name.includes(term)) &&
          (!departmentValue || employee.department === departmentValue);
      });
    }

    function getQrMailLink(employee){
      const subject = encodeURIComponent('TRAMS Employee QR Code');
      const qrLink = getQrImageUrl(employee);
      const body = encodeURIComponent(
        `Good day ${getFullName(employee)},\n\n` +
        `Your TRAMS employee account has been created.\n\n` +
        `Account Type: User\n` +
        `Rank: ${employee.rank}\n` +
        `Serial Number: ${employee.serialNumber}\n` +
        `Service: ${employee.service}\n\n` +
        `QR Code Link:\n${qrLink}\n\n` +
        `QR Payload:\n${getEmployeePayload(employee)}\n\n` +
        `Please present your generated QR code for attendance monitoring.`
      );

      return `mailto:${employee.emailAddress}?subject=${subject}&body=${body}`;
    }

    function temporaryPassword(){
      return Math.random().toString(36).slice(2, 6).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
    }

    function dataUrlByteLength(dataUrl){
      const base64 = String(dataUrl || '').split(',')[1] || '';
      return Math.ceil(base64.length * 3 / 4);
    }

    function photoFileToDataUrl(file){
      return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
          const maxSide = 360;
          const maxPhotoBytes = 700 * 1024;
          const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
          canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          URL.revokeObjectURL(url);

          let quality = 0.72;
          let dataUrl = canvas.toDataURL('image/jpeg', quality);
          while(dataUrlByteLength(dataUrl) > maxPhotoBytes && quality > 0.42){
            quality -= 0.08;
            dataUrl = canvas.toDataURL('image/jpeg', quality);
          }

          if(dataUrlByteLength(dataUrl) > maxPhotoBytes){
            reject(new Error('Photo is too large after compression. Please choose a smaller image.'));
            return;
          }
          resolve(dataUrl);
        };

        img.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error('Could not read the selected photo.'));
        };

        img.src = url;
      });
    }

    function authHeaders(){
      const token = sessionStorage.getItem('tramsToken') || '';
      return token ? { Authorization:'Bearer ' + token } : {};
    }

    function jsonHeaders(){
      return { 'Content-Type':'application/json', ...authHeaders() };
    }

    function backendPayloadFromEmployee(employee){
      const type = normalizePortalRole(employee.type || employee.accountType || employee.role) || 'User';
      return {
        client_id:employee.id,
        account_type:type,
        rank:employee.rank || '',
        first_name:employee.firstName || employee.first_name || '',
        middle_initial:employee.middleName || employee.middle_initial || '',
        last_name:employee.lastName || employee.last_name || '',
        serial_number:employee.serialNumber || employee.serial_number || employee.username || '',
        username:employee.username || employee.serialNumber || employee.serial_number || '',
        email_address:employee.emailAddress || employee.email_address || employee.email || '',
        contact_number:employee.contactNumber || employee.contact_number || '',
        service:employee.service || 'PN',
        department:employee.department || '',
        photo:employee.photo || ''
      };
    }

    async function createBackendUserAccount(employee){
      const response = await fetch('http://localhost:3000/api/accounts', {
        method:'POST',
        headers:jsonHeaders(),
        body:JSON.stringify({
          ...backendPayloadFromEmployee(employee),
          account_type:'User'
        })
      });
      let data = {};
      try{ data = await response.json(); }catch(e){}
      if(!response.ok && response.status !== 201){
        throw new Error(data.message || data.sqlMessage || 'Backend account creation failed');
      }
      return data;
    }

    async function updateBackendAccount(employee){
      if(!employee.backendId) return null;
      const response = await fetch('http://localhost:3000/api/accounts/' + encodeURIComponent(employee.backendId), {
        method:'PUT',
        headers:jsonHeaders(),
        body:JSON.stringify(backendPayloadFromEmployee(employee))
      });
      let data = {};
      try{ data = await response.json(); }catch(e){}
      if(!response.ok){
        throw new Error(data.message || data.sqlMessage || 'Backend account update failed');
      }
      return data;
    }

    async function deleteBackendAccount(employee){
      if(!employee) return null;
      const targets = await findBackendDeleteTargets(employee);
      if(targets.length === 0){
        throw new Error('Could not find this account on the backend. Please sync records and try again.');
      }
      const results = [];
      for(const target of targets){
        const response = await fetch('http://localhost:3000/api/accounts/' + encodeURIComponent(target.backendId), {
          method:'DELETE',
          headers:authHeaders()
        });
        let data = {};
        try{ data = await response.json(); }catch(e){}
        if(!response.ok){
          throw new Error(data.message || data.sqlMessage || 'Backend account deletion failed');
        }
        results.push(data);
      }
      return results;
    }

    async function findBackendDeleteTargets(employee){
      const response = await fetch('http://localhost:3000/api/accounts', { headers:authHeaders() });
      if(!response.ok) throw new Error('Could not verify backend accounts before deleting');
      const rows = await response.json();
      const targetKey = accountIdentity(employee);
      const matches = rows
        .map(mapBackendUser)
        .filter(account => account.backendId && accountIdentity(account) === targetKey);
      if(matches.length > 0) return matches;
      return employee.backendId ? [employee] : [];
    }

    function removeDeletedAccountLocally(employee){
      const deletedKey = accountIdentity(employee);
      employees = employees.filter(item => item.id !== employee.id && accountIdentity(item) !== deletedKey);
      const admins = JSON.parse(localStorage.getItem('tramsAdmins') || '[]')
        .filter(item => item.id !== employee.id && accountIdentity(item) !== deletedKey);
      localStorage.setItem('tramsAdmins', JSON.stringify(admins));
      saveEmployees();
    }

    function accountIdFromQrPayload(row){
      try{
        const payload = JSON.parse(row.qr_payload || '{}');
        return payload.employeeId || payload.id || `EMP-${row.id}`;
      }catch(e){
        return `EMP-${row.id}`;
      }
    }

    function findLocalEmployeeForBackend(row){
      const keys = [row.username, row.serial_number, row.email_address]
        .map(value => String(value || '').toLowerCase())
        .filter(Boolean);
      return employees.find(employee => {
        const values = [
          employee.username,
          employee.serialNumber,
          employee.serial_number,
          employee.email,
          employee.emailAddress,
          employee.email_address
        ].map(value => String(value || '').toLowerCase());
        return keys.some(key => values.includes(key));
      }) || {};
    }

    function mapBackendUser(row){
      const local = findLocalEmployeeForBackend(row);
      const type = normalizePortalRole(row.account_type) || 'User';
      return {
        id:accountIdFromQrPayload(row),
        backendId:row.id,
        type,
        accountType:type,
        rank:row.rank || (type === 'Admin' ? 'Administrator' : ''),
        role:type,
        firstName:row.first_name || '',
        middleName:row.middle_initial || '',
        lastName:row.last_name || '',
        serialNumber:row.serial_number || row.username || '',
        username:row.username || row.serial_number || '',
        service:row.service || 'PN',
        department:row.department || '',
        contactNumber:row.contact_number || '',
        emailAddress:row.email_address || '',
        email:row.email_address || '',
        photo:row.photo || local.photo || '',
        active:row.active !== 0
      };
    }

    async function syncUsersFromBackend(){
      const response = await fetch('http://localhost:3000/api/accounts', { headers:authHeaders() });
      if(!response.ok) throw new Error('Backend account sync failed');
      const rows = await response.json();
      const mapped = uniqueAccounts(rows.map(mapBackendUser));
      employees = uniqueAccounts(mapped.filter(item => item.type === 'User' || item.type === 'Admin'));
      localStorage.setItem('tramsAdmins', JSON.stringify(uniqueAccounts(mapped.filter(item => item.type === 'Admin' || item.type === 'Super Admin'))));
      saveEmployees();
      return employees;
    }

    function fillEmployeeForm(employee){
      employeeId.value = employee.id;
      rank.value = employee.rank;
      firstName.value = employee.firstName;
      middleName.value = employee.middleName;
      lastName.value = employee.lastName;
      serialNumber.value = employee.serialNumber;
      service.value = employee.service;
      if(department) department.value = employee.department || '';
      contactNumber.value = employee.contactNumber;
      emailAddress.value = employee.emailAddress;
      selectedPhoto = employee.photo || '';
      updatePhotoPreview(selectedPhoto);
      employeeFormTitle.textContent = 'Edit User Information';
      saveEmployeeBtn.textContent = 'Update User';
    }

    function showEmployeeDetail(employee){
      const fullName = getFullName(employee);
      const safeName = escapeHtml(fullName);
      const statusLabel = employee.active ? 'Active' : 'Inactive';
      const statusClass = employee.active ? 'active' : 'inactive';
      const photo = employee.photo
        ? `<img src="${employee.photo}" alt="${safeName}">`
        : escapeHtml((employee.firstName || '?').charAt(0).toUpperCase());

      employeeDetailPanel.innerHTML = `
        <div class="employee-detail-header">
          <div class="detail-photo">${photo}</div>
          <div class="detail-rank-card" aria-label="Rank insignia">
            <div class="detail-rank-dot"></div>
            <div class="detail-rank-dot"></div>
            <div class="detail-rank-stripes">
              <span></span>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
          <div class="detail-main">
            <div class="detail-name">
              ${escapeHtml(employee.rank)} ${safeName} ${escapeHtml(employee.serialNumber)} ${escapeHtml(employee.service)}
            </div>
            <div class="detail-grid">
              <div class="detail-label">UNIT:</div>
              <div class="detail-value">${escapeHtml(employee.service || 'Not specified')}</div>
              <div class="detail-label">CONTACT:</div>
              <div class="detail-value">${escapeHtml(employee.contactNumber || 'Not specified')}</div>
              <div class="detail-label">EMAIL:</div>
              <div class="detail-value">${escapeHtml(employee.emailAddress || 'Not specified')}</div>
              <div class="detail-label">STATUS:</div>
              <div class="detail-value"><span class="account-status ${statusClass}">${statusLabel}</span></div>
            </div>
          </div>
        </div>
        <div class="detail-actions">
          <span class="detail-badge">ID Verified</span>
          <span class="detail-badge">QR Verified</span>
          <button class="action-btn edit-btn" type="button" data-detail-action="edit" data-id="${employee.id}">Edit Details</button>
          <button class="action-btn status-btn" type="button" data-detail-action="status" data-id="${employee.id}">${employee.active ? 'Deactivate' : 'Activate'}</button>
          <button class="action-btn delete-btn" type="button" data-detail-action="delete" data-id="${employee.id}">Delete</button>
        </div>
      `;
      employeeDetailPanel.style.display = 'block';
      employeeDetailPanel.scrollIntoView({
        behavior:'smooth',
        block:'nearest'
      });
    }


    let attendanceLogs = [];

    function mapBackendAttendanceLog(row){
      const employeeId = String(row.employee_id || row.employeeId || row.account_id || '');
      return {
        id: row.id,
        employeeId,
        type: row.type || row.log_type,
        timestamp: row.timestamp,
        accountType: row.account_type,
        employee: {
          id: employeeId,
          type: row.account_type,
          accountType: row.account_type,
          rank: row.rank || '',
          firstName: row.first_name || '',
          middleName: row.middle_initial || '',
          lastName: row.last_name || '',
          serialNumber: row.serial_number || row.username || '',
          emailAddress: row.email_address || '',
          department: row.department || '',
          service: row.service || '',
          photo: row.photo || ''
        }
      };
    }

    async function syncAttendanceFromBackend(){
      const response = await fetch('http://localhost:3000/api/attendance', { headers:authHeaders() });
      if(!response.ok) throw new Error('Backend attendance sync failed');
      const rows = await response.json();
      attendanceLogs = rows.map(mapBackendAttendanceLog);
      return attendanceLogs;
    }

    function getTimeLogs(){
      return attendanceLogs;
    }

    function getEmployeeById(id){
      const local = employees.find(employee => String(employee.id) === String(id) || String(employee.backendId) === String(id));
      if(local) return local;
      const log = attendanceLogs.find(item => String(item.employeeId) === String(id));
      return log?.employee || {};
    }

    function renderAttendanceLogs(){
      const body = document.getElementById('attendanceLogBody');
      if(!body) return;
      populateDepartmentSelect(attendanceDepartmentFilter);
      const departmentValue = attendanceDepartmentFilter ? attendanceDepartmentFilter.value : "";
      const dateValue = attendanceDateFilter ? attendanceDateFilter.value : "";
      const logs = getTimeLogs()
        .slice()
        .sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp))
        .filter(log => {
          const employee = getEmployeeById(log.employeeId);
          const date = new Date(log.timestamp);
          return (!departmentValue || employee.department === departmentValue) &&
            isSameLocalDate(date, dateValue);
        });
      const rows = Number(attendanceRowsPerPage ? attendanceRowsPerPage.value : 10);
      const totalPages = Math.max(1, Math.ceil(logs.length / rows));
      if(attendanceCurrentPage > totalPages) attendanceCurrentPage = totalPages;
      const start = (attendanceCurrentPage - 1) * rows;
      const visibleLogs = logs.slice(start, start + rows);
      if(attendancePageInput) attendancePageInput.value = attendanceCurrentPage;
      if(attendancePageCountText) attendancePageCountText.textContent = `of ${totalPages}`;
      if(attendancePrevPageBtn) attendancePrevPageBtn.disabled = attendanceCurrentPage === 1;
      if(attendanceNextPageBtn) attendanceNextPageBtn.disabled = attendanceCurrentPage === totalPages;
      if(visibleLogs.length === 0){
        body.innerHTML = '<tr><td colspan="5" class="employee-empty">No attendance scans yet.</td></tr>';
        return;
      }
      body.innerHTML = visibleLogs.map(log => {
        const employee = getEmployeeById(log.employeeId);
        const date = new Date(log.timestamp);
        const statusLabel = log.type === 'IN' ? 'IN' : 'OUT';
        const statusClass = log.type === 'IN' ? 'status-in' : 'status-out';
        return `<tr><td>${escapeHtml(employee.rank || '')}</td><td>${escapeHtml(employee.name || getFullName(employee) || log.employeeId)}</td><td>${log.type === 'IN' ? date.toLocaleTimeString() : '-'}</td><td>${log.type === 'OUT' ? date.toLocaleTimeString() : '-'}</td><td><span class="attendance-status ${statusClass}">${statusLabel}</span></td></tr>`;
      }).join('');
    }

    function drawAdminChart(canvasId, labels, values, kind, colors = ['#54d6ff','#f2b72a','#3c8dff','#29a35a']){
      const canvas = document.getElementById(canvasId);
      if(!canvas) return;
      const ctx = canvas.getContext('2d');
      const rect = canvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, rect.width * ratio);
      canvas.height = Math.max(1, rect.height * ratio);
      ctx.setTransform(ratio,0,0,ratio,0,0);
      const w = rect.width;
      const h = rect.height;
      const left = 42;
      const top = 16;
      const bottom = h - 34;
      const width = w - left - 16;
      const height = bottom - top;
      const progress = Math.min(1, chartFrame / 24);
      const max = Math.max(1, ...values);
      ctx.clearRect(0,0,w,h);
      ctx.strokeStyle = 'rgba(157,182,207,.25)';
      ctx.beginPath();
      ctx.moveTo(left, top);
      ctx.lineTo(left, bottom);
      ctx.lineTo(w - 10, bottom);
      ctx.stroke();
      ctx.font = '600 12px Rajdhani';
      if(kind === 'line'){
        ctx.strokeStyle = '#54d6ff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        values.forEach((value,index) => {
          const x = left + (labels.length <= 1 ? width / 2 : (index / (labels.length - 1)) * width);
          const y = bottom - (value / max) * height * progress;
          index ? ctx.lineTo(x,y) : ctx.moveTo(x,y);
        });
        ctx.stroke();
        values.forEach((value,index) => {
          const x = left + (labels.length <= 1 ? width / 2 : (index / (labels.length - 1)) * width);
          const y = bottom - (value / max) * height * progress;
          ctx.fillStyle = '#f2b72a';
          ctx.beginPath();
          ctx.arc(x,y,4,0,Math.PI * 2);
          ctx.fill();
        });
        return;
      }
      const gap = 8;
      const barW = Math.max(12, (width - gap * (labels.length - 1)) / Math.max(1, labels.length));
      values.forEach((value,index) => {
        const barH = (value / max) * height * progress;
        const x = left + index * (barW + gap);
        const y = bottom - barH;
        ctx.fillStyle = colors[index % colors.length];
        ctx.fillRect(x,y,barW,barH);
        ctx.fillStyle = '#9db6cf';
        ctx.save();
        ctx.translate(x + barW / 2, bottom + 14);
        ctx.rotate(-0.45);
        ctx.fillText(labels[index], -14, 0);
        ctx.restore();
      });
    }

    function getLogBuckets(logs){
      const buckets = {};
      logs.forEach(log => {
        const hour = new Date(log.timestamp).getHours();
        const label = `${hour % 12 || 12}${hour < 12 ? 'AM' : 'PM'}`;
        buckets[label] = (buckets[label] || 0) + 1;
      });
      return Object.entries(buckets).map(([label,value]) => ({label,value}));
    }

    function getTrendBuckets(logs, mode){
      const buckets = {};
      logs.forEach(log => {
        const date = new Date(log.timestamp);
        let key = date.toLocaleDateString();
        if(mode === 'weekly') key = `Week ${Math.ceil(date.getDate() / 7)} ${date.toLocaleString(undefined,{month:'short'})}`;
        if(mode === 'monthly') key = date.toLocaleString(undefined,{month:'short',year:'numeric'});
        buckets[key] = (buckets[key] || 0) + 1;
      });
      return Object.entries(buckets).slice(-12).map(([label,value]) => ({label,value}));
    }

    function renderReports(){
      const logs = getTimeLogs().slice().sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
      const total = document.getElementById('reportTotalLogs');
      const ins = document.getElementById('reportTimeIn');
      const outs = document.getElementById('reportTimeOut');
      if(total) total.textContent = logs.length;
      if(ins) ins.textContent = logs.filter(log => log.type === 'IN').length;
      if(outs) outs.textContent = logs.filter(log => log.type === 'OUT').length;
      const histogram = getLogBuckets(logs);
      const trend = getTrendBuckets(logs, reportTrendFilter ? reportTrendFilter.value : 'daily');
      chartFrame = 0;
      function animate(){
        chartFrame++;
        drawAdminChart('adminHistogramChart', histogram.map(item => item.label), histogram.map(item => item.value), 'bar');
        drawAdminChart('adminLineChart', trend.map(item => item.label), trend.map(item => item.value), 'line');
        if(chartFrame < 24) requestAnimationFrame(animate);
      }
      animate();
      const peak = histogram.slice().sort((a,b) => b.value - a.value)[0];
      const histogramInsight = document.getElementById('adminHistogramInsight');
      const lineInsight = document.getElementById('adminLineInsight');
      if(histogramInsight) histogramInsight.textContent = peak ? `Peak attendance log activity is around ${peak.label}.` : 'No time-in/time-out logs yet.';
      if(lineInsight) lineInsight.textContent = trend.length ? `Showing ${reportTrendFilter ? reportTrendFilter.value : 'daily'} attendance behavior.` : 'No trend data yet.';
    }

    const exportAdminReportPdf = document.getElementById('exportAdminReportPdf');
    if(exportAdminReportPdf){
      exportAdminReportPdf.addEventListener('click', () => {
        renderReports();
        window.print();
      });
    }
    function renderEmployees(){
      populateDepartmentSelect(employeeDepartmentFilter);
      populateDepartmentSelect(attendanceDepartmentFilter);
      const filtered = getFilteredEmployees();
      if(sortField){
        filtered.sort((a,b)=>{
          let valueA =
            a[sortField] ?? "";
          let valueB =
            b[sortField] ?? "";
          valueA =
            String(valueA).toLowerCase();
          valueB =
            String(valueB).toLowerCase();
          if(sortDirection === "asc"){
            return valueA.localeCompare(valueB);
          }
          return valueB.localeCompare(valueA);
        });
      }
      const rows =
        Number(rowsPerPage.value);

      const totalPages =
        Math.max(1,
          Math.ceil(filtered.length / rows)
        );

      if(currentPage > totalPages){
        currentPage = totalPages;
      }

      const start =
        (currentPage - 1) * rows;

      const visibleEmployees =
        filtered.slice(
          start,
          start + rows
        );

      const today = new Date();
      const presentIds = new Set(getTimeLogs().filter(log =>
        log.type === 'IN' && isSameLocalDate(new Date(log.timestamp), new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0,10))
      ).map(log => log.employeeId));
      totalEmployeesStat.textContent = employees.length;
      if(presentTodayStat) presentTodayStat.textContent = presentIds.size;
      if(departmentsStat) departmentsStat.textContent = getDepartmentNames().length;

      if(visibleEmployees.length === 0){
        employeeTableBody.innerHTML = '<tr><td class="employee-empty" colspan="6">No employee accounts found.</td></tr>';
        if(employeePaginationInfo){
          employeePaginationInfo.textContent = 'Showing 0 entries';
        }
        employeeDetailPanel.style.display = 'none';
        return;
      }

      employeeTableBody.innerHTML = visibleEmployees.map(employee => {
        const fullName = getFullName(employee);
        const safeName = escapeHtml(fullName);
        const statusLabel = employee.active ? 'Active' : 'Inactive';
        const statusClass = employee.active ? 'active' : 'inactive';
        const statusAction = employee.active ? 'Deactivate' : 'Activate';

        return `
          <tr data-employee-id="${employee.id}" tabindex="0" aria-label="View details for ${safeName}">
            <td>${escapeHtml(employee.rank)}</td>
            <td>${safeName}</td>
            <td>${escapeHtml(employee.serialNumber)}</td>
            <td>${escapeHtml(employee.emailAddress)}</td>
            <td class="qr-cell"><img src="${getQrImageUrl(employee)}" alt="QR code for ${safeName}"></td>
            <td>${escapeHtml(employee.department || '')}</td>
          </tr>
        `;
      }).join('');

      pageCountText.textContent =
        `of ${totalPages}`;

      pageNumberInput.value =
        currentPage;
    }

    employeePhoto.addEventListener('change', async () => {
      const file = employeePhoto.files[0];
      if(!file){
        selectedPhoto = '';
        updatePhotoPreview('');
        return;
      }

      try{
        selectedPhoto = await photoFileToDataUrl(file);
        updatePhotoPreview(selectedPhoto);
      }catch(error){
        selectedPhoto = '';
        employeePhoto.value = '';
        updatePhotoPreview('');
        alert(error.message || 'Could not read the selected photo. Please choose another image.');
      }
    });

    employeeForm.addEventListener('submit', async event => {
      event.preventDefault();
      if(saveEmployeeBtn.disabled) return;

      const formData = {
        id: employeeId.value || `EMP-${Date.now()}`,
        type: (employees.find(item => item.id === employeeId.value)?.type || 'User'),
        accountType: (employees.find(item => item.id === employeeId.value)?.accountType || employees.find(item => item.id === employeeId.value)?.type || 'User'),
        rank: rank.value,
        firstName: firstName.value.trim(),
        middleName: middleName.value.trim(),
        lastName: lastName.value.trim(),
        serialNumber: serialNumber.value.trim(),
        service: service.value,
        department: department ? department.value : '',
        contactNumber: contactNumber.value.trim(),
        emailAddress: emailAddress.value.trim(),
        photo: selectedPhoto,
        active: true
      };

      const isEditing = Boolean(employeeId.value);
      if(isEditing && !confirm('Confirm changes to this user account?')) return;
      saveEmployeeBtn.disabled = true;

      if(isEditing){
        const previous = employees.find(employee => employee.id === employeeId.value) || {};
        const updatedAccount = {
          ...previous,
          ...formData,
          backendId: previous.backendId,
          active: previous.active
        };
        try{
          await updateBackendAccount(updatedAccount);
        }catch(error){
          alert('The account was not updated because the backend update failed: ' + error.message);
          saveEmployeeBtn.disabled = false;
          return;
        }
        employees = employees.map(employee => employee.id === employeeId.value ? updatedAccount : employee);
        saveEmployees();
        renderEmployees();
      }else{
        try{
          const result = await createBackendUserAccount(formData);
          formData.backendId = result.id;
          const formKey = accountIdentity(formData);
          employees = employees.filter(employee => employee.id !== formData.id && accountIdentity(employee) !== formKey);
          employees.unshift(formData);
          saveEmployees();
          renderEmployees();
          if(result.email_status === 'failed'){
            alert('User account was created and saved, but the email was not sent. Check the backend email settings.');
            window.location.href = getQrMailLink(formData);
          }else{
            alert('User account created successfully.');
          }
        }catch(error){
          alert('The user account was not created because the backend account failed: ' + error.message);
          renderEmployees();
          saveEmployeeBtn.disabled = false;
          return;
        }
      }
      resetEmployeeForm();
      saveEmployeeBtn.disabled = false;

      // HIDE ADD USER PAGE
      addUserPanel.style.display = 'none';

      // SHOW USER ACCOUNTS PAGE
      userAccountsTablePanel.style.display = 'block';
    });

    employeeTableBody.addEventListener('click', async event => {
      const target = event.target.closest('[data-action]');
      const row = event.target.closest('[data-employee-id]');

      if(!target && row){
        const employee = employees.find(item => item.id === row.dataset.employeeId);
        if(employee) showEmployeeDetail(employee);
        return;
      }

      if(!target) return;

      const employee = employees.find(item => item.id === target.dataset.id);
      if(!employee) return;

      if(target.dataset.action === 'edit'){
        fillEmployeeForm(employee);
        employeeDetailPanel.style.display = 'none';
        addUserPanel.style.display = 'block';
        employeeContent.scrollTo({
          top:0,
          behavior:'smooth'
        });
      }

      if(target.dataset.action === 'status'){
        employee.active = !employee.active;
        saveEmployees();
        renderEmployees();
        showEmployeeDetail(employee);
      }

      if(target.dataset.action === 'delete'){
        if(confirm(`Delete ${getFullName(employee)} from employee accounts?`)){
          target.disabled = true;
          try{
            await deleteBackendAccount(employee);
            removeDeletedAccountLocally(employee);
            await syncUsersFromBackend();
            renderEmployees();
          }catch(error){
            console.error('Delete account failed:', error);
            alert(error.message || 'Could not delete this account from the server.');
            target.disabled = false;
          }
        }
      }
    });

    employeeTableBody.addEventListener('keydown', event => {
      if(event.key !== 'Enter' && event.key !== ' ') return;
      const row = event.target.closest('[data-employee-id]');
      if(!row) return;
      event.preventDefault();
      const employee = employees.find(item => item.id === row.dataset.employeeId);
      if(employee) showEmployeeDetail(employee);
    });

    employeeDetailPanel.addEventListener('click', async event => {
      const target = event.target.closest('[data-detail-action]');
      if(!target) return;

      const employee = employees.find(item => item.id === target.dataset.id);
      if(!employee) return;

      if(target.dataset.detailAction === 'edit'){
        fillEmployeeForm(employee);
        employeeDetailPanel.style.display = 'none';
        addUserPanel.style.display = 'block';
        userAccountsTablePanel.style.display = 'none';
        employeeContent.scrollTo({
          top:0,
          behavior:'smooth'
        });
      }

      if(target.dataset.detailAction === 'status'){
        employee.active = !employee.active;
        saveEmployees();
        renderEmployees();
        showEmployeeDetail(employee);
      }

      if(target.dataset.detailAction === 'delete'){
        if(confirm(`Delete ${getFullName(employee)} from employee accounts?`)){
          target.disabled = true;
          try{
            await deleteBackendAccount(employee);
            removeDeletedAccountLocally(employee);
            await syncUsersFromBackend();
            employeeDetailPanel.style.display = 'none';
            renderEmployees();
          }catch(error){
            console.error('Delete account failed:', error);
            alert(error.message || 'Could not delete this account from the server.');
            target.disabled = false;
          }
        }
      }
    });

    employeeSearch.addEventListener('input', renderEmployees);
    if(employeeDepartmentFilter){
      employeeDepartmentFilter.addEventListener('change', () => {
        currentPage = 1;
        renderEmployees();
      });
    }

    cancelAddUserBtn.addEventListener('click', () => {
      cancelAddUserConfirm.classList.add('active');
    });

    // CONTINUE EDITING
    keepEditingBtn.addEventListener('click', () => {
      cancelAddUserConfirm.classList.remove('active');
    });

    cancelAddUserConfirm.addEventListener('click', event => {
      event.stopPropagation();
    });

    // CONFIRM CANCEL
    confirmCancelAddUserBtn.addEventListener('click', () => {
      cancelAddUserConfirm.classList.remove('active');
      resetEmployeeForm();

      // HIDE ADD USER PAGE
      addUserPanel.style.display = 'none';
      employeeDetailPanel.style.display = 'none';

      // SHOW USER ACCOUNTS TABLE AGAIN
      userAccountsTablePanel.style.display = 'block';
      employeeContent.scrollTo({
        top:0,
        behavior:'smooth'
      });
    });

    // SHOW SEPARATE ADD USER PAGE
    showAddUserBtn.addEventListener('click', () => {
      
      userAccountsTablePanel.style.display = 'none';
      employeeDetailPanel.style.display = 'none';
      addUserPanel.style.display = 'block';
      employeeContent.scrollTo({
        top:0,
        behavior:'smooth'
      });

    });

    rowsPerPage.addEventListener(
      "change",
      ()=>{
        currentPage = 1;
        renderEmployees();
      }
    );

    prevPageBtn.addEventListener(
      "click",
      ()=>{

        if(currentPage > 1){

          currentPage--;

          renderEmployees();

        }

      }
    );

    nextPageBtn.addEventListener(
      "click",
      ()=>{

        currentPage++;

        renderEmployees();

      }
    );

    pageNumberInput.addEventListener(
      "change",
      ()=>{

        currentPage =
          Number(pageNumberInput.value);

        if(currentPage < 1){
          currentPage = 1;
        }

        renderEmployees();

      }
    );

    [attendanceDepartmentFilter, attendanceDateFilter].forEach(control => {
      if(control){
        control.addEventListener('change', () => {
          attendanceCurrentPage = 1;
          renderAttendanceLogs();
        });
      }
    });

    if(attendanceRowsPerPage){
      attendanceRowsPerPage.addEventListener('change', () => {
        attendanceCurrentPage = 1;
        renderAttendanceLogs();
      });
    }

    if(attendancePrevPageBtn){
      attendancePrevPageBtn.addEventListener('click', () => {
        if(attendanceCurrentPage > 1){
          attendanceCurrentPage--;
          renderAttendanceLogs();
        }
      });
    }

    if(attendanceNextPageBtn){
      attendanceNextPageBtn.addEventListener('click', () => {
        attendanceCurrentPage++;
        renderAttendanceLogs();
      });
    }

    if(attendancePageInput){
      attendancePageInput.addEventListener('change', () => {
        attendanceCurrentPage = Math.max(1, Number(attendancePageInput.value) || 1);
        renderAttendanceLogs();
      });
    }

    if(reportTrendFilter){
      reportTrendFilter.addEventListener('change', renderReports);
    }

    document
    .querySelectorAll(
    '.employee-table th[data-sort]'
    )
    .forEach(header=>{

      header.addEventListener(
        'click',
        ()=>{

          const field =
            header.dataset.sort;

          if(sortField === field){

            sortDirection =
              sortDirection === 'asc'
              ? 'desc'
              : 'asc';

          }else{

            sortField =
              field;

            sortDirection =
              'asc';

          }

          renderEmployees();

        }
      );

    });

    saveEmployees();
    renderEmployees();
    renderAttendanceLogs();
    Promise.all([syncUsersFromBackend(), syncAttendanceFromBackend()]).then(() => {
      renderEmployees();
      renderAttendanceLogs();
      renderReports();
    }).catch(() => {});
    setInterval(() => syncAttendanceFromBackend().then(() => {
      renderAttendanceLogs();
      renderReports();
      renderEmployees();
    }).catch(() => {}), 15000);
    function normalizePortalRole(value){
      const role = String(value || '').toLowerCase();
      if(role === 'admin' || role === 'administrator') return 'Admin';
      if(role === 'super admin' || role === 'super administrator') return 'Super Admin';
      return role === 'user' ? 'User' : '';
    }

    function adminProfileStorageKey(user){
      const key = user.id || user.username || user.serial_number || user.email_address || 'current';
      return 'tramsProfileAdmin:' + String(key).toLowerCase();
    }

    function isCurrentLoginAccount(item, loginName, user){
      const values = [
        item.id,
        item.username,
        item.serial_number,
        item.serialNumber,
        item.email,
        item.emailAddress,
        item.email_address
      ].map(value => String(value || '').toLowerCase());
      return values.includes(loginName) || (user.id && String(item.id || '') === String(user.id));
    }

    function currentAdminProfileData(){
      const user = JSON.parse(sessionStorage.getItem('tramsUser') || '{}');
      const session = JSON.parse(sessionStorage.getItem('tramsSession') || '{}');
      const loginName = String(session.userName || user.username || '').toLowerCase();
      const localAdmins = JSON.parse(localStorage.getItem('tramsAdmins') || '[]');
      const currentAdmin = JSON.parse(localStorage.getItem('tramsCurrentAdmin') || 'null') || {};
      const localMatch = localAdmins.find(item =>
        normalizePortalRole(item.type || item.accountType || item.role || item.account_type) === 'Admin' &&
        isCurrentLoginAccount(item, loginName, user)
      ) || {};
      const currentMatch = (
        normalizePortalRole(currentAdmin.type || currentAdmin.accountType || currentAdmin.role || currentAdmin.account_type) === 'Admin' &&
        isCurrentLoginAccount(currentAdmin, loginName, user)
      ) ? currentAdmin : {};
      const savedProfile = JSON.parse(localStorage.getItem(adminProfileStorageKey(user)) || '{}');
      const merged = {...localMatch, ...currentMatch, ...user, ...savedProfile, role:'Admin', accountType:'Admin'};
      merged.photo = savedProfile.photo || user.photo || currentMatch.photo || localMatch.photo || '';
      return merged;
    }

    function applyAdminProfile(){
      try{
        const merged = currentAdminProfileData();
        if(normalizePortalRole(merged.account_type || merged.accountType || merged.role) === 'Super Admin') return;
        const displayName = [merged.first_name || merged.firstName, merged.middle_initial || merged.middleName, merged.last_name || merged.lastName].filter(Boolean).join(' ') || getFullName(merged) || merged.name || merged.username || merged.serial_number || merged.serialNumber || 'Admin';
        const avatar = document.getElementById('sidebarAvatar') || document.querySelector('.admin-avatar');
        const nameEl = document.getElementById('sidebarName');
        const roleEl = document.getElementById('sidebarRole');
        const photo = merged.photo || '';
        if(avatar){ avatar.innerHTML = photo ? `<img src="${photo}" alt="Admin photo">` : escapeHtml(displayName.charAt(0).toUpperCase()); }
        if(nameEl) nameEl.textContent = displayName;
        if(roleEl) roleEl.textContent = 'Administrator';
        localStorage.setItem('tramsCurrentAdmin', JSON.stringify(merged));
      }catch(e){}
    }
    applyAdminProfile();

    (function setupAdminProfileEditor(){
      const profileBtn = document.getElementById('adminProfileBtn');
      if(!profileBtn) return;
      const modalHTML = `
        <style>
          @keyframes profileModalIn{from{opacity:0;transform:scale(0.94)}to{opacity:1;transform:scale(1)}}
          #profileModal select option{background:#10243d;color:#fff;}
          #profileModal input::placeholder{color:rgba(255,255,255,0.3);}
        </style>
        <div id="profileModal" style="display:none;position:fixed;inset:0;z-index:99000;background:rgba(0,0,0,0.75);backdrop-filter:blur(6px);align-items:center;justify-content:center;">
          <div style="background:linear-gradient(180deg,#0b1d33,#091d33);border:1px solid rgba(80,140,220,0.25);border-radius:18px;padding:32px;width:min(700px,94vw);max-height:92vh;overflow-y:auto;box-shadow:0 32px 80px rgba(0,0,0,0.6);animation:profileModalIn 0.25s ease;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;">
              <div>
                <div style="font-size:20px;font-weight:700;color:#fff;">Edit Profile</div>
                <div style="font-size:13px;color:#7ea8d8;margin-top:2px;">Update your Administrator information</div>
              </div>
              <button id="closeProfileModal" style="background:rgba(255,255,255,0.08);border:none;color:#fff;width:34px;height:34px;border-radius:8px;cursor:pointer;font-size:18px;display:flex;align-items:center;justify-content:center;">x</button>
            </div>
            <div style="margin-bottom:22px;">
              <label style="font-size:13px;font-weight:700;color:#bdd4ec;margin-bottom:4px;display:block;">Profile Photo</label>
              <div style="display:flex;gap:14px;align-items:center;">
                <div id="profilePhotoPreview" style="width:110px;height:110px;border-radius:10px;background:#102844;border:1px solid rgba(255,255,255,0.1);display:flex;align-items:center;justify-content:center;overflow:hidden;color:#7ea8d8;font-weight:700;font-size:28px;flex-shrink:0;">A</div>
                <div>
                  <button type="button" class="btn" id="uploadProfilePhotoBtn" style="background:linear-gradient(135deg,#1b4c7d,#2867a5);border:none;color:#fff;padding:9px 18px;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;font-family:Rajdhani,sans-serif;">Upload Photo</button>
                  <div style="font-size:11px;color:#7ea8d8;margin-top:8px;">JPG, PNG - max 2MB</div>
                  <input type="file" id="profilePhotoInput" accept="image/*" hidden>
                </div>
              </div>
            </div>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;">
              <div style="display:flex;flex-direction:column;gap:4px;"><label style="font-size:13px;font-weight:700;color:#bdd4ec;">Rank / Role</label><select id="pf_rank" style="background:#10243d;border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:10px 12px;color:#fff;font-size:14px;font-family:Rajdhani,sans-serif;width:100%;"><option value="">Select Rank or Role</option><option>Civilian Employee</option><option>ASN</option><option>SN2</option><option>SN1</option><option>PO3</option><option>PO2</option><option>PO1</option><option>CPO</option><option>SCPO</option><option>MCPO</option><option>ENS</option><option>LTJG</option><option>LT</option><option>LCDR</option><option>CDR</option><option>CAPT</option></select></div>
              <div style="display:flex;flex-direction:column;gap:4px;"><label style="font-size:13px;font-weight:700;color:#bdd4ec;">Department</label><select id="pf_department" style="background:#10243d;border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:10px 12px;color:#fff;font-size:14px;font-family:Rajdhani,sans-serif;width:100%;"><option value="">Select Department</option><option value="Personnel Information System (PIS)">Personnel Information System (PIS)</option><option value="Software Development / Support">Software Development / Support</option><option value="Hardware Support Unit">Hardware Support Unit</option><option value="Account Management">Account Management</option><option value="IT Maintenance Team">IT Maintenance Team</option><option value="General IT Helpdesk">General IT Helpdesk</option><option value="Cybersecurity Division">Cybersecurity Division</option></select></div>
              <div style="display:flex;flex-direction:column;gap:4px;"><label style="font-size:13px;font-weight:700;color:#bdd4ec;">First Name</label><input id="pf_first_name" style="background:#10243d;border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:10px 12px;color:#fff;font-size:14px;font-family:Rajdhani,sans-serif;width:100%;"></div>
              <div style="display:flex;flex-direction:column;gap:4px;"><label style="font-size:13px;font-weight:700;color:#bdd4ec;">Middle Initial</label><input id="pf_middle_initial" style="background:#10243d;border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:10px 12px;color:#fff;font-size:14px;font-family:Rajdhani,sans-serif;width:100%;"></div>
              <div style="display:flex;flex-direction:column;gap:4px;"><label style="font-size:13px;font-weight:700;color:#bdd4ec;">Last Name</label><input id="pf_last_name" style="background:#10243d;border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:10px 12px;color:#fff;font-size:14px;font-family:Rajdhani,sans-serif;width:100%;"></div>
              <div style="display:flex;flex-direction:column;gap:4px;"><label style="font-size:13px;font-weight:700;color:#bdd4ec;">Serial / Username</label><input id="pf_serial" style="background:#10243d;border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:10px 12px;color:#fff;font-size:14px;font-family:Rajdhani,sans-serif;width:100%;"></div>
              <div style="display:flex;flex-direction:column;gap:4px;"><label style="font-size:13px;font-weight:700;color:#bdd4ec;">Email</label><input id="pf_email" type="email" style="background:#10243d;border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:10px 12px;color:#fff;font-size:14px;font-family:Rajdhani,sans-serif;width:100%;"></div>
              <div style="display:flex;flex-direction:column;gap:4px;"><label style="font-size:13px;font-weight:700;color:#bdd4ec;">Contact</label><input id="pf_contact" style="background:#10243d;border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:10px 12px;color:#fff;font-size:14px;font-family:Rajdhani,sans-serif;width:100%;"></div>
            </div>
            <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:28px;padding-top:20px;border-top:1px solid rgba(80,140,220,0.15);">
              <button id="cancelProfileBtn" style="padding:10px 22px;border-radius:8px;border:1px solid rgba(255,255,255,0.15);background:transparent;color:#bdd4ec;font-size:14px;font-weight:600;cursor:pointer;font-family:Rajdhani,sans-serif;">Cancel</button>
              <button id="saveProfileBtn" style="padding:10px 28px;border-radius:8px;border:none;background:linear-gradient(135deg,#1b4c7d,#2867a5);color:#fff;font-size:14px;font-weight:700;cursor:pointer;font-family:Rajdhani,sans-serif;">Save Changes</button>
            </div>
          </div>
        </div>
        <div id="profileConfirmModal" style="display:none;position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.8);backdrop-filter:blur(4px);align-items:center;justify-content:center;">
          <div style="background:linear-gradient(180deg,#0b1d33,#091d33);border:1px solid rgba(80,140,220,0.3);border-radius:16px;padding:36px;width:min(420px,90vw);text-align:center;box-shadow:0 24px 60px rgba(0,0,0,0.6);">
            <div style="font-size:18px;font-weight:700;color:#fff;margin-bottom:8px;">Profile Updated</div>
            <div style="font-size:14px;color:#7ea8d8;margin-bottom:28px;">Your profile information has been saved successfully.</div>
            <button id="closeConfirmBtn" style="padding:10px 32px;border-radius:8px;border:none;background:linear-gradient(135deg,#1b4c7d,#2867a5);color:#fff;font-size:14px;font-weight:700;cursor:pointer;font-family:Rajdhani,sans-serif;">OK</button>
          </div>
        </div>`;
      document.body.insertAdjacentHTML('beforeend', modalHTML);

      let profilePhoto = '';
      const modal = document.getElementById('profileModal');

      function compressProfilePhoto(file){
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onerror = reject;
          reader.onload = event => {
            const img = new Image();
            img.onerror = reject;
            img.onload = () => {
              const maxSide = 720;
              const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
              const canvas = document.createElement('canvas');
              canvas.width = Math.max(1, Math.round(img.width * scale));
              canvas.height = Math.max(1, Math.round(img.height * scale));
              canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
              resolve(canvas.toDataURL('image/jpeg', 0.82));
            };
            img.src = event.target.result;
          };
          reader.readAsDataURL(file);
        });
      }
      const preview = document.getElementById('profilePhotoPreview');
      function currentProfileData(){
        return currentAdminProfileData();
      }
      profileBtn.addEventListener('click', () => {
        const data = currentProfileData();
        modal.style.display = 'flex';
        document.getElementById('pf_rank').value = data.rank || '';
        document.getElementById('pf_department').value = data.department || '';
        document.getElementById('pf_first_name').value = data.first_name || data.firstName || '';
        document.getElementById('pf_middle_name').value = data.middle_name || data.middleName || '';
        document.getElementById('pf_last_name').value = data.last_name || data.lastName || '';
        document.getElementById('pf_serial').value = data.serial_number || data.serialNumber || data.username || '';
        document.getElementById('pf_email').value = data.email_address || data.emailAddress || '';
        document.getElementById('pf_contact').value = data.contact_number || data.contactNumber || '';
        profilePhoto = data.photo || '';
        preview.innerHTML = profilePhoto ? `<img src="${profilePhoto}" style="width:100%;height:100%;object-fit:cover;border-radius:10px;">` : ((data.first_name || data.firstName || data.username || 'A').charAt(0).toUpperCase());
      });
      document.getElementById('uploadProfilePhotoBtn').onclick = () => document.getElementById('profilePhotoInput').click();
      document.getElementById('profilePhotoInput').onchange = async function(){
        const file = this.files[0];
        if(!file) return;
        if(file.size > 4 * 1024 * 1024){ alert('Photo must be under 4MB'); return; }
        try{
          profilePhoto = await compressProfilePhoto(file);
          preview.innerHTML = `<img src="${profilePhoto}" style="width:100%;height:100%;object-fit:cover;border-radius:10px;">`;
        }catch(error){
          alert('Could not read the selected photo. Please choose another image.');
        }
      };
      function closeProfileModal(){ modal.style.display = 'none'; }
      document.getElementById('closeProfileModal').onclick = closeProfileModal;
      document.getElementById('cancelProfileBtn').onclick = closeProfileModal;
      modal.onclick = event => { if(event.target === modal) closeProfileModal(); };
      document.getElementById('saveProfileBtn').onclick = async () => {
        const saveBtn = document.getElementById('saveProfileBtn');
        const previous = currentProfileData();
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';
        const data = {
          rank:document.getElementById('pf_rank').value,
          department:document.getElementById('pf_department').value,
          first_name:document.getElementById('pf_first_name').value.trim(),
          middle_name:document.getElementById('pf_middle_name').value.trim(),
          last_name:document.getElementById('pf_last_name').value.trim(),
          serial_number:document.getElementById('pf_serial').value.trim(),
          email_address:document.getElementById('pf_email').value.trim(),
          contact_number:document.getElementById('pf_contact').value.trim(),
          photo:profilePhoto,
          backendId:previous.backendId
        };
        const user = JSON.parse(sessionStorage.getItem('tramsUser') || '{}');
        data.backendId = data.backendId || previous.backendId || user.id;
        try{
          await updateBackendAccount({
            ...previous,
            ...data,
            type:'Admin',
            accountType:'Admin',
            firstName:data.first_name,
            middleName:data.middle_name,
            lastName:data.last_name,
            serialNumber:data.serial_number,
            emailAddress:data.email_address,
            contactNumber:data.contact_number
          });
        }catch(error){
          saveBtn.disabled = false;
          saveBtn.textContent = 'Save Changes';
          alert('Profile was not saved because the backend update failed: ' + error.message);
          return;
        }
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Changes';
        localStorage.setItem(adminProfileStorageKey(user), JSON.stringify(data));
        applyAdminProfile();
        closeProfileModal();
        document.getElementById('profileConfirmModal').style.display = 'flex';
      };
      document.getElementById('closeConfirmBtn').onclick = () => {
        document.getElementById('profileConfirmModal').style.display = 'none';
      };
    })();

    // ===== LOAD SAVED THEME =====
    const savedTheme = localStorage.getItem('theme');

    if(savedTheme === 'light'){
      document.body.classList.add('light-mode');
      lightThemeCard.classList.add('active');
      darkThemeCard.classList.remove('active');

    }else{
      document.body.classList.remove('light-mode');
      darkThemeCard.classList.add('active');
      lightThemeCard.classList.remove('active');
    }

    /* ===== SYNC RECORDS BUTTON ===== */

    const syncRecordsBtn =
      document.getElementById("syncRecordsBtn");

    if(syncRecordsBtn){

      const syncIcon =
        syncRecordsBtn.querySelector(".sync-icon");

      const syncText =
        syncRecordsBtn.querySelector(".sync-text");

      syncRecordsBtn.addEventListener("click", async () => {

        // PREVENT DOUBLE CLICK
        if(syncRecordsBtn.classList.contains("syncing")){
          return;
        }

        syncRecordsBtn.classList.add("syncing");
        syncRecordsBtn.disabled = true;

        // ===== START SPIN ANIMATION =====
        syncIcon.classList.remove(
          "fa-rotate",
          "fa-circle-check",
          "fa-triangle-exclamation"
        );

        syncIcon.classList.add(
          "fa-arrows-rotate",
          "fa-spin"
        );

        syncText.textContent = "Synchronizing...";

        try{

          // ===== REFRESH DATA FROM SUCCESSFUL BACKEND ACCOUNTS =====
          await Promise.all([syncUsersFromBackend(), syncAttendanceFromBackend()]);

          renderEmployees();
          renderAttendanceLogs();
          renderReports();

          totalEmployeesStat.textContent =
            employees.length;

          // ===== SUCCESS =====
          setTimeout(() => {

            syncIcon.classList.remove(
              "fa-spin",
              "fa-arrows-rotate"
            );

            syncIcon.classList.add(
              "fa-circle-check"
            );

            syncRecordsBtn.classList.add("synced");
            syncText.textContent = "Synced ✓";

            // ===== RESET BUTTON =====
            setTimeout(() => {

              syncIcon.classList.remove(
                "fa-circle-check"
              );

              syncIcon.classList.add(
                "fa-rotate"
              );

              syncText.textContent =
                "Sync Records";

              syncRecordsBtn.disabled = false;

              syncRecordsBtn.classList.remove(
                "syncing",
                "synced"
              );

            }, 1800);

          }, 1500);

        }catch(error){

          console.error("Sync failed:", error);

          syncIcon.classList.remove(
            "fa-spin",
            "fa-arrows-rotate"
          );

          syncIcon.classList.add(
            "fa-triangle-exclamation"
          );

          syncText.textContent =
            "Sync Failed";

          setTimeout(() => {

            syncIcon.classList.remove(
              "fa-triangle-exclamation"
            );

            syncIcon.classList.add(
              "fa-rotate"
            );

            syncText.textContent =
              "Sync Records";

            syncRecordsBtn.disabled = false;

            syncRecordsBtn.classList.remove(
              "syncing"
            );

          }, 2000);

        }

      });

    }

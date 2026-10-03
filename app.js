// Unified Logistics Hub - Main Application Controller

class UnifiedLogisticsHubApp {
  constructor() {
    this.data = window.HUB_DATA;
    this.validator = new window.HSCodeValidator(this.data.HS_RULES_DATABASE);
    
    this.currentRole = 'CS Specialist (Senior Lead)';
    this.activeTab = 'dashboard-pane';
    this.shipmentFilterStatus = 'all';
    this.searchQuery = '';
    
    this.selectedJobForWorkbench = 'JOB-2026-0895';
    this.activeDocBoundingBox = null;
    
    this.init();
  }

  init() {
    // Initialize Canvas background
    window.networkCanvas = new window.LogisticsNetworkCanvas('bg-canvas');
    
    // Bind Tab navigation
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetTab = e.currentTarget.dataset.tab;
        this.switchTab(targetTab);
      });
    });

    // Render initial views
    this.renderDashboardKPIs();
    this.renderShipmentTable();
    this.renderAlertFeed();
    this.renderSystemNodes();
    this.renderRpaLogs();
    
    // Bind Search & Filters
    const searchInput = document.getElementById('table-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase();
        this.renderShipmentTable();
      });
    }

    const filterSelect = document.getElementById('table-status-filter');
    if (filterSelect) {
      filterSelect.addEventListener('change', (e) => {
        this.shipmentFilterStatus = e.target.value;
        this.renderShipmentTable();
      });
    }

    // Auto-load Workbench
    this.loadWorkbenchJob(this.selectedJobForWorkbench);
  }

  switchTab(tabId) {
    this.activeTab = tabId;
    
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });

    document.querySelectorAll('.tab-pane').forEach(pane => {
      pane.classList.toggle('active', pane.id === tabId);
    });

    if (tabId === 'workbench-pane') {
      this.loadWorkbenchJob(this.selectedJobForWorkbench);
    }

    if (tabId === 'job-mgmt-pane') {
      const container = document.getElementById('job-mgmt-list-view');
      if (container) {
        container.innerHTML = `
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Job Order ID</th>
                  <th>Container / B/L</th>
                  <th>Importer & Vessel</th>
                  <th>HS Code</th>
                  <th>Customs Status</th>
                  <th>5 Core Nodes Matrix</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                ${this.data.SHIPMENT_DATA.map(s => `
                  <tr>
                    <td><span class="code-pill">${s.id}</span></td>
                    <td><strong>${s.containerNo}</strong><br><span style="font-size:0.75rem; color:var(--text-muted);">${s.blNumber}</span></td>
                    <td>${s.importer}</td>
                    <td><span class="code-pill">${s.hsCode}</span></td>
                    <td><span class="badge ${s.statusClass}">${s.customsStatus}</span></td>
                    <td>
                      <div class="sync-matrix">
                        <div class="sync-node-icon node-ok" title="Node 1 InCustoms AI"><i class="fa-solid fa-brain"></i></div>
                        <div class="sync-node-icon ${s.syncFlow.homeRPA.status === 'error' ? 'node-err' : 'node-ok'}" title="Node 2 Home RPA"><i class="fa-solid fa-robot"></i></div>
                        <div class="sync-node-icon node-ok" title="Node 3 VPLUS"><i class="fa-solid fa-ship"></i></div>
                        <div class="sync-node-icon ${s.syncFlow.eVoucher.status === 'error' ? 'node-err' : 'node-ok'}" title="Node 4 eVoucher"><i class="fa-solid fa-file-invoice-dollar"></i></div>
                        <div class="sync-node-icon node-ok" title="Node 5 TMS"><i class="fa-solid fa-truck-fast"></i></div>
                      </div>
                    </td>
                    <td>
                      <button class="btn btn-secondary" style="padding:4px 8px; font-size:0.75rem;" onclick="window.hubApp.openJobDetailModal('${s.id}')">
                        <i class="fa-solid fa-eye"></i> Details
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
      }
    }
  }

  // Single Entry New Shipment Intake
  openNewShipmentModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'new-shipment-modal';
    modal.innerHTML = `
      <div class="card" style="width: 100%; max-width: 650px; padding: 24px; position: relative;">
        <button class="modal-close-btn" onclick="this.closest('.modal-overlay').remove()"><i class="fa-solid fa-xmark"></i></button>

        <div style="margin-bottom: 20px;">
          <div style="display:inline-flex; align-items:center; gap:8px; background:var(--primary-light-blue); color:var(--primary-soft-blue); padding:4px 12px; border-radius:12px; font-weight:700; font-size:0.8rem; margin-bottom:8px;">
            <i class="fa-solid fa-brain"></i> AI InCustoms (LayoutLM) Single Entry Intake
          </div>
          <h3 style="font-size: 1.25rem; font-weight:700; color:var(--primary-navy);">Ingest / Create New Import Shipment</h3>
          <p style="font-size: 0.82rem; color:var(--text-muted);">Data entered or extracted once automatically populates VPLUS, eVoucher, and TMS via Home RPA.</p>
        </div>

        <div style="display:flex; gap:10px; margin-bottom:20px; border-bottom:1px solid var(--border-light); padding-bottom:12px;">
          <button class="btn btn-secondary active" id="btn-tab-upload" onclick="window.hubApp.switchNewShipmentTab('upload')" style="flex:1;">
            <i class="fa-solid fa-file-arrow-up"></i> Upload Document (AI InCustoms)
          </button>
          <button class="btn btn-secondary" id="btn-tab-form" onclick="window.hubApp.switchNewShipmentTab('form')" style="flex:1;">
            <i class="fa-solid fa-pen-to-square"></i> Manual Entry Form
          </button>
        </div>

        <!-- Upload Tab Panel -->
        <div id="panel-new-upload">
          <div style="border: 2px dashed var(--primary-accent); background: var(--primary-light-blue); padding: 30px; border-radius: var(--radius-md); text-align: center; cursor: pointer;" onclick="document.getElementById('sim-file-input').click()">
            <i class="fa-solid fa-cloud-arrow-up" style="font-size: 2.5rem; color: var(--primary-soft-blue); margin-bottom: 10px;"></i>
            <h4 style="font-size: 0.95rem; font-weight:700; color: var(--primary-navy);">Click or Drag & Drop Customs Documents Here</h4>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">Supports Commercial Invoice, Packing List, or PIB Draft (PDF/JPG/PNG)</p>
            <input type="file" id="sim-file-input" style="display:none" onchange="window.hubApp.handleFileUploadSim(event)">
          </div>

          <div style="margin-top: 16px; background: var(--bg-app); padding: 12px; border-radius: var(--radius-sm); font-size: 0.78rem; color: var(--text-muted);">
            <i class="fa-solid fa-info-circle" style="color:var(--primary-soft-blue);"></i> <strong>AI Pipeline:</strong> LayoutLM extracts B/L, Container No, HS Code, and CIF Value, runs BTKI tariff check, and dispatches to Home RPA orchestrator.
          </div>
        </div>

        <!-- Form Tab Panel -->
        <div id="panel-new-form" style="display:none;">
          <form id="new-shipment-form" onsubmit="event.preventDefault(); window.hubApp.submitNewShipment();">
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size:0.8rem;">
              <div>
                <label style="font-weight:600; display:block; margin-bottom:4px;">Container Number *</label>
                <input type="text" id="ns-container" class="filter-select" style="width:100%; font-family:'JetBrains Mono';" placeholder="KMTU-901284-5" required>
              </div>
              <div>
                <label style="font-weight:600; display:block; margin-bottom:4px;">Bill of Lading (B/L) *</label>
                <input type="text" id="ns-bl" class="filter-select" style="width:100%; font-family:'JetBrains Mono';" placeholder="KMTC-88192039" required>
              </div>
              <div>
                <label style="font-weight:600; display:block; margin-bottom:4px;">Importer Company *</label>
                <input type="text" id="ns-importer" class="filter-select" style="width:100%;" placeholder="PT Global Indotech Supreme" required>
              </div>
              <div>
                <label style="font-weight:600; display:block; margin-bottom:4px;">Consignee Destination *</label>
                <input type="text" id="ns-consignee" class="filter-select" style="width:100%;" placeholder="PT Global Warehouse Delta Silicon" required>
              </div>
              <div>
                <label style="font-weight:600; display:block; margin-bottom:4px;">HS Tariff Code (BTKI) *</label>
                <input type="text" id="ns-hscode" class="filter-select" style="width:100%; font-family:'JetBrains Mono';" placeholder="8471.30.90" required>
              </div>
              <div>
                <label style="font-weight:600; display:block; margin-bottom:4px;">Container Size</label>
                <select id="ns-size" class="filter-select" style="width:100%;">
                  <option value="40ft HC">40ft High Cube (HC)</option>
                  <option value="20ft Standard">20ft Standard</option>
                  <option value="40ft Reefer">40ft Reefer</option>
                </select>
              </div>
              <div style="grid-column: span 2;">
                <label style="font-weight:600; display:block; margin-bottom:4px;">Goods Description *</label>
                <input type="text" id="ns-desc" class="filter-select" style="width:100%;" placeholder="Portable Automatic Data Processing Laptops 14-inch" required>
              </div>
              <div>
                <label style="font-weight:600; display:block; margin-bottom:4px;">Vessel & Voyage</label>
                <input type="text" id="ns-vessel" class="filter-select" style="width:100%;" placeholder="KMTC SHANGHAI / V.2608E">
              </div>
              <div>
                <label style="font-weight:600; display:block; margin-bottom:4px;">Destination Port</label>
                <select id="ns-port" class="filter-select" style="width:100%;">
                  <option value="Tanjung Priok (IDTPP)">Tanjung Priok (IDTPP)</option>
                  <option value="Tanjung Perak (IDSUB)">Tanjung Perak (IDSUB)</option>
                </select>
              </div>
            </div>

            <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:20px;">
              <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
              <button type="submit" class="btn btn-primary">
                <i class="fa-solid fa-cloud-arrow-up"></i> Submit & Auto-Sync Nodes
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  switchNewShipmentTab(tabName) {
    const uploadBtn = document.getElementById('btn-tab-upload');
    const formBtn = document.getElementById('btn-tab-form');
    const panelUpload = document.getElementById('panel-new-upload');
    const panelForm = document.getElementById('panel-new-form');

    if (tabName === 'upload') {
      uploadBtn.classList.add('active');
      formBtn.classList.remove('active');
      panelUpload.style.display = 'block';
      panelForm.style.display = 'none';
    } else {
      formBtn.classList.add('active');
      uploadBtn.classList.remove('active');
      panelForm.style.display = 'block';
      panelUpload.style.display = 'none';
    }
  }

  handleFileUploadSim(event) {
    const file = event.target.files[0] || { name: 'Commercial_Invoice_2026.pdf' };
    
    const modalEl = document.getElementById('new-shipment-modal');
    if (modalEl) modalEl.remove();

    // Show step progress toast simulation
    this.showNotification('AI LayoutLM Processing', `Extracting structured data from "${file.name}"...`, 'info');

    setTimeout(() => {
      // Auto populate a new extracted shipment
      const newJobId = 'JOB-2026-0910';
      const newShipment = {
        id: newJobId,
        blNumber: 'KMTC-99102847',
        containerNo: 'KMTU-901284-5',
        size: '40ft HC',
        importer: 'PT Global Indotech Supreme',
        consignee: 'PT Global Warehouse Cikarang',
        originPort: 'Shanghai Port (CNSHA)',
        destPort: 'Tanjung Priok (IDTPP)',
        vessel: 'KMTC SHANGHAI / V.2608E',
        hsCode: '8471.30.90',
        hsStatus: 'valid',
        hsRisk: 'low',
        goodsDescription: 'Portable Automatic Data Processing Machines (Laptops 14")',
        aiConfidence: 98.9,
        customsStatus: 'Jalur Hijau (SPPB Released)',
        customsStatusCode: 'cleared',
        rpaStatus: 'Synced (Auto Polled)',
        vplusStatus: 'Pre-Arrival Registered',
        evoucherStatus: 'Guarantee Issued',
        tmsStatus: 'Scheduled Fleet (B-9201-US)',
        overallStatus: 'Customs Cleared',
        statusClass: 'status-success',
        eta: '2026-08-11 10:00',
        lastSync: 'Just now',
        hasDoAlert: false,
        alertId: null,
        syncFlow: {
          inCustoms: { status: 'success', time: 'Just now', confidence: '98.9%' },
          homeRPA: { status: 'success', time: 'Just now', retries: 0 },
          vplus: { status: 'success', time: 'Just now', refNo: 'VPLUS-99201' },
          eVoucher: { status: 'success', time: 'Just now', voucherNo: 'EV-2026-8812' },
          tms: { status: 'success', time: 'Just now', fleetNo: 'B-9201-US' }
        }
      };

      this.data.SHIPMENT_DATA.unshift(newShipment);
      this.renderDashboardKPIs();
      this.renderShipmentTable();

      this.showNotification('Single Entry Ingestion Complete', `Shipment ${newJobId} created and synchronized across VPLUS, eVoucher, and TMS!`, 'success');
    }, 1500);
  }

  submitNewShipment() {
    const container = document.getElementById('ns-container').value;
    const bl = document.getElementById('ns-bl').value;
    const importer = document.getElementById('ns-importer').value;
    const consignee = document.getElementById('ns-consignee').value;
    const hsCode = document.getElementById('ns-hscode').value;
    const size = document.getElementById('ns-size').value;
    const desc = document.getElementById('ns-desc').value;
    const vessel = document.getElementById('ns-vessel').value || 'CMA CGM / V.102W';
    const destPort = document.getElementById('ns-port').value;

    const modalEl = document.getElementById('new-shipment-modal');
    if (modalEl) modalEl.remove();

    // Tariff check
    const validation = this.validator.validate(hsCode, desc);

    const newJobId = 'JOB-2026-' + Math.floor(Math.random()*900 + 100);
    const newShipment = {
      id: newJobId,
      blNumber: bl,
      containerNo: container,
      size: size,
      importer: importer,
      consignee: consignee,
      originPort: 'Shanghai Port (CNSHA)',
      destPort: destPort,
      vessel: vessel,
      hsCode: hsCode,
      hsStatus: validation.riskLevel === 'high' ? 'invalid_lartas' : 'valid',
      hsRisk: validation.riskLevel,
      goodsDescription: desc,
      aiConfidence: 97.5,
      customsStatus: validation.riskLevel === 'high' ? 'PIB Draft Pending (LARTAS Permit)' : 'PIB Submitted (Under Customs Review)',
      customsStatusCode: validation.riskLevel === 'high' ? 'pending_verify' : 'pending_verify',
      rpaStatus: 'Synced (Auto Polled)',
      vplusStatus: 'Pre-Arrival Registered',
      evoucherStatus: 'Guarantee Active',
      tmsStatus: 'Pending Clearance',
      overallStatus: validation.riskLevel === 'high' ? 'HS Code Violation' : 'Customs Pending',
      statusClass: validation.riskLevel === 'high' ? 'status-danger' : 'status-info',
      eta: '2026-08-11 12:00',
      lastSync: 'Just now',
      hasDoAlert: validation.riskLevel === 'high',
      alertId: null,
      syncFlow: {
        inCustoms: { status: 'success', time: 'Just now', confidence: '97.5%' },
        homeRPA: { status: 'success', time: 'Just now', retries: 0 },
        vplus: { status: 'success', time: 'Just now', refNo: 'VPLUS-NEW' },
        eVoucher: { status: 'success', time: 'Just now', voucherNo: 'EV-2026-NEW' },
        tms: { status: 'pending', time: 'Awaiting Customs' }
      }
    };

    this.data.SHIPMENT_DATA.unshift(newShipment);
    this.renderDashboardKPIs();
    this.renderShipmentTable();

    this.showNotification('New Shipment Registered', `Single Entry Shipment ${newJobId} created and synchronized across VPLUS, eVoucher, and TMS.`, 'success');
  }

  // Login Flow Execution (Matching User Screenshot Blueprint)
  executeLoginFlow() {
    const email = document.getElementById('login-email-input').value;
    const pwd = document.getElementById('login-password-input').value;

    const loginPane = document.getElementById('login-view-pane');
    const mainShell = document.getElementById('main-app-shell');

    if (loginPane && mainShell) {
      loginPane.style.display = 'none';
      mainShell.style.display = 'block';
    }

    this.showNotification('UNO SSO Authenticated', `Welcome back! Signed in as ${email} (NIK: 3174092801940003).`, 'success');
    this.switchTab('dashboard-pane');
  }

  signOut() {
    const loginPane = document.getElementById('login-view-pane');
    const mainShell = document.getElementById('main-app-shell');

    if (loginPane && mainShell) {
      mainShell.style.display = 'none';
      loginPane.style.display = 'flex';
    }

    this.showNotification('Workspace Locked', 'You have been signed out of Unified Logistics Hub.', 'info');
  }

  togglePasswordVisibility() {
    const pwdInput = document.getElementById('login-password-input');
    const icon = document.getElementById('toggle-pwd-icon');

    if (pwdInput && icon) {
      if (pwdInput.type === 'password') {
        pwdInput.type = 'text';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
      } else {
        pwdInput.type = 'password';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
      }
    }
  }

  // User Profile Management & NIK Identity (Layer 1)
  openEditProfileModal() {
    const user = this.data.mfaUser || {
      nik: '3174092801940003',
      name: 'remmoon',
      role: this.currentRole || 'Customer Service Team',
      email: 'remmoon@uniaircargo.co.id',
      phone: '+62 812-8890-4129',
      dept: 'Tanjung Priok Import Operations Hub',
      mfaChannel: 'whatsapp'
    };

    const roles = this.data.USER_ROLES;

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'profile-modal-overlay';
    modal.innerHTML = `
      <div class="card" style="width: 100%; max-width: 580px; padding: 24px; position: relative;">
        <button class="modal-close-btn" onclick="this.closest('.modal-overlay').remove()"><i class="fa-solid fa-xmark"></i></button>

        <div style="margin-bottom: 20px;">
          <div style="display:inline-flex; align-items:center; gap:8px; background:var(--primary-light-blue); color:var(--primary-soft-blue); padding:4px 12px; border-radius:12px; font-weight:700; font-size:0.8rem; margin-bottom:8px;">
            <i class="fa-solid fa-id-card"></i> UNO Portal SSO & Identity Management
          </div>
          <h3 style="font-size: 1.25rem; font-weight:700; color:var(--primary-navy);">Edit User Profile & NIK Identity</h3>
          <p style="font-size: 0.8rem; color:var(--text-muted);">Manage your Single Sign-On (SSO) credentials, NIK ID, and Multi-Factor Authentication preferences.</p>
        </div>

        <form id="edit-profile-form" onsubmit="event.preventDefault(); window.hubApp.saveUserProfile();">
          <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 14px; font-size:0.82rem;">
            
            <div style="grid-column: span 2; display:flex; align-items:center; gap:16px; background:var(--bg-app); padding:14px; border-radius:var(--radius-md);">
              <div class="avatar" id="edit-profile-avatar" style="width:48px; height:48px; font-size:1.1rem;">${this.getInitials(user.name)}</div>
              <div>
                <strong style="color:var(--primary-navy); font-size:0.95rem;">NIK Identity: <code>${user.nik}</code></strong>
                <div style="font-size:0.75rem; color:var(--text-muted);">Authenticated via UNO SSO &bull; Verified Account</div>
              </div>
            </div>

            <div>
              <label style="font-weight:600; display:block; margin-bottom:4px;">Full Name *</label>
              <input type="text" id="prof-name" class="filter-select" style="width:100%; font-weight:600;" value="${user.name}" required>
            </div>

            <div>
              <label style="font-weight:600; display:block; margin-bottom:4px;">NIK (Nomor Induk Kependudukan) *</label>
              <input type="text" id="prof-nik" class="filter-select" style="width:100%; font-family:'JetBrains Mono';" value="${user.nik}" required>
            </div>

            <div>
              <label style="font-weight:600; display:block; margin-bottom:4px;">Corporate Email Address *</label>
              <input type="email" id="prof-email" class="filter-select" style="width:100%;" value="${user.email}" required>
            </div>

            <div>
              <label style="font-weight:600; display:block; margin-bottom:4px;">Phone Number (MFA WhatsApp) *</label>
              <input type="text" id="prof-phone" class="filter-select" style="width:100%; font-family:'JetBrains Mono';" value="${user.phone}" required>
            </div>

            <div>
              <label style="font-weight:600; display:block; margin-bottom:4px;">Assigned Role (RBAC Layer 1) *</label>
              <select id="prof-role" class="filter-select" style="width:100%;">
                ${roles.map(r => `<option value="${r.name}" ${r.name === user.role ? 'selected' : ''}>${r.name} (${r.code})</option>`).join('')}
              </select>
            </div>

            <div>
              <label style="font-weight:600; display:block; margin-bottom:4px;">Department / Operational Hub</label>
              <input type="text" id="prof-dept" class="filter-select" style="width:100%;" value="${user.dept}">
            </div>

            <div style="grid-column: span 2;">
              <label style="font-weight:600; display:block; margin-bottom:4px;">Preferred Primary MFA Channel</label>
              <select id="prof-mfa-channel" class="filter-select" style="width:100%;">
                <option value="whatsapp" ${user.mfaChannel === 'whatsapp' ? 'selected' : ''}>WhatsApp Primary &rarr; Email Automatic Failover</option>
                <option value="email" ${user.mfaChannel === 'email' ? 'selected' : ''}>Email Primary Channel</option>
              </select>
            </div>

          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:20px; border-top:1px solid var(--border-light); padding-top:14px;">
            <button type="button" class="btn btn-secondary" onclick="window.hubApp.openRoleSelectorModal()">
              <i class="fa-solid fa-users-gear"></i> Quick Switch Role
            </button>
            <div style="display:flex; gap:10px;">
              <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
              <button type="submit" class="btn btn-primary">
                <i class="fa-solid fa-floppy-disk"></i> Save Profile Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(modal);
  }

  saveUserProfile() {
    const name = document.getElementById('prof-name').value;
    const nik = document.getElementById('prof-nik').value;
    const email = document.getElementById('prof-email').value;
    const phone = document.getElementById('prof-phone').value;
    const role = document.getElementById('prof-role').value;
    const dept = document.getElementById('prof-dept').value;
    const mfaChannel = document.getElementById('prof-mfa-channel').value;

    const modalEl = document.getElementById('profile-modal-overlay');
    if (modalEl) modalEl.remove();

    // Update global state
    this.currentRole = role;
    const updatedUser = { nik, name, role, email, phone, dept, mfaChannel };
    this.data.mfaUser = updatedUser;

    // Sync with MFA Simulator if active
    if (window.mfaSimulator) {
      window.mfaSimulator.nikUser = {
        nik, name, role, email, phone
      };
    }

    // Update Header UI Elements
    const nameEl = document.getElementById('user-display-name');
    const roleEl = document.getElementById('user-role-label');
    const avatarEls = document.querySelectorAll('.user-profile-menu .avatar');

    if (nameEl) nameEl.innerText = name;
    if (roleEl) roleEl.innerText = role;

    const initials = this.getInitials(name);
    avatarEls.forEach(av => av.innerText = initials);

    this.showNotification('Profile Updated Successfully', `UNO SSO profile for ${name} (${nik}) updated across all systems.`, 'success');
  }

  getInitials(fullName) {
    const name = (fullName || 'remmoon').trim();
    const parts = name.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    } else if (name.length >= 2) {
      return (name[0] + name[1]).toUpperCase();
    }
    return 'RM';
  }

  // 7-Role Selection (Layer 1 User / Access Layer)
  openRoleSelectorModal() {
    const roles = this.data.USER_ROLES;
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="card" style="width: 100%; max-width: 520px; padding: 24px; position: relative;">
        <button class="modal-close-btn" onclick="this.closest('.modal-overlay').remove()"><i class="fa-solid fa-xmark"></i></button>

        <div style="margin-bottom: 20px;">
          <h3 style="font-size: 1.2rem; font-weight:700; color:var(--primary-navy);">
            <i class="fa-solid fa-user-shield" style="color:var(--primary-soft-blue);"></i> Select User Role & Access Profile
          </h3>
          <p style="font-size:0.8rem; color:var(--text-muted);">Layer 1 RBAC (Role-Based Access Control) authenticated via UNO NIK SSO.</p>
        </div>

        <div style="display:flex; flex-direction:column; gap:10px;">
          ${roles.map(r => `
            <div class="field-verify-item" style="cursor:pointer; transition:all 0.2s;" onclick="window.hubApp.selectUserRole('${r.id}'); this.closest('.modal-overlay').remove();">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="font-weight:700; color:var(--primary-navy); font-size:0.88rem;">${r.name}</span>
                <span class="code-pill">${r.code}</span>
              </div>
              <p style="font-size:0.75rem; color:var(--text-muted); margin-top:4px;">${r.permissions}</p>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  selectUserRole(roleId) {
    const roleObj = this.data.USER_ROLES.find(r => r.id === roleId);
    if (!roleObj) return;

    this.currentRole = roleObj.name;
    const roleLabel = document.getElementById('user-role-label');
    if (roleLabel) roleLabel.innerText = roleObj.name;

    this.showNotification('RBAC Security Updated', `Switched access context to: "${roleObj.name}" (${roleObj.code})`, 'info');
  }

  // Role Switcher Simulation (NIK SSO RBAC)
  setRole(roleName) {
    this.currentRole = roleName;
    const roleEl = document.getElementById('user-role-label');
    if (roleEl) roleEl.innerText = roleName;
    this.showNotification('RBAC Access Switched', `Active Session Role updated to: ${roleName}`, 'info');
  }

  renderDashboardKPIs() {
    const shipments = this.data.SHIPMENT_DATA;
    const totalActive = shipments.length;
    const customsPending = shipments.filter(s => s.customsStatusCode !== 'cleared').length;
    const cleared = shipments.filter(s => s.customsStatusCode === 'cleared').length;
    const exceptions = shipments.filter(s => s.aiConfidence < 80 || s.hsStatus !== 'valid').length;
    const criticalAlerts = this.data.DO_ALERTS.filter(a => a.severity === 'critical').length;

    document.getElementById('kpi-total-active').innerText = totalActive;
    document.getElementById('kpi-customs-pending').innerText = customsPending;
    document.getElementById('kpi-clearance-completed').innerText = cleared;
    document.getElementById('kpi-exceptions').innerText = exceptions;
    document.getElementById('kpi-critical-alerts').innerText = criticalAlerts;
  }

  renderShipmentTable() {
    const tbody = document.getElementById('shipment-table-body');
    if (!tbody) return;

    let filtered = this.data.SHIPMENT_DATA.filter(s => {
      // Status filter
      if (this.shipmentFilterStatus === 'pending' && s.customsStatusCode === 'cleared') return false;
      if (this.shipmentFilterStatus === 'cleared' && s.customsStatusCode !== 'cleared') return false;
      if (this.shipmentFilterStatus === 'exceptions' && s.aiConfidence >= 80 && s.hsStatus === 'valid') return false;
      if (this.shipmentFilterStatus === 'failed_sync' && !s.rpaStatus.includes('Error')) return false;

      // Search query
      if (this.searchQuery) {
        const q = this.searchQuery;
        return (
          s.id.toLowerCase().includes(q) ||
          s.blNumber.toLowerCase().includes(q) ||
          s.containerNo.toLowerCase().includes(q) ||
          s.importer.toLowerCase().includes(q) ||
          s.hsCode.includes(q)
        );
      }
      return true;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="10" style="text-align:center; padding: 30px; color: var(--text-muted);">No matching shipments found.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(s => {
      const isLowConf = s.aiConfidence < 80;
      const confidenceColor = isLowConf ? 'var(--status-error)' : 'var(--status-success)';

      return `
        <tr onclick="window.hubApp.openJobDetailModal('${s.id}')">
          <td><span class="code-pill">${s.id}</span></td>
          <td>
            <div style="font-weight: 600;">${s.containerNo}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${s.blNumber}</div>
          </td>
          <td>
            <div style="font-weight: 500;">${s.importer}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${s.vessel}</div>
          </td>
          <td>
            <span class="code-pill">${s.hsCode}</span>
            ${s.hsStatus === 'flagged' ? '<span class="badge badge-danger" style="margin-left:4px;">Flagged</span>' : ''}
            ${s.hsStatus === 'invalid_lartas' ? '<span class="badge badge-danger" style="margin-left:4px;">LARTAS</span>' : ''}
          </td>
          <td>
            <span style="font-weight: 700; color: ${confidenceColor};">${s.aiConfidence.toFixed(1)}%</span>
            ${isLowConf ? '<i class="fa-solid fa-triangle-exclamation" style="color: var(--status-error); margin-left:4px;" title="Low Confidence"></i>' : ''}
          </td>
          <td>
            <span class="badge ${s.statusClass}">${s.customsStatus}</span>
          </td>
          <td>
            <div class="sync-matrix">
              <div class="sync-node-icon node-ok" title="InCustoms LayoutLM: ${s.syncFlow.inCustoms.status}"><i class="fa-solid fa-brain"></i></div>
              <div class="sync-node-icon ${s.syncFlow.homeRPA.status === 'error' ? 'node-err' : (s.syncFlow.homeRPA.status === 'paused' ? 'node-warn' : 'node-ok')}" title="Home RPA: ${s.syncFlow.homeRPA.status}"><i class="fa-solid fa-robot"></i></div>
              <div class="sync-node-icon ${s.syncFlow.vplus.status === 'success' ? 'node-ok' : 'node-warn'}" title="VPLUS: ${s.syncFlow.vplus.status}"><i class="fa-solid fa-ship"></i></div>
              <div class="sync-node-icon ${s.syncFlow.eVoucher.status === 'error' ? 'node-err' : (s.syncFlow.eVoucher.status === 'pending' ? 'node-warn' : 'node-ok')}" title="eVoucher: ${s.syncFlow.eVoucher.status}"><i class="fa-solid fa-file-invoice-dollar"></i></div>
              <div class="sync-node-icon ${s.syncFlow.tms.status === 'success' ? 'node-ok' : 'node-warn'}" title="TMS: ${s.syncFlow.tms.status}"><i class="fa-solid fa-truck-fast"></i></div>
            </div>
          </td>
          <td style="font-size: 0.78rem; color: var(--text-muted);">${s.lastSync}</td>
          <td>
            <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 0.75rem;" onclick="event.stopPropagation(); window.hubApp.openJobDetailModal('${s.id}')">
              <i class="fa-solid fa-folder-open"></i> View
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  renderAlertFeed() {
    const listEl = document.getElementById('sidebar-alert-feed');
    if (!listEl) return;

    listEl.innerHTML = this.data.DO_ALERTS.map(a => `
      <div class="feed-item" onclick="window.hubApp.handleAlertClick('${a.id}')">
        <div class="feed-header">
          <span class="badge ${a.severity === 'critical' ? 'badge-danger' : 'badge-warning'}">${a.type}</span>
          <span style="color: var(--text-muted);">${a.timestamp}</span>
        </div>
        <div class="feed-title">${a.title}</div>
        <div class="feed-desc">${a.message}</div>
      </div>
    `).join('');
  }

  handleAlertClick(alertId) {
    const alert = this.data.DO_ALERTS.find(a => a.id === alertId);
    if (!alert) return;

    if (alert.shipmentId === 'JOB-2026-0895') {
      this.selectedJobForWorkbench = 'JOB-2026-0895';
      this.switchTab('workbench-pane');
    } else if (alert.node === 'evoucher') {
      this.switchTab('rpa-pane');
    } else if (alert.type === 'HS Code Compliance') {
      this.switchTab('hscode-pane');
    } else {
      this.openJobDetailModal(alert.shipmentId);
    }
  }

  renderSystemNodes() {
    const listEl = document.getElementById('system-node-list');
    if (!listEl) return;

    const nodes = Object.values(this.data.SYSTEM_NODES);
    listEl.innerHTML = nodes.map(n => `
      <div class="node-row">
        <div class="node-name-wrap">
          <i class="fa-solid ${n.icon}" style="color: var(--primary-soft-blue);"></i>
          <span>${n.name}</span>
        </div>
        <div class="node-stats">
          <span>${n.latency}</span>
          <span class="badge ${n.status === 'online' ? 'badge-success' : 'badge-warning'}">${n.health}% Health</span>
        </div>
      </div>
    `).join('');
  }

  renderRpaLogs() {
    const logContainer = document.getElementById('rpa-log-stream');
    if (!logContainer) return;

    logContainer.innerHTML = this.data.RPA_LOGS.map(l => {
      let badgeClass = 'badge-info';
      if (l.level === 'success') badgeClass = 'badge-success';
      if (l.level === 'warn') badgeClass = 'badge-warning';
      if (l.level === 'error') badgeClass = 'badge-danger';

      return `
        <div style="font-family: 'JetBrains Mono', monospace; font-size: 0.78rem; padding: 6px 0; border-bottom: 1px solid var(--border-subtle); display: flex; gap: 12px; align-items: center;">
          <span style="color: var(--text-muted); min-width: 60px;">${l.time}</span>
          <span class="badge ${badgeClass}" style="min-width: 90px; justify-content: center;">${l.node}</span>
          <span style="flex:1; color: var(--text-dark);">${l.message}</span>
        </div>
      `;
    }).join('');
  }

  triggerRpaManualSync() {
    this.showNotification('RPA Poller Executed', 'Forced manual data synchronization across VPLUS, eVoucher, and TMS nodes.', 'success');
    
    // Fix JOB-2026-0899 sync failure
    const failedJob = this.data.SHIPMENT_DATA.find(s => s.id === 'JOB-2026-0899');
    if (failedJob) {
      failedJob.rpaStatus = 'Synced (Manual Retry)';
      failedJob.evoucherStatus = 'Guarantee Issued (V-9921)';
      failedJob.syncFlow.eVoucher.status = 'success';
      failedJob.syncFlow.homeRPA.status = 'success';
      failedJob.overallStatus = 'Customs Cleared';
      failedJob.statusClass = 'status-success';
    }

    this.data.RPA_LOGS.unshift({
      id: 'LOG-' + Math.floor(Math.random()*9000+1000),
      time: new Date().toLocaleTimeString(),
      node: 'Home RPA',
      level: 'success',
      message: 'Manual Force Sync succeeded. eVoucher guarantee node synced for JOB-2026-0899.'
    });

    this.renderDashboardKPIs();
    this.renderShipmentTable();
    this.renderRpaLogs();
  }

  // Exception Management Workbench Loader
  loadWorkbenchJob(jobId) {
    const sample = this.data.AI_EXTRACTION_SAMPLES[jobId];
    if (!sample) return;

    document.getElementById('wb-doc-name').innerText = sample.documentName;
    document.getElementById('wb-overall-conf').innerText = `${sample.overallConfidence.toFixed(1)}%`;

    const fieldsContainer = document.getElementById('wb-fields-list');
    if (fieldsContainer) {
      fieldsContainer.innerHTML = sample.fields.map(f => {
        const isLow = f.status === 'low';
        return `
          <div class="field-verify-item ${isLow ? 'flagged-low' : ''}" id="field-item-${f.key}" onclick="window.hubApp.highlightDocBox('${f.key}')">
            <div class="field-verify-header">
              <span class="field-name-label">${f.name}</span>
              <span class="confidence-pill ${isLow ? 'low' : 'high'}">AI Confidence: ${f.confidence.toFixed(1)}%</span>
            </div>
            
            <div class="field-input-group">
              <input type="text" id="input-field-${f.key}" value="${f.value}">
              ${isLow ? `
                <button class="btn btn-primary" onclick="window.hubApp.applyFieldFix('${jobId}', '${f.key}')">
                  <i class="fa-solid fa-check"></i> Fix & Approve
                </button>
              ` : ''}
            </div>

            ${f.suggestions ? `
              <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 6px;">AI Recommendations:</div>
              <div class="suggestion-chips">
                ${f.suggestions.map(s => `
                  <button class="chip-btn" onclick="document.getElementById('input-field-${f.key}').value = '${s.split(' ')[0]}'; window.hubApp.highlightDocBox('${f.key}');">
                    <i class="fa-solid fa-wand-magic-sparkles"></i> ${s}
                  </button>
                `).join('')}
              </div>
            ` : ''}
          </div>
        `;
      }).join('');
    }

    // Render Audit Trail
    const auditContainer = document.getElementById('wb-audit-trail');
    if (auditContainer) {
      auditContainer.innerHTML = sample.auditTrail.map(a => `
        <div style="font-size: 0.78rem; padding: 6px 0; border-bottom: 1px solid var(--border-subtle);">
          <span style="color: var(--text-muted);">${a.timestamp}</span> | 
          <strong style="color: var(--primary-navy);">${a.user}:</strong> ${a.action}
        </div>
      `).join('');
    }
  }

  highlightDocBox(fieldKey) {
    const boxEl = document.getElementById(`doc-box-${fieldKey}`);
    if (boxEl) {
      document.querySelectorAll('.doc-bounding-box').forEach(b => b.classList.remove('highlight'));
      boxEl.classList.add('highlight');
      boxEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  applyFieldFix(jobId, fieldKey) {
    const newValue = document.getElementById(`input-field-${fieldKey}`).value;
    const sample = this.data.AI_EXTRACTION_SAMPLES[jobId];
    if (!sample) return;

    const field = sample.fields.find(f => f.key === fieldKey);
    if (field) {
      field.value = newValue;
      field.confidence = 99.0;
      field.status = 'high';
      sample.overallConfidence = 96.5;

      sample.auditTrail.unshift({
        timestamp: new Date().toLocaleString(),
        user: `${this.currentRole} (${this.data.mfaUser ? this.data.mfaUser.name : 'Budi Santoso'})`,
        action: `Manual Correction applied to "${field.name}": Changed value to "${newValue}". Score updated to 99.0%.`
      });

      // Update main shipment record
      const shipment = this.data.SHIPMENT_DATA.find(s => s.id === jobId);
      if (shipment) {
        shipment.hsCode = newValue;
        shipment.aiConfidence = 96.5;
        shipment.hsStatus = 'valid';
        shipment.overallStatus = 'Customs Pending (Approved)';
        shipment.statusClass = 'status-info';
      }

      this.showNotification('AI Exception Resolved', `Field "${field.name}" verified and committed to VPLUS/TMS main ledger.`, 'success');
      this.loadWorkbenchJob(jobId);
      this.renderDashboardKPIs();
      this.renderShipmentTable();
    }
  }

  // Automated HS Code Validator Tool Execution
  runHsValidatorTool() {
    const code = document.getElementById('tool-hs-input').value;
    const desc = document.getElementById('tool-desc-input').value;

    const res = this.validator.validate(code, desc);

    const resContainer = document.getElementById('validator-result-card');
    if (!resContainer) return;

    let riskBadge = 'badge-success';
    if (res.riskLevel === 'medium') riskBadge = 'badge-warning';
    if (res.riskLevel === 'high' || res.riskLevel === 'critical') riskBadge = 'badge-danger';

    resContainer.innerHTML = `
      <div style="padding: 16px; background: white; border: 1px solid var(--border-light); border-radius: var(--radius-md);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 12px;">
          <h4 style="font-size: 0.95rem; font-weight: 700;">Validation Score & Risk Assessment</h4>
          <span class="badge ${riskBadge}" style="text-transform: uppercase;">${res.riskLevel} RISK</span>
        </div>

        <div style="margin-bottom: 12px;">
          <div style="font-size: 0.8rem; color: var(--text-muted);">Formatted HS Code:</div>
          <div class="code-pill" style="font-size: 1.1rem;">${res.cleanCode ? this.validator.formatDotted(res.cleanCode) : 'Invalid'}</div>
        </div>

        ${res.matchedRule ? `
          <div style="background: var(--primary-light-blue); padding: 10px; border-radius: 6px; font-size: 0.82rem; margin-bottom: 12px;">
            <strong>BTKI Classification:</strong> ${res.matchedRule.description}<br>
            <strong>Duty Rates:</strong> BM ${res.matchedRule.bm} | PPN ${res.matchedRule.ppn} | PPH ${res.matchedRule.pph}
          </div>
        ` : ''}

        ${res.issues.length > 0 ? `
          <div style="margin-bottom: 12px;">
            <strong style="font-size: 0.8rem; color: var(--status-error);">Detected Compliance Issues:</strong>
            <ul style="font-size: 0.8rem; color: var(--text-dark); margin-left: 20px; margin-top: 4px;">
              ${res.issues.map(i => `<li>${i.message}</li>`).join('')}
            </ul>
          </div>
        ` : '<div style="color: var(--status-success); font-size: 0.85rem; font-weight:600;"><i class="fa-solid fa-circle-check"></i> Code fully compliant with customs tariff rules. Ready for PIB submission.</div>'}

        ${res.recommendations.length > 0 ? `
          <div style="font-size: 0.8rem; background: #FFFBEB; border: 1px solid #FCD34D; padding: 10px; border-radius: 6px;">
            <strong>Recommended Corrective Action:</strong>
            <div style="margin-top: 2px;">${res.recommendations.join('<br>')}</div>
          </div>
        ` : ''}
      </div>
    `;
  }

  openJobDetailModal(jobId) {
    const s = this.data.SHIPMENT_DATA.find(item => item.id === jobId);
    if (!s) return;

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="card" style="width: 100%; max-width: 680px; padding: 24px; position: relative;">
        <button class="modal-close-btn" onclick="this.closest('.modal-overlay').remove()"><i class="fa-solid fa-xmark"></i></button>

        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 16px;">
          <div>
            <h3 style="font-size: 1.2rem; font-weight:700;">Job Order Ledger: ${s.id}</h3>
            <p style="font-size:0.8rem; color: var(--text-muted);">Container: ${s.containerNo} | B/L: ${s.blNumber}</p>
          </div>
          <span class="badge ${s.statusClass}">${s.customsStatus}</span>
        </div>

        <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; font-size: 0.82rem;">
          <div><strong>Importer:</strong> ${s.importer}</div>
          <div><strong>Consignee:</strong> ${s.consignee}</div>
          <div><strong>Origin / Dest:</strong> ${s.originPort} &rarr; ${s.destPort}</div>
          <div><strong>Vessel:</strong> ${s.vessel}</div>
          <div><strong>HS Tariff Code:</strong> <span class="code-pill">${s.hsCode}</span></div>
          <div><strong>AI Confidence:</strong> ${s.aiConfidence.toFixed(1)}%</div>
        </div>

        <h4 style="font-size: 0.9rem; font-weight:700; margin-bottom: 10px;">Single Entry Sync Traceability (Home RPA Orchestration)</h4>
        <div style="background: var(--bg-app); border: 1px solid var(--border-light); padding: 14px; border-radius: var(--radius-sm); font-size: 0.8rem; display: flex; flex-direction: column; gap: 8px;">
          <div><i class="fa-solid fa-brain" style="color: var(--primary-soft-blue);"></i> <strong>InCustoms (LayoutLM):</strong> ${s.syncFlow.inCustoms.confidence} extractions at ${s.syncFlow.inCustoms.time}</div>
          <div><i class="fa-solid fa-robot" style="color: var(--primary-soft-blue);"></i> <strong>Home RPA Layer:</strong> Status ${s.syncFlow.homeRPA.status} (${s.syncFlow.homeRPA.retries} retries)</div>
          <div><i class="fa-solid fa-ship" style="color: var(--primary-soft-blue);"></i> <strong>VPLUS Node:</strong> Ref ${s.syncFlow.vplus.refNo || 'N/A'} at ${s.syncFlow.vplus.time}</div>
          <div><i class="fa-solid fa-file-invoice-dollar" style="color: var(--primary-soft-blue);"></i> <strong>eVoucher Node:</strong> ${s.syncFlow.eVoucher.voucherNo || s.syncFlow.eVoucher.errorMsg || 'Synced'}</div>
          <div><i class="fa-solid fa-truck-fast" style="color: var(--primary-soft-blue);"></i> <strong>TMS Fleet Node:</strong> ${s.syncFlow.tms.fleetNo || s.syncFlow.tms.time}</div>
        </div>

        <div style="display:flex; justify-content:flex-end; gap: 10px; margin-top: 20px;">
          <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Close</button>
          ${s.aiConfidence < 80 ? `
            <button class="btn btn-primary" onclick="this.closest('.modal-overlay').remove(); window.hubApp.selectedJobForWorkbench='${s.id}'; window.hubApp.switchTab('workbench-pane');">
              <i class="fa-solid fa-wrench"></i> Fix in Exception Workbench
            </button>
          ` : ''}
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  showNotification(title, message, type = 'info') {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: white;
      border: 1px solid var(--border-light);
      border-left: 5px solid ${type === 'success' ? 'var(--status-success)' : (type === 'error' ? 'var(--status-error)' : 'var(--primary-soft-blue)')};
      border-radius: var(--radius-md);
      padding: 14px 18px;
      box-shadow: var(--shadow-lg);
      z-index: 2000;
      max-width: 380px;
      font-size: 0.85rem;
      animation: fadeIn 0.25s ease-in-out;
    `;
    toast.innerHTML = `
      <div style="font-weight: 700; color: var(--primary-navy); margin-bottom: 2px;">${title}</div>
      <div style="color: var(--text-dark);">${message}</div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.hubApp = new UnifiedLogisticsHubApp();
});

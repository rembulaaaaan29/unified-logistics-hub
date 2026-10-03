// Unified Logistics Hub - NIK SSO & 2-Channel MFA Failover Simulator

class MFASimulator {
  constructor() {
    this.currentChannel = 'whatsapp';
    this.state = 'idle'; // idle | waiting_otp | failover | authenticated
    this.otpCode = '892401';
    this.timerSeconds = 45;
    this.timerInterval = null;
    this.nikUser = {
      nik: '3174092801940003',
      name: 'remmoon',
      role: 'CS Specialist (Senior Lead)',
      email: 'remmoon@uniaircargo.co.id',
      phone: '+62 812-8890-4129'
    };
  }

  startAuthFlow() {
    this.currentChannel = 'whatsapp';
    this.state = 'waiting_otp';
    this.timerSeconds = 45;
    
    this.renderModal();
    this.startTimer();
  }

  simulateWhatsAppFailure() {
    if (this.state !== 'waiting_otp' || this.currentChannel !== 'whatsapp') return;

    clearInterval(this.timerInterval);
    this.state = 'failover';
    this.renderModal();

    // After 1.8 seconds of failover notice, switch to Email channel automatically
    setTimeout(() => {
      this.currentChannel = 'email';
      this.state = 'waiting_otp';
      this.timerSeconds = 60;
      this.renderModal();
      this.startTimer();
    }, 1800);
  }

  verifyOTP(inputOtp) {
    if (inputOtp === this.otpCode || inputOtp === '123456') {
      clearInterval(this.timerInterval);
      this.state = 'authenticated';
      this.renderModal();
      
      setTimeout(() => {
        this.closeModal();
        if (window.hubApp) {
          window.hubApp.showNotification('Success', 'NIK Single Sign-On authenticated successfully via ' + (this.currentChannel === 'email' ? 'Email Backup Channel' : 'WhatsApp Channel'), 'success');
        }
      }, 1200);
      return true;
    } else {
      const errEl = document.getElementById('mfa-error-msg');
      if (errEl) {
        errEl.innerText = 'Invalid OTP code. Please try entering "892401" or "123456".';
        errEl.style.display = 'block';
      }
      return false;
    }
  }

  startTimer() {
    clearInterval(this.timerInterval);
    const timerEl = document.getElementById('mfa-timer-count');
    this.timerInterval = setInterval(() => {
      this.timerSeconds--;
      if (timerEl) timerEl.innerText = `${this.timerSeconds}s`;

      if (this.timerSeconds <= 0) {
        clearInterval(this.timerInterval);
        if (this.currentChannel === 'whatsapp') {
          // Trigger automatic failover on timeout
          this.simulateWhatsAppFailure();
        }
      }
    }, 1000);
  }

  closeModal() {
    clearInterval(this.timerInterval);
    const modal = document.getElementById('mfa-modal-overlay');
    if (modal) modal.remove();
  }

  renderModal() {
    let modal = document.getElementById('mfa-modal-overlay');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'mfa-modal-overlay';
      modal.className = 'modal-overlay';
      document.body.appendChild(modal);
    }

    let contentHtml = '';

    if (this.state === 'failover') {
      contentHtml = `
        <div class="mfa-card failover-card">
          <div class="mfa-failover-banner">
            <i class="fa-solid fa-triangle-exclamation pulse-icon"></i>
            <div>
              <h3>WhatsApp Gateway Timeout (HTTP 503)</h3>
              <p>Primary MFA API failed to respond. Executing automatic seamless failover to secondary Email channel...</p>
            </div>
          </div>
          <div class="mfa-loading-spinner">
            <div class="spinner"></div>
            <span>Switching to Backup Channel: ${this.nikUser.email}</span>
          </div>
        </div>
      `;
    } else if (this.state === 'authenticated') {
      contentHtml = `
        <div class="mfa-card success-card">
          <div class="mfa-success-icon"><i class="fa-solid fa-circle-check"></i></div>
          <h2>Authentication Successful</h2>
          <p>UNO SSO Identity Verified: <strong>${this.nikUser.name}</strong> (${this.nikUser.nik})</p>
          <div class="mfa-role-tag"><i class="fa-solid fa-user-shield"></i> ${this.nikUser.role}</div>
        </div>
      `;
    } else {
      const isWA = this.currentChannel === 'whatsapp';
      contentHtml = `
        <div class="mfa-card">
          <button class="modal-close-btn" onclick="window.mfaSimulator.closeModal()"><i class="fa-solid fa-xmark"></i></button>

          <div class="mfa-header">
            <div class="uno-portal-logo">
              <i class="fa-solid fa-building-columns"></i>
              <span>UNO PORTAL SSO</span>
            </div>
            <h2>Multi-Factor Authentication</h2>
            <p>Verification required for NIK: <code>${this.nikUser.nik}</code></p>
          </div>

          <div class="mfa-channel-status ${isWA ? 'channel-wa' : 'channel-email'}">
            <i class="fa-brands ${isWA ? 'fa-whatsapp' : 'fa-envelope'}"></i>
            <div>
              <div class="channel-title">${isWA ? 'Primary Channel: WhatsApp OTP' : 'Secondary Channel: Email Backup OTP'}</div>
              <div class="channel-dest">${isWA ? 'Sent to ' + this.nikUser.phone : 'Sent to ' + this.nikUser.email}</div>
            </div>
            ${!isWA ? '<span class="failover-badge">AUTOMATIC FAILOVER ACTIVE</span>' : ''}
          </div>

          <div id="mfa-error-msg" class="mfa-error" style="display:none;"></div>

          <div class="otp-input-group">
            <label>Enter 6-Digit One-Time Password (OTP)</label>
            <div class="otp-boxes">
              <input type="text" id="otp-input" maxlength="6" placeholder="892401" value="892401" autofocus>
            </div>
            <p class="otp-demo-hint"><i class="fa-solid fa-lightbulb"></i> Demo OTP code is pre-filled: <strong>892401</strong></p>
          </div>

          <div class="mfa-actions">
            <button class="btn btn-primary btn-block" onclick="window.mfaSimulator.verifyOTP(document.getElementById('otp-input').value)">
              <i class="fa-solid fa-shield-check"></i> Verify & Access Unified Hub
            </button>
          </div>

          <div class="mfa-footer-info">
            <span>Code expires in: <strong id="mfa-timer-count">${this.timerSeconds}s</strong></span>
            ${isWA ? `
              <button class="btn-link-failover" onclick="window.mfaSimulator.simulateWhatsAppFailure()">
                <i class="fa-solid fa-bolt"></i> Simulate WhatsApp API Failure (Test Failover)
              </button>
            ` : '<span>Secondary channel enforced by UNO SSO policy.</span>'}
          </div>
        </div>
      `;
    }

    modal.innerHTML = contentHtml;
  }
}

window.MFASimulator = MFASimulator;
window.mfaSimulator = new MFASimulator();

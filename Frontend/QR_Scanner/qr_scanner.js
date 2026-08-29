// Robust Dropdown Toggle Controls
    document.addEventListener('DOMContentLoaded', () => {
      const menuToggleBtn = document.getElementById('menuToggleBtn');
      const menuDropdownContent = document.getElementById('menuDropdownContent');
      if (!menuToggleBtn || !menuDropdownContent) return;

      // Toggle menu on direct button click/tap
      menuToggleBtn.addEventListener('click', (event) => {
        event.stopPropagation(); // Stop window from instantly running the close code
        menuDropdownContent.classList.toggle('show');
      });

      // Automatically close menu if clicking anywhere outside of it
      window.addEventListener('click', (event) => {
        if (!menuDropdownContent.contains(event.target) && event.target !== menuToggleBtn) {
          menuDropdownContent.classList.remove('show');
        }
      });
    });

    // Scanner Functionality Closure
    (function() {
      function accountName(account) {
        return [account.first_name || account.firstName, account.middle_initial || account.middleName, account.last_name || account.lastName]
          .filter(Boolean)
          .join(' ') || account.name || account.username || account.serial_number || 'Unknown Account';
      }

      async function saveScanToBackend(qrText) {
        const response = await fetch('http://localhost:3000/api/attendance/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ qrText })
        });
        let data = {};
        try { data = await response.json(); } catch (error) {}
        if (!response.ok) {
          throw new Error(data.message || 'Attendance scan failed');
        }
        return data;
      }

      let html5QrCode = null;
      let scannerActive = false;
      let lastScannedEmployee = null;
      let scanBusy = false;
      let scanCount = 0;

      const readerDiv = document.getElementById('reader');
      const scanFeedback = document.getElementById('scanFeedback');
      const stopScannerBtn = document.getElementById('stopScannerBtn');
      const restartScannerBtn = document.getElementById('restartScannerBtn');
      const lastScanDisplay = document.getElementById('lastScanDisplay');
      const lastScanText = document.getElementById('lastScanText');
      const scanToast = document.getElementById('scanToast');

      async function processScannedData(qrText) {
        if(scanBusy) return false;
        scanBusy = true;
        try {
          const result = await saveScanToBackend(qrText);
          const employee = result.account || {};
          const nextAction = result.action || result.log?.type || result.log?.log_type || 'IN';
          const accountType = employee.account_type || employee.accountType || 'User';
          const actionText = nextAction === 'IN' ? 'TIME IN' : 'TIME OUT';
          const time = new Date(result.log?.timestamp || Date.now()).toLocaleTimeString();
          const name = accountName(employee);
          scanCount++;
          const message = name + ' (' + accountType + ') ' + (nextAction === 'IN' ? 'timed in' : 'timed out') + ' at ' + time;
          showFeedback(message, false);
          showToast(message, false);
          lastScannedEmployee = employee;
          lastScanDisplay.style.display = 'block';
          lastScanText.innerHTML = 'Last scan: <strong>' + name + '</strong> (' + accountType + ') - ' + actionText + ' at ' + time;
          return true;
        } catch (error) {
          showFeedback('Scan failed: ' + error.message, true);
          showToast('Scan failed: ' + error.message, true);
          return false;
        } finally {
          setTimeout(() => { scanBusy = false; }, 1800);
        }
      }

      function showToast(message, isError = false){
        if(!scanToast) return;
        scanToast.textContent = message;
        scanToast.className = 'scan-toast show' + (isError ? ' error' : '');
        clearTimeout(showToast.timer);
        showToast.timer = setTimeout(() => {
          scanToast.className = 'scan-toast' + (isError ? ' error' : '');
        }, 4200);
      }

      function showFeedback(message, isError = false) {
        scanFeedback.style.display = 'block';
        scanFeedback.textContent = message;
        scanFeedback.className = 'log-feedback' + (isError ? ' error' : ' info');
        
        setTimeout(() => {
          if (scanFeedback.textContent === message) {
            scanFeedback.style.display = 'none';
          }
        }, 4000);
      }

      function startCameraScanner() {
        if (html5QrCode === null) {
          html5QrCode = new Html5Qrcode("reader");
        } else {
          if (scannerActive) {
            html5QrCode.stop().then(() => {
              scannerActive = false;
              initCamera();
            }).catch(() => {
              initCamera();
            });
            return;
          }
        }
        initCamera();
      }

      function initCamera() {
        const boxSize = Math.min(360, Math.max(260, Math.floor((readerDiv?.clientWidth || 360) * 0.72)));
        const config = {
          fps: 15,
          qrbox: { width: boxSize, height: boxSize },
          aspectRatio: 1.0,
          disableFlip: false,
          videoConstraints: {
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        };

        html5QrCode.start(
          { facingMode: "environment" },
          config,
          (decodedText) => {
            processScannedData(decodedText).catch(() => {});
          },
          (errorMessage) => {}
        ).then(() => {
          scannerActive = true;
          stopScannerBtn.style.display = 'flex';
          restartScannerBtn.style.display = 'none';
          const readerElement = document.getElementById('reader');
          if (readerElement) {
            readerElement.style.minHeight = '300px';
          }
        }).catch(err => {
          console.warn("Camera start error:", err);
          showFeedback("Camera access denied or not available. Please check your browser permissions.", true);
          scannerActive = false;
          stopScannerBtn.style.display = 'none';
          restartScannerBtn.style.display = 'flex';
          
          const readerElement = document.getElementById('reader');
          if (readerElement) {
            readerElement.innerHTML = '<p style="color: white; text-align: center; padding: 2rem;">Camera unavailable<br>Check browser permissions</p>';
          }
        });
      }

      function stopCameraScanner() {
        if (html5QrCode && scannerActive) {
          html5QrCode.stop().then(() => {
            scannerActive = false;
            stopScannerBtn.style.display = 'none';
            restartScannerBtn.style.display = 'flex';
            
            const readerElement = document.getElementById('reader');
            if (readerElement) {
              readerElement.innerHTML = '<p style="color: white; text-align: center; padding: 2rem;">Camera stopped</p>';
            }
          }).catch(err => {
            console.warn("Stop error", err);
            scannerActive = false;
            stopScannerBtn.style.display = 'none';
            restartScannerBtn.style.display = 'flex';
          });
        }
      }

      function restartCameraScanner() {
        const readerElement = document.getElementById('reader');
        if (readerElement) {
          readerElement.innerHTML = '<p style="color: white; text-align: center; padding: 2rem;">ðŸ“¸ Starting camera...</p>';
        }
        startCameraScanner();
      }

      stopScannerBtn.addEventListener('click', stopCameraScanner);
      restartScannerBtn.addEventListener('click', restartCameraScanner);

      window.addEventListener('load', () => {
        setTimeout(() => {
          startCameraScanner();
        }, 300);
      });

      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && !scannerActive) {
          setTimeout(() => {
            if (!scannerActive) {
              restartCameraScanner();
            }
          }, 500);
        }
      });

      window.addEventListener('beforeunload', () => {
        if (html5QrCode && scannerActive) {
          html5QrCode.stop().catch(e => {});
        }
      });

    })();

    /* --- REAL TIME CLOCK --- */
    function updateDateTime() {
      const now = new Date();

      const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      };

      const date = now.toLocaleDateString('en-US', options);

      const time = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      const dateTimeDisplay = document.getElementById('dateTimeDisplay');
      if (dateTimeDisplay) {
        dateTimeDisplay.textContent = `${date} | ${time}`;
      }
    }

    /* Update every second */
    setInterval(updateDateTime, 1000);
    updateDateTime();
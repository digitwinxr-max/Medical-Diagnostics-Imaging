/**
 * GERALD HOLDINGS MEDICAL DIAGNOSTIC IMAGING – CORE INTERACTIVE ENGINE
 * Apple, Siemens Healthineers & Mayo Clinic inspired interactive experience
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initDarkMode();
  initModals();
  initScrollReveal();
  initAnatomyExplorer();
  initTechShowcase();
  initComparisonSliders();
  initDicomViewer();
  initPatientChat();
});

/* ==========================================================================
   1. NAVIGATION & DARK MODE
   ========================================================================== */
function initNavbar() {
  const navbar = document.getElementById('navbar');
  const mobileBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');

  if (navbar) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 40) {
        navbar.classList.add('shadow-2xl', 'border-b', 'border-white/20');
        navbar.style.background = 'rgba(10, 61, 92, 0.95)';
        if (document.documentElement.classList.contains('dark')) {
          navbar.style.background = 'rgba(6, 32, 47, 0.95)';
        }
      } else {
        navbar.classList.remove('shadow-2xl');
        navbar.style.background = 'rgba(10, 61, 92, 0.82)';
      }
    });
  }

  if (mobileBtn && mobileMenu) {
    mobileBtn.setAttribute('aria-label', 'Open navigation menu');
    mobileBtn.setAttribute('aria-controls', 'mobile-menu');
    mobileBtn.setAttribute('aria-expanded', 'false');
    const closeMobileMenu = () => {
      mobileMenu.classList.add('hidden');
      mobileBtn.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('nav-open');
    };
    mobileBtn.addEventListener('click', () => {
      const opening = mobileMenu.classList.contains('hidden');
      mobileMenu.classList.toggle('hidden');
      mobileBtn.setAttribute('aria-expanded', String(opening));
      document.body.classList.toggle('nav-open', opening);
    });
    mobileMenu.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMobileMenu));
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !mobileMenu.classList.contains('hidden')) {
        closeMobileMenu();
        mobileBtn.focus();
      }
    });
  }

  // Language Selector Binding
  const langSelects = document.querySelectorAll('.lang-selector-input');
  langSelects.forEach(select => {
    select.addEventListener('change', (e) => {
      if (typeof applyLanguage === 'function') {
        applyLanguage(e.target.value);
      }
    });
  });
}

function initDarkMode() {
  const darkToggleBtn = document.getElementById('dark-mode-toggle');
  const html = document.documentElement;
  
  // Check localStorage or system preference
  const savedTheme = localStorage.getItem('gerald_theme');
  if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    html.classList.add('dark');
  } else {
    html.classList.remove('dark');
  }

  if (darkToggleBtn) {
    darkToggleBtn.addEventListener('click', () => {
      html.classList.toggle('dark');
      const isDark = html.classList.contains('dark');
      localStorage.setItem('gerald_theme', isDark ? 'dark' : 'light');
      
      // Update toggle icon
      const iconSpan = darkToggleBtn.querySelector('.theme-icon');
      if (iconSpan) {
        iconSpan.innerHTML = isDark ? '☀️' : '🌙';
      }
    });
  }
}

/* ==========================================================================
   2. MODAL MANAGERS (APPOINTMENT, EMERGENCY, SEARCH, LOGIN)
   ========================================================================== */
function initModals() {
  const modalMap = {
    'btn-open-book': 'modal-appointment',
    'btn-open-emergency': 'modal-emergency',
    'btn-open-search': 'modal-search',
    'btn-open-login': 'modal-login',
    'btn-open-doc-login': 'modal-doc-login'
  };

  Object.entries(modalMap).forEach(([triggerClass, modalId]) => {
    document.querySelectorAll(`.${triggerClass}`).forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const modal = document.getElementById(modalId);
        if (modal) {
          modal.classList.remove('hidden');
          modal.classList.add('flex');
          document.body.style.overflow = 'hidden';
        }
      });
    });
  });

  // Close bindings
  document.querySelectorAll('.btn-close-modal').forEach(btn => {
    btn.addEventListener('click', () => {
      const modal = btn.closest('.modal-backdrop');
      if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        document.body.style.overflow = 'auto';
      }
    });
  });

  // Click outside to close
  document.querySelectorAll('.modal-backdrop').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        document.body.style.overflow = 'auto';
      }
    });
  });

  // Simulated Appointment Form submission
  const apptForm = document.getElementById('form-appointment-submit');
  if (apptForm && !apptForm.matches('[data-gerald-form]')) {
    apptForm.addEventListener('submit', (e) => {
      e.preventDefault();
      alert("✅ APPOINTMENT REQUEST CONFIRMED!\n\nThank you for choosing Gerald Holdings. A digital booking confirmation and preparation instructions have been dispatched via SMS & Email. Our triage reception team will call you within 15 minutes.");
      const modal = document.getElementById('modal-appointment');
      if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        document.body.style.overflow = 'auto';
      }
    });
  }
}

/* ==========================================================================
   3. ANIMATED COUNTERS & SCROLL REVEAL
   ========================================================================== */
function initScrollReveal() {
  const reveals = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('opacity-100', 'translate-y-0');
        entry.target.classList.remove('opacity-0', 'translate-y-8');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  reveals.forEach(r => {
    r.classList.add('transition-all', 'duration-700', 'ease-out', 'opacity-0', 'translate-y-8');
    observer.observe(r);
  });
}

/* ==========================================================================
   4. INTERACTIVE ANATOMY EXPLORER
   ========================================================================== */
function initAnatomyExplorer() {
  const anatomyData = {
    brain: {
      title: "Brain & Neuroimaging (3T MRI & Multislice CT)",
      modality: "3T MAGNETOM Vida MRI / 128-Slice CT Angiography",
      prep: "Remove all metallic objects, jewelry, and hearing aids. Fasting for 4 hours required if gadolinium contrast is indicated.",
      procedure: "Non-invasive sub-millimeter axial, coronal, and sagittal imaging to visualize brain parenchyma, cranial nerves, vascular aneurysms, and acute ischemic stroke events.",
      duration: "20 - 35 Minutes",
      accuracy: "Protocol-led Neurovascular Review"
    },
    chest: {
      title: "Thoracic & Pulmonary Imaging",
      modality: "128-Slice SOMATOM CT / High-Resolution Digital X-Ray",
      prep: "No special fasting required unless IV iodinated contrast is ordered for pulmonary embolism or thoracic aortic dissection protocols.",
      procedure: "Rapid breath-hold helical scan capturing volumetric sub-millimeter slices of pulmonary parenchyma, bronchial tree, and mediastinal lymph nodes.",
      duration: "5 - 10 Minutes",
      accuracy: "Ultra-Low Dose CARE Dose4D Active"
    },
    spine: {
      title: "Spinal Cord & Musculoskeletal Spine",
      modality: "3T High-Field MRI (Cervical, Thoracic, Lumbar)",
      prep: "Inform technologist of any surgical spinal implants, pacemakers, or severe claustrophobia. Dedicated acoustic noise reduction enabled.",
      procedure: "High-contrast multi-planar evaluation of intervertebral discs, nerve root compression, spinal stenosis, and vertebral bone marrow edema.",
      duration: "25 - 40 Minutes",
      accuracy: "Sub-millimeter Neural Root Visualization"
    },
    heart: {
      title: "Cardiac MRI & Coronary CT Angiography",
      modality: "128-Slice Cardiac CT / 3T Cardiovascular MRI",
      prep: "Avoid caffeine for 12 hours prior. Beta-blockers may be administered by our clinical nurse to optimize resting heart rate below 65 BPM.",
      procedure: "ECG-gated volumetric scan visualizing coronary artery calcium scoring, luminal stenosis, myocardial infarction scar tissue, and valvular function.",
      duration: "15 - 30 Minutes",
      accuracy: "99.5% Negative Predictive Value for CAD"
    },
    abdomen: {
      title: "Abdominal & Hepatobiliary Imaging",
      modality: "Multi-Phase CT / 4D Ultrasound / Abdominal MRI",
      prep: "Fasting for 6 hours required. Oral barium or water contrast may be administered 45 minutes prior to scan to distend bowel loops.",
      procedure: "Dynamic multi-phase arterial and portal venous imaging of liver, kidneys, pancreas, spleen, and adrenal glands for oncologic staging.",
      duration: "15 - 25 Minutes",
      accuracy: "Lesion Characterization Active"
    },
    pelvis: {
      title: "Pelvic, Prostate & Gynecological Imaging",
      modality: "Multiparametric 3T MRI / Endocavitary 4D Ultrasound",
      prep: "Full bladder required for pelvic ultrasound. For prostate mpMRI, light bowel prep is recommended for optimal diffusion-weighted imaging.",
      procedure: "High-resolution staging of prostate parenchyma (PI-RADS protocol), uterine fibroids, ovarian pathology, and colorectal evaluation.",
      duration: "25 - 35 Minutes",
      accuracy: "Multiparametric PI-RADS Compliance"
    },
    breast: {
      title: "3D Tomosynthesis Mammography & Breast MRI",
      modality: "MAMMOMAT Revelation 3D Tomosynthesis / High-Resolution Ultrasound",
      prep: "Do not apply deodorants, antiperspirants, powders, or lotions to breast or axillary areas on the day of examination.",
      procedure: "50-degree wide-angle 3D tomosynthesis capturing thin slices through breast tissue to eliminate tissue overlap and detect early microcalcifications.",
      duration: "15 - 20 Minutes",
      accuracy: "41% Increase in Invasive Cancer Detection"
    },
    knee: {
      title: "Orthopedic Joint & Musculoskeletal Imaging",
      modality: "3T Dedicated MSK MRI / Digital Orthopedic X-Ray",
      prep: "No preparation required. Comfortable positioning with dedicated multi-channel extremity coils.",
      procedure: "High-resolution evaluation of anterior cruciate ligament (ACL), meniscal tears, articular cartilage wear, and occult trabecular bone fractures.",
      duration: "20 - 30 Minutes",
      accuracy: "0.4mm Cartilage Resolution"
    }
  };

  const buttons = document.querySelectorAll('.anatomy-btn');
  const displayCard = document.getElementById('anatomy-display-card');

  if (!buttons.length || !displayCard) return;

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('bg-accent-cyan', 'text-primary-navy', 'font-bold', 'shadow-lg'));
      btn.classList.add('bg-accent-cyan', 'text-primary-navy', 'font-bold', 'shadow-lg');

      const target = btn.getAttribute('data-part');
      const data = anatomyData[target] || anatomyData['brain'];

      displayCard.innerHTML = `
        <div class="p-6 md:p-8 bg-primary-navy/90 text-white rounded-2xl border border-accent-cyan/40 shadow-2xl transition-all duration-300">
          <div class="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
            <h4 class="text-2xl font-800 font-manrope text-accent-cyan">${data.title}</h4>
            <span class="px-3 py-1 bg-accent-cyan/20 text-accent-cyan rounded-full text-xs font-700 tracking-wider uppercase border border-accent-cyan/40">Clinical Specification</span>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p class="text-xs font-700 text-gray-400 uppercase tracking-wider mb-1">Recommended Modality</p>
              <p class="text-base font-600 text-white mb-4">${data.modality}</p>
              
              <p class="text-xs font-700 text-gray-400 uppercase tracking-wider mb-1">Patient Preparation</p>
              <p class="text-sm text-gray-200 mb-4 bg-white/5 p-3 rounded-xl border border-white/10">${data.prep}</p>
            </div>
            <div>
              <p class="text-xs font-700 text-gray-400 uppercase tracking-wider mb-1">Clinical Procedure & Protocol</p>
              <p class="text-sm text-gray-200 mb-4">${data.procedure}</p>
              
              <div class="flex items-center justify-between bg-black/30 p-3 rounded-xl border border-white/10">
                <div>
                  <span class="block text-xs text-gray-400 font-600">Scan Duration</span>
                  <span class="text-sm font-700 text-accent-cyan">${data.duration}</span>
                </div>
                <div>
                  <span class="block text-xs text-gray-400 font-600">Advanced Diagnostic Standard</span>
                  <span class="text-sm font-700 text-green-400">${data.accuracy}</span>
                </div>
              </div>
            </div>
          </div>
          <div class="mt-6 pt-4 border-t border-white/10 flex justify-end">
            <a href="contact.html" class="inline-flex items-center gap-2 bg-accent-cyan text-primary-navy font-700 px-6 py-2.5 rounded-xl hover:bg-white transition-all shadow-lg text-sm">
              <span>Book This Scan Now</span>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
            </a>
          </div>
        </div>
      `;
    });
  });
}

/* ==========================================================================
   5. INTERACTIVE TECHNOLOGY SHOWCASE TABS
   ========================================================================== */
function initTechShowcase() {
  const tabs = document.querySelectorAll('.tech-tab-btn');
  const panels = document.querySelectorAll('.tech-panel-content');

  if (!tabs.length) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetId = tab.getAttribute('data-tech');
      
      tabs.forEach(t => t.classList.remove('bg-primary-navy', 'text-white', 'border-accent-cyan', 'shadow-lg'));
      tab.classList.add('bg-primary-navy', 'text-white', 'border-accent-cyan', 'shadow-lg');

      panels.forEach(p => {
        if (p.id === `tech-panel-${targetId}`) {
          p.classList.remove('hidden');
          p.classList.add('block', 'animate-fade-in');
        } else {
          p.classList.add('hidden');
          p.classList.remove('block');
        }
      });
    });
  });
}

/* ==========================================================================
   6. BEFORE / AFTER COMPARISON SLIDERS
   ========================================================================== */
function initComparisonSliders() {
  const containers = document.querySelectorAll('.img-comp-container');
  
  containers.forEach(container => {
    const overlay = container.querySelector('.img-comp-overlay');
    const handle = container.querySelector('.img-comp-handle');
    if (!overlay || !handle) return;

    let isDown = false;

    const slide = (x) => {
      const rect = container.getBoundingClientRect();
      let pos = ((x - rect.left) / rect.width) * 100;
      if (pos < 5) pos = 5;
      if (pos > 95) pos = 95;
      overlay.style.width = pos + "%";
      handle.style.left = pos + "%";
    };

    handle.addEventListener('mousedown', () => { isDown = true; });
    window.addEventListener('mouseup', () => { isDown = false; });
    window.addEventListener('mousemove', (e) => { if (isDown) slide(e.clientX); });

    // Touch support
    handle.addEventListener('touchstart', () => { isDown = true; }, { passive: true });
    window.addEventListener('touchend', () => { isDown = false; });
    window.addEventListener('touchmove', (e) => {
      if (isDown && e.touches[0]) slide(e.touches[0].clientX);
    }, { passive: true });
  });
}

/* ==========================================================================
   7. DICOM PACS VIEWER SIMULATION
   ========================================================================== */
function initDicomViewer() {
  const canvas = document.getElementById('dicom-sim-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let brightness = 100;
  let contrast = 100;
  let zoom = 1.0;
  let currentCase = 'brain';
  let reviewOverlayActive = false;

  const drawScan = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    
    // Apply transformations
    ctx.translate(canvas.width/2, canvas.height/2);
    ctx.scale(zoom, zoom);
    ctx.translate(-canvas.width/2, -canvas.height/2);

    // Apply color filter
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;

    // Draw simulated medical background
    ctx.fillStyle = '#050D1A';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw diagnostic anatomy shape based on current case
    ctx.strokeStyle = '#38B4E8';
    ctx.lineWidth = 2;
    ctx.fillStyle = 'rgba(56, 180, 232, 0.12)';

    if (currentCase === 'brain') {
      // Skull ring
      ctx.beginPath();
      ctx.arc(200, 200, 140, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fill();
      
      // Ventricles simulation
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.beginPath();
      ctx.ellipse(180, 190, 20, 45, -0.2, 0, Math.PI * 2);
      ctx.ellipse(220, 190, 20, 45, 0.2, 0, Math.PI * 2);
      ctx.fill();

      // Gyri details
      ctx.strokeStyle = 'rgba(56, 180, 232, 0.35)';
      for (let i = 80; i < 320; i += 25) {
        ctx.beginPath();
        ctx.arc(200, 200, Math.abs(i - 200) * 0.7 + 30, 0, Math.PI);
        ctx.stroke();
      }

      if (reviewOverlayActive) {
        // Review marker bounding box
        ctx.strokeStyle = '#FF3B30';
        ctx.lineWidth = 2;
        ctx.strokeRect(240, 150, 40, 40);
        ctx.fillStyle = 'rgba(255, 59, 48, 0.2)';
        ctx.fillRect(240, 150, 40, 40);
        ctx.fillStyle = '#FF3B30';
        ctx.font = '11px monospace';
        ctx.fillText('REVIEW MARKER: BENIGN CYST (99.4%)', 180, 140);
      }
    } else if (currentCase === 'chest') {
      // Thoracic cage
      ctx.beginPath();
      ctx.ellipse(200, 200, 150, 120, 0, 0, Math.PI * 2);
      ctx.stroke();
      
      // Lungs
      ctx.fillStyle = 'rgba(56, 180, 232, 0.08)';
      ctx.beginPath();
      ctx.ellipse(140, 200, 45, 80, -0.1, 0, Math.PI * 2);
      ctx.ellipse(260, 200, 45, 80, 0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Heart
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.beginPath();
      ctx.arc(210, 220, 35, 0, Math.PI * 2);
      ctx.fill();

      if (reviewOverlayActive) {
        ctx.strokeStyle = '#81A54D';
        ctx.lineWidth = 2;
        ctx.strokeRect(190, 200, 40, 40);
        ctx.fillStyle = '#81A54D';
        ctx.font = '11px monospace';
        ctx.fillText('COMPUTER-AIDED REVIEW: NORMAL CORONARY CALCIUM SCORE = 0', 100, 120);
      }
    } else {
      // Spine / Joint generic representation
      ctx.beginPath();
      for (let y = 60; y < 340; y += 40) {
        ctx.rect(170, y, 60, 28);
      }
      ctx.stroke();
      ctx.fillStyle = 'rgba(56, 180, 232, 0.2)';
      ctx.fill();
    }

    ctx.restore();

    // Draw HUD text overlays (unfiltered)
    ctx.filter = 'none';
    ctx.fillStyle = '#38B4E8';
    ctx.font = '11px monospace';
    ctx.fillText(`GERALD HOLDINGS PACS | CASE: ${currentCase.toUpperCase()}`, 15, 25);
    ctx.fillText(`ZOOM: ${(zoom * 100).toFixed(0)}% | WL: ${brightness} / WW: ${contrast}`, 15, canvas.height - 15);
    ctx.fillText(`SERIES: 4 / SLICE: 18 of 128 | DIGITAL QA: ACTIVE`, canvas.width - 240, 25);
    ctx.fillText(`MODALITY: 3T MAGNETOM VIDA`, canvas.width - 190, canvas.height - 15);
  };

  drawScan();

  // Control bindings
  document.getElementById('dicom-btn-review')?.addEventListener('click', (e) => {
    reviewOverlayActive = !reviewOverlayActive;
    e.target.classList.toggle('active', reviewOverlayActive);
    e.target.classList.toggle('bg-accent-cyan', reviewOverlayActive);
    e.target.classList.toggle('text-primary-navy', reviewOverlayActive);
    drawScan();
  });

  document.getElementById('dicom-btn-zoom-in')?.addEventListener('click', () => {
    zoom = Math.min(2.5, zoom + 0.2);
    drawScan();
  });

  document.getElementById('dicom-btn-zoom-out')?.addEventListener('click', () => {
    zoom = Math.max(0.6, zoom - 0.2);
    drawScan();
  });

  document.getElementById('dicom-btn-reset')?.addEventListener('click', () => {
    brightness = 100;
    contrast = 100;
    zoom = 1.0;
    reviewOverlayActive = false;
    drawScan();
  });

  // Case selector tabs
  document.querySelectorAll('.dicom-case-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.dicom-case-btn').forEach(b => b.classList.remove('bg-accent-cyan', 'text-primary-navy', 'font-bold'));
      btn.classList.add('bg-accent-cyan', 'text-primary-navy', 'font-bold');
      currentCase = btn.getAttribute('data-case');
      drawScan();
    });
  });

  // Interactive mouse drag for Window/Level simulation
  let isDragging = false;
  let lastX = 0, lastY = 0;
  canvas.addEventListener('mousedown', (e) => { isDragging = true; lastX = e.clientX; lastY = e.clientY; });
  window.addEventListener('mouseup', () => { isDragging = false; });
  canvas.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    brightness = Math.max(30, Math.min(200, brightness + dx * 0.5));
    contrast = Math.max(30, Math.min(200, contrast - dy * 0.5));
    lastX = e.clientX;
    lastY = e.clientY;
    drawScan();
  });
}

/* ==========================================================================
   9. PATIENT SUPPORT CHAT SIMULATION
   ========================================================================== */
function initPatientChat() {
  const chatToggle = document.getElementById('patient-chat-toggle');
  const chatPanel = document.getElementById('patient-chat-panel');
  const chatClose = document.getElementById('patient-chat-close');
  const chatInput = document.getElementById('patient-chat-input');
  const chatSend = document.getElementById('patient-chat-send');
  const chatMessages = document.getElementById('patient-chat-messages');

  if (!chatToggle || !chatPanel) return;

  chatToggle.addEventListener('click', () => {
    chatPanel.classList.toggle('hidden');
    chatPanel.classList.toggle('flex');
  });

  if (chatClose) {
    chatClose.addEventListener('click', () => {
      chatPanel.classList.add('hidden');
      chatPanel.classList.remove('flex');
    });
  }

  const sendReply = () => {
    const text = chatInput.value.trim();
    if (!text) return;

    // Add user message
    const userDiv = document.createElement('div');
    userDiv.className = 'flex justify-end mb-3';
    userDiv.innerHTML = `<div class="bg-primary-navy text-white px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm max-w-[80%] shadow-md">${text}</div>`;
    chatMessages.appendChild(userDiv);
    chatInput.value = '';
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Simulate support response
    setTimeout(() => {
      const aiDiv = document.createElement('div');
      aiDiv.className = 'flex justify-start mb-3';
      let reply = "I am Gerald Holdings' Digital Patient Assistant. Our 3T MRI & 128-Slice CT imaging centre in Gaborone is open 7 days a week with 24/7 emergency cover. Would you like me to connect you with our main office at (+267) 311 5757?";
      
      if (text.toLowerCase().includes('price') || text.toLowerCase().includes('cost') || text.toLowerCase().includes('insurance')) {
        reply = "We accept all major Botswana medical aid schemes including BOMAID, PULA, BPOMAS, and Botshealth, as well as international insurance. For specific tariff quotations, please share your doctor's referral code or call our billing team directly.";
      } else if (text.toLowerCase().includes('mri') || text.toLowerCase().includes('prep') || text.toLowerCase().includes('fasting')) {
        reply = "For standard 3T MRI examinations, no fasting is usually required unless contrast (Gadolinium) or MRCP is ordered. Please ensure all metallic jewelry, watches, and hair clips are removed prior to scanning.";
      } else if (text.toLowerCase().includes('location') || text.toLowerCase().includes('where') || text.toLowerCase().includes('gaborone')) {
        reply = "Our flagship headquarters is located at Unit 20/23, KB Mall, G-West Industrial, Gaborone, Botswana. We also support satellite hospitals nationwide via our 24/7 Teleradiology network.";
      }

      aiDiv.innerHTML = `<div class="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 px-4 py-2.5 rounded-2xl rounded-tl-sm text-sm max-w-[85%] border border-gh-blue/40 shadow-md">
        <div class="text-[10px] font-bold text-gh-blue-hover dark:text-gh-blue-bright mb-1 flex items-center gap-1">
          <span class="w-2 h-2 rounded-full bg-gh-green animate-pulse"></span> GERALD PATIENT SUPPORT
        </div>
        ${reply}
      </div>`;
      chatMessages.appendChild(aiDiv);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 800);
  };

  if (chatSend) chatSend.addEventListener('click', sendReply);
  if (chatInput) {
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendReply();
    });
  }
}

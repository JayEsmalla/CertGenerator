/**
 * CertStudio - Dynamic Certificate Customizer Engine
 * Generalized Architectures
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- DOM Elements - Content Inputs ---
  const inputName = document.getElementById('inputName');
  const nameFont = document.getElementById('nameFont');
  
  const inputSchoolName = document.getElementById('inputSchoolName');
  const inputOrgName = document.getElementById('inputOrgName');
  const inputCertTitle = document.getElementById('inputCertTitle');
  const inputCertSubtitle = document.getElementById('inputCertSubtitle');
  const inputBodyPrimary = document.getElementById('inputBodyPrimary');
  const inputBodySecondary = document.getElementById('inputBodySecondary');

  // --- DOM Elements - Signatures & Dates ---
  const toggleManualDate = document.getElementById('toggleManualDate');
  const autoDateGroup = document.getElementById('autoDateGroup');
  const manualDateGroup = document.getElementById('manualDateGroup');
  const inputDate = document.getElementById('inputDate');
  const inputManualDate = document.getElementById('inputManualDate');
  const inputDateIssued = document.getElementById('inputDateIssued');
  const inputLocation = document.getElementById('inputLocation');
  
  const inputCaptain = document.getElementById('inputCaptain');
  const inputCaptainTitle = document.getElementById('inputCaptainTitle');
  const inputNurse = document.getElementById('inputNurse');
  const inputNurseTitle = document.getElementById('inputNurseTitle');
  const inputCapSigFile = document.getElementById('inputCapSigFile');
  const btnClearCapSig = document.getElementById('btnClearCapSig');
  const inputNurseSigFile = document.getElementById('inputNurseSigFile');
  const btnClearNurseSig = document.getElementById('btnClearNurseSig');

  // --- DOM Elements - Aesthetics ---
  const inputLogoFile = document.getElementById('inputLogoFile');
  const btnRestoreLogo = document.getElementById('btnRestoreLogo');
  const pickerPrimary = document.getElementById('pickerPrimary');
  const pickerSecondary = document.getElementById('pickerSecondary');
  const pickerText = document.getElementById('pickerText');
  const bgTexture = document.getElementById('bgTexture');
  const borderStyle = document.getElementById('borderStyle');
  
  const toggleAIAdapt = document.getElementById('toggleAIAdapt');
  const toggleLogoWatermark = document.getElementById('toggleLogoWatermark');
  const toggleECGWatermark = document.getElementById('toggleECGWatermark');
  const toggleCrestWatermark = document.getElementById('toggleCrestWatermark');
  const toggleBorderDecoration = document.getElementById('toggleBorderDecoration');

  // --- DOM Elements - Previews ---
  const certificatePaper = document.getElementById('certificatePaper');
  const previewName = document.getElementById('previewName');
  const previewSchoolName = document.getElementById('previewSchoolName');
  const previewOrgName = document.getElementById('previewOrgName');
  const previewCertTitle = document.getElementById('previewCertTitle');
  const previewCertSubtitle = document.getElementById('previewCertSubtitle');
  const previewBodyPrimary = document.getElementById('previewBodyPrimary');
  const previewBodySecondary = document.getElementById('previewBodySecondary');
  
  const previewDateSentence = document.getElementById('previewDateSentence');
  const previewDateIssued = document.getElementById('previewDateIssued');
  const previewLocation = document.getElementById('previewLocation');
  
  const previewCaptain = document.getElementById('previewCaptain');
  const previewCaptainTitle = document.getElementById('previewCaptainTitle');
  const previewNurse = document.getElementById('previewNurse');
  const previewNurseTitle = document.getElementById('previewNurseTitle');
  
  const capSigInk = document.getElementById('capSigInk');
  const nurseSigInk = document.getElementById('nurseSigInk');
  const previewCapSigImg = document.getElementById('previewCapSigImg');
  const previewNurseSigImg = document.getElementById('previewNurseSigImg');
  
  const previewHeaderLogo = document.getElementById('previewHeaderLogo');
  const previewWatermarkLogo = document.getElementById('previewWatermarkLogo');
  const sidebarLogoPreview = document.getElementById('sidebarLogoPreview');
  
  const logoWatermarkWrapper = document.getElementById('logoWatermarkWrapper');
  const ecgWatermarkSVG = document.getElementById('ecgWatermarkSVG');
  const crestWatermarkSVG = document.getElementById('crestWatermarkSVG');
  const cornerOrnaments = document.getElementById('cornerOrnaments');

  // --- Controls Chrome ---
  const btnPrint = document.getElementById('btnPrint');
  const btnReset = document.getElementById('btnReset');
  const btnThemeToggle = document.getElementById('btnThemeToggle');
  const themeToggleText = document.getElementById('themeToggleText');
  const themeIcon = document.getElementById('themeIcon');
  const controlSidebar = document.getElementById('controlSidebar');
  const sidebarToggle = document.getElementById('sidebarToggle');

  // Variables
  let currentLogoSrc = 'logo.png';
  let currentCapSigSrc = '';
  let currentNurseSigSrc = '';

  // Default values for resetting
  const DEFAULTS = {
    name: "Juan Dela Cruz",
    font: "font-pinyon",
    schoolName: "School Medic & Health Academy",
    orgName: "School Medic Organization",
    certTitle: "Certificate of Participation",
    certSubtitle: "This certificate is proudly presented to",
    bodyPrimary: "for actively participating as a member of the {orgName} during the Academic Year 2022–2023.",
    bodySecondary: "This is given in recognition of their dedication, service, and willingness to promote the values and goals of {orgName} within the {schoolName} community.",
    manualDate: false,
    date: "2023-04-28",
    manualDateText: "Given this 28th day of April, 2023 at {schoolName}",
    dateIssued: "April 28, 2023",
    location: "Quezon Avenue, Barangay Sto. Niño, Davao City, Philippines",
    captain: "Jay F. Esmalla",
    captainTitle: "Organization Captain",
    nurse: "Harried Rae Anunciado",
    nurseTitle: "School Nurse",
    primaryColor: "#f05a28",
    secondaryColor: "#f7a81b",
    textColor: "#2b2b2b",
    texture: "texture-cream",
    border: "border-double",
    showLogoWatermark: true,
    showECGWatermark: true,
    showCrestWatermark: true,
    showCorners: true,
    darkTheme: true,
    logoSrc: 'logo.png',
    capSigSrc: '',
    nurseSigSrc: '',
    showAIAdapt: true
  };

  /* ==========================================================================
     TAB TOGGLER LISTENERS
     ========================================================================== */

  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.dataset.tab;
      
      document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
      });
      document.getElementById(target).classList.add('active');
    });
  });

  /* ==========================================================================
     DATE PARSER HELPER
     ========================================================================== */

  function getOrdinalSuffix(day) {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1:  return "st";
      case 2:  return "nd";
      case 3:  return "rd";
      default: return "th";
    }
  }

  const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  function formatFormalDate(dateString) {
    if (!dateString) return "";
    const parts = dateString.split('-');
    if (parts.length !== 3) return "";
    const year = parseInt(parts[0], 10);
    const monthIndex = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);

    const suffix = getOrdinalSuffix(day);
    const month = MONTHS[monthIndex];

    return `Given this ${day}${suffix} day of ${month}, ${year} at ${inputSchoolName.value || 'our Academy'}`;
  }

  /* ==========================================================================
     LOGO IMAGE UPLOADER HANDLER & PALETTE EXTRACTOR
     ========================================================================== */

  inputLogoFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(event) {
        currentLogoSrc = event.target.result;
        updateLogoSources();
        extractPaletteFromLogo(currentLogoSrc);
      };
      reader.readAsDataURL(file);
    }
  });

  btnRestoreLogo.addEventListener('click', () => {
    currentLogoSrc = 'logo.png';
    inputLogoFile.value = '';
    updateLogoSources();
    // Revert to original FALI school colors
    pickerPrimary.value = DEFAULTS.primaryColor;
    pickerSecondary.value = DEFAULTS.secondaryColor;
    updatePreview();
  });

  function updateLogoSources() {
    previewHeaderLogo.src = currentLogoSrc;
    previewWatermarkLogo.src = currentLogoSrc;
    sidebarLogoPreview.src = currentLogoSrc;
  }

  /* ==========================================================================
     E-SIGNATURE UPLOADER HANDLERS
     ========================================================================== */

  inputCapSigFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(event) {
        currentCapSigSrc = event.target.result;
        updateSignatureSources();
      };
      reader.readAsDataURL(file);
    }
  });

  btnClearCapSig.addEventListener('click', () => {
    currentCapSigSrc = '';
    inputCapSigFile.value = '';
    updateSignatureSources();
  });

  inputNurseSigFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(event) {
        currentNurseSigSrc = event.target.result;
        updateSignatureSources();
      };
      reader.readAsDataURL(file);
    }
  });

  btnClearNurseSig.addEventListener('click', () => {
    currentNurseSigSrc = '';
    inputNurseSigFile.value = '';
    updateSignatureSources();
  });

  function updateSignatureSources() {
    // Sig 1 (Left)
    if (currentCapSigSrc) {
      previewCapSigImg.src = currentCapSigSrc;
      previewCapSigImg.classList.remove('hidden');
      capSigInk.classList.add('hidden');
      btnClearCapSig.classList.remove('hidden');
    } else {
      previewCapSigImg.src = '';
      previewCapSigImg.classList.add('hidden');
      capSigInk.classList.remove('hidden');
      btnClearCapSig.classList.add('hidden');
    }

    // Sig 2 (Right)
    if (currentNurseSigSrc) {
      previewNurseSigImg.src = currentNurseSigSrc;
      previewNurseSigImg.classList.remove('hidden');
      nurseSigInk.classList.add('hidden');
      btnClearNurseSig.classList.remove('hidden');
    } else {
      previewNurseSigImg.src = '';
      previewNurseSigImg.classList.add('hidden');
      nurseSigInk.classList.remove('hidden');
      btnClearNurseSig.classList.add('hidden');
    }
    saveState();
  }

  /* ==========================================================================
     AI DESIGN ADAPTIVE ENGINE (HEURISTIC DESIGN GENERATOR)
     ========================================================================== */

  const KEYWORD_PROFILES = [
    {
      keywords: ["medic", "health", "hospital", "science", "nurse", "clinic", "medical", "red cross", "care", "doctor", "dentist", "pharmacy", "medicinal"],
      theme: {
        primaryColor: "#f05a28", // Vibrant Red-Orange
        secondaryColor: "#008080", // Medical Teal
        textColor: "#2b2b2b",
        texture: "texture-cream",
        border: "border-double",
        showLogoWatermark: true,
        showECG: true,
        showCrest: false,
        font: "font-pinyon"
      }
    },
    {
      keywords: ["military", "police", "cadet", "corps", "security", "defense", "army", "navy", "rotc", "law", "officer", "marshal", "sheriff"],
      theme: {
        primaryColor: "#1c3c24", // Military Forest Green
        secondaryColor: "#cda250", // Brass Gold
        textColor: "#111111",
        texture: "texture-vintage",
        border: "border-ornate",
        showLogoWatermark: true,
        showECG: false,
        showCrest: true,
        font: "font-cinzel"
      }
    },
    {
      keywords: ["university", "college", "academy", "seminary", "institute", "school", "faculty", "engineering", "sciences", "scholar", "theological", "academic"],
      theme: {
        primaryColor: "#0f2042", // Ivy Navy Blue
        secondaryColor: "#d4af37", // Metallic Gold
        textColor: "#1b1e24",
        texture: "texture-linen",
        border: "border-solid",
        showLogoWatermark: true,
        showECG: false,
        showCrest: true,
        font: "font-garamond"
      }
    },
    {
      keywords: ["art", "music", "design", "creative", "dance", "theatre", "orchestra", "band", "literary", "drama", "arts", "fashion", "gallery"],
      theme: {
        primaryColor: "#581845", // Deep Royal Purple
        secondaryColor: "#ff5733", // Coral Pink
        textColor: "#222222",
        texture: "texture-linen",
        border: "border-none",
        showLogoWatermark: true,
        showECG: false,
        showCrest: true,
        font: "font-playfair"
      }
    }
  ];

  function runAISmartAdapt() {
    if (!toggleAIAdapt.checked) return;
    
    // Scan institution name and organization name for semantic keywords
    const textToScan = ((inputSchoolName.value || "") + " " + (inputOrgName.value || "")).toLowerCase();
    
    let matchedProfile = null;
    for (const profile of KEYWORD_PROFILES) {
      if (profile.keywords.some(keyword => textToScan.includes(keyword))) {
        matchedProfile = profile;
        break;
      }
    }
    
    if (matchedProfile) {
      // Apply matched design profile parameters
      pickerPrimary.value = matchedProfile.theme.primaryColor;
      pickerSecondary.value = matchedProfile.theme.secondaryColor;
      pickerText.value = matchedProfile.theme.textColor;
      bgTexture.value = matchedProfile.theme.texture;
      borderStyle.value = matchedProfile.theme.border;
      
      toggleLogoWatermark.checked = matchedProfile.theme.showLogoWatermark;
      toggleECGWatermark.checked = matchedProfile.theme.showECG;
      toggleCrestWatermark.checked = matchedProfile.theme.showCrest;
      nameFont.value = matchedProfile.theme.font;
      
      // Update sidebar visual controllers
      updatePreview();
    }
  }

  /* ==========================================================================
     CORE PREVIEW SYNCHRONIZATION
     ========================================================================== */

  function updatePreview() {
    // 1. Core Headings
    previewSchoolName.textContent = inputSchoolName.value || "[Institution/School Name]";
    previewOrgName.textContent = inputOrgName.value || "[Organization/Department Name]";
    previewCertTitle.textContent = inputCertTitle.value || "[Certificate Title]";
    previewCertSubtitle.textContent = inputCertSubtitle.value || "[Presentation Phrase]";

    // 2. Recipient Name & Typography font families
    previewName.textContent = inputName.value || "[Recipient Name]";
    previewName.className = 'recipient-name';
    previewName.classList.add(nameFont.value);

    // 3. Citation Texts
    previewBodyPrimary.innerHTML = highlightKeywords(
      inputBodyPrimary.value || "[Primary Citation Description]",
      inputOrgName.value,
      inputSchoolName.value
    );
    previewBodySecondary.innerHTML = highlightKeywords(
      inputBodySecondary.value || "[Secondary Recognition Description]",
      inputOrgName.value,
      inputSchoolName.value
    );

    // 4. Signatories
    previewCaptain.textContent = inputCaptain.value || "[Signatory 1]";
    previewCaptainTitle.textContent = inputCaptainTitle.value || "[Designation]";
    previewNurse.textContent = inputNurse.value || "[Signatory 2]";
    previewNurseTitle.textContent = inputNurseTitle.value || "[Designation]";

    // 5. Signature ink placeholders
    capSigInk.textContent = inputCaptain.value || "";
    nurseSigInk.textContent = inputNurse.value ? getShortenedSignatoryName(inputNurse.value) : "";

    // 6. Dates
    if (toggleManualDate.checked) {
      autoDateGroup.classList.add('hidden');
      manualDateGroup.classList.remove('hidden');
      previewDateSentence.innerHTML = highlightKeywords(
        inputManualDate.value || "",
        inputOrgName.value,
        inputSchoolName.value
      );
    } else {
      autoDateGroup.classList.remove('hidden');
      manualDateGroup.classList.add('hidden');
      previewDateSentence.innerHTML = highlightKeywords(
        formatFormalDate(inputDate.value),
        inputOrgName.value,
        inputSchoolName.value
      );
      inputManualDate.value = formatFormalDate(inputDate.value);
    }
    
    previewDateIssued.textContent = inputDateIssued.value || "";
    previewLocation.textContent = inputLocation.value || "";

    // 7. Aesthetics: Apply textures & borders
    certificatePaper.className = 'certificate-paper';
    certificatePaper.classList.add(bgTexture.value, borderStyle.value);

    // 8. Aesthetics: Toggles
    logoWatermarkWrapper.style.display = toggleLogoWatermark.checked ? 'flex' : 'none';
    ecgWatermarkSVG.style.display = toggleECGWatermark.checked ? 'block' : 'none';
    crestWatermarkSVG.style.display = toggleCrestWatermark.checked ? 'block' : 'none';
    cornerOrnaments.style.display = toggleBorderDecoration.checked ? 'block' : 'none';

    // 9. Color Pickers: Apply dynamic variables
    certificatePaper.style.setProperty('--school-orange', pickerPrimary.value);
    // Darker hover accent
    certificatePaper.style.setProperty('--school-orange-hover', darkenHexColor(pickerPrimary.value, 15));
    certificatePaper.style.setProperty('--school-gold', pickerSecondary.value);
    certificatePaper.style.setProperty('--cert-text-dark', pickerText.value);
    // Secondary medium color mapped automatically
    certificatePaper.style.setProperty('--cert-text-medium', lightenHexColor(pickerText.value, 20));

    saveState();
  }

  // Helper to generate initials ink placeholders
  function getShortenedSignatoryName(fullName) {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length <= 1) return fullName;
    let initials = "";
    for (let i = 0; i < parts.length - 1; i++) {
      if (parts[i].length > 0) {
        initials += parts[i][0].toUpperCase() + ". ";
      }
    }
    const lastName = parts[parts.length - 1];
    return initials + lastName;
  }

  // Color modification helper
  function darkenHexColor(hex, percent) {
    let num = parseInt(hex.replace("#",""), 16),
    amt = Math.round(2.55 * percent),
    R = (num >> 16) - amt,
    G = (num >> 8 & 0x00FF) - amt,
    B = (num & 0x0000FF) - amt;
    return "#" + (0x1000000 + (R<0?0:R>255?255:R)*0x10000 + (G<0?0:G>255?255:G)*0x100 + (B<0?0:B>255?255:B)).toString(16).slice(1);
  }

  function lightenHexColor(hex, percent) {
    let num = parseInt(hex.replace("#",""), 16),
    amt = Math.round(2.55 * percent),
    R = (num >> 16) + amt,
    G = (num >> 8 & 0x00FF) + amt,
    B = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R<0?0:R>255?255:R)*0x10000 + (G<0?0:G>255?255:G)*0x100 + (B<0?0:B>255?255:B)).toString(16).slice(1);
  }

  /* ==========================================================================
     LOCAL STORAGE STATE MANAGEMENT
     ========================================================================== */

  function saveState() {
    const state = {
      name: inputName.value,
      font: nameFont.value,
      schoolName: inputSchoolName.value,
      orgName: inputOrgName.value,
      certTitle: inputCertTitle.value,
      certSubtitle: inputCertSubtitle.value,
      bodyPrimary: inputBodyPrimary.value,
      bodySecondary: inputBodySecondary.value,
      manualDate: toggleManualDate.checked,
      date: inputDate.value,
      manualDateText: inputManualDate.value,
      dateIssued: inputDateIssued.value,
      location: inputLocation.value,
      captain: inputCaptain.value,
      captainTitle: inputCaptainTitle.value,
      nurse: inputNurse.value,
      nurseTitle: inputNurseTitle.value,
      primaryColor: pickerPrimary.value,
      secondaryColor: pickerSecondary.value,
      textColor: pickerText.value,
      texture: bgTexture.value,
      border: borderStyle.value,
      showLogoWatermark: toggleLogoWatermark.checked,
      showECGWatermark: toggleECGWatermark.checked,
      showCrestWatermark: toggleCrestWatermark.checked,
      showCorners: toggleBorderDecoration.checked,
      darkTheme: document.body.classList.contains('dark-theme'),
      logoSrc: currentLogoSrc,
      capSigSrc: currentCapSigSrc,
      nurseSigSrc: currentNurseSigSrc,
      showAIAdapt: toggleAIAdapt.checked
    };
    localStorage.setItem('CertStudio_FormData', JSON.stringify(state));
  }

  function loadState() {
    const saved = localStorage.getItem('CertStudio_FormData');
    if (!saved) {
      resetToDefault();
      return;
    }

    try {
      const state = JSON.parse(saved);
      
      inputName.value = state.name ?? DEFAULTS.name;
      nameFont.value = state.font ?? DEFAULTS.font;
      inputSchoolName.value = state.schoolName ?? DEFAULTS.schoolName;
      inputOrgName.value = state.orgName ?? DEFAULTS.orgName;
      inputCertTitle.value = state.certTitle ?? DEFAULTS.certTitle;
      inputCertSubtitle.value = state.certSubtitle ?? DEFAULTS.certSubtitle;
      let loadedBodyPrimary = state.bodyPrimary ?? DEFAULTS.bodyPrimary;
      let loadedBodySecondary = state.bodySecondary ?? DEFAULTS.bodySecondary;
      let loadedManualDateText = state.manualDateText ?? DEFAULTS.manualDateText;

      // Migrate old hardcoded default text to new dynamic tokenized text
      if (loadedBodyPrimary === "for actively participating as a member of the School Medic Organization during the Academic Year 2022–2023.") {
        loadedBodyPrimary = "for actively participating as a member of the {orgName} during the Academic Year 2022–2023.";
      }
      if (loadedBodySecondary === "This is given in recognition of their dedication, service, and willingness to promote health, safety, and care within the school community." ||
          loadedBodySecondary === "This is given in recognition of their dedication, service, and willingness to promote the values and goals of School Medic Organization within the School Medic & Health Academy community.") {
        loadedBodySecondary = "This is given in recognition of their dedication, service, and willingness to promote the values and goals of {orgName} within the {schoolName} community.";
      }
      if (loadedManualDateText === "Given this 28th day of April, 2023 at School Medic & Health Academy") {
        loadedManualDateText = "Given this 28th day of April, 2023 at {schoolName}";
      }

      inputBodyPrimary.value = loadedBodyPrimary;
      inputBodySecondary.value = loadedBodySecondary;
      inputManualDate.value = loadedManualDateText;
      
      toggleManualDate.checked = state.manualDate ?? DEFAULTS.manualDate;
      inputDate.value = state.date ?? DEFAULTS.date;
      inputDateIssued.value = state.dateIssued ?? DEFAULTS.dateIssued;
      inputLocation.value = state.location ?? DEFAULTS.location;
      
      inputCaptain.value = state.captain ?? DEFAULTS.captain;
      inputCaptainTitle.value = state.captainTitle ?? DEFAULTS.captainTitle;
      inputNurse.value = state.nurse ?? DEFAULTS.nurse;
      inputNurseTitle.value = state.nurseTitle ?? DEFAULTS.nurseTitle;
      
      pickerPrimary.value = state.primaryColor ?? DEFAULTS.primaryColor;
      pickerSecondary.value = state.secondaryColor ?? DEFAULTS.secondaryColor;
      pickerText.value = state.textColor ?? DEFAULTS.textColor;
      bgTexture.value = state.texture ?? DEFAULTS.texture;
      borderStyle.value = state.border ?? DEFAULTS.border;
      
      toggleLogoWatermark.checked = state.showLogoWatermark ?? DEFAULTS.showLogoWatermark;
      toggleECGWatermark.checked = state.showECGWatermark ?? DEFAULTS.showECGWatermark;
      toggleCrestWatermark.checked = state.showCrestWatermark ?? DEFAULTS.showCrestWatermark;
      toggleBorderDecoration.checked = state.showCorners ?? DEFAULTS.showCorners;
      toggleAIAdapt.checked = state.showAIAdapt ?? DEFAULTS.showAIAdapt;
      currentLogoSrc = state.logoSrc ?? DEFAULTS.logoSrc;
      updateLogoSources();

      currentCapSigSrc = state.capSigSrc ?? DEFAULTS.capSigSrc;
      currentNurseSigSrc = state.nurseSigSrc ?? DEFAULTS.nurseSigSrc;
      updateSignatureSources();

      if (state.darkTheme === false) {
        document.body.classList.remove('dark-theme');
        document.body.classList.add('light-theme');
        themeToggleText.textContent = "Dark Mode";
        themeIcon.innerHTML = '<path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707.707M12 5a7 7 0 1 0 0 14 7 7 0 0 0 0-14z"></path>';
      } else {
        document.body.classList.add('dark-theme');
        document.body.classList.remove('light-theme');
        themeToggleText.textContent = "Light Mode";
        themeIcon.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>';
      }

      updatePreview();
    } catch (e) {
      console.error("Error restoring local CertStudio state, resetting...", e);
      resetToDefault();
    }
  }

  function resetToDefault() {
    inputName.value = DEFAULTS.name;
    nameFont.value = DEFAULTS.font;
    inputSchoolName.value = DEFAULTS.schoolName;
    inputOrgName.value = DEFAULTS.orgName;
    inputCertTitle.value = DEFAULTS.certTitle;
    inputCertSubtitle.value = DEFAULTS.certSubtitle;
    inputBodyPrimary.value = DEFAULTS.bodyPrimary;
    inputBodySecondary.value = DEFAULTS.bodySecondary;
    
    toggleManualDate.checked = DEFAULTS.manualDate;
    inputDate.value = DEFAULTS.date;
    inputManualDate.value = DEFAULTS.manualDateText;
    inputDateIssued.value = DEFAULTS.dateIssued;
    inputLocation.value = DEFAULTS.location;
    
    inputCaptain.value = DEFAULTS.captain;
    inputCaptainTitle.value = DEFAULTS.captainTitle;
    inputNurse.value = DEFAULTS.nurse;
    inputNurseTitle.value = DEFAULTS.nurseTitle;
    
    pickerPrimary.value = DEFAULTS.primaryColor;
    pickerSecondary.value = DEFAULTS.secondaryColor;
    pickerText.value = DEFAULTS.textColor;
    bgTexture.value = DEFAULTS.texture;
    borderStyle.value = DEFAULTS.border;
    
    toggleLogoWatermark.checked = DEFAULTS.showLogoWatermark;
    toggleECGWatermark.checked = DEFAULTS.showECGWatermark;
    toggleCrestWatermark.checked = DEFAULTS.showCrestWatermark;
    toggleBorderDecoration.checked = DEFAULTS.showCorners;
    toggleAIAdapt.checked = DEFAULTS.showAIAdapt;
    currentLogoSrc = DEFAULTS.logoSrc;
    updateLogoSources();

    currentCapSigSrc = DEFAULTS.capSigSrc;
    currentNurseSigSrc = DEFAULTS.nurseSigSrc;
    inputCapSigFile.value = '';
    inputNurseSigFile.value = '';
    updateSignatureSources();

    document.body.classList.add('dark-theme');
    document.body.classList.remove('light-theme');
    themeToggleText.textContent = "Light Mode";
    themeIcon.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>';

    updatePreview();
  }

  /* ==========================================================================
     EVENT BINDINGS & LISTENERS
     ========================================================================== */

  // Text inputs real-time listeners
  const textInputs = [
    inputName, inputSchoolName, inputOrgName, inputCertTitle, 
    inputCertSubtitle, inputBodyPrimary, inputBodySecondary,
    inputManualDate, inputCaptain, inputCaptainTitle, 
    inputNurse, inputNurseTitle, inputDateIssued, inputLocation
  ];
  textInputs.forEach(input => {
    input.addEventListener('input', updatePreview);
  });

  // Pickers and Dropdowns
  const selectInputs = [nameFont, bgTexture, borderStyle, inputDate, pickerPrimary, pickerSecondary, pickerText];
  selectInputs.forEach(input => {
    input.addEventListener('change', updatePreview);
    if(input.type === 'color') {
      input.addEventListener('input', updatePreview); // Real-time color updates
    }
  });

  // Hook semantic adaptive triggers
  inputSchoolName.addEventListener('input', runAISmartAdapt);
  inputOrgName.addEventListener('input', runAISmartAdapt);

  // Checkboxes
  const checkboxInputs = [toggleManualDate, toggleLogoWatermark, toggleECGWatermark, toggleCrestWatermark, toggleBorderDecoration, toggleAIAdapt];
  checkboxInputs.forEach(checkbox => {
    checkbox.addEventListener('change', updatePreview);
  });

  // Reset Actions
  btnReset.addEventListener('click', () => {
    if (confirm("Are you sure you want to reset all certificate layout properties and restore defaults?")) {
      resetToDefault();
    }
  });

  // Interface Toggle Mode
  btnThemeToggle.addEventListener('click', () => {
    if (document.body.classList.contains('dark-theme')) {
      document.body.classList.remove('dark-theme');
      document.body.classList.add('light-theme');
      themeToggleText.textContent = "Dark Mode";
      themeIcon.innerHTML = '<path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707.707M12 5a7 7 0 1 0 0 14 7 7 0 0 0 0-14z"></path>';
    } else {
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
      themeToggleText.textContent = "Light Mode";
      themeIcon.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>';
    }
    saveState();
  });

  // Mobile navigation
  sidebarToggle.addEventListener('click', () => {
    controlSidebar.classList.toggle('active');
  });

  document.querySelector('.preview-area').addEventListener('click', () => {
    if (window.innerWidth <= 900) {
      controlSidebar.classList.remove('active');
    }
  });

  /* ==========================================================================
     PRECISION PRINT GENERATION (A4 LANDSCAPE TAB TARGET)
     ========================================================================== */

  btnPrint.addEventListener('click', () => {
    // Read live state details
    const certHTML = certificatePaper.outerHTML;
    const styles = certificatePaper.getAttribute('style') || '';
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Please allow pop-up permissions to compile and print the A4 document.");
      return;
    }
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Print Certificate - ${inputName.value || 'CertStudio'}</title>
        <!-- Google Fonts -->
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;800&family=Montserrat:wght@300;400;500;600;700&family=Pinyon+Script&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="style.css">
        <style>
          /* A4 Landscape Precise Locked Target Dimensions */
          @page {
            size: A4 landscape;
            margin: 0;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 297mm !important;
            height: 210mm !important;
            overflow: hidden !important;
            background-color: #fdfbf7 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .certificate-paper {
            width: 297mm !important;
            height: 210mm !important;
            margin: 0 !important;
            padding: 12mm 15mm !important;
            box-sizing: border-box !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            transform: none !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            align-items: center !important;
            position: relative !important;
            overflow: hidden !important;
          }
          
          /* Hide Ink replicas on Printout */
          .signature-placeholder-ink {
            display: none !important;
          }
          
          /* Force color print overrides to copy dynamic color variables precisely */
          .cert-title {
            color: var(--school-orange) !important;
            -webkit-text-fill-color: var(--school-orange) !important;
          }
          .organization-name {
            color: var(--school-orange) !important;
          }
          .recipient-name {
            color: var(--school-orange-hover) !important;
          }
        </style>
      </head>
      <body>
        <!-- Copy dynamic style attributes (applied variables) directly to container page -->
        <div style="${styles}">
          ${certHTML}
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 800);
          };
        </script>
      </body>
      </html>
    `);
    
    printWindow.document.close();
  });

  /* ==========================================================================
     HSL COLOR CONVERSION AND PALETTE EXTRACTION HELPERS
     ========================================================================== */

  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0; // achromatic
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return { h, s, l };
  }

  function hslToRgb(h, s, l) {
    let r, g, b;

    if (s === 0) {
      r = g = b = l; // achromatic
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    };
  }

  function rgbToHex(r, g, b) {
    const toHex = (c) => {
      const hex = c.toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    };
    return "#" + toHex(r) + toHex(g) + toHex(b);
  }

  function extractPaletteFromLogo(base64Src) {
    const img = new Image();
    img.src = base64Src;
    img.onload = function() {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        // Resizing to 40x40 averages details perfectly and speeds up calculation to <2ms!
        canvas.width = 40;
        canvas.height = 40;
        ctx.drawImage(img, 0, 0, 40, 40);
        
        const imgData = ctx.getImageData(0, 0, 40, 40).data;
        const colors = [];
        
        for (let i = 0; i < imgData.length; i += 4) {
          const r = imgData[i];
          const g = imgData[i + 1];
          const b = imgData[i + 2];
          const a = imgData[i + 3];
          
          if (a < 180) continue; // Ignore transparent pixels
          
          const hsl = rgbToHsl(r, g, b);
          // Focus strictly on vibrant accent colors: Saturation > 25%, Lightness 18% to 75%
          if (hsl.s > 0.25 && hsl.l > 0.18 && hsl.l < 0.78) {
            colors.push({ r, g, b, h: hsl.h, s: hsl.s, l: hsl.l });
          }
        }
        
        if (colors.length === 0) return;
        
        // Cluster pixels by Hue (36 buckets representing 10 degrees each)
        const bins = Array(36).fill(0).map(() => []);
        colors.forEach(c => {
          const binIndex = Math.min(Math.floor(c.h * 36), 35);
          bins[binIndex].push(c);
        });
        
        const sortedBins = bins
          .map((list, idx) => ({ idx, list }))
          .filter(b => b.list.length > 0)
          .sort((a, b) => b.list.length - a.list.length);
          
        if (sortedBins.length > 0) {
          // 1. Dominant primary accent color
          const primaryRGB = averagePixels(sortedBins[0].list);
          const primaryHex = rgbToHex(primaryRGB.r, primaryRGB.g, primaryRGB.b);
          pickerPrimary.value = primaryHex;
          
          // 2. Harmonious secondary accent color (try to find a secondary hue at least 30 deg away)
          let secondaryHex = '';
          const primaryIdx = sortedBins[0].idx;
          
          for (let i = 1; i < sortedBins.length; i++) {
            const distance = Math.abs(sortedBins[i].idx - primaryIdx);
            if (distance > 3 && distance < 33) {
              const secondaryRGB = averagePixels(sortedBins[i].list);
              secondaryHex = rgbToHex(secondaryRGB.r, secondaryRGB.g, secondaryRGB.b);
              break;
            }
          }
          
          // Fallback matching color if no contrasting secondary hue exists
          if (!secondaryHex) {
            const primaryHSL = rgbToHsl(primaryRGB.r, primaryRGB.g, primaryRGB.b);
            const secondaryHue = (primaryHSL.h + 0.12) % 1;
            const secondaryRGB = hslToRgb(secondaryHue, primaryHSL.s, Math.min(primaryHSL.l + 0.15, 0.72));
            secondaryHex = rgbToHex(secondaryRGB.r, secondaryRGB.g, secondaryRGB.b);
          }
          
          pickerSecondary.value = secondaryHex;
          
          // Instantly sync preview
          updatePreview();
        }
      } catch (error) {
        console.error("Dominant color extraction was blocked or failed: ", error);
      }
    };
  }

  function averagePixels(pixels) {
    let sumR = 0, sumG = 0, sumB = 0;
    pixels.forEach(p => {
      sumR += p.r;
      sumG += p.g;
      sumB += p.b;
    });
    return {
      r: Math.round(sumR / pixels.length),
      g: Math.round(sumG / pixels.length),
      b: Math.round(sumB / pixels.length)
    };
  }

  function escapeHTML(str) {
    if (!str) return "";
    return str.replace(/[&<>'"]/g, 
      tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      }[tag] || tag)
    );
  }

  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function highlightKeywords(text, org, school) {
    let escapedText = escapeHTML(text);
    const escapedOrg = escapeHTML(org);
    const escapedSchool = escapeHTML(school);
    
    // Replace dynamic template tokens
    escapedText = escapedText.replace(/{orgName}/g, escapedOrg);
    escapedText = escapedText.replace(/{schoolName}/g, escapedSchool);
    
    // Collect unique non-empty keywords
    const keywords = [];
    if (escapedOrg && escapedOrg.trim().length > 0) {
      keywords.push(escapedOrg.trim());
    }
    if (escapedSchool && escapedSchool.trim().length > 0) {
      keywords.push(escapedSchool.trim());
    }
    
    const uniqueSortedKeywords = [...new Set(keywords)]
      .sort((a, b) => b.length - a.length);
      
    if (uniqueSortedKeywords.length === 0) {
      return escapedText;
    }
    
    // Create single-pass case-insensitive alternation regex to prevent nested span pollution
    const pattern = uniqueSortedKeywords.map(k => escapeRegExp(k)).join('|');
    const regex = new RegExp(`(${pattern})`, 'gi');
    
    return escapedText.replace(regex, '<span class="text-highlight">$1</span>');
  }

  // --- INIT APP ---
  loadState();
});

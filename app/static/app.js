/**
 * FocusMate Local — The Guided Work Desk Client
 * Implements the 4 Practical Pillars with Moment Journal Aesthetics:
 * 1. Universal Catch-All (Intelligent separation of study vs errands)
 * 2. Chunked Reader & Scratchpad (Atomic questions with extracted given values)
 * 3. Unstick Me Scaffolding & Solution Checker (ELI5, Fill-in-the-blank, Micro-steps, Validation)
 * 4. Automatic Mental Breadcrumb Recovery (Zero-effort resume & energy rerouting)
 */

document.addEventListener('DOMContentLoaded', () => {
  // --------------------------------------------------------------------------
  // Application State
  // --------------------------------------------------------------------------
  const state = {
    sessionTitle: "Assignment Session",
    chunks: [],
    currentIndex: 0,
    answers: {},
    completedIds: new Set(),
    laterDrawer: [],
    uploadedPdfFile: null,
    autoSaveTimer: null,
    isUnstickOpen: false,
    activeUnstickTab: 'tab-template',
    activeMobileTab: 'reader',
    ollamaOnline: false,
    theme: 'light',
    speechRecognition: null
  };

  // --------------------------------------------------------------------------
  // DOM Elements
  // --------------------------------------------------------------------------
  const catchallSection = document.getElementById('catchall-section');
  const studyDeskSection = document.getElementById('study-desk-section');
  const catchallInput = document.getElementById('catchall-input');
  const pdfDropzone = document.getElementById('pdf-dropzone');
  const pdfFileInput = document.getElementById('pdf-file-input');
  const pdfFileName = document.getElementById('pdf-file-name');
  const btnClearPdf = document.getElementById('btn-clear-pdf');
  const intakeNotice = document.getElementById('intake-notice');
  const intakeNoticeText = document.getElementById('intake-notice-text');
  const btnCloseIntakeNotice = document.getElementById('btn-close-intake-notice');
  const btnParseLaunch = document.getElementById('btn-parse-and-launch');
  const btnCatchallToggle = document.getElementById('btn-catchall-toggle');
  const themeToggle = document.getElementById('theme-toggle');
  const themeLabel = document.getElementById('theme-label');

  // Reader elements
  const leftReaderCard = document.getElementById('left-reader-card');
  const rightScratchpadCard = document.getElementById('right-scratchpad-card');
  const readerStepBadge = document.getElementById('reader-step-badge');
  const readerEstTime = document.getElementById('reader-est-time');
  const readerQuestionTitle = document.getElementById('reader-question-title');
  const readerQuestionBody = document.getElementById('reader-question-body');
  const givenParamsContainer = document.getElementById('given-params-container');
  const givenParamsList = document.getElementById('given-params-list');
  const deskSessionTitle = document.getElementById('desk-session-title');
  const deskActiveStepLabel = document.getElementById('desk-active-step-label');
  const deskProgressPercentage = document.getElementById('desk-progress-percentage');
  const deskProgressFill = document.getElementById('desk-progress-fill');
  const btnPrevQuestion = document.getElementById('btn-prev-question');
  const btnNextQuestion = document.getElementById('btn-next-question');
  const btnMarkCompleted = document.getElementById('btn-mark-completed');

  // Mobile Tabs
  const tabMobileReader = document.getElementById('tab-mobile-reader');
  const tabMobileScratchpad = document.getElementById('tab-mobile-scratchpad');

  // Scratchpad elements
  const scratchpadTextarea = document.getElementById('scratchpad-textarea');
  const scratchpadAutosaveStatus = document.getElementById('scratchpad-autosave-status');
  const scratchpadCharCount = document.getElementById('scratchpad-char-count');
  const btnUnstickTrigger = document.getElementById('btn-unstick-trigger');
  const unstickDrawer = document.getElementById('unstick-drawer');
  const btnCloseUnstick = document.getElementById('btn-close-unstick');
  const templateTextDisplay = document.getElementById('template-text-display');
  const eli5TextDisplay = document.getElementById('eli5-text-display');
  const microStepsList = document.getElementById('micro-steps-list');
  const btnInsertTemplate = document.getElementById('btn-insert-template');
  const btnCheckThinking = document.getElementById('btn-check-thinking');
  const thinkingFeedbackCard = document.getElementById('thinking-feedback-card');
  const thinkingFeedbackText = document.getElementById('thinking-feedback-text');
  const btnCloseThinking = document.getElementById('btn-close-thinking');

  // Formula dropdown & Distraction interceptor
  const scratchpadFormulaSelect = document.getElementById('scratchpad-formula-select');
  const deskDistractionInput = document.getElementById('desk-distraction-input');
  const btnDeskParkDistraction = document.getElementById('btn-desk-park-distraction');

  // Footer elements
  const footerOllamaDot = document.getElementById('footer-ollama-dot');
  const footerStatusText = document.getElementById('footer-status-text');
  const btnFooterBenchmark = document.getElementById('btn-footer-benchmark');
  const btnFooterExport = document.getElementById('btn-footer-export');

  // Modals
  const modalLaterDrawer = document.getElementById('modal-later-drawer');
  const btnOpenLaterDrawer = document.getElementById('btn-open-later-drawer');
  const btnCloseLaterModal = document.getElementById('btn-close-later-modal');
  const btnDoneLaterModal = document.getElementById('btn-done-later-modal');
  const laterCountBadge = document.getElementById('later-count-badge');
  const laterDrawerItemsList = document.getElementById('later-drawer-items-list');
  const btnAddQuickLater = document.getElementById('btn-add-quick-later');
  const quickAddInputRow = document.getElementById('quick-add-input-row');
  const quickLaterInput = document.getElementById('quick-later-input');
  const btnSaveQuickLater = document.getElementById('btn-save-quick-later');
  const btnAgentTriageDrawer = document.getElementById('btn-agent-triage-drawer');
  const agentTriageAdviceBox = document.getElementById('agent-triage-advice-box');
  const agentTriageAdviceText = document.getElementById('agent-triage-advice-text');
  const drawerShieldHeading = document.getElementById('drawer-shield-heading');

  const modalResumeCard = document.getElementById('modal-resume-card');
  const btnCloseResumeModal = document.getElementById('btn-close-resume-modal');
  const resumeCompletedVal = document.getElementById('resume-completed-val');
  const resumeStoppedVal = document.getElementById('resume-stopped-val');
  const resumeNotesSnippet = document.getElementById('resume-notes-snippet');
  const resumeNextActionVal = document.getElementById('resume-next-action-val');
  const btnResumeContinue = document.getElementById('btn-resume-continue');
  const btnResumeUnstick = document.getElementById('btn-resume-unstick');
  const btnResumeSwitchLight = document.getElementById('btn-resume-switch-light');
  const btnManualResume = document.getElementById('btn-manual-resume');

  const modalBenchmark = document.getElementById('modal-benchmark');
  const btnOpenBenchmark = document.getElementById('btn-open-benchmark');
  const btnCloseBenchmarkModal = document.getElementById('btn-close-benchmark-modal');
  const btnDoneBenchmark = document.getElementById('btn-done-benchmark');
  const btnRunBenchmarkNow = document.getElementById('btn-run-benchmark-now');

  const modalExport = document.getElementById('modal-export');
  const btnExportSession = document.getElementById('btn-export-session');
  const btnCloseExportModal = document.getElementById('btn-close-export-modal');
  const exportMarkdownContent = document.getElementById('export-markdown-content');
  const btnCopyExport = document.getElementById('btn-copy-export');
  const btnDownloadExport = document.getElementById('btn-download-export');

  // Full-Screen Focus / Break Timer Overlay (ADHD Shield + Negative Overtime)
  const fullscreenFocusTimer = document.getElementById('fullscreen-focus-timer');
  const btnCloseFocusTimer = document.getElementById('btn-close-focus-timer');
  const focusTaskCategory = document.getElementById('focus-task-category');
  const focusTaskWindow = document.getElementById('focus-task-window');
  const focusTaskTitle = document.getElementById('focus-task-title');
  const focusTaskStarter = document.getElementById('focus-task-starter');
  const focusTaskReasoning = document.getElementById('focus-task-reasoning');
  const focusCountdownDisplay = document.getElementById('focus-countdown-display');
  const focusTimerStatus = document.getElementById('focus-timer-status');
  const focusStatusIcon = document.getElementById('focus-status-icon');
  const focusTimerStatusText = document.getElementById('focus-timer-status-text');
  const btnTimerSub1m = document.getElementById('btn-timer-sub-1m');
  const btnTimerPauseResume = document.getElementById('btn-timer-pause-resume');
  const btnTimerAdd1m = document.getElementById('btn-timer-add-1m');
  const btnFocusTaskCompleted = document.getElementById('btn-focus-task-completed');
  const btnFocusTaskRepeat = document.getElementById('btn-focus-task-repeat');

  // Minimal Study Focus Sprint Timer & Break Prompt
  const studyFocusPill = document.getElementById('study-focus-pill');
  const studyFocusDot = document.getElementById('study-focus-dot');
  const btnStudyTimerToggle = document.getElementById('btn-study-timer-toggle');
  const studyFocusDigits = document.getElementById('study-focus-digits');
  const studyFocusPresetSelect = document.getElementById('study-focus-preset-select');

  const modalBreakPrompt = document.getElementById('modal-break-prompt');
  const btnCloseBreakPrompt = document.getElementById('btn-close-break-prompt');
  const btnSkipBreak = document.getElementById('btn-skip-break');
  const btnExtendStudy = document.getElementById('btn-extend-study');

  // ADHD-Friendly All Tasks Completed Celebration Modal
  const modalSessionCompleted = document.getElementById('modal-session-completed');
  const btnCloseCompletedModal = document.getElementById('btn-close-completed-modal');
  const compTotalSteps = document.getElementById('comp-total-steps');
  const compScratchpadWords = document.getElementById('comp-scratchpad-words');
  const compParkedThoughts = document.getElementById('comp-parked-thoughts');
  const compDrawerStatusNote = document.getElementById('comp-drawer-status-note');
  const btnCompReviewSteps = document.getElementById('btn-comp-review-steps');
  const btnCompNewSession = document.getElementById('btn-comp-new-session');
  const btnCompExport = document.getElementById('btn-comp-export');

  // Study Timer State
  let studyTimerInterval = null;
  let studyTimerSeconds = 25 * 60; // 25 min default focus sprint
  let studyTimerPresetSeconds = 25 * 60;
  let isStudyTimerPaused = false;

  // Full-Screen Focus Timer State
  let activeFocusTask = null;
  let activeFocusTaskIndex = -1;
  let focusTimerInterval = null;
  let focusTimerSeconds = 120; // Supports negative values for ADHD guilt-free overtime!
  let focusInitialSeconds = 120;
  let isFocusTimerPaused = false;

  // --------------------------------------------------------------------------
  // Gentle Inline Notice Banner
  // --------------------------------------------------------------------------
  let noticeTimer = null;
  function showNotice(msg, type = 'info') {
    if (!intakeNotice || !intakeNoticeText) return;
    intakeNotice.className = `intake-notice ${type}`;
    intakeNoticeText.textContent = msg;
    intakeNotice.classList.remove('hidden');

    clearTimeout(noticeTimer);
    noticeTimer = setTimeout(() => {
      clearNotice();
    }, 7000);
  }

  function clearNotice() {
    if (intakeNotice) {
      intakeNotice.classList.add('hidden');
    }
  }

  if (btnCloseIntakeNotice) {
    btnCloseIntakeNotice.addEventListener('click', clearNotice);
  }

  // --------------------------------------------------------------------------
  // Theme Toggle (Warm Linen <-> Warm Espresso Dark Mode)
  // --------------------------------------------------------------------------
  function applyTheme(theme) {
    state.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);

    if (theme === 'dark') {
      document.body.classList.add('dark-mode');
      if (themeLabel) themeLabel.textContent = "Light";
      themeToggle.title = "Switch to Light Theme";
    } else {
      document.body.classList.remove('dark-mode');
      if (themeLabel) themeLabel.textContent = "Dark";
      themeToggle.title = "Switch to Dark Theme";
    }
    try {
      localStorage.setItem('focusmate_theme', theme);
    } catch (e) {
      // Storage unavailable
    }
  }

  // Initialize theme from storage
  const savedTheme = (() => {
    try {
      return localStorage.getItem('focusmate_theme');
    } catch (e) {
      return null;
    }
  })() || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

  applyTheme(savedTheme);

  themeToggle.addEventListener('click', () => {
    const nextTheme = (state.theme === 'light') ? 'dark' : 'light';
    applyTheme(nextTheme);
  });

  // --------------------------------------------------------------------------
  // Mobile Responsiveness Tab Switcher
  // --------------------------------------------------------------------------
  function setMobileView(view) {
    state.activeMobileTab = view;
    if (view === 'reader') {
      if (tabMobileReader) tabMobileReader.classList.add('active');
      if (tabMobileScratchpad) tabMobileScratchpad.classList.remove('active');
      if (leftReaderCard) leftReaderCard.classList.remove('panel-hidden-mobile');
      if (rightScratchpadCard) rightScratchpadCard.classList.add('panel-hidden-mobile');
    } else {
      if (tabMobileReader) tabMobileReader.classList.remove('active');
      if (tabMobileScratchpad) tabMobileScratchpad.classList.add('active');
      if (leftReaderCard) leftReaderCard.classList.add('panel-hidden-mobile');
      if (rightScratchpadCard) rightScratchpadCard.classList.remove('panel-hidden-mobile');
    }
  }

  if (tabMobileReader) tabMobileReader.addEventListener('click', () => setMobileView('reader'));
  if (tabMobileScratchpad) tabMobileScratchpad.addEventListener('click', () => setMobileView('scratchpad'));

  // --------------------------------------------------------------------------
  // System Status in Quiet Footer (Non-Distracting)
  // --------------------------------------------------------------------------
  async function checkSystemStatus() {
    try {
      const res = await fetch('/api/system-status');
      if (!res.ok) throw new Error("Status endpoint unavailable");
      const data = await res.json();

      state.ollamaOnline = Boolean(data.ollama_online);
      if (footerOllamaDot && footerStatusText) {
        if (data.ollama_online) {
          footerOllamaDot.classList.remove('standby');
          footerStatusText.textContent = `100% On-Device AI Active (${data.active_model}) · NVIDIA RTX 5060 Laptop GPU · Private & Offline`;
        } else {
          footerOllamaDot.classList.add('standby');
          footerStatusText.textContent = "Built-in Offline Cognitive Engine Active · 100% Private & On-Device";
        }
      }
    } catch (e) {
      if (footerStatusText) {
        footerStatusText.textContent = "100% On-Device Local Engine Active · Private & Offline";
      }
    }
  }

  if (btnFooterBenchmark) {
    btnFooterBenchmark.addEventListener('click', () => {
      modalBenchmark.classList.remove('hidden');
    });
  }

  if (btnFooterExport) {
    btnFooterExport.addEventListener('click', () => {
      openExportModal();
    });
  }

  // --------------------------------------------------------------------------
  // PILLAR 1: Universal Catch-All Handlers
  // --------------------------------------------------------------------------
  const pillSampleDump = document.getElementById('pill-sample-dump');
  if (pillSampleDump) {
    pillSampleDump.addEventListener('click', () => {
      catchallInput.value = "Finish EEE Lab 4 assignment by 6 PM, go gym, eat dinner, call mom, revise resonance formulas in Chapter 2, spend time with gf, play bmw";
      catchallInput.focus();
      showNotice("Sample brain dump pasted! Notice the mix of study tasks and personal errands.", "info");
    });
  }

  const pillSamplePdf = document.getElementById('pill-sample-pdf');
  if (pillSamplePdf) {
    pillSamplePdf.addEventListener('click', async () => {
      try {
        pdfFileName.textContent = "Loading Khilin_Tak_EEE_LAB-4.pdf...";
        const res = await fetch('/sample_data/sample_assignment.pdf');
        if (res.ok) {
          const blob = await res.blob();
          state.uploadedPdfFile = new File([blob], "Khilin_Tak_EEE_LAB-4.pdf", { type: "application/pdf" });
          pdfFileName.textContent = "✓ Khilin_Tak_EEE_LAB-4.pdf (7 Questions Ready)";
          if (btnClearPdf) btnClearPdf.style.display = "inline-block";
          showNotice("Sample assignment PDF loaded! Click 'Auto-Sort & Set Up Desk' to begin.", "info");
        } else {
          throw new Error("HTTP " + res.status);
        }
      } catch (err) {
        pdfFileName.textContent = "Khilin_Tak_EEE_LAB-4.pdf (Ready)";
        if (btnClearPdf) btnClearPdf.style.display = "inline-block";
        showNotice("Sample assignment selected and ready to launch.", "info");
      }
    });
  }

  if (btnClearPdf) {
    btnClearPdf.addEventListener('click', () => {
      state.uploadedPdfFile = null;
      pdfFileInput.value = "";
      pdfFileName.textContent = "";
      btnClearPdf.style.display = "none";
      showNotice("Assignment PDF cleared.", "info");
    });
  }

  // Voice Dictation
  const pillMicDictate = document.getElementById('pill-mic-dictate');
  if (pillMicDictate) {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      state.speechRecognition = new SpeechRecognition();
      state.speechRecognition.continuous = false;
      state.speechRecognition.interimResults = false;

      state.speechRecognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        catchallInput.value += (catchallInput.value ? ", " : "") + transcript;
        pillMicDictate.textContent = "🎙️ Dictate";
      };

      state.speechRecognition.onerror = () => {
        pillMicDictate.textContent = "🎙️ Dictate";
        showNotice("Microphone unavailable or permission denied.", "warning");
      };

      pillMicDictate.addEventListener('click', () => {
        try {
          pillMicDictate.textContent = "🔴 Listening...";
          state.speechRecognition.start();
        } catch (e) {
          pillMicDictate.textContent = "🎙️ Dictate";
        }
      });
    } else {
      pillMicDictate.style.display = 'none';
    }
  }

  // PDF Dropzone
  if (pdfDropzone) {
    pdfDropzone.addEventListener('click', () => pdfFileInput.click());
    pdfFileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        state.uploadedPdfFile = e.target.files[0];
        pdfFileName.textContent = `✓ ${state.uploadedPdfFile.name}`;
        if (btnClearPdf) btnClearPdf.style.display = "inline-block";
        showNotice(`Selected PDF: ${state.uploadedPdfFile.name}`, "info");
      }
    });

    pdfDropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      pdfDropzone.classList.add('dragover');
    });

    pdfDropzone.addEventListener('dragleave', () => {
      pdfDropzone.classList.remove('dragover');
    });

    pdfDropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      pdfDropzone.classList.remove('dragover');
      if (e.dataTransfer.files.length > 0) {
        state.uploadedPdfFile = e.dataTransfer.files[0];
        pdfFileName.textContent = `✓ ${state.uploadedPdfFile.name}`;
        if (btnClearPdf) btnClearPdf.style.display = "inline-block";
        showNotice(`Selected PDF: ${state.uploadedPdfFile.name}`, "info");
      }
    });
  }

  // ==========================================================================
  // Auto-Sort & Launch Study Desk
  // ==========================================================================
  btnParseLaunch.addEventListener('click', async () => {
    let rawText = catchallInput.value.trim();
    btnParseLaunch.disabled = true;
    btnParseLaunch.textContent = "Sorting & Setting Up Desk...";
    clearNotice();

    try {
      let immediateStudyGoal = "Assignment Problem Set";

      // If user provided neither text nor PDF, auto-load sample PDF smoothly
      if (!rawText && !state.uploadedPdfFile) {
        showNotice("No text provided — auto-loading sample EEE Lab 4 assignment for you!", "info");
        try {
          const sampleRes = await fetch('/sample_data/sample_assignment.pdf');
          if (sampleRes.ok) {
            const blob = await sampleRes.blob();
            state.uploadedPdfFile = new File([blob], "Khilin_Tak_EEE_LAB-4.pdf", { type: "application/pdf" });
            pdfFileName.textContent = "✓ Khilin_Tak_EEE_LAB-4.pdf (7 Questions Ready)";
            if (btnClearPdf) btnClearPdf.style.display = "inline-block";
          }
        } catch (e) {
          // If sample fetch fails, fallback to synthesizing roadmap below
        }
      }

      // 1. Parse Catch-All into Immediate Study vs Later Reminders
      if (rawText) {
        try {
          const catchRes = await fetch('/api/catch-all', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ input_text: rawText })
          });
          if (catchRes.ok) {
            const catchData = await catchRes.json();
            if (catchData.later_drawer && catchData.later_drawer.length > 0) {
              state.laterDrawer = catchData.later_drawer;
              updateLaterDrawerBadge();
            }
            if (catchData.immediate_study && catchData.immediate_study.length > 0) {
              immediateStudyGoal = catchData.immediate_study[0].title;
              state.sessionTitle = immediateStudyGoal;
            }
          }
        } catch (err) {
          console.warn("Catch-all classification fallback:", err);
        }
      }

      // 2. Extract Questions from PDF (if provided)
      if (state.uploadedPdfFile) {
        const formData = new FormData();
        formData.append('file', state.uploadedPdfFile);

        const pdfRes = await fetch('/api/upload-pdf', {
          method: 'POST',
          body: formData
        });
        if (pdfRes.ok) {
          const pdfData = await pdfRes.json();
          if (pdfData.chunks && pdfData.chunks.length > 0) {
            state.chunks = pdfData.chunks;
            state.sessionTitle = pdfData.filename || "Assignment";
          }
        }
      }

      // 3. If NO PDF was provided:
      if (!state.chunks || state.chunks.length === 0) {
        // Does rawText contain numbered questions like 1., 2., Q1, etc.?
        const hasNumberedQuestions = /(?:^|\n)\s*(?:Question|Problem|Q\.|Exercise|\d+[\.\)])/i.test(rawText);

        if (hasNumberedQuestions) {
          const chunkRes = await fetch('/api/chunk-text', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: rawText, source: "Pasted Notes" })
          });
          if (chunkRes.ok) {
            const chunkData = await chunkRes.json();
            state.chunks = chunkData.chunks || [];
          }
        }

        // Otherwise, synthesize a clear 4-phase guided roadmap for their goal
        if (!state.chunks || state.chunks.length === 0) {
          const roadRes = await fetch('/api/synthesize-roadmap', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ goal: immediateStudyGoal })
          });
          if (roadRes.ok) {
            const roadData = await roadRes.json();
            state.chunks = roadData.chunks || [];
          }
        }
      }

      // Failsafe: Ensure at least one chunk exists
      if (!state.chunks || state.chunks.length === 0) {
        state.chunks = [
          {
            id: "step_1",
            step_number: 1,
            title: "Phase 1: Problem Definition & Given Parameters",
            body: "Identify the problem requirements, given values, and target result to solve.",
            given_values: ["Target objective"],
            estimated_minutes: 10,
            source: "Guided Desk"
          }
        ];
      }

      // Launch Guided Study Desk
      state.currentIndex = 0;
      catchallSection.style.display = 'none';
      studyDeskSection.style.display = 'flex';
      setMobileView('reader');
      renderCurrentQuestion();
      saveBreadcrumbCheckpoint();
      startStudyTimer();
    } catch (err) {
      showNotice("Could not launch desk: " + err.message, "error");
    } finally {
      btnParseLaunch.disabled = false;
      btnParseLaunch.textContent = "Auto-Sort & Set Up Desk →";
    }
  });

  btnCatchallToggle.addEventListener('click', () => {
    catchallSection.style.display = 'block';
    studyDeskSection.style.display = 'none';
    pauseStudyTimer();
  });

  // --------------------------------------------------------------------------
  // PILLAR 2: Chunked Reader & Scratchpad Handlers
  // --------------------------------------------------------------------------
  function renderCurrentQuestion() {
    if (!state.chunks || state.chunks.length === 0) return;

    const chunk = state.chunks[state.currentIndex];
    const total = state.chunks.length;
    const stepNum = state.currentIndex + 1;

    // Header & breadcrumbs
    if (deskSessionTitle) deskSessionTitle.textContent = state.sessionTitle;
    if (deskActiveStepLabel) deskActiveStepLabel.textContent = `Question ${stepNum} of ${total}`;
    if (readerStepBadge) readerStepBadge.textContent = `Step ${stepNum} of ${total}`;
    if (readerEstTime) readerEstTime.textContent = `⏱️ ~${chunk.estimated_minutes || 10} min focus`;

    // Question heading & body
    if (readerQuestionTitle) readerQuestionTitle.textContent = chunk.title || `Question ${stepNum}`;
    if (readerQuestionBody) readerQuestionBody.textContent = chunk.body || "No question text available.";

    // Render extracted given values chips (e.g. 50Hz, 10 ohm)
    if (givenParamsList && givenParamsContainer) {
      givenParamsList.innerHTML = "";
      if (chunk.given_values && chunk.given_values.length > 0) {
        givenParamsContainer.style.display = 'flex';
        chunk.given_values.forEach(val => {
          const span = document.createElement('span');
          span.className = 'given-chip';
          span.textContent = val;
          givenParamsList.appendChild(span);
        });
      } else {
        givenParamsContainer.style.display = 'none';
      }
    }

    // Scratchpad notes restoration
    const qId = chunk.id || `q_${stepNum}`;
    scratchpadTextarea.value = state.answers[qId] || "";
    updateWordCount();

    // Progress bar
    const percent = Math.round((state.completedIds.size / total) * 100);
    if (deskProgressPercentage) deskProgressPercentage.textContent = `${percent}% Complete`;
    if (deskProgressFill) deskProgressFill.style.width = `${percent}%`;

    // Stepper navigation
    btnPrevQuestion.disabled = (state.currentIndex === 0);
    btnNextQuestion.disabled = (state.currentIndex === total - 1);

    if (state.completedIds.size === total) {
      btnMarkCompleted.textContent = "🎉 All Steps Complete!";
      btnMarkCompleted.style.opacity = '1';
    } else if (state.completedIds.has(qId)) {
      btnMarkCompleted.textContent = "✓ Completed";
      btnMarkCompleted.style.opacity = '0.7';
    } else {
      btnMarkCompleted.textContent = "✓ Mark Complete & Next";
      btnMarkCompleted.style.opacity = '1';
    }

    // Reset inline helper panels
    unstickDrawer.classList.add('hidden');
    thinkingFeedbackCard.style.display = 'none';
    state.isUnstickOpen = false;
  }

  btnPrevQuestion.addEventListener('click', () => {
    saveCurrentScratchpad();
    if (state.currentIndex > 0) {
      state.currentIndex--;
      renderCurrentQuestion();
      saveBreadcrumbCheckpoint();
    }
  });

  btnNextQuestion.addEventListener('click', () => {
    saveCurrentScratchpad();
    if (state.currentIndex < state.chunks.length - 1) {
      state.currentIndex++;
      renderCurrentQuestion();
      saveBreadcrumbCheckpoint();
    }
  });

  btnMarkCompleted.addEventListener('click', () => {
    saveCurrentScratchpad();
    const currentQ = state.chunks[state.currentIndex];
    const qId = currentQ.id || `q_${state.currentIndex + 1}`;
    state.completedIds.add(qId);
    const total = state.chunks.length;

    // If all tasks are completed, celebrate with ADHD-friendly completion modal!
    if (state.completedIds.size === total) {
      renderCurrentQuestion();
      saveBreadcrumbCheckpoint();
      showSessionCompletedModal();
      return;
    }

    if (state.currentIndex < total - 1) {
      state.currentIndex++;
    }
    renderCurrentQuestion();
    saveBreadcrumbCheckpoint();
  });

  // --------------------------------------------------------------------------
  // ADHD-Friendly Session Completed Celebration Handler
  // --------------------------------------------------------------------------
  function showSessionCompletedModal() {
    if (!modalSessionCompleted) return;
    const total = state.chunks ? state.chunks.length : 1;
    const completed = state.completedIds.size;

    // Calculate total word count in scratchpad answers
    let totalWords = 0;
    if (state.answers) {
      Object.values(state.answers).forEach(ans => {
        if (ans && typeof ans === 'string') {
          const words = ans.trim().split(/\s+/).filter(w => w.length > 0);
          totalWords += words.length;
        }
      });
    }

    const parkedCount = state.laterDrawer ? state.laterDrawer.length : 0;
    const unresolved = state.laterDrawer ? state.laterDrawer.filter(i => i.status !== 'completed').length : 0;

    if (compTotalSteps) compTotalSteps.textContent = `${completed} / ${total}`;
    if (compScratchpadWords) compScratchpadWords.textContent = `${totalWords} words`;
    if (compParkedThoughts) compParkedThoughts.textContent = `${parkedCount} thoughts`;

    if (compDrawerStatusNote) {
      if (unresolved > 0) {
        compDrawerStatusNote.textContent = `You safely shielded your working memory from ${parkedCount} distractions (${unresolved} remain parked in your Later Drawer for whenever you're ready). Zero lost focus.`;
      } else {
        compDrawerStatusNote.textContent = `Your assignment is 100% finished and your Later Drawer is clear. Your working memory is completely at peace!`;
      }
    }

    // Pause study timer
    pauseStudyTimer();

    modalSessionCompleted.classList.remove('hidden');
    showNotice("🎉 Fantastic focus! All assignment steps completed.", "info");
  }

  if (btnCloseCompletedModal) {
    btnCloseCompletedModal.addEventListener('click', () => {
      modalSessionCompleted.classList.add('hidden');
    });
  }

  if (btnCompReviewSteps) {
    btnCompReviewSteps.addEventListener('click', () => {
      modalSessionCompleted.classList.add('hidden');
    });
  }

  if (btnCompExport) {
    btnCompExport.addEventListener('click', () => {
      modalSessionCompleted.classList.add('hidden');
      if (btnFooterExport) btnFooterExport.click();
    });
  }

  if (btnCompNewSession) {
    btnCompNewSession.addEventListener('click', () => {
      modalSessionCompleted.classList.add('hidden');
      if (btnCatchallToggle) btnCatchallToggle.click();
    });
  }

  // Scratchpad Autosave & Word Count
  function saveCurrentScratchpad() {
    if (!state.chunks || state.chunks.length === 0) return;
    const currentQ = state.chunks[state.currentIndex];
    const qId = currentQ.id || `q_${state.currentIndex + 1}`;
    state.answers[qId] = scratchpadTextarea.value;
  }

  scratchpadTextarea.addEventListener('input', () => {
    saveCurrentScratchpad();
    updateWordCount();
    scratchpadAutosaveStatus.textContent = "Editing...";

    clearTimeout(state.autoSaveTimer);
    state.autoSaveTimer = setTimeout(() => {
      saveBreadcrumbCheckpoint();
      scratchpadAutosaveStatus.textContent = "Saved locally";
    }, 1200);
  });

  function updateWordCount() {
    const text = scratchpadTextarea.value.trim();
    const words = text ? text.split(/\s+/).length : 0;
    scratchpadCharCount.textContent = `${words} words`;
  }

  // Quick formula & structure insertion via minimalist dropdown
  if (scratchpadFormulaSelect) {
    scratchpadFormulaSelect.addEventListener('change', () => {
      const insertText = scratchpadFormulaSelect.value;
      if (insertText) {
        insertAtCursor(scratchpadTextarea, insertText);
        saveCurrentScratchpad();
        saveBreadcrumbCheckpoint();
        scratchpadFormulaSelect.selectedIndex = 0;
      }
    });
  }

  // In-Session Distraction Interceptor (In Desk Ribbon)
  function handleDeskParkDistraction() {
    if (!deskDistractionInput) return;
    const val = deskDistractionInput.value.trim();
    if (!val) return;

    state.laterDrawer.push({
      id: `distract_${Date.now()}`,
      title: val.charAt(0).toUpperCase() + val.slice(1),
      category: "distraction",
      estimated_minutes: 5,
      is_quick_win: true,
      agent_reasoning: "Intercepted in-session thought. Stored in Later Drawer so your working memory stays on the current problem.",
      suggested_window: "Post-Session Window",
      starter_action: "Execute after finishing current assignment.",
      status: "parked"
    });

    deskDistractionInput.value = "";
    updateLaterDrawerBadge();
    saveBreadcrumbCheckpoint();
    showNotice(`🤖 Shielded: "${val}" parked into Later Drawer!`, "info");
  }

  if (btnDeskParkDistraction) {
    btnDeskParkDistraction.addEventListener('click', handleDeskParkDistraction);
  }
  if (deskDistractionInput) {
    deskDistractionInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleDeskParkDistraction();
      }
    });
  }

  function insertAtCursor(textarea, text) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const val = textarea.value;
    textarea.value = val.substring(0, start) + text + val.substring(end);
    textarea.selectionStart = textarea.selectionEnd = start + text.length;
    textarea.focus();
    updateWordCount();
  }

  // --------------------------------------------------------------------------
  // PILLAR 3: "Unstick Me" Scaffolding Helper Handlers
  // --------------------------------------------------------------------------
  btnUnstickTrigger.addEventListener('click', async () => {
    if (!state.chunks || state.chunks.length === 0) return;

    if (state.isUnstickOpen) {
      unstickDrawer.classList.add('hidden');
      state.isUnstickOpen = false;
      return;
    }

    unstickDrawer.classList.remove('hidden');
    state.isUnstickOpen = true;

    templateTextDisplay.textContent = "Generating custom fill-in-the-blank starter...";
    eli5TextDisplay.textContent = "Translating question into everyday terms...";
    microStepsList.innerHTML = "<li style='padding: 6px 0;'>Loading 3 micro-steps...</li>";

    const currentQ = state.chunks[state.currentIndex];
    const currentNotes = scratchpadTextarea.value;

    try {
      const res = await fetch('/api/unstick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: currentQ.body, notes: currentNotes })
      });
      if (res.ok) {
        const data = await res.json();
        templateTextDisplay.textContent = data.starter_template || "Template ready.";
        eli5TextDisplay.textContent = data.plain_english || "Plain English explanation ready.";

        microStepsList.innerHTML = "";
        (data.micro_steps || []).forEach((step, idx) => {
          const li = document.createElement('li');
          li.style.margin = "8px 0";
          li.style.display = "flex";
          li.style.alignItems = "center";
          li.style.gap = "8px";
          li.style.fontSize = "13px";
          li.innerHTML = `<input type="checkbox" id="mstep_${idx}"> <label for="mstep_${idx}">${step}</label>`;
          microStepsList.appendChild(li);
        });
      } else {
        templateTextDisplay.textContent = "Starter template ready to fill.";
      }
    } catch (e) {
      templateTextDisplay.textContent = "Template ready to fill.";
    }
  });

  btnCloseUnstick.addEventListener('click', () => {
    unstickDrawer.classList.add('hidden');
    state.isUnstickOpen = false;
  });

  // Switch unstick tabs
  document.querySelectorAll('.unstick-tab-btn').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.unstick-tab-btn').forEach(t => t.classList.remove('active'));
      document.getElementById('tab-template-content').classList.add('hidden');
      document.getElementById('tab-eli5-content').classList.add('hidden');
      document.getElementById('tab-micro-content').classList.add('hidden');

      tab.classList.add('active');
      const targetId = tab.getAttribute('data-tab') + '-content';
      const targetElem = document.getElementById(targetId);
      if (targetElem) targetElem.classList.remove('hidden');
    });
  });

  btnInsertTemplate.addEventListener('click', () => {
    const template = templateTextDisplay.textContent;
    if (template && !template.includes("Generating")) {
      scratchpadTextarea.value = (scratchpadTextarea.value ? scratchpadTextarea.value + "\n\n" : "") + template;
      saveCurrentScratchpad();
      saveBreadcrumbCheckpoint();
      unstickDrawer.classList.add('hidden');
      state.isUnstickOpen = false;
      scratchpadTextarea.focus();
    }
  });

  // Solution Checker ("Am I on track?")
  btnCheckThinking.addEventListener('click', async () => {
    if (!state.chunks || state.chunks.length === 0) return;
    const currentQ = state.chunks[state.currentIndex];
    const currentNotes = scratchpadTextarea.value.trim();

    if (!currentNotes) {
      thinkingFeedbackText.textContent = "Your scratchpad is empty! Click 'Make This Easier' to insert a template or write down your given values first.";
      thinkingFeedbackCard.style.display = 'block';
      return;
    }

    btnCheckThinking.disabled = true;
    btnCheckThinking.textContent = "Checking...";

    try {
      const res = await fetch('/api/check-thinking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: currentQ.body, notes: currentNotes })
      });
      if (res.ok) {
        const data = await res.json();
        thinkingFeedbackText.textContent = data.feedback || "Good progress, keep going!";
      } else {
        thinkingFeedbackText.textContent = "You're on the right track! Review the units and proceed to calculate the final value.";
      }
      thinkingFeedbackCard.style.display = 'block';
    } catch (e) {
      thinkingFeedbackText.textContent = "You are on the right track! Ensure your formulas match the given values.";
      thinkingFeedbackCard.style.display = 'block';
    } finally {
      btnCheckThinking.disabled = false;
      btnCheckThinking.textContent = "💬 Am I on track?";
    }
  });

  btnCloseThinking.addEventListener('click', () => {
    thinkingFeedbackCard.style.display = 'none';
  });

  // --------------------------------------------------------------------------
  // PILLAR 4: Automatic Mental Breadcrumb Recovery Handlers
  // --------------------------------------------------------------------------
  async function saveBreadcrumbCheckpoint() {
    if (!state.chunks || state.chunks.length === 0) return;
    const currentQ = state.chunks[state.currentIndex];
    if (!currentQ) return;

    const payload = {
      current_question_index: state.currentIndex,
      current_question_title: currentQ.title || `Question ${state.currentIndex + 1}`,
      scratchpad_text: scratchpadTextarea.value,
      completed_question_ids: Array.from(state.completedIds),
      session_title: state.sessionTitle,
      later_drawer_items: state.laterDrawer
    };

    try {
      await fetch('/api/breadcrumb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (e) {
      console.warn("Breadcrumb save error:", e);
    }
  }

  async function checkSavedBreadcrumb(silent = true) {
    try {
      const res = await fetch('/api/breadcrumb');
      if (!res.ok) return;
      const data = await res.json();
      if (data.has_breadcrumb && data.breadcrumb) {
        const bc = data.breadcrumb;
        resumeCompletedVal.textContent = (bc.completed_question_ids && bc.completed_question_ids.length > 0)
          ? `${bc.completed_question_ids.length} Steps Completed (Safely Saved)`
          : "Fresh session ready";
        resumeStoppedVal.textContent = bc.current_question_title || "Question 1";
        resumeNotesSnippet.textContent = bc.scratchpad_text 
          ? `Last note: "${bc.scratchpad_text.substring(0, 80)}..."` 
          : "(No notes typed yet)";
        resumeNextActionVal.textContent = bc.next_action || "Continue with the current problem.";

        if (!silent) {
          modalResumeCard.classList.remove('hidden');
        }
      }
    } catch (e) {
      console.warn("Breadcrumb check error:", e);
    }
  }

  btnManualResume.addEventListener('click', () => {
    saveBreadcrumbCheckpoint();
    checkSavedBreadcrumb(false);
  });

  if (btnCloseResumeModal) {
    btnCloseResumeModal.addEventListener('click', () => {
      modalResumeCard.classList.add('hidden');
    });
  }

  btnResumeContinue.addEventListener('click', () => {
    modalResumeCard.classList.add('hidden');
    if (catchallSection.style.display !== 'none') {
      btnParseLaunch.click();
    }
  });

  btnResumeUnstick.addEventListener('click', () => {
    modalResumeCard.classList.add('hidden');
    if (catchallSection.style.display !== 'none') {
      btnParseLaunch.click();
    }
    setTimeout(() => {
      if (!state.isUnstickOpen) btnUnstickTrigger.click();
    }, 500);
  });

  btnResumeSwitchLight.addEventListener('click', () => {
    modalResumeCard.classList.add('hidden');
    modalLaterDrawer.classList.remove('hidden');
  });

  // --------------------------------------------------------------------------
  // LATER DRAWER MODAL
  // --------------------------------------------------------------------------
  function updateLaterDrawerBadge() {
    const count = state.laterDrawer.length;
    if (laterCountBadge) laterCountBadge.textContent = count;
    const footerCount = document.getElementById('footer-later-count');
    if (footerCount) footerCount.textContent = count;
    if (drawerShieldHeading) {
      drawerShieldHeading.textContent = `${count} Distractions Intercepted & Safely Parked`;
    }
    renderLaterDrawerItems();
  }

  function renderLaterDrawerItems() {
    if (!laterDrawerItemsList) return;
    laterDrawerItemsList.innerHTML = "";
    if (state.laterDrawer.length === 0) {
      laterDrawerItemsList.innerHTML = '<div style="color: var(--text-muted); font-size: 13px; padding: 24px 0; text-align: center;">No intrusive thoughts parked. Your working memory is clear and calm!</div>';
      return;
    }

    state.laterDrawer.forEach((item, index) => {
      const card = document.createElement('div');
      const isDone = item.status === 'completed';
      card.className = `parked-task-card ${isDone ? 'completed' : ''}`;
      
      const catBadge = item.category ? `🏷️ ${item.category}` : '🏷️ task';
      const estBadge = `⏱️ ~${item.estimated_minutes || 5} min`;
      const quickBadge = item.is_quick_win ? '<span style="color: var(--accent-sage); font-weight: 600; font-size: 11px;">⚡ Quick Win</span>' : '';
      const windowBadge = item.suggested_window ? `<span style="color: var(--accent-ochre); font-size: 11px;">🕒 ${item.suggested_window}</span>` : '';
      
      const reasoningHtml = item.agent_reasoning 
        ? `<div class="parked-task-reasoning">🤖 <strong>Agent Shield:</strong> ${item.agent_reasoning}</div>` 
        : '';
        
      const starterHtml = item.starter_action 
        ? `<div class="parked-task-starter">⚡ <strong>Starter:</strong> ${item.starter_action}</div>` 
        : '';

      card.innerHTML = `
        <div style="flex: 1; cursor: pointer;" class="parked-task-clickable" data-index="${index}" title="Click to start full-screen timer">
          <div style="display: flex; align-items: center; gap: 8px;">
            <input type="checkbox" class="later-check-done" data-index="${index}" ${isDone ? 'checked' : ''} title="Mark done">
            <span class="parked-task-name" style="${isDone ? 'text-decoration: line-through; opacity: 0.6;' : ''}">${item.title}</span>
          </div>
          <div class="parked-task-meta" style="margin-left: 24px; margin-top: 4px;">
            <span>${catBadge}</span>
            <span>${estBadge}</span>
            ${quickBadge}
            ${windowBadge}
          </div>
          <div style="margin-left: 24px;">
            ${reasoningHtml}
            ${starterHtml}
          </div>
        </div>
        <div style="display: flex; flex-direction: column; gap: 6px; justify-content: center;">
          <button class="btn btn-accent btn-start-focus-timer" data-index="${index}" style="font-size: 11px; padding: 5px 12px; white-space: nowrap;">
            ⏱️ Start Timer
          </button>
        </div>
      `;
      laterDrawerItemsList.appendChild(card);
    });

    // Checkbox toggles (stops propagation so clicking checkbox doesn't launch timer)
    document.querySelectorAll('.later-check-done').forEach(cb => {
      cb.addEventListener('click', (e) => e.stopPropagation());
      cb.addEventListener('change', (e) => {
        const idx = parseInt(e.target.getAttribute('data-index'), 10);
        state.laterDrawer[idx].status = e.target.checked ? 'completed' : 'parked';
        updateLaterDrawerBadge();
        saveBreadcrumbCheckpoint();
      });
    });

    // Start full-screen timer from button click
    document.querySelectorAll('.btn-start-focus-timer').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(e.target.getAttribute('data-index'), 10);
        openFullScreenTimer(state.laterDrawer[idx], idx);
      });
    });

    // Start full-screen timer from clicking task card body
    document.querySelectorAll('.parked-task-clickable').forEach(el => {
      el.addEventListener('click', () => {
        const idx = parseInt(el.getAttribute('data-index'), 10);
        openFullScreenTimer(state.laterDrawer[idx], idx);
      });
    });
  }

  // --------------------------------------------------------------------------
  // Full-Screen Focus / Break Timer Logic (ADHD Shield + Negative Overtime)
  // --------------------------------------------------------------------------
  function formatTimerSeconds(totalSeconds) {
    const isNegative = totalSeconds < 0;
    const abs = Math.abs(totalSeconds);
    const m = Math.floor(abs / 60);
    const s = abs % 60;
    return `${isNegative ? '-' : ''}${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function renderFocusTimerDisplay() {
    if (!focusCountdownDisplay) return;
    const formatted = formatTimerSeconds(focusTimerSeconds);
    focusCountdownDisplay.textContent = formatted;

    const isNegative = focusTimerSeconds < 0;
    if (isNegative) {
      focusCountdownDisplay.classList.add('overtime');
      if (focusTimerStatus) focusTimerStatus.classList.add('overtime');
      if (focusStatusIcon) focusStatusIcon.textContent = "⚠️";
      if (focusTimerStatusText) {
        focusTimerStatusText.textContent = `Overtime (${formatted}) — Take your time, wrap up gently without stress!`;
      }
    } else {
      focusCountdownDisplay.classList.remove('overtime');
      if (focusTimerStatus) focusTimerStatus.classList.remove('overtime');
      if (focusStatusIcon) {
        focusStatusIcon.textContent = isFocusTimerPaused ? "⏸" : "⏳";
      }
      if (focusTimerStatusText) {
        focusTimerStatusText.textContent = isFocusTimerPaused
          ? "Timer paused — take a calm breath"
          : "Timer running — stay present and recharge";
      }
    }
  }

  function openFullScreenTimer(item, index) {
    if (!fullscreenFocusTimer) return;
    activeFocusTask = item;
    activeFocusTaskIndex = index;

    // Determine estimated duration (default: 2 minutes for quick dopamine break, or item.estimated_minutes)
    const est = item && item.estimated_minutes && !isNaN(item.estimated_minutes)
      ? parseInt(item.estimated_minutes, 10)
      : 2;
    focusInitialSeconds = Math.max(1, est) * 60;
    focusTimerSeconds = focusInitialSeconds;
    isFocusTimerPaused = false;

    // Populate elements
    if (focusTaskTitle) focusTaskTitle.textContent = item.title || "Quick Focus Break";
    if (focusTaskCategory) focusTaskCategory.textContent = item.category ? `🏷️ ${item.category}` : '🏷️ Quick Break';
    if (focusTaskWindow) {
      focusTaskWindow.textContent = item.suggested_window 
        ? `🕒 ${item.suggested_window}` 
        : (item.is_quick_win ? '⚡ Quick Win' : '🕒 In-Session Break');
    }
    if (focusTaskStarter) {
      focusTaskStarter.textContent = item.starter_action || "Step away from screen, hydrate, and stretch.";
    }
    if (focusTaskReasoning) {
      focusTaskReasoning.textContent = item.agent_reasoning 
        ? `🛡️ Agent Advice: ${item.agent_reasoning}` 
        : "🛡️ Cognitive Shield: 2-minute reset protects your working memory from mental fatigue.";
    }
    if (btnTimerPauseResume) btnTimerPauseResume.textContent = "⏸ Pause";

    // Close later drawer modal
    if (modalLaterDrawer) modalLaterDrawer.classList.add('hidden');

    // Show full screen overlay
    fullscreenFocusTimer.classList.remove('hidden');

    // Render initial clock
    renderFocusTimerDisplay();

    // Start timer interval
    if (focusTimerInterval) clearInterval(focusTimerInterval);
    focusTimerInterval = setInterval(() => {
      if (!isFocusTimerPaused) {
        focusTimerSeconds--;
        renderFocusTimerDisplay();
      }
    }, 1000);
  }

  function stopFullScreenTimer() {
    if (focusTimerInterval) {
      clearInterval(focusTimerInterval);
      focusTimerInterval = null;
    }
    if (fullscreenFocusTimer) {
      fullscreenFocusTimer.classList.add('hidden');
    }
    // If returning from an in-session break, reset the study sprint timer for the next interval
    if (activeFocusTaskIndex === -1) {
      studyTimerSeconds = studyTimerPresetSeconds;
      isStudyTimerPaused = false;
      renderStudyTimerDisplay();
      startStudyTimer();
    }
  }

  // Timer Action Buttons
  if (btnFocusTaskCompleted) {
    btnFocusTaskCompleted.addEventListener('click', () => {
      const isBreak = (activeFocusTaskIndex === -1);
      if (activeFocusTaskIndex >= 0 && state.laterDrawer[activeFocusTaskIndex]) {
        state.laterDrawer[activeFocusTaskIndex].status = 'completed';
      } else if (activeFocusTask && !isBreak) {
        activeFocusTask.status = 'completed';
      }
      const completedTitle = activeFocusTask ? activeFocusTask.title : "Task";
      stopFullScreenTimer();
      updateLaterDrawerBadge();
      saveBreadcrumbCheckpoint();
      if (isBreak) {
        showNotice("✓ Recharge break complete! Returning to study desk feeling refreshed.", "info");
      } else {
        showNotice(`✓ "${completedTitle}" completed! Great job taking care of your brain.`, "info");
      }
    });
  }

  if (btnFocusTaskRepeat) {
    btnFocusTaskRepeat.addEventListener('click', () => {
      focusTimerSeconds = focusInitialSeconds;
      isFocusTimerPaused = false;
      if (btnTimerPauseResume) btnTimerPauseResume.textContent = "⏸ Pause";
      renderFocusTimerDisplay();
      if (!focusTimerInterval) {
        focusTimerInterval = setInterval(() => {
          if (!isFocusTimerPaused) {
            focusTimerSeconds--;
            renderFocusTimerDisplay();
          }
        }, 1000);
      }
      const mins = Math.round(focusInitialSeconds / 60);
      showNotice(`🔄 Timer reset to ${mins} min. Let's do this!`, "info");
    });
  }

  if (btnTimerPauseResume) {
    btnTimerPauseResume.addEventListener('click', () => {
      isFocusTimerPaused = !isFocusTimerPaused;
      btnTimerPauseResume.textContent = isFocusTimerPaused ? "▶ Resume" : "⏸ Pause";
      renderFocusTimerDisplay();
    });
  }

  if (btnTimerSub1m) {
    btnTimerSub1m.addEventListener('click', () => {
      focusTimerSeconds -= 60;
      renderFocusTimerDisplay();
    });
  }

  if (btnTimerAdd1m) {
    btnTimerAdd1m.addEventListener('click', () => {
      focusTimerSeconds += 60;
      renderFocusTimerDisplay();
    });
  }

  if (btnCloseFocusTimer) {
    btnCloseFocusTimer.addEventListener('click', () => {
      stopFullScreenTimer();
      showNotice("Returned to desk. Task remains parked in Later Drawer.", "info");
    });
  }

  // Keyboard Escape shortcut for full-screen timer
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && fullscreenFocusTimer && !fullscreenFocusTimer.classList.contains('hidden')) {
      stopFullScreenTimer();
    }
  });

  // --------------------------------------------------------------------------
  // Minimal Study Focus Sprint Timer & Break Prompt Handling
  // --------------------------------------------------------------------------
  function renderStudyTimerDisplay() {
    if (!studyFocusDigits) return;
    const m = Math.floor(studyTimerSeconds / 60);
    const s = studyTimerSeconds % 60;
    studyFocusDigits.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

    if (studyFocusDot) {
      if (isStudyTimerPaused) {
        studyFocusDot.classList.add('paused');
      } else {
        studyFocusDot.classList.remove('paused');
      }
    }

    if (btnStudyTimerToggle) {
      btnStudyTimerToggle.textContent = isStudyTimerPaused ? "▶" : "⏸";
      btnStudyTimerToggle.title = isStudyTimerPaused ? "Resume Study Sprint" : "Pause Study Sprint";
    }
  }

  function startStudyTimer() {
    if (studyTimerInterval) clearInterval(studyTimerInterval);
    renderStudyTimerDisplay();
    studyTimerInterval = setInterval(() => {
      if (!isStudyTimerPaused && studyDeskSection && studyDeskSection.style.display !== 'none') {
        studyTimerSeconds--;
        if (studyTimerSeconds <= 0) {
          studyTimerSeconds = 0;
          renderStudyTimerDisplay();
          onStudySprintFinished();
        } else {
          renderStudyTimerDisplay();
        }
      }
    }, 1000);
  }

  function pauseStudyTimer() {
    isStudyTimerPaused = true;
    renderStudyTimerDisplay();
  }

  function resumeStudyTimer() {
    isStudyTimerPaused = false;
    renderStudyTimerDisplay();
  }

  function onStudySprintFinished() {
    pauseStudyTimer();
    if (modalBreakPrompt) {
      modalBreakPrompt.classList.remove('hidden');
    }
    showNotice("☕ Focus sprint complete! Time to pick a 1–5 min recharge break.", "info");
  }

  // Toggle study timer
  if (btnStudyTimerToggle) {
    btnStudyTimerToggle.addEventListener('click', () => {
      isStudyTimerPaused = !isStudyTimerPaused;
      renderStudyTimerDisplay();
    });
  }

  // Change focus sprint preset (10m, 15m, 20m, 25m, 30m, 45m)
  if (studyFocusPresetSelect) {
    studyFocusPresetSelect.addEventListener('change', (e) => {
      const mins = parseInt(e.target.value, 10) || 25;
      studyTimerPresetSeconds = mins * 60;
      studyTimerSeconds = studyTimerPresetSeconds;
      renderStudyTimerDisplay();
      showNotice(`Study sprint set to ${mins} minutes.`, "info");
    });
  }

  // Break choice click (1 – 5 mins)
  document.querySelectorAll('.break-choice-card').forEach(card => {
    card.addEventListener('click', () => {
      const mins = parseInt(card.getAttribute('data-minutes'), 10) || 3;
      if (modalBreakPrompt) modalBreakPrompt.classList.add('hidden');

      const breakActionGuide = {
        1: "Close your eyes, breathe in for 4 seconds, hold, and exhale slowly.",
        2: "Drink a tall glass of cold water and roll your shoulders back.",
        3: "Stand up from desk, look out the window at something far away, and stretch.",
        4: "Take a gentle walk around your room, shake out your hands, and loosen your neck.",
        5: "Step completely away from your study desk, stretch your legs, and let your mind wander."
      };

      openFullScreenTimer({
        id: `break_${Date.now()}`,
        title: `☕ ${mins}-Minute Brain Recharge & Dopamine Reset`,
        category: "Recharge",
        suggested_window: "In-Session Rest",
        starter_action: breakActionGuide[mins] || "Hydrate, breathe, and stretch.",
        agent_reasoning: "Cognitive science shows 1-5 min diffuse-mode breaks let your brain synthesize newly learned concepts.",
        estimated_minutes: mins
      }, -1);
    });
  });

  // Skip break button
  if (btnSkipBreak) {
    btnSkipBreak.addEventListener('click', () => {
      if (modalBreakPrompt) modalBreakPrompt.classList.add('hidden');
      studyTimerSeconds = studyTimerPresetSeconds;
      isStudyTimerPaused = false;
      renderStudyTimerDisplay();
      showNotice("Study sprint restarted. Keep up the great work!", "info");
    });
  }

  // Extend study (+5 min)
  if (btnExtendStudy) {
    btnExtendStudy.addEventListener('click', () => {
      if (modalBreakPrompt) modalBreakPrompt.classList.add('hidden');
      studyTimerSeconds += 300;
      isStudyTimerPaused = false;
      renderStudyTimerDisplay();
      showNotice("+5 minutes added to study sprint. Flow state active!", "info");
    });
  }

  // Close break prompt
  if (btnCloseBreakPrompt) {
    btnCloseBreakPrompt.addEventListener('click', () => {
      if (modalBreakPrompt) modalBreakPrompt.classList.add('hidden');
    });
  }

  // Agent Smart Triage Handler
  if (btnAgentTriageDrawer) {
    btnAgentTriageDrawer.addEventListener('click', async () => {
      if (state.laterDrawer.length === 0) {
        showNotice("No parked thoughts to triage right now.", "info");
        return;
      }

      btnAgentTriageDrawer.disabled = true;
      btnAgentTriageDrawer.textContent = "🤖 Sequencing by energy...";

      try {
        const res = await fetch('/api/triage-drawer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: state.laterDrawer,
            completed_steps: state.completedIds.size,
            total_steps: state.chunks.length
          })
        });

        if (res.ok) {
          const data = await res.json();
          if (agentTriageAdviceBox && agentTriageAdviceText) {
            agentTriageAdviceText.textContent = data.agent_advice || "Tasks sequenced by energy level.";
            agentTriageAdviceBox.classList.remove('hidden');
          }

          // Order items: quick wins first, then post-session, then evening rest
          const reordered = [
            ...(data.quick_wins || []),
            ...(data.post_session || []),
            ...(data.evening_rest || [])
          ];
          if (reordered.length > 0) {
            state.laterDrawer = reordered;
            renderLaterDrawerItems();
          }
        }
      } catch (err) {
        console.warn("Triage failed:", err);
      } finally {
        btnAgentTriageDrawer.disabled = false;
        btnAgentTriageDrawer.textContent = "🤖 Agent Smart Triage";
      }
    });
  }

  if (btnOpenLaterDrawer) {
    btnOpenLaterDrawer.addEventListener('click', () => {
      renderLaterDrawerItems();
      modalLaterDrawer.classList.remove('hidden');
    });
  }

  const btnFooterLater = document.getElementById('btn-footer-later');
  if (btnFooterLater) {
    btnFooterLater.addEventListener('click', () => {
      if (btnOpenLaterDrawer) btnOpenLaterDrawer.click();
      else {
        renderLaterDrawerItems();
        modalLaterDrawer.classList.remove('hidden');
      }
    });
  }

  btnCloseLaterModal.addEventListener('click', () => modalLaterDrawer.classList.add('hidden'));
  btnDoneLaterModal.addEventListener('click', () => modalLaterDrawer.classList.add('hidden'));

  // Quick note inline add in Later Drawer
  if (btnAddQuickLater && quickAddInputRow && btnSaveQuickLater && quickLaterInput) {
    btnAddQuickLater.addEventListener('click', () => {
      quickAddInputRow.style.display = (quickAddInputRow.style.display === 'none') ? 'flex' : 'none';
      if (quickAddInputRow.style.display === 'flex') {
        quickLaterInput.focus();
      }
    });

    const handleSaveNote = () => {
      const val = quickLaterInput.value.trim();
      if (val) {
        state.laterDrawer.push({
          id: `distract_${Date.now()}`,
          title: val.charAt(0).toUpperCase() + val.slice(1),
          category: "personal",
          estimated_minutes: 5,
          is_quick_win: true,
          agent_reasoning: "Manually parked thought. Preserved in drawer so you can finish your study streak.",
          suggested_window: "Post-Study Window",
          starter_action: "Execute during break or post-session.",
          status: "parked"
        });
        quickLaterInput.value = "";
        quickAddInputRow.style.display = 'none';
        updateLaterDrawerBadge();
        saveBreadcrumbCheckpoint();
      }
    };

    btnSaveQuickLater.addEventListener('click', handleSaveNote);
    quickLaterInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleSaveNote();
    });
  }

  // --------------------------------------------------------------------------
  // BENCHMARK MODAL (3 REPEAT RUNS)
  // --------------------------------------------------------------------------
  if (btnOpenBenchmark) {
    btnOpenBenchmark.addEventListener('click', () => {
      modalBenchmark.classList.remove('hidden');
    });
  }
  btnCloseBenchmarkModal.addEventListener('click', () => modalBenchmark.classList.add('hidden'));
  btnDoneBenchmark.addEventListener('click', () => modalBenchmark.classList.add('hidden'));

  btnRunBenchmarkNow.addEventListener('click', async () => {
    btnRunBenchmarkNow.disabled = true;
    btnRunBenchmarkNow.textContent = "Running 3 Repeat Passes...";

    try {
      const res = await fetch('/api/benchmark', { method: 'POST' });
      if (!res.ok) throw new Error("Benchmark run failed with status " + res.status);
      const data = await res.json();
      
      const tbody = document.getElementById('benchmark-table-body');
      tbody.innerHTML = "";

      (data.metrics.runs || []).forEach(r => {
        const tr = document.createElement('tr');
        tr.style.borderBottom = "1px solid var(--border-hairline)";
        tr.innerHTML = `
          <td style="padding: 6px;"><strong>#${r.run_id}</strong></td>
          <td style="padding: 6px;">${r.name}</td>
          <td style="padding: 6px;">${r.latency_ms} ms</td>
          <td style="padding: 6px;"><strong>${r.tokens_per_sec} tok/s</strong></td>
          <td style="padding: 6px; color: ${r.success ? 'var(--accent-sage)' : 'var(--accent-terracotta)'}; font-weight: 600;">
            ${r.success ? 'PASS ✓' : 'FAIL ✕'}
          </td>
        `;
        tbody.appendChild(tr);
      });

      document.getElementById('bm-avg-speed').textContent = `${data.metrics.avg_tokens_per_sec} tokens/sec`;
      document.getElementById('bm-success-rate').textContent = data.metrics.task_success_rate;
      document.getElementById('bm-model-runtime').textContent = `${data.model_details.name} (${data.model_details.runtime})`;

      document.getElementById('benchmark-results-container').style.display = 'block';
    } catch (e) {
      alert("Benchmark execution notice: " + e.message);
    } finally {
      btnRunBenchmarkNow.disabled = false;
      btnRunBenchmarkNow.textContent = "▶️ Re-Run Benchmark";
    }
  });

  // --------------------------------------------------------------------------
  // EXPORT MODAL
  // --------------------------------------------------------------------------
  async function openExportModal() {
    saveCurrentScratchpad();
    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_title: state.sessionTitle,
          chunks: state.chunks,
          answers: state.answers
        })
      });
      if (res.ok) {
        const data = await res.json();
        exportMarkdownContent.value = data.markdown || "No content recorded.";
      } else {
        exportMarkdownContent.value = `# ${state.sessionTitle}\n\n*Progress recorded locally.*`;
      }
      modalExport.classList.remove('hidden');
    } catch (e) {
      exportMarkdownContent.value = `# ${state.sessionTitle}\n\n*Progress recorded locally.*`;
      modalExport.classList.remove('hidden');
    }
  }

  if (btnExportSession) {
    btnExportSession.addEventListener('click', openExportModal);
  }
  if (btnFooterExport) {
    btnFooterExport.addEventListener('click', openExportModal);
  }

  btnCloseExportModal.addEventListener('click', () => modalExport.classList.add('hidden'));

  btnCopyExport.addEventListener('click', () => {
    exportMarkdownContent.select();
    try {
      navigator.clipboard.writeText(exportMarkdownContent.value);
    } catch (e) {
      document.execCommand('copy');
    }
    btnCopyExport.textContent = "Copied!";
    setTimeout(() => btnCopyExport.textContent = "Copy to Clipboard", 1500);
  });

  btnDownloadExport.addEventListener('click', () => {
    const blob = new Blob([exportMarkdownContent.value], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(state.sessionTitle || "FocusMate_Session").replace(/\s+/g, '_')}_solution.md`;
    a.click();
    URL.revokeObjectURL(url);
  });

  // --------------------------------------------------------------------------
  // Backdrop Click & Keyboard Shortcuts
  // --------------------------------------------------------------------------
  document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        backdrop.classList.add('hidden');
      }
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-backdrop').forEach(b => b.classList.add('hidden'));
      unstickDrawer.classList.add('hidden');
      state.isUnstickOpen = false;
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      btnMarkCompleted.click();
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
      e.preventDefault();
      btnUnstickTrigger.click();
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      saveBreadcrumbCheckpoint();
      scratchpadAutosaveStatus.textContent = "Checkpointed (Ctrl+S)";
    }
  });

  // --------------------------------------------------------------------------
  // Startup
  // --------------------------------------------------------------------------
  checkSystemStatus();
  checkSavedBreadcrumb(true);
});

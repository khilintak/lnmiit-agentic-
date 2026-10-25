/**
 * FocusMate Local — Guided Study & Work Desk Client
 * Implements the 4 Practical Pillars:
 * 1. Universal Catch-All (Mixed brain dump & PDF partitioning)
 * 2. Chunked Reader & Scratchpad (Atomic steps)
 * 3. Unstick Me Scaffolding (ELI5, Fill-in-blank starter, Micro-steps)
 * 4. Automatic Mental Breadcrumb Recovery (Zero-effort session resume)
 */

document.addEventListener('DOMContentLoaded', () => {
  // --------------------------------------------------------------------------
  // Application State
  // --------------------------------------------------------------------------
  const state = {
    sessionTitle: "EEE Lab Assignment 4",
    chunks: [],
    currentIndex: 0,
    answers: {},
    completedIds: new Set(),
    laterDrawer: [],
    uploadedPdfFile: null,
    autoSaveTimer: null,
    isUnstickOpen: false,
    activeTab: 'tab-template',
    ollamaOnline: false,
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
  const btnParseLaunch = document.getElementById('btn-parse-and-launch');
  const btnCatchallToggle = document.getElementById('btn-catchall-toggle');

  // Reader elements
  const readerStepBadge = document.getElementById('reader-step-badge');
  const readerEstTime = document.getElementById('reader-est-time');
  const readerQuestionTitle = document.getElementById('reader-question-title');
  const readerQuestionBody = document.getElementById('reader-question-body');
  const deskActiveStepLabel = document.getElementById('desk-active-step-label');
  const deskProgressPercentage = document.getElementById('desk-progress-percentage');
  const deskProgressFill = document.getElementById('desk-progress-fill');
  const btnPrevQuestion = document.getElementById('btn-prev-question');
  const btnNextQuestion = document.getElementById('btn-next-question');
  const btnMarkCompleted = document.getElementById('btn-mark-completed');

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

  // Modals
  const modalLaterDrawer = document.getElementById('modal-later-drawer');
  const btnOpenLaterDrawer = document.getElementById('btn-open-later-drawer');
  const btnCloseLaterModal = document.getElementById('btn-close-later-modal');
  const btnDoneLaterModal = document.getElementById('btn-done-later-modal');
  const laterDrawerCount = document.getElementById('later-drawer-count');
  const laterDrawerItemsList = document.getElementById('later-drawer-items-list');

  const modalResumeCard = document.getElementById('modal-resume-card');
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

  // --------------------------------------------------------------------------
  // System Status & Hardware Check
  // --------------------------------------------------------------------------
  async function checkSystemStatus() {
    try {
      const res = await fetch('/api/system-status');
      const data = await res.json();
      const indicator = document.getElementById('ollama-indicator');
      const statusText = document.getElementById('ollama-status-text');
      const speedValue = document.getElementById('speed-value');

      state.ollamaOnline = data.ollama_online;
      if (data.ollama_online) {
        indicator.classList.remove('offline');
        statusText.textContent = `Ollama: ${data.active_model}`;
        speedValue.textContent = 'Active (GPU)';
      } else {
        indicator.classList.add('offline');
        statusText.textContent = 'Built-in Cognitive Engine (Offline)';
        speedValue.textContent = 'Instant (Local)';
      }
    } catch (e) {
      console.warn('System status fetch failed:', e);
    }
  }

  // --------------------------------------------------------------------------
  // PILLAR 1: Universal Catch-All Handlers
  // --------------------------------------------------------------------------
  document.getElementById('pill-sample-dump').addEventListener('click', () => {
    catchallInput.value = "Finish EEE Lab Assignment 4 by 6:00 PM, buy notebook and highlighters from campus shop, call mom after 5 PM, revise resonance formulas in Chapter 2, pay electricity bill, drink water, message Ankur regarding lab reading values";
    catchallInput.focus();
  });

  document.getElementById('pill-sample-pdf').addEventListener('click', async () => {
    try {
      pdfFileName.textContent = "Loading sample_assignment.pdf...";
      const res = await fetch('/sample_data/sample_assignment.pdf');
      if (res.ok) {
        const blob = await res.blob();
        state.uploadedPdfFile = new File([blob], "Khilin_Tak_EEE_LAB-4.pdf", { type: "application/pdf" });
        pdfFileName.textContent = "Selected: Khilin_Tak_EEE_LAB-4.pdf (Ready to Chunk)";
      }
    } catch (err) {
      pdfFileName.textContent = "Sample PDF selected (Ready)";
    }
  });

  // Voice Dictation
  const pillMicDictate = document.getElementById('pill-mic-dictate');
  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    state.speechRecognition = new SpeechRecognition();
    state.speechRecognition.continuous = false;
    state.speechRecognition.interimResults = false;

    state.speechRecognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      catchallInput.value += (catchallInput.value ? ", " : "") + transcript;
      pillMicDictate.textContent = "🎙️ Voice Dictate";
    };

    state.speechRecognition.onerror = () => {
      pillMicDictate.textContent = "🎙️ Voice Dictate";
    };

    pillMicDictate.addEventListener('click', () => {
      pillMicDictate.textContent = "🔴 Listening...";
      state.speechRecognition.start();
    });
  } else {
    pillMicDictate.style.display = 'none';
  }

  // PDF Dropzone
  pdfDropzone.addEventListener('click', () => pdfFileInput.click());
  pdfFileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      state.uploadedPdfFile = e.target.files[0];
      pdfFileName.textContent = `Selected: ${state.uploadedPdfFile.name}`;
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
      pdfFileName.textContent = `Selected: ${state.uploadedPdfFile.name}`;
    }
  });

  // Parse & Launch Study Desk
  btnParseLaunch.addEventListener('click', async () => {
    const rawText = catchallInput.value.trim();
    btnParseLaunch.disabled = true;
    btnParseLaunch.textContent = "Processing & Chunking...";

    try {
      // 1. Parse Catch-All thoughts into Immediate Study vs Later Reminders
      if (rawText) {
        const catchRes = await fetch('/api/catch-all', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ input_text: rawText })
        });
        const catchData = await catchRes.json();
        
        if (catchData.later_drawer) {
          state.laterDrawer = catchData.later_drawer;
          updateLaterDrawerBadge();
        }
      }

      // 2. Extract Questions from PDF or fallback text
      if (state.uploadedPdfFile) {
        const formData = new FormData();
        formData.append('file', state.uploadedPdfFile);

        const pdfRes = await fetch('/api/upload-pdf', {
          method: 'POST',
          body: formData
        });
        const pdfData = await pdfRes.json();
        if (pdfData.chunks && pdfData.chunks.length > 0) {
          state.chunks = pdfData.chunks;
          state.sessionTitle = pdfData.filename || "Assignment";
        }
      }

      // If no PDF uploaded, create questions from typed notes or default sample questions
      if (!state.chunks || state.chunks.length === 0) {
        const sampleText = rawText || "Question 1: In a series RLC circuit, R = 10 ohm, L = 0.1 H, C = 100 uF. Supply voltage is 230V at 50Hz. Calculate resonant frequency and current at resonance.\n\nQuestion 2: Define quality factor Q and explain its physical significance in resonance.\n\nQuestion 3: Calculate the reactive power Q and total impedance Z for an inductive load with V = 230V, I = 5A, and power factor = 0.8 lagging.";
        const chunkRes = await fetch('/api/chunk-text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: sampleText, source: "Intake Box" })
        });
        const chunkData = await chunkRes.json();
        state.chunks = chunkData.chunks || [];
      }

      // Switch view to Guided Study Desk
      state.currentIndex = 0;
      catchallSection.style.display = 'none';
      studyDeskSection.style.display = 'flex';
      renderCurrentQuestion();
      saveBreadcrumbCheckpoint();
    } catch (err) {
      alert("Error processing intake: " + err.message);
    } finally {
      btnParseLaunch.disabled = false;
      btnParseLaunch.textContent = "🚀 Auto-Sort & Open Guided Desk";
    }
  });

  btnCatchallToggle.addEventListener('click', () => {
    catchallSection.style.display = 'block';
    studyDeskSection.style.display = 'none';
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
    document.getElementById('desk-session-title').textContent = state.sessionTitle;
    deskActiveStepLabel.textContent = `Question ${stepNum} of ${total}`;
    readerStepBadge.textContent = `Step ${stepNum} of ${total}`;
    readerEstTime.textContent = `⏱️ ~${chunk.estimated_minutes || 10} min focus`;

    // Question content
    readerQuestionTitle.textContent = chunk.title || `Question ${stepNum}`;
    readerQuestionBody.textContent = chunk.body || "No text available.";

    // Scratchpad notes
    const qId = chunk.id || `q_${stepNum}`;
    scratchpadTextarea.value = state.answers[qId] || "";
    updateWordCount();

    // Progress bar
    const percent = Math.round((state.completedIds.size / total) * 100);
    deskProgressPercentage.textContent = `${percent}% Complete`;
    deskProgressFill.style.width = `${percent}%`;

    // Stepper buttons state
    btnPrevQuestion.disabled = (state.currentIndex === 0);
    btnNextQuestion.disabled = (state.currentIndex === total - 1);

    if (state.completedIds.has(qId)) {
      btnMarkCompleted.textContent = "✓ Completed";
      btnMarkCompleted.style.opacity = '0.7';
    } else {
      btnMarkCompleted.textContent = "✓ Mark Done & Next";
      btnMarkCompleted.style.opacity = '1';
    }

    // Hide unstick drawer when changing questions
    unstickDrawer.classList.add('hidden');
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

    if (state.currentIndex < state.chunks.length - 1) {
      state.currentIndex++;
    }
    renderCurrentQuestion();
    saveBreadcrumbCheckpoint();
  });

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
    scratchpadAutosaveStatus.textContent = "✏️ Editing...";

    clearTimeout(state.autoSaveTimer);
    state.autoSaveTimer = setTimeout(() => {
      saveBreadcrumbCheckpoint();
      scratchpadAutosaveStatus.textContent = "💾 Auto-saved to local memory";
    }, 1200);
  });

  function updateWordCount() {
    const text = scratchpadTextarea.value.trim();
    const words = text ? text.split(/\s+/).length : 0;
    scratchpadCharCount.textContent = `${words} words`;
  }

  // Quick insertion chips
  document.querySelectorAll('.tool-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const insertText = chip.getAttribute('data-insert');
      insertAtCursor(scratchpadTextarea, insertText + "\n");
      saveCurrentScratchpad();
      saveBreadcrumbCheckpoint();
    });
  });

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
    microStepsList.innerHTML = "<li>Loading 3 micro-steps...</li>";

    const currentQ = state.chunks[state.currentIndex];
    const currentNotes = scratchpadTextarea.value;

    try {
      const res = await fetch('/api/unstick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: currentQ.body, notes: currentNotes })
      });
      const data = await res.json();

      templateTextDisplay.textContent = data.starter_template || "Template generated.";
      eli5TextDisplay.textContent = data.plain_english || "Plain English explanation ready.";

      microStepsList.innerHTML = "";
      (data.micro_steps || []).forEach((step, idx) => {
        const li = document.createElement('li');
        li.style.margin = "6px 0";
        li.style.display = "flex";
        li.style.alignItems = "center";
        li.style.gap = "8px";
        li.innerHTML = `<input type="checkbox" id="mstep_${idx}"> <label for="mstep_${idx}">${step}</label>`;
        microStepsList.appendChild(li);
      });
    } catch (e) {
      templateTextDisplay.textContent = "Error generating scaffolding: " + e.message;
    }
  });

  btnCloseUnstick.addEventListener('click', () => {
    unstickDrawer.classList.add('hidden');
    state.isUnstickOpen = false;
  });

  // Switch unstick tabs
  document.querySelectorAll('.unstick-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.unstick-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.unstick-content').forEach(c => c.classList.add('hidden'));

      tab.classList.add('active');
      const targetId = tab.getAttribute('data-tab') + '-content';
      document.getElementById(targetId).classList.remove('hidden');
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

  // --------------------------------------------------------------------------
  // PILLAR 4: Automatic Mental Breadcrumb Recovery Handlers
  // --------------------------------------------------------------------------
  async function saveBreadcrumbCheckpoint() {
    if (!state.chunks || state.chunks.length === 0) return;
    const currentQ = state.chunks[state.currentIndex];
    
    const payload = {
      current_question_index: state.currentIndex,
      current_question_title: currentQ.title,
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
      console.warn("Failed to persist breadcrumb:", e);
    }
  }

  async function checkSavedBreadcrumbOnStartup() {
    try {
      const res = await fetch('/api/breadcrumb');
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

        modalResumeCard.classList.remove('hidden');
      }
    } catch (e) {
      console.warn("Breadcrumb check failed:", e);
    }
  }

  btnResumeContinue.addEventListener('click', async () => {
    modalResumeCard.classList.add('hidden');
    // If not already in study desk, load sample or saved state
    if (catchallSection.style.display !== 'none') {
      document.getElementById('pill-sample-pdf').click();
      setTimeout(() => btnParseLaunch.click(), 400);
    }
  });

  btnResumeUnstick.addEventListener('click', () => {
    modalResumeCard.classList.add('hidden');
    if (catchallSection.style.display !== 'none') {
      btnParseLaunch.click();
    }
    setTimeout(() => btnUnstickTrigger.click(), 600);
  });

  // Energy-based Task Rerouting: Switch to a lighter 2-minute task
  btnResumeSwitchLight.addEventListener('click', () => {
    modalResumeCard.classList.add('hidden');
    modalLaterDrawer.classList.remove('hidden');
  });

  btnManualResume.addEventListener('click', () => {
    saveBreadcrumbCheckpoint();
    checkSavedBreadcrumbOnStartup();
  });

  // --------------------------------------------------------------------------
  // LATER DRAWER MODAL
  // --------------------------------------------------------------------------
  function updateLaterDrawerBadge() {
    laterDrawerCount.textContent = state.laterDrawer.length;
    renderLaterDrawerItems();
  }

  function renderLaterDrawerItems() {
    laterDrawerItemsList.innerHTML = "";
    if (state.laterDrawer.length === 0) {
      laterDrawerItemsList.innerHTML = '<div style="color: var(--text-muted); font-size: 13px;">No later items parked. All clear!</div>';
      return;
    }

    state.laterDrawer.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = 'later-item-card';
      card.innerHTML = `
        <div>
          <div style="font-weight: 600; font-size: 13px;">${item.title}</div>
          <div class="later-item-meta">
            <span class="later-tag">${item.category || 'task'}</span>
            <span style="font-size: 11px; color: var(--text-secondary);">⏱️ ~${item.estimated_minutes || 2} min</span>
            ${item.is_quick_win ? '<span class="later-tag" style="background: rgba(45, 212, 191, 0.2); color: var(--accent-teal);">⚡ Quick Win</span>' : ''}
          </div>
        </div>
        <button class="btn btn-secondary btn-reroute-item" data-index="${index}" style="font-size: 11px; padding: 4px 8px;">
          ⚡ Switch to this
        </button>
      `;
      laterDrawerItemsList.appendChild(card);
    });

    document.querySelectorAll('.btn-reroute-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.target.getAttribute('data-index'), 10);
        const item = state.laterDrawer[idx];
        modalLaterDrawer.classList.add('hidden');
        
        // Prepend task into scratchpad as an energizer micro-task
        scratchpadTextarea.value = `### ⚡ 2-Minute Quick Win: ${item.title}\n[ ] Completed\n\n` + scratchpadTextarea.value;
        saveCurrentScratchpad();
        saveBreadcrumbCheckpoint();
        scratchpadTextarea.focus();
      });
    });
  }

  btnOpenLaterDrawer.addEventListener('click', () => {
    renderLaterDrawerItems();
    modalLaterDrawer.classList.remove('hidden');
  });

  btnCloseLaterModal.addEventListener('click', () => modalLaterDrawer.classList.add('hidden'));
  btnDoneLaterModal.addEventListener('click', () => modalLaterDrawer.classList.add('hidden'));

  document.getElementById('btn-add-quick-later').addEventListener('click', () => {
    const title = prompt("Enter quick task or reminder to park away:");
    if (title && title.trim()) {
      state.laterDrawer.push({
        title: title.trim(),
        category: "quick-note",
        estimated_minutes: 2,
        is_quick_win: true
      });
      updateLaterDrawerBadge();
    }
  });

  // --------------------------------------------------------------------------
  // BENCHMARK MODAL (3 REPEAT RUNS)
  // --------------------------------------------------------------------------
  btnOpenBenchmark.addEventListener('click', () => {
    modalBenchmark.classList.remove('hidden');
  });
  btnCloseBenchmarkModal.addEventListener('click', () => modalBenchmark.classList.add('hidden'));
  btnDoneBenchmark.addEventListener('click', () => modalBenchmark.classList.add('hidden'));

  btnRunBenchmarkNow.addEventListener('click', async () => {
    btnRunBenchmarkNow.disabled = true;
    btnRunBenchmarkNow.textContent = "Running 3 Repeat Passes...";

    try {
      const res = await fetch('/api/benchmark', { method: 'POST' });
      const data = await res.json();
      
      const tbody = document.getElementById('benchmark-table-body');
      tbody.innerHTML = "";

      (data.metrics.runs || []).forEach(r => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>#${r.run_id}</strong></td>
          <td>${r.name}</td>
          <td>${r.latency_ms} ms</td>
          <td><strong>${r.tokens_per_sec} tok/s</strong></td>
          <td style="color: ${r.success ? 'var(--text-success)' : 'var(--text-warning)'}; font-weight: 700;">
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
      alert("Benchmark failed: " + e.message);
    } finally {
      btnRunBenchmarkNow.disabled = false;
      btnRunBenchmarkNow.textContent = "▶️ Re-Run Benchmark";
    }
  });

  // --------------------------------------------------------------------------
  // EXPORT MODAL
  // --------------------------------------------------------------------------
  btnExportSession.addEventListener('click', async () => {
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
      const data = await res.json();
      exportMarkdownContent.value = data.markdown || "No content.";
      modalExport.classList.remove('hidden');
    } catch (e) {
      alert("Export failed: " + e.message);
    }
  });

  btnCloseExportModal.addEventListener('click', () => modalExport.classList.add('hidden'));

  btnCopyExport.addEventListener('click', () => {
    exportMarkdownContent.select();
    document.execCommand('copy');
    btnCopyExport.textContent = "Copied!";
    setTimeout(() => btnCopyExport.textContent = "Copy to Clipboard", 1500);
  });

  btnDownloadExport.addEventListener('click', () => {
    const blob = new Blob([exportMarkdownContent.value], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${state.sessionTitle.replace(/\s+/g, '_')}_solution.md`;
    a.click();
    URL.revokeObjectURL(url);
  });

  // Keyboard Shortcuts: Ctrl+Enter (mark done), Ctrl+E (unstick), Ctrl+S (save)
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      btnMarkCompleted.click();
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
      e.preventDefault();
      btnUnstickTrigger.click();
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      saveBreadcrumbCheckpoint();
      scratchpadAutosaveStatus.textContent = "💾 Checkpointed (Ctrl+S)";
    }
  });

  // --------------------------------------------------------------------------
  // Startup Execution
  // --------------------------------------------------------------------------
  checkSystemStatus();
  checkSavedBreadcrumbOnStartup();
});

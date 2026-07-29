(() => {
  const input = document.getElementById('input');
  const preview = document.getElementById('preview');
  const previewEmpty = document.getElementById('previewEmpty');
  const clearBtn = document.getElementById('clearBtn');
  const copyBtn = document.getElementById('copyBtn');
  const sampleBtn = document.getElementById('sampleBtn');
  const fontSize = document.getElementById('fontSize');
  const toggleOrientation = document.getElementById('toggleOrientation');
  const mainEl = document.querySelector('.app__main');
  const modeSwitch = document.getElementById('modeSwitch');
  const modeOptions = modeSwitch.querySelectorAll('.mode-switch__option');
  const scriptSwitch = document.getElementById('scriptSwitch');
  const scriptOptions = scriptSwitch.querySelectorAll('.mode-switch__option');
  const panelInputLabel = document.querySelector('.panel--input .panel__label span');
  const hint = document.getElementById('hint');
  const previewScroll = document.querySelector('.preview-scroll');
  const previewTrack = document.getElementById('previewTrack');
  const pageDots = document.getElementById('pageDots');

  const SAMPLES = {
    latin: 'mongol bichig bol mongol undesten-u erten-u useg bichig mun',
    cyrillic: 'монгол бичиг бол монгол үндэстний эртний үсэг бичиг мөн',
  };
  const PLACEHOLDERS = {
    latin: 'Type romanized Mongolian, e.g. "mongol bichig" — sh, ch, zh, ts, kh, ng, oe, ue are digraphs. Use \' to split letters apart.',
    cyrillic: 'Кирилл монгол бичгээр бичнэ үү, жишээ нь "монгол бичиг".',
  };
  const STORAGE_KEY = 'mongolian-script-writer-text';
  const MODE_KEY = 'mongolian-script-writer-mode';
  const SCRIPT_KEY = 'mongolian-script-writer-script';

  let mode = localStorage.getItem(MODE_KEY) === 'cyrillic' ? 'cyrillic' : 'latin';
  let script = localStorage.getItem(SCRIPT_KEY) === 'olduyghur' ? 'olduyghur' : 'mongolian';

  function applyMode() {
    modeSwitch.classList.toggle('is-cyrillic', mode === 'cyrillic');
    modeOptions.forEach((btn) => btn.classList.toggle('is-active', btn.dataset.mode === mode));
    input.placeholder = PLACEHOLDERS[mode];
    panelInputLabel.textContent = mode === 'cyrillic' ? 'Type in Cyrillic' : 'Type in Latin';
    hint.textContent = mode === 'cyrillic'
      ? 'Кирилл монгол бичгээр бичнэ үү — автоматаар уламжлалт монгол бичигт хөрвүүлнэ.'
      : "Type romanized Mongolian (Latin letters) on the left — it's transliterated into traditional script on the right.";
    localStorage.setItem(MODE_KEY, mode);
  }

  modeSwitch.addEventListener('click', (e) => {
    const btn = e.target.closest('.mode-switch__option');
    if (!btn || btn.dataset.mode === mode) return;
    mode = btn.dataset.mode;
    applyMode();
    render();
  });

  function applyScript() {
    scriptSwitch.classList.toggle('is-olduyghur', script === 'olduyghur');
    scriptOptions.forEach((btn) => btn.classList.toggle('is-active', btn.dataset.script === script));
    preview.classList.toggle('is-old-uyghur', script === 'olduyghur');
    localStorage.setItem(SCRIPT_KEY, script);
  }

  scriptSwitch.addEventListener('click', (e) => {
    const btn = e.target.closest('.mode-switch__option');
    if (!btn || btn.dataset.script === script) return;
    script = btn.dataset.script;
    applyScript();
    render();
  });

  function render() {
    const value = input.value;
    const mongolianText = mode === 'cyrillic'
      ? window.mongolianTranslit.transliterateCyrillic(value)
      : window.mongolianTranslit.transliterate(value);
    preview.textContent = script === 'olduyghur'
      ? window.mongolianTranslit.toOldUyghur(mongolianText)
      : mongolianText;
    previewEmpty.style.display = value.trim() ? 'none' : 'flex';
    localStorage.setItem(STORAGE_KEY, value);
    updatePagination();
  }

  function updatePagination() {
    const pageWidth = previewScroll.clientWidth;
    previewTrack.querySelectorAll('.page-marker').forEach((el) => el.remove());
    if (!pageWidth) return;

    const pageCount = preview.scrollWidth > 0 ? Math.max(1, Math.ceil(preview.scrollWidth / pageWidth)) : 0;
    previewTrack.style.setProperty('--page-w', `${pageWidth}px`);

    pageDots.innerHTML = '';
    if (pageCount > 1) {
      for (let i = 0; i < pageCount; i++) {
        const marker = document.createElement('span');
        marker.className = 'page-marker';
        marker.style.left = `${i * pageWidth}px`;
        previewTrack.appendChild(marker);

        const dot = document.createElement('span');
        dot.className = 'page-dots__dot';
        pageDots.appendChild(dot);
      }
      updateActivePage();
    }
  }

  function updateActivePage() {
    const pageWidth = previewScroll.clientWidth;
    if (!pageWidth) return;
    const active = Math.round(previewScroll.scrollLeft / pageWidth);
    pageDots.querySelectorAll('.page-dots__dot').forEach((dot, i) => {
      dot.classList.toggle('is-active', i === active);
    });
  }

  previewScroll.addEventListener('scroll', updateActivePage);
  window.addEventListener('resize', updatePagination);

  input.addEventListener('input', render);

  clearBtn.addEventListener('click', () => {
    input.value = '';
    render();
    input.focus();
  });

  sampleBtn.addEventListener('click', () => {
    input.value = SAMPLES[mode];
    render();
  });

  copyBtn.addEventListener('click', async () => {
    if (!input.value) return;
    try {
      await navigator.clipboard.writeText(preview.textContent);
      const original = copyBtn.textContent;
      copyBtn.textContent = 'Copied';
      setTimeout(() => { copyBtn.textContent = original; }, 1200);
    } catch (err) {
      input.select();
      document.execCommand('copy');
    }
  });

  fontSize.addEventListener('input', () => {
    preview.style.fontSize = `${fontSize.value}px`;
    updatePagination();
  });

  let forcedLayout = null; // null = auto, 'row' or 'column'
  toggleOrientation.addEventListener('click', () => {
    if (forcedLayout === null) forcedLayout = 'row';
    else if (forcedLayout === 'row') forcedLayout = 'column';
    else forcedLayout = null;

    mainEl.style.flexDirection = forcedLayout || '';
    requestAnimationFrame(updatePagination);
  });

  applyMode();
  applyScript();
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) input.value = saved;
  render();
})();

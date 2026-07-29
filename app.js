(() => {
  const input = document.getElementById('input');
  const preview = document.getElementById('preview');
  const previewEmpty = document.getElementById('previewEmpty');
  const previewWarning = document.getElementById('previewWarning');
  const clearBtn = document.getElementById('clearBtn');
  const copyBtn = document.getElementById('copyBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const sampleBtn = document.getElementById('sampleBtn');
  const fontSize = document.getElementById('fontSize');
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
  const MISMATCH_MESSAGES = {
    latin: 'This looks like Cyrillic text, but the input mode is set to Latin. Switch the toggle above or check your entry.',
    cyrillic: 'This looks like Latin text, but the input mode is set to Cyrillic. Switch the toggle above or check your entry.',
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

  function detectScriptMismatch(value) {
    const cyrillicCount = (value.match(/[Ѐ-ӿ]/g) || []).length;
    const latinCount = (value.match(/[a-zA-Z]/g) || []).length;
    if (mode === 'latin' && cyrillicCount > 0 && cyrillicCount >= latinCount) return true;
    if (mode === 'cyrillic' && latinCount > 0 && latinCount >= cyrillicCount) return true;
    return false;
  }

  const FONT_FILES = {
    mongolian: { family: 'Noto Sans Mongolian', url: 'fonts/NotoSansMongolian-Regular.woff2' },
    olduyghur: { family: 'Noto Serif Old Uyghur', url: 'fonts/NotoSerifOldUyghur-Regular.woff2' },
  };

  // Copy button reads this rather than preview.textContent, since Old
  // Uyghur mode's preview content is a <canvas>, not text.
  let lastOutputText = '';
  let renderToken = 0;

  function render() {
    const value = input.value;
    const mismatch = value.trim() && detectScriptMismatch(value);
    const token = ++renderToken;

    if (mismatch) {
      preview.innerHTML = '';
      lastOutputText = '';
      previewWarning.textContent = MISMATCH_MESSAGES[mode];
      previewWarning.style.display = 'flex';
      previewEmpty.style.display = 'none';
      updatePagination();
    } else {
      const mongolianText = mode === 'cyrillic'
        ? window.mongolianTranslit.transliterateCyrillic(value)
        : window.mongolianTranslit.transliterate(value);
      const outputText = script === 'olduyghur'
        ? window.mongolianTranslit.toOldUyghur(mongolianText)
        : mongolianText;
      lastOutputText = outputText;

      if (script === 'olduyghur') {
        // Rendered via canvas (see renderOldUyghurPreview) rather than CSS
        // writing-mode, because Chrome's automatic vertical-text glyph
        // rotation is 180deg off for this very new (Unicode 14.0) script —
        // no per-script vertical metrics exist yet. Canvas fillText draws
        // glyphs in their normal horizontal form (full contextual shaping
        // intact, unaffected by that bug); rotating the shaped result
        // ourselves sidesteps it entirely.
        renderOldUyghurPreview(outputText, token);
      } else {
        // Kept as a single text node (not split per-character) so the
        // browser's OpenType shaper can see the full run of neighboring
        // characters and choose correct initial/medial/final glyph forms —
        // splitting into per-character spans breaks contextual shaping
        // entirely, since each glyph then shapes in isolation.
        preview.textContent = outputText;
        updatePagination();
      }

      previewWarning.style.display = 'none';
      previewEmpty.style.display = value.trim() ? 'none' : 'flex';
    }

    localStorage.setItem(STORAGE_KEY, value);
  }

  // Greedily packs characters into columns by measured horizontal (shaped)
  // advance width, backing off once a column would exceed maxHeightPx —
  // this is what that width becomes after the 90deg rotation.
  function wrapIntoColumns(measureCtx, text, maxHeightPx) {
    const columns = [];
    let current = '';
    for (const ch of text) {
      const attempt = current + ch;
      const w = measureCtx.measureText(attempt).width;
      if (w > maxHeightPx && current.length) {
        columns.push(current);
        current = ch;
      } else {
        current = attempt;
      }
    }
    if (current.length) columns.push(current);
    return columns;
  }

  // Renders one column: shape horizontally (correct contextual glyph
  // forms), then rotate the strip 90deg clockwise onto a vertical canvas.
  function buildColumnStrip(measureCtx, colText, fontFamily, fontPx, pad) {
    const lineHeight = Math.ceil(fontPx * 1.4);
    const textWidth = Math.max(1, Math.ceil(measureCtx.measureText(colText).width));

    const horizontal = document.createElement('canvas');
    horizontal.width = textWidth + pad * 2;
    horizontal.height = lineHeight + pad * 2;
    const hctx = horizontal.getContext('2d');
    hctx.font = `${fontPx}px "${fontFamily}"`;
    hctx.textBaseline = 'middle';
    hctx.fillStyle = '#1c1710';
    hctx.fillText(colText, pad, horizontal.height / 2);

    const rotated = document.createElement('canvas');
    rotated.width = horizontal.height;
    rotated.height = horizontal.width;
    const rctx = rotated.getContext('2d');
    rctx.translate(rotated.width, 0);
    rctx.rotate(Math.PI / 2);
    rctx.drawImage(horizontal, 0, 0);
    return rotated;
  }

  async function renderOldUyghurPreview(text, token) {
    if (!text) {
      preview.innerHTML = '';
      updatePagination();
      return;
    }
    const font = FONT_FILES.olduyghur;
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    const fontPxCss = parseFloat(getComputedStyle(preview).fontSize);
    const fontPx = fontPxCss * scale;
    const pad = 16 * scale;

    await document.fonts.load(`${fontPx}px "${font.family}"`, text);
    await document.fonts.ready;
    if (token !== renderToken) return; // superseded by a newer render

    const measure = document.createElement('canvas').getContext('2d');
    measure.font = `${fontPx}px "${font.family}"`;

    const maxHeightPx = Math.max(1, previewScroll.clientHeight * scale - pad * 2);
    const columns = wrapIntoColumns(measure, text, maxHeightPx);
    const strips = columns.map((col) => buildColumnStrip(measure, col, font.family, fontPx, pad));

    const gap = 8 * scale;
    const totalWidth = strips.reduce((sum, s) => sum + s.width, 0) + gap * Math.max(0, strips.length - 1);
    const maxHeight = Math.max(...strips.map((s) => s.height));

    const canvas = document.createElement('canvas');
    canvas.width = totalWidth;
    canvas.height = maxHeight;
    canvas.style.width = `${totalWidth / scale}px`;
    canvas.style.height = `${maxHeight / scale}px`;
    canvas.style.display = 'block';
    const ctx = canvas.getContext('2d');
    let x = 0;
    for (const strip of strips) {
      ctx.drawImage(strip, x, 0);
      x += strip.width + gap;
    }

    if (token !== renderToken) return;
    preview.innerHTML = '';
    preview.appendChild(canvas);
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
    if (!lastOutputText) return;
    try {
      await navigator.clipboard.writeText(lastOutputText);
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
    if (script === 'olduyghur') renderOldUyghurPreview(lastOutputText, ++renderToken);
    else updatePagination();
  });

  // Reads back the browser's own column-wrap decisions by checking each
  // character's actual rendered x-position (characters in the same column
  // share the same left offset in vertical-lr). Uses Range rather than
  // per-character spans so the text stays one contiguous node for shaping.
  function getRenderedColumns() {
    const textNode = preview.firstChild;
    if (!textNode || textNode.nodeType !== Node.TEXT_NODE) return [];
    const text = textNode.data;
    const columns = [];
    let currentLeft = null;
    let currentChars = [];
    const range = document.createRange();
    for (let i = 0; i < text.length; i++) {
      range.setStart(textNode, i);
      range.setEnd(textNode, i + 1);
      const rect = range.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) {
        currentChars.push(text[i]);
        continue;
      }
      if (currentLeft === null) {
        currentLeft = rect.left;
      } else if (Math.abs(rect.left - currentLeft) > 2) {
        columns.push(currentChars.join(''));
        currentChars = [];
        currentLeft = rect.left;
      }
      currentChars.push(text[i]);
    }
    if (currentChars.length) columns.push(currentChars.join(''));
    return columns;
  }

  // Columns are placed left-to-right, matching the on-screen column order.
  // Mongolian mode reads column breaks back from the live CSS-rendered
  // text (getRenderedColumns); Old Uyghur mode re-derives them the same
  // way its own canvas preview does (wrapIntoColumns), so download and
  // on-screen preview always agree.
  downloadBtn.addEventListener('click', async () => {
    if (!lastOutputText) return;
    const original = downloadBtn.textContent;
    downloadBtn.textContent = 'Rendering…';
    downloadBtn.disabled = true;
    try {
      const font = FONT_FILES[script];
      const scale = 3;
      const fontPx = parseFloat(getComputedStyle(preview).fontSize) * scale;
      const pad = 24 * scale;
      const gap = 16 * scale;

      await document.fonts.load(`${fontPx}px "${font.family}"`, lastOutputText);
      await document.fonts.ready;

      const measure = document.createElement('canvas').getContext('2d');
      measure.font = `${fontPx}px "${font.family}"`;

      let columns;
      if (script === 'olduyghur') {
        const maxHeightPx = Math.max(1, previewScroll.clientHeight * scale - pad * 2);
        columns = wrapIntoColumns(measure, lastOutputText, maxHeightPx);
      } else {
        const rawColumns = getRenderedColumns();
        columns = rawColumns.length ? rawColumns : [lastOutputText];
      }
      columns = columns.map((c) => c.replace(/\n+/g, ' ')).filter((c) => c.length);

      const strips = columns.map((colText) => buildColumnStrip(measure, colText, font.family, fontPx, pad));

      const totalWidth = strips.reduce((sum, s) => sum + s.width, 0) + gap * Math.max(0, strips.length - 1);
      const maxHeight = Math.max(...strips.map((s) => s.height));

      const out = document.createElement('canvas');
      out.width = totalWidth;
      out.height = maxHeight;
      const octx = out.getContext('2d');
      let x = 0;
      for (const strip of strips) {
        octx.drawImage(strip, x, 0);
        x += strip.width + gap;
      }

      const pngUrl = out.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = pngUrl;
      a.download = `central-asian-transliterator-${script}.png`;
      a.click();
    } catch (err) {
      console.error(err);
      downloadBtn.textContent = 'Failed';
      setTimeout(() => { downloadBtn.textContent = original; }, 1500);
      downloadBtn.disabled = false;
      return;
    }
    downloadBtn.textContent = original;
    downloadBtn.disabled = false;
  });

  applyMode();
  applyScript();
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) input.value = saved;
  render();
})();

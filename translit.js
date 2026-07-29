// Latin -> traditional Mongolian script (Unicode 1820-1843 block) transliteration.
// Emits base letters only; the font's Mongolian shaping engine (HarfBuzz 'mong')
// picks the correct isolate/initial/medial/final glyph form from context.
(() => {
  const DIGRAPHS = {
    ch: 'ᠴ', // CHA
    sh: 'ᠱ', // SHA
    zh: 'ᠵ', // JA (also plain j)
    ts: 'ᠼ', // TSA
    kh: 'ᠬ', // QA
    ng: 'ᠩ', // ANG
    oe: 'ᠥ', // O with umlaut (o)
    ue: 'ᠦ', // U with umlaut (u)
  };

  const SINGLES = {
    a: 'ᠠ', e: 'ᠡ', i: 'ᠢ', o: 'ᠣ', u: 'ᠤ',
    n: 'ᠨ', b: 'ᠪ', p: 'ᠫ', g: 'ᠭ', m: 'ᠮ',
    l: 'ᠯ', s: 'ᠰ', t: 'ᠲ', d: 'ᠳ', j: 'ᠵ',
    y: 'ᠶ', r: 'ᠷ', w: 'ᠸ', v: 'ᠸ', f: 'ᠹ',
    k: 'ᠺ', z: 'ᠽ', h: 'ᠾ', c: 'ᠴ',
    q: 'ᠬ', x: 'ᠬ',
    "'": '',
  };

  function transliterate(text) {
    return convert(text, DIGRAPHS, SINGLES);
  }

  // Mongolian Cyrillic -> traditional script. Simplified: soft/hard signs
  // are dropped, е/ё/ю/я expand to their y + vowel pair.
  const CYRILLIC_DIGRAPHS = {
    е: 'ᠶᠡ', ё: 'ᠶᠣ', ю: 'ᠶᠤ', я: 'ᠶᠠ',
  };

  const CYRILLIC_SINGLES = {
    а: 'ᠠ', б: 'ᠪ', в: 'ᠸ', г: 'ᠭ', д: 'ᠳ',
    ж: 'ᠵ', з: 'ᠽ', и: 'ᠢ', й: 'ᠢ', к: 'ᠺ',
    л: 'ᠯ', м: 'ᠮ', н: 'ᠨ', о: 'ᠣ', ө: 'ᠥ',
    п: 'ᠫ', р: 'ᠷ', с: 'ᠰ', т: 'ᠲ', у: 'ᠤ',
    ү: 'ᠦ', ф: 'ᠹ', х: 'ᠬ', ц: 'ᠼ', ч: 'ᠴ',
    ш: 'ᠱ', щ: 'ᠱ', э: 'ᠡ',
    ъ: '', ь: '',
  };

  function transliterateCyrillic(text) {
    return convert(text, CYRILLIC_DIGRAPHS, CYRILLIC_SINGLES);
  }

  function convert(text, digraphs, singles) {
    let out = '';
    for (let i = 0; i < text.length; i++) {
      const two = text.slice(i, i + 2).toLowerCase();
      if (Object.prototype.hasOwnProperty.call(digraphs, two)) {
        out += digraphs[two];
        i++;
        continue;
      }
      const one = text[i].toLowerCase();
      if (Object.prototype.hasOwnProperty.call(singles, one)) {
        out += singles[one];
        continue;
      }
      out += text[i];
    }
    return out;
  }

  window.mongolianTranslit = { transliterate, transliterateCyrillic };
})();

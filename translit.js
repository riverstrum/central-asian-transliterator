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

  // Traditional Mongolian script -> Old Uyghur script (Unicode 10F70-10F89,
  // added in Unicode 14.0). Old Uyghur is the direct ancestor alphabet that
  // the classical Mongolian script was adapted from letter-by-letter, so
  // this maps each Mongolian letter to the Uyghur letter it descended from
  // rather than re-deriving phonetics from scratch. Old Uyghur's 18 letters
  // cover fewer distinctions than Mongolian later developed (e.g. ch/j/ts
  // all trace back to one letter, sadhe), so this is necessarily lossy.
  const MONGOLIAN_TO_OLD_UYGHUR = {
    'ᠠ': '\u{10F70}', // A         <- aleph
    'ᠡ': '\u{10F70}', // E         <- aleph
    'ᠢ': '\u{10F76}', // I         <- yodh
    'ᠣ': '\u{10F73}', // O         <- waw
    'ᠤ': '\u{10F73}', // U         <- waw
    'ᠥ': '\u{10F73}', // OE        <- waw
    'ᠦ': '\u{10F73}', // UE        <- waw
    'ᠨ': '\u{10F7A}', // N         <- nun
    'ᠩ': '\u{10F7A}\u{10F72}', // ANG <- nun + gimel-heth (later Mongolian ligature)
    'ᠪ': '\u{10F71}', // B         <- beth
    'ᠫ': '\u{10F7C}', // P         <- pe
    'ᠬ': '\u{10F72}', // Q/KH      <- gimel-heth
    'ᠭ': '\u{10F72}', // G         <- gimel-heth
    'ᠮ': '\u{10F79}', // M         <- mem
    'ᠯ': '\u{10F78}', // L         <- lamedh
    'ᠰ': '\u{10F7B}', // S         <- samekh
    'ᠱ': '\u{10F7F}', // SH        <- shin
    'ᠲ': '\u{10F80}', // T         <- taw
    'ᠳ': '\u{10F80}', // D         <- taw
    'ᠴ': '\u{10F7D}', // CH        <- sadhe
    'ᠵ': '\u{10F7D}', // J/ZH      <- sadhe
    'ᠼ': '\u{10F7D}', // TS        <- sadhe
    'ᠶ': '\u{10F76}', // Y         <- yodh
    'ᠷ': '\u{10F7E}', // R         <- resh
    'ᠸ': '\u{10F73}', // W/V       <- waw
    'ᠹ': '\u{10F7C}', // F         <- pe
    'ᠺ': '\u{10F77}', // K         <- kaph
    'ᠽ': '\u{10F74}', // Z         <- zayin
    'ᠾ': '\u{10F75}', // H         <- final heth
  };

  const OLD_UYGHUR_PUNCTUATION = {
    ',': '\u{10F86}', // bar
    '.': '\u{10F87}', // two bars
  };

  function toOldUyghur(mongolianText) {
    let out = '';
    for (const ch of mongolianText) {
      out += MONGOLIAN_TO_OLD_UYGHUR[ch] ?? OLD_UYGHUR_PUNCTUATION[ch] ?? ch;
    }
    return out;
  }

  window.mongolianTranslit = { transliterate, transliterateCyrillic, toOldUyghur };
})();

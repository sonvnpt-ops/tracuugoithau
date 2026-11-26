/**
 * Vietnamese Telex Input Engine
 * Converts keystrokes typed in Telex into standard Vietnamese Unicode (NFC),
 * while supporting native IMEs without interference.
 */

const TONE_MAP: Record<string, Record<string, string>> = {
  a: { s: 'á', f: 'à', r: 'ả', x: 'ã', j: 'ạ' },
  ă: { s: 'ắ', f: 'ằ', r: 'ẳ', x: 'ẵ', j: 'ặ' },
  â: { s: 'ấ', f: 'ầ', r: 'ẩ', x: 'ẫ', j: 'ậ' },
  e: { s: 'é', f: 'è', r: 'ẻ', x: 'ẽ', j: 'ẹ' },
  ê: { s: 'ế', f: 'ề', r: 'ể', x: 'ễ', j: 'ệ' },
  i: { s: 'í', f: 'ì', r: 'ỉ', x: 'ĩ', j: 'ị' },
  o: { s: 'ó', f: 'ò', r: 'ỏ', x: 'õ', j: 'ọ' },
  ô: { s: 'ố', f: 'ồ', r: 'ổ', x: 'ỗ', j: 'ộ' },
  ơ: { s: 'ớ', f: 'ờ', r: 'ở', x: 'ỡ', j: 'ợ' },
  u: { s: 'ú', f: 'ù', r: 'ủ', x: 'ũ', j: 'ụ' },
  ư: { s: 'ứ', f: 'ừ', r: 'ử', x: 'ữ', j: 'ự' },
  y: { s: 'ý', f: 'ỳ', r: 'ỷ', x: 'ỹ', j: 'ỵ' },

  A: { s: 'Á', f: 'À', r: 'Ả', x: 'Ã', j: 'Ạ' },
  Ă: { s: 'Ắ', f: 'Ằ', r: 'Ẳ', x: 'Ẵ', j: 'Ặ' },
  Â: { s: 'Ấ', f: 'Ầ', r: 'Ẩ', x: 'Ẫ', j: 'Ậ' },
  E: { s: 'É', f: 'È', r: 'Ẻ', x: 'Ẽ', j: 'Ẹ' },
  Ê: { s: 'Ế', f: 'Ề', r: 'Ể', x: 'Ễ', j: 'Ệ' },
  I: { s: 'Í', f: 'Ì', r: 'Ỉ', x: 'Ĩ', j: 'Ị' },
  O: { s: 'Ó', f: 'Ò', r: 'Ỏ', x: 'Õ', j: 'Ọ' },
  Ô: { s: 'Ố', f: 'Ồ', r: 'Ổ', x: 'Ỗ', j: 'Ộ' },
  Ơ: { s: 'Ớ', f: 'Ờ', r: 'Ở', x: 'Ỡ', j: 'Ợ' },
  U: { s: 'Ú', f: 'Ù', r: 'Ủ', x: 'Ũ', j: 'Ụ' },
  Ư: { s: 'Ứ', f: 'Ừ', r: 'Ử', x: 'Ữ', j: 'Ự' },
  Y: { s: 'Ý', f: 'Ỳ', r: 'Ỷ', x: 'Ỹ', j: 'Ỵ' },
};

const BASE_OF_ACCENT: Record<string, string> = {
  á: 'a', à: 'a', ả: 'a', ã: 'a', ạ: 'a',
  ắ: 'ă', ằ: 'ă', ẳ: 'ă', ẵ: 'ă', ặ: 'ă',
  ấ: 'â', ầ: 'â', ẩ: 'â', ẫ: 'â', ậ: 'â',
  é: 'e', è: 'e', ẻ: 'e', ẽ: 'e', ẹ: 'e',
  ế: 'ê', ề: 'ê', ể: 'ê', ễ: 'ê', ệ: 'ê',
  í: 'i', ì: 'i', ỉ: 'i', ĩ: 'i', ị: 'i',
  ó: 'o', ò: 'o', ỏ: 'o', õ: 'o', ọ: 'o',
  ố: 'ô', ồ: 'ô', ổ: 'ô', ỗ: 'ô', ộ: 'ô',
  ớ: 'ơ', ờ: 'ơ', ở: 'ơ', ỡ: 'ơ', ợ: 'ơ',
  ú: 'u', ù: 'u', ủ: 'u', ũ: 'u', ụ: 'u',
  ứ: 'ư', ừ: 'ư', ử: 'ư', ữ: 'ư', ự: 'ư',
  ý: 'y', ỳ: 'y', ỷ: 'y', ỹ: 'y', ỵ: 'y',

  Á: 'A', À: 'A', Ả: 'A', Ã: 'A', Ạ: 'A',
  Ắ: 'Ă', Ằ: 'Ă', Ẳ: 'Ă', Ẵ: 'Ă', Ặ: 'Ă',
  Ấ: 'Â', Ầ: 'Â', Ẩ: 'Â', Ẫ: 'Â', Ậ: 'Â',
  É: 'E', È: 'E', Ẻ: 'E', Ẽ: 'E', Ẹ: 'E',
  Ế: 'Ê', Ề: 'Ê', Ể: 'Ê', Ễ: 'Ê', Ệ: 'Ê',
  Í: 'I', Ì: 'I', Ỉ: 'I', Ĩ: 'I', Ị: 'I',
  Ó: 'O', Ò: 'O', Ỏ: 'O', Õ: 'O', Ọ: 'O',
  Ố: 'Ô', Ồ: 'Ô', Ổ: 'Ô', Ỗ: 'Ô', Ộ: 'Ô',
  Ớ: 'Ơ', Ờ: 'Ơ', Ở: 'Ơ', Ỡ: 'Ơ', Ợ: 'Ơ',
  Ú: 'U', Ù: 'U', Ủ: 'U', Ũ: 'U', Ụ: 'U',
  Ứ: 'Ư', Ừ: 'Ư', Ử: 'Ư', Ữ: 'Ư', Ự: 'Ư',
  Ý: 'Y', Ỳ: 'Y', Ỷ: 'Y', Ỹ: 'Y', Ỵ: 'Y',
};

const ALL_VOWELS = 'aăâeêioôơuưyAĂÂEÊIOÔƠUƯYáàảãạắằẳẵặấầẩẫậéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵÁÀẢÃẠẮẰẲẴẶẤẦẨẪẬÉÈẺẼẸẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌỐỒỔỖỘỚỜỞỠỢÚÙỦŨỤỨỪỬỮỰÝỲỶỸỴ';

export function transformWordTelex(word: string): string {
  if (!word || word.length === 0) return word;

  // Preserve uppercase acronyms like CISSP, PMP, RAM, SOC, VPN, etc.
  if (word.length >= 2 && word === word.toUpperCase() && !/[À-ỸĂÂĐÊÔƠƯ]/.test(word)) {
    return word;
  }

  let str = word;

  // 1. Initial consonants: dd -> đ
  str = str.replace(/dd/gi, (m) => (m[0] === 'D' ? 'Đ' : 'đ'));

  // 2. Modifiers: uow -> ươ, aa -> â, aw -> ă, ee -> ê, oo -> ô, ow -> ơ, uw -> ư
  str = str.replace(/uow/gi, 'ươ');
  str = str.replace(/uw/gi, (m) => (m[0] === 'U' ? 'Ư' : 'ư'));
  str = str.replace(/ow/gi, (m) => (m[0] === 'O' ? 'Ơ' : 'ơ'));
  str = str.replace(/aa/gi, (m) => (m[0] === 'A' ? 'Â' : 'â'));
  str = str.replace(/aw/gi, (m) => (m[0] === 'A' ? 'Ă' : 'ă'));
  str = str.replace(/ee/gi, (m) => (m[0] === 'E' ? 'Ê' : 'ê'));
  str = str.replace(/oo/gi, (m) => (m[0] === 'O' ? 'Ô' : 'ô'));

  // Standalone w: w -> ư, tw -> tư, ddw -> đư
  str = str.replace(/(^|[b-df-hj-np-tv-zđĐ])w/gi, (match, prefix) => {
    return prefix + (match.slice(-1) === 'W' ? 'Ư' : 'ư');
  });

  // 3. Tones: In Vietnamese syllable, tone marker appears either right after vowel or at end of syllable:
  // Must end with optional valid Vietnamese final consonant: c, ch, m, n, ng, nh, p, t
  const toneRegex = /([aăâeêioôơuưyAĂÂEÊIOÔƠUƯYáàảãạắằẳẵặấầẩẫậéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵÁÀẢÃẠẮẰẲẴẶẤẦẨẪẬÉÈẺẼẸẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌỐỒỔỖỘỚỜỞỠỢÚÙỦŨỤỨỪỬỮỰÝỲỶỸỴ]+)([sfrxjSFRXJ])(c|ch|m|n|ng|nh|p|t)?$/i;
  const match = str.match(toneRegex);

  if (match) {
    const vowelGroup = match[1];
    const toneChar = match[2].toLowerCase();
    const endingConsonant = match[3] || '';
    const prefix = str.slice(0, match.index);

    const wordNoTone = prefix + vowelGroup + endingConsonant;

    // Find vowel positions in wordNoTone
    const vowelPositions: number[] = [];
    for (let i = 0; i < wordNoTone.length; i++) {
      if (ALL_VOWELS.includes(wordNoTone[i])) {
        // Skip 'u' in 'qu' and 'i' in 'gi' if followed by another vowel
        if (
          i > 0 &&
          wordNoTone[i].toLowerCase() === 'u' &&
          wordNoTone[i - 1].toLowerCase() === 'q' &&
          i + 1 < wordNoTone.length &&
          ALL_VOWELS.includes(wordNoTone[i + 1])
        ) {
          continue;
        }
        if (
          i > 0 &&
          wordNoTone[i].toLowerCase() === 'i' &&
          wordNoTone[i - 1].toLowerCase() === 'g' &&
          i + 1 < wordNoTone.length &&
          ALL_VOWELS.includes(wordNoTone[i + 1])
        ) {
          continue;
        }
        vowelPositions.push(i);
      }
    }

    if (vowelPositions.length > 0) {
      let targetVowelIdx = vowelPositions[vowelPositions.length - 1];

      if (vowelPositions.length >= 2) {
        const lastIdx = vowelPositions[vowelPositions.length - 1];
        const prevIdx = vowelPositions[vowelPositions.length - 2];
        const endsWithConsonant = endingConsonant.length > 0;

        const v1 = BASE_OF_ACCENT[wordNoTone[prevIdx]] || wordNoTone[prevIdx];
        const v2 = BASE_OF_ACCENT[wordNoTone[lastIdx]] || wordNoTone[lastIdx];
        const pair = (v1 + v2).toLowerCase();

        if (['ươ', 'iê', 'uô'].includes(pair)) {
          targetVowelIdx = lastIdx;
        } else if (endsWithConsonant) {
          targetVowelIdx = lastIdx;
        } else if (['oa', 'oe', 'uy', 'ia', 'ua', 'ưa'].includes(pair)) {
          targetVowelIdx = lastIdx;
        } else {
          targetVowelIdx = prevIdx;
        }
      }

      const origChar = wordNoTone[targetVowelIdx];
      const baseChar = BASE_OF_ACCENT[origChar] || origChar;
      const accented = TONE_MAP[baseChar]?.[toneChar];

      if (accented) {
        str = wordNoTone.slice(0, targetVowelIdx) + accented + wordNoTone.slice(targetVowelIdx + 1);
      }
    }
  }

  return str;
}

export function processTelexInput(text: string): string {
  if (!text) return '';
  return text.replace(/([a-zA-ZăâđêôơưĂÂĐÊÔƠƯáàảãạắằẳẵặấầẩẫậéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵÁÀẢÃẠẮẰẲẴẶẤẦẨẪẬÉÈẺẼẸẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌỐỒỔỖỘỚỜỞỠỢÚÙỦŨỤỨỪỬỮỰÝỲỶỸỴ]+)/g, (word) => {
    return transformWordTelex(word);
  });
}

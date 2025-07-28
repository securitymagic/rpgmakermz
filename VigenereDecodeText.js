/*:
 * @target MZ
 * @plugindesc Vigenère-decrypts base64 text using \\VDECR[], matching CyberChef letter-only behavior. v1.2-alphabet-mode
 * @author Luke Acha + ChatGPT
 *
 * @param KeyVariableID
 * @text Vigenère Key Variable ID
 * @desc Game variable ID that holds the Vigenère decryption key
 * @type number
 * @default 43
 */

(() => {
  const PLUGIN_NAME = "VigenereDecodeText";
  const params = PluginManager.parameters(PLUGIN_NAME);
  const KEY_VAR_ID = Number(params["KeyVariableID"] || 0);

  function base64ToText(b64) {
    try {
      return atob(b64);
    } catch {
      return "";
    }
  }

  function vigenereDecryptAlphaOnly(ciphertext, key) {
    let result = "";
    const aCode = "a".charCodeAt(0);
    const ACode = "A".charCodeAt(0);
    const zCode = "z".charCodeAt(0);
    const ZCode = "Z".charCodeAt(0);
    const keyLen = key.length;

    for (let i = 0, j = 0; i < ciphertext.length; i++) {
      const c = ciphertext.charCodeAt(i);
      const k = key.charCodeAt(j % keyLen);

      if (c >= ACode && c <= ZCode) {
        const shift = (k >= ACode && k <= ZCode)
          ? k - ACode
          : (k >= aCode && k <= zCode) ? k - aCode : 0;
        const decrypted = ((c - ACode - shift + 26) % 26) + ACode;
        result += String.fromCharCode(decrypted);
        j++;
      } else if (c >= aCode && c <= zCode) {
        const shift = (k >= ACode && k <= ZCode)
          ? k - ACode
          : (k >= aCode && k <= zCode) ? k - aCode : 0;
        const decrypted = ((c - aCode - shift + 26) % 26) + aCode;
        result += String.fromCharCode(decrypted);
        j++;
      } else {
        result += ciphertext[i]; // skip non-letters
      }
    }

    return result;
  }

  const _convertEscapeCharacters = Window_Base.prototype.convertEscapeCharacters;
  Window_Base.prototype.convertEscapeCharacters = function (text) {
    text = _convertEscapeCharacters.call(this, text);
    return text.replace(/\\VDECR\[(.+?)\]/gi, (_, b64) => {
      try {
        const key = $gameVariables.value(KEY_VAR_ID);
        if (typeof key !== "string" || !key.length) throw new Error("Invalid key");
        const encoded = base64ToText(b64);
        const decrypted = vigenereDecryptAlphaOnly(encoded, key);
        return decrypted;
      } catch (e) {
        console.warn("Vigenère fallback to base64:", e);
        return b64;
      }
    });
  };
})();

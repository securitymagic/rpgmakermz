/*:
 * @target MZ
 * @plugindesc RC4-decrypts base64 text using \\DECR[] with the key read from a game variable. v1.6-cleaned
 * @author Luke Acha + ChatGPT
 *
 * @param KeyVariableID
 * @text RC4 Key Variable ID
 * @desc Game variable ID that holds the RC4 decryption key
 * @type variable
 * @default 1
 */

(() => {
  const PLUGIN_NAME = "RC4DecodeText";
  const params = PluginManager.parameters(PLUGIN_NAME);
  const KEY_VAR_ID = Number(params["KeyVariableID"] || 0);

  function utf8Bytes(str) {
    return new TextEncoder().encode(str);
  }

  function base64ToBytes(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  function rc4(keyBytes, dataBytes) {
    const s = new Uint8Array(256);
    for (let i = 0; i < 256; i++) s[i] = i;
    let j = 0;
    for (let i = 0; i < 256; i++) {
      j = (j + s[i] + keyBytes[i % keyBytes.length]) & 0xff;
      [s[i], s[j]] = [s[j], s[i]];
    }
    let i = 0;
    j = 0;
    const out = new Uint8Array(dataBytes.length);
    for (let k = 0; k < dataBytes.length; k++) {
      i = (i + 1) & 0xff;
      j = (j + s[i]) & 0xff;
      [s[i], s[j]] = [s[j], s[i]];
      const t = (s[i] + s[j]) & 0xff;
      out[k] = dataBytes[k] ^ s[t];
    }
    return out;
  }

  const _convertEscapeCharacters = Window_Base.prototype.convertEscapeCharacters;
  Window_Base.prototype.convertEscapeCharacters = function (text) {
    text = _convertEscapeCharacters.call(this, text);
    return text.replace(/\\DECR\[(.+?)\]/gi, (_, b64) => {
      try {
        const keyStr = $gameVariables.value(KEY_VAR_ID);
        if (typeof keyStr !== 'string') throw new Error("RC4 key must be a string");
        const keyBytes = utf8Bytes(keyStr);
        const cipherBytes = base64ToBytes(b64);
        const plainBytes = rc4(keyBytes, cipherBytes);
        return new TextDecoder().decode(plainBytes);
      } catch {
        return "[DECRYPT_ERROR]";
      }
    });
  };
})();

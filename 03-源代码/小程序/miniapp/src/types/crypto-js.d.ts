declare module 'crypto-js/aes' {
  import type { LibCipherParams } from 'crypto-js';

  interface AESStatic {
    encrypt(message: string, key: string): LibCipherParams;
    decrypt(ciphertext: string, key: string): LibCipherParams;
  }

  const AES: AESStatic;
  export default AES;
}

declare module 'crypto-js/sha256' {
  import type { WordArray } from 'crypto-js';

  interface SHA256Static {
    (message: string): WordArray;
  }

  const SHA256: SHA256Static;
  export default SHA256;
}

declare module 'crypto-js/enc-utf8' {
  import type { Encoder } from 'crypto-js';

  interface Utf8Static extends Encoder {
    stringify(wordArray: import('crypto-js').WordArray): string;
  }

  const Utf8: Utf8Static;
  export default Utf8;
}

declare module 'crypto-js/enc-base64' {
  import type { Encoder } from 'crypto-js';

  interface Base64Static extends Encoder {
    parse(base64Str: string): import('crypto-js').WordArray;
  }

  const Base64: Base64Static;
  export default Base64;
}

declare module 'crypto-js' {
  interface WordArray {
    toString(encoder?: Encoder): string;
  }

  interface Encoder {
    stringify(wordArray: WordArray): string;
    parse(str: string): WordArray;
  }

  interface LibCipherParams {
    toString(encoder?: Encoder): string;
    ciphertext: WordArray;
  }

  interface CryptoJSLib {
    AES: {
      encrypt(message: string, key: string): LibCipherParams;
      decrypt(ciphertext: string, key: string): LibCipherParams;
    };
    SHA256: {
      (message: string): WordArray;
    };
    enc: {
      Utf8: Encoder;
      Base64: Encoder;
    };
  }

  const CryptoJS: CryptoJSLib;
  export default CryptoJS;
  export { CryptoJS };
  export type { WordArray, Encoder, LibCipherParams };
}

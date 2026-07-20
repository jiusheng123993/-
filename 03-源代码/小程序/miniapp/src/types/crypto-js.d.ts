declare module 'crypto-js' {
  interface CipherParams {
    toString(): string;
  }

  interface WordArray {
    toString(): string;
  }

  interface CryptoJSLib {
    AES: {
      encrypt(message: string, key: string): CipherParams;
      decrypt(ciphertext: string, key: string): { toString(enc: any): string };
    };
    SHA256: {
      (message: string): WordArray;
    };
    enc: {
      Utf8: {
        stringify(wordArray: any): string;
      };
      Base64: {
        parse(base64Str: string): any;
      };
    };
  }

  const CryptoJS: CryptoJSLib;
  export default CryptoJS;
}

import koffi from 'koffi';
import { createHash } from 'crypto';
import { createReadStream, existsSync } from 'fs';
import { defaultLogger } from '@sentinel/logger';
import { promisifyKoffi } from '../koffi/loader.js';

export interface SignatureResult {
  status: 'VALID' | 'INVALID' | 'UNSIGNED' | 'UNCHECKED' | 'SELF_SIGNED';
  signer?: string | null;
}

// Module-level static bindings initialized once per process
let isNativeInitialized = false;
let WinVerifyTrustFn: any = null;
let CryptQueryObjectFn: any = null;
let CryptMsgGetParamFn: any = null;
let CertFindCertificateInStoreFn: any = null;
let CertGetNameStringAFn: any = null;
let CertCloseStoreFn: any = null;
let CryptMsgCloseFn: any = null;
let CertFreeCertificateContextFn: any = null;
let WINTRUST_FILE_INFO_TYPE: any = null;
let WINTRUST_DATA_TYPE: any = null;
let actionIdObj: any = null;

// Promisified async native function handles
let WinVerifyTrustAsync: any = null;
let CryptQueryObjectAsync: any = null;

function ensureNativeBindings(): boolean {
  if (isNativeInitialized) return true;
  if (process.platform !== 'win32') return false;

  try {
    const wintrust = koffi.load('wintrust.dll');
    const crypt32 = koffi.load('crypt32.dll');

    /**
     * Win32 GUID structure
     * Represents a 128-bit globally unique identifier (UUID) matching Windows layout.
     * Used to identify the Authenticode action provider GUID: WINTRUST_ACTION_GENERIC_VERIFY_V2.
     */
    koffi.struct('GUID_AUTH', {
      Data1: 'uint32',
      Data2: 'uint16',
      Data3: 'uint16',
      Data4: koffi.array('uint8', 8),
    });

    /**
     * Win32 WINTRUST_FILE_INFO structure
     * Specifies the target PE binary file to evaluate for digital signatures.
     * - pcwszFilePath: Wide Unicode UTF-16 string representing the absolute path to the binary.
     */
    WINTRUST_FILE_INFO_TYPE = koffi.struct('WINTRUST_FILE_INFO_AUTH', {
      cbStruct: 'uint32',
      pcwszFilePath: 'str16',
      hFile: 'void *',
      pgKnownSubject: 'void *',
    });

    /**
     * Win32 WINTRUST_DATA structure
     * Configures the trust provider behavior when calling WinVerifyTrust:
     * - dwUIChoice: 2 (WTD_UI_NONE) suppresses any UI prompts/dialogs.
     * - fdwRevocationChecks: 0 (WTD_REVOKE_NONE).
     * - dwUnionChoice: 1 (WTD_CHOICE_FILE) indicates validation of an on-disk file.
     * - dwProvFlags: Disables network revocation checks to maintain high local performance.
     */
    WINTRUST_DATA_TYPE = koffi.struct('WINTRUST_DATA_AUTH', {
      cbStruct: 'uint32',
      pPolicyCallbackData: 'void *',
      pSIPClientData: 'void *',
      dwUIChoice: 'uint32',
      fdwRevocationChecks: 'uint32',
      dwUnionChoice: 'uint32',
      pFile: 'WINTRUST_FILE_INFO_AUTH *',
      dwStateAction: 'uint32',
      hWVTStateData: 'void *',
      pwszURLReference: 'void *',
      dwProvFlags: 'uint32',
      dwUIContext: 'uint32',
      pSignatureSettings: 'void *',
    });

    /**
     * Win32 WinVerifyTrust (wintrust.dll)
     * Performs an Authenticode trust verification action on an executable binary or driver.
     * Evaluates PE file headers, embedded PKCS#7 signatures, certificate chains, and catalog databases.
     * @param hwnd - Window handle (null for background headless verification).
     * @param pgActionID - Action GUID (WINTRUST_ACTION_GENERIC_VERIFY_V2).
     * @param pWVTData - Pointer to WINTRUST_DATA configuration structure.
     * @returns 0 (ERROR_SUCCESS) if valid and trusted, or specific Win32 HRESULT / error code.
     */
    WinVerifyTrustFn = wintrust.func(
      'long __stdcall WinVerifyTrust(void *hwnd, GUID_AUTH *pgActionID, WINTRUST_DATA_AUTH *pWVTData)'
    );

    /**
     * Win32 CryptQueryObject (crypt32.dll)
     * Queries a binary file to extract the embedded PKCS#7 signed message and certificate store
     * without executing or launching the target file.
     * @param dwObjectType - 1 (CERT_QUERY_OBJECT_FILE).
     * @param pvObject - Wide Unicode file path buffer.
     * @param dwExpectedContentTypeFlags - Content flag mask (e.g. CERT_QUERY_CONTENT_FLAG_PKCS7_SIGNED_EMBED).
     * @param dwExpectedFormatTypeFlags - Format flag mask (e.g. CERT_QUERY_FORMAT_FLAG_BINARY).
     * @param phCertStore - [Out] Receives handle to the opened certificate store containing the signer cert.
     * @param phMsg - [Out] Receives handle to the decoded cryptographic PKCS#7 message.
     * @returns Boolean 1 on success, 0 on failure.
     */
    CryptQueryObjectFn = crypt32.func(
      'int __stdcall CryptQueryObject(uint32 dwObjectType, const void *pvObject, uint32 dwExpectedContentTypeFlags, uint32 dwExpectedFormatTypeFlags, uint32 dwFlags, _Out_ uint32 *pdwMsgAndCertEncodingType, _Out_ uint32 *pdwContentType, _Out_ uint32 *pdwFormatType, _Out_ void **phCertStore, _Out_ void **phMsg, _Out_ void **ppvContext)'
    );

    /**
     * Win32 CryptMsgGetParam (crypt32.dll)
     * Acquires decoded parameters/signer attributes from an open cryptographic message handle.
     */
    CryptMsgGetParamFn = crypt32.func(
      'int __stdcall CryptMsgGetParam(void *hCryptMsg, uint32 dwParamType, uint32 dwIndex, _Out_ void *pvData, _Inout_ uint32 *pcbData)'
    );

    /**
     * Win32 CertFindCertificateInStore (crypt32.dll)
     * Finds the signer's X.509 certificate context within the extracted certificate store.
     * @param hCertStore - Certificate store handle from CryptQueryObject.
     * @param dwCertEncodingType - 0x00010001 (X509_ASN_ENCODING | PKCS_7_ASN_ENCODING).
     * @returns Pointer to CERT_CONTEXT struct or null if not found.
     */
    CertFindCertificateInStoreFn = crypt32.func(
      'void * __stdcall CertFindCertificateInStore(void *hCertStore, uint32 dwCertEncodingType, uint32 dwFindFlags, uint32 dwFindType, const void *pvFindPara, void *pPrevCertContext)'
    );

    /**
     * Win32 CertGetNameStringA (crypt32.dll)
     * Extracts and formats the subject Common Name (CN) / organization string from an X.509 certificate context.
     * @param pCertContext - Pointer to the CERT_CONTEXT.
     * @param dwType - 4 (CERT_NAME_SIMPLE_DISPLAY_TYPE).
     * @param pszNameString - [Out] Character buffer receiving the null-terminated signer name string.
     * @param cchNameString - Capacity in characters of the output buffer.
     * @returns Character length written into buffer.
     */
    CertGetNameStringAFn = crypt32.func(
      'uint32 __stdcall CertGetNameStringA(void *pCertContext, uint32 dwType, uint32 dwFlags, void *pvTypePara, _Out_ uint8 *pszNameString, uint32 cchNameString)'
    );

    /**
     * Win32 CertCloseStore (crypt32.dll)
     * Closes the in-memory certificate store handle opened by CryptQueryObject.
     */
    CertCloseStoreFn = crypt32.func('int __stdcall CertCloseStore(void *hCertStore, uint32 dwFlags)');

    /**
     * Win32 CryptMsgClose (crypt32.dll)
     * Closes the cryptographic PKCS#7 message handle opened by CryptQueryObject.
     */
    CryptMsgCloseFn = crypt32.func('int __stdcall CryptMsgClose(void *hCryptMsg)');

    /**
     * Win32 CertFreeCertificateContext (crypt32.dll)
     * Decrements the reference count and frees the CERT_CONTEXT handle returned by CertFindCertificateInStore.
     */
    CertFreeCertificateContextFn = crypt32.func(
      'int __stdcall CertFreeCertificateContext(void *pCertContext)'
    );

    // Promisified asynchronous non-blocking versions:
    // Offloads signature verification and cryptographic object queries to libuv worker threads.
    WinVerifyTrustAsync = promisifyKoffi<number>(WinVerifyTrustFn);
    CryptQueryObjectAsync = promisifyKoffi<number>(CryptQueryObjectFn);

    // WINTRUST_ACTION_GENERIC_VERIFY_V2: {00aac56b-cd44-11d0-8cc2-00c04fc295ee}
    actionIdObj = {
      Data1: 0x00aac56b,
      Data2: 0xcd44,
      Data3: 0x11d0,
      Data4: [0x8c, 0xc2, 0x00, 0xc0, 0x4f, 0xc2, 0x95, 0xee],
    };

    isNativeInitialized = true;
    return true;
  } catch (err) {
    defaultLogger.warn({ err }, 'Failed to initialize native WinTrust / Crypt32 bindings; using fallback');
    isNativeInitialized = false;
    return false;
  }
}

export class AuthenticodeVerifier {
  private signatureCache: Map<string, SignatureResult> = new Map();
  private hashCache: Map<string, string> = new Map();

  constructor() {
    ensureNativeBindings();
  }

  /**
   * Asynchronously verifies the Authenticode signature of an executable file on Windows natively
   * running off the main event loop thread
   */
  public async verifySignature(filePath: string): Promise<SignatureResult> {
    if (!filePath || !existsSync(filePath)) {
      return { status: 'UNCHECKED' };
    }

    if (this.signatureCache.has(filePath)) {
      return this.signatureCache.get(filePath)!;
    }

    if (process.platform !== 'win32' || !ensureNativeBindings()) {
      const res: SignatureResult = { status: 'UNCHECKED' };
      this.signatureCache.set(filePath, res);
      return res;
    }

    try {
      const fileInfo = {
        cbStruct: koffi.sizeof(WINTRUST_FILE_INFO_TYPE),
        pcwszFilePath: filePath,
        hFile: null,
        pgKnownSubject: null,
      };

      const trustData = {
        cbStruct: koffi.sizeof(WINTRUST_DATA_TYPE),
        pPolicyCallbackData: null,
        pSIPClientData: null,
        dwUIChoice: 2, // WTD_UI_NONE
        fdwRevocationChecks: 0, // WTD_REVOKE_NONE
        dwUnionChoice: 1, // WTD_CHOICE_FILE
        pFile: fileInfo,
        dwStateAction: 0, // WTD_STATEACTION_IGNORE
        hWVTStateData: null,
        pwszURLReference: null,
        dwProvFlags: 0x00000010 | 0x00001000, // WTD_REVOCATION_CHECK_NONE | WTD_CACHE_ONLY_URL_RETRIEVAL
        dwUIContext: 0,
        pSignatureSettings: null,
      };

      let trustResult: number;
      if (WinVerifyTrustAsync) {
        trustResult = await WinVerifyTrustAsync(null, actionIdObj, trustData);
      } else {
        trustResult = WinVerifyTrustFn(null, actionIdObj, trustData);
      }

      let status: SignatureResult['status'] = 'UNSIGNED';
      let signer: string | null = null;

      if (trustResult === 0) {
        status = 'VALID';
      } else if (trustResult === -2146762486 || trustResult === -2146762487) {
        // Untrusted root or self-signed
        status = 'SELF_SIGNED';
      } else if (trustResult === -2146869232) {
        // Bad digest / hash mismatch
        status = 'INVALID';
      } else if (trustResult === -2146762496) {
        // 0x800B0100 (TRUST_E_NOSIGNATURE)
        // Check if it's a catalog-signed Windows system binary
        const lower = filePath.toLowerCase();
        const winDir = (process.env.SystemRoot || 'c:\\windows').toLowerCase();
        if (
          lower.startsWith(`${winDir}\\system32\\`) ||
          lower.startsWith(`${winDir}\\syswow64\\`) ||
          lower.startsWith(`${winDir}\\systemapps\\`)
        ) {
          status = 'VALID';
          signer = 'Microsoft Windows Component';
        } else {
          status = 'UNSIGNED';
        }
      }

      // If valid or self-signed, extract signer certificate Subject CN if possible
      if (status === 'VALID' || status === 'SELF_SIGNED') {
        if (!signer && (CryptQueryObjectAsync || CryptQueryObjectFn)) {
          signer = await this.extractSignerName(filePath);
        }
      }

      const result: SignatureResult = { status, signer };
      this.signatureCache.set(filePath, result);
      return result;
    } catch (err) {
      defaultLogger.debug({ filePath, err }, 'Failed to verify Authenticode signature natively');
      const res: SignatureResult = { status: 'UNCHECKED' };
      this.signatureCache.set(filePath, res);
      return res;
    }
  }

  /**
   * Synchronously verifies Authenticode signature
   */
  public verifySignatureSync(filePath: string): SignatureResult {
    if (!filePath || !existsSync(filePath)) {
      return { status: 'UNCHECKED' };
    }

    if (this.signatureCache.has(filePath)) {
      return this.signatureCache.get(filePath)!;
    }

    if (process.platform !== 'win32' || !ensureNativeBindings()) {
      const res: SignatureResult = { status: 'UNCHECKED' };
      this.signatureCache.set(filePath, res);
      return res;
    }

    try {
      const fileInfo = {
        cbStruct: koffi.sizeof(WINTRUST_FILE_INFO_TYPE),
        pcwszFilePath: filePath,
        hFile: null,
        pgKnownSubject: null,
      };

      const trustData = {
        cbStruct: koffi.sizeof(WINTRUST_DATA_TYPE),
        pPolicyCallbackData: null,
        pSIPClientData: null,
        dwUIChoice: 2,
        fdwRevocationChecks: 0,
        dwUnionChoice: 1,
        pFile: fileInfo,
        dwStateAction: 0,
        hWVTStateData: null,
        pwszURLReference: null,
        dwProvFlags: 0x00000010 | 0x00001000,
        dwUIContext: 0,
        pSignatureSettings: null,
      };

      const trustResult = WinVerifyTrustFn(null, actionIdObj, trustData);

      let status: SignatureResult['status'] = 'UNSIGNED';
      let signer: string | null = null;

      if (trustResult === 0) {
        status = 'VALID';
      } else if (trustResult === -2146762486 || trustResult === -2146762487) {
        status = 'SELF_SIGNED';
      } else if (trustResult === -2146869232) {
        status = 'INVALID';
      } else if (trustResult === -2146762496) {
        const lower = filePath.toLowerCase();
        const winDir = (process.env.SystemRoot || 'c:\\windows').toLowerCase();
        if (
          lower.startsWith(`${winDir}\\system32\\`) ||
          lower.startsWith(`${winDir}\\syswow64\\`) ||
          lower.startsWith(`${winDir}\\systemapps\\`)
        ) {
          status = 'VALID';
          signer = 'Microsoft Windows Component';
        } else {
          status = 'UNSIGNED';
        }
      }

      if (status === 'VALID' || status === 'SELF_SIGNED') {
        if (!signer && CryptQueryObjectFn) {
          signer = this.extractSignerNameSync(filePath);
        }
      }

      const result: SignatureResult = { status, signer };
      this.signatureCache.set(filePath, result);
      return result;
    } catch (err) {
      defaultLogger.debug({ filePath, err }, 'Failed to verify Authenticode signature synchronously');
      const res: SignatureResult = { status: 'UNCHECKED' };
      this.signatureCache.set(filePath, res);
      return res;
    }
  }

  private async extractSignerName(filePath: string): Promise<string | null> {
    try {
      const encType = [0];
      const contentType = [0];
      const formatType = [0];
      const hStore = [null];
      const hMsg = [null];
      const pContext = [null];

      const wPath = Buffer.from(filePath + '\0', 'utf16le');
      let ok: any;
      if (CryptQueryObjectAsync) {
        ok = await CryptQueryObjectAsync(
          1, // CERT_QUERY_OBJECT_FILE
          wPath,
          1 << 10, // CERT_QUERY_CONTENT_FLAG_PKCS7_SIGNED_EMBED
          1 << 1, // CERT_QUERY_FORMAT_FLAG_BINARY
          0,
          encType,
          contentType,
          formatType,
          hStore,
          hMsg,
          pContext
        );
      } else {
        ok = CryptQueryObjectFn(
          1,
          wPath,
          1 << 10,
          1 << 1,
          0,
          encType,
          contentType,
          formatType,
          hStore,
          hMsg,
          pContext
        );
      }

      if (!ok || !hMsg[0]) return null;

      try {
        if (hStore[0]) {
          const pCert = CertFindCertificateInStoreFn(hStore[0], 0x00010001, 0, 0, null, null);
          if (pCert) {
            const nameBuf = Buffer.alloc(256);
            const nameLen = CertGetNameStringAFn(pCert, 4, 0, null, nameBuf, 256);
            CertFreeCertificateContextFn(pCert);
            if (nameLen > 1) {
              return nameBuf.toString('utf8', 0, nameLen - 1);
            }
          }
        }
      } finally {
        if (hStore[0]) CertCloseStoreFn(hStore[0], 0);
        if (hMsg[0]) CryptMsgCloseFn(hMsg[0]);
      }
    } catch {
      // Ignored
    }
    return null;
  }

  private extractSignerNameSync(filePath: string): string | null {
    try {
      const encType = [0];
      const contentType = [0];
      const formatType = [0];
      const hStore = [null];
      const hMsg = [null];
      const pContext = [null];

      const wPath = Buffer.from(filePath + '\0', 'utf16le');
      const ok = CryptQueryObjectFn(
        1,
        wPath,
        1 << 10,
        1 << 1,
        0,
        encType,
        contentType,
        formatType,
        hStore,
        hMsg,
        pContext
      );

      if (!ok || !hMsg[0]) return null;

      try {
        if (hStore[0]) {
          const pCert = CertFindCertificateInStoreFn(hStore[0], 0x00010001, 0, 0, null, null);
          if (pCert) {
            const nameBuf = Buffer.alloc(256);
            const nameLen = CertGetNameStringAFn(pCert, 4, 0, null, nameBuf, 256);
            CertFreeCertificateContextFn(pCert);
            if (nameLen > 1) {
              return nameBuf.toString('utf8', 0, nameLen - 1);
            }
          }
        }
      } finally {
        if (hStore[0]) CertCloseStoreFn(hStore[0], 0);
        if (hMsg[0]) CryptMsgCloseFn(hMsg[0]);
      }
    } catch {
      // Ignored
    }
    return null;
  }

  /**
   * Computes SHA-256 hash of a file
   */
  public async computeFileSha256(filePath: string): Promise<string | null> {
    if (!filePath || !existsSync(filePath)) return null;

    if (this.hashCache.has(filePath)) {
      return this.hashCache.get(filePath)!;
    }

    return new Promise((resolve) => {
      try {
        const hash = createHash('sha256');
        const stream = createReadStream(filePath);

        stream.on('data', (chunk: Buffer | string) => hash.update(chunk));
        stream.on('end', () => {
          const digest = hash.digest('hex');
          this.hashCache.set(filePath, digest);
          resolve(digest);
        });
        stream.on('error', () => resolve(null));
      } catch {
        resolve(null);
      }
    });
  }
}

/**
 * IPFS Uploader Module
 *
 * Uploads HTML content to IPFS pinning services (Pinata or web3.storage).
 * Supports multi-provider with configurable API keys and custom gateway domains.
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4
 */

import { getProvider, getApiKey, getCustomGateway } from './apiKeyConfig';
import type { IpfsProvider } from './apiKeyConfig';

export type { IpfsProvider };

export interface IpfsUploadResult {
  /** IPFS Content Identifier */
  cid: string;
  /** Public gateway access URL */
  gatewayUrl: string;
  /** Provider used for upload */
  provider: IpfsProvider;
}

/** Default gateways per provider */
const DEFAULT_GATEWAYS: Record<IpfsProvider, string> = {
  pinata: 'gateway.pinata.cloud',
  web3storage: 'w3s.link',
};

/**
 * Build a gateway URL from a CID, provider, and optional custom gateway domain.
 *
 * Exported for testing (Property 3: Gateway URL format correctness).
 *
 * @param cid - The IPFS Content Identifier
 * @param provider - The IPFS provider used
 * @param customGateway - Optional custom gateway domain (Pinata only)
 * @returns The full HTTPS gateway URL
 */
export function buildGatewayUrl(
  cid: string,
  provider: IpfsProvider,
  customGateway?: string | null
): string {
  let gatewayDomain: string;

  if (customGateway && provider === 'pinata') {
    // Custom gateway domain for Pinata (Requirement 5.8)
    gatewayDomain = customGateway;
  } else {
    gatewayDomain = DEFAULT_GATEWAYS[provider];
  }

  return `https://${gatewayDomain}/ipfs/${cid}`;
}

/**
 * Upload HTML content to Pinata IPFS pinning service.
 *
 * Endpoint: POST https://api.pinata.cloud/pinning/pinFileToIPFS
 * Method: multipart/form-data
 * Headers: Authorization: Bearer {jwt}
 */
async function uploadToPinata(
  htmlContent: string,
  fileName: string,
  apiKey: string
): Promise<string> {
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const formData = new FormData();
  formData.append('file', blob, fileName);

  const response = await fetch(
    'https://api.pinata.cloud/pinning/pinFileToIPFS',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
    }
  );

  if (!response.ok) {
    handleHttpError(response.status);
  }

  const data = await response.json();
  return data.IpfsHash;
}

/**
 * Upload HTML content to web3.storage IPFS pinning service.
 *
 * Endpoint: POST https://api.web3.storage/upload
 * Method: POST (raw body)
 * Headers: Authorization: Bearer {token}
 */
async function uploadToWeb3Storage(
  htmlContent: string,
  _fileName: string,
  apiKey: string
): Promise<string> {
  const blob = new Blob([htmlContent], { type: 'text/html' });

  const response = await fetch('https://api.web3.storage/upload', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: blob,
  });

  if (!response.ok) {
    handleHttpError(response.status);
  }

  const data = await response.json();
  return data.cid;
}

/**
 * Handle HTTP error responses with user-friendly Chinese error messages.
 *
 * @param status - HTTP status code
 * @throws Error with descriptive message
 */
function handleHttpError(status: number): never {
  if (status === 401 || status === 403) {
    throw new Error('API Key 无效或配额已用尽，请检查 API Key 设置');
  }
  if (status === 429) {
    throw new Error('上传配额已用尽，请配置自定义 API Key');
  }
  throw new Error(`上传失败，服务器返回错误 (${status})`);
}

/**
 * Upload HTML content to IPFS using the configured provider.
 *
 * Reads provider, API key, and custom gateway from apiKeyConfig.
 * Supports Pinata (default) and web3.storage providers.
 *
 * @param htmlContent - The self-contained HTML string to upload
 * @param fileName - The filename for the uploaded file (e.g., "index.html")
 * @returns Upload result containing CID, gateway URL, and provider
 * @throws Error with descriptive message on failure
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4
 */
export async function uploadToIpfs(
  htmlContent: string,
  fileName: string
): Promise<IpfsUploadResult> {
  const provider = getProvider();
  const apiKey = getApiKey();
  const customGateway = getCustomGateway();

  let cid: string;

  try {
    if (provider === 'pinata') {
      cid = await uploadToPinata(htmlContent, fileName, apiKey);
    } else {
      cid = await uploadToWeb3Storage(htmlContent, fileName, apiKey);
    }
  } catch (error) {
    // Re-throw known errors (from handleHttpError)
    if (error instanceof Error && error.message !== 'Failed to fetch') {
      // Check if it's one of our known error messages or a generic fetch error
      const knownMessages = [
        'API Key 无效或配额已用尽，请检查 API Key 设置',
        '上传配额已用尽，请配置自定义 API Key',
      ];
      if (
        knownMessages.includes(error.message) ||
        error.message.startsWith('上传失败，服务器返回错误')
      ) {
        throw error;
      }
    }
    // Network errors or unexpected errors
    throw new Error('网络错误，请检查网络连接');
  }

  const gatewayUrl = buildGatewayUrl(cid, provider, customGateway);

  return {
    cid,
    gatewayUrl,
    provider,
  };
}

/**
 * API Key Configuration for IPFS Pinning Services
 *
 * Manages provider selection, API key storage, and custom gateway configuration.
 * Supports Pinata (default) and web3.storage providers.
 *
 * Requirements: 5.1, 5.2, 5.4, 5.5, 5.6, 5.7, 5.8
 */

export type IpfsProvider = 'pinata' | 'web3storage';

const STORAGE_KEY_API = 'share-ipfs-api-key';
const STORAGE_KEY_PROVIDER = 'share-ipfs-provider';
const STORAGE_KEY_GATEWAY = 'share-ipfs-custom-gateway';

const DEFAULT_PROVIDER: IpfsProvider = 'pinata';

// Built-in default API keys for out-of-box usage (Requirement 5.1)
// In production, these should be replaced with real keys via environment variables.
const DEFAULT_PINATA_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiIyZGIyOTExOS1iNzM2LTRmNmYtODgzOS1lNDJjM2QwZGJkNDgiLCJlbWFpbCI6Imp1bm1lbmd5ZTAwMUBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGluX3BvbGljeSI6eyJyZWdpb25zIjpbeyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJGUkExIn0seyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJOWUMxIn1dLCJ2ZXJzaW9uIjoxfSwibWZhX2VuYWJsZWQiOmZhbHNlLCJzdGF0dXMiOiJBQ1RJVkUifSwiYXV0aGVudGljYXRpb25UeXBlIjoic2NvcGVkS2V5Iiwic2NvcGVkS2V5S2V5IjoiYmQ1Yzg5ZDYyMTdiMzliYjBlOTMiLCJzY29wZWRLZXlTZWNyZXQiOiI2OWFjNDczNmVkZWUxODM4ODlkMGZhNGJkM2M5M2FiN2M0OGE3NWRiZTA2M2NlN2ExNWY2ZjY2ZjM2NzE3OTc5IiwiZXhwIjoxODAyMjYzNzMzfQ.JFyQImBLaXcVhr38vXvjTLcrMvrkm_TEIBBQ5bW_AOc';
const DEFAULT_WEB3STORAGE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.default-web3storage-token';

/**
 * Get the built-in default key for a given provider.
 */
function getDefaultKey(provider: IpfsProvider): string {
  return provider === 'pinata' ? DEFAULT_PINATA_KEY : DEFAULT_WEB3STORAGE_KEY;
}

/**
 * Safely read from localStorage, returning null if unavailable.
 */
function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * Safely write to localStorage, silently failing if unavailable.
 */
function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Silent degradation when localStorage is unavailable
  }
}

/**
 * Safely remove from localStorage, silently failing if unavailable.
 */
function safeRemoveItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // Silent degradation when localStorage is unavailable
  }
}

/**
 * Get the current selected IPFS provider.
 * Defaults to 'pinata' if no provider is stored (Requirement 5.2).
 */
export function getProvider(): IpfsProvider {
  const stored = safeGetItem(STORAGE_KEY_PROVIDER);
  if (stored === 'pinata' || stored === 'web3storage') {
    return stored;
  }
  return DEFAULT_PROVIDER;
}

/**
 * Set the IPFS provider and persist to localStorage (Requirement 5.7).
 */
export function setProvider(provider: IpfsProvider): void {
  safeSetItem(STORAGE_KEY_PROVIDER, provider);
}

/**
 * Get the current effective API key.
 * Returns the user's custom key if set, otherwise the built-in default
 * key for the current provider (Requirement 5.5).
 */
export function getApiKey(): string {
  const customKey = getCustomApiKey();
  if (customKey) {
    return customKey;
  }
  return getDefaultKey(getProvider());
}

/**
 * Save a user-provided custom API key to localStorage (Requirement 5.4).
 */
export function saveCustomApiKey(key: string): void {
  safeSetItem(STORAGE_KEY_API, key);
}

/**
 * Get the user's custom API key, or null if none is set.
 */
export function getCustomApiKey(): string | null {
  const key = safeGetItem(STORAGE_KEY_API);
  if (key === null || key === '') {
    return null;
  }
  return key;
}

/**
 * Clear the user's custom API key, falling back to the built-in default (Requirement 5.6).
 */
export function clearCustomApiKey(): void {
  safeRemoveItem(STORAGE_KEY_API);
}

/**
 * Get the custom gateway domain (Pinata only), or null if none is set (Requirement 5.8).
 */
export function getCustomGateway(): string | null {
  const gateway = safeGetItem(STORAGE_KEY_GATEWAY);
  if (gateway === null || gateway === '') {
    return null;
  }
  return gateway;
}

/**
 * Set a custom gateway domain (Requirement 5.8).
 */
export function setCustomGateway(domain: string): void {
  if (domain === '') {
    safeRemoveItem(STORAGE_KEY_GATEWAY);
  } else {
    safeSetItem(STORAGE_KEY_GATEWAY, domain);
  }
}

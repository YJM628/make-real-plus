/**
 * Unit tests for API Key Configuration
 * Feature: share-app-link
 * Requirements: 5.1, 5.2, 5.4, 5.5, 5.6, 5.7, 5.8
 */

import {
  getProvider,
  setProvider,
  getApiKey,
  saveCustomApiKey,
  getCustomApiKey,
  clearCustomApiKey,
  getCustomGateway,
  setCustomGateway,
} from './apiKeyConfig';

describe('apiKeyConfig', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('getProvider / setProvider', () => {
    it('should return "pinata" as the default provider (Requirement 5.2)', () => {
      expect(getProvider()).toBe('pinata');
    });

    it('should persist provider selection to localStorage (Requirement 5.7)', () => {
      setProvider('web3storage');
      expect(getProvider()).toBe('web3storage');
    });

    it('should return "pinata" for invalid stored value', () => {
      localStorage.setItem('share-ipfs-provider', 'invalid-provider');
      expect(getProvider()).toBe('pinata');
    });

    it('should switch back to pinata after setting web3storage', () => {
      setProvider('web3storage');
      expect(getProvider()).toBe('web3storage');
      setProvider('pinata');
      expect(getProvider()).toBe('pinata');
    });
  });

  describe('getApiKey / saveCustomApiKey / getCustomApiKey / clearCustomApiKey', () => {
    it('should return a built-in default key when no custom key is set (Requirement 5.1)', () => {
      const key = getApiKey();
      expect(key).toBeTruthy();
      expect(typeof key).toBe('string');
      expect(key.length).toBeGreaterThan(0);
    });

    it('should return null for custom API key when none is set', () => {
      expect(getCustomApiKey()).toBeNull();
    });

    it('should save and retrieve a custom API key (Requirement 5.4)', () => {
      saveCustomApiKey('my-custom-key-123');
      expect(getCustomApiKey()).toBe('my-custom-key-123');
    });

    it('should prioritize custom key over default in getApiKey (Requirement 5.5)', () => {
      const defaultKey = getApiKey();
      saveCustomApiKey('user-custom-key');
      expect(getApiKey()).toBe('user-custom-key');
      expect(getApiKey()).not.toBe(defaultKey);
    });

    it('should fall back to default key after clearing custom key (Requirement 5.6)', () => {
      const defaultKey = getApiKey();
      saveCustomApiKey('temporary-key');
      expect(getApiKey()).toBe('temporary-key');

      clearCustomApiKey();
      expect(getCustomApiKey()).toBeNull();
      expect(getApiKey()).toBe(defaultKey);
    });

    it('should treat empty string as no custom key', () => {
      saveCustomApiKey('');
      expect(getCustomApiKey()).toBeNull();
    });

    it('should return different default keys for different providers (Requirement 5.1)', () => {
      const pinataKey = getApiKey();
      setProvider('web3storage');
      const web3Key = getApiKey();
      expect(pinataKey).not.toBe(web3Key);
    });
  });

  describe('getCustomGateway / setCustomGateway', () => {
    it('should return null when no custom gateway is set', () => {
      expect(getCustomGateway()).toBeNull();
    });

    it('should save and retrieve a custom gateway domain (Requirement 5.8)', () => {
      setCustomGateway('my-gateway.mypinata.cloud');
      expect(getCustomGateway()).toBe('my-gateway.mypinata.cloud');
    });

    it('should clear custom gateway when set to empty string', () => {
      setCustomGateway('my-gateway.mypinata.cloud');
      expect(getCustomGateway()).toBe('my-gateway.mypinata.cloud');

      setCustomGateway('');
      expect(getCustomGateway()).toBeNull();
    });

    it('should persist gateway across calls', () => {
      setCustomGateway('custom.gateway.io');
      // Simulate reading again
      expect(getCustomGateway()).toBe('custom.gateway.io');
    });
  });
});

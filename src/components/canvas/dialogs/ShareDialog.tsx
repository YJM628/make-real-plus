/**
 * ShareDialog - Dialog for sharing canvas app via IPFS link
 * Feature: share-app-link
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 5.3
 *
 * Provides a dialog that:
 * - Auto-starts assembly when opened
 * - Shows progress through assembling → uploading → success/error states
 * - Displays clickable gateway URL and copy button on success
 * - Shows error message and retry button on failure
 * - Includes collapsible settings section for provider, API key, and custom gateway
 * - Supports close via overlay click or close button
 */

import * as React from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';
import type { Editor } from 'tldraw';
import { assembleShareableHtml } from '../../../utils/share/sharePipeline';
import { uploadToIpfs } from '../../../utils/share/ipfsUploader';
import {
  getProvider,
  setProvider,
  getCustomApiKey,
  saveCustomApiKey,
  clearCustomApiKey,
  getCustomGateway,
  setCustomGateway,
} from '../../../utils/share/apiKeyConfig';
import type { IpfsProvider } from '../../../utils/share/apiKeyConfig';

export interface ShareDialogProps {
  /** Whether the dialog is visible */
  isOpen: boolean;
  /** tldraw Editor instance */
  editor: Editor | null;
  /** Callback when dialog is closed */
  onClose: () => void;
}

/**
 * Dialog state machine:
 * idle → assembling (auto-start)
 * assembling → uploading (assembly complete)
 * uploading → success (upload complete)
 * uploading → error (upload failed)
 * assembling → error (assembly failed)
 * error → assembling (retry)
 */
type ShareDialogState =
  | { phase: 'idle' }
  | { phase: 'assembling' }
  | { phase: 'uploading' }
  | { phase: 'success'; gatewayUrl: string; cid: string }
  | { phase: 'error'; message: string };

/**
 * ShareDialog component
 *
 * Requirements:
 * - 4.1: Show loading state with phase description during assembly/upload
 * - 4.2: Display clickable gateway URL on success
 * - 4.3: Provide "复制链接" button
 * - 4.4: Copy to clipboard with "已复制" feedback (2s timeout)
 * - 4.5: Show error message and "重试" button on failure
 * - 4.6: Close on overlay click or close button
 * - 5.3: Collapsible settings section with provider, API key, custom gateway
 */
export const ShareDialog: React.FC<ShareDialogProps> = ({
  isOpen,
  editor,
  onClose,
}) => {
  const [state, setState] = useState<ShareDialogState>({ phase: 'idle' });
  const [copied, setCopied] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Settings state
  const [selectedProvider, setSelectedProvider] = useState<IpfsProvider>(getProvider());
  const [customApiKey, setCustomApiKey] = useState(getCustomApiKey() || '');
  const [customGateway, setCustomGatewayInput] = useState(getCustomGateway() || '');

  // Ref to track if the component is still mounted / dialog is open during async ops
  const isActiveRef = useRef(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset state when dialog opens and auto-start assembly
  useEffect(() => {
    if (isOpen) {
      isActiveRef.current = true;
      setState({ phase: 'idle' });
      setCopied(false);
      setSelectedProvider(getProvider());
      setCustomApiKey(getCustomApiKey() || '');
      setCustomGatewayInput(getCustomGateway() || '');

      // Auto-start assembly
      startShareFlow();
    } else {
      isActiveRef.current = false;
    }

    return () => {
      isActiveRef.current = false;
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  /**
   * Execute the full share flow: assemble → upload
   */
  const startShareFlow = useCallback(async () => {
    if (!editor) {
      setState({ phase: 'error', message: 'Editor not available' });
      return;
    }

    // Phase 1: Assembling
    setState({ phase: 'assembling' });

    let html: string;
    let appName: string;

    try {
      const result = await assembleShareableHtml(editor);
      html = result.html;
      appName = result.appName;
    } catch (err) {
      if (!isActiveRef.current) return;
      const message = err instanceof Error ? err.message : '组装页面失败';
      setState({ phase: 'error', message });
      return;
    }

    if (!isActiveRef.current) return;

    // Phase 2: Uploading
    setState({ phase: 'uploading' });

    try {
      const uploadResult = await uploadToIpfs(html, `${appName}.html`);
      if (!isActiveRef.current) return;
      setState({
        phase: 'success',
        gatewayUrl: uploadResult.gatewayUrl,
        cid: uploadResult.cid,
      });
    } catch (err) {
      if (!isActiveRef.current) return;
      const message = err instanceof Error ? err.message : '上传到 IPFS 失败';
      setState({ phase: 'error', message });
    }
  }, [editor]);

  /**
   * Handle retry: restart the share flow
   */
  const handleRetry = useCallback(() => {
    setCopied(false);
    startShareFlow();
  }, [startShareFlow]);

  /**
   * Copy gateway URL to clipboard with "已复制" feedback
   * Requirement 4.4
   */
  const handleCopyLink = useCallback(async () => {
    if (state.phase !== 'success') return;

    try {
      await navigator.clipboard.writeText(state.gatewayUrl);
      setCopied(true);

      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
      copyTimeoutRef.current = setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      // Clipboard API not available - select the text for manual copy
      const linkEl = document.querySelector('[data-share-link]') as HTMLElement;
      if (linkEl) {
        const range = document.createRange();
        range.selectNodeContents(linkEl);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    }
  }, [state]);

  /**
   * Handle provider change
   */
  const handleProviderChange = useCallback((provider: IpfsProvider) => {
    setSelectedProvider(provider);
    setProvider(provider);
  }, []);

  /**
   * Handle custom API key change
   */
  const handleApiKeyChange = useCallback((value: string) => {
    setCustomApiKey(value);
    if (value.trim()) {
      saveCustomApiKey(value.trim());
    } else {
      clearCustomApiKey();
    }
  }, []);

  /**
   * Handle custom gateway change
   */
  const handleGatewayChange = useCallback((value: string) => {
    setCustomGatewayInput(value);
    setCustomGateway(value.trim());
  }, []);

  if (!isOpen) {
    return null;
  }

  const isLoading = state.phase === 'assembling' || state.phase === 'uploading';

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
      data-testid="share-dialog-overlay"
    >
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '8px',
          padding: '24px',
          maxWidth: '500px',
          width: '90%',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: '20px',
              fontWeight: 600,
              color: '#262626',
            }}
          >
            分享应用
          </h2>
          <button
            onClick={onClose}
            data-testid="share-dialog-close"
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: '#8c8c8c',
              padding: '4px 8px',
              lineHeight: 1,
            }}
            aria-label="关闭"
          >
            ✕
          </button>
        </div>

        {/* Loading State - Requirement 4.1 */}
        {isLoading && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '32px 0',
            }}
            data-testid="share-dialog-loading"
          >
            {/* Spinner */}
            <div
              style={{
                width: '40px',
                height: '40px',
                border: '3px solid #f0f0f0',
                borderTop: '3px solid #1890ff',
                borderRadius: '50%',
                animation: 'share-spin 1s linear infinite',
                marginBottom: '16px',
              }}
            />
            <p
              style={{
                margin: 0,
                fontSize: '14px',
                color: '#595959',
              }}
              data-testid="share-dialog-phase"
            >
              {state.phase === 'assembling'
                ? '正在组装页面...'
                : '正在上传到 IPFS...'}
            </p>
          </div>
        )}

        {/* Success State - Requirements 4.2, 4.3 */}
        {state.phase === 'success' && (
          <div
            style={{ padding: '16px 0' }}
            data-testid="share-dialog-success"
          >
            <div
              style={{
                padding: '12px',
                backgroundColor: '#f6ffed',
                border: '1px solid #b7eb8f',
                borderRadius: '4px',
                marginBottom: '16px',
              }}
            >
              <p
                style={{
                  margin: '0 0 8px 0',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#52c41a',
                }}
              >
                ✓ 分享链接已生成
              </p>
              <a
                href={state.gatewayUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-share-link
                data-testid="share-dialog-link"
                style={{
                  fontSize: '13px',
                  color: '#1890ff',
                  wordBreak: 'break-all',
                  textDecoration: 'underline',
                }}
              >
                {state.gatewayUrl}
              </a>
            </div>
            <button
              onClick={handleCopyLink}
              data-testid="share-dialog-copy"
              style={{
                width: '100%',
                padding: '8px 16px',
                backgroundColor: copied ? '#52c41a' : '#1890ff',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
            >
              {copied ? '已复制' : '复制链接'}
            </button>
          </div>
        )}

        {/* Error State - Requirement 4.5 */}
        {state.phase === 'error' && (
          <div
            style={{ padding: '16px 0' }}
            data-testid="share-dialog-error"
          >
            <div
              style={{
                padding: '12px',
                backgroundColor: '#fff2f0',
                border: '1px solid #ffccc7',
                borderRadius: '4px',
                marginBottom: '16px',
                fontSize: '14px',
                color: '#cf1322',
              }}
            >
              {state.message}
            </div>
            <button
              onClick={handleRetry}
              data-testid="share-dialog-retry"
              style={{
                width: '100%',
                padding: '8px 16px',
                backgroundColor: '#1890ff',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              重试
            </button>
          </div>
        )}

        {/* Collapsible Settings Section - Requirement 5.3 */}
        <div
          style={{
            borderTop: '1px solid #f0f0f0',
            marginTop: '8px',
            paddingTop: '8px',
          }}
        >
          <button
            onClick={() => setSettingsOpen(!settingsOpen)}
            data-testid="share-dialog-settings-toggle"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 0',
              fontSize: '14px',
              color: '#595959',
              width: '100%',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                transition: 'transform 0.2s',
                transform: settingsOpen ? 'rotate(90deg)' : 'rotate(0deg)',
              }}
            >
              ▶
            </span>
            设置
          </button>

          {settingsOpen && (
            <div
              style={{ padding: '12px 0 4px 0' }}
              data-testid="share-dialog-settings"
            >
              {/* Provider Selector */}
              <div style={{ marginBottom: '12px' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '6px',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#262626',
                  }}
                >
                  IPFS 服务商
                </label>
                <select
                  value={selectedProvider}
                  onChange={(e) =>
                    handleProviderChange(e.target.value as IpfsProvider)
                  }
                  data-testid="share-dialog-provider"
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    fontSize: '13px',
                    border: '1px solid #d9d9d9',
                    borderRadius: '4px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="pinata">Pinata（推荐）</option>
                  <option value="web3storage">web3.storage</option>
                </select>
              </div>

              {/* API Key Input */}
              <div style={{ marginBottom: '12px' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '6px',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#262626',
                  }}
                >
                  自定义 API Key（可选）
                </label>
                <input
                  type="text"
                  value={customApiKey}
                  onChange={(e) => handleApiKeyChange(e.target.value)}
                  placeholder="留空使用内置默认 Key"
                  data-testid="share-dialog-apikey"
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    fontSize: '13px',
                    border: '1px solid #d9d9d9',
                    borderRadius: '4px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Custom Gateway Input (Pinata only) */}
              {selectedProvider === 'pinata' && (
                <div style={{ marginBottom: '4px' }}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '6px',
                      fontSize: '13px',
                      fontWeight: 500,
                      color: '#262626',
                    }}
                  >
                    自定义网关域名（可选）
                  </label>
                  <input
                    type="text"
                    value={customGateway}
                    onChange={(e) => handleGatewayChange(e.target.value)}
                    placeholder="例如: my-gateway.mypinata.cloud"
                    data-testid="share-dialog-gateway"
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      fontSize: '13px',
                      border: '1px solid #d9d9d9',
                      borderRadius: '4px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* CSS animation for spinner */}
      <style>{`
        @keyframes share-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

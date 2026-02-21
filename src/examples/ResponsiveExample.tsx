/**
 * Example demonstrating responsive design features
 * Feature: ai-html-visual-editor
 * 
 * Shows how viewport switching adjusts shape width and how
 * viewport-specific style overrides generate media queries.
 * 
 * Requirements: 18.2, 18.4, 18.6
 */

import React, { useState } from 'react';
import type { ViewportConfig, ElementOverride } from '../types';
import { ViewportSelector } from '../components/viewport/ViewportSelector';
import {
  responsiveManager,
  ViewportOverride,
} from '../utils/responsive/responsiveManager';
import { diffEngine } from '../core/diff/DiffEngine';

export function ResponsiveExample() {
  const [viewport, setViewport] = useState<ViewportConfig>('desktop');
  const [shapeWidth, setShapeWidth] = useState(1920);
  const [overrides, setOverrides] = useState<ViewportOverride[]>([]);

  // Handle viewport change
  const handleViewportChange = (newViewport: ViewportConfig) => {
    // Adjust shape width based on new viewport
    const newWidth = responsiveManager.adjustShapeWidth(
      shapeWidth,
      viewport,
      newViewport
    );

    setViewport(newViewport);
    setShapeWidth(newWidth);
  };

  // Add a style override for current viewport
  const addStyleOverride = (selector: string, styles: Record<string, string>) => {
    const override: ViewportOverride = {
      selector,
      styles,
      timestamp: Date.now(),
      aiGenerated: false,
      viewport,
    };

    setOverrides([...overrides, override]);
  };

  // Generate media queries from overrides
  const generateMediaQueries = () => {
    return responsiveManager.generateMediaQueries(overrides);
  };

  // Example: Add button style for current viewport
  const addButtonStyle = () => {
    const styles: Record<string, string> = {};

    if (viewport === 'mobile') {
      styles.fontSize = '14px';
      styles.padding = '8px 16px';
    } else if (viewport === 'tablet') {
      styles.fontSize = '16px';
      styles.padding = '10px 20px';
    } else {
      styles.fontSize = '18px';
      styles.padding = '12px 24px';
    }

    addStyleOverride('.example-button', styles);
  };

  const mediaQueries = generateMediaQueries();

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Responsive Design Example</h1>

      <div style={{ marginBottom: '20px' }}>
        <h2>Viewport Selector</h2>
        <ViewportSelector
          currentViewport={viewport}
          onViewportChange={handleViewportChange}
          showSize={true}
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Shape Width Adjustment</h2>
        <p>
          Current shape width: <strong>{shapeWidth}px</strong>
        </p>
        <p style={{ color: '#666', fontSize: '14px' }}>
          The shape width automatically adjusts when you switch viewports,
          maintaining the aspect ratio.
        </p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Viewport-Specific Styles</h2>
        <button
          onClick={addButtonStyle}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Add Button Style for {typeof viewport === 'string' ? viewport : 'custom'} Viewport
        </button>
        <p style={{ color: '#666', fontSize: '14px', marginTop: '10px' }}>
          Click to add a style override for the current viewport. Each viewport
          gets different button sizes.
        </p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Style Overrides ({overrides.length})</h2>
        {overrides.length === 0 ? (
          <p style={{ color: '#999' }}>No overrides yet. Add some styles above!</p>
        ) : (
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {overrides.map((override, index) => (
              <div
                key={index}
                style={{
                  padding: '10px',
                  marginBottom: '5px',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              >
                <div>
                  <strong>Selector:</strong> {override.selector}
                </div>
                <div>
                  <strong>Viewport:</strong>{' '}
                  {typeof override.viewport === 'string'
                    ? override.viewport
                    : `${override.viewport?.width}×${override.viewport?.height}`}
                </div>
                <div>
                  <strong>Styles:</strong>{' '}
                  {JSON.stringify(override.styles, null, 2)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Generated Media Queries</h2>
        {mediaQueries ? (
          <pre
            style={{
              padding: '15px',
              backgroundColor: '#f5f5f5',
              borderRadius: '4px',
              fontSize: '14px',
              overflowX: 'auto',
              border: '1px solid #ddd',
            }}
          >
            {mediaQueries}
          </pre>
        ) : (
          <p style={{ color: '#999' }}>
            No media queries yet. Add viewport-specific styles to see them here!
          </p>
        )}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Export with Media Queries</h2>
        <p style={{ color: '#666', fontSize: '14px' }}>
          When you export your HTML, all responsive media queries will be
          included automatically. The media queries ensure your styles adapt to
          different screen sizes.
        </p>
        <button
          onClick={() => {
            const css = mediaQueries;
            console.log('Exported CSS with media queries:', css);
            alert('Media queries exported! Check the console.');
          }}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
          disabled={!mediaQueries}
        >
          Export CSS
        </button>
      </div>

      <div
        style={{
          padding: '15px',
          backgroundColor: '#e7f3ff',
          borderRadius: '4px',
          border: '1px solid #b3d9ff',
        }}
      >
        <h3 style={{ marginTop: 0 }}>How It Works</h3>
        <ol style={{ marginBottom: 0, paddingLeft: '20px' }}>
          <li>
            <strong>Viewport Switching:</strong> When you change the viewport,
            the shape width automatically adjusts proportionally.
          </li>
          <li>
            <strong>Viewport-Specific Styles:</strong> Style changes made in
            different viewports are tracked separately.
          </li>
          <li>
            <strong>Media Query Generation:</strong> The system generates CSS
            media queries based on viewport-specific overrides.
          </li>
          <li>
            <strong>Export:</strong> All media queries are included when you
            export your HTML/CSS.
          </li>
        </ol>
      </div>
    </div>
  );
}

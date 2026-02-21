import * as React from 'react';
import { useState } from 'react';
import { CodeEditor } from '../components/editors';

const sampleHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sample Page</title>
</head>
<body>
  <div class="container">
    <h1>Hello World</h1>
    <p>This is a sample HTML page.</p>
    <button id="myButton">Click Me</button>
  </div>
</body>
</html>`;

const sampleCss = `.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

h1 {
  color: #333;
  font-size: 2rem;
  margin-bottom: 1rem;
}

p {
  color: #666;
  line-height: 1.6;
}

button {
  background-color: #007acc;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

button:hover {
  background-color: #005a9e;
}`;

const sampleJs = `document.addEventListener('DOMContentLoaded', function() {
  const button = document.getElementById('myButton');
  
  button.addEventListener('click', function() {
    alert('Button clicked!');
  });
  
  console.log('Page loaded successfully');
});`;

export const CodeEditorExample: React.FC = () => {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [code, setCode] = useState({
    html: sampleHtml,
    css: sampleCss,
    js: sampleJs,
  });

  const handleSave = (newCode: { html: string; css: string; js: string }) => {
    setCode(newCode);
    setIsEditorOpen(false);
    console.log('Code saved:', newCode);
  };

  const handleClose = () => {
    setIsEditorOpen(false);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Code Editor Example</h1>
      <p>This example demonstrates the CodeEditor component with syntax highlighting, validation, and formatting.</p>
      
      <button
        onClick={() => setIsEditorOpen(true)}
        style={{
          padding: '10px 20px',
          backgroundColor: '#007acc',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '16px',
          marginBottom: '20px',
        }}
      >
        Open Code Editor
      </button>

      {isEditorOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              width: '90%',
              height: '90%',
              backgroundColor: '#1e1e1e',
              borderRadius: '8px',
              overflow: 'hidden',
            }}
          >
            <CodeEditor
              html={code.html}
              css={code.css}
              js={code.js}
              onSave={handleSave}
              onClose={handleClose}
            />
          </div>
        </div>
      )}

      <div style={{ marginTop: '20px' }}>
        <h2>Current Code:</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
          <div>
            <h3>HTML</h3>
            <pre style={{
              backgroundColor: '#f5f5f5',
              padding: '10px',
              borderRadius: '4px',
              overflow: 'auto',
              maxHeight: '200px',
              fontSize: '12px',
            }}>
              {code.html}
            </pre>
          </div>
          <div>
            <h3>CSS</h3>
            <pre style={{
              backgroundColor: '#f5f5f5',
              padding: '10px',
              borderRadius: '4px',
              overflow: 'auto',
              maxHeight: '200px',
              fontSize: '12px',
            }}>
              {code.css}
            </pre>
          </div>
          <div>
            <h3>JavaScript</h3>
            <pre style={{
              backgroundColor: '#f5f5f5',
              padding: '10px',
              borderRadius: '4px',
              overflow: 'auto',
              maxHeight: '200px',
              fontSize: '12px',
            }}>
              {code.js}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

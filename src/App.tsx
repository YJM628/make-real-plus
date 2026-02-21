/**
 * Main App component for AI-driven HTML Visual Editor
 * Feature: ai-html-visual-editor
 */

import { EditorCanvas } from './components/canvas/EditorCanvas';
import './App.css';

function App() {
  console.log('App component rendering...');
  
  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#f0f0f0' }}>
      <EditorCanvas />
    </div>
  );
}

export default App;

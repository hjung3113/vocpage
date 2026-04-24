import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css';

function App() {
  return <div className="p-4">VOC 관리 시스템</div>;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

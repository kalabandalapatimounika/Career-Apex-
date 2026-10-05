import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Import enterprise CSS design system
import '../css/global.css';
import '../css/layout.css';
import '../css/components.css';
import '../css/dashboard.css';
import '../css/forms.css';
import '../css/tables.css';
import '../css/responsive.css';

const rootEl = document.getElementById('root');
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

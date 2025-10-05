import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// PWA Service Worker Registration
serviceWorkerRegistration.register({
  onSuccess: (registration: any) => {
    console.log('PWA Service Worker registered successfully:', registration);
  },
  onUpdate: (registration: any) => {
    console.log('PWA Service Worker updated:', registration);
    // Show update notification to user
    if (window.confirm('Yeni sürüm mevcut! Sayfayı yenilemek istiyor musunuz?')) {
      window.location.reload();
    }
  },
});


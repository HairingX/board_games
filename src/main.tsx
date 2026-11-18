import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { App } from './App';
import './app.css';

registerSW({ immediate: true });

const target = document.getElementById('app');
if (!target) throw new Error('The page has no #app element.');

createRoot(target).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

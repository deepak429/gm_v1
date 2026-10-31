import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { crazy } from './platform/CrazyGames';
import './styles.css';

// Initialise CrazyGames SDK before React mounts so the native loader can swap
// to the game cleanly. Safe no-op when the SDK isn't present (local dev).
crazy.init();

createRoot(document.getElementById('root')!).render(
  <React.StrictMode><App /></React.StrictMode>
);

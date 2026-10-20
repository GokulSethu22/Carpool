import { jsx as _jsx } from "react/jsx-runtime";
// main.tsx — Frontend application entry mounting React root into the DOM.
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/tokens.css';
import './styles/reset.css';
import './styles/app.css';
ReactDOM.createRoot(document.getElementById('root')).render(_jsx(React.StrictMode, { children: _jsx(App, {}) }));

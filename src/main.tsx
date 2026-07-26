// Polyfills for older Android WebViews (like Samsung J5)
if (!Array.prototype.includes) {
  Array.prototype.includes = function (searchElement, fromIndex) {
    if (this == null) {
      throw new TypeError('"this" is null or not defined');
    }
    const o = Object(this);
    const len = o.length >>> 0;
    if (len === 0) {
      return false;
    }
    const n = fromIndex | 0;
    let k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);
    while (k < len) {
      if (o[k] === searchElement) {
        return true;
      }
      k++;
    }
    return false;
  };
}

if (!String.prototype.padStart) {
  String.prototype.padStart = function padStart(targetLength, padString) {
    targetLength = targetLength >> 0;
    padString = String(typeof padString !== 'undefined' ? padString : ' ');
    if (this.length >= targetLength) {
      return String(this);
    } else {
      let pad = '';
      const len = targetLength - this.length;
      while (pad.length < len) {
        pad += padString;
      }
      return pad.slice(0, len) + String(this);
    }
  };
}

import React from 'react';
import ReactDOM from 'react-dom/client';
import CandyBlockBlast from './components/CandyBlockBlast';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <CandyBlockBlast />
  </React.StrictMode>
);

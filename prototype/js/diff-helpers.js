// Payload diff utilities — shared by result-review-detail.js
// Fix F: deep equality + display helpers

(function (global) {
  'use strict';

  /** Deep equality: handles primitives, null, and objects via JSON.stringify */
  function diffEq(a, b) {
    if (a === b) return true;
    if (a == null || b == null) return a === b;
    if (typeof a === 'object' || typeof b === 'object')
      return JSON.stringify(a) === JSON.stringify(b);
    return String(a) === String(b);
  }

  /** Convert a value to display text; objects are JSON.stringified */
  function valueToText(v) {
    if (v == null) return '';
    if (typeof v === 'object') return JSON.stringify(v);
    return String(v);
  }

  /**
   * Compute a key-level diff between two payload objects.
   * Returns array of { key, oldVal, newVal, type } where type is
   * 'added' | 'removed' | 'changed' | 'same'.
   */
  function computePayloadDiff(currentObj, newObj) {
    const allKeys = new Set([...Object.keys(currentObj || {}), ...Object.keys(newObj || {})]);
    return Array.from(allKeys).map((key) => {
      const oldVal =
        currentObj != null && Object.prototype.hasOwnProperty.call(currentObj, key)
          ? currentObj[key]
          : undefined;
      const newVal =
        newObj != null && Object.prototype.hasOwnProperty.call(newObj, key)
          ? newObj[key]
          : undefined;
      let type;
      if (oldVal === undefined) type = 'added';
      else if (newVal === undefined) type = 'removed';
      else if (!diffEq(oldVal, newVal)) type = 'changed';
      else type = 'same';
      return { key, oldVal, newVal, type };
    });
  }

  global.diffEq = diffEq;
  global.valueToText = valueToText;
  global.computePayloadDiff = computePayloadDiff;
})(window);

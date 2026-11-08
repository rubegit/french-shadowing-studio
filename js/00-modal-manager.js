/**
 * FSS Modal & Focus Accessibility Engine (FSSModal)
 * Module: M45A - Unit 02A
 * 
 * Strict WCAG 2.2 Level AA / APG Compliance:
 * - Direct lifecycle hooks (FSSModal.open / FSSModal.close)
 * - Sibling Tree Walking with Reference-Counted Inert Ownership
 * - Guaranteed active modal safety (modal can never have an inert ancestor)
 * - LIFO Modal Stack supporting nested modals & portal overlays
 * - Multi-tier Focus Restoration Fallback Chain
 * - Mobile Safari & Desktop Scroll Lock with Scroll Position Preservation
 * - Focus Containment (Tab / Shift+Tab) & Anti-leak Guard
 * - Empty Modal / Zero-focusable element graceful fallback
 * - Disconnected DOM Mutation & Abnormal Removal Cleanup
 */
(function(window, document) {
  'use strict';

  var FOCUSABLE_SELECTOR = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ].join(',');

  // State Management
  var modalStack = [];                       // LIFO Stack of active modal descriptors
  var inertRefCountMap = new Map();          // Map<HTMLElement, number>
  var originallyInertSet = new WeakSet();     // Snapshot of elements inert before any modal opened
  var registeredConfigs = {};                // Registry of modal configurations by ID

  var scrollLockDepth = 0;
  var initialBodyStyles = {
    position: '',
    top: '',
    width: '',
    overflow: ''
  };

  /**
   * Helper: Check if element is visible and interactive
   */
  function isVisibleAndInteractive(el) {
    if (!el || !el.isConnected) return false;
    if (el.disabled) return false;
    return !!(el.offsetWidth || el.offsetHeight || (el.getClientRects && el.getClientRects().length));
  }

  /**
   * Helper: Get visible focusable elements within container
   */
  function getFocusableElements(container) {
    if (!container) return [];
    var all = container.querySelectorAll(FOCUSABLE_SELECTOR);
    var visible = [];
    for (var i = 0; i < all.length; i++) {
      var item = all[i];
      if (item.offsetWidth > 0 || item.offsetHeight > 0 || (item.getClientRects && item.getClientRects().length > 0)) {
        visible.push(item);
      }
    }
    return visible;
  }

  /**
   * Snapshot page-level inert elements before first modal opens
   */
  function snapshotOriginalInertState() {
    originallyInertSet = new WeakSet();
    var children = document.body ? document.body.children : [];
    for (var i = 0; i < children.length; i++) {
      var child = children[i];
      if (child.inert === true) {
        originallyInertSet.add(child);
      }
    }
  }

  /**
   * Apply Sibling Tree Walking inert to isolate background
   * Guarantee: modalEl and all its ancestors are NEVER made inert!
   */
  function applySiblingInert(modalEl, descriptor) {
    if (!modalEl || !document.body) return;

    descriptor.ownedInerts = new Set();

    // 1. Collect active ancestry chain from modalEl to body
    var activeAncestors = new Set();
    var curr = modalEl;
    while (curr) {
      activeAncestors.add(curr);
      curr = curr.parentElement;
    }

    // 2. Walk up and inert siblings of each ancestor node
    var childNode = modalEl;
    var parentNode = modalEl.parentElement;

    while (parentNode && childNode !== document.body) {
      var siblings = parentNode.children;
      for (var i = 0; i < siblings.length; i++) {
        var sib = siblings[i];
        if (activeAncestors.has(sib)) continue;

        // Snapshot inert state at the exact moment of managing each individual element:
        // If an element was already inert outside our stack, preserve it and never modify/un-inert it!
        if (!inertRefCountMap.has(sib) && sib.inert === true) {
          originallyInertSet.add(sib);
        }
        if (originallyInertSet.has(sib)) continue;

        var count = inertRefCountMap.get(sib) || 0;
        count++;
        inertRefCountMap.set(sib, count);

        if (count === 1) {
          sib.inert = true;
        }
        descriptor.ownedInerts.add(sib);
      }

      childNode = parentNode;
      parentNode = parentNode.parentElement;
    }
  }

  /**
   * Release inert on elements owned by a closing modal descriptor
   */
  function releaseSiblingInert(descriptor) {
    if (!descriptor || !descriptor.ownedInerts) return;

    descriptor.ownedInerts.forEach(function(sib) {
      var count = inertRefCountMap.get(sib) || 1;
      count--;

      if (count <= 0) {
        inertRefCountMap.delete(sib);
        sib.inert = false;
      } else {
        inertRefCountMap.set(sib, count);
      }
    });

    descriptor.ownedInerts.clear();

    if (modalStack.length === 0) {
      inertRefCountMap.clear();
      originallyInertSet = new WeakSet();
    }
  }

  /**
   * Lock body scrolling preserving scroll position across Desktop & iOS Safari
   */
  function lockScroll() {
    if (scrollLockDepth === 0) {
      initialBodyStyles.position = document.body.style.position;
      initialBodyStyles.top = document.body.style.top;
      initialBodyStyles.width = document.body.style.width;
      initialBodyStyles.overflow = document.body.style.overflow;

      var scrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
      document.body.setAttribute('data-fss-scroll-y', String(scrollY));

      document.body.style.position = 'fixed';
      document.body.style.top = '-' + scrollY + 'px';
      document.body.style.width = '100%';
      document.body.classList.add('fss-modal-open');
    }
    scrollLockDepth++;
  }

  /**
   * Unlock body scrolling and restore exact scroll position
   */
  function unlockScroll() {
    scrollLockDepth--;
    if (scrollLockDepth <= 0) {
      scrollLockDepth = 0;

      var savedY = parseInt(document.body.getAttribute('data-fss-scroll-y') || '0', 10);
      document.body.removeAttribute('data-fss-scroll-y');

      document.body.style.position = initialBodyStyles.position || '';
      document.body.style.top = initialBodyStyles.top || '';
      document.body.style.width = initialBodyStyles.width || '';
      document.body.style.overflow = initialBodyStyles.overflow || '';
      document.body.classList.remove('fss-modal-open');

      if (!isNaN(savedY) && savedY >= 0) {
        window.scrollTo(0, savedY);
      }
    }
  }

  /**
   * Emergency Force Unlock Scroll (for debugging / crash recovery)
   */
  function forceUnlockScroll() {
    scrollLockDepth = 0;
    document.body.removeAttribute('data-fss-scroll-y');
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    document.body.style.overflow = '';
    document.body.classList.remove('fss-modal-open');
  }

  /**
   * Multi-tier Focus Restoration Fallback Chain
   */
  function restoreFocusWithFallback(descriptor) {
    var trigger = descriptor.triggerEl;
    var fallback = descriptor.fallbackTrigger;
    var target = null;

    var psmToggle = document.getElementById('practice-sandwich-btn') || document.getElementById('btn-practice-sandwich');

    if (isVisibleAndInteractive(trigger)) {
      target = trigger;
    } else if (trigger && trigger.closest && trigger.closest('#practice-sandwich-menu')) {
      if (isVisibleAndInteractive(psmToggle)) {
        target = psmToggle;
      }
    } else if (trigger && trigger.id === 'btn-share-video' && !isVisibleAndInteractive(trigger)) {
      if (isVisibleAndInteractive(psmToggle)) {
        target = psmToggle;
      }
    } else if (trigger && trigger.closest && trigger.closest('#pv-menu')) {
      var pvToggle = document.getElementById('pv-switch-btn') || document.getElementById('btn-pv-menu');
      if (isVisibleAndInteractive(pvToggle)) {
        target = pvToggle;
      }
    } else if (isVisibleAndInteractive(fallback)) {
      target = fallback;
    } else {
      if (isVisibleAndInteractive(psmToggle)) {
        target = psmToggle;
      } else {
        var screenPractice = document.getElementById('screen-practice');
        var appHeader = document.getElementById('app-header');
        target = isVisibleAndInteractive(screenPractice) ? screenPractice : appHeader;
        if (target && !target.hasAttribute('tabindex')) {
          target.setAttribute('tabindex', '-1');
          target._fssTempTabindex = true;
        }
      }
    }

    if (target && typeof target.focus === 'function') {
      try {
        target.focus();
      } catch (e) {
        console.warn('[FSSModal] Could not restore focus:', e);
      }
    }
  }

  /**
   * Set initial focus on modal open
   */
  function applyInitialFocus(descriptor) {
    var modalEl = descriptor.el;
    var focusTarget = null;

    if (descriptor.initialFocus) {
      if (typeof descriptor.initialFocus === 'function') {
        focusTarget = descriptor.initialFocus(modalEl);
      } else if (typeof descriptor.initialFocus === 'string') {
        var selectors = descriptor.initialFocus.split(',');
        for (var s = 0; s < selectors.length; s++) {
          var candidate = modalEl.querySelector(selectors[s].trim());
          if (isVisibleAndInteractive(candidate)) {
            focusTarget = candidate;
            break;
          }
        }
      }
    }

    if (!isVisibleAndInteractive(focusTarget)) {
      var autofocusEl = modalEl.querySelector('[data-autofocus]');
      if (isVisibleAndInteractive(autofocusEl)) {
        focusTarget = autofocusEl;
      } else {
        var focusables = getFocusableElements(modalEl);
        if (focusables.length > 0) {
          focusTarget = focusables[0];
        }
      }
    }

    // Empty modal guard: no focusable elements found
    if (!isVisibleAndInteractive(focusTarget)) {
      if (!modalEl.hasAttribute('tabindex')) {
        modalEl.setAttribute('tabindex', '-1');
        modalEl._fssTempTabindex = true;
      }
      focusTarget = modalEl;
    }

    // Focus immediately if already rendered, and schedule a second pass for transition animations
    if (isVisibleAndInteractive(focusTarget)) {
      try { focusTarget.focus(); } catch (err) {}
    }

    setTimeout(function() {
      if (isVisibleAndInteractive(focusTarget) && document.activeElement !== focusTarget) {
        try { focusTarget.focus(); } catch (err) {}
      }
    }, 30);
  }

  /**
   * Event Listener: Keyboard Focus Containment & Topmost Escape Handling (Capture Phase)
   */
  document.addEventListener('keydown', function(e) {
    cleanDisconnectedModals();
    if (modalStack.length === 0) return;
    var top = modalStack[modalStack.length - 1];

    // 1. Escape Handling
    if (e.key === 'Escape' || e.keyCode === 27) {
      e.preventDefault();
      e.stopImmediatePropagation();

      if (top.escapePolicy === 'blocked') {
        return; // Dialog forbids Escape dismissal
      }

      if (top.escapePolicy === 'prompt-if-dirty') {
        if (typeof top.isDirty === 'function' && top.isDirty()) {
          var confirmed = window.confirm('Bạn có thay đổi chưa lưu. Bạn có chắc chắn muốn đóng và hủy bỏ thay đổi?');
          if (!confirmed) return;
        }
      }

      try {
        if (typeof top.closeFn === 'function') {
          top.closeFn();
        } else {
          window.FSSModal.close(top.id);
        }
      } catch (err) {
        console.error('[FSSModal] Error in closeFn:', err);
        window.FSSModal.close(top.id);
      }
      return;
    }

    // 2. Tab / Shift+Tab Focus Cycling
    if (e.key === 'Tab' || e.keyCode === 9) {
      var focusables = getFocusableElements(top.el);

      if (focusables.length === 0) {
        e.preventDefault();
        if (!top.el.hasAttribute('tabindex')) {
          top.el.setAttribute('tabindex', '-1');
          top.el._fssTempTabindex = true;
        }
        top.el.focus();
        return;
      }

      var first = focusables[0];
      var last = focusables[focusables.length - 1];
      var active = document.activeElement;

      if (e.shiftKey) {
        if (active === first || !top.el.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (active === last || !top.el.contains(active)) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  }, true);

  /**
   * Event Listener: Focus Containment Anti-Leak Guard (Capture Phase)
   */
  document.addEventListener('focusin', function(e) {
    cleanDisconnectedModals();
    if (modalStack.length === 0) return;
    var top = modalStack[modalStack.length - 1];

    if (e.target && !top.el.contains(e.target)) {
      e.stopImmediatePropagation();
      var focusables = getFocusableElements(top.el);
      if (focusables.length > 0) {
        focusables[0].focus();
      } else {
        top.el.focus();
      }
    }
  }, true);

  /**
   * DOM Removal Cleanup Guard: periodically clean up disconnected modals
   */
  function cleanDisconnectedModals() {
    for (var i = modalStack.length - 1; i >= 0; i--) {
      var descriptor = modalStack[i];
      if (!descriptor.el || !descriptor.el.isConnected) {
        releaseSiblingInert(descriptor);
        unlockScroll();
        modalStack.splice(i, 1);
      }
    }
  }

  // =========================================================================
  // PUBLIC API: window.FSSModal
  // =========================================================================
  window.FSSModal = {
    /**
     * Register configuration for a modal
     */
    register: function(modalId, config) {
      if (!modalId) return;
      registeredConfigs[modalId] = config || {};
    },

    /**
     * Direct Lifecycle Hook: Modal Open
     */
    open: function(modalId, options) {
      options = options || {};
      cleanDisconnectedModals();

      var el = typeof modalId === 'string' ? document.getElementById(modalId) : modalId;
      if (!el) {
        console.warn('[FSSModal] Modal element not found:', modalId);
        return;
      }

      var id = el.id || modalId;
      var config = registeredConfigs[id] || {};

      // Capture trigger synchronously BEFORE focus changes
      var triggerEl = options.trigger || (document.activeElement && document.activeElement !== document.body ? document.activeElement : null);

      // Check if already open anywhere in stack
      for (var s = 0; s < modalStack.length; s++) {
        if (modalStack[s].el === el || modalStack[s].id === id) {
          return modalStack[s];
        }
      }

      var descriptor = {
        id: id,
        el: el,
        triggerEl: triggerEl,
        fallbackTrigger: options.fallbackTrigger || config.fallbackTrigger || null,
        initialFocus: options.initialFocus || config.initialFocus || null,
        closeFn: options.closeFn || config.closeFn || null,
        escapePolicy: options.escapePolicy || config.escapePolicy || 'allow',
        isDirty: options.isDirty || config.isDirty || null,
        ownedInerts: new Set()
      };

      modalStack.push(descriptor);

      // 1. Apply Scroll Lock
      lockScroll();

      // 2. Apply Sibling Tree Walking Inert (Never inerts modalEl or active ancestors)
      applySiblingInert(el, descriptor);

      // 3. Apply Initial Focus
      applyInitialFocus(descriptor);

      return descriptor;
    },

    /**
     * Direct Lifecycle Hook: Modal Close
     */
    close: function(modalId) {
      cleanDisconnectedModals();
      if (modalStack.length === 0) return;

      var targetIndex = -1;
      if (modalId) {
        for (var i = modalStack.length - 1; i >= 0; i--) {
          if (modalStack[i].id === modalId || modalStack[i].el === modalId) {
            targetIndex = i;
            break;
          }
        }
      } else {
        targetIndex = modalStack.length - 1; // Default to top of stack
      }

      if (targetIndex === -1) return;

      var descriptor = modalStack[targetIndex];
      modalStack.splice(targetIndex, 1);

      // 1. Release Inerts owned by this modal
      releaseSiblingInert(descriptor);

      // 2. Clean temporary tabindex if added
      if (descriptor.el && descriptor.el._fssTempTabindex) {
        descriptor.el.removeAttribute('tabindex');
        delete descriptor.el._fssTempTabindex;
      }

      // 3. Unlock Scroll
      unlockScroll();

      // 4. Restore Focus with Fallback Chain
      restoreFocusWithFallback(descriptor);

      // 5. If parent modal remains in stack, ensure its focus is maintained
      if (modalStack.length > 0) {
        var parentModal = modalStack[modalStack.length - 1];
        if (parentModal && parentModal.el) {
          var active = document.activeElement;
          if (!active || !parentModal.el.contains(active)) {
            applyInitialFocus(parentModal);
          }
        }
      }
    },

    /**
     * Inspection helpers for testing & verification
     */
    getActiveStack: function() {
      return modalStack.slice();
    },
    getInertRefCount: function(el) {
      return inertRefCountMap.get(el) || 0;
    },
    getScrollLockDepth: function() {
      return scrollLockDepth;
    },
    forceUnlockScroll: forceUnlockScroll
  };

})(window, document);

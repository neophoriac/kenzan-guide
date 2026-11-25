// One progress view: a desktop disclosure or a mobile modal sheet, never a clone.
function mountCompletionDrawer(compact, tracker, themeSettings, signal) {
  if (signal.aborted) return;
  const dialog = document.querySelector('#completion-drawer');
  const summary = compact.querySelector(':scope > summary');
  const total = compact.querySelector('#completion-compact-total');
  const home = document.createComment('compact tracker home');
  compact.before(home);
  const mobile = matchMedia('(max-width: 48rem), (max-height: 32rem) and (pointer: coarse)');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const root = document.documentElement;
  const previousReserve = root.style.getPropertyValue('--completion-dock-reserve');
  let releaseScroll;
  let inDrawer = false;
  let animation;
  let closing = false;
  let motionVersion = 0;
  let frame = 0;
  let gesture;
  let suppressClickUntil = 0;
  let backdropPointer;
  let reserve = 0;
  let closedHeight = 0;
  const visibleTrackerParts = new Set();
  const options = { signal };

  // The guide restores generic disclosure state; this control always starts closed.
  compact.open = false;
  compact.removeAttribute('data-overlaps-cards');

  function cancelAnimation() {
    motionVersion++;
    animation?.cancel();
    animation = undefined;
    closing = false;
  }

  function renderControl() {
    summary.setAttribute('aria-expanded', String(compact.open));
    summary.setAttribute('aria-label', `${compact.open ? 'Close' : 'Open'} completion tracker`);
    summary.setAttribute('aria-controls', mobile.matches ? dialog.id : 'completion-compact-list');
    if (mobile.matches) summary.setAttribute('aria-haspopup', 'dialog');
    else summary.removeAttribute('aria-haspopup');
  }

  function actualFocus() {
    const active = document.activeElement;
    if (!(active instanceof HTMLElement) || active === document.body || active === root) return;
    return { active, visible: active.closest('label') ?? active };
  }

  function updateVisibility() {
    frame = 0;
    if (signal.aborted) return;
    const focus = actualFocus();
    // Contextual hiding must never remove the control that currently owns focus.
    compact.hidden = !inDrawer && visibleTrackerParts.size > 0 && !compact.contains(focus?.active);
    if (inDrawer) {
      compact.removeAttribute('data-focus-overlap');
      return;
    }
    if (!mobile.matches && compact.open && focus && !compact.contains(focus.active)) compact.open = false;
    const bar = compact.getBoundingClientRect();
    const focused = focus && !compact.contains(focus.active) ? focus.visible.getBoundingClientRect() : undefined;
    const overlap = Boolean(!compact.hidden && focused?.width && focused.height &&
      focused.left < bar.right + 4 && focused.right > bar.left - 4 &&
      focused.top < bar.bottom + 4 && focused.bottom > bar.top - 4);
    compact.toggleAttribute('data-focus-overlap', overlap);
    reserve = mobile.matches && !compact.hidden ? bar.height : 0;
    root.style.setProperty('--completion-dock-reserve', `${Math.ceil(reserve)}px`);
    renderControl();
  }

  function requestVisibility() {
    if (!frame && !signal.aborted) frame = requestAnimationFrame(updateVisibility);
  }

  function finishClose(restoreFocus) {
    cancelAnimation();
    const version = motionVersion;
    clearGesture();
    const release = releaseScroll; releaseScroll = undefined;
    inDrawer = false;
    dialog.style.removeProperty('transform');
    compact.open = false;
    compact.removeAttribute('data-in-drawer');
    total.removeAttribute('aria-live');
    total.removeAttribute('aria-atomic');
    release?.();
    home.after(compact);
    if (version !== motionVersion || inDrawer) return;
    renderControl();
    updateVisibility();
    // Native close restores focus synchronously. The old session is already
    // retired, and a focus callback may now open a wholly new one.
    if (dialog.open) dialog.close();
    if (version !== motionVersion || inDrawer) return;
    if (restoreFocus && !signal.aborted) {
      (compact.hidden ? document.querySelector('#completion-title') : summary)?.focus({ preventScroll: true });
      updateVisibility();
    }
  }

  function closeDrawer({ focus = true, animate = true } = {}) {
    if (!inDrawer) return;
    if (!animate || reducedMotion.matches || !dialog.open) { finishClose(focus); return; }
    if (closing) return;
    const from = getComputedStyle(dialog).transform;
    cancelAnimation();
    closing = true;
    const version = motionVersion;
    // End at the existing dock header, rather than hiding the whole sheet and
    // making that header jump back onto the screen after reparenting.
    const offset = Math.max(0, dialog.clientHeight - closedHeight);
    animation = dialog.animate([{ transform: from }, { transform: `translateY(${offset}px)` }],
      { duration: 180, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'forwards' });
    animation.finished.then(() => {
      if (!signal.aborted && version === motionVersion) finishClose(focus);
    }, () => {});
  }

  function settleOpen() {
    const from = dialog.style.transform || getComputedStyle(dialog).transform;
    dialog.style.removeProperty('transform');
    cancelAnimation();
    if (!reducedMotion.matches) {
      animation = dialog.animate([{ transform: from }, { transform: 'translateY(0)' }],
        { duration: 220, easing: 'cubic-bezier(.2,.8,.2,1)' });
    }
  }

  function openDrawer({ animate = true, focus = true } = {}) {
    if (signal.aborted || !mobile.matches || inDrawer || compact.hidden) return;
    cancelAnimation();
    const version = motionVersion;
    closedHeight = compact.getBoundingClientRect().height;
    compact.removeAttribute('data-focus-overlap');
    inDrawer = true;
    dialog.append(compact);
    compact.dataset.inDrawer = '';
    total.setAttribute('aria-live', 'polite');
    total.setAttribute('aria-atomic', 'true');
    compact.hidden = false;
    compact.open = true;
    renderControl();
    try {
      // Hold the lease before showModal's native autofocus boundary; rollback
      // releases it if opening fails or a focus callback closes this session.
      releaseScroll = acquireDocumentScrollLock(document);
      dialog.showModal();
    } catch (error) { if (version === motionVersion) finishClose(false); throw error; }
    if (signal.aborted || version !== motionVersion || !inDrawer) return;
    if (focus) summary.focus({ preventScroll: true });
    if (signal.aborted || version !== motionVersion || !inDrawer) return;
    if (animate && !reducedMotion.matches) {
      const offset = Math.max(0, dialog.clientHeight - closedHeight);
      animation = dialog.animate([{ transform: `translateY(${offset}px)` }, { transform: 'translateY(0)' }],
        { duration: 220, easing: 'cubic-bezier(.16,1,.3,1)' });
    }
  }

  function focusDestination(id) {
    const target = findGuideTarget(id);
    if (!target) return;
    const focus = target.matches('summary, button, a, input, select') ? target
      : target.querySelector(':scope > summary, :scope > h2, :scope > h3, :scope > h4') ?? target;
    if (!focus.hasAttribute('tabindex') && !focus.matches('summary, button, a, input, select')) focus.tabIndex = -1;
    focus.focus({ preventScroll: true });
  }

  summary.addEventListener('click', event => {
    if (event.detail > 0 && performance.now() < suppressClickUntil) {
      suppressClickUntil = 0;
      event.preventDefault(); event.stopPropagation(); return;
    }
    if (mobile.matches) {
      event.preventDefault();
      if (inDrawer) closeDrawer();
      else openDrawer();
    } else summary.focus({ preventScroll: true });
  }, options);
  compact.addEventListener('toggle', () => {
    if (mobile.matches && compact.open && !inDrawer) {
      compact.open = false;
      openDrawer();
    }
    renderControl();
    requestVisibility();
  }, options);

  compact.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (!link || event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
    if (inDrawer) closeDrawer({ focus: false, animate: false });
    compact.open = false;
    renderControl();
    requestAnimationFrame(() => { if (!signal.aborted) focusDestination(link.hash.slice(1)); });
  }, options);

  function clearGesture() {
    const current = gesture;
    gesture = undefined;
    if (current && summary.hasPointerCapture(current.id)) summary.releasePointerCapture(current.id);
    return current;
  }

  function resetPreview() {
    const from = dialog.style.transform;
    dialog.style.removeProperty('transform');
    if (from && inDrawer && !closing && !reducedMotion.matches) {
      animation?.cancel();
      animation = dialog.animate([{ transform: from }, { transform: 'translateY(0)' }],
        { duration: 140, easing: 'cubic-bezier(.2,.8,.2,1)' });
    }
  }

  summary.addEventListener('pointerdown', event => {
    suppressClickUntil = 0;
    if (event.isPrimary === false && gesture) { cancelGesture(); return; }
    if (!mobile.matches || !['touch', 'pen'].includes(event.pointerType) || event.isPrimary === false || gesture) return;
    const offset = inDrawer ? new DOMMatrixReadOnly(getComputedStyle(dialog).transform).m42 : 0;
    cancelAnimation();
    if (inDrawer) dialog.style.transform = `translateY(${offset}px)`;
    gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, offset, open: inDrawer,
      samples: [{ y: event.clientY, time: event.timeStamp }], lastOffset: offset, height: inDrawer ? dialog.clientHeight : 0,
      preview: false, moving: false, intentional: false, travel: 0 };
  }, options);
  function sampleGesture(y, time) {
    gesture.samples.push({ y, time });
    if (gesture.samples.length > 20) gesture.samples.shift();
  }
  summary.addEventListener('pointermove', event => {
    if (!gesture || gesture.id !== event.pointerId) return;
    const dx = event.clientX - gesture.x, dy = event.clientY - gesture.y;
    gesture.travel = Math.max(gesture.travel, Math.abs(dx), Math.abs(dy));
    // A finger moves the sheet immediately. The intent threshold only decides
    // whether release was a tap or drag; it must not create a visual dead zone.
    if (!gesture.intentional && gesture.travel >= 8) {
      if (Math.abs(dy) < Math.abs(dx) * 1.25) {
        const current = clearGesture();
        suppressClickUntil = performance.now() + 500;
        if (current.preview) closeDrawer({ focus: false, animate: false });
        else resetPreview();
        return;
      }
      gesture.intentional = true;
    }
    if (!gesture.moving) {
      if (!dy || !gesture.open && dy >= 0) return;
      gesture.moving = true;
      if (!gesture.open) {
        // Mount the same live view on the first upward movement, then expose
        // exactly the dragged distance. Releasing only chooses the snap state.
        openDrawer({ animate: false, focus: false });
        if (!gesture || !inDrawer) return;
        gesture.preview = true;
        gesture.height = dialog.clientHeight;
        gesture.offset = Math.max(0, gesture.height - closedHeight);
      }
      summary.setPointerCapture(event.pointerId);
    }
    event.preventDefault();
    sampleGesture(event.clientY, event.timeStamp);
    gesture.lastOffset = Math.max(0, Math.min(gesture.offset + dy, gesture.height));
    dialog.style.transform = `translateY(${gesture.lastOffset}px)`;
  }, options);
  summary.addEventListener('pointerup', event => {
    if (!gesture || gesture.id !== event.pointerId) return;
    sampleGesture(event.clientY, event.timeStamp);
    const current = clearGesture();
    if (!current.moving) { resetPreview(); return; }
    suppressClickUntil = performance.now() + 500;
    if (current.travel <= 4) {
      if (current.open) closeDrawer(); else settleOpen();
      return;
    }
    const extent = Math.max(0, dialog.clientHeight - closedHeight);
    const target = verticalReleaseTarget(current.lastOffset, extent,
      verticalGestureVelocity(current.samples, event.timeStamp));
    if (target === 'closed') closeDrawer(); else settleOpen();
  }, options);
  function cancelGesture() {
    if (!gesture) return;
    const current = clearGesture();
    if (current.moving) suppressClickUntil = performance.now() + 500;
    if (current.preview) closeDrawer({ animate: false });
    else resetPreview();
  }
  summary.addEventListener('pointercancel', cancelGesture, options);
  summary.addEventListener('lostpointercapture', event => {
    // Touch starts with implicit capture on the hit child; transferring it to
    // the header must not cancel that same gesture when the child's loss bubbles.
    if (event.target === summary && gesture?.id === event.pointerId) cancelGesture();
  }, options);
  compact.addEventListener('touchstart', event => { if (event.touches.length > 1) cancelGesture(); }, { ...options, passive: true });

  dialog.addEventListener('cancel', event => { event.preventDefault(); closeDrawer(); }, options);
  dialog.addEventListener('close', () => { if (inDrawer && !dialog.open) finishClose(true); }, options);
  const outside = event => {
    const box = dialog.getBoundingClientRect();
    return event.target === dialog && (event.clientX < box.left || event.clientX > box.right ||
      event.clientY < box.top || event.clientY > box.bottom);
  };
  dialog.addEventListener('pointerdown', event => { backdropPointer = outside(event) ? event.pointerId : undefined; }, options);
  dialog.addEventListener('pointerup', event => {
    if (event.pointerId === backdropPointer && outside(event)) closeDrawer();
    backdropPointer = undefined;
  }, options);

  document.addEventListener('focusin', updateVisibility, options);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !inDrawer && compact.open && compact.contains(document.activeElement)) {
      event.preventDefault();
      compact.open = false;
      summary.focus({ preventScroll: true });
      updateVisibility();
    }
  }, options);
  window.addEventListener('scroll', requestVisibility, { passive: true, signal });
  window.addEventListener('resize', () => {
    cancelGesture();
    if (closing) finishClose(false);
    requestVisibility();
  }, options);
  window.addEventListener('hashchange', () => {
    if (inDrawer) closeDrawer({ focus: false, animate: false });
  }, options);
  mobile.addEventListener('change', () => {
    cancelGesture();
    if (inDrawer) closeDrawer({ animate: false });
    compact.open = false;
    renderControl();
    updateVisibility();
  }, options);
  reducedMotion.addEventListener('change', () => {
    if (!reducedMotion.matches || !animation) return;
    if (closing) finishClose(true);
    else { cancelAnimation(); dialog.style.removeProperty('transform'); }
  }, options);
  const visible = new IntersectionObserver(entries => {
    for (const { target, isIntersecting } of entries) {
      if (isIntersecting) visibleTrackerParts.add(target);
      else visibleTrackerParts.delete(target);
    }
    requestVisibility();
  });
  visible.observe(tracker);
  visible.observe(themeSettings);
  const size = new ResizeObserver(requestVisibility);
  size.observe(compact);

  signal.addEventListener('abort', () => {
    if (inDrawer) closeDrawer({ focus: false, animate: false });
    cancelAnimation();
    clearGesture();
    visible.disconnect();
    size.disconnect();
    if (frame) cancelAnimationFrame(frame);
    if (previousReserve) root.style.setProperty('--completion-dock-reserve', previousReserve);
    else root.style.removeProperty('--completion-dock-reserve');
    home.remove();
  }, { once: true });
  renderControl();
  updateVisibility();
}

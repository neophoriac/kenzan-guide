// One guide-view control. Its frame and listeners end with the mounted view.
function mountGuideScrollTop(signal) {
  const button = document.createElement('button');
  button.type = 'button'; button.className = 'guide-scroll-top';
  button.title = 'Scroll to top'; button.setAttribute('aria-label', 'Scroll to top');
  button.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 14 7-7 7 7M12 7v13M5 3h14"/></svg>';
  button.hidden = true;
  document.querySelector('#guide-view').append(button);
  let frame;
  const reflect = () => { frame = undefined; button.hidden = scrollY < Math.max(480, innerHeight * .8); };
  const schedule = () => { if (frame === undefined) frame = requestAnimationFrame(reflect); };
  button.addEventListener('click', () => {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    const heading = document.querySelector('#guide h1');
    if (heading) { if (!heading.hasAttribute('tabindex')) heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
  }, { signal });
  window.addEventListener('scroll', schedule, { passive: true, signal });
  window.addEventListener('resize', schedule, { signal });
  signal.addEventListener('abort', () => { if (frame !== undefined) cancelAnimationFrame(frame); button.remove(); }, { once: true });
  reflect();
}

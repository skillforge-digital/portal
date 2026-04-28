(function () {
  const sidebar =
    document.getElementById('sidebar') ||
    document.getElementById('main-sidebar') ||
    document.querySelector('aside');

  if (!sidebar) return;

  sidebar.classList.add('sf-drawer-sidebar');

  const html = document.documentElement;

  const overlay = document.createElement('div');
  overlay.className = 'sf-mobile-overlay';
  overlay.addEventListener('click', () => closeDrawer());

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'sf-mobile-hamburger md:hidden';
  button.setAttribute('aria-label', 'Open navigation menu');
  button.setAttribute('aria-expanded', 'false');
  const ICON_MENU =
    '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  const ICON_CLOSE =
    '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  button.innerHTML = ICON_MENU;

  function setOpen(isOpen) {
    if (isOpen) {
      html.classList.add('sf-drawer-open');
      document.body.style.overflow = 'hidden';
      button.setAttribute('aria-expanded', 'true');
      button.setAttribute('aria-label', 'Close navigation menu');
      button.innerHTML = ICON_CLOSE;
      sidebar.classList.remove('-translate-x-full');
      sidebar.classList.add('translate-x-0');
    } else {
      html.classList.remove('sf-drawer-open');
      document.body.style.overflow = '';
      button.setAttribute('aria-expanded', 'false');
      button.setAttribute('aria-label', 'Open navigation menu');
      button.innerHTML = ICON_MENU;
      sidebar.classList.add('-translate-x-full');
      sidebar.classList.remove('translate-x-0');
    }
  }

  function isMobile() {
    return window.matchMedia('(max-width: 767px)').matches;
  }

  function toggleDrawer() {
    if (!isMobile()) return;
    setOpen(!html.classList.contains('sf-drawer-open'));
  }

  function closeDrawer() {
    setOpen(false);
  }

  button.addEventListener('click', toggleDrawer);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDrawer();
  });

  sidebar.addEventListener(
    'click',
    (e) => {
      const t = e.target;
      if (!(t instanceof Element)) return;
      if (t.closest('a,button')) closeDrawer();
    },
    true
  );

  window.addEventListener('resize', () => {
    if (!isMobile()) closeDrawer();
  });

  document.body.appendChild(overlay);
  document.body.appendChild(button);
})();

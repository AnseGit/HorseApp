// Lightweight interactions used only to demonstrate the prototype.
document.addEventListener('DOMContentLoaded', () => {
  const toast = document.querySelector('.toast');
  let toastTimer;

  function showToast() {
    toast.classList.add('is-visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 3200);
  }

  document.querySelectorAll('.prototype-button').forEach((button) => button.addEventListener('click', showToast));

  const menuToggle = document.querySelector('.menu-toggle');
  const navLinks = document.querySelector('.nav-links');
  menuToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('is-open');
    menuToggle.setAttribute('aria-expanded', isOpen);
  });
  navLinks.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
    navLinks.classList.remove('is-open');
    menuToggle.setAttribute('aria-expanded', 'false');
  }));

  document.querySelectorAll('.role-card').forEach((card) => card.addEventListener('click', () => {
    document.querySelectorAll('.role-card').forEach((item) => {
      item.classList.remove('is-selected');
      item.setAttribute('aria-pressed', 'false');
    });
    card.classList.add('is-selected');
    card.setAttribute('aria-pressed', 'true');
    showToast();
  }));

  const horseCards = document.querySelectorAll('.horse-card');
  document.querySelectorAll('.filter-button').forEach((button) => button.addEventListener('click', () => {
    const filter = button.dataset.filter;
    document.querySelectorAll('.filter-button').forEach((item) => item.classList.toggle('is-active', item === button));
    horseCards.forEach((card) => card.classList.toggle('is-hidden', filter !== 'alle' && !card.dataset.category.includes(filter)));
  }));

  const modal = document.querySelector('.modal');
  const modalTitle = document.querySelector('#modal-title');
  const modalDescription = document.querySelector('#modal-description');
  const closeButton = document.querySelector('.modal-close');
  let previousFocus;

  function closeModal() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    previousFocus?.focus();
  }
  document.querySelectorAll('.profile-button').forEach((button) => button.addEventListener('click', () => {
    previousFocus = button;
    modalTitle.textContent = button.dataset.horse;
    modalDescription.textContent = button.dataset.info;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    closeButton.focus();
  }));
  closeButton.addEventListener('click', closeModal);
  modal.addEventListener('click', (event) => { if (event.target === modal) closeModal(); });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && modal.classList.contains('is-open')) closeModal(); });
});
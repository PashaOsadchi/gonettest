function setupToggle(container, selector) {
    if (!container) return;
    container.querySelectorAll(selector).forEach(el => {
        const target = el.dataset.target;
        const icon = el.querySelector('i');
        el.addEventListener('click', () => {
            const cont = document.getElementById(target);
            if (!cont) return;
            cont.classList.toggle('hidden');
            if (icon) {
                icon.setAttribute('data-lucide', cont.classList.contains('hidden') ? 'plus' : 'minus');
                if (window.lucide) {
                    lucide.createIcons({ strokeWidth: 1.2, class: 'h-4 w-4' });
                }
            }
        });
    });
}

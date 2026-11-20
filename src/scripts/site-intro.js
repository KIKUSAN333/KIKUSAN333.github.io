(() => {
    if (!window.matchMedia("(prefers-reduced-motion: no-preference)").matches) return;

    try {
        if (sessionStorage.getItem("kiku-intro-seen")) return;
        sessionStorage.setItem("kiku-intro-seen", "1");
    } catch {
        // Keep the page immediately accessible when storage is blocked.
        return;
    }

    const intro = document.getElementById("site-intro");
    const pieces = [...intro.querySelectorAll(".piece")];
    const directions = ["left", "up", "right", "down"];
    const exits = pieces.map((_, index) => directions[index % directions.length]);

    for (let index = exits.length - 1; index > 0; index--) {
        const other = Math.floor(Math.random() * (index + 1));
        [exits[index], exits[other]] = [exits[other], exits[index]];
    }

    pieces.forEach((piece, index) => {
        piece.dataset.exit = exits[index];
    });

    intro.addEventListener("animationend", (event) => {
        if (event.target === intro) intro.remove();
    });
    intro.classList.add("is-playing");
})();

export function initScrollReveal(selector: string) {
    // JavaScriptが無効な場合でも内容が見えるよう、初期状態では表示しておきます。
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const revealAnimations = new Set<Animation>();

    if ("IntersectionObserver" in window) {
        const revealObserver = new IntersectionObserver((entries) => {
            let revealIndex = 0;

            for (const entry of entries) {
                if (!entry.isIntersecting) continue;

                revealObserver.unobserve(entry.target);

                if (reducedMotion.matches || entry.target.matches(":focus-within")) continue;

                const animation = entry.target.animate(
                    [
                        { opacity: 0, transform: "translateY(28px)" },
                        { opacity: 1, transform: "translateY(0)" },
                    ],
                    {
                        duration: 700,
                        delay: Math.min(revealIndex++, 2) * 100,
                        easing: "cubic-bezier(0.16, 1, 0.3, 1)",
                        fill: "backwards",
                    },
                );

                // キーボード操作でフォーカスされたリンクが見えるよう、アニメーションを解除します。
                const revealOnFocus = () => animation.cancel();
                entry.target.addEventListener("focusin", revealOnFocus);
                revealAnimations.add(animation);
                const cleanup = () => {
                    revealAnimations.delete(animation);
                    entry.target.removeEventListener("focusin", revealOnFocus);
                };
                animation.addEventListener("finish", cleanup, { once: true });
                animation.addEventListener("cancel", cleanup, { once: true });
            }
        }, { threshold: 0 });

        document.querySelectorAll(selector).forEach((element) => revealObserver.observe(element));

        reducedMotion.addEventListener("change", () => {
            if (reducedMotion.matches) {
                revealAnimations.forEach((animation) => animation.cancel());
            }
        });
    }
}

export function initScrollReveal(selector: string) {
    // JavaScriptが無効な場合でも内容が見えるよう、初期状態では表示しておきます。
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const revealAnimations = new Set<Animation>();

    if ("IntersectionObserver" in window) {
        // 画面に入った要素を受け取る監視処理を用意する。
        const revealObserver = new IntersectionObserver((entries) => {
            let revealIndex = 0;

            for (const entry of entries) {
                if (!entry.isIntersecting) continue;

                // 一度画面に入った要素の監視を終え、再スクロール時の再生を防ぐ。
                revealObserver.unobserve(entry.target);

                // 動きを減らす設定や、すでにフォーカスされた要素はすぐに表示する。
                if (reducedMotion.matches || entry.target.matches(":focus-within")) continue;

                // 下から浮かび上がらせ、同時に入った要素には最大200msの時間差をつける。
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

                // 終了・中断時に、実行中の一覧から外してフォーカスの監視も解除する。
                const cleanup = () => {
                    revealAnimations.delete(animation);
                    entry.target.removeEventListener("focusin", revealOnFocus);
                };
                animation.addEventListener("finish", cleanup, { once: true });
                animation.addEventListener("cancel", cleanup, { once: true });
            }
        }, { threshold: 0 });

        // セレクターに一致する要素を探し、画面に入るか監視する。
        document.querySelectorAll(selector).forEach((element) => revealObserver.observe(element));

        // 再生中に「動きを減らす」が有効になったら、実行中の演出を中断する。
        reducedMotion.addEventListener("change", () => {
            if (reducedMotion.matches) {
                revealAnimations.forEach((animation) => animation.cancel());
            }
        });
    }
}

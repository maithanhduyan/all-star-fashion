import { useEffect } from "preact/hooks";

/**
 * PageTransition Island
 *
 * Provides smooth page transitions for MPA (Multi-Page Application):
 * 1. Intercepts internal link clicks → fade-out before navigation
 * 2. Intersection Observer → staggered content reveal on scroll
 * 3. Graceful fallback for browsers without View Transitions API
 */
export default function PageTransition() {
  useEffect(() => {
    // --- 1. Page Exit Transition ---
    // Create overlay element for fade-out effect
    const overlay = document.createElement("div");
    overlay.className = "page-transition-overlay";
    document.body.appendChild(overlay);

    // Check if browser supports View Transitions API natively
    const hasViewTransitions = "startViewTransition" in document;

    function handleLinkClick(e: MouseEvent) {
      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      if (!href) return;

      // Skip if:
      // - External link
      // - Hash link (same page scroll)
      // - New tab (ctrl/cmd click)
      // - Download link
      // - JavaScript link
      // - API route
      if (
        href.startsWith("http") ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("javascript:") ||
        href.startsWith("/api/") ||
        target.getAttribute("target") === "_blank" ||
        target.getAttribute("download") !== null ||
        e.ctrlKey ||
        e.metaKey ||
        e.shiftKey
      ) {
        return;
      }

      // Skip if same page
      const currentPath = globalThis.location.pathname + globalThis.location.search;
      if (href === currentPath) return;

      // If browser supports View Transitions, let it handle natively
      if (hasViewTransitions) return;

      // Prevent default navigation
      e.preventDefault();

      // Activate fade-out overlay
      overlay.classList.add("active");

      // Navigate after fade-out completes
      setTimeout(() => {
        globalThis.location.href = href;
      }, 220);
    }

    document.addEventListener("click", handleLinkClick);

    // --- 2. Handle browser back/forward ---
    function handlePageShow(e: PageTransitionEvent) {
      // When returning via back/forward (bfcache), remove overlay
      if (e.persisted) {
        overlay.classList.remove("active");
      }
    }
    globalThis.addEventListener("pageshow", handlePageShow);

    // --- 3. Intersection Observer for Content Reveal ---
    const revealElements = document.querySelectorAll(".reveal, .reveal-fade");

    if (revealElements.length > 0) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              // Small delay to ensure smooth appearance
              requestAnimationFrame(() => {
                entry.target.classList.add("revealed");
              });
              observer.unobserve(entry.target);
            }
          });
        },
        {
          threshold: 0.1,
          rootMargin: "0px 0px -40px 0px",
        },
      );

      revealElements.forEach((el) => observer.observe(el));

      // Cleanup observer
      return () => {
        observer.disconnect();
        document.removeEventListener("click", handleLinkClick);
        globalThis.removeEventListener("pageshow", handlePageShow);
        overlay.remove();
      };
    }

    return () => {
      document.removeEventListener("click", handleLinkClick);
      globalThis.removeEventListener("pageshow", handlePageShow);
      overlay.remove();
    };
  }, []);

  return null;
}

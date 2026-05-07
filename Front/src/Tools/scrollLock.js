let lockCount = 0;
let savedBodyStyles = null;
let savedScrollY = 0;
const lockedContainers = new Map();

export function lockPageScroll() {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return () => {};
  }

  lockCount += 1;

  if (lockCount === 1) {
    savedScrollY = window.scrollY || window.pageYOffset || 0;
    savedBodyStyles = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
    };

    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${savedScrollY}px`;
    document.body.style.width = "100%";

    document
      .querySelectorAll("[data-scroll-removed-mongo-user='true']")
      .forEach((element) => {
        lockedContainers.set(element, {
          overflow: element.style.overflow,
          overflowY: element.style.overflowY,
        });
        element.style.overflow = "hidden";
        element.style.overflowY = "hidden";
      });
  }

  let released = false;

  return () => {
    if (released) return;
    released = true;
    lockCount = Math.max(0, lockCount - 1);

    if (lockCount > 0) return;

    if (savedBodyStyles) {
      document.body.style.overflow = savedBodyStyles.overflow;
      document.body.style.position = savedBodyStyles.position;
      document.body.style.top = savedBodyStyles.top;
      document.body.style.width = savedBodyStyles.width;
    }

    lockedContainers.forEach((styles, element) => {
      element.style.overflow = styles.overflow;
      element.style.overflowY = styles.overflowY;
    });
    lockedContainers.clear();

    window.scrollTo(0, savedScrollY);
    savedBodyStyles = null;
    savedScrollY = 0;
  };
}

import { lockPageScroll } from "./scrollLock";

describe("scrollLock", () => {
  it("locks the page scroll and restores the original styles on release", () => {
    const scrollToSpy = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    Object.defineProperty(window, "scrollY", {
      value: 120,
      configurable: true,
    });

    document.body.style.overflow = "auto";
    document.body.style.position = "static";
    document.body.style.top = "";
    document.body.style.width = "";

    const release = lockPageScroll();

    expect(document.body.style.overflow).toBe("hidden");
    expect(document.body.style.position).toBe("fixed");
    expect(document.body.style.top).toBe("-120px");
    expect(document.body.style.width).toBe("100%");

    release();

    expect(document.body.style.overflow).toBe("auto");
    expect(document.body.style.position).toBe("static");
    expect(document.body.style.top).toBe("");
    expect(document.body.style.width).toBe("");
    expect(scrollToSpy).toHaveBeenCalledWith(0, 120);
  });

  it("keeps the page locked until all lock handlers are released", () => {
    const firstRelease = lockPageScroll();
    const secondRelease = lockPageScroll();

    firstRelease();
    expect(document.body.style.overflow).toBe("hidden");

    secondRelease();
    expect(document.body.style.overflow).not.toBe("hidden");
  });
});

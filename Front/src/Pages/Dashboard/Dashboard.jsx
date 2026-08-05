import { useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import DashList2 from "./DashList2";
import FloatingActionButtons from "./FloatingActionButtons";
import SoftVersion from "./SoftVersion";
import { setLocalStorageItemSafe } from "../../Tools/storageSafe";
import { useCompactAppLayout } from "../../Tools/responsiveLayout";

function Dashboard() {
  const isCompactLayout = useCompactAppLayout();
  const isIntermediateLayout =
    typeof window !== "undefined" &&
    !isCompactLayout &&
    window.innerWidth >= 768 &&
    window.innerWidth < 1366;

  // pega o searchTerm vindo do RootLayouts (via Outlet context)
  const { searchTerm = "" } = useOutletContext() || {};

  useEffect(() => {
    setLocalStorageItemSafe("cifraFROMDB", "");
    setLocalStorageItemSafe("fromWHERE", "");

    setLocalStorageItemSafe("artist", "");
    setLocalStorageItemSafe("song", "");

  }, []);

  useEffect(() => {
    const resetDashboardScroll = () => {
      try {
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      } catch {
        // Some test/browser contexts expose scrollTo without implementing it.
      }
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;

      requestAnimationFrame(() => {
        document
          .querySelectorAll("[data-dashboard-scroll-container='true']")
          .forEach((element) => {
            element.scrollTo?.({ top: 0, left: 0, behavior: "auto" });
          });
      });
    };

    resetDashboardScroll();
    window.addEventListener("dashboard-reset-scroll", resetDashboardScroll);

    return () => {
      window.removeEventListener("dashboard-reset-scroll", resetDashboardScroll);
    };
  }, []);

  useEffect(() => {
    const shouldLockScroll = !isCompactLayout;
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow; // <html>

    if (shouldLockScroll) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, [isCompactLayout]);

  return (
    <div className={`flex h-full min-h-0 justify-center overflow-hidden ${isCompactLayout ? "pt-0" : "pt-1"}`}>
      {isCompactLayout ? (
        <div className="mobile h-full min-h-0 w-full overflow-hidden bg-[#f0f0f0] px-3 pt-3">
          <DashList2 searchTerm={searchTerm} />
          <FloatingActionButtons />
        </div>
      ) : (
          <div className="desktop mx-auto flex h-full min-h-0 w-full max-w-none flex-col overflow-hidden px-4">
          <DashList2 searchTerm={searchTerm} />
          <FloatingActionButtons />
          {!isIntermediateLayout ? <SoftVersion /> : null}
        </div>
      )}
    </div>
  );
}

export default Dashboard;

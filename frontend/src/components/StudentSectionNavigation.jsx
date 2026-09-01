import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, X } from "lucide-react";

/**
 * Local navigation for views inside one student workspace. The parent owns the
 * active view, so this component never creates a second source of navigation
 * truth or changes a route on its own.
 */
export default function StudentSectionNavigation({
  sectionLabel,
  items,
  activeId,
  onSelect,
  accent = "#2563eb",
  surface = "#ffffff",
}) {
  const [open, setOpen] = useState(false);
  const startY = useRef(null);
  const restoreOverflow = useRef("");
  const hasHistoryEntry = useRef(false);
  const pendingSelection = useRef(null);
  const onSelectRef = useRef(onSelect);
  const sheetId = useId();
  const activeItem = items.find((item) => item.id === activeId) || items[0];

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  const close = () => {
    setOpen(false);
    if (hasHistoryEntry.current) {
      hasHistoryEntry.current = false;
      window.history.back();
    }
  };
  const choose = (id) => {
    if (id !== activeId) pendingSelection.current = id;
    close();
  };

  useEffect(() => {
    if (!open) return undefined;

    restoreOverflow.current = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Add a same-URL history entry solely while the sheet is visible. Browser
    // Back dismisses the sheet without taking the student away from the view.
    window.history.pushState({ gradeflowSectionSheet: true }, "", window.location.href);
    hasHistoryEntry.current = true;
    const onKeyDown = (event) => {
      if (event.key === "Escape") close();
    };
    const onPopState = () => {
      hasHistoryEntry.current = false;
      setOpen(false);
      const nextSelection = pendingSelection.current;
      pendingSelection.current = null;
      if (nextSelection) onSelectRef.current(nextSelection);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("popstate", onPopState);

    return () => {
      document.body.style.overflow = restoreOverflow.current;
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("popstate", onPopState);
    };
  }, [open]);

  if (!activeItem) return null;

  return (
    <>
      <div className="gf-section-nav" style={{ "--gf-section-accent": accent, background: surface }}>
        <button
          type="button"
          className="gf-section-nav__trigger"
          onClick={() => setOpen((isOpen) => !isOpen)}
          aria-expanded={open}
          aria-controls={sheetId}
          aria-label={`Choose ${sectionLabel} view; current view ${activeItem.label}`}
        >
          <span className="gf-section-nav__icon" style={{ color: accent }}>{activeItem.icon}</span>
          <span className="gf-section-nav__label">{activeItem.shortLabel || activeItem.label}</span>
          <ChevronDown className="gf-section-nav__chevron" size={18} aria-hidden="true" />
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            className="gf-section-sheet-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) close();
            }}
            role="presentation"
          >
            <motion.section
              id={sheetId}
              className="gf-section-sheet"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
              role="dialog"
              aria-modal="true"
              aria-label={`${sectionLabel} views`}
              onTouchStart={(event) => {
                startY.current = event.touches[0]?.clientY ?? null;
              }}
              onTouchEnd={(event) => {
                const finishY = event.changedTouches[0]?.clientY;
                if (startY.current !== null && finishY - startY.current > 70) close();
                startY.current = null;
              }}
            >
              <div className="gf-section-sheet__handle" aria-hidden="true" />
              <div className="gf-section-sheet__header">
                <div>
                  <p>Current section</p>
                  <h2>{sectionLabel}</h2>
                </div>
                <button type="button" className="gf-section-sheet__close" onClick={close} aria-label="Close section navigation">
                  <X size={20} />
                </button>
              </div>
              <div className="gf-section-sheet__list">
                {items.map((item) => {
                  const selected = item.id === activeId;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className="gf-section-sheet__item"
                      data-active={selected || undefined}
                      onClick={() => choose(item.id)}
                    >
                      <span className="gf-section-sheet__item-icon" style={{ color: selected ? accent : "#64748b" }}>{item.icon}</span>
                      <span className="gf-section-sheet__item-copy">
                        <strong>{item.label}</strong>
                        {item.description && <small>{item.description}</small>}
                      </span>
                      {selected && <Check size={19} aria-label="Current view" style={{ color: accent }} />}
                    </button>
                  );
                })}
              </div>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

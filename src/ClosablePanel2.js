import * as react from "react";
import { globalContext } from "./globalContext.js";

export function ClosablePanel2({
  name,
  title,
  closeFlag = false,
  callback4Toggle,
  children,
  debugMode = false,

  // ✅ NEW (optional)
  variant = "default",          // "default" | "valueOnly"
  values = undefined,           // array of strings/objects for valueOnly mode
  columns = 2,                  // number of columns in valueOnly mode
  renderValue = undefined,      // optional custom renderer: (item, index) => JSX
  bodyClassName = "",           // optional className for body wrapper
}) {
  const componentName = "ClosablePanel2";
  if (debugMode) console.log(`${componentName} component start ...`);

  if (callback4Toggle === undefined)
    callback4Toggle = () => console.log("Default callback for toggle");

  const showBody = !closeFlag;

  const renderValueOnly = () => {
    const list = Array.isArray(values) ? values : [];

    if (list.length === 0) {
      return <div className="text-muted">-</div>;
    }

    const gridStyle = {
      display: "grid",
      gridTemplateColumns: `repeat(${Math.max(1, columns)}, minmax(0, 1fr))`,
      columnGap: "80px",
      rowGap: "18px",
      padding: "16px 24px 20px 24px",
      borderTop: "1px solid #E6E6E7",
    };

    return (
      <div style={gridStyle} className={bodyClassName}>
        {list.map((item, idx) => (
          <div key={idx} style={{ color: "#494D4F", fontSize: "16px" }}>
            {renderValue ? renderValue(item, idx) : (item ?? "-")}
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <div className="mt-4 border" style={{ borderRadius: "16px" }}>
        <div
          className="d-flex align-items-center justify-content-between px-4 py-3"
          role="button"
          onClick={() => callback4Toggle(name, closeFlag)}
        >
          <div style={{ color: "#494D4F", fontSize: "16px", fontWeight: "bold" }}>
            {title}
          </div>

          <div className="text-end">
            {closeFlag ? (
              <i className="fas fa-chevron-left fa-fw"></i>
            ) : (
              <i className="fas fa-chevron-down fa-fw"></i>
            )}
          </div>
        </div>

        {/* Body */}
        {!showBody ? null : variant === "valueOnly" ? (
        <>
            {/* value-only grid */}
            <div className="border-top px-4">
            {Array.isArray(values) && values.filter(Boolean).length > 0 ? (
                (() => {
                const list = values.filter(Boolean);
                const half = Math.ceil(list.length / 2);
                const left = list.slice(0, half);
                const right = list.slice(half);

                return (
                    <div className="row gx-0">
                    <div className="col-6 pe-4">
                        <div className="d-flex flex-column">
                        {left.map((v, idx) => (
                            <div key={`l-${idx}`} className="closable2-panel-value-font">
                                {v}
                            </div>
                        ))}
                        </div>
                    </div>

                    {/* ✅ center vertical line */}
                    <div className="col-6 ps-4 border-start">
                        <div className="d-flex flex-column">
                        {right.map((v, idx) => (
                            <div key={`r-${idx}`} className="closable2-panel-value-font">
                                {v}
                            </div>
                        ))}
                        </div>
                    </div>
                    </div>
                );
                })()
            ) : (
                <div className="text-muted">-</div>
            )}
            </div>

            {/* ✅ keep footer (Edit button) */}
            {children}
        </>
        ) : (
        children
        )}

      </div>
    </>
  );
}

export default ClosablePanel2;

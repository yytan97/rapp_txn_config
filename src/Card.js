import * as react from "react";

export function Card({ label, tip, numCount, days, debugMode = false }) {
    const componentName = "Card";
    if (debugMode) console.log(`${componentName} component start ...`);

    return (
        <div className="sm-card">
            <div className="d-flex">
                <div className="label">
                    {label}
                </div>
                <span className="ms-1 material-icons text-dark"
                    role="button"
                    style={{ fontSize: "16px" }}
                    data-bs-toggle="popover"
                    data-bs-trigger="hover focus"
                    data-bs-content={tip}
                    tabIndex="-1">
                    info
                </span>
            </div>
            <div className="value">
                <span className="num-count">{numCount}</span> <span className="fs-14-unity">{days}</span>
            </div>
        </div>
    );


}
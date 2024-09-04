
import * as react from "react";


// Map loaded lib here ...
// const uuidv4 = window.uuidv4;
// const moment = window.moment;

export function InputLabel({ label, tip, required, debugMode = false }) {
    const componentName = "InputLabel";
    if (debugMode) console.log(`${componentName} component start ...`);

    return (

        <div className="px-3 mb-1" style={{ color: "#76797B", fontSize: "12px" }}>
            {label}
            {required ? <span className="text-danger ms-1">*</span> : null}
            {
                tip ? (
                    <span className="ms-1 material-icons text-dark"
                        role="button"
                        style={{ fontSize: "16px" }}
                        data-bs-toggle="popover"
                        data-bs-trigger="hover focus"
                        data-bs-content={tip}
                        tabIndex="-1">
                        info
                    </span>
                ) : null
            }

        </div>



    );
}

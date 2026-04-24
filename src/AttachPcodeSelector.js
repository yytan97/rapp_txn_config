import * as react from 'react';
import * as tBox from "./tBox.js";
import * as apiBox from "./apiBox.js";
import { globalContext } from "./globalContext.js";
import pcodeMap from "./kswitchpcode.json";

export function AttachPcodeSelector({ processingCodes = [], onOpenDrawer, onRemoveCode, debugMode = true}) {

    const componentName = "AttachPcodeSelector";
    if (debugMode) console.log(`${componentName} start ...`);

    const {
        gsl,
        getSessionToken,
        updateUser,
        check4Right,
        applicationDebugMode
    } = react.useContext(globalContext);

    // if app debug mode provided by context, override
    if (applicationDebugMode !== undefined) debugMode = applicationDebugMode;

    let sl = tBox.getStringLabel(gsl, componentName);

    function formatPcodeLabel(code) {
        const normalized = String(code || "").padStart(2, "0");
        return pcodeMap?.[normalized]?.value || pcodeMap?.[String(parseInt(normalized, 10))]?.value || "-";
    }

    return (
        <div className="txn_type_box">
            {processingCodes.length === 0 ? (
                <div className="txn_type_empty_box">
                    <div className="edit-desc-font text-center mb-16" style={{ fontSize: "14px" }}>
                        {sl.l_set_transaction_type || "Set transaction type via processing code for the Institution."}
                        <span style={{ color: "#FF6B45" }}>*</span>
                    </div>

                    <button
                        type="button"
                        className="btn btn-light"
                        style={{ border: "none", background: "transparent" }}
                        onClick={onOpenDrawer}
                    >
                        <span className="material-icons" style={{ color: "#494D4F" }}>
                            add_circle
                        </span>
                        <span className="attach_ins-add-button-font pl-4">
                            {sl.l_add_processing_code || "Add Processing Code"}
                        </span>
                    </button>
                </div>
            ) : (
                <>
                    <div className="txn_type_selected_box">
                        <div className="d-flex justify-content-between align-items-start mb-12">
                            <div className="dark-grey-font-700 pb-8">
                                {sl.l_processing_code || "Processing Code"}
                            </div>

                            <span
                                className="material-icons"
                                style={{ color: "#494D4F", cursor: "pointer" }}
                                onClick={onOpenDrawer}
                            >
                                more_vert
                            </span>
                        </div>

                        <div className="row">
                            {processingCodes.map((code, index) => (
                                <div key={`${code}-${index}`} className="col-6 mb-12">
                                    <div className="d-flex align-items-center pb-8">
                                        <span
                                            className="material-icons"
                                            style={{
                                                color: "#36B37E",
                                                fontSize: "20px",
                                                marginRight: "8px"
                                            }}
                                        >
                                            check_circle
                                        </span>

                                        <span className="default-font" style={{ paddingLeft: 0, fontSize: "14px" }}>
                                            ({String(code).padStart(2, "0")}) {formatPcodeLabel(code)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button
                        type="button"
                        className="btn btn-light mt-16"
                        onClick={onOpenDrawer}
                        style={{ border: "none", background: "transparent", padding: 0 }}
                    >
                        <span className="material-icons" style={{ color: "#494D4F" }}>
                            add_circle
                        </span>
                        <span className="attach_ins-add-button-font pl-4">
                            {sl.l_add_processing_code || "Add Processing Code"}
                        </span>
                    </button>
                </>
            )}
        </div>
    );
}
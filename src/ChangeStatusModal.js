
import * as react from "react";
import * as tBox from "./tBox.js";
import * as apiBox from "./apiBox.js";
import { globalContext } from "./globalContext.js";

import { showInfoDialogBox } from "./InfoDialogBox.js";
import { showConfirmDialogBox } from "./ConfirmDialogBox.js";
import { showStateDialogBox, closeStateDialogBox } from "./StateDialogBox.js";

export function ChangeStatusModal({ 
    show = false, 
    onClose = () => { }, 
    record = undefined, 
    onUpdated = () => { }, 
    debugMode = true,

    tableName,
    databaseName,
    accessObjectName,
    accessActionPrefix,
    statusOptions,
    statusField = "recordStatus", // default for other pages
}) {
    const componentName = "ChangeStatusModal";
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
    const institutionId = record?.recordData?.institutionId;

    const [selectedStatus, setSelectedStatus] = react.useState(record?.recordData?.[statusField] ?? "");
    const [saving, setSaving] = react.useState(false);

    // sync when record changes
    react.useEffect(() => {
        setSelectedStatus(record?.recordData?.[statusField] ?? "");
    }, [record, statusField]);

    if (!show) return null;
    if (!tableName || !databaseName) {
        console.error("ChangeStatusModal missing tableName/databaseName props.");
        return null;
    }

    async function handleSave() {
        if (debugMode) console.log("ChangeStatusModal save", selectedStatus, record);

        // permission check
        if (!check4Right(accessObjectName, `${accessActionPrefix}.edit`)) {
            showInfoDialogBox(sl?.m_no_permission);

            return;
        }

        // confirm if status actually changed
        if (selectedStatus === (record?.recordData?.[statusField] ?? "")) {
            onClose();
            
            return;
        }

        showStateDialogBox();
        setSaving(true);

        try {
            // build payload - keep existing recordData but change status
            const payload = {
                ...record.recordData,
                [statusField]: selectedStatus
            };

            let result = await apiBox.updateRecordWithId(
                getSessionToken(), 
                databaseName, 
                tableName, 
                record.recordData.rowId, 
                payload
            );

            if (result && result.flag) {
                let successMsg = sl?.m_record_updated;
                showInfoDialogBox(successMsg, () => {
                    onClose();
                    onUpdated(); // let parent refresh
                });
            } else {
                throw result;
            }
        } catch (e) {
            console.warn("Error updating status", e);
            let message = tBox.getErrorMessage(e, sl);
            showInfoDialogBox(message);
            if (tBox.isBlockErrorCode(e)) updateUser(undefined);
        } finally {
            setSaving(false);
            closeStateDialogBox();
        }

        // let message = sl?.m_confirm_update_status || `Change status for ${record?.recordData?.rowId} to ${selectedStatus}?`;
        // showConfirmDialogBox(message, async () => {
        //     showStateDialogBox();
        //     setSaving(true);
        //     try {
        //         // build payload - keep existing recordData but change status
        //         const payload = {
        //             ...record.recordData,
        //             recordStatus: selectedStatus
        //         };

        //         let result = await apiBox.updateRecordWithId(getSessionToken(), databaseName, tableName, record.recordData.rowId, payload);
        //         if (result && result.flag) {
        //             let successMsg = sl?.m_record_updated || "Record updated";
        //             showInfoDialogBox(successMsg, () => {
        //                 onClose();
        //                 onUpdated(); // let parent refresh
        //             });
        //         } else {
        //             throw result;
        //         }
        //     } catch (e) {
        //         console.warn("Error updating status", e);
        //         let message = tBox.getErrorMessage(e, sl);
        //         showInfoDialogBox(message);
        //         if (tBox.isBlockErrorCode(e)) updateUser(undefined);
        //     } finally {
        //         setSaving(false);
        //         closeStateDialogBox();
        //     }
        // });
    }

    return (
        <div className="modal-overlay">
            <div className="modal-panel change-status-modal-box" role="dialog" aria-modal="true">
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <div className="d-flex" style={{ fontWeight: "700", fontSize: "18px" }}>
                        <span class="material-icons-outlined" style={{color: "#FF5630"}}>warning</span>
                        {sl.l_change_status}
                    </div>
                </div>

                <div className="mb-3">
                    <div className="text-muted" style={{ fontSize: "14px" }}>
                        {sl.l_are_you_sure_status}
                        <strong> {institutionId} </strong>?
                        <br/>
                        {sl.l_change_status_anytime}
                    </div>
                </div>

                <div className="mb-3">
                    <select
                        className="form-select"
                        value={selectedStatus}
                        onChange={(e) => {
                            const v = e.target.value;
                            const shouldBeNumber = statusOptions?.some((o) => typeof o.value === "number");
                            setSelectedStatus(shouldBeNumber ? Number(v) : v);
                        }}
                    >
                        <option value="" disabled>{sl?.p_select_status}</option>
                        {(statusOptions?.length
                            ? statusOptions
                            : [
                                { value: "A", label: sl?.o_record_status_A },
                                { value: "P", label: sl?.o_record_status_P },
                                { value: "D", label: sl?.o_record_status_D },
                                { value: "I", label: sl?.o_record_status_I },
                                ]
                            ).map((opt) => (
                            <option key={String(opt.value)} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="d-flex justify-content-end mt-48">
                    <button className="btn btn-ghost-unity me-2" type="button" onClick={() => onClose()} disabled={saving}>
                        {sl?.b_no}
                    </button>
                    <button className="btn btn-primary" type="button" onClick={handleSave} disabled={saving}>
                        {saving ? (sl?.b_saving) : (sl?.b_yes)}
                    </button>
                </div>
            </div>

            {/* basic overlay style — you probably already have CSS, but keep this to ensure visibility */}
            <style jsx>{`
                .modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0,0,0,0.35);
                    z-index: 1050;
                    display: flex;
                    align-items: flex-start;
                    justify-content: center;
                    padding-top: 6vh;
                }
            `}</style>
        </div>
    );
}

export default ChangeStatusModal;

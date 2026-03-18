import * as react from 'react';
import * as tBox from "./tBox.js";
import * as apiBox from "./apiBox.js";
import { globalContext } from "./globalContext.js";

export function AttachInstitutionSelector({ institutions, setInstitutions, openDrawer, debugMode = true}) {
    
    const componentName = "AttachInstitutionSelector";
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
    
    function removeInstitution(index) {
        let list = institutions.filter((_, i) => i !== index);
        setInstitutions(list);
    }

    function addInstitution() {
        setInstitutions([...institutions, { id: "", name: "" }]);
    }

    return (
        <div>

            {institutions.map((inst, index) => (
                <div key={index} className="mb-3">
                    <label className="form-label tableRow-title pl-16">
                        {sl.l_select_institution || "Select institution"}
                    </label>
                    <div className="d-flex align-items-center">
                        <input
                            type="text"
                            readOnly
                            className="form-control"
                            value={inst.name || ""}
                            placeholder="Choose institution"
                            onClick={() => openDrawer(index)}
                        />

                        {institutions.length > 1 && (
                            <button
                                type="button"
                                className="btn btn-light ms-2"
                                style={{ background: "transparent", border: "none"}}
                                onClick={() => removeInstitution(index)}
                            >
                                <span class="material-icons" style={{ color: "#494D4F" }}>cancel</span>
                            </button>
                        )}
                    </div>
                </div>
            ))}

            {institutions.some(i => i.id) && (
                <button
                    type="button"
                    className="btn btn-light mt-2"
                    onClick={addInstitution}
                    style={{ border: "none", padding: "4px 16px" }}
                >
                    <span class="material-icons" style={{ color: "#494D4F" }}>add_circle</span> <div className='attach_ins-add-button-font pl-4'>{sl.l_attach_institution}</div>
                </button>
            )}

        </div>
    );
}

import * as react from "react";
import * as reactRouter from "react-router-dom";

import * as tBox from "./tBox.js";
import * as apiBox from "./apiBox.js";
import { globalContext } from "./globalContext.js";

// import { ErrorLine } from "./ErrorLine.js";
import { DumpPanel } from "./DumpPanel.js";

import { SideBar } from "./SideBar.js";
import { TitlePanel } from "./TitlePanel.js";
import { FooterPanel } from "./FooterPanel.js";

import { showConfirmDialogBox } from "./ConfirmDialogBox.js";
import { showStateDialogBox, closeStateDialogBox } from "./StateDialogBox.js";
import { showInfoDialogBox } from "./InfoDialogBox.js";

// Map loaded lib here ...
const uuidv4 = window.uuidv4;
const moment = window.moment;

export function SettingPage({ debugMode = true }) {
    const componentName = "SettingPage";
    if (debugMode) console.log(`${componentName} component start ...`);

    // let data = reactRouter.useLoaderData();
    const {
        config, localData, gsl, dataset, user,
        appRedraw, setAppRedraw,
        applicationDebugMode,
        updateUser
    } = react.useContext(globalContext);

    // check from context
    if (applicationDebugMode !== undefined) debugMode = applicationDebugMode;
    let sl = tBox.getStringLabel(gsl, componentName);

    const inputFileRef = react.useRef();
    const [avatar, setAvatar] = react.useState(dataset.avatar);
    const [uploadFile, setUploadFile] = react.useState(null);

    const navigate = reactRouter.useNavigate();

    react.useEffect(() => {
        if (debugMode) console.log(`Run ${componentName} on effect`);
    }, []);

    // event handling function here ...
    function click4Echo(e) {
        if (debugMode) console.log("Click for echo ", e);
        return;
    };

    async function trigger4FileSelect(e) {
        if (debugMode) console.log("Trigger for file select", e);
        inputFileRef.current.click();
        return;
    };

    async function change4File(e) {
        if (debugMode) console.log("Change for file ", e);
        let file = e.target.files[0];
        if (debugMode) console.log(file);

        if (file !== undefined) {
            let url = URL.createObjectURL(file);
            if (debugMode) console.log(url);
            setAvatar(url);
            setUploadFile(file);
        };

        return;
    };

    async function click4UploadAvatar(e) {
        if (debugMode) console.log("Click for upload avatar ", e, user);
        showStateDialogBox();

        try {
            let result = await apiBox.uploadAvatar(user.username, uploadFile, undefined);
            if (result.flag) {

                let result2 = await apiBox.getUserAvatar(user.username);
                if (result2.flag) {
                    dataset.avatar = URL.createObjectURL(result2.data);
                    user.avatarURL = result2.url;
                    setAppRedraw(appRedraw + 1);
                }

                let message = sl.m_avatar_uploaded_successfully;
                showInfoDialogBox(message);
            }
            else {
                throw result;
            }

        }
        catch (e) {
            console.warn("Error", e);
            let message = tBox.getErrorMessage(e, sl);
            showInfoDialogBox(message);
            if (tBox.isBlockErrorCode(e)) updateUser(undefined);

        }
        finally {
            closeStateDialogBox();
        }
        return;
    };

    function click4ClearSession(e) {
        if (debugMode) console.log("Click for clear ", e);

        showConfirmDialogBox(`${sl.m_confirm_clear_session}`, () => {
            tBox.clearAppLocalData();

            let message = sl.m_user_session_clear;
            showInfoDialogBox(message);
        });

    };

    return (
        <div className="container-fluid px-0 bg-unity-1">
            <TitlePanel />
            <div className="d-flex ">
                <div style={{ ...(dataset?.sideBarWidth) }}>
                    <SideBar />
                </div>

                <div className="flex-fill" style={{ ...(dataset?.mainPanelWidth) }}>

                    <div className="mt-2 mb-4 mx-4" style={{ minHeight: "100vh", }}>
                        <div className="text-end" style={{ fontSize: "12px", color: "#76797B" }}>
                            {sl.l_last_updated} {tBox.getLastUpdatedDate()}
                        </div>

                        <div style={{ fontSize: "24px", fontWeight: "bold" }}>{sl.l_setting}</div>

                        <div className="mt-3 p-4 bg-white shadow"
                            style={{ border: "1px solid #f3f3f3", borderRadius: "16px", minHeight: "calc(100vh - 160px)" }}>
                            <div className="d-flex flex-column">

                                <div className="col-12">
                                    <div style={{ fontSize: "16px", fontWeight: "bold" }}>
                                        {sl.l_reset_local_storage_setting}
                                    </div>

                                    <div className="mt-3 d-flex justify-content-between align-items-center px-3">
                                        <div style={{ fontSize: "14px" }}>{sl.l_clear_the_user_local_session}</div>
                                        <div>
                                            <button className="btn btn-danger text-white"
                                                style={{ width: "120px" }}
                                                onClick={click4ClearSession}>
                                                <span className="material-icons-outlined fs-24-unity pe-2 ">clear</span>
                                                {sl.b_clear}
                                            </button>
                                        </div>
                                    </div>

                                </div>

                                <hr />
                                <div className="col-12">
                                    <div style={{ fontSize: "16px", fontWeight: "bold" }}>{sl.l_user_avatar_setting}</div>

                                    <div className="mt-3 d-flex justify-content-between align-items-center px-3">
                                        <div style={{ fontSize: "14px" }}>

                                            <div className="position-relative">

                                                <img src={avatar ? avatar : 'images/avatar0002.png'}
                                                    onError={(e) => e.target.src = 'images/avatar0002.png'}
                                                    className="border border-3 rounded-circle"
                                                    style={{ width: "128px", height: "128px", objectFit: "cover" }} />

                                                <input type="file" accept="image/*"
                                                    ref={inputFileRef}
                                                    onChange={change4File}
                                                    style={{ display: "none" }} />

                                                <div className="position-absolute" style={{ bottom: "2px", left: "96px" }}
                                                    role="button"
                                                    onClick={trigger4FileSelect} >
                                                    <span className="material-icons fs-16-unity rounded-circle border p-2"
                                                        style={{ backgroundColor: "#f5f5f5" }} role="button">
                                                        add
                                                    </span>
                                                </div>
                                            </div>

                                        </div>
                                        <div>
                                            <button className="btn btn-primary"
                                                style={{ width: "120px" }}
                                                onClick={click4UploadAvatar}
                                                disabled={(uploadFile === null)}>
                                                <span className="material-icons-outlined fs-24-unity pe-2 ">upload_file</span>
                                                {sl.b_upload}
                                            </button>
                                        </div>
                                    </div>

                                </div>

                            </div>
                        </div>

                    </div>

                    <DumpPanel dataList={[
                        { name: "localData", data: localData },
                        { name: "config", data: config },
                        { name: "sl", data: sl },
                        { name: "dataset", data: dataset },
                    ]} debugMode={debugMode} />

                </div>

            </div>

            <FooterPanel />
        </div>
    );
}
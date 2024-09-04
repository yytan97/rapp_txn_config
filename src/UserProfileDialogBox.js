import * as react from "react";
// import * as reactRouter from "react-router-dom";

import * as tBox from "./tBox.js";
import { globalContext } from "./globalContext.js";


// Map loaded lib here ...
// const uuidv4 = window.uuidv4;
// const moment = window.moment;
const bootstrap = window.bootstrap;

let avatar = undefined;
let message = undefined;
let callback4OK = undefined;
let modal = undefined;
let label4OK = undefined;
let data = {};

export function UserProfileDialogBox({ debugMode = false }) {
    const componentName = "UserProfileDialogBox";
    if (debugMode) console.log(`${componentName} component start ...`);

    const { config, localData, gsl, user, dataset, updateApplicationLanguage } = react.useContext(globalContext);
    let sl = tBox.getStringLabel(gsl, componentName);

    const ref4Div = react.useRef();
    const [redraw, setRedraw] = react.useState(0);


    react.useEffect(() => {
        if (debugMode) console.log(`Show ${componentName} component`);

        if (modal === undefined) {
            if (debugMode) console.log("Create modal instance");
            modal = new bootstrap.Modal(ref4Div.current, { backdrop: "static" });

            ref4Div.current.addEventListener('hidden.bs.modal', callback4Hide);
            window.addEventListener("showUserProfileDialogBox", callback4Show);
        }

        // clean up
        return () => {
            console.log(`Unmount ${componentName}`);
            if (modal !== undefined) {
                console.log(`Clean up for ${componentName}`);
                window.removeEventListener("showUserProfileDialogBox", callback4Show);
                ref4Div.current.removeEventListener('hidden.bs.modal', callback4Hide);

                modal.dispose();
                modal = undefined;
            }
        };

    }, []);

    function callback4Hide(e) {
        if (callback4OK != undefined)
            callback4OK(message);
    };

    function callback4Show(e) {
        console.log("Receive event 'showUserProfileDialogBox'", e.detail);
        let detail = e.detail;

        data = detail.data;
        if (data === undefined) {
            console.log("No user information from parameter; Get it from context");
            data = user;
        }

        avatar = detail.avatar;
        if (avatar === undefined) {
            console.log("No avatar from parameter; Get it from context");
            avatar = dataset.avatar;
        }
        callback4OK = detail.callback4OK;
        label4OK = detail.label4OK;

        setRedraw((v) => v + 1);
        setTimeout(showModal, 100);
        return;
    };

    function showModal() {
        if (debugMode) console.log("Show modal");
        modal.show();
        return;
    };

    function click4OK(e) {
        if (debugMode) console.log("Click for ok ", e);
        modal.hide();

        return;
    };

    return (
        <>
            <div className="modal" ref={ref4Div} tabIndex="-1" role="dialog" >
                <div className="modal-dialog modal-dialog-centered" role="document">

                    <div className="modal-content ">

                        <div className="modal-body justify-content-center text-center">

                            <div>
                                <img className="rounded-circle border"
                                    src={avatar ? avatar : "images/avatar0002.png"}
                                    style={{ width: "128px", height: "128px", objectFit: "cover" }} />
                            </div>

                            <div className="mt-3 table-responsive text-start">
                                <table className="table table-striped">
                                    <tbody>
                                        <tr>
                                            <td>{sl.l_username}</td>
                                            <td>{data?.username}</td>
                                        </tr>
                                        <tr>
                                            <td>{sl.l_email}</td>
                                            <td>
                                                {data?.extraInfo?.email?.address || data?.extraInfo?.record?.emailAddress}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>{sl.l_organization_name}</td>
                                            <td>
                                                {data?.user?.organization?.name || data?.organizationName}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>{sl.l_last_login}</td>
                                            <td>{tBox.formatDate(data?.user?.lastLogin)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                        </div>

                        <div className="modal-footer justify-content-center text-center border-0">
                            <button type="button"
                                className="btn btn-unity "
                                onClick={click4OK}>
                                {label4OK || sl.b_OK}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export function showUserProfileDialogBox(user, avatar) {
    console.log("Show user profile dialog box");
    let detail = {
        data: user,
        avatar: avatar
    };

    let e = new CustomEvent("showUserProfileDialogBox", {
        detail: detail
    });
    window.dispatchEvent(e);
    return;
};
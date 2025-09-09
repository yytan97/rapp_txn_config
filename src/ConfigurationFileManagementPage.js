
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

import { cleanUp as cleanUp4Detail } from "./TableManagementPage.js";

// Map loaded lib here ...
const uuidv4 = window.uuidv4;
const moment = window.moment;

let dataList = [];
let filterText = "";

const accessObjectName = "webapp_configuration_access";
const accessActionPrefix = "configuration";

let order = {
    field: {},
    name: undefined,
};

export function cleanUp() {
    console.log("Clean up");
    dataList = [];
    filterText = "";

    order = {
        field: {},
        name: undefined,
    };
    return;
};

export function ConfigurationFileManagementPage({ debugMode = true }) {
    const componentName = "ConfigurationFileManagementPage";
    if (debugMode) console.log(`${componentName} component start ...`);

    // let data = reactRouter.useLoaderData();
    const {
        config, localData, gsl, dataset, user,
        applicationDebugMode, applicationLanguage,
        updateUser,
        getSessionToken, getUsername,
        check4Right
    } = react.useContext(globalContext);

    // check from context
    if (applicationDebugMode !== undefined) debugMode = applicationDebugMode;
    let sl = tBox.getStringLabel(gsl, componentName);

    let [redraw, setRedraw] = react.useState(0);
    let [refresh, setRefresh] = react.useState(true);

    const navigate = reactRouter.useNavigate();

    react.useEffect(() => {
        if (debugMode) console.log(`Run ${componentName} on effect`);

        let timer = setTimeout(async () => {
            if (refresh) loadDataList();
        }, 100);

        return () => {
            if (debugMode) console.log(`Unmount ${componentName}`);
            clearTimeout(timer)
        };

    }, [refresh]);

    // event handling function here ...

    async function loadDataList() {
        showStateDialogBox();

        try {
            // await tBox.sleep(1000 * 1);
            if (!check4Right(accessObjectName, `${accessActionPrefix}.access`)) {
                throw ({ errorCode: "permission_denied" });
            }

            let result1 = await apiBox.getConfigurationFileList(getSessionToken());

            dataList = [];
            if (result1.flag) {
                let list1 = result1.data.files;
                list1 = list1.map((item) => {

                    let record = parseFilePath(item.name);
                    return { ...record, origin: item };
                });
                dataList = [...list1];
                console.log("Data list", dataList);
            }
            else throw (result1);

        }
        catch (e) {
            console.warn("Error", e);
            let message = tBox.getErrorMessage(e, sl);
            showInfoDialogBox(message);
            if (tBox.isBlockErrorCode(e)) updateUser(undefined);
        }
        finally {
            closeStateDialogBox();
            setRefresh(false);
        }

    };

    function parseFilePath(path) {
        let parts = (/^(.*[\\\/])?(.*?)(\.[^.]*?|)$/gi).exec(path);
        return {
            path: parts[0] || "",
            directoryPath: parts[1] || "",
            namePath: parts[2] || "",
            filename: parts[2] + parts[3],
            extension: parts[3] || "",
        };
    };


    function click4Filter(e) {
        if (debugMode) console.log("Click for filter or refresh ", e);
        setRefresh(true);
        return;
    };

    function change4FilterText(e) {
        if (debugMode) console.log("Change for filter text ", e);
        filterText = e.target.value;

        setRedraw((v) => v + 1);
        return;
    };

    function toggle4Order(e, order, name) {
        if (debugMode) console.log("Toggle for order ", e, order, name);
        changeOrder(order, name);
        setRedraw((v) => v + 1);
        return;
    };

    function changeOrder(order, name) {
        if (debugMode) console.log("Change order", order, name);

        if (order.field[name] === undefined) {
            order.field[name] = {};
        }

        for (let key in order.field) {
            let record = order.field[key];

            if (key === name) {
                // 0 not sorted, 1 for sort asc and 2 for sort desc
                if (record.flag === undefined) record.flag = 0;
                record.flag = record.flag + 1;
                if (record.flag >= 3) record.flag = 0;
                order.name = name;
            }
            else {
                record.flag = 0;
            }
        }

        return;
    };

    function getOrderIndicator(order, name) {
        if (debugMode) console.log("Get order indicator", order, name);

        let record = order.field[name];
        if (record === undefined) return <span style={{ width: "12px" }}></span>;
        else if (record?.flag === 1) return <span><i className="fas fa-sort-asc fa-fw"></i></span>;
        else if (record?.flag === 2) return <span><i className="fas fa-sort-desc fa-fw"></i></span>;

        return <span style={{ width: "12px" }}></span>;
    };

    function sort4Order(record1, record2) {
        let name = order.name;

        if (name === undefined || order.field[name] === undefined || order.field[name].flag === undefined) return 0;

        let a = eval(`record1.${name}`);
        let b = eval(`record2.${name}`);
        console.log("Sort", a, b);
        if (order.field[name].flag === 1) {
            if (a > b) return 1;
            if (a === b) return 0
            if (a < b) return -1;

        }
        else if (order.field[name].flag === 2) {
            if (a > b) return -1;
            if (a === b) return 0
            if (a < b) return 1;
        }
        else return 0;

    };

    function click4RecordDetail(e, record, index) {
        if (debugMode) console.log("Click for record detail", e, record, index);

        let sp = new URLSearchParams({
            editMode: 1,
            filename: record.path,
        });

        let path = {
            pathname: "/editConfiguration",
            search: sp.toString(),
        };

        // cleanUp4Detail();
        navigate(path);
        return;
    };

    return (
        <div className="container-fluid px-0 bg-unity-1">
            <TitlePanel />
            <div className="d-flex ">
                <div style={{ ...(dataset?.sideBarWidth) }}>
                    <SideBar />
                </div>

                <div className="flex-fill" style={{ ...(dataset?.mainPanelWidth) }}>
                    <div className="pl-24 pr-24" style={{ minHeight: "100vh", }}>
                        <div className="col-12 pt-8 fs-12-unity grey-font cursor" onClick={() => navigate(-1)}>
                            <i className="fas fa-chevron-left fa-fw"></i>
                            {sl.l_system_configuration}
                        </div>

                        <div className="col-12 pt-12 pb-16">
                            <div className="title-font fw-bold">
                                {sl.l_configuration_file}
                            </div>
                            <div className="fs-14-unity grey-font">
                                {sl.l_config_contains_sensitive}
                            </div>
                        </div>

                        <div className="mt-3 px-3 py-4 bg-white shadow" style={{ border: "1px solid #f3f3f3", borderRadius: "16px" }}>
                            <div className="d-flex justify-content-between align-items-center">
                                <div className="col-12">
                                    <div className="input-group">
                                        <input type="text" className="form-control border-0" placeholder={sl.p_search_query}
                                            value={filterText}
                                            onChange={change4FilterText}
                                            style={{ backgroundColor: "#F3F3F4", fontSize: "14px" }} />
                                        <button className="btn border-0"
                                            style={{ backgroundColor: "#f3f3f4", "--bs-btn-focus-box-shadow": "0 0 0 0.25rem rgb(97 159 203 / 25%)" }}
                                            type="button" onClick={click4Filter}>
                                            <span className="material-icons-outlined " style={{ color: "#A4A6A7" }}>filter_alt</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 table-responsive " style={{ minHeight: "50vh" }} >
                                <table className="table table-hover mb-0">
                                    <thead>
                                        <tr style={{ fontSize: "12px", color: "#A4A6A7", fontWeight: 600 }}>
                                            <th className="text-end" style={{ width: "40px" }}>
                                                {sl.h_no}
                                            </th>
                                            <th role="button" onClick={(e) => toggle4Order(e, order, 'directoryPath')}>
                                                {sl.h_directory_path} {getOrderIndicator(order, 'directoryPath')}
                                            </th>
                                            <th role="button" onClick={(e) => toggle4Order(e, order, 'filename')}>
                                                {sl.h_filename} {getOrderIndicator(order, 'filename')}
                                            </th>
                                            <th role="button" onClick={(e) => toggle4Order(e, order, 'extension')}>
                                                {sl.h_extension} {getOrderIndicator(order, 'extension')}
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {
                                            dataList.toSorted(sort4Order).filter((record, index) => {
                                                if (!filterText)
                                                    return true;

                                                let s = tBox.buildFilterText(record);
                                                if (s.toLowerCase().indexOf(filterText.toLowerCase()) >= 0)
                                                    return true;
                                                else
                                                    return false;
                                            }).map((record, index) => {
                                                // console.log("Build table row", record, index);
                                                return (
                                                    <tr key={index}
                                                        className="text-nowrap"
                                                        style={{ fontSize: "14px", cursor: "pointer" }}
                                                        onClick={(e) => click4RecordDetail(e, record, index)}  >
                                                        <td className="text-end"  >
                                                            {index + 1}
                                                        </td>
                                                        <td >
                                                            {record?.directoryPath}
                                                        </td>
                                                        <td >
                                                            {record?.filename}
                                                        </td>
                                                        <td className="text-uppercase">
                                                            {record?.extension?.substring(1)}
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        }
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <DumpPanel dataList={[
                        { name: "dataList", data: dataList },
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
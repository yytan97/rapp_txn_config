import * as react from "react";
// import * as reactRouter from "react-router-dom";

import * as tBox from "./tBox.js";
import { globalContext } from "./globalContext.js";

// Map loaded lib here ...
// const uuidv4 = window.uuidv4;
// const moment = window.moment;

// let data = undefined;

export function PaginationPanel({ pageObject, callback4ChangePage, callback4ChangePageSize, debugMode = false }) {
    const componentName = "PaginationPanel";
    if (debugMode) console.log(`${componentName} component start ...`);

    const { gsl } = react.useContext(globalContext);
    let sl = tBox.getStringLabel(gsl, componentName);

    const [redraw, setRedraw] = react.useState(0);

    let data = pageObject;
    if (data === undefined)
        data = {
            page: 1,
            totalRecord: 0,
            pageSize: 10
        }

    let page = sl.l_page || "page";
    let pageSizeList = [
        { label: "10 / " + page, value: 10 },
        { label: "15 / " + page, value: 15 },
        { label: "20 / " + page, value: 20 },
        { label: "50 / " + page, value: 50 },
    ];

    function build() {
        console.log("Build");

        data.totalPage = Math.ceil(data.totalRecord / data.pageSize);

        if (data.page > data.totalPage) data.page = data.totalPage;
        if (data.page < 1) data.page = 1;
        let state = {
            first: { flag: true },
            last: { flag: true },
            previous: { flag: true },
            next: { flag: true },
            showDot: { flag: false },
        };

        if (data.page - 2 <= 0) {
            let page = 1;
            for (let n = 0; n < 5; n++) {
                let name = "b" + (n + 1);
                state[name] = { label: page, value: page, flag: true, select: false };
                if (page == data.page) state[name].select = true;
                page++;
                if (page > data.totalPage) break;
            }
        }
        else if (data.page + 2 > data.totalPage) {
            let page = data.totalPage - 4;
            if (page <= 0) page = 1;
            for (let n = 0; n < 5; n++) {
                let name = "b" + (n + 1);
                state[name] = { label: page, value: page, flag: true, select: false };
                if (page == data.page) state[name].select = true;
                page++;
                if (page > data.totalPage) break;
            }
        }
        else {
            let page = data.page - 2;
            if (page <= 0) page = 1;
            for (let n = 0; n < 5; n++) {
                let name = "b" + (n + 1);
                state[name] = { label: page, value: page, flag: true, select: false };
                if (page == data.page) state[name].select = true;
                page++;
                if (page > data.totalPage) break;
            }
        }

        // overwrite the last button
        if (state.b5 != undefined && state.b5.flag) {
            if (state.b5.value < data.totalPage) {
                state.b5 = { label: data.totalPage, value: data.totalPage, flag: true, select: false };
                state.showDot.flag = true;
            }
        }

        if (data.page <= 1) {
            state.first.flag = false;
            state.previous.flag = false;
        }

        if (data.page >= data.totalPage) {
            state.last.flag = false;
            state.next.flag = false;
        }

        data.state = state;
    };

    function click4PageSize(e, record) {
        if (debugMode) console.log("Click for page size", e, record);
        data.pageSize = record.value;
        if (callback4ChangePageSize) callback4ChangePageSize(record.value);
        return;
    };

    function click4Page(e, page) {
        if (debugMode) console.log("Click for page", e, page);
        data.page = page;
        if (callback4ChangePage) callback4ChangePage(page);
        return;
    };

    // run build
    build();

    return (
        <div className="d-flex justify-content-between align-items-center fs-14-unity">
            <div className="d-flex align-items-center">
                <div>{sl.l_show} :</div>

                <div className="dropdown ">
                    <button className="btn btn-ghost-unity ms-1" role="button" data-bs-toggle="dropdown">
                        <div className="me-2" style={{ fontSize: "14px" }} >{data.pageSize} / {sl.l_page}</div>
                        <i className="fas fa-chevron-down fa-fw"></i>
                    </button>

                    <div className="dropdown-menu fs-14-unity shadow p-0">
                        <ul className="list-unstyled p-2 mb-0">
                            {
                                pageSizeList.map((record, index) => (
                                    <li key={index}>
                                        <button
                                            className={`dropdown-item border-bottom ${data.pageSize == record.value ? 'text-primary' : ''} `}
                                            type="button" 
                                            onClick={(e) => click4PageSize(e, record)}>
                                            {record.label}
                                        </button>
                                    </li>
                                ))
                            }
                        </ul>
                    </div>
                </div>

            </div>
            <div className="d-flex align-items-center">

                <button
                    className={`mx-1 fw-light btn btn-link text-decoration-none text-dark ${!data.state.first.flag ? 'disabled' : ''}`}
                    style={{ height: "30px", padding: "8px" }}
                    onClick={(e) => click4Page(e, 1)}>
                    {sl.b_first}
                </button>

                <button
                    className={`mx-1 fw-light btn btn-link text-decoration-none text-dark ${!data.state.previous.flag ? 'disabled' : ''}`}
                    style={{ height: "30px", padding: "8px" }}
                    onClick={(e) => click4Page(e, data.page - 1)}>
                    <i className="fas fa-chevron-left fa-fw"></i>
                </button>

                {
                    data?.state?.b1?.flag ?
                        <button
                            className={`mx-1 fw-light btn btn-link text-decoration-none ${data.state.b1.select ? 'border border-primary disabled text-primary' : 'text-dark'}`}
                            style={{ height: "30px", padding: "8px" }}
                            onClick={(e) => click4Page(e, data.state.b1.value)}>
                            {data?.state?.b1?.label}
                        </button>
                        :
                        null
                }

                {
                    data?.state?.b2?.flag ?
                        <button
                            className={`mx-1 fw-light btn btn-link text-decoration-none ${data.state.b2.select ? 'border border-primary disabled text-primary' : 'text-dark'}`}
                            style={{ height: "30px", padding: "8px" }}
                            onClick={(e) => click4Page(e, data.state.b2.value)}>
                            {data.state.b2.label}
                        </button>
                        : null

                }

                {
                    data?.state?.b3?.flag ?
                        <button
                            className={`mx-1 fw-light btn btn-link text-decoration-none ${data.state.b3.select ? 'border border-primary disabled text-primary' : 'text-dark'}`}
                            style={{ height: "30px", padding: "8px" }}
                            onClick={(e) => click4Page(e, data.state.b3.value)}>
                            {data.state.b3.label}
                        </button>
                        :
                        null
                }

                {
                    data?.state?.b4?.flag ?
                        <button
                            className={`mx-1 fw-light btn btn-link text-decoration-none ${data.state.b4.select ? 'border border-primary disabled text-primary' : 'text-dark'}`}
                            style={{ height: "30px", padding: "8px" }}
                            onClick={(e) => click4Page(e, data.state.b4.value)}>
                            {data.state.b4.label}
                        </button>
                        :
                        null
                }

                {
                    data?.state?.showDot?.flag ? <span className="mx-1">... </span> : null
                }

                {
                    data?.state?.b5?.flag ?
                        <button
                            className={`mx-1 fw-light btn btn-link text-decoration-none ${data.state.b5.select ? 'border border-primary disabled text-primary' : 'text-dark'}`}
                            style={{ height: "30px", padding: "8px" }}
                            onClick={(e) => click4Page(e, data.state.b5.value)}>
                            {data.state.b5.label}
                        </button>
                        :
                        null
                }

                <button
                    className={`mx-1 fw-light btn btn-link text-decoration-none text-dark ${!data?.state?.next?.flag ? 'disabled' : ''}`}
                    style={{ height: "30px", padding: "8px" }}
                    onClick={(e) => click4Page(e, data.page + 1)}>
                    <i className="fas fa-chevron-right fa-fw"></i>
                </button>

                <button
                    className={`mx-1 fw-light btn btn-link text-decoration-none text-dark ${!data?.state?.last?.flag ? 'disabled' : ''}`}
                    style={{ height: "30px", padding: "8px" }}
                    onClick={(e) => click4Page(e, data.totalPage)}>
                    {sl.b_last}
                </button>

            </div>
        </div>

    );
}
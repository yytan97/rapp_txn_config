export let debugMode = true;
export let wait4 = 1000 * 60;

export let serviceURLBase = ".";
export let serviceURLBase2 = ".";

export function setServiceURLBase(url) {
    serviceURLBase = url;
};

export function setServiceURLBase2(url) {
    serviceURLBase2 = url;
};

export function setDebugMode(flag) {
    debugMode = flag;
};

export async function command2Host(url, data, token, method = "POST") {
    if (debugMode) console.log("Command to host");
    let result = {};

    try {
        let header = {
            "Content-Type": "application/json",
        };

        if (token) header["x-synap-sessionToken"] = token;

        let option = {
            method: method,
            headers: header,
            body: data ? JSON.stringify(data) : undefined,
            signal: AbortSignal.timeout(wait4)
        };

        if (debugMode) console.log("Request URL and option", url, option);
        let response1 = await fetch(url, option);

        /*
        let s = await response1.text();
        if (debugMode) console.log("Response text", s);

        let obj = JSON.parse(s);
        if (debugMode) console.log("Response object", obj);
        */

        let obj = await response1.json();
        if (debugMode) console.log("Response object", obj);

        if (response1.ok) {
            result = { flag: true, status: response1.status, data: obj };
        }
        else {
            console.warn("Response not ok", response1.status);
            result = { flag: false, status: response1.status, data: obj };

        }

    }
    catch (e) {
        console.warn("Response exception", e);
        result = { flag: false, error: e };
    };

    console.log("Result", result);
    return result;
};

export async function login(username, password) {
    if (debugMode) console.log("Login", username);

    let url = serviceURLBase2 + "/command/Login";
    let data = {
        user: {
            name: username,
            password: password
        }
    };
    let result = await command2Host(url, data, undefined, "POST");
    return result;
};

export async function logout(token) {
    if (debugMode) console.log("Logout", token);

    let url = serviceURLBase2 + "/command/Logout";
    let data = {};
    let result = await command2Host(url, data, token, "POST");
    return result;
};

// export async function command2Host(url, data, token, method = "POST") 
export async function getUser(username, token) {
    if (debugMode) console.log("Get user", username, token);

    let url = serviceURLBase2 + "/command/user.query";
    let data = {
        filters: {
            user: {
                name: username,
            }
        }
    };
    let result = await command2Host(url, data, token, "POST");
    return result;
};

export async function getUserGroup(username, token) {
    if (debugMode) console.log("Get user group", username, token);

    let url = serviceURLBase2 + "/command/user.team.query";
    let data = {
        filters: {
            user: {
                name: username,
            }
        }
    };
    let result = await command2Host(url, data, token, "POST");
    return result;
};

export async function getUserAccessRight(username, token) {
    if (debugMode) console.log("Get user access right", username, token);

    let url = serviceURLBase2 + "/command/accessRights.query";
    let data = {
        "filters": {
            "name": "all",
            "user": {
                "name": username,
            },
        },
    };
    let result = await command2Host(url, data, token, "POST");
    return result;
};

export async function getCountryList() {
    if (debugMode) console.log("Get country list");

    // let url = serviceURLBase2 + "/command/country.query";
    let url = serviceURLBase2 + "/command/getCountry";

    let data = {};
    let result = await command2Host(url, data, undefined, "POST");

    let list = [];
    if (result.flag && result.data) {
        list = result.data.countries;
        list = list.map((element) => element.country.country);

        list.sort((a, b) => {
            const isoAlphaCodeA = a.isoAlpha3Code.toUpperCase(); // ignore upper and lowercase
            const isoAlphaCodeB = b.isoAlpha3Code.toUpperCase(); // ignore upper and lowercase
            if (isoAlphaCodeA < isoAlphaCodeB) return -1;
            if (isoAlphaCodeA > isoAlphaCodeB) return 1;
            // isoAlphaCode must be equal
            return 0;
        });

    }
    return list;
};

export async function getCurrencyList() {
    if (debugMode) console.log("Get currency list");

    let url = serviceURLBase2 + "/command/currency.query";
    let data = {};
    let result = await command2Host(url, data, undefined, "POST");

    let list = [];
    if (result.flag && result.data) {
        list = result.data.currencies;
    }
    return list;
};

export async function getTableList(token, databaseName = "kdb") {
    if (debugMode) console.log("Get KDB table list");

    let url = serviceURLBase2 + "/command/sql.showTables";
    let data = {
        "sql": {
            "databaseName": databaseName,
            "executionMode": "execute",
        }
    };
    let result = await command2Host(url, data, token, "POST");
    return result;
};

export async function createCursor(token, databaseName = "kdb", tableName, selector) {
    if (debugMode) console.log("Create cursor", databaseName, tableName);

    let url = serviceURLBase2 + "/command/sql.cursor.create";
    let data = {
        "sql": {
            "tableName": tableName,
            "databaseName": databaseName,
            "executionMode": "execute",
        }
    };

    if (selector) data.sql.selector = selector;

    let result = await command2Host(url, data, token, "POST");
    return result;
};

export async function destroyCursor(token, cursorId) {
    if (debugMode) console.log("Destroy cursor", cursorId);

    // let url = serviceURLBase2 + "/command/sql.destroy.cursor";
    let url = serviceURLBase2 + "/command/DestroyCursor";

    let data = {
        "cursor": {
            "identifier": cursorId
        }
    };

    let result = await command2Host(url, data, token, "POST");
    return result;
};

export async function rewindNFetch(token, cursorID, page, pageSize) {
    if (debugMode) console.log("Rewind and fetch cursor", cursorID, page, pageSize);

    let url = serviceURLBase2 + "/command/sql.cursor.rewindFetchNext";
    let offset = 0;
    if (page > 1) offset = (page - 1) * pageSize;

    let data = {
        "sql": {
            "executionMode": "execute",
        },
        "cursor": {
            "identifier": cursorID,
            "recordOffset": offset,
            "recordCount": pageSize,
        },
    };

    let result = await command2Host(url, data, token, "POST");
    return result;
};

export async function describeTable(token, databaseName = "kdb", tableName) {
    if (debugMode) console.log("Describe table", databaseName, tableName);

    let url = serviceURLBase2 + "/command/sql.describe";
    let data = {
        "sql": {
            "tableName": tableName,
            "databaseName": databaseName,
            "executionMode": "execute",
        }
    };

    let result = await command2Host(url, data, token, "POST");
    return result;
};

export async function getRecord(token, databaseName = "kdb", tableName, selector) {
    if (debugMode) console.log("Get record", databaseName, tableName, selector);
        
    let url = serviceURLBase2 + "/command/sql.select";
    let data = {
        "sql": {
            "tableName": tableName,
            "databaseName": databaseName,
            "executionMode": "execute",
        }
    };

    // data.sql.selector = `rowId = ${rowId}`;
    if (selector) data.sql.selector = selector;

    let result = await command2Host(url, data, token, "POST");
    return result;
};

export async function addRecord(token, databaseName = "kdb", tableName, record) {
    if (debugMode) console.log("Add record", databaseName, tableName);
        
    let url = serviceURLBase2 + "/command/sql.insert";
    let data = {
        "sql": {
            "tableName": tableName,
            "databaseName": databaseName,
            "executionMode": "execute",
        },
        "records": [record],
    };

    let result = await command2Host(url, data, token, "POST");
    return result;
};

export async function updateRecordWithId(token, databaseName = "kdb", tableName, rowId, record) {
    if (debugMode) console.log("Update record with ID", databaseName, tableName, rowId);

    if (!rowId) 
    {
        console.warn("Row ID not provide", rowId);
        return { flag: false, errorMessage: 'Row ID not provided' };
    }
        
    let url = serviceURLBase2 + "/command/sql.update";
    let record1 = {
        ...record,
        rowId: undefined				
    };

    let data = {
        "sql": {
            "tableName": tableName,
            "databaseName": databaseName,
            "executionMode": "execute",
        },
        "records": [record1],
    };

    data.sql.selector = `rowId = ${rowId}`;

    console.log("Post data", data);

    let result = await command2Host(url, data, token, "POST");
    return result;
};

export async function deleteRecordWithId(token, databaseName = "kdb", tableName, rowId) {
    if (debugMode) console.log("Delete record with ID", databaseName, tableName, rowId);

    if (!rowId) 
    {
        console.warn("Row ID not provide", rowId);
        return { flag: false, errorMessage: 'Row ID not provided' };
    }
        
    let url = serviceURLBase2 + "/command/sql.delete";
    let data = {
        "sql": {
            "tableName": tableName,
            "databaseName": databaseName,
            "executionMode": "execute",
        }
    };

    data.sql.selector = `rowId = ${rowId}`;
    // if (selector) data.sql.selector = selector;


    let result = await command2Host(url, data, token, "POST");
    return result;
};

// Avatar 
export async function getUserAvatar(username, token) {
    // current no need token

    if (debugMode) console.log("Get user avatar", username);
    let result = {};

    try {
        let header = {};
        if (token) header["x-synap-sessionToken"] = token;

        let option = {
            method: "GET",
            headers: header,
            // signal: AbortSignal.timeout(wait4)
        };

        if (debugMode) console.log("Request", option);
        let args = new URLSearchParams({ hash1: Date.now() });
        let url = serviceURLBase2 + "/image/avatar/" + username + "?" + args.toString();

        let response1 = await fetch(url, option);

        if (response1.ok) {
            let b = await response1.blob();
            if (debugMode) console.log("Response blob");
            result = { flag: true, status: response1.status, data: b, url: url };
        }
        else {
            console.warn("Response not ok", response1.status);
            result = { flag: false, status: response1.status };
        }
    }
    catch (e) {
        console.warn("Response exception", e);
        result = { flag: false, error: e };
    };

    console.log("Result", result);
    return result;
};


export async function uploadAvatar(username, file, token) {
    // current no need token

    if (debugMode) console.log("Upload user avatar", file);
    let result = {};

    try {
        let header = {};
        if (token) header["x-synap-sessionToken"] = token;

        let formData = new FormData();
        formData.append('image', file);

        for (let pair of formData.entries()) {
            if (debugMode) console.log(pair[0] + ', ' + pair[1]);
        }

        let option = {
            method: "POST",
            headers: header,
            body: formData
            // signal: AbortSignal.timeout(wait4)
        };
        if (debugMode) console.log("Request", option);

        let url = serviceURLBase2 + "/image/avatar/" + username;
        if (debugMode) console.log("URL", url);

        let response1 = await fetch(url, option);
        let data = await response1.json();

        if (response1.ok) {
            if (debugMode) console.log("Response ok", data);
            result = { flag: true, status: response1.status, data: data };
        }
        else {
            console.warn("Response not ok", response1.status);
            result = { flag: false, status: response1.status, data: data };
        }
    }
    catch (e) {
        console.warn("Response exception", e);
        result = { flag: false, error: e };
    };

    console.log("Result", result);
    return result;
};

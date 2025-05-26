const moment = window.moment;

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

export function formatDate(dt) {
    if (dt === undefined) dt = new Date();
    let s = moment(dt).format("YYYY-MM-DD hh:mm:ss");
    return s;
};

export async function command2Host(url, data, token, method = "POST") {
    if (debugMode) console.log("Command to host", data);
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

export async function getUserContact(username) {
    if (debugMode) console.log("Get user contact", username);

    let url = serviceURLBase2 + "/command/user.contact.query.without.session";
    let data = {
        "filters": {
            "user": {
                "name": username,
            },
        },
    };
    let result = await command2Host(url, data, undefined, "POST");
    return result;
};

export async function requestResetPasswordLink(username, contactId) {
    if (debugMode) console.log("Request reset password link", username);

    let url = serviceURLBase2 + "/command/password.reset.request.token";
    let data = {
        "user": {
            "name": username
        },
        "contact": {
            "identifier": contactId
        },
        "location": {
            "name": "portal",
            "currentTimestamp": formatDate(),
        },
        "application": {
            "identifier": "SYNAP_WEB_APP"
        }
    };
    let result = await command2Host(url, data, undefined, "POST");
    return result;
};

export async function verifyResetPasswordToken(token) {
    if (debugMode) console.log("Verify reset password token", token);

    let url = serviceURLBase2 + "/command/password.reset.verify.token";
    let data = {
        user: {
            passwordResetToken: token,
        }
    };
    let result = await command2Host(url, data, undefined, "POST");
    return result;
};

export async function resetPassword(password, token) {
    if (debugMode) console.log("Reset password with token", password, token);

    let url = serviceURLBase2 + "/command/password.reset";
    let data = {
        "user": {
            "newPassword": password,
            "passwordResetToken": token,
        },
        "location": {
            "name": "portal",
        }
    };
    let result = await command2Host(url, data, undefined, "POST");
    return result;
};

export async function getTransactionHistoryList(token, filterSegment) {
    if (debugMode) console.log("Get transaction history list", token);

    let url = serviceURLBase2 + "/command/GetTransactionHistory";
    let data = {
        "filters": {
        },
        "cursor": {
            "recordOffset": 0,
            "recordCount": 10
        }
    };

    if (filterSegment) data.filters = filterSegment;
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
        list = result.data?.currencies;
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

export async function getConfigurationFileList(token) {
    if (debugMode) console.log("Get configuration list");

    let url = serviceURLBase2 + "/command/GetConfigurationFile";
    let data = {
        file: { name: "*" }
    };
    let result = await command2Host(url, data, token, "POST");
    return result;
};

export async function readConfigurationFile(token, filename) {
    if (debugMode) console.log("Read configuration list", filename);

    let url = serviceURLBase2 + "/command/ReadConfigurationFile";
    let data = {
        file: { name: filename }
    };
    let result = await command2Host(url, data, token, "POST");
    return result;
};


export async function writeConfigurationFile(token, filename, content) {
    if (debugMode) console.log("Write configuration list", filename);

    let url = serviceURLBase2 + "/command/WriteConfigurationFile";
    let data = {
        file: {
            name: filename,
            content: content,
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


export async function updateRecord(token, databaseName = "kdb", tableName, selector, record) {
    if (debugMode) console.log("Update record with ID", databaseName, tableName, selector);

    if (!selector) {
        console.warn("Selector not provide", selector);
        return { flag: false, errorMessage: 'Selector not provided' };
    }

    let url = serviceURLBase2 + "/command/sql.update";
    let record1 = {
        ...record
    };

    let data = {
        "sql": {
            "tableName": tableName,
            "databaseName": databaseName,
            "executionMode": "execute",
        },
        "records": [record1],
    };

    data.sql.selector = selector;

    let result = await command2Host(url, data, token, "POST");
    return result;
};

export async function updateRecordWithId(token, databaseName = "kdb", tableName, rowId, record) {
    if (debugMode) console.log("Update record with ID", databaseName, tableName, rowId);

    if (!rowId) {
        console.warn("Row ID not provide", rowId);
        return { flag: false, errorMessage: 'Row ID not provided' };
    }

    let url = serviceURLBase2 + "/command/sql.update";
    let record1 = {
        ...record
    };

    if (record1.rowId !== undefined) delete record1.rowId;

    let data = {
        "sql": {
            "tableName": tableName,
            "databaseName": databaseName,
            "executionMode": "execute",
        },
        "records": [record1],
    };

    data.sql.selector = `rowId = ${rowId}`;

    let result = await command2Host(url, data, token, "POST");
    return result;
};


export async function deleteRecord(token, databaseName = "kdb", tableName, selector) {
    if (debugMode) console.log("Delete record with ID", databaseName, tableName, selector);

    if (!selector) {
        console.warn("Selector not provide", selector);
        return { flag: false, errorMessage: 'Selector not provided' };
    }

    let url = serviceURLBase2 + "/command/sql.delete";
    let data = {
        "sql": {
            "tableName": tableName,
            "databaseName": databaseName,
            "executionMode": "execute",
        }
    };

    data.sql.selector = selector;

    let result = await command2Host(url, data, token, "POST");
    return result;
};

export async function deleteRecordWithId(token, databaseName = "kdb", tableName, rowId) {
    if (debugMode) console.log("Delete record with ID", databaseName, tableName, rowId);

    if (!rowId) {
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

// user module related API

export async function createUserGroupCursor(token, searchText) {
    if (debugMode) console.log("Create user group cursor");

    let url = serviceURLBase2 + "/command/team.query";
    let data = {
        "filters": {
            "team": {
                "name": "all"
            },
        },
        "cursor": {
            "creation": "always"
        }
    };

    if (searchText) data.filters.team.name = "%" + searchText + "%";
    let result = await command2Host(url, data, token, "POST");
    return result;
};

export async function rewindNFetch4UserGroup(token, cursorID, page, pageSize) {
    if (debugMode) console.log("Rewind and fetch cursor for user group", cursorID, page, pageSize);

    let url = serviceURLBase2 + "/command/team.fetch";
    let offset = 0;
    if (page > 1) offset = (page - 1) * pageSize;

    let data = {
        "cursor": {
            "identifier": cursorID,
            "recordOffset": offset,
            "recordCount": pageSize,
        },
    };

    let result = await command2Host(url, data, token, "POST");
    return result;
};

// get user group record or list, if name is 'all' than list
export async function getUserGroupRecord(token, name) {
    if (debugMode) console.log("get user group with name", name);

    let url = serviceURLBase2 + "/command/team.query";
    let data = {
        "filters": {
            "team": {
                "name": name
            },
        }
    };

    let result = await command2Host(url, data, token, "POST");
    return result;
};

export async function addRecord4UserGroup(token, name) {
    if (debugMode) console.log("Add new record for user group", name);

    if (!name) {
        console.warn("Name not provide", name);
        return { flag: false, errorMessage: 'Name not provided' };
    }

    let url = serviceURLBase2 + "/command/team.new";
    let data = {
        "team": {
            "name": name,
        },
    };

    let result = await command2Host(url, data, token, "POST");
    return result;
};

export async function deleteRecord4UserGroup(token, name) {
    if (debugMode) console.log("Delete record for user group", name);

    if (!name) {
        console.warn("Name not provide", name);
        return { flag: false, errorMessage: 'Name not provided' };
    }

    let url = serviceURLBase2 + "/command/team.delete";
    let data = {
        "filters": {
            "team": {
                "name": name,
            },
        },
    };

    let result = await command2Host(url, data, token, "POST");
    return result;
};

export async function getUserList4UserGroup(token, groupName) {
    if (debugMode) console.log("get user list for user group with name", groupName);

    let url = serviceURLBase2 + "/command/team.user.query";
    let data = {
        "filters": {
            "team": {
                "name": groupName
            },
        },
    };

    let result = await command2Host(url, data, token, "POST");
    return result;
};

export async function addUser4Group(token, username, groupName) {
    if (debugMode) console.log("Add user for group", username, groupName);

    let url = serviceURLBase2 + "/command/team.user.new";
    let data = {
        "team": {
            "name": groupName,
        },
        "user": {
            "name": username,
        }
    };

    let result = await command2Host(url, data, token, "POST");
    return result;
};

export async function removeUser4Group(token, username, groupName) {
    if (debugMode) console.log("Remove user for group", username, groupName);

    let url = serviceURLBase2 + "/command/team.user.delete";
    let data = {
        "filters": {
            "team": {
                "name": groupName,

            },
            "user": {
                "name": username,
            },
        },
    };

    let result = await command2Host(url, data, token, "POST");
    return result;
};

export async function getAccessRightList4UserGroup(token, groupName) {
    if (debugMode) console.log("Get access right list for user group with name", groupName);

    let url = serviceURLBase2 + "/command/accessRights.query";
    let data = {
        "filters": {
            "name": "all",
            "team": {
                "name": groupName
            },
        },
    };

    let result = await command2Host(url, data, token, "POST");
    return result;
};

export async function getAccessRightObjectList(token) {
    if (debugMode) console.log("Get access right object list");

    let url = serviceURLBase2 + "/command/accessRights.object.query";
    let data = {
        "filters": {
            "accessRightsObject": { "name": "all" },
        }
    };

    let result = await command2Host(url, data, token, "POST");
    return result;
};

export async function getAccessRightAction4Object(token, objectName) {
    if (debugMode) console.log("Get access right action for object", objectName);

    let url = serviceURLBase2 + "/command/accessRights.action.query";
    let data = {
        "filters": {
            "accessRightsObject": { "name": objectName },
        },
    };

    let result = await command2Host(url, data, token, "POST");
    return result;
};

export async function updateAccessRightObject4Group(token, record, name) {
    if (debugMode) console.log("Revoke or grant group access right action for object", record, name);

    let url = serviceURLBase2 + "/command/RevokeAndGrantAccessRights";
    let data = {
        "team": {
            "name": name,
        },
        "accessRightsObject": record,
    };

    let result = await command2Host(url, data, token, "POST");
    return result;
};

export async function updateAccessRightObject4User(token, record, name) {
    if (debugMode) console.log("Revoke or grant user access right action for object", record, name);

    let url = serviceURLBase2 + "/command/RevokeAndGrantAccessRights";
    let data = {
        "user": {
            "name": name,
        },
        "accessRightsObject": record,
    };

    let result = await command2Host(url, data, token, "POST");
    return result;
};

export async function createUserCursor(token, searchText) {
    if (debugMode) console.log("Create user cursor");

    let url = serviceURLBase2 + "/command/user.query";
    let data = {
        "filters": {
            "user": {
                "name": "all"
            },
        },
        "cursor": {
            "creation": "always"
        }
    };

    if (searchText) data.filters.user.name = "%" + searchText + "%";
    let result = await command2Host(url, data, token, "POST");
    return result;
};

export async function rewindNFetch4User(token, cursorID, page, pageSize) {
    if (debugMode) console.log("Rewind and fetch cursor for user group", cursorID, page, pageSize);

    let url = serviceURLBase2 + "/command/user.fetch";
    let offset = 0;
    if (page > 1) offset = (page - 1) * pageSize;

    let data = {
        "cursor": {
            "identifier": cursorID,
            "recordOffset": offset,
            "recordCount": pageSize,
        },
    };

    let result = await command2Host(url, data, token, "POST");
    return result;
};

export async function getUserRecord(token, name) {
    if (debugMode) console.log("Get user record", name);

    let url = serviceURLBase2 + "/command/user.query";
    let data = {
        "filters": {
            "user": {
                "name": name
            },
        }
    };

    let result = await command2Host(url, data, token, "POST");
    return result;
};

export async function addRecord4User(token, record) {
    if (debugMode) console.log("Add new record for user", record?.username);

    if (!record?.username) {
        console.warn("Name not provide", record?.username);
        return { flag: false, errorMessage: 'Name not provided' };
    }

    let url = serviceURLBase2 + "/command/user.new";
    let data = {
        "user": {
            "name": record?.username,
            "preferName": record?.preferName,
        },
        "organization": {
            "name": record?.organizationName,
        },
        "team": {
            "name": record?.groupName,
        },
    };

    let result = await command2Host(url, data, token, "POST");
    return result;
};

export async function updateRecord4User(token, record) {
    if (debugMode) console.log("Update record for user", record.username);

    if (!record?.username) {
        console.warn("Name not provide", record?.username);
        return { flag: false, errorMessage: 'Name not provided' };
    }

    let url = serviceURLBase2 + "/command/user.update";
    let data = {
        "filters": {
            "user": {
                "name": record?.username,
            },
        },
        "user": {
            "preferName": record?.preferName,
        }
    };

    let result = await command2Host(url, data, token, "POST");
    return result;
};

export async function deleteRecord4User(token, name) {
    if (debugMode) console.log("Delete record for user", name);

    if (!name) {
        console.warn("Name not provide", name);
        return { flag: false, errorMessage: 'Name not provided' };
    }

    let url = serviceURLBase2 + "/command/user.delete";
    let data = {
        "filters": {
            "user": {
                "name": name,
            },
        },
    };

    let result = await command2Host(url, data, token, "POST");
    return result;
};

export async function getUserGroupList4User(token, name) {
    if (debugMode) console.log("get user group list for user with name", name);

    let url = serviceURLBase2 + "/command/user.team.query";
    let data = {
        "filters": {
            "user": {
                "name": name
            },
        },
    };

    let result = await command2Host(url, data, token, "POST");
    return result;
};

export async function getAccessRightList4User(token, name) {
    if (debugMode) console.log("Get access right list for user with name", name);

    let url = serviceURLBase2 + "/command/accessRights.query";
    let data = {
        "filters": {
            "name": "all",
            "user": {
                "name": name
            },
        },
    };

    let result = await command2Host(url, data, token, "POST");
    return result;
};

export async function getUserProfileRecord(token, name) {
    if (debugMode) console.log("Get user profile record with name", name);

    let url = serviceURLBase2 + "/command/GetUserProfile";
    let data = {
        "user": {
            "name": name
        },
    };

    let result = await command2Host(url, data, token, "POST");
    return result;
};

export async function addUserProfile(token, username, record) {
    if (debugMode) console.log("Add user profile", username);

    if (!username) {
        console.warn("Name not provide", username);
        return { flag: false, errorMessage: 'Name not provided' };
    }

    let url = serviceURLBase2 + "/command/NewUserProfile";
    let data = {
        "user": {
            "name": username,
        },
        "userProfile": record
    };

    let result = await command2Host(url, data, token, "POST");
    return result;
};

export async function updateUserProfile(token, username, record) {
    if (debugMode) console.log("Update user profile", username);

    if (!username) {
        console.warn("Name not provide", username);
        return { flag: false, errorMessage: 'Name not provided' };
    }

    let url = serviceURLBase2 + "/command/UpdateUserProfile";
    let data = {
        "user": {
            "name": username,
        },
        "userProfile": record
    };

    let result = await command2Host(url, data, token, "POST");
    return result;
};

export async function getUserContactList(token, name) {
    if (debugMode) console.log("Get user contact list", name);

    /*
    let url = serviceURLBase2 + "/command/GetUserContactOfAnUser";
    let data = {
        "user": {
            "name": name
        },
    };
    */

    let url = serviceURLBase2 + "/command/user.contact.query.for.an.user";
    let data = {
        "filters": {
            "user": {
                "name": name
            }
        }
    };

    let result = await command2Host(url, data, token, "POST");
    return result;
};

export async function addUserContact(token, record) {
    if (debugMode) console.log("Add new record for user contact", record?.username);

    if (!record?.username) {
        console.warn("Name not provide", record?.username);
        return { flag: false, errorMessage: 'Name not provided' };
    }

    let url = serviceURLBase2 + "/command/user.contact.new";
    let data = {
        "user": {
            "name": record?.username,
        },
        "contact": {
            "type": record?.type,
            "address": record?.address
        }
    };

    let result = await command2Host(url, data, token, "POST");
    return result;
};


export async function deleteUserContact(token, record) {
    if (debugMode) console.log("Delete record for user contact", record?.username);

    if (!record?.username) {
        console.warn("Name not provide", record?.username);
        return { flag: false, errorMessage: 'Name not provided' };
    }

    let url = serviceURLBase2 + "/command/DeleteUserContact";
    let data = {
        "user": {
            "name": record?.username
        },
        "contact": {
            "identifier": record?.identifier
        }
    };

    /*
    let url = serviceURLBase2 + "/command/user.contact.delete";
    let data = {
        "user": {
            "name": record?.username,
        },
        "contact": {
            "type": record?.type,
            "identifier": record?.identifier
        }
    };
    */

    let result = await command2Host(url, data, token, "POST");
    return result;
};

export async function getUserAddressList(token, name, type) {
    if (debugMode) console.log("Get user address list", name);


    let url = serviceURLBase2 + "/command/GetUserMailingAddress";
    let data = {
        "user": {
            "name": name
        },
        "mailingAddress": {
            "type": type,
        },
    };

    /*
    let url = serviceURLBase2 + "/command/user.maillingAddress.query";
    let data = {
        "filters": {
            "user": {
                "name": name
            },
            "mailingAddress": {
                "type": "all"
            }
        }
    };
    */

    let result = await command2Host(url, data, token, "POST");
    return result;
};

export async function addUserAddress(token, record) {
    if (debugMode) console.log("Add new record for user address", record?.username);

    if (!record?.username) {
        console.warn("Name not provide", record?.username);
        return { flag: false, errorMessage: 'Name not provided' };
    }

    let url = serviceURLBase2 + "/command/NewUserMailingAddress";
    let data = {
        "user": {
            "name": record.username,
        },
        "mailingAddress": record.mailingAddress,
    };

    let result = await command2Host(url, data, token, "POST");
    return result;
};

export async function updateUserAddress(token, record) {
    if (debugMode) console.log("Update record for user address", record?.username);

    if (!record?.username) {
        console.warn("Name not provide", record?.username);
        return { flag: false, errorMessage: 'Name not provided' };
    }

    let url = serviceURLBase2 + "/command/UpdateUserMailingAddress";
    let data = {
        "user": {
            "name": record.username,
        },
        "mailingAddress": record.mailingAddress,
    };

    let result = await command2Host(url, data, token, "POST");
    return result;
};

export async function deleteUserAddress(token, record) {
    if (debugMode) console.log("Delete record for user address", record?.username);

    if (!record?.username) {
        console.warn("Name not provide", record?.username);
        return { flag: false, errorMessage: 'Name not provided' };
    }

    let url = serviceURLBase2 + "/command/DeleteUserMailingAddress";

    let data = {
        "user": {
            "name": record?.username,
        },
        "mailingAddress": {
            "type": record?.type,
        }
    };

    let result = await command2Host(url, data, token, "POST");
    return result;
};


export async function createObjectCursor(token, searchText) {
    if (debugMode) console.log("Create object cursor");

    let url = serviceURLBase2 + "/command/accessRights.object.query";
    let data = {
        "filters": {
            "accessRightsObject": {
                "name": "all"
            },
        },
        "cursor": {
            "creation": "always"
        }
    };

    if (searchText) data.filters.accessRightsObject.name = "%" + searchText + "%";
    let result = await command2Host(url, data, token, "POST");
    return result;
};

export async function rewindNFetch4Object(token, cursorID, page, pageSize) {
    if (debugMode) console.log("Rewind and fetch cursor for user group", cursorID, page, pageSize);

    let url = serviceURLBase2 + "/command/accessRights.object.fetch";
    let offset = 0;
    if (page > 1) offset = (page - 1) * pageSize;

    let data = {
        "cursor": {
            "identifier": cursorID,
            "recordOffset": offset,
            "recordCount": pageSize,
        },
    };

    let result = await command2Host(url, data, token, "POST");
    return result;
};

export async function getObjectRecord(token, name) {
    if (debugMode) console.log("Get object with name", name);

    let url = serviceURLBase2 + "/command/accessRights.object.query";
    let data = {
        "filters": {
            "accessRightsObject": {
                "name": name
            },
        }
    };

    let result = await command2Host(url, data, token, "POST");
    return result;
};

export async function addRecord4Object(token, name) {
    if (debugMode) console.log("Add new record for object", name);

    if (!name) {
        console.warn("Name not provide", name);
        return { flag: false, errorMessage: 'Name not provided' };
    }

    let url = serviceURLBase2 + "/command/accessRights.object.new";
    let data = {
        "accessRightsObject": {
            "name": name,
        },
    };

    let result = await command2Host(url, data, token, "POST");
    return result;
};

export async function deleteRecord4Object(token, name) {
    if (debugMode) console.log("Delete record for object", name);

    if (!name) {
        console.warn("Name not provide", name);
        return { flag: false, errorMessage: 'Name not provided' };
    }

    let url = serviceURLBase2 + "/command/accessRights.object.delete";
    let data = {
        "filters": {
            "accessRightsObject": {
                "name": name,
            },
        },
    };

    let result = await command2Host(url, data, token, "POST");
    return result;
};

export async function getObjectActionList(token, name) {
    if (debugMode) console.log("Get object action list with name", name);

    let url = serviceURLBase2 + "/command/accessRights.action.query";
    let data = {
        "filters": {
            "accessRightsObject": {
                "name": name
            },
        }
    };

    let result = await command2Host(url, data, token, "POST");
    return result;
};

export async function addObjectAction(token, objectName, actionName) {
    if (debugMode) console.log("Add action for object", objectName);

    let url = serviceURLBase2 + "/command/accessRights.action.new";
    let data = {

        "accessRightsObject": {
            "name": objectName
        },
        "accessRightsAction": {
            "name": actionName
        },
    };

    let result = await command2Host(url, data, token, "POST");
    return result;
};

export async function deleteObjectAction(token, objectName, actionName) {
    if (debugMode) console.log("Delete action for object", objectName);

    let url = serviceURLBase2 + "/command/accessRights.action.delete";
    let data = {
        "filters": {
            "accessRightsObject": {
                "name": objectName
            },
            "accessRightsAction": {
                "name": actionName
            },
        }
    };

    let result = await command2Host(url, data, token, "POST");
    return result;
};

export async function createSessionCursor(token, searchText) {
    if (debugMode) console.log("Create session cursor");

    let url = serviceURLBase2 + "/command/session.user.query";
    let data = {
        "filters": {
            "user": {
                "name": undefined,
            },
        },
        "cursor": {
            "creation": "always"
        }
    };

    if (searchText) data.filters.user.name = searchText;
    let result = await command2Host(url, data, token, "POST");
    return result;
};

export async function rewindNFetch4Session(token, cursorID, page, pageSize) {
    if (debugMode) console.log("Rewind and fetch cursor for session", cursorID, page, pageSize);

    let url = serviceURLBase2 + "/command/session.user.fetch";
    let offset = 0;
    if (page > 1) offset = (page - 1) * pageSize;

    let data = {
        "cursor": {
            "identifier": cursorID,
            "recordOffset": offset,
            "recordCount": pageSize,
        },
    };

    let result = await command2Host(url, data, token, "POST");
    return result;
};

export async function getSessionRecord(token, name) {
    if (debugMode) console.log("Get session with username", name);

    let url = serviceURLBase2 + "/command/session.user.query";
    let data = {
        "filters": {
            "user": {
                "name": name
            },
        }
    };

    let result = await command2Host(url, data, token, "POST");
    return result;
};

export async function getUserSessionList(token, name) {
    if (debugMode) console.log("Get session list with username", name);

    let url = serviceURLBase2 + "/command/session.query";
    let data = {
        "filters": {
            "user": {
                "name": name
            },
        }
    };

    let result = await command2Host(url, data, token, "POST");
    return result;
};

export async function deleteRecord4Session(token, name) {
    if (debugMode) console.log("Delete session for user", name);

    if (!name) {
        console.warn("Name not provide", name);
        return { flag: false, errorMessage: 'Name not provided' };
    }

    let url = serviceURLBase2 + "/command/DeleteSession";
    let data = {
        "user": {
            "name": name,
        }
    };

    let result = await command2Host(url, data, token, "POST");
    return result;
};

export async function removeSessionWithID(token, id) {
    if (debugMode) console.log("Delete session with id", id);

    if (!id) {
        console.warn("ID not provide", id);
        return { flag: false, errorMessage: 'ID not provided' };
    }

    let url = serviceURLBase2 + "/command/DeleteSession";

    let data = {
        "session": {
            "identifier": id,
        }
    };

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

export async function command4InstitutionList(token) {
    if (debugMode) console.log("command for institution list");

    let url = serviceURLBase2 + "/command/kswitch.institutions";
    let data = {};

    let result = await command2Host(url, data, token, "POST");
    return result;
};

export async function command4Institution(token, action, name) {
    if (debugMode) console.log("command for institution", action, name);

    let url = serviceURLBase2;

    if (action == 'add') url += "/command/kswitch.institution.add";
    else if (action == 'remove') url += "/command/kswitch.institution.remove";
    else if (action == 'enable') url += "/command/kswitch.institution.enable";
    else if (action == 'disable') url += "/command/kswitch.institution.disable";
    else url += "/command/kswitch.institution.disable";

    let data = {
        institution: {
            identifier: name,
        }
    };

    let result = await command2Host(url, data, token, "POST");
    return result;
};

export async function command4LinkList(token) {
    if (debugMode) console.log("command for link list");

    let url = serviceURLBase2 + "/command/kswitch.links";
    let data = {};

    let result = await command2Host(url, data, token, "POST");
    return result;
};

export async function command4Link(token, action, name) {
    if (debugMode) console.log("command for link", action, name);

    let url = serviceURLBase2;

    if (action == 'add') url += "/command/kswitch.link.add";
    else if (action == 'remove') url += "/command/kswitch.link.remove";
    else if (action == 'enable') url += "/command/kswitch.link.enable";
    else if (action == 'disable') url += "/command/kswitch.link.disable";
    else url += "/command/kswitch.link.disable";

    let data = {
        link: {
            name: name,
        }
    };

    let result = await command2Host(url, data, token, "POST");
    return result;
};

export async function command4Route(token, action, name) {
    if (debugMode) console.log("command for route", action, name);

    let url = serviceURLBase2;

    if (action == 'add') url += "/command/kswitch.route.add";
    else if (action == 'remove') url += "/command/kswitch.route.remove";
    else if (action == 'enable') url += "/command/kswitch.route.enable";
    else if (action == 'disable') url += "/command/kswitch.route.disable";
    else url += "/command/kswitch.route.disable";

    let data = {
        route: {
            name: name,
        }
    };

    let result = await command2Host(url, data, token, "POST");
    return result;
};

export async function command4TransactionList(token) {
    if (debugMode) console.log("command for transaction list");

    let url = serviceURLBase2 + "/command/kswitch.transaction.list";
    let data = {
        "transaction": {
            "name": ""
        }
    };

    let result = await command2Host(url, data, token, "POST");
    return result;
};

export async function command4Transaction(token, action, name) {
    if (debugMode) console.log("command for transaction", action, name);

    let url = serviceURLBase2;

    if (action == 'add') url += "/command/kswitch.transaction.add";
    else if (action == 'remove') url += "/command/kswitch.transaction.remove";
    else if (action == 'enable') url += "/command/kswitch.transaction.enable";
    else if (action == 'disable') url += "/command/kswitch.transaction.disable";
    else url += "/command/kswitch.transaction.disable";

    let data = {
        transaction: {
            name: name,
        }
    };

    let result = await command2Host(url, data, token, "POST");
    return result;
};

export async function command4ServerStat(token) {
    if (debugMode) console.log("command for server stat");

    let url = serviceURLBase2 + "/command/kswitch.server.statistics";
    let data = {};

    let result = await command2Host(url, data, token, "POST");
    return result;
};

export async function command4ProcessList(token) {
    if (debugMode) console.log("command for process list");

    let url = serviceURLBase2 + "/command/kswitch.process.list";
    let data = {};

    let result = await command2Host(url, data, token, "POST");
    return result;
};

export async function command4Process(token, action, name) {
    if (debugMode) console.log("command for process", action, name);

    let url = serviceURLBase2;

    if (action == 'enable') url += "/command/kswitch.process.enable";
    else if (action == 'disable') url += "/command/kswitch.process.disable";
    else if (action == 'start') url += "/command/kswitch.process.start";
    else if (action == 'stop') url += "/command/kswitch.process.stop";
    else if (action == 'restart') url += "/command/kswitch.process.restart";
    else url += "/command/kswitch.process.restart";

    let data = {
        process: {
            name: name,
        }
    };

    let result = await command2Host(url, data, token, "POST");
    return result;
};

export async function command4ProcessServer(token, action) {
    if (debugMode) console.log("command for process server", action);

    let url = serviceURLBase2;

    if (action == 'start') url += "/command/kswitch.server.start";
    else if (action == 'stop') url += "/command/kswitch.server.stop";
    else url += "/command/kswitch.server.status";

    let data = { };

    let result = await command2Host(url, data, token, "POST");
    return result;
};

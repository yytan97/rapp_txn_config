
let debugMode = false;

export const key4AppLocalData = "UnityTestVersion1";
export const name4AppComponentSetting = key4AppLocalData + ".appComponentSettingVersion22";

const url4DefaultParameter = "./conf/default.conf";
const url4AppParameter = "./conf/app.conf";

const url4DefaultLabel = "./conf/label.conf";

const moment = window.moment;

export const isObject = (value) => {
    return typeof value === 'object'
        && value !== null
        && !Array.isArray(value)
        && !(value instanceof RegExp)
        && !(value instanceof Date)
        && !(value instanceof Set)
        && !(value instanceof Map)
};

export function sleep(n = 500) {
    console.debug(`Sleep for ${n}`);
    return new Promise((r) => setTimeout(r, n));
};

export const rand = () => Math.round(Math.random() * 100);
export const resolve = (d, ms) => new Promise((r) => setTimeout(() => r(`${d} - ${rand()}`), ms));
export const reject = (d, ms) =>
    new Promise((_, r) =>
        setTimeout(() => {
            if (d instanceof Error) {
                d.message += ` - ${rand()}`;
            } else {
                d += ` - ${rand()}`;
            }
            r(d);
        }, ms)
    );

export async function getJSONHostFile(url) {
    if (debugMode) console.debug("Get JSON host file", url);

    let obj = {};
    try {
        let response1 = await fetch(url);
        if (response1.ok)
            obj = await response1.json();
        if (debugMode) console.debug("Get JSON host file", url, response1.ok, obj);

    }
    catch (e) {
        console.error("Get JSON host file exception", e);
    }

    return obj;
};

export async function loadConfiguration4Parameter() {
    if (debugMode) console.debug("Load configuration for parameter");

    let defaultObject = await getJSONHostFile(url4DefaultParameter);
    let appObject = await getJSONHostFile(url4AppParameter);

    return { ...defaultObject, ...appObject };
};


export async function loadConfiguration4Label(lang = "English") {
    if (debugMode) console.debug("Load configuration for label", lang);

    let defaultLabel = await getJSONHostFile(url4DefaultLabel);
    let langLabel = {};

    if (lang !== "English") {
        let url = `./conf/label_${lang}.conf`;
        langLabel = await getJSONHostFile(url);
    }

    // return { ...defaultLabel, ...langLabel };

    let obj = { ...defaultLabel };

    for (let key1 in obj) {
        if (langLabel[key1] === undefined) continue;
        for (let key2 in obj[key1]) {
            if (langLabel[key1][key2] === undefined) continue;
            obj[key1][key2] = langLabel[key1][key2];
        }
    }

    return obj;
};

export function removeLocalData(key) {
    localStorage.removeItem(key);
    return;
};

export function putLocalData(key, obj) {
    let v = JSON.stringify(obj);
    localStorage.setItem(key, v);
    return v;
};

export function getLocalData(key, defaultObject = {}) {
    let v = localStorage.getItem(key);

    if (!v || v === "undefined") {
        const obj = defaultObject;
        putLocalData(key, obj);
        return obj;
    }

    try {
        return JSON.parse(v);
    } catch (e) {
        console.warn(`Invalid JSON in localStorage for key "${key}":`, v);
        const obj = defaultObject;
        putLocalData(key, obj); // overwrite with safe default
        return obj;
    }
};

export function getAppLocalData() {
    let obj = {};
    let key = key4AppLocalData;
    obj = getLocalData(key, { applicationLanguage: "English" });
    return obj;
};

export function updateAppLocalData(fieldName, value) {
    if (fieldName === undefined) return;
    let key = key4AppLocalData;
    let obj = getLocalData(key);

    if (obj === null || obj === undefined) obj = {};
    // update with new value
    obj[fieldName] = value;

    putLocalData(key, obj);
    return obj;
};

export function clearAppLocalData() {
    let key = key4AppLocalData;
    removeLocalData(key);

    return;
};

export function getStringLabel(gsl, name) {
    if (gsl === undefined) return {};

    let obj1 = gsl['main'];
    let obj2 = gsl[name];

    return { ...obj1, ...obj2 };
};

export function camel2Snake(s) {
    return s.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
}

export function camel2String(s) {
    return s.replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase();
}

export function snake2Camel(s) {
    return s.replace(/[^a-zA-Z0-9]+(.)/g, (m, c) => c.toUpperCase());
}

export function getClass4IsInvalid1(valid, dirty = false, required = false) {
    console.debug("Class for is invalid", valid, dirty, required);

    if (!dirty) return "";
    else if (valid === undefined && required) return "is-invalid";
    else if (valid === undefined && !required) return "";
    else if (valid) return "";
    else return "is-invalid";
};

export function getClass4IsInvalid2(name, pageObject) {
    console.debug("Class for is invalid", name, pageObject);

    let dirty = pageObject?.dirty;
    let valid = pageObject?.fieldState?.[name]?.valid;

    if (!dirty) return "";
    else if (valid === undefined) return "";
    else if (valid) return "";
    else return "is-invalid";
};

// target is input element and obj is the field state record/object
export function buildFieldState(target, obj) {
    if (obj === undefined) obj = {};

    for (let key in target.validity) {
        obj[key] = target.validity[key];
    }

    console.debug("Field state", obj);
    return obj;
};

// target is form element
export function buildFormFieldState(target) {
    let obj1 = {}
    // item is input element
    for (let item of target) {
        console.debug("Item", item, item.tagName, item.name);
        if (item.tagName === "INPUT" || item.tagName === "SELECT") {
            let obj2 = buildFieldState(item);
            let name = item.name;
            console.debug("Field validity", obj2);
            obj1 = {
                ...obj1,
                [name]: obj2
            };
        }
    }
    console.debug("Form field state", obj1);
    return obj1;
};

export function getFieldErrorMessage1(name, sl, fieldState = {}, formState = {}) {
    console.debug("Build error element for field", name);

    if (!formState?.dirty) {
        console.debug("Not dirty; No need to build error message element");
        return "";
    }

    if (fieldState?.[name] === undefined) {
        console.debug("Field state not found; No need to build error message element");
        return "";
    }

    if (fieldState?.[name]?.valid) {
        console.debug("Field state is valid; No need to build error message element");
        return "";
    }

    if (fieldState[name]["valueMissing"]) {
        let s = "required";
        let key1 = "e_" + name + "_" + s;
        let key2 = "e_" + s + "_" + name;
        let key3 = "e_" + camel2Snake(name) + "_" + s;
        let key4 = "e_" + s + "_" + camel2Snake(name);
        let message = sl[key1] || sl[key2] || sl[key3] || sl[key4] || sl["e_field_required"] || undefined;

        console.debug("Message", s, message);
        if (message !== undefined) return message;
    }

    if (fieldState[name]["customError"]) {
        let s = "custom";
        let key1 = "e_" + name + "_" + s;
        let key2 = "e_" + s + "_" + name;
        let key3 = "e_" + camel2Snake(name) + "_" + s;
        let key4 = "e_" + s + "_" + camel2Snake(name);
        let message = sl[key1] || sl[key2] || sl[key3] || sl[key4] || undefined;

        console.debug("Message", s, message);
        if (message !== undefined) return message;
    }

    if (fieldState[name]["badInput"]) {
        let s = "bad";
        let key1 = "e_" + name + "_" + s;
        let key2 = "e_" + s + "_" + name;
        let key3 = "e_" + camel2Snake(name) + "_" + s;
        let key4 = "e_" + s + "_" + camel2Snake(name);
        let message = sl[key1] || sl[key2] || sl[key3] || sl[key4] || undefined;

        console.debug("Message", s, message);
        if (message !== undefined) return message;
    }

    if (fieldState[name]["patternMismatch"]) {
        let s = "pattern";
        let key1 = "e_" + name + "_" + s;
        let key2 = "e_" + s + "_" + name;
        let key3 = "e_" + camel2Snake(name) + "_" + s;
        let key4 = "e_" + s + "_" + camel2Snake(name);
        let message = sl[key1] || sl[key2] || sl[key3] || sl[key4] || undefined;

        console.debug("Message", s, message);
        if (message !== undefined) return message;
    }

    if (!fieldState[name]["valid"]) {
        let s = "invalid";
        let key1 = "e_" + name + "_" + s;
        let key2 = "e_" + s + "_" + name;
        let key3 = "e_" + camel2Snake(name) + "_" + s;
        let key4 = "e_" + s + "_" + camel2Snake(name);
        let message = sl[key1] || sl[key2] || sl[key3] || sl[key4] || undefined;

        console.debug("Message", s, message);
        if (message !== undefined) return message;
    }

    return "";
};

export function getFieldErrorMessage2(name, sl, formObject) {
    console.debug("Build error element for field", name);
    let fieldState = formObject?.fieldState || {};

    if (!formObject?.dirty) {
        console.debug("Not dirty; No need to build error message element");
        return "";
    }

    if (fieldState?.[name] === undefined) {
        console.debug("Field state not found; No need to build error message element");
        return "";
    }

    if (fieldState?.[name]?.["valid"]) {
        console.debug("Field state is valid; No need to build error message element");
        return "";
    }

    if (fieldState[name]["valueMissing"]) {
        let s = "required";
        let key1 = "e_" + name + "_" + s;
        let key2 = "e_" + s + "_" + name;
        let key3 = "e_" + camel2Snake(name) + "_" + s;
        let key4 = "e_" + s + "_" + camel2Snake(name);
        let message = sl[key1] || sl[key2] || sl[key3] || sl[key4] || sl["e_field_required"] || undefined;

        console.debug("Message", s, message);
        if (message !== undefined) return message;
    }

    if (fieldState[name]["customError"]) {
        let s = "custom";
        let key1 = "e_" + name + "_" + s;
        let key2 = "e_" + s + "_" + name;
        let key3 = "e_" + camel2Snake(name) + "_" + s;
        let key4 = "e_" + s + "_" + camel2Snake(name);
        let message = sl[key1] || sl[key2] || sl[key3] || sl[key4] || undefined;

        console.debug("Message", s, message);
        if (message !== undefined) return message;
    }

    if (fieldState[name]["badInput"]) {
        let s = "bad";
        let key1 = "e_" + name + "_" + s;
        let key2 = "e_" + s + "_" + name;
        let key3 = "e_" + camel2Snake(name) + "_" + s;
        let key4 = "e_" + s + "_" + camel2Snake(name);
        let message = sl[key1] || sl[key2] || sl[key3] || sl[key4] || undefined;

        console.debug("Message", s, message);
        if (message !== undefined) return message;
    }

    if (fieldState[name]["patternMismatch"]) {
        let s = "pattern";
        let key1 = "e_" + name + "_" + s;
        let key2 = "e_" + s + "_" + name;
        let key3 = "e_" + camel2Snake(name) + "_" + s;
        let key4 = "e_" + s + "_" + camel2Snake(name);
        let message = sl[key1] || sl[key2] || sl[key3] || sl[key4] || undefined;

        console.debug("Message", s, message);
        if (message !== undefined) return message;
    }

    if (!fieldState[name]["valid"]) {
        let s = "invalid";
        let key1 = "e_" + name + "_" + s;
        let key2 = "e_" + s + "_" + name;
        let key3 = "e_" + camel2Snake(name) + "_" + s;
        let key4 = "e_" + s + "_" + camel2Snake(name);
        let message = sl[key1] || sl[key2] || sl[key3] || sl[key4] || undefined;

        console.debug("Message", s, message);
        if (message !== undefined) return message;
    }

    return "";
};


export function getErrorMessage(e, sl) {
    let message = "";

    if (e.flag !== undefined && e.status !== undefined && e.data !== undefined) {
        console.debug("Host error handling");

        // error from host
        let code = e.data.result.code;
        let reason = code ? `${e.data.result.reason} (${e.data.result.code})` : `${e.data.result.reason}`;

        // sample code e_code_9006, e_code_6010
        let key = `e_code_${code}`;

        message = sl[key] || reason || sl['e_standard_message'];

    }
    else if (e.flag !== undefined && e.error !== undefined) {
        console.debug("Host runtime error handling");

        message = e.error.message;
    }
    else if (e.errorCode !== undefined || e.errorMessage !== undefined) {
        console.debug("Application error handling");

        // sample code e_invalid_format, e_permission_denied
        let key1 = `e_${e.errorCode}`;
        let key2 = `e_code_${e.errorCode}`;

        message = sl[key1] || sl[key2] || e.errorMessage || sl['e_standard_message'];
    }
    else if (typeof e === 'string' || e instanceof String) {
        console.debug("Runtime string message handling");
        message = e;
    }
    else {
        console.debug("Runtime or standard error handling");
        message = e.message;
    }
    return message;
};

export function isBlockErrorCode(e) {
    let code = undefined;
    if (typeof e === 'string' || e instanceof String) code = e;
    else if (isObject(e) && !(e?.flag) && e.data && e.data.result && e.data.result.code)
        code = e.data.result.code

    console.debug("Is block error code", e, code)
    if (code === undefined) return false;
    else if (code === "6051") return true;
    else if (code === "6070") return true;

    return false;
};

export function buildFilterText(obj) {
    let a = [];
    for (let key in obj)
        a.push(obj[key]);

    let s = a.toString();
    return s;
};

export function getLastUpdatedDate(dt) {
    if (dt === undefined) dt = new Date();
    let s = moment(dt).format("DD MMM YYYY hh:mm A");
    return s;
};

export function formatDate(dt) {
    if (dt === undefined) return "";
    let s = moment(dt).format("DD MMM YYYY hh:mm A");
    return s;
};

export function formatDate2Host(dt) {
    if (dt === undefined) dt = new Date();
    let s = moment(dt).format("YYYY-MM-DD hh:mm:ss");
    return s;
};

export function parseFilePath(path) {
    let parts = (/^(.*[\\/])?(.*?)(\.[^.]*?|)$/gi).exec(path);
    return {
        path: parts[0] || "",
        directoryPath: parts[1] || "",
        namePath: parts[2] || "",
        filename: parts[2] + parts[3],
        extension: parts[3] || "",
    };
};

export function getLabel(sl, value, prefix = "") {
    if (debugMode) console.log("Get label ", value, prefix);
    let key = prefix + value;
    let s = sl[key];
    return s;
};

export function formatAmount(value, n = 2) {
    if (debugMode) console.log("Format amount", value, n);
    if (value === undefined) return "";
    
    let s = new Intl.NumberFormat('en-US', { minimumFractionDigits: n }).format(value);
    return s;
};

export function getCurrencyRecord(list, code) {
    if (debugMode) console.log("Get currency record ", code);

    let record1 = list.find((record2) => {
        if (record2.isoNumericCode == code) return true;
        return false;
    });

    return record1;
};

export function getCurrencyAlphaCode(list, code) {
    if (debugMode) console.log("Get currency record ", code);

    let record1 = list.find((record2) => {
        if (record2.isoNumericCode == code) return true;
        return false;
    });

    return record1?.isoAlpha3Code || "";
};

export function getCurrencyMinorUnit(list, code) {
    if (debugMode) console.log("Get currency record ", code);

    let record1 = list.find((record2) => {
        if (record2.isoNumericCode == code) return true;
        return false;
    });

    return record1?.minorUnits || 2;
};

export function formatProcessingCode(code) {
    let s = code;

    if (s === undefined) return "";
    if (code.length == 1) s = "00000" + code;
    if (code.length == 2) s = "0000" + code;
    if (code.length == 3) s = "000" + code;
    if (code.length == 4) s = "00" + code;
    if (code.length == 5) s = "0" + code;
    return s;
};

export function processingCode2Description(code) {

    let pcode = formatProcessingCode(code);
    let desc = pcode;
    if (pcode.substr(0, 2) == "00") desc = "Purchase";
    else if (pcode.substr(0, 2) == "20") desc = "Refund";

    return desc;
};

export function formatResponseCode(code) {
    let s = code;
    if (code.length == 1) s = "0" + code;
    else s = code;
    return s;
};

export function responseCode2Description(code) {
    let s = "";
    if (code == "0") s = "Approved";
    else s = "Declined";
    return s;
};
 
export function buildSearchString(fieldList, v, dbType) {
   if (v === undefined || v === "") return undefined;

    let list = fieldList;
    let s = "";

    for (let n = 0; n < list.length; n++) {
        let name = list[n].name;

        if (s !== "") s += " or ";
        s += `CAST(${name} as TEXT) ILIKE '%${v}%'`;
    }

    return s;
};


export function getLocalData4AppComponentSetting(defaultData = {}) {
    console.log("Get local storage for app component setting");

    let name = name4AppComponentSetting;
    let list = getLocalData(name, defaultData);

    return list;
};

export function putLocalData4AppComponentSetting(data) {
    console.log("Put local storage for app component setting");

    let name = name4AppComponentSetting;
    putLocalData(name, data);

    return;
};

export function removeLocalData4AppComponentSetting() {
    console.log("Remove local storage for app component setting");

    let name = name4AppComponentSetting;
    removeLocalData(name);

    return;
};

function formatToUTCDateTime(date) {
    const pad = (n) => String(n).padStart(2, "0");

    return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ` +
        `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`;
}

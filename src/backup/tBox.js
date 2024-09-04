
let debugMode = false;

const key4AppLocalData = "UnityTestVersion1";
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

    if (lang != "English") {
        let url = `./conf/label_${lang}.conf`;
        langLabel = await getJSONHostFile(url);
    }

    // return { ...defaultLabel, ...langLabel };

    let obj = { ...defaultLabel };

    for (let key1 in obj) {
        if (langLabel[key1] == undefined) continue;
        for (let key2 in obj[key1]) {
            if (langLabel[key1][key2] == undefined) continue;
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
    let v = undefined;
    let obj = {};
    v = localStorage.getItem(key);

    if (v == undefined) {
        obj = defaultObject;
        putLocalData(key, obj);
    }
    else {
        obj = JSON.parse(v);
    }

    return obj;
};

export function getAppLocalData() {
    let obj = {};
    let key = key4AppLocalData;
    obj = getLocalData(key, { applicationLanguage: "English" });
    return obj;
};

export function updateAppLocalData(fieldName, value) {
    if (fieldName == undefined) return;
    let key = key4AppLocalData;
    let obj = getLocalData(key);

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

export function getClass4IsInvalid(valid, dirty = false, required = false) {
    console.debug("Class for is invalid", valid, dirty, required);

    if (!dirty) return "";
    else if (valid === undefined && required) return "is-invalid";
    else if (valid === undefined && !required) return "";
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

export function getFieldErrorMessage(name, sl, fieldState = {}, formState = {}) {
    console.debug("Build error element for field", name);
    if (!formState.dirty || fieldState[name] === undefined || fieldState[name]["valid"]) {
        console.debug("Not dirty, state not found or state is fine; No need to build error message element");
        return "";
    }

    if (fieldState[name]["valueMissing"]) {
        let s = "required";
        let key1 = "e_" + name + "_" + s;
        let key2 = "e_" + s + "_" + name;
        let message = sl[key1] || sl[key2] || sl["e_field_required"] || undefined;
        console.debug("Message", s, message);
        if (message !== undefined) return message;
    }

    if (fieldState[name]["badInput"]) {
        let s = "bad";
        let key1 = "e_" + name + "_" + s;
        let key2 = "e_" + s + "_" + name;
        let message = sl[key1] || sl[key2] || undefined;
        console.debug("Message", s, message);
        if (message !== undefined) return message;
    }

    if (fieldState[name]["patternMismatch"]) {
        let s = "pattern";
        let key1 = "e_" + name + "_" + s;
        let key2 = "e_" + s + "_" + name;
        let message = sl[key1] || sl[key2] || undefined;
        console.debug("Message", s, message);
        if (message != undefined) return message;
    }

    if (!fieldState[name]["valid"]) {
        let s = "invalid";
        let key1 = "e_" + name + "_" + s;
        let key2 = "e_" + s + "_" + name;
        let message = sl[key1] || sl[key2] || undefined;
        console.debug("Message", s, message);
        if (message != undefined) return message;
    }

    return "";
};

export function getErrorMessage(e, sl) {
    let message = "";

    if (e.flag !== undefined && e.status !== undefined && e.data !== undefined) {
        console.debug("Host error handling");

        // error from host
        let code = e.data.result.code;
        let reason = e.data.result.reason;

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
        let key = `e_${e.errorCode}`;

        message = sl[key] || e.errorMessage || sl['e_standard_message'];
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
    if (dt == undefined) dt = new Date();
    let s = moment(dt).format("DD MMM YYYY hh:mm A")
    return s;
};

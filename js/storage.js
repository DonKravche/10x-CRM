// The exact localStorage key names the PRD requires — every other file
// must reference keys through this object instead of retyping raw strings.
const STORAGE_KEYS = {
    USERS: "crm_users",
    SESSION: "crm_session",
    CLIENTS: "crm_clients",
    THEME: "crm_theme"
};

function getStorage(storageKey) {
    const storedValue = localStorage.getItem(storageKey);
    try {
        // If the value exists, parse it back into an object/array; otherwise return null.
        return storedValue ? JSON.parse(storedValue) : null;
    } catch (parseError) {
        console.error("Error parsing JSON from localStorage:", parseError);
        return null;
    }
}

function setStorage(storageKey, valueToStore) {
    try {
        localStorage.setItem(storageKey, JSON.stringify(valueToStore));
    } catch (stringifyError) {
        console.error("Error stringifying JSON for localStorage:", stringifyError);
    }
}

function removeStorageValue(storageKey) {
    localStorage.removeItem(storageKey);
}

// guard.js is loaded on every page (auth pages included). It owns the auth
// guard/redirects, theme + logout, and the generic form-feedback helpers
// that auth.js, clients.js, and profile.js all reuse instead of duplicating.

let activeToastTimeoutId = null;

function getCurrentSession() {
    return getStorage(STORAGE_KEYS.SESSION);
}

function getCurrentUser() {
    const currentSession = getCurrentSession();
    if (!currentSession) {
        return null;
    }

    const allUsers = getStorage(STORAGE_KEYS.USERS) || [];
    return allUsers.find(userRecord => userRecord.id === currentSession.userId) || null;
}

function showToastMessage(messageText, toastVariant) {
    const toastElement = document.getElementById("toast-notification");
    if (!toastElement) {
        return;
    }

    const toastMessageElement = toastElement.querySelector(".toast__message");
    toastMessageElement.textContent = messageText;

    toastElement.classList.remove("toast--success", "toast--error");
    toastElement.classList.add(toastVariant === "error" ? "toast--error" : "toast--success");
    toastElement.classList.remove("hidden");

    if (activeToastTimeoutId) {
        clearTimeout(activeToastTimeoutId);
    }
    activeToastTimeoutId = setTimeout(() => {
        toastElement.classList.add("hidden");
    }, 3000);
}

// Error spans follow the {input-id}-error convention, and every input lives
// inside a .form-field wrapper that gets the --invalid modifier for its
// red border (see scss/components/_forms.scss).
function displayFieldError(inputElementId, errorMessageText) {
    const inputElement = document.getElementById(inputElementId);
    const errorMessageElement = document.getElementById(`${inputElementId}-error`);
    if (!inputElement || !errorMessageElement) {
        return;
    }

    errorMessageElement.textContent = errorMessageText;
    errorMessageElement.classList.remove("hidden");

    const formFieldElement = inputElement.closest(".form-field");
    if (formFieldElement) {
        formFieldElement.classList.add("form-field--invalid");
    }
}

function clearFieldError(inputElementId) {
    const inputElement = document.getElementById(inputElementId);
    const errorMessageElement = document.getElementById(`${inputElementId}-error`);
    if (!inputElement || !errorMessageElement) {
        return;
    }

    errorMessageElement.textContent = "";
    errorMessageElement.classList.add("hidden");

    const formFieldElement = inputElement.closest(".form-field");
    if (formFieldElement) {
        formFieldElement.classList.remove("form-field--invalid");
    }
}

function clearAllFieldErrors(formElement) {
    const errorMessageElements = formElement.querySelectorAll(".field-error-msg");
    errorMessageElements.forEach(errorMessageElement => {
        errorMessageElement.textContent = "";
        errorMessageElement.classList.add("hidden");
    });

    const invalidFormFieldElements = formElement.querySelectorAll(".form-field--invalid");
    invalidFormFieldElements.forEach(formFieldElement => {
        formFieldElement.classList.remove("form-field--invalid");
    });
}

// Latin-only. The previous [^\s@] classes accepted any non-space character, so
// "ნინო@example.com" counted as a valid address. The error text is unchanged.
function isValidEmailFormat(emailValue) {
    return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(emailValue);
}

// Anything outside printable ASCII — Georgian letters above all.
const NON_LATIN_INPUT_PATTERN = /[^\x20-\x7E]/g;

// Credentials are compared character by character at login, so a Georgian letter
// typed by accident would silently lock a user out of their own account. Applied
// to email and password fields only; names and companies stay unrestricted.
function restrictFieldToLatinInput(inputElementId) {
    const inputElement = document.getElementById(inputElementId);
    if (!inputElement) {
        return;
    }

    inputElement.addEventListener("input", () => {
        const typedValue = inputElement.value;
        const latinOnlyValue = typedValue.replace(NON_LATIN_INPUT_PATTERN, "");
        if (latinOnlyValue === typedValue) {
            return;
        }

        // selectionStart reads null on type="email" inputs, where setSelectionRange
        // also throws, so the caret is only restored where the field supports it.
        const caretPositionBeforeStrip = inputElement.selectionStart;
        inputElement.value = latinOnlyValue;

        if (caretPositionBeforeStrip !== null) {
            const removedCharacterCount = typedValue.length - latinOnlyValue.length;
            const restoredCaretPosition = caretPositionBeforeStrip - removedCharacterCount;
            inputElement.setSelectionRange(restoredCaretPosition, restoredCaretPosition);
        }
    });
}

function isValidPasswordFormat(passwordValue) {
    const hasMinimumLength = passwordValue.length >= 8;
    const containsLetter = /[a-zA-Z]/.test(passwordValue);
    const containsDigit = /[0-9]/.test(passwordValue);
    return hasMinimumLength && containsLetter && containsDigit;
}

function applyStoredThemePreference() {
    const storedThemeName = getStorage(STORAGE_KEYS.THEME) || "light";
    if (storedThemeName === "dark") {
        document.documentElement.setAttribute("data-theme", "dark");
    } else {
        document.documentElement.removeAttribute("data-theme");
    }
}

function setupThemeToggleButton() {
    const themeToggleButton = document.getElementById("theme-toggle-btn");
    if (!themeToggleButton) {
        return;
    }

    themeToggleButton.addEventListener("click", () => {
        const isCurrentlyDark = document.documentElement.getAttribute("data-theme") === "dark";
        const nextThemeName = isCurrentlyDark ? "light" : "dark";

        if (nextThemeName === "dark") {
            document.documentElement.setAttribute("data-theme", "dark");
        } else {
            document.documentElement.removeAttribute("data-theme");
        }

        setStorage(STORAGE_KEYS.THEME, nextThemeName);
        themeToggleButton.setAttribute("aria-pressed", String(nextThemeName === "dark"));
    });
}

function setupLogoutButton() {
    const logoutButton = document.getElementById("logout-btn");
    if (!logoutButton) {
        return;
    }

    logoutButton.addEventListener("click", () => {
        // Only the session is cleared — crm_users and crm_clients stay intact.
        removeStorageValue(STORAGE_KEYS.SESSION);
        window.location.href = "index.html";
    });
}

// Runs the moment this script executes (it is loaded at the end of <body>,
// so the DOM it needs already exists — no need to wait for DOMContentLoaded).
// Guard checks are delayed by 500ms on auth pages to allow auth.js (which loads
// immediately after) time to display success/failure messages before redirecting.
function initializeGuard() {
    const currentSession = getCurrentSession();
    const isProtectedPage = Boolean(document.querySelector(".app-layout"));
    const isPublicAuthPage = document.body.classList.contains("auth-page");

    const performGuardCheck = () => {
        if (isProtectedPage && !currentSession) {
            window.location.href = "index.html";
            return;
        }

        if (isPublicAuthPage && currentSession) {
            window.location.href = "dashboard.html";
            return;
        }

        applyStoredThemePreference();
        setupThemeToggleButton();
        setupLogoutButton();
    };

    // Delay guard check on auth pages to let auth.js display messages first
    if (isPublicAuthPage) {
        setTimeout(performGuardCheck, 500);
    } else {
        performGuardCheck();
    }
}

initializeGuard();

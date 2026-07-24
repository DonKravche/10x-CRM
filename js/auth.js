// Serves both index.html (#login-form) and signup.html (#signup-form) —
// initializeAuthPage() only wires up whichever form actually exists.

function validateLoginFields(emailValue, passwordValue) {
    const validationErrors = {};

    if (emailValue.trim() === "") {
        validationErrors.email = "Email is required";
    }

    if (passwordValue === "") {
        validationErrors.password = "Password is required";
    }

    return validationErrors;
}

function handleLoginFormSubmit(submitEvent) {
    submitEvent.preventDefault();

    const loginFormElement = submitEvent.target;
    clearAllFieldErrors(loginFormElement);

    const emailInputValue = document.getElementById("login-email").value;
    const passwordInputValue = document.getElementById("login-password").value;

    const validationErrors = validateLoginFields(emailInputValue, passwordInputValue);
    if (validationErrors.email) {
        displayFieldError("login-email", validationErrors.email);
    }
    if (validationErrors.password) {
        displayFieldError("login-password", validationErrors.password);
    }
    if (Object.keys(validationErrors).length > 0) {
        return;
    }

    const lowercaseEmail = emailInputValue.trim().toLowerCase();
    const allUsers = getStorage(STORAGE_KEYS.USERS) || [];
    const matchingUser = allUsers.find(userRecord =>
        userRecord.email === lowercaseEmail && userRecord.password === passwordInputValue
    );

    if (!matchingUser) {
        // Deliberately vague per the PRD: never reveal whether the email or
        // the password was the wrong part, to avoid leaking which emails
        // are registered.
        displayFieldError("login-password", "Invalid email or password");
        return;
    }

    const newSession = {
        userId: matchingUser.id,
        email: matchingUser.email,
        loginAt: new Date().toISOString()
    };
    setStorage(STORAGE_KEYS.SESSION, newSession);
    window.location.href = "dashboard.html";
}

function validateSignupFields(fullNameValue, emailValue, passwordValue, confirmPasswordValue) {
    const validationErrors = {};

    if (fullNameValue.trim().length < 3) {
        validationErrors.fullName = "Full name must be at least 3 characters";
    }

    if (!isValidEmailFormat(emailValue)) {
        validationErrors.email = "Please enter a valid email address";
    } else {
        const lowercaseEmail = emailValue.toLowerCase();
        const allUsers = getStorage(STORAGE_KEYS.USERS) || [];
        const emailAlreadyRegistered = allUsers.some(userRecord => userRecord.email === lowercaseEmail);
        if (emailAlreadyRegistered) {
            validationErrors.email = "An account with this email already exists";
        }
    }

    if (!isValidPasswordFormat(passwordValue)) {
        validationErrors.password = "Password must be at least 8 characters and contain a letter and a number";
    }

    if (confirmPasswordValue !== passwordValue) {
        validationErrors.confirmPassword = "Passwords do not match";
    }

    return validationErrors;
}

function handleSignupFormSubmit(submitEvent) {
    submitEvent.preventDefault();

    const signupFormElement = submitEvent.target;
    clearAllFieldErrors(signupFormElement);

    const fullNameValue = document.getElementById("signup-fullname").value;
    const emailValue = document.getElementById("signup-email").value.trim();
    const companyValue = document.getElementById("signup-company").value.trim();
    const passwordValue = document.getElementById("signup-password").value;
    const confirmPasswordValue = document.getElementById("signup-confirm-password").value;

    const validationErrors = validateSignupFields(fullNameValue, emailValue, passwordValue, confirmPasswordValue);

    if (validationErrors.fullName) {
        displayFieldError("signup-fullname", validationErrors.fullName);
    }
    if (validationErrors.email) {
        displayFieldError("signup-email", validationErrors.email);
    }
    if (validationErrors.password) {
        displayFieldError("signup-password", validationErrors.password);
    }
    if (validationErrors.confirmPassword) {
        displayFieldError("signup-confirm-password", validationErrors.confirmPassword);
    }

    if (Object.keys(validationErrors).length > 0) {
        return;
    }

    const nowAsIsoString = new Date().toISOString();
    const newUser = {
        id: Date.now(),
        fullName: fullNameValue.trim(),
        email: emailValue.toLowerCase(),
        // Plaintext password: acceptable only because there is no backend in
        // this learning project. A real product hashes passwords server-side.
        password: passwordValue,
        company: companyValue,
        createdAt: nowAsIsoString,
        updatedAt: nowAsIsoString
    };

    const allUsers = getStorage(STORAGE_KEYS.USERS) || [];
    allUsers.push(newUser);
    setStorage(STORAGE_KEYS.USERS, allUsers);

    showToastMessage("Account created successfully! Please log in.", "success");
    // Wait for the toast animation to complete before redirecting (3.5s total:
    // 3s toast visibility + 0.5s buffer). This prevents guard.js from redirecting
    // the user before the success message displays.
    setTimeout(() => {
        window.location.href = "index.html";
    }, 3500);
}

function initializeAuthPage() {
    const loginFormElement = document.getElementById("login-form");
    if (loginFormElement) {
        loginFormElement.addEventListener("submit", handleLoginFormSubmit);
        restrictFieldToLatinInput("login-email");
        restrictFieldToLatinInput("login-password");
    }

    const signupFormElement = document.getElementById("signup-form");
    if (signupFormElement) {
        signupFormElement.addEventListener("submit", handleSignupFormSubmit);
        // Full name and company are left alone on purpose — those may be Georgian.
        restrictFieldToLatinInput("signup-email");
        restrictFieldToLatinInput("signup-password");
        restrictFieldToLatinInput("signup-confirm-password");
    }
}

initializeAuthPage();

function getUserInitials(fullNameValue) {
    return fullNameValue
        .split(" ")
        .map(nameWordValue => nameWordValue[0])
        .join("")
        .toUpperCase();
}

function displayProfileInfo() {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        return;
    }

    document.getElementById("profile-avatar").textContent = getUserInitials(currentUser.fullName);
    document.getElementById("profile-display-name").textContent = currentUser.fullName;
    document.getElementById("profile-display-email").textContent = currentUser.email;
    document.getElementById("profile-display-company").textContent = currentUser.company || "—";
    document.getElementById("profile-member-since").textContent =
        new Date(currentUser.createdAt).toLocaleDateString();
    document.getElementById("profile-last-updated").textContent =
        new Date(currentUser.updatedAt).toLocaleDateString();

    document.getElementById("profile-fullname").value = currentUser.fullName;
    document.getElementById("profile-company").value = currentUser.company || "";

    // Email is the account's login identifier. The PRD's edit-profile form
    // only covers Full Name and Company, so the email input is shown for
    // context but kept read-only rather than silently discarding edits to it.
    const emailInputElement = document.getElementById("profile-email");
    emailInputElement.value = currentUser.email;
    emailInputElement.readOnly = true;
}

function validateEditProfileFields(fullNameValue) {
    const validationErrors = {};

    if (fullNameValue.trim().length < 3) {
        validationErrors.fullName = "Full name must be at least 3 characters";
    }

    return validationErrors;
}

function handleEditProfileFormSubmit(submitEvent) {
    submitEvent.preventDefault();

    const editProfileFormElement = submitEvent.target;
    clearAllFieldErrors(editProfileFormElement);

    const fullNameValue = document.getElementById("profile-fullname").value;
    const companyValue = document.getElementById("profile-company").value.trim();

    const validationErrors = validateEditProfileFields(fullNameValue);
    if (validationErrors.fullName) {
        displayFieldError("profile-fullname", validationErrors.fullName);
        return;
    }

    const currentSession = getCurrentSession();
    const allUsers = getStorage(STORAGE_KEYS.USERS) || [];
    const userRecord = allUsers.find(existingUser => existingUser.id === currentSession.userId);
    if (!userRecord) {
        return;
    }

    userRecord.fullName = fullNameValue.trim();
    userRecord.company = companyValue;
    userRecord.updatedAt = new Date().toISOString();
    setStorage(STORAGE_KEYS.USERS, allUsers);

    displayProfileInfo();
    showToastMessage("Profile updated ✓", "success");
}

function validateChangePasswordFields(currentPasswordValue, newPasswordValue, confirmNewPasswordValue, actualStoredPassword) {
    const validationErrors = {};

    if (currentPasswordValue !== actualStoredPassword) {
        validationErrors.currentPassword = "Current password is incorrect";
    }

    if (!isValidPasswordFormat(newPasswordValue)) {
        validationErrors.newPassword = "Password must be at least 8 characters and contain a letter and a number";
    } else if (newPasswordValue === actualStoredPassword) {
        validationErrors.newPassword = "New password must be different from the current one";
    }

    if (confirmNewPasswordValue !== newPasswordValue) {
        validationErrors.confirmNewPassword = "Passwords do not match";
    }

    return validationErrors;
}

function handleChangePasswordFormSubmit(submitEvent) {
    submitEvent.preventDefault();

    const changePasswordFormElement = submitEvent.target;
    clearAllFieldErrors(changePasswordFormElement);

    const currentPasswordValue = document.getElementById("current-password").value;
    const newPasswordValue = document.getElementById("new-password").value;
    const confirmNewPasswordValue = document.getElementById("confirm-new-password").value;

    const currentSession = getCurrentSession();
    const allUsers = getStorage(STORAGE_KEYS.USERS) || [];
    const userRecord = allUsers.find(existingUser => existingUser.id === currentSession.userId);
    if (!userRecord) {
        return;
    }

    const validationErrors = validateChangePasswordFields(
        currentPasswordValue,
        newPasswordValue,
        confirmNewPasswordValue,
        userRecord.password
    );

    if (validationErrors.currentPassword) {
        displayFieldError("current-password", validationErrors.currentPassword);
    }
    if (validationErrors.newPassword) {
        displayFieldError("new-password", validationErrors.newPassword);
    }
    if (validationErrors.confirmNewPassword) {
        displayFieldError("confirm-new-password", validationErrors.confirmNewPassword);
    }

    if (Object.keys(validationErrors).length > 0) {
        return;
    }

    userRecord.password = newPasswordValue;
    userRecord.updatedAt = new Date().toISOString();
    setStorage(STORAGE_KEYS.USERS, allUsers);

    changePasswordFormElement.reset();
    showToastMessage("Password changed ✓", "success");
}

function initializeProfilePage() {
    displayProfileInfo();
    document.getElementById("edit-profile-form").addEventListener("submit", handleEditProfileFormSubmit);
    document.getElementById("change-password-form").addEventListener("submit", handleChangePasswordFormSubmit);
}

initializeProfilePage();

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

function initializeProfilePage() {
    displayProfileInfo();
}

initializeProfilePage();

let allClientsList = [];
let activeStatusFilter = "all";
let activeSortOption = "date-desc";
let activeSearchQuery = "";

function getVisibleClients() {
    let visibleClients = [...allClientsList];

    if (activeStatusFilter !== "all") {
        visibleClients = visibleClients.filter(clientRecord =>
            clientRecord.status.toLowerCase() === activeStatusFilter
        );
    }

    if (activeSearchQuery !== "") {
        const lowercaseSearchQuery = activeSearchQuery.toLowerCase();
        visibleClients = visibleClients.filter(clientRecord =>
            clientRecord.name.toLowerCase().includes(lowercaseSearchQuery) ||
            clientRecord.company.toLowerCase().includes(lowercaseSearchQuery)
        );
    }

    visibleClients.sort((firstClient, secondClient) => {
        switch (activeSortOption) {
            case "date-asc":
                return new Date(firstClient.createdAt) - new Date(secondClient.createdAt);
            case "name-asc":
                return firstClient.name.localeCompare(secondClient.name);
            case "name-desc":
                return secondClient.name.localeCompare(firstClient.name);
            case "value-desc":
                return secondClient.dealValue - firstClient.dealValue;
            case "date-desc":
            default:
                return new Date(secondClient.createdAt) - new Date(firstClient.createdAt);
        }
    });

    return visibleClients;
}

function handleSearchInput(inputEvent) {
    activeSearchQuery = inputEvent.target.value.trim();
    renderClientCards(getVisibleClients());
}

function handleFilterChipClick(clickEvent) {
    const clickedChipElement = clickEvent.target.closest(".filter-chip");
    if (!clickedChipElement) {
        return;
    }

    document.querySelectorAll(".filter-chip").forEach(chipElement => {
        chipElement.classList.remove("filter-chip--active");
    });
    clickedChipElement.classList.add("filter-chip--active");

    activeStatusFilter = clickedChipElement.dataset.filter;
    renderClientCards(getVisibleClients());
}

function handleSortSelectChange(changeEvent) {
    activeSortOption = changeEvent.target.value;
    renderClientCards(getVisibleClients());
}

function setupSearchFilterSortControls() {
    document.getElementById("search-input").addEventListener("input", handleSearchInput);
    document.querySelector(".toolbar-filters__chips").addEventListener("click", handleFilterChipClick);
    document.getElementById("sort-select").addEventListener("change", handleSortSelectChange);
}

function getClientInitials(clientName) {
    return clientName
        .split(" ")
        .map(nameWordValue => nameWordValue[0])
        .join("")
        .toUpperCase();
}

function findClientById(clientId) {
    return allClientsList.find(clientRecord => String(clientRecord.id) === String(clientId));
}

function renderClientCards(clientsToDisplay) {
    const clientsContainerElement = document.getElementById("clients-container");
    const cardTemplateElement = document.getElementById("client-card-template");
    const noClientsMessageElement = document.getElementById("no-clients-msg");

    clientsContainerElement.innerHTML = "";

    if (clientsToDisplay.length === 0) {
        noClientsMessageElement.textContent = "No clients found. Add your first client to get started.";
        noClientsMessageElement.classList.remove("hidden");
        return;
    }
    noClientsMessageElement.classList.add("hidden");

    clientsToDisplay.forEach(clientRecord => {
        const clonedCardFragment = cardTemplateElement.content.cloneNode(true);
        const clientCardElement = clonedCardFragment.querySelector(".client-card");

        // data-client-id lets every delegated click/change handler know which
        // client a card belongs to, since cards are cloned (no unique DOM ids).
        clientCardElement.dataset.clientId = clientRecord.id;
        clientCardElement.classList.add(`client-card--${clientRecord.status.toLowerCase()}`);

        clientCardElement.querySelector(".client-card__avatar").textContent = getClientInitials(clientRecord.name);
        clientCardElement.querySelector(".client-card__name").textContent = clientRecord.name;
        clientCardElement.querySelector(".client-card__company").textContent = clientRecord.company;
        clientCardElement.querySelector(".client-card__email").textContent = clientRecord.email;
        clientCardElement.querySelector(".client-card__deal-value").textContent =
            `$${clientRecord.dealValue.toLocaleString("en-US")}`;

        const statusBadgeElement = clientCardElement.querySelector(".status-badge");
        statusBadgeElement.textContent = clientRecord.status;
        statusBadgeElement.className = `status-badge status-badge--${clientRecord.status.toLowerCase()}`;

        const statusSelectElement = clientCardElement.querySelector('[data-action="change-status"]');
        statusSelectElement.value = clientRecord.status.toLowerCase();

        clientsContainerElement.appendChild(clonedCardFragment);
    });
}

function showClientsLoadingState() {
    document.getElementById("loading-indicator").classList.remove("hidden");
    document.getElementById("no-clients-msg").classList.add("hidden");
}

function hideClientsLoadingState() {
    document.getElementById("loading-indicator").classList.add("hidden");
}

function showClientsErrorState(errorMessageText) {
    const noClientsMessageElement = document.getElementById("no-clients-msg");
    noClientsMessageElement.textContent = "";
    noClientsMessageElement.classList.remove("hidden");

    const errorTextNode = document.createTextNode(`${errorMessageText} `);

    // No dedicated "Retry" element exists in the markup for this state, so it
    // is created here and injected into the existing empty-state element.
    const retryButtonElement = document.createElement("button");
    retryButtonElement.type = "button";
    retryButtonElement.className = "btn btn--ghost";
    retryButtonElement.textContent = "Retry";
    retryButtonElement.addEventListener("click", initializeClientsPage);

    noClientsMessageElement.appendChild(errorTextNode);
    noClientsMessageElement.appendChild(retryButtonElement);
}

function openModal(modalElement) {
    modalElement.classList.remove("hidden");
}

function closeModal(modalElement) {
    modalElement.classList.add("hidden");
}

// Both the Add Client modal and the Client Details modal share the same
// data-action="close-modal" convention, so one delegated setup covers both.
function setupModalCloseTriggers() {
    document.querySelectorAll('[data-action="close-modal"]').forEach(closeTriggerElement => {
        closeTriggerElement.addEventListener("click", () => {
            closeModal(closeTriggerElement.closest(".modal"));
        });
    });
}

function validateAddClientFields(nameValue, emailValue, phoneValue, dealValueValue) {
    const validationErrors = {};

    if (nameValue.trim().length < 3) {
        validationErrors.name = "Name must be at least 3 characters";
    }

    if (!isValidEmailFormat(emailValue)) {
        validationErrors.email = "Please enter a valid email address";
    } else {
        const lowercaseEmail = emailValue.toLowerCase();
        const emailAlreadyExists = allClientsList.some(clientRecord =>
            clientRecord.email.toLowerCase() === lowercaseEmail
        );
        if (emailAlreadyExists) {
            validationErrors.email = "A client with this email already exists";
        }
    }

    const trimmedPhoneValue = phoneValue.trim();
    if (trimmedPhoneValue !== "" && trimmedPhoneValue.length < 6) {
        validationErrors.phone = "Phone number looks too short";
    }

    const dealValueAsNumber = Number(dealValueValue);
    if (dealValueValue.trim() === "" || Number.isNaN(dealValueAsNumber) || dealValueAsNumber <= 0) {
        validationErrors.dealValue = "Deal value must be a positive number";
    }

    return validationErrors;
}

async function handleAddClientFormSubmit(submitEvent) {
    submitEvent.preventDefault();

    const addClientFormElement = submitEvent.target;
    clearAllFieldErrors(addClientFormElement);

    const nameValue = document.getElementById("client-name").value;
    const emailValue = document.getElementById("client-email").value.trim();
    const phoneValue = document.getElementById("client-phone").value;
    const companyValue = document.getElementById("client-company").value.trim();
    const dealValueValue = document.getElementById("client-deal-value").value;
    const statusValue = document.getElementById("client-status").value;

    const validationErrors = validateAddClientFields(nameValue, emailValue, phoneValue, dealValueValue);

    if (validationErrors.name) {
        displayFieldError("client-name", validationErrors.name);
    }
    if (validationErrors.email) {
        displayFieldError("client-email", validationErrors.email);
    }
    if (validationErrors.phone) {
        displayFieldError("client-phone", validationErrors.phone);
    }
    if (validationErrors.dealValue) {
        displayFieldError("client-deal-value", validationErrors.dealValue);
    }

    if (Object.keys(validationErrors).length > 0) {
        return;
    }

    try {
        const apiResponse = await createClientOnApi({
            name: nameValue.trim(),
            email: emailValue,
            phone: phoneValue.trim(),
            company: companyValue
        });

        const nowAsIsoString = new Date().toISOString();
        const capitalizedStatus = statusValue.charAt(0).toUpperCase() + statusValue.slice(1);

        const newClient = {
            id: apiResponse.id,
            name: nameValue.trim(),
            email: emailValue,
            phone: phoneValue.trim(),
            company: companyValue,
            image: "",
            status: capitalizedStatus,
            dealValue: Number(dealValueValue),
            notes: [],
            createdAt: nowAsIsoString,
            updatedAt: nowAsIsoString
        };

        allClientsList.unshift(newClient);
        saveClients(allClientsList);
        renderClientCards(getVisibleClients());

        closeModal(document.getElementById("add-client-modal"));
        showToastMessage("Client added ✓", "success");
    } catch (createError) {
        console.error(createError);
        showToastMessage("Could not add the client. Please try again.", "error");
    }
}

function setupAddClientModal() {
    const addClientModalElement = document.getElementById("add-client-modal");
    const addClientButtonElement = document.getElementById("add-client-btn");
    const addClientFormElement = document.getElementById("add-client-form");

    addClientButtonElement.addEventListener("click", () => {
        addClientFormElement.reset();
        clearAllFieldErrors(addClientFormElement);
        openModal(addClientModalElement);
    });

    addClientFormElement.addEventListener("submit", handleAddClientFormSubmit);
}

function handleClientCardStatusChange(changeEvent) {
    const statusSelectElement = changeEvent.target.closest('[data-action="change-status"]');
    if (!statusSelectElement) {
        return;
    }

    const clientCardElement = statusSelectElement.closest(".client-card");
    const clientRecord = findClientById(clientCardElement.dataset.clientId);
    if (!clientRecord) {
        return;
    }

    const selectedStatusValue = statusSelectElement.value;
    clientRecord.status = selectedStatusValue.charAt(0).toUpperCase() + selectedStatusValue.slice(1);
    clientRecord.updatedAt = new Date().toISOString();

    saveClients(allClientsList);
    renderClientCards(getVisibleClients());
}

async function handleDeleteClientClick(clientId) {
    const clientRecord = findClientById(clientId);
    if (!clientRecord) {
        return;
    }

    const userConfirmedDeletion = confirm("Delete this client? This cannot be undone.");
    if (!userConfirmedDeletion) {
        return;
    }

    // A 404 here is expected for clients we added ourselves (DummyJSON never
    // actually persisted them) — deleteClientOnApi already tolerates that.
    await deleteClientOnApi(clientId);

    allClientsList = allClientsList.filter(existingClient => String(existingClient.id) !== String(clientId));
    saveClients(allClientsList);
    renderClientCards(getVisibleClients());

    showToastMessage("Client deleted", "success");
}

function handleClientsContainerClick(clickEvent) {
    const clientCardElement = clickEvent.target.closest(".client-card");
    if (!clientCardElement) {
        return;
    }
    const clientId = clientCardElement.dataset.clientId;

    if (clickEvent.target.closest('[data-action="delete-client"]')) {
        handleDeleteClientClick(clientId);
        return;
    }

    if (clickEvent.target.closest('[data-action="view-details"]')) {
        openClientDetailsModal(clientId);
    }
}

function setupClientCardActions() {
    const clientsContainerElement = document.getElementById("clients-container");
    clientsContainerElement.addEventListener("click", handleClientsContainerClick);
    clientsContainerElement.addEventListener("change", handleClientCardStatusChange);
}

let currentlyOpenClientId = null;

function renderClientNotesList(notesList) {
    const notesListElement = document.getElementById("notes-list");
    const noNotesMessageElement = document.getElementById("no-notes-msg");

    notesListElement.innerHTML = "";

    if (notesList.length === 0) {
        noNotesMessageElement.classList.remove("hidden");
        return;
    }
    noNotesMessageElement.classList.add("hidden");

    notesList.forEach(noteRecord => {
        const noteListItemElement = document.createElement("li");
        noteListItemElement.className = "client-notes__item";
        noteListItemElement.textContent = `${noteRecord.text} — ${noteRecord.date}`;
        notesListElement.appendChild(noteListItemElement);
    });
}

function openClientDetailsModal(clientId) {
    const clientRecord = findClientById(clientId);
    if (!clientRecord) {
        return;
    }

    currentlyOpenClientId = clientId;

    document.getElementById("details-avatar").textContent = getClientInitials(clientRecord.name);
    document.getElementById("details-name").textContent = clientRecord.name;
    document.getElementById("details-company").textContent = clientRecord.company;
    document.getElementById("details-email").textContent = clientRecord.email;
    document.getElementById("details-phone").textContent = clientRecord.phone || "—";
    document.getElementById("details-deal-value").textContent =
        `$${clientRecord.dealValue.toLocaleString("en-US")}`;

    const statusBadgeElement = document.getElementById("details-status");
    statusBadgeElement.textContent = clientRecord.status;
    statusBadgeElement.className = `status-badge status-badge--${clientRecord.status.toLowerCase()}`;

    document.getElementById("details-created").textContent = new Date(clientRecord.createdAt).toLocaleDateString();
    document.getElementById("details-updated").textContent = new Date(clientRecord.updatedAt).toLocaleDateString();

    renderClientNotesList(clientRecord.notes);

    openModal(document.getElementById("client-details-modal"));
}

function handleAddNoteFormSubmit(submitEvent) {
    submitEvent.preventDefault();

    const noteInputElement = document.getElementById("note-input");
    const noteTextValue = noteInputElement.value.trim();
    if (noteTextValue === "") {
        return;
    }

    const clientRecord = findClientById(currentlyOpenClientId);
    if (!clientRecord) {
        return;
    }

    clientRecord.notes.push({ text: noteTextValue, date: new Date().toLocaleString() });
    clientRecord.updatedAt = new Date().toISOString();
    saveClients(allClientsList);

    renderClientNotesList(clientRecord.notes);
    document.getElementById("details-updated").textContent = new Date(clientRecord.updatedAt).toLocaleDateString();
    noteInputElement.value = "";
}

function handleSetReminderClick() {
    const clientRecord = findClientById(currentlyOpenClientId);
    if (!clientRecord) {
        return;
    }

    // Captured now rather than looked up again inside the timeout, so the
    // reminder still names the right client even after the modal is closed
    // or a different client's details are opened before the minute is up.
    const remindedClientName = clientRecord.name;

    showToastMessage("Reminder set ✓", "success");
    setTimeout(() => {
        showToastMessage(`🔔 Follow up: ${remindedClientName}`, "success");
    }, 60000);
}

function setupClientDetailsModal() {
    document.getElementById("add-note-form").addEventListener("submit", handleAddNoteFormSubmit);
    document.getElementById("set-reminder-btn").addEventListener("click", handleSetReminderClick);
}

async function initializeClientsPage() {
    setupSearchFilterSortControls();
    setupModalCloseTriggers();
    setupAddClientModal();
    setupClientCardActions();
    setupClientDetailsModal();
    showClientsLoadingState();

    try {
        allClientsList = await loadClients();
        hideClientsLoadingState();
        renderClientCards(getVisibleClients());
    } catch (loadError) {
        console.error(loadError);
        hideClientsLoadingState();
        showClientsErrorState("Could not load clients. Check your connection and try again.");
    }
}

document.addEventListener("DOMContentLoaded", initializeClientsPage);

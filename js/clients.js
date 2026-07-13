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

async function initializeClientsPage() {
    setupSearchFilterSortControls();
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

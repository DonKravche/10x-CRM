let allClientsList = [];

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
    showClientsLoadingState();

    try {
        allClientsList = await loadClients();
        hideClientsLoadingState();
        renderClientCards(allClientsList);
    } catch (loadError) {
        console.error(loadError);
        hideClientsLoadingState();
        showClientsErrorState("Could not load clients. Check your connection and try again.");
    }
}

document.addEventListener("DOMContentLoaded", initializeClientsPage);

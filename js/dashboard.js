const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
const RECENT_CLIENTS_DISPLAY_COUNT = 5;
const NEW_CLIENT_WINDOW_IN_DAYS = 7;

function displayWelcomeBannerName() {
    const welcomeNameElement = document.getElementById("welcome-name");
    const currentUser = getCurrentUser();
    if (currentUser) {
        welcomeNameElement.textContent = currentUser.fullName.split(" ")[0];
    }
}

function startLiveClockInterval() {
    const liveClockElement = document.getElementById("live-clock");

    function updateLiveClockText() {
        const now = new Date();
        liveClockElement.textContent = `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
    }

    updateLiveClockText();
    setInterval(updateLiveClockText, 1000);
}

function renderDashboardStats(clientsList) {
    const activeDealsCount = clientsList.filter(clientRecord =>
        clientRecord.status !== "Won" && clientRecord.status !== "Lost"
    ).length;

    const wonRevenueTotal = clientsList
        .filter(clientRecord => clientRecord.status === "Won")
        .reduce((revenueSum, clientRecord) => revenueSum + clientRecord.dealValue, 0);

    const newThisWeekCount = clientsList.filter(clientRecord => {
        const daysSinceCreated = (Date.now() - new Date(clientRecord.createdAt)) / MILLISECONDS_PER_DAY;
        return daysSinceCreated <= NEW_CLIENT_WINDOW_IN_DAYS;
    }).length;

    document.getElementById("stat-total-clients").textContent = clientsList.length;
    document.getElementById("stat-active-deals").textContent = activeDealsCount;
    document.getElementById("stat-won-revenue").textContent = `$${wonRevenueTotal.toLocaleString("en-US")}`;
    document.getElementById("stat-new-week").textContent = newThisWeekCount;
}

function renderPipelineOverview(clientsList) {
    const pipelineStageCountElementIds = {
        Lead: "pipeline-lead-count",
        Contacted: "pipeline-contacted-count",
        Won: "pipeline-won-count",
        Lost: "pipeline-lost-count"
    };

    Object.entries(pipelineStageCountElementIds).forEach(([stageStatusName, countElementId]) => {
        const stageClientCount = clientsList.filter(clientRecord => clientRecord.status === stageStatusName).length;
        document.getElementById(countElementId).textContent = stageClientCount;
    });
}

function renderRecentClientsTable(clientsList) {
    const recentClientsTableBody = document.getElementById("recent-clients-body");

    const mostRecentClients = [...clientsList]
        .sort((firstClient, secondClient) => new Date(secondClient.createdAt) - new Date(firstClient.createdAt))
        .slice(0, RECENT_CLIENTS_DISPLAY_COUNT);

    recentClientsTableBody.innerHTML = mostRecentClients.map(clientRecord => `
        <tr>
            <td>${clientRecord.name}</td>
            <td>${clientRecord.company}</td>
            <td><span class="status-badge status-badge--${clientRecord.status.toLowerCase()}">${clientRecord.status}</span></td>
            <td>${new Date(clientRecord.createdAt).toLocaleDateString()}</td>
        </tr>
    `).join("");
}

async function initializeDashboardPage() {
    displayWelcomeBannerName();
    startLiveClockInterval();

    const clientsList = await loadClients();
    renderDashboardStats(clientsList);
    renderPipelineOverview(clientsList);
    renderRecentClientsTable(clientsList);
}

document.addEventListener("DOMContentLoaded", initializeDashboardPage);

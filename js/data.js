// Shared client-loading logic used by BOTH dashboard.js and clients.js —
// the PRD is explicit that this must live in one common file, not be
// duplicated per page.

const API_BASE_URL = "https://dummyjson.com";
const INITIAL_CLIENT_LOAD_LIMIT = 30;

function buildClientFromApiUser(apiUserRecord) {
    const nowAsIsoString = new Date().toISOString();

    return {
        id: apiUserRecord.id,
        name: `${apiUserRecord.firstName} ${apiUserRecord.lastName}`,
        email: apiUserRecord.email,
        phone: apiUserRecord.phone || "",
        company: apiUserRecord.company?.name || "No Company",
        image: apiUserRecord.image || "",
        status: "Lead",
        // PRD-specified range: a random deal value between 500 and 10000.
        dealValue: Math.floor(Math.random() * 9501) + 500,
        notes: [],
        createdAt: nowAsIsoString,
        updatedAt: nowAsIsoString
    };
}

async function loadClients() {
    const cachedClients = getStorage(STORAGE_KEYS.CLIENTS);
    if (cachedClients && cachedClients.length > 0) {
        return cachedClients;
    }

    const apiResponse = await fetch(`${API_BASE_URL}/users?limit=${INITIAL_CLIENT_LOAD_LIMIT}`);
    if (!apiResponse.ok) {
        throw new Error(`Failed to load clients: ${apiResponse.status}`);
    }

    const apiResponseBody = await apiResponse.json();
    const newlyLoadedClients = apiResponseBody.users.map(buildClientFromApiUser);

    saveClients(newlyLoadedClients);
    return newlyLoadedClients;
}

function saveClients(clientsList) {
    setStorage(STORAGE_KEYS.CLIENTS, clientsList);
}

async function createClientOnApi(clientFormValues) {
    const [firstNameValue, ...lastNameParts] = clientFormValues.name.trim().split(" ");

    const apiResponse = await fetch(`${API_BASE_URL}/users/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            firstName: firstNameValue,
            lastName: lastNameParts.join(" "),
            email: clientFormValues.email,
            phone: clientFormValues.phone,
            company: { name: clientFormValues.company }
        })
    });

    if (!apiResponse.ok) {
        throw new Error(`Failed to add client: ${apiResponse.status}`);
    }

    return apiResponse.json();
}

async function deleteClientOnApi(clientId) {
    const apiResponse = await fetch(`${API_BASE_URL}/users/${clientId}`, { method: "DELETE" });

    // DummyJSON returns 404 for ids it never actually stored (e.g. a client
    // we added ourselves) — expected, and the caller should still remove
    // the client from local state either way.
    if (!apiResponse.ok) {
        console.warn(`DELETE returned ${apiResponse.status} for client ${clientId} — removing locally anyway.`);
    }
}

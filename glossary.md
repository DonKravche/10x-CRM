# Glossary — 10X CRM

Ten technical terms actually used in this project. Each entry gives an English
definition, an explanation in my own words, the Georgian explanation required by the
PRD, and the place in the code where the term appears.

---

### 1. Authentication

**EN:** Authentication is the process of verifying that a user is who they claim to be, usually by checking a submitted email and password against stored credentials.

**In my own words:** It is the check of whether you really are who you say you are. In
my app the user types an email and a password, and the code searches `crm_users` for a
record where both match. If it finds nothing, access is refused.

**ქართულად:** ეს არის შემოწმება, მართლა ის ხარ თუ არა, ვინც ამბობ რომ ხარ. ჩემს
აპლიკაციაში მომხმარებელი წერს email-ს და პაროლს, კოდი კი `crm_users`-ში ეძებს
ჩანაწერს, სადაც ორივე ემთხვევა. თუ ვერ იპოვა — შესვლას არ დაუშვებს.

**Where it is used:** `js/auth.js` → `handleLoginFormSubmit()`, where `find()` checks
the email/password pair.

---

### 2. Session

**EN:** A session is the stored record that a particular user is currently logged in, which lets the app remember them across page loads.

**In my own words:** A session is the note that says a user is signed in. On login an
object (`userId`, `email`, `loginAt`) is written to `crm_session`. That is why a page
reload does not force you to log in again. Logout removes only this key — registered
users and client data survive.

**ქართულად:** სესია არის „აღნიშვნა“ იმისა, რომ მომხმარებელი შესულია. ლოგინის დროს
`crm_session`-ში იწერება ობიექტი (`userId`, `email`, `loginAt`). სწორედ ამიტომ
გვერდის გადატვირთვის შემდეგ თავიდან ლოგინი აღარ სჭირდება. Logout-ზე მხოლოდ ეს
გასაღები იშლება — რეგისტრირებული მომხმარებლები და კლიენტები რჩება.

**Where it is used:** `js/guard.js` → `getCurrentSession()`; written in `js/auth.js`.

---

### 3. Validation

**EN:** Validation is checking that user input meets the required rules before the application accepts and stores it.

**In my own words:** Validation means inspecting what the user typed before saving it.
A name must be at least 3 characters, an email must have a valid shape, and a deal
value must be a positive number. If a rule is broken the form is not submitted and a
red error appears under the field.

**ქართულად:** ვალიდაცია ნიშნავს მომხმარებლის შეყვანილი მონაცემის შემოწმებას მის
შენახვამდე. მაგალითად, სახელი უნდა იყოს მინიმუმ 3 სიმბოლო, email-ს უნდა ჰქონდეს
სწორი ფორმა, deal value კი დადებითი რიცხვი. თუ წესი დაირღვა, ფორმა არ იგზავნება
და ველის ქვეშ წითელი შეცდომა ჩნდება.

**Where it is used:** `js/clients.js` → `validateAddClientFields()`;
`js/auth.js` → `validateSignupFields()`.

---

### 4. Fetch

**EN:** `fetch()` is the browser function that sends an HTTP request to a server and returns a Promise that resolves with the response.

**In my own words:** `fetch` is how I ask a server for data or send data to it. It does
not return the result immediately — it returns a Promise, so I use `await` to wait for
the response. `fetch` is what loads my initial 30 clients.

**ქართულად:** `fetch` არის ბრაუზერის ფუნქცია, რომლითაც სერვერს ვთხოვ მონაცემს ან
ვუგზავნი მას. ის მაშინვე არ აბრუნებს შედეგს, არამედ Promise-ს, ამიტომ `await`-ით
ველოდები პასუხს. სწორედ `fetch`-ით ჩამომაქვს საწყისი 30 კლიენტი.

**Where it is used:** `js/data.js` → `loadClients()`, `createClientOnApi()`,
`deleteClientOnApi()`.

---

### 5. Endpoint

**EN:** An endpoint is a specific URL on a server that accepts requests and performs one particular operation.

**In my own words:** An endpoint is one specific server address that does one specific
job. I use three: `/users?limit=30` to load clients, `/users/add` to create one, and
`/users/{id}` to delete one.

**ქართულად:** endpoint არის სერვერის კონკრეტული მისამართი, რომელიც ერთ კონკრეტულ
საქმეს აკეთებს. ჩემს პროექტში სამი endpoint-ს ვიყენებ: `/users?limit=30`
კლიენტების წამოსაღებად, `/users/add` დასამატებლად და `/users/{id}` წასაშლელად.

**Where it is used:** `js/data.js` → `API_BASE_URL` and the addresses built from it.

---

### 6. Request method

**EN:** The request method (GET, POST, PUT, DELETE) tells the server what kind of action the client wants to perform on a resource.

**In my own words:** It is the verb that tells the server what I want done. `GET` means
give me data, `POST` means create something new, `DELETE` means remove it. The same
address behaves differently depending on the method.

**ქართულად:** ეს არის „ზმნა“, რომელიც სერვერს ეუბნება, რა მინდა რომ გააკეთოს.
`GET` — მომეცი მონაცემი, `POST` — შექმენი ახალი, `DELETE` — წაშალე. ერთი და იგივე
მისამართი სხვადასხვა მეთოდით სხვადასხვა შედეგს იძლევა.

**Where it is used:** `js/data.js` — `GET` on load, `POST` on add
(`method: "POST"`), `DELETE` on removal (`method: "DELETE"`).

---

### 7. JSON

**EN:** JSON (JavaScript Object Notation) is a text format for representing structured data, used both for API communication and for storing values in localStorage.

**In my own words:** JSON is a text format for writing down data. `localStorage` can
only hold text, so I convert objects and arrays to text with `JSON.stringify()` when
saving and back into objects with `JSON.parse()` when reading. The API's response
arrives in the same format.

**ქართულად:** JSON არის მონაცემის ჩაწერის ტექსტური ფორმატი. `localStorage` მხოლოდ
ტექსტს ინახავს, ამიტომ ობიექტს/მასივს `JSON.stringify()`-ით ტექსტად ვაქცევ
შენახვისას და `JSON.parse()`-ით უკან ობიექტად წაკითხვისას. იგივე ფორმატით
მოდის API-ს პასუხიც.

**Where it is used:** `js/storage.js` → `getStorage()` and `setStorage()`.

---

### 8. State

**EN:** State is the data an application currently holds in memory, from which the interface is rendered.

**In my own words:** State is the app's current data in memory — in my case the
`allClientsList` array. Every action follows the same cycle: state changes → it is
saved to `localStorage` → the screen is redrawn. The screen is never changed directly;
the data changes first.

**ქართულად:** state არის აპლიკაციის მიმდინარე მონაცემი ოპერატიულ მეხსიერებაში —
ჩემს შემთხვევაში `allClientsList` მასივი. ყველა მოქმედება ერთსა და იმავე ციკლს
გადის: state იცვლება → ინახება `localStorage`-ში → ეკრანი თავიდან იხატება.
ეკრანი პირდაპირ არასდროს იცვლება — ჯერ მონაცემი იცვლება.

**Where it is used:** `js/clients.js` → `allClientsList`, followed by `saveClients()`
and `renderClientCards()` after every action.

---

### 9. Event listener

**EN:** An event listener is a function registered to run whenever a specific event, such as a click or form submit, happens on an element.

**In my own words:** It is a function that listens for a particular event and runs when
it happens. I use `submit`, `click` and `change`. Because cards are created
dynamically, I do not attach a listener to each one — a single listener sits on the
container and `data-client-id` tells me which client was acted on. This is called event
delegation.

**ქართულად:** ეს არის ფუნქცია, რომელიც „უსმენს“ კონკრეტულ მოვლენას და მისი
დადგომისას ეშვება. ვიყენებ `submit`, `click` და `change` მოვლენებს. ბარათები
დინამიურად იქმნება, ამიტომ თითოეულს ცალკე listener-ს არ ვაბამ — ერთი listener
დგას კონტეინერზე და `data-client-id`-ით ვიგებ, რომელ კლიენტზეა საუბარი
(ე.წ. event delegation).

**Where it is used:** `js/clients.js` → `setupClientCardActions()`.

---

### 10. Deployment

**EN:** Deployment is the process of publishing an application to a hosting service so that it is reachable on the public internet.

**In my own words:** Deployment means publishing the project online so anyone can reach
it. Mine is on Vercel, connected to the `main` branch on GitHub, so every push
automatically publishes a new version. Because there is no `index.html` at the root,
`vercel.json` redirects `/` to `/html/index.html`.

**ქართულად:** დეპლოი ნიშნავს პროექტის ინტერნეტში გამოქვეყნებას, რომ ის ყველასთვის
ხელმისაწვდომი იყოს. ჩემი პროექტი Vercel-ზეა და GitHub-ის `main` ბრენჩს უკავშირდება:
ყოველი push ავტომატურად ახალ ვერსიას ატვირთავს. რადგან root-ში `index.html` არ
მაქვს, `vercel.json`-ით `/` გადამისამართებულია `/html/index.html`-ზე.

**Where it is used:** `vercel.json` in the project root; the live link is in the README.

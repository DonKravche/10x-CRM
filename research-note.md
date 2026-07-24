# Research Note — DummyJSON's "simulated" write operations

## Source

**DummyJSON — Users Docs**
https://dummyjson.com/docs/users

## Search keywords I used

- `dummyjson add user does not persist`
- `dummyjson POST /users/add returns same id`
- `dummyjson simulated update delete`
- `why does dummyjson delete return 404`

## Why I needed it

I added two clients through the form, and deleting one also removed the other. At
first I assumed my `filter` logic was wrong, so before touching my own code I read the
API documentation to find out what `POST /users/add` actually returns.

## Summary (English)

DummyJSON is a free test REST API that works without registration or an API key and
returns realistic sample data. The documentation states explicitly that write
operations — `POST`, `PUT`/`PATCH` and `DELETE` — are only **simulated**: the server
accepts the request, validates it, and returns a completely correct response with
status `200`, but nothing in the database actually changes. This means a newly added
record no longer exists on the next request, and the `id` the server returns is the
same every time — it is simply the count of existing users plus one, rather than a
genuinely stored new record. That is precisely why `DELETE /users/{id}` returns 404 for
a client I added myself: the server never stored it. This behaviour is ideal for a
learning project, because I still practise the full HTTP communication cycle while
`localStorage` does the real persistence.

## რეზიუმე (ქართულად)

DummyJSON არის უფასო სატესტო REST API, რომელიც რეგისტრაციისა და API key-ის გარეშე
მუშაობს და რეალისტურ სატესტო მონაცემს აბრუნებს. დოკუმენტაციაში ცალკე არის
ხაზგასმული, რომ ჩაწერის ოპერაციები — `POST`, `PUT`/`PATCH` და `DELETE` — მხოლოდ
**იმიტირებულია** (simulated): სერვერი იღებს მოთხოვნას, ამოწმებს მას და აბრუნებს
სრულიად კორექტულ პასუხს სტატუსით `200`, მაგრამ ბაზაში სინამდვილეში არაფერს ცვლის.
ეს ნიშნავს, რომ დამატებული ჩანაწერი შემდეგ მოთხოვნაზე უკვე აღარ არსებობს, ხოლო
`id`, რომელსაც სერვერი აბრუნებს, ყოველ ჯერზე ერთი და იგივეა — ის უბრალოდ არსებული
მომხმარებლების რაოდენობას + 1-ს უტოლდება და არა რეალურად შენახულ ახალ ჩანაწერს.
ზუსტად ამიტომ აბრუნებს `DELETE /users/{id}` 404-ს იმ კლიენტზე, რომელიც მე თვითონ
დავამატე — სერვერს ის არასდროს შეუნახავს. ასეთი ქცევა სასწავლო პროექტისთვის
იდეალურია, რადგან სრულ HTTP კომუნიკაციას ვსწავლობ, რეალურ დამახსოვრებას კი
`localStorage` აკეთებს.

## How I applied it in the project

This explained the real cause of the bug: in `clients.js` I had written
`id: apiResponse.id` directly, so **every client added through the form received the
same `id` (`209`)**. Deletion filters by `id`, so removing one deleted every client
sharing that id.

The fix was `generateUniqueClientId()`: the server's `id` is used when it is genuinely
unique (as the PRD requires), and otherwise a unique `Date.now()`-based id is assigned.

The same source also explained why a 404 on `DELETE` is **expected** rather than an
error — which is why `deleteClientOnApi()` only logs it with `console.warn` and still
removes the client from local state.

## What I learned

Before hunting for a bug in your own code, make sure you know what the external API
actually returns. I was looking for a logic error where none existed — the cause was
documented behaviour of the API itself.

---

## Additional source consulted

**MDN — `HTMLInputElement.setSelectionRange()`**
https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/setSelectionRange

**Search keywords:** `setSelectionRange throws email input`,
`InvalidStateError input type email selectionStart null`

I needed this while restricting the email and password fields to Latin characters.
To strip a Georgian character as it is typed I have to rewrite `input.value`, but that
jumps the cursor to the end of the field, so I wanted to restore the caret with
`setSelectionRange()`.

MDN documents that this method — and the `selectionStart` property — are only supported
on inputs of type `text`, `search`, `url`, `tel` and `password`. On `email` and `number`
inputs `selectionStart` reads as `null` and calling `setSelectionRange()` throws an
`InvalidStateError`. Since three of my restricted fields (`login-email`,
`signup-email`, `profile-email`) are `type="email"`, calling it blindly would have
crashed the page on every keystroke.

**რეზიუმე (ქართულად):** MDN-ის დოკუმენტაციით `setSelectionRange()` და
`selectionStart` მუშაობს მხოლოდ `text`, `search`, `url`, `tel` და `password` ტიპის
ველებზე. `email` და `number` ტიპებზე `selectionStart` `null`-ს აბრუნებს, ხოლო
`setSelectionRange()` შეცდომას (`InvalidStateError`) აგდებს. რადგან ჩემი სამი
შეზღუდული ველი `type="email"`-ია, ამ მეთოდის პირდაპირ გამოძახება ყოველ კლავიშზე
გვერდს ჩამოაგდებდა.

**How I applied it:** the caret is restored only when the field supports it:

```js
const caretPositionBeforeStrip = inputElement.selectionStart;
inputElement.value = latinOnlyValue;

if (caretPositionBeforeStrip !== null) {
    inputElement.setSelectionRange(restoredCaretPosition, restoredCaretPosition);
}
```

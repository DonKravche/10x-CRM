# AI Usage Log — 10X CRM

This file documents how I used AI while building this project: what I asked
word-for-word, what came back, what I kept, what I rewrote, and what I rejected.

**Tool used:** Claude (Claude Code, inside the VS Code extension)

---

## Entry 1 — Diagnosing the deployment failure (vague prompt)

**Task:** I deployed the project to Netlify and the app stopped working — toasts
never appeared, signing up wrote nothing to `localStorage`, and redirects did not fire.

**Prompt (verbatim):**

> what i need to deploy this on vercell waht should i choose as an options?
> i deployed this project into netlify and function of redirection toast massages
> and storing sing uped user into localstorage and others not working properly

**Outcome: partially used.**
The AI correctly identified the underlying cause: my files live in three sibling
folders (`html/`, `js/`, `css/`), there is no `index.html` at the repository root,
and every page loads its scripts with `../js/`, which climbs out of `html/`. A
static host serves everything from a single publish root, so those paths can break.
The real problem was therefore never `localStorage` — my JavaScript files were
returning 404 and never executing at all.

However, the AI's specific hypothesis — that I had set Netlify's publish directory
to `html/` — was **an unverified assumption**. I did not accept the answer wholesale,
and asked a more precise question next (see Entry 2).

**What I learned:**
- When "nothing works" after a deploy, the scripts are almost always failing to load.
  The first step is DevTools → Console/Network to look for 404s, not changing code.
- `localStorage` is bound to an origin, so `file://` and the deployed domain have
  completely separate stores. Local data does not travel to the deployed site — that
  is expected behaviour, not a bug.
- A vague prompt ("others not working properly") produces a vague answer.

---

## Entry 2 — Same problem, refined prompt (prompt refinement)

**Task:** After the first answer I deployed to Vercel and got a precise error. This
time, instead of describing the symptom loosely, I supplied the **exact error code
and the live URL**.

**Prompt (verbatim):**

> 404: NOT_FOUND
> Code: NOT_FOUND
> ID: fra1::5tm6s-1784820732732-87ebab452b8f
> https://10x-crm-ashy.vercel.app/

**Outcome: fully used.**
This time the AI stopped guessing and actually probed my live site, returning evidence:

| URL | Result |
|---|---|
| `/html/index.html` | ✅ served the real login page |
| `/js/storage.js` | ✅ served the real JavaScript source |
| `/` (root) | ❌ 404 |

So the deployment structure was completely fine, and **the hypothesis from Entry 1
(publish directory set to `html/`) was proven wrong.** The only actual problem was
that no `index.html` exists at the root, so `/` needed a redirect. We created
`vercel.json`, but I had not committed it — which is exactly why the 404 persisted.

**What I learned:**
- **The effect of refining a prompt:** "it doesn't work" → an exact error code plus a
  URL. The second version produced a precise diagnosis; the first only gave a direction.
- **Critically evaluating the AI's answer:** the first explanation sounded convincing
  but was an assumption, and real evidence partially disproved it. A confident
  explanation is not the same as a correct one.
- I needed a 302 redirect rather than a 200 rewrite: with a rewrite the URL stays at
  `/`, so relative links like `signup.html` and `../js/` would break all over again.

---

## Entry 3 — Bug: deleting one client deleted two

**Task:** I added two clients with the same name and phone number but different
email addresses. Deleting one made the other disappear too.

**Prompt (verbatim):**

> we have one more little problem when i add two diff user which phone numbers
> will be same for example two identical name surname and phone number user which
> have two company but in diff emails. when i delete one of them second one also
> delating

**Outcome: fully used** (though the real cause was completely different from what I assumed).
I thought the matching phone number or name was causing it. The actual cause was the
`id`. DummyJSON's `POST /users/add` never persists anything and **returns the same
`id` on every single add** (`209`). In `clients.js` I was writing `id: apiResponse.id`
directly, so every client added through the form shared one identical `id`. Deletion
filters by `id`:

```js
allClientsList = allClientsList.filter(
    existingClient => String(existingClient.id) !== String(clientId)
);
```

Deleting one `209` removed every client with `209`.

The fix was `generateUniqueClientId()`: the API's `id` is used when it is genuinely
unique (as the PRD asks), and otherwise a unique `Date.now()`-based id is assigned.

**What I learned:**
- The symptom is not the cause. The matching phone number was a coincidence; the bug
  affected *any* two clients added through the form.
- DummyJSON's `POST`/`DELETE` are only **simulated** — they return a correct response
  but change nothing in the database. That is also why `DELETE` returns 404 for a
  client I added myself.
- Following the PRD's instruction literally ("use the response's `id`") produced a bug.
  A specification also has to be understood, not just copied.

---

## Entry 4 — Phone validation and a codebase audit (constraining the AI)

**Task:** Letters could be typed into the phone field. I also wanted the whole
codebase checked for missing validation.

**Prompt (verbatim):**

> also phone number need validation i can input strings inside also your goal is
> to check codbase and add validations to it if it necessary

**Outcome: rewritten / deliberately constrained.**
The audit showed that **every** validation required by the PRD was already implemented
with the exact error texts (signup, login, add client, profile, change password), and
Deal Value already rejected non-numeric input. Phone was the only genuine gap.

Here the AI **correctly warned me** that the PRD only requires "at least 6 characters"
for phone, so adding a format check is a deviation from the specification. I chose the
lenient option: digits plus real phone punctuation (`+ - ( )` and spaces), requiring at
least 6 digits. `"abcdef"` is now rejected, while `"+992 914 245 8788"` is accepted.

**Rejected:** the strict "digits only" option — it would have blocked `(555) 123-4567`
and would not even match the phone format returned by the API itself.

**What I learned:**
- `type="tel"` does **not** block letters; it only changes the keyboard on mobile.
  Validation must live in JavaScript.
- "Add validations" is a vague instruction. Comparing against the specification showed
  almost everything already existed, and adding more would have broken the PRD scope.
- When the AI proposes deviating from the specification, the decision is mine and I
  must be able to justify it.

---

## Entry 5 — Atomic commits (controlling the AI's process)

**Task:** Both fixes (the unique `id` and the phone validation) were in the same file.
The exam grades commit history, so I did not want one large commit.

**Prompt (verbatim):**

> make two commit and push

**Outcome: fully used.**
Because both changes sat in one file, the sequence was: temporarily revert the phone
block to its old version → commit the `id` fix → restore the phone validation → commit
it separately. The result was two clear commits:

```
8c58262  fix(clients): assign a unique id to each added client
155bc03  fix(clients): reject non-numeric phone input on add-client form
```

It also turned out that the remote had commits I did not have locally, so the push was
rejected and a `rebase` was required.

**What I learned:**
- Changes in a single file can still be split into two commits by reverting and
  restoring them in sequence.
- `! [rejected] main -> main (fetch first)` means the remote is ahead; `git fetch`
  plus `rebase` replays my commit on top of the remote's work.
- A good commit message explains **why**, not just **what** changed.

---

## Summary

| # | Topic | Outcome |
|---|---|---|
| 1 | Deployment diagnosis (vague prompt) | Partially used |
| 2 | Same problem, refined prompt | Fully used |
| 3 | Delete bug — duplicated `id` | Fully used |
| 4 | Phone validation + audit | Rewritten / constrained |
| 5 | Atomic commits | Fully used |

**Main conclusion:** AI works best when you give it precise data (an error message, a
URL, a file name) and when you verify its answer against evidence. Entry 2 is exactly
that lesson: a convincing but unverified hypothesis was disproven by an actual check.

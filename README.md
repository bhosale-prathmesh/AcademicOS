# AcademicOS

A lightweight academic dashboard for students and teachers. Track personal tasks, join class groups, submit and review assignments, and get an AI suggestion for **what to work on next**.

Built with plain HTML, CSS and JavaScript (ES modules), **Firebase** (Auth + Firestore) and an optional local **Ollama** model. There is no build step and no bundler.

---

## Features

### Accounts
- Sign in with Google (`Continue with Google`); first sign-in creates a profile.
- Profile fields: full name, age, college, branch, academic year.
- Profile page and log out from Settings.
- Pages redirect to the account page when no one is signed in.

### Home dashboard
- **Activity heatmap** of completed tasks by day.
- **Recent completions** from the last 3 days.
- **Your groups**, with a form to create a new group.
- **"What to do next"** panel (AI, see below).

### Personal tasks (Progress page)
- Add tasks with title, subject, priority (low / medium / high) and due date.
- Change status: pending, in progress, completed.
- Overdue tasks are flagged; completed tasks sink to the bottom.
- Two-click delete (first click arms, second click deletes).

### Groups and assignments
- Anyone can create a group and becomes its **admin**.
- Others join with a **Group ID** and become **students**.
- Admins and teachers create assignments (title, instructions, deadline).
- Students update their progress and submit written work.
- Staff review each submission as `accepted` or `needs revision`, with feedback.
- Staff get a per-student progress overview.

### AI: "What to do next"
The home page picks the single best task to work on next, from your open personal tasks **and** open assignments in groups where you are a student.

1. If **Ollama** is running locally, the model chooses a task and gives a one-line reason.
2. If not, a **rule-based fallback** is used:
   - overdue tasks first,
   - then nearest deadline (1 / 3 / 7 day boosts),
   - then priority (high > medium > low),
   - then tasks already in progress.

The panel shows which source was used (`AI · <model>` or `Rule-based fallback`) and, when AI was skipped, a hint explaining why.

---

## Project structure

```
AcademicOS/
├── index.html              App shell: bottom navigation + iframe
├── firestore.rules         Firestore security rules
├── core/
│   └── firebase-config.js  Firebase init (app, auth, db, realtimeDB)
├── css/                    Shared styles (common.css, auth.css)
├── dynamic/                Pages loaded inside the shell
│   ├── home.html           Dashboard + AI panel
│   ├── groups.html         My groups / join a group
│   ├── navigation.js       Route table and URL helpers
│   └── pageLoader.js       Nav buttons -> iframe loader
├── main/                   Full pages
│   ├── account.html        Sign in / create account
│   ├── profile.html        View and edit profile
│   ├── progress.html       Personal tasks + group progress
│   ├── group.html          One group: assignments, submissions, reviews
│   └── settings.html       Settings and log out
├── engine/                 Data layer (Firestore reads/writes)
│   ├── dataEngine.js       Date and status helpers, role helpers
│   ├── taskEngine.js       Personal task CRUD
│   ├── groupEngine.js      Create / join / list groups
│   ├── progressEngine.js   Group tasks, progress, submissions, reviews
│   ├── activityengine.js   Completed-task events for the heatmap
│   └── uiEngine.js         Toast messages
└── AIservice/              AI recommendation
    ├── ollamaClient.js     Talks to Ollama, picks a model
    ├── promptBuilder.js    Builds the prioritization prompt
    ├── responseParser.js   Safely parses the model's JSON answer
    ├── priorityEngine.js   AI + rule-based fallback
    └── workengine.js       Collects all open work for the AI
```

---

## Getting started

### Requirements
- A modern browser
- A [Firebase](https://console.firebase.google.com) project
- A local static server (browsers block ES module imports from `file://`)
- Optional: [Ollama](https://ollama.com) for the AI mode

### 1. Firebase setup
1. Create a Firebase project and add a **Web app**.
2. Copy its config into `core/firebase-config.js`.
3. In **Authentication > Sign-in method**, enable **Google**.
4. In **Authentication > Settings > Authorized domains**, add every domain you serve from (`localhost` is included by default).
5. Create a **Firestore** database.
6. Publish the rules from `firestore.rules` (Firestore > Rules, or with the Firebase CLI: `firebase deploy --only firestore:rules`).

### 2. Run locally
From the project folder, start any static server, for example:

```bash
# Python
python -m http.server 5500

# or Node
npx serve -l 5500
```

Then open `http://localhost:5500/` (VS Code **Live Server** also works).

### 3. Enable the AI (optional)
```bash
ollama serve
ollama pull qwen2.5:3b
```

Reload the home page. The panel should read `AI · qwen2.5:3b`. The first request can take 10 to 30 seconds while the model loads; the rule-based pick is shown meanwhile and **Refresh recommendation** will use the AI once it is ready.

**Model selection:** the app uses the first installed chat model from this preference list: `qwen2.5`, `llama3`, `mistral`, `gemma`, `phi3`, `phi4`, `qwen3`, `deepseek`. Any other installed chat model is a fallback. Embedding models are ignored.

**Ollama address:** `http://127.0.0.1:11434` (set in `AIservice/ollamaClient.js`).

---

## Troubleshooting the AI panel

| Panel says | Meaning | Fix |
| --- | --- | --- |
| Ollama is not reachable | Ollama is stopped, or the browser blocked the request | Run `ollama serve`. Open the app via `http://localhost`, not `file://`. If the site is hosted online, set `OLLAMA_ORIGINS` (below). |
| Ollama has no chat model | Ollama runs but nothing usable is installed | `ollama pull qwen2.5:3b` |
| Ollama took too long | Model still loading | Wait, then press **Refresh recommendation** |
| Unusable answer / request failed | Model replied badly or errored | Rule-based pick is shown; try a larger model |

If the app is served from a hosted `https` origin, tell Ollama to accept it:

```bash
# Linux / macOS
OLLAMA_ORIGINS=https://your-site.com ollama serve

# Windows (PowerShell), then restart Ollama
setx OLLAMA_ORIGINS "https://your-site.com"
```

Note that the code calls `127.0.0.1`, so Ollama must run on the **same computer as the browser**. A hosted copy of the app cannot reach a visitor's Ollama unless they run it themselves.

---

## Data model (Firestore)

```
users/{uid}                                  profile
users/{uid}/personalTasks/{taskId}           personal tasks
users/{uid}/joinedGroups/{groupId}           groups the user joined
groups/{groupId}                             name, description, createdBy
groups/{groupId}/members/{uid}               role: admin | teacher | student
groups/{groupId}/tasks/{taskId}              assignments
groups/{groupId}/tasks/{taskId}/progress/{studentId}      student status
groups/{groupId}/tasks/{taskId}/submissions/{studentId}   work + review
```

### Roles

| Role | How you get it | Can do |
| --- | --- | --- |
| admin | Creating a group | Everything staff can, plus change roles |
| teacher | Set by an admin | Create assignments, review submissions, see student progress |
| student | Joining with a Group ID | Update own progress, submit work |

### Security rules summary
- Profile and personal tasks are readable and writable only by their owner.
- Group data is readable only by members of that group.
- Only group staff (admin / teacher) create or edit assignments.
- Submissions are visible only to the student who wrote them and to staff.

---

## Known limitations
- `dynamic/setting.html` and `dynamic/tasks.html` are empty placeholders and are not linked from the navigation.
- Settings has no preferences yet (profile link, home link, log out).
- There is no UI to promote a member to teacher; roles can only be changed by editing the member document as a group admin.
- Groups are joined by raw Group ID; there are no invite links.
- AI only supports one task: next-task recommendation.

## Notes for contributors
- File names are **case-sensitive on Linux hosts** (Firebase Hosting, Netlify, GitHub Pages). Keep import paths identical in case to the real file name, for example `engine/activityengine.js`.
- Firebase web config values are not secrets, but access is protected only by `firestore.rules`, so review them before every deploy.

## Tech stack
HTML / CSS / vanilla JavaScript (ES modules) · Firebase Auth · Cloud Firestore (SDK 11.0.2 via CDN) · Ollama (optional)

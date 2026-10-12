# Sync tests

Checks for cloud sync (`src/Data/cloudSync.js`) and `firestore.rules`, run
against the Firebase emulators — no real project or data is touched.

```sh
cd scripts/sync-tests
npm install                      # needs Java 11+ for the Firestore emulator
npm run emulators                # terminal 1: Firestore :8080, Auth :9099

# terminal 2, from the repo root: the app, wired to the emulators
VITE_USE_EMULATORS=1 VITE_FIREBASE_API_KEY=fake VITE_FIREBASE_PROJECTID=demo-test \
VITE_FIREBASE_AUTHDOMAIN=localhost VITE_FIREBASE_APPID=1:1:web:1 npx vite --port 5174

# terminal 3
npm run test:rules               # the rules on their own
npm run test:e2e                 # two browsers syncing one account
```

`test:e2e` seeds an account the way accounts looked before notes moved out of
the main document, then checks that the main document's old copies are never
written, that notes and other keys land in their own documents, that a second
device sees old and new data combined, and that edits made on two devices at
once are merged (or, on the same line, kept in history).

Restart the dev server after editing `cloudSync.js`: a hot-reloaded module and
the copy the test imports are different instances.

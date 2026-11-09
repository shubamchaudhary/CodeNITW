// Firestore on demand. The SDK is fetched the first time something needs it:
// sync starting for a signed-in account, a note's history, a screenshot. A
// guest never downloads it, and a signed-in visit renders from the local
// store while it loads. A failed fetch (offline) can be retried.
let loading = null;

export function loadFirestore() {
  loading ??= import("./firestoreClient.js").catch((err) => {
    loading = null;
    throw err;
  });
  return loading;
}

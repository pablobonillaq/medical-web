# 0003. Redux Toolkit: thunks for requests, sagas for long-running flows

- **Status:** accepted
- **Date:** 2026-11-11

## Context

The client state includes the session, catalogs, the booking flow and a real-time chat. Using thunks and sagas together only makes sense if each one has a clear job.

## Decision

Use **Redux Toolkit** (which includes the thunk middleware) and add the **redux-saga** middleware:

- **Thunks** (`createAsyncThunk`) for request–response work: catalogs of services and doctors, the profile, one-off mutations.
- **Sagas** for flows that live longer than one request or react to events: the Socket.IO chat channel turned into actions, signing out when the session expires, patient search with debounce and cancellation, and booking with a retry when the slot was just taken.

## Consequences

- Each tool does what it is best at, and the reason is easy to explain.
- Redux lives only in Client Components. Data loaded on the server reaches the client as props, not through the store.
- The store is created per request, never shared between users on the server.
- Sagas are tested with redux-saga-test-plan; thunks with the store and MSW.

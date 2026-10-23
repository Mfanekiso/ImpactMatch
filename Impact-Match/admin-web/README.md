# Admin Console (web)

React + Vite admin panel for the sponsor platform. Uses the **same Firebase project** as the mobile app.

## Run it

```bash
npm install
cp .env.example .env     # then fill in your Firebase web config
npm run dev
```

Firebase config: Firebase console -> Project settings -> Your apps -> Web app -> SDK config.
If you only have the mobile app registered, click "Add app" -> Web.

## One-time Firebase setup

1. **Authentication**: enable the Email/Password provider.
2. **Make yourself an admin**: sign up/create your user in Authentication, then in Firestore
   create `users/<your-uid>` with a string field `role` = `admin`.
   (Find your UID under Authentication -> Users.)
3. **Rules**: paste `firestore.rules` into Firestore -> Rules and publish. This is what actually
   protects your data. The login check in the app is only for a clean experience.

## Data it expects

`sponsors/{id}`: `name`, `type`, `location`, `causes` (array of strings), `description`,
`website`, `fundingDeployed` (number), `status` (`pending` | `approved` | `rejected`).

`users/{uid}`: `role` (`admin` | `sponsor` | `student`), plus optional `name`, `email`.

Sponsors created in the web admin get `createdAt` / `updatedAt` timestamps automatically.

## Deploy (Firebase Hosting)

```bash
npm install -g firebase-tools
firebase login
firebase init hosting      # public dir: dist, single-page app: yes
npm run build
firebase deploy --only hosting
```

`firebase.json` is already set up with the SPA rewrite.

## Structure

```
src/
  firebase.js           Firebase init (reads .env)
  context/AuthContext   login state + admin role check
  services/             Firestore reads/writes (sponsors, users)
  components/           Layout, ProtectedRoute, StatCard, StatusBadge
  pages/                Login, Dashboard, Sponsors, SponsorForm, Users
```

# Ghost-Proof

Ghost-Proof is a production-oriented MERN project for proctoring and interview monitoring. This setup phase includes only the project foundation: a `client` app for the frontend and a `server` app for the backend.

## Folder structure

```text
ghost-proof/
├── client/
│   ├── app/                  # Next.js App Router pages and layouts
│   ├── components/           # Reusable frontend components
│   ├── lib/                  # Frontend utilities and future API helpers
│   ├── public/               # Static assets
│   ├── package.json
│   └── tailwind.config.ts
├── server/
│   ├── src/
│   │   ├── config/           # Env loading and MongoDB connection
│   │   ├── controllers/      # Request handlers
│   │   ├── middlewares/      # Express middlewares
│   │   ├── models/           # Mongoose models
│   │   ├── routes/           # API routes
│   │   ├── services/         # Business logic layer
│   │   ├── sockets/          # Socket.io setup
│   │   ├── utils/            # Shared backend helpers
│   │   ├── app.ts            # Express app configuration
│   │   └── server.ts         # Server bootstrap
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── docs/
├── package.json              # Root workspace scripts
└── tsconfig.base.json        # Shared TypeScript defaults
```

## Why this structure

- `client` and `server` are separated so the frontend and backend can evolve independently.
- The backend is already organized by responsibility, which keeps the codebase scalable.
- Root workspaces make installation and local development simpler because both apps can be managed from one place.
- Shared TypeScript settings reduce config drift between the two applications.

## Backend setup

- Express is initialized in `server/src/app.ts`.
- MongoDB connection is handled in `server/src/config/db.ts`.
- The server bootstraps from `server/src/server.ts`.
- Environment variables are defined in `server/.env.example`.

## Frontend setup

- Next.js App Router lives in `client/app`.
- Tailwind CSS is configured and ready.
- A simple responsive page is included so the setup is easy to verify.

## How to run

1. Run `npm install` from the project root.
2. Copy `server/.env.example` to `server/.env`.
3. Make sure MongoDB is running locally.
4. Configure SMTP values in `server/.env` for OTP email delivery.
5. Start both apps with `npm run dev`.

You can also run them separately:

1. `npm run dev:client`
2. `npm run dev:server`

## OTP email setup

Ghost-Proof now sends password reset OTP codes through SMTP. You can use Gmail app passwords, Mailtrap, Resend SMTP, SendGrid SMTP, or another SMTP-compatible provider.

Required server environment variables:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`

## How to test

1. Open `http://localhost:3000` and confirm the client page loads.
2. Open `http://localhost:5000/api/health` and confirm the server returns JSON.
3. Check the server terminal and confirm MongoDB connects before the server starts listening.

## Not included yet

- Authentication flows
- Monaco editor
- Business logic
- Tracking or scoring logic
- Dashboard features

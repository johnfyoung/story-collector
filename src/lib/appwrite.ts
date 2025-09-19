// import { Account, Client, ID, type Models } from 'appwrite'

// export const APPWRITE_ENDPOINT: string = import.meta.env.VITE_APPWRITE_ENDPOINT as string
// export const APPWRITE_PROJECT_ID: string = import.meta.env.VITE_APPWRITE_PROJECT as string

// if (!APPWRITE_ENDPOINT || !APPWRITE_PROJECT_ID) {
//   // Fail fast to avoid confusing cross-project sessions.
//   throw new Error('Appwrite not configured. Set VITE_APPWRITE_ENDPOINT and VITE_APPWRITE_PROJECT in .env.local')
// }

// export const client = new Client()
//   .setEndpoint(APPWRITE_ENDPOINT)
//   .setProject(APPWRITE_PROJECT_ID)

// export const account = new Account(client)
// export { ID }
// export type AppwriteUser = Models.User<Models.Preferences>

import { Client, Account, Databases, ID, type Models } from "appwrite";

export const APPWRITE_ENDPOINT: string = import.meta.env
  .VITE_APPWRITE_ENDPOINT as string;
export const APPWRITE_PROJECT_ID: string = import.meta.env
  .VITE_APPWRITE_PROJECT_ID as string;

const client = new Client()
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

const account = new Account(client);
const databases = new Databases(client);

export type AppwriteUser = Models.User<Models.Preferences>;

export { client, account, databases, ID };

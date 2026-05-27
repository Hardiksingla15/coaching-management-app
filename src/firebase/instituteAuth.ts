import { initializeApp, getApps, getApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  getAuth,
} from "firebase/auth";

import { firebaseConfig } from "./config";

const SECONDARY_APP_NAME = "CoachingAppInstituteCreator";

function getSecondaryApp() {
  const existing = getApps().find((app) => app.name === SECONDARY_APP_NAME);
  if (existing) {
    return existing;
  }

  return initializeApp(firebaseConfig, SECONDARY_APP_NAME);
}

/** Creates an auth account without switching the owner's current session. */
export async function createInstituteAuthAccount(
  mobile: string,
  password: string
) {
  const secondaryAuth = getAuth(getSecondaryApp());
  const email = `${mobile}@student.com`;

  return createUserWithEmailAndPassword(
    secondaryAuth,
    email,
    password
  );
}

import { getFirebaseAuth, getGoogleAuthProvider } from "./firebase";
import {
  GoogleAuthProvider,
  reauthenticateWithPopup,
  signInWithPopup,
  type UserCredential,
} from "firebase/auth";

type DriveUploadResponse = {
  id: string;
  name: string;
  webViewLink?: string;
  webContentLink?: string;
};

/**
 * Uploads a JSON payload to Google Drive using the authenticated user's account.
 * Returns the Drive file metadata on success.
 */
export async function uploadBackupToDrive(
  filename: string,
  payload: unknown
): Promise<DriveUploadResponse> {
  const accessToken = await getDriveAccessToken();
  const metadata = {
    name: filename,
    mimeType: "application/json",
  };

  const boundary = `----IndexedSpeechBackup${
    crypto.randomUUID?.() ?? Date.now()
  }`;
  const multipartBody =
    `--${boundary}\r\n` +
    "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
    `${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\n` +
    "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
    `${JSON.stringify(payload)}\r\n` +
    `--${boundary}--`;

  const response = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body: multipartBody,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Drive upload failed with status ${response.status}: ${
        errorText || response.statusText
      }`
    );
  }

  return (await response.json()) as DriveUploadResponse;
}

async function getDriveAccessToken(): Promise<string> {
  const auth = getFirebaseAuth();
  const provider = getGoogleAuthProvider();
  const now = Date.now();
  if (cachedDriveToken && cachedDriveTokenExpiry > now) {
    return cachedDriveToken;
  }
  const user = auth.currentUser;
  const result: UserCredential = user
    ? await reauthenticateWithPopup(user, provider)
    : await signInWithPopup(auth, provider);
  const credential = await GoogleAuthProvider.credentialFromResult(result);
  if (!credential?.accessToken) {
    throw new Error("Google credential missing access token.");
  }
  cachedDriveToken = credential.accessToken;
  cachedDriveTokenExpiry = Date.now() + DRIVE_TOKEN_TTL_MS;
  return cachedDriveToken;
}

let cachedDriveToken: string | null = null;
let cachedDriveTokenExpiry = 0;
const DRIVE_TOKEN_TTL_MS = 45 * 60 * 1000; // refresh roughly every 45 minutes

import { generateKeyPairSync } from "crypto";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

/**
 * Generates RSA key pairs for access and refresh tokens and writes them to PEM files
 * in the /keys directory.
 */
function generateKeys() {
  const keyDirectory = join(process.cwd(), "keys");

  // Ensure the /keys directory exists
  if (!existsSync(keyDirectory)) {
    mkdirSync(keyDirectory, { recursive: true });
  }

  // Generate Access Token keys
  const { publicKey: publicAccessKey, privateKey: privateAccessKey } =
    generateKeyPairSync("rsa", {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: "spki",
        format: "pem",
      },
      privateKeyEncoding: {
        type: "pkcs8",
        format: "pem",
      },
    });

  writeFileSync(join(keyDirectory, "OpenIDPrivateAccess.pem"), privateAccessKey);
  writeFileSync(join(keyDirectory, "OpenIDPublicAccess.pem"), publicAccessKey);

  // Generate Refresh Token keys
  const { publicKey: publicRefreshKey, privateKey: privateRefreshKey } =
    generateKeyPairSync("rsa", {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: "spki",
        format: "pem",
      },
      privateKeyEncoding: {
        type: "pkcs8",
        format: "pem",
      },
    });

  writeFileSync(join(keyDirectory, "OpenIDPrivateRefresh.pem"), privateRefreshKey);
  writeFileSync(join(keyDirectory, "OpenIDPublicRefresh.pem"), publicRefreshKey);

  console.log(`Keys generated and saved in the /keys directory`);
}

generateKeys();

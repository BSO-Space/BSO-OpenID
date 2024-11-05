import { generateKeyPairSync } from "crypto";
import { writeFileSync } from "fs";

/**
 * Create RSA key pairs for Access Token and Refresh Token
 * @returns {void}
 */
/**
 * Generates RSA key pairs for access and refresh tokens and writes them to PEM files.
 *
 * This function generates two sets of RSA key pairs:
 * 1. Access Token keys: The public key is saved to `publicAccess.pem` and the private key is saved to `privateAccess.pem`.
 * 2. Refresh Token keys: The public key is saved to `publicRefresh.pem` and the private key is saved to `privateRefresh.pem`.
 *
 * The keys are generated with a modulus length of 2048 bits and are encoded in PEM format.
 *
 * @function generateKeys
 */
function generateKeys() {
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

  writeFileSync("privateAccess.pem", privateAccessKey);
  writeFileSync("publicAccess.pem", publicAccessKey);

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

  writeFileSync("privateRefresh.pem", privateRefreshKey);
  writeFileSync("publicRefresh.pem", publicRefreshKey);
}

generateKeys();

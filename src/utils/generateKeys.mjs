import { generateKeyPairSync } from "crypto";
import { writeFileSync } from "fs";

function generateKeys() {
  const { publicKey, privateKey } = generateKeyPairSync("rsa", {
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

  writeFileSync("private.pem", privateKey);
  writeFileSync("public.pem", publicKey);
  console.log("Keys generated and saved to private.pem and public.pem");
}
generateKeys();

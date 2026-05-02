import crypto from "node:crypto";

const encoding = {
	publicKeyEncoding: { type: "spki", format: "pem" },
	privateKeyEncoding: { type: "pkcs8", format: "pem" }
};

console.log("Copy and paste the following into a .env file:\n");

const signing = crypto.generateKeyPairSync("ed25519", encoding); // for signing only
console.log("NOTIF_SIGN_PRIVATE_KEY=" + JSON.stringify(signing.privateKey));
console.log("NOTIF_SIGN_PUBLIC_KEY=" + JSON.stringify(signing.publicKey));
const encryption = crypto.generateKeyPairSync("x25519", encoding); // for encryption only
console.log("NOTIF_ENC_PRIVATE_KEY=" + JSON.stringify(encryption.privateKey));
console.log("NOTIF_ENC_PUBLIC_KEY=" + JSON.stringify(encryption.publicKey));

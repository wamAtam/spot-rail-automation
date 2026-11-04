
require("dotenv").config();

const { spawnSync } = require("child_process");
const path = require("path");

const required = [
    "PORT",
    "SPOTRAIL_TOKEN",
    "SPOTRAIL_TECHNICIAN",
    "SPOTRAIL_DESCRIPTION",
    "SPOTRAIL_SPECIALITY",
    "SPOTRAIL_PRIORITY"
];

for (const key of required) {
    if (!process.env[key]) {
        throw new Error(
    `Variable ${key} manquante dans la configuration (.env ou environnement système)`
);
    }
}

const collection = path.join(__dirname, "collection.json");
const environment = path.join(__dirname, "environment.json");

const variables = {
    baseUrl: `http://localhost:${process.env.PORT}`,
    SPOTRAIL_TOKEN: process.env.SPOTRAIL_TOKEN,
    nom_technicien: process.env.SPOTRAIL_TECHNICIAN,
    description: process.env.SPOTRAIL_DESCRIPTION,
    speciality: process.env.SPOTRAIL_SPECIALITY,
    priority: process.env.SPOTRAIL_PRIORITY
};

const args = [
    "collection",
    "run",
    collection,
    "-e",
    environment
];

for (const [key, value] of Object.entries(variables)) {
    args.push("--env-var", `${key}=${value}`);
}

console.log("Démarrage des tests SPOT-RAIL avec Postman CLI...");

const result = spawnSync("postman", args, {
    stdio: "inherit",
    shell: process.platform === "win32"
});

if (result.error) {
    console.error("Erreur Postman CLI :", result.error.message);
    process.exit(1);
}

process.exit(result.status ?? 1);

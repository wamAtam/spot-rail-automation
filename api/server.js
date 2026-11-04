require("dotenv").config();

const express = require("express");
const app = express();

app.use(express.json());

// ========================================
// CONFIGURATION
// ========================================

const PORT = process.env.PORT || 3000;
const VALID_TOKEN = process.env.SPOTRAIL_TOKEN;

if (!VALID_TOKEN) {
    throw new Error("SPOTRAIL_TOKEN est obligatoire dans le fichier .env");
}

// ========================================
// AUTHENTIFICATION
// ========================================

function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "Token manquant"
        });
    }

    const token = authHeader.split(" ")[1];

    if (token !== VALID_TOKEN) {
        return res.status(401).json({
            message: "Token invalide"
        });
    }

    next();
}

// ========================================
// STOCKAGE EN MEMOIRE
// ========================================

let workOrders = [];
let nextId = 1;

// ========================================
// 1. CREATION D'UNE INTERVENTION
// ========================================

app.post("/api/workorders", authenticateToken, (req, res) => {
    const { description, speciality, priority } = req.body || {};

    if (
        typeof description !== "string" || !description.trim() ||
        typeof speciality !== "string" || !speciality.trim() ||
        typeof priority !== "string" || !priority.trim()
    ) {
        return res.status(400).json({
            message: "Champs obligatoires manquants ou invalides"
        });
    }

    const id = nextId++;

    const workOrder = {
        id,
        workOrder: `WO-${new Date().getFullYear()}-${String(id).padStart(5, "0")}`,
        description: description.trim(),
        speciality: speciality.trim(),
        priority: priority.trim(),
        status: "NEW",
        technician: null,
        createdDate: new Date().toISOString(),
        history: ["NEW"]
    };

    workOrders.push(workOrder);

    return res.status(201).json(workOrder);
});

// ========================================
// 2. AFFECTATION D'UN TECHNICIEN
// ========================================

app.put("/api/workorders/:id/assign", authenticateToken, (req, res) => {
    const order = workOrders.find(
        item => item.id === Number(req.params.id)
    );

    if (!order) {
        return res.status(404).json({
            message: "Intervention introuvable"
        });
    }

    const { technician } = req.body || {};

    if (
        typeof technician !== "string" ||
        !technician.trim()
    ) {
        return res.status(400).json({
            message: "Technicien obligatoire"
        });
    }

    if (order.status !== "NEW") {
        return res.status(409).json({
            message: "Intervention déjà affectée ou non affectable"
        });
    }

    order.technician = technician.trim();
    order.status = "ASSIGNED";
    order.history.push("ASSIGNED");

    return res.status(200).json(order);
});

// ========================================
// 3. CHANGEMENT DE STATUT
// ========================================

app.put("/api/workorders/:id/status", authenticateToken, (req, res) => {
    const order = workOrders.find(
        item => item.id === Number(req.params.id)
    );

    if (!order) {
        return res.status(404).json({
            message: "Intervention introuvable"
        });
    }

    const { status } = req.body || {};

    const transitions = {
        ASSIGNED: ["IN_PROGRESS"],
        IN_PROGRESS: ["COMPLETED"]
    };

    if (typeof status !== "string" || !status.trim()) {
        return res.status(400).json({
            message: "Nouveau statut obligatoire"
        });
    }

    if (!transitions[order.status]?.includes(status)) {
        return res.status(409).json({
            message: `Transition impossible : ${order.status} vers ${status}`
        });
    }

    order.status = status;
    order.history.push(status);

    return res.status(200).json(order);
});

// ========================================
// 4. CONSULTATION D'UNE INTERVENTION
// ========================================

app.get("/api/workorders/:id", authenticateToken, (req, res) => {
    const order = workOrders.find(
        item => item.id === Number(req.params.id)
    );

    if (!order) {
        return res.status(404).json({
            message: "Intervention introuvable"
        });
    }

    return res.status(200).json(order);
});

// ========================================
// GESTION DES ERREURS JSON
// ========================================

app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
        return res.status(400).json({
            message: "Format JSON invalide"
        });
    }

    return res.status(500).json({
        message: "Erreur interne du serveur"
    });
});

// ========================================
// DEMARRAGE DU SERVEUR
// ========================================

app.listen(PORT, () => {
    console.log(`SPOT RAIL API démarrée sur le port ${PORT}`);
});

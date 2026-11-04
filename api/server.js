
const express = require("express");

const app = express();

app.use(express.json());

// Authentification simulée
const VALID_TOKEN = "spotrail-test-2026";

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

// Stockage temporaire des interventions
let workOrders = [];
let nextId = 1;

// ========================================
// 1. CREATION D'UNE INTERVENTION
// ========================================

app.post("/api/workorders", authenticateToken, (req, res) => {

    const { description, speciality, priority } = req.body || {};

    if (!description || !speciality || !priority) {
        return res.status(400).json({
            message: "Champs obligatoires manquants"
        });
    }

    const id = nextId++;

    const workOrder = {
        id,
        workOrder: `WO-2026-${String(id).padStart(5, "0")}`,
        description,
        speciality,
        priority,
        status: "NEW",
        technician: null,
        createdDate: new Date().toISOString(),
        history: ["NEW"]
    };

    workOrders.push(workOrder);

    res.status(201).json(workOrder);
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

    order.technician = technician.trim();
    order.status = "ASSIGNED";

    if (order.history[order.history.length - 1] !== "ASSIGNED") {
        order.history.push("ASSIGNED");
    }

    res.status(200).json(order);
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

    if (!status) {
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

    res.status(200).json(order);
});


// ========================================
// 3. CONSULTATION D'UNE INTERVENTION
// ========================================

app.get("/api/workorders/:id", (req, res) => {

    const order = workOrders.find(
        item => item.id === Number(req.params.id)
    );

    if (!order) {
        return res.status(404).json({
            message: "Intervention introuvable"
        });
    }

    res.status(200).json(order);
});

// ========================================
// 4. DEMARRAGE DU SERVEUR
// ========================================

app.listen(3000, () => {
    console.log("SPOT RAIL API démarrée sur http://localhost:3000");
});

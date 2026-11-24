
require("dotenv").config();

const express = require("express");
const webpush = require("web-push");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// SERVER CONFIGURATION
// ============================================

app.use(cors({
    origin: true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"]
}));

app.use(express.json({ limit: "1mb" }));

app.use(express.static(path.join(__dirname, "public")));

// ============================================
// VAPID CONFIGURATION
// ============================================

const publicKey = process.env.VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const vapidEmail = process.env.VAPID_EMAIL;

if (!publicKey || !privateKey || !vapidEmail) {
    console.error("ERROR: VAPID configuration missing in .env");
    process.exit(1);
}

try {
    webpush.setVapidDetails(
        vapidEmail,
        publicKey,
        privateKey
    );

    console.log("VAPID configuration loaded successfully.");
} catch (error) {
    console.error("VAPID configuration error:", error.message);
    process.exit(1);
}

// ============================================
// DATA STORAGE
// ============================================

// In-memory storage. Data is lost on restart.
const subscriptions = new Map();
const reminderTimers = new Map();

// ============================================
// HELPER: SEND PUSH NOTIFICATION
// ============================================

async function sendPushNotification(patientId, notificationData) {

    const subscription = subscriptions.get(patientId);

    if (!subscription) {
        console.error("No subscription found for:", patientId);
        return {
            success: false,
            message: "Patient subscription not found."
        };
    }

    const payload = JSON.stringify({
        title: notificationData.title || "Medication Reminder",
        body: notificationData.body || "It is time to take your medicine.",
        patientId,
        name: notificationData.name || "Medication",
        dose: notificationData.dose || "",
        time: notificationData.time || "",
        type: notificationData.type || "Medicine",
        url: "/reminder.html",
        tag: `medication-${patientId}-${Date.now()}`
    });

    try {
        const response = await webpush.sendNotification(
            subscription,
            payload,
            {
                TTL: 3600,
                urgency: "high"
            }
        );

        console.log("======================================");
        console.log("PUSH NOTIFICATION SENT SUCCESSFULLY");
        console.log("Patient ID:", patientId);
        console.log("Status Code:", response.statusCode);
        console.log("======================================");

        return {
            success: true,
            statusCode: response.statusCode
        };

    } catch (error) {

        console.error("======================================");
        console.error("PUSH NOTIFICATION FAILED");
        console.error("Patient ID:", patientId);
        console.error("Status Code:", error.statusCode || "Unknown");
        console.error("Error Message:", error.message);
        console.error("Response Body:", error.body || "No response body");
        console.error("Response Headers:", error.headers || {});
        console.error("======================================");

        if (error.statusCode === 404 || error.statusCode === 410) {
            console.log("Removing expired subscription:", patientId);
            subscriptions.delete(patientId);
        }

        return {
            success: false,
            statusCode: error.statusCode || 500,
            message: error.message,
            body: error.body || ""
        };
    }
}

// ============================================
// HELPER: SCHEDULE DAILY REMINDER
// ============================================

function scheduleNotification(patientId, medication) {

    const { type, name, dose, time } = medication;

    if (!patientId || !name || !time) {
        throw new Error("Patient ID, medicine name and time are required.");
    }

    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
        throw new Error("Invalid time format. Use HH:MM.");
    }

    const scheduleId = [
        patientId,
        type || "Medicine",
        name,
        time
    ].join("-");

    if (reminderTimers.has(scheduleId)) {
        clearTimeout(reminderTimers.get(scheduleId));
        reminderTimers.delete(scheduleId);
    }

    const [hours, minutes] = time.split(":").map(Number);

    const now = new Date();
    const nextReminder = new Date();

    nextReminder.setHours(hours, minutes, 0, 0);

    if (nextReminder <= now) {
        nextReminder.setDate(nextReminder.getDate() + 1);
    }

    const delay = nextReminder.getTime() - now.getTime();

    console.log("======================================");
    console.log("REMINDER SCHEDULED");
    console.log("Patient ID:", patientId);
    console.log("Medicine:", name);
    console.log("Dose:", dose || "Not specified");
    console.log("Time:", time);
    console.log("Notification time:", nextReminder.toLocaleString());
    console.log("Waiting", Math.floor(delay / 1000), "seconds");
    console.log("======================================");

    const timer = setTimeout(async () => {

        console.log("SENDING MEDICATION REMINDER");
        console.log("Patient ID:", patientId);
        console.log("Medicine:", name);

        await sendPushNotification(patientId, {
            title: "💊 Medication Reminder",
            body: `Time to take ${name}. Dose: ${dose || "As prescribed"}`,
            name,
            dose,
            time,
            type
        });

        // Schedule the next daily reminder
        scheduleNotification(patientId, medication);

    }, delay);

    reminderTimers.set(scheduleId, timer);
}

// ============================================
// API 1: GET VAPID PUBLIC KEY
// ============================================

app.get("/api/public-key", (req, res) => {

    console.log("Public VAPID key requested.");

    res.json({
        success: true,
        publicKey
    });
});

// ============================================
// API 2: SAVE PUSH SUBSCRIPTION
// ============================================

app.post("/api/subscribe", (req, res) => {

    try {

        const { patientId, subscription } = req.body;

        if (!patientId || !subscription) {
            return res.status(400).json({
                success: false,
                message: "Patient ID and subscription are required."
            });
        }

        if (
            !subscription.endpoint ||
            !subscription.keys ||
            !subscription.keys.p256dh ||
            !subscription.keys.auth
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid push subscription."
            });
        }

        subscriptions.set(patientId, subscription);

        console.log("======================================");
        console.log("SUBSCRIPTION RECEIVED");
        console.log("Patient ID:", patientId);
        console.log("Push subscription saved successfully.");
        console.log("======================================");

        return res.json({
            success: true,
            message: "Push subscription saved successfully."
        });

    } catch (error) {

        console.error("Subscription error:", error);

        return res.status(500).json({
            success: false,
            message: "Could not save subscription."
        });
    }
});

// ============================================
// API 3: SCHEDULE MEDICATION / INSULIN
// ============================================

app.post("/api/schedule", (req, res) => {

    try {

        const {
            patientId,
            type,
            name,
            dose,
            time
        } = req.body;

        if (!patientId || !name || !time) {
            return res.status(400).json({
                success: false,
                message: "Patient ID, name and time are required."
            });
        }

        const medication = {
            type: type || "Medicine",
            name,
            dose: dose || "",
            time
        };

        scheduleNotification(patientId, medication);

        return res.json({
            success: true,
            message: "Medication reminder scheduled successfully.",
            medication
        });

    } catch (error) {

        console.error("Scheduling error:", error.message);

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// ============================================
// API 4: TEST PUSH NOTIFICATION
// ============================================

app.post("/api/test-notification", async (req, res) => {

    const { patientId } = req.body;

    if (!patientId) {
        return res.status(400).json({
            success: false,
            message: "Patient ID is required."
        });
    }

    const result = await sendPushNotification(patientId, {
        title: "🔔 Test Notification",
        body: "Your medication notification system is working!",
        name: "Test Medicine",
        dose: "Test dose",
        time: new Date().toLocaleTimeString(),
        type: "Test"
    });

    if (!result.success) {
        return res.status(502).json({
            success: false,
            message: result.message,
            statusCode: result.statusCode,
            responseBody: result.body
        });
    }

    return res.json({
        success: true,
        message: "Test notification sent successfully.",
        statusCode: result.statusCode
    });
});

// ============================================
// API 5: SERVER STATUS
// ============================================

app.get("/api/status", (req, res) => {

    res.json({
        success: true,
        server: "running",
        activeSubscriptions: subscriptions.size,
        activeReminders: reminderTimers.size,
        time: new Date().toLocaleString()
    });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {

    console.log("");
    console.log("======================================");
    console.log("       MEDICATION TRACKING SERVER");
    console.log("======================================");
    console.log(`http://localhost:${PORT}`);
    console.log(`http://127.0.0.1:${PORT}`);
    console.log("======================================");
    console.log("Server is running.");
    console.log("VAPID configuration loaded.");
    console.log("======================================");
});

const crypto = require("crypto");
const { collection } = require("../data/store");
const AppError = require("../utils/AppError");
const { requireFields } = require("../utils/validators");

// POST /api/messages  { recipientId, body }
async function sendMessage(req, res) {
  const { recipientId, body } = req.body;
  requireFields(req.body, ["recipientId", "body"]);

  if (recipientId === req.user.id) {
    throw new AppError("You can't message yourself.", 400);
  }

  const recipient = collection("users").findById(recipientId);
  if (!recipient) throw new AppError("Recipient not found.", 404);

  const message = collection("messages").insert({
    id: `m_${crypto.randomUUID()}`,
    senderId: req.user.id,
    recipientId,
    body: String(body).trim(),
    read: false,
    createdAt: new Date().toISOString(),
  });

  res.status(201).json({ data: message });
}

// GET /api/messages/inbox — most recent message per conversation, newest first
async function inbox(req, res) {
  const mine = collection("messages").find(
    (m) => m.senderId === req.user.id || m.recipientId === req.user.id
  );

  const byThread = new Map();
  for (const m of mine) {
    const otherPartyId = m.senderId === req.user.id ? m.recipientId : m.senderId;
    const existing = byThread.get(otherPartyId);
    if (!existing || new Date(m.createdAt) > new Date(existing.createdAt)) {
      byThread.set(otherPartyId, m);
    }
  }

  const threads = [...byThread.entries()]
    .map(([otherPartyId, lastMessage]) => {
      const other = collection("users").findById(otherPartyId);
      return {
        otherParty: other ? { id: other.id, name: other.name } : { id: otherPartyId, name: "Unknown user" },
        lastMessage,
      };
    })
    .sort((a, b) => new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt));

  res.json({ data: threads });
}

// GET /api/messages/thread/:userId — full conversation with one other user
async function thread(req, res) {
  const otherId = req.params.userId;
  const messages = collection("messages")
    .find(
      (m) =>
        (m.senderId === req.user.id && m.recipientId === otherId) ||
        (m.senderId === otherId && m.recipientId === req.user.id)
    )
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  res.json({ data: messages });
}

module.exports = { sendMessage, inbox, thread };

// Vercel Serverless Function
// Runs on the server only — the GHL_API_KEY never reaches the browser.

const GHL_BASE = "https://services.leadconnectorhq.com";
const GHL_VERSION = "2021-07-28";

module.exports = async (req, res) => {
  const TOKEN = process.env.GHL_API_KEY;
  const LOCATION_ID = process.env.GHL_LOCATION_ID;

  if (!TOKEN || !LOCATION_ID) {
    res.status(500).json({ error: "Missing GHL_API_KEY or GHL_LOCATION_ID environment variable on the server." });
    return;
  }

  const headers = {
    Authorization: `Bearer ${TOKEN}`,
    Version: GHL_VERSION,
    "Content-Type": "application/json",
  };

  try {
    // 1. Total contacts
    const contactsRes = await fetch(`${GHL_BASE}/contacts/search`, {
      method: "POST",
      headers,
      body: JSON.stringify({ locationId: LOCATION_ID, pageLimit: 1 }),
    });
    const contactsData = await contactsRes.json();
    if (!contactsRes.ok) throw new Error(contactsData?.message || "Failed to fetch contacts");

    // 2. Per-tag counts
    const tagNames = ["tag 1", "tag 2", "tag 3", "tag 4"];
    const tags = [];
    for (const name of tagNames) {
      const r = await fetch(`${GHL_BASE}/contacts/search`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          locationId: LOCATION_ID,
          pageLimit: 1,
          filters: [{ field: "tags", operator: "contains", value: name }],
        }),
      });
      const d = await r.json();
      tags.push({ name, count: d?.total ?? 0 });
    }

    // 3. Opportunities
    const oppsRes = await fetch(`${GHL_BASE}/opportunities/search`, {
      method: "POST",
      headers,
      body: JSON.stringify({ locationId: LOCATION_ID, page: 1, limit: 1 }),
    });
    const oppsData = await oppsRes.json();

    // 4. Conversations
    const convosRes = await fetch(
      `${GHL_BASE}/conversations/search?locationId=${LOCATION_ID}&limit=1`,
      { headers }
    );
    const convosData = await convosRes.json();

    // 5. Pipeline name
    const pipelinesRes = await fetch(
      `${GHL_BASE}/opportunities/pipelines?locationId=${LOCATION_ID}`,
      { headers }
    );
    const pipelinesData = await pipelinesRes.json();

    res.status(200).json({
      totalContacts: contactsData?.total ?? 0,
      tags,
      totalOpportunities: oppsData?.total ?? 0,
      totalConversations: convosData?.total ?? 0,
      pipelineName: pipelinesData?.pipelines?.[0]?.name ?? null,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

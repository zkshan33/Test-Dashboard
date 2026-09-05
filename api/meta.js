const GHL_BASE = "https://services.leadconnectorhq.com";
const GHL_VERSION = "2021-07-28";

module.exports = async (req, res) => {
  const TOKEN = process.env.GHL_API_KEY;
  const LOCATION_ID = process.env.GHL_LOCATION_ID;

  if (!TOKEN || !LOCATION_ID) {
    res.status(500).json({ error: "Missing GHL_API_KEY or GHL_LOCATION_ID environment variable." });
    return;
  }

  const headers = {
    Authorization: `Bearer ${TOKEN}`,
    Version: GHL_VERSION,
    "Content-Type": "application/json",
  };

  try {
    // Pipelines + stages
    const pipelinesRes = await fetch(`${GHL_BASE}/opportunities/pipelines?locationId=${LOCATION_ID}`, { headers });
    const pipelinesData = await pipelinesRes.json();
    const pipelines = (pipelinesData.pipelines || []).map((p) => ({
      id: p.id,
      name: p.name,
      stages: (p.stages || []).map((s) => ({ id: s.id, name: s.name, position: s.position })),
    }));

    // Tags defined on the location
    const tagsRes = await fetch(`${GHL_BASE}/locations/${LOCATION_ID}/tags`, { headers });
    const tagsData = await tagsRes.json();
    const tags = (tagsData.tags || []).map((t) => t.name);

    // Users: derive from opportunities' assignedTo (only people actually assigned something show up)
    const oppsRes = await fetch(
      `${GHL_BASE}/opportunities/search?locationId=${LOCATION_ID}&limit=100&status=all`,
      { headers }
    );
    const oppsData = await oppsRes.json();
    const assignedIds = [
      ...new Set((oppsData.opportunities || []).map((o) => o.assignedTo).filter(Boolean)),
    ];

    const users = [];
    for (const userId of assignedIds) {
      try {
        const uRes = await fetch(`${GHL_BASE}/users/${userId}`, { headers });
        const uData = await uRes.json();
        if (uRes.ok) {
          users.push({ id: userId, name: uData.name || `${uData.firstName || ""} ${uData.lastName || ""}`.trim() || userId });
        }
      } catch {
        // skip unresolvable user
      }
    }

    res.status(200).json({ pipelines, tags, users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

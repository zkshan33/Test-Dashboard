const GHL_BASE = "https://services.leadconnectorhq.com";
const GHL_VERSION = "2021-07-28";

module.exports = async (req, res) => {
  const TOKEN = process.env.GHL_API_KEY;
  const LOCATION_ID = process.env.GHL_LOCATION_ID;

  if (!TOKEN || !LOCATION_ID) {
    res.status(500).json({ error: "Missing GHL_API_KEY or GHL_LOCATION_ID environment variable." });
    return;
  }

  const { pipelineId } = req.query;

  const headers = {
    Authorization: `Bearer ${TOKEN}`,
    Version: GHL_VERSION,
    "Content-Type": "application/json",
  };

  try {
    const qs = new URLSearchParams({
      locationId: LOCATION_ID,
      limit: "100",
      status: "all",
      order: "added_desc",
    });
    if (pipelineId) qs.set("pipelineId", pipelineId);

    const oppsRes = await fetch(`${GHL_BASE}/opportunities/search?${qs.toString()}`, { headers });
    const oppsData = await oppsRes.json();
    if (!oppsRes.ok) throw new Error(oppsData?.message || "Failed to fetch opportunities");

    const opportunities = (oppsData.opportunities || []).map((o) => ({
      id: o.id,
      name: o.name,
      monetaryValue: o.monetaryValue || 0,
      status: o.status,
      pipelineId: o.pipelineId,
      pipelineStageId: o.pipelineStageId,
      assignedTo: o.assignedTo,
      contactName: o.contact?.name || o.relations?.[0]?.fullName || "Unknown",
      tags: o.contact?.tags || [],
      createdAt: o.createdAt,
      lastStageChangeAt: o.lastStageChangeAt || o.createdAt,
    }));

    res.status(200).json({
      opportunities,
      total: opportunities.length,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

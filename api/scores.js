export default async function handler(req, res) {
    const { OSU_CLIENT_ID, OSU_CLIENT_SECRET } = process.env;
    const USER_ID = "13017880";

    if (!OSU_CLIENT_ID || !OSU_CLIENT_SECRET) {
        return res.status(500).json({ error: "Config missing" });
    }

    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=30');

    try {
        const tokenRes = await fetch("https://osu.ppy.sh/oauth/token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                client_id: OSU_CLIENT_ID,
                client_secret: OSU_CLIENT_SECRET,
                grant_type: "client_credentials",
                scope: "public"
            })
        });

        if (!tokenRes.ok) throw new Error("Token error");
        const { access_token } = await tokenRes.json();

        const headers = {
            "Authorization": `Bearer ${access_token}`,
            "Content-Type": "application/json",
            "x-api-version": "20240130"
        };

        const url = new URL(req.url, `http://${req.headers.host}`);
        const type = url.searchParams.get('type') || 'best';

        let endpoint = `users/${USER_ID}/scores/best?limit=50`;
        if (type === 'user') endpoint = `users/${USER_ID}/osu`;
        if (type === 'recent') endpoint = `users/${USER_ID}/scores/recent?include_fails=1&limit=15`;

        const apiRes = await fetch(`https://osu.ppy.sh/api/v2/${endpoint}`, { headers });
        if (!apiRes.ok) throw new Error("API error");
        
        const data = await apiRes.json();

        if (type === 'user') {
            const s = data.statistics || {};
            return res.status(200).json({
                username: data.username,
                avatar_url: data.avatar_url,
                cover_url: data.cover?.url || "",
                global_rank: s.global_rank || 0,
                country_rank: s.country_rank || 0,
                country: data.country?.code || "XX",
                pp: Math.round(s.pp || 0),
                accuracy: (s.hit_accuracy || 0).toFixed(2),
                play_count: s.play_count || 0,
                max_combo: s.maximum_combo || 0,
                level: s.level?.current || 0,
                level_progress: s.level?.progress || 0,
                grades: s.grade_counts || {},
                rank_history: data.rank_history?.data || []
            });
        }

        const mapScore = s => ({
            rank: s.rank,
            pp: Math.round(s.pp),
            accuracy: (s.accuracy * 100).toFixed(2),
            mods: s.mods.map(m => m.acronym || m),
            date_iso: s.created_at,
            stats: { 
                great: (s.statistics.great||0)+(s.statistics.perfect||0), 
                ok: (s.statistics.ok||0)+(s.statistics.good||0), 
                miss: s.statistics.miss||0 
            },
            beatmap: { 
                title: s.beatmapset.title, 
                version: s.beatmap.version, 
                cover: s.beatmapset.covers['cover@2x'] || s.beatmapset.covers.cover, 
                url: s.beatmap.url 
            }
        });

        return res.status(200).json(Array.isArray(data) ? data.map(mapScore) : []);

    } catch (e) {
        return res.status(500).json({ error: "Internal error" });
    }
}

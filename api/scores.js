export default async function handler(request, response) {
    const CLIENT_ID = process.env.OSU_CLIENT_ID;
    const CLIENT_SECRET = process.env.OSU_CLIENT_SECRET;
    const USER_ID = "13017880";

    const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
    const type = url.searchParams.get('type') || 'best';

    if (!CLIENT_ID || !CLIENT_SECRET) {
        return response.status(500).json({ error: "Server config missing" });
    }

    try {
        const tokenRes = await fetch("https://osu.ppy.sh/oauth/token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                grant_type: "client_credentials",
                scope: "public"
            })
        });

        const { access_token } = await tokenRes.json();
        const headers = {
            "Authorization": `Bearer ${access_token}`,
            "Content-Type": "application/json",
            "x-api-version": "20240130"
        };

        if (type === 'user') {
            const userRes = await fetch(`https://osu.ppy.sh/api/v2/users/${USER_ID}/osu`, { headers });
            const user = await userRes.json();
            const s = user.statistics || {};
            
            return response.status(200).json({
                username: user.username,
                avatar_url: user.avatar_url,
                cover_url: user.cover?.url || "", 
                global_rank: s.global_rank || 0,
                country_rank: s.country_rank || 0,
                pp: Math.round(s.pp || 0),
                accuracy: (s.hit_accuracy || 0).toFixed(2),
                play_count: (s.play_count || 0).toLocaleString(),
                play_time: ((s.play_time || 0) / 3600).toFixed(0),
                total_score: (s.total_score || 0).toLocaleString(),
                max_combo: s.maximum_combo || 0,
                level: s.level?.current || 0,
                level_progress: s.level?.progress || 0,
                country: user.country?.code || "XX",
                country_name: user.country?.name || "Unknown",
            });
        }

        const scoresRes = await fetch(`https://osu.ppy.sh/api/v2/users/${USER_ID}/scores/best?limit=50`, { headers });
        const scores = await scoresRes.json();

        const detailedScores = scores.map(s => {
            const mods = s.mods?.length ? s.mods.map(m => m.acronym || m) : ["NM"];
            const st = s.statistics;
            const b = s.beatmap;
            const bs = s.beatmapset;

            return {
                id: s.id,
                rank: s.rank, 
                pp: Math.round(s.pp),
                accuracy: (s.accuracy * 100).toFixed(2),
                score_classic: s.classic_score || s.score || 0, 
                score_lazer: s.total_score || s.score || 0,
                max_combo: s.max_combo,
                mods,
                date_iso: s.created_at,
                stats: { great: (st.great || 0) + (st.perfect || 0), ok: (st.ok || 0) + (st.good || 0), meh: st.meh || 0, miss: st.miss || 0 },
                beatmap: {
                    id: b.id,
                    title: bs.title,
                    artist: bs.artist,
                    version: b.version,
                    stars: b.difficulty_rating,
                    cover: bs.covers['cover@2x'] || bs.covers.cover,
                    url: b.url,
                    status: bs.status,
                    creator: bs.creator,
                    cs: b.cs,
                    ar: b.ar,
                    od: b.accuracy,
                    hp: b.drain,
                    bpm: b.bpm,
                    length: b.total_length,
                    max_combo: b.count_sliders + b.count_circles + b.count_spinners 
                }
            };
        });

        return response.status(200).json(detailedScores);

    } catch (error) {
        console.error("API Error:", error);
        return response.status(500).json({ error: "Internal API Error" });
    }
}

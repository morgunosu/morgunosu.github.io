export default async function handler(request, response) {
    const CLIENT_ID = process.env.OSU_CLIENT_ID;
    const CLIENT_SECRET = process.env.OSU_CLIENT_SECRET;
    const USER_ID = "13017880";

    const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
    const type = url.searchParams.get('type') || 'best';

    if (!CLIENT_ID || !CLIENT_SECRET) return response.status(500).json({ error: "Server config missing" });

    try {
        const tokenResponse = await fetch("https://osu.ppy.sh/oauth/token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                grant_type: "client_credentials",
                scope: "public"
            })
        });

        const tokenData = await tokenResponse.json();
        const headers = {
            "Authorization": `Bearer ${tokenData.access_token}`,
            "Content-Type": "application/json",
            "x-api-version": "20240130"
        };

        if (type === 'user') {
            const userRes = await fetch(`https://osu.ppy.sh/api/v2/users/${USER_ID}/osu`, { headers });
            const user = await userRes.json();
            const stats = user.statistics || {};
            
            return response.status(200).json({
                username: user.username,
                avatar_url: user.avatar_url,
                cover_url: user.cover?.url || "", 
                global_rank: stats.global_rank || 0,
                country_rank: stats.country_rank || 0,
                pp: Math.round(stats.pp || 0),
                accuracy: (stats.hit_accuracy || 0).toFixed(2),
                play_count: (stats.play_count || 0).toLocaleString(),
                play_time: ((stats.play_time || 0) / 3600).toFixed(0),
                total_score: (stats.total_score || 0).toLocaleString(),
                max_combo: stats.maximum_combo || 0,
                level: stats.level?.current || 0,
                level_progress: stats.level?.progress || 0,
                country: user.country?.code || "XX",
                country_name: user.country?.name || "Unknown",
            });
        }

        const scoresRes = await fetch(`https://osu.ppy.sh/api/v2/users/${USER_ID}/scores/best?limit=50`, { headers });
        const scores = await scoresRes.json();

        const detailedScores = scores.map(s => {
            const mods = s.mods && s.mods.length > 0 ? s.mods.map(m => m.acronym || m) : ["NM"];
            const st = s.statistics;
            // Объединяем Lazer и Classic статы
            const count300 = (st.great || 0) + (st.perfect || 0); 
            const count100 = (st.ok || 0) + (st.good || 0);
            const count50  = st.meh || 0;
            const countMiss = st.miss || 0;

            return {
                id: s.id,
                rank: s.rank, 
                pp: Math.round(s.pp),
                accuracy: (s.accuracy * 100).toFixed(2),
                score_classic: s.classic_score || s.score || 0, 
                score_lazer: s.total_score || s.score || 0,
                max_combo: s.max_combo,
                mods: mods,
                date_iso: s.created_at,
                stats: { great: count300, ok: count100, meh: count50, miss: countMiss },
                beatmap: {
                    id: s.beatmap.id,
                    title: s.beatmapset.title,
                    artist: s.beatmapset.artist,
                    version: s.beatmap.version,
                    stars: s.beatmap.difficulty_rating,
                    cover: s.beatmapset.covers['cover@2x'] || s.beatmapset.covers.cover,
                    url: s.beatmap.url,
                    status: s.beatmapset.status,
                    creator: s.beatmapset.creator,
                    cs: s.beatmap.cs,
                    ar: s.beatmap.ar,
                    od: s.beatmap.accuracy,
                    hp: s.beatmap.drain,
                    bpm: s.beatmap.bpm,
                    length: s.beatmap.total_length,
                    max_combo: s.beatmap.count_spinners + s.beatmap.count_sliders + s.beatmap.count_circles // Примерный макс комбо
                }
            };
        });

        return response.status(200).json(detailedScores);

    } catch (error) {
        console.error("API Error:", error);
        return response.status(500).json({ error: "Internal API Error" });
    }
}

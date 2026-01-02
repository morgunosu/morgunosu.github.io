export default async function handler(request, response) {
    const CLIENT_ID = process.env.OSU_CLIENT_ID;
    const CLIENT_SECRET = process.env.OSU_CLIENT_SECRET;
    const USER_ID = "13017880";
    const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
    const type = url.searchParams.get('type') || 'best';

    if (!CLIENT_ID || !CLIENT_SECRET) return response.status(500).json({ error: "Config missing" });

    try {
        const tokenRes = await fetch("https://osu.ppy.sh/oauth/token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, grant_type: "client_credentials", scope: "public" })
        });
        const { access_token } = await tokenRes.json();
        const headers = { "Authorization": `Bearer ${access_token}`, "Content-Type": "application/json", "x-api-version": "20240130" };

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
                play_count: s.play_count || 0,
                play_time_seconds: s.play_time || 0,
                total_score: s.total_score || 0,
                ranked_score: s.ranked_score || 0,
                max_combo: s.maximum_combo || 0,
                level: s.level?.current || 0,
                level_progress: s.level?.progress || 0,
                country: user.country?.code || "XX",
                medal_count: (user.user_achievements || []).length, 
                replays_watched: s.replays_watched_by_others || 0,
                total_hits: s.total_hits || 0,
                grades: s.grade_counts || { ssh: 0, ss: 0, sh: 0, s: 0, a: 0 },
                rank_history: user.rank_history?.data || []
            });
        }

        if (type === 'recent') {
            const recentRes = await fetch(`https://osu.ppy.sh/api/v2/users/${USER_ID}/scores/recent?include_fails=1&limit=15`, { headers });
            const recent = await recentRes.json();
            return response.status(200).json(recent.map(s => ({
                rank: s.rank,
                mods: s.mods.map(m => m.acronym || m),
                created_at: s.created_at,
                beatmap: { title: s.beatmapset.title, version: s.beatmap.version, url: s.beatmap.url }
            })));
        }

        const scoresRes = await fetch(`https://osu.ppy.sh/api/v2/users/${USER_ID}/scores/best?limit=50`, { headers });
        const scores = await scoresRes.json();
        return response.status(200).json(scores.map(s => ({
            id: s.id,
            rank: s.rank, 
            pp: Math.round(s.pp),
            accuracy: (s.accuracy * 100).toFixed(2),
            score_lazer: s.total_score || s.score || 0,
            max_combo: s.max_combo,
            mods: s.mods.map(m => m.acronym || m),
            date_iso: s.created_at,
            stats: { great: (s.statistics.great||0)+(s.statistics.perfect||0), ok: (s.statistics.ok||0)+(s.statistics.good||0), meh: s.statistics.meh||0, miss: s.statistics.miss||0 },
            beatmap: {
                title: s.beatmapset.title,
                artist: s.beatmapset.artist,
                version: s.beatmap.version,
                cover: s.beatmapset.covers['cover@2x'] || s.beatmapset.covers.cover,
                url: s.beatmap.url,
                cs: s.beatmap.cs, ar: s.beatmap.ar, od: s.beatmap.accuracy, hp: s.beatmap.drain, bpm: s.beatmap.bpm, length: s.beatmap.total_length,
                max_combo: s.beatmap.count_sliders + s.beatmap.count_circles + s.beatmap.count_spinners 
            }
        })));

    } catch (e) { return response.status(500).json({ error: "Internal API Error" }); }
}

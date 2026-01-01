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
        // 1. ПОЛУЧАЕМ ТОКЕН
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

        // --- ПРОФИЛЬ ---
        if (type === 'user') {
            const userRes = await fetch(`https://osu.ppy.sh/api/v2/users/${USER_ID}/osu`, { headers });
            const user = await userRes.json();
            
            // Защита от отсутствия полей
            const stats = user.statistics || {};
            const totalScore = stats.total_score || stats.ranked_score || 0;

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
                total_score: totalScore.toLocaleString(),
                max_combo: stats.maximum_combo || 0,
                level: stats.level?.current || 0,
                level_progress: stats.level?.progress || 0,
                country: user.country?.code || "XX",
                country_name: user.country?.name || "Unknown",
            });
        }

        // --- ТОП СКОРЫ ---
        const scoresRes = await fetch(`https://osu.ppy.sh/api/v2/users/${USER_ID}/scores/best?limit=20`, { headers });
        const scores = await scoresRes.json();

        const detailedScores = scores.map(s => {
            // 1. ИСПРАВЛЕНИЕ ОЧКОВ
            const finalScore = s.classic_score || s.total_score || s.score || 0;
            
            // 2. ИСПРАВЛЕНИЕ МОДОВ (API v2 возвращает массив объектов)
            const mods = s.mods ? s.mods.map(m => m.acronym || m) : ["NM"];
            if (mods.length === 0) mods.push("NM");

            // 3. ИСПРАВЛЕНИЕ СТАТИСТИКИ (Legacy vs Lazer names)
            // Lazer: great, ok, meh, miss
            // Legacy: count_300, count_100, count_50, count_miss
            const st = s.statistics;
            const count300 = st.great ?? st.count_300 ?? 0;
            const countGEKI = st.perfect ?? st.count_geki ?? 0; // Для мании/ctb
            const count100 = st.ok ?? st.count_100 ?? 0;
            const countKATU = st.good ?? st.count_katu ?? 0;
            const count50  = st.meh ?? st.count_50 ?? 0;
            const countMiss = st.miss ?? st.count_miss ?? 0;

            // Объединяем Geki с 300 и Katu с 100 для стандартного osu!
            const real300 = count300 + countGEKI;
            const real100 = count100 + countKATU;

            return {
                id: s.id,
                rank: s.rank, 
                pp: Math.round(s.pp),
                accuracy: (s.accuracy * 100).toFixed(2),
                score: finalScore.toLocaleString(),
                max_combo: s.max_combo,
                mods: mods, // Теперь это массив строк ['HD', 'DT']
                date_iso: s.created_at, // Отдаем сырую дату, отформатируем на клиенте
                
                stats: {
                    great: real300,
                    ok: real100,
                    meh: count50,
                    miss: countMiss
                },
                beatmap: {
                    title: s.beatmapset.title,
                    artist: s.beatmapset.artist,
                    version: s.beatmap.version,
                    stars: s.beatmap.difficulty_rating,
                    cover: s.beatmapset.covers['cover@2x'] || s.beatmapset.covers.cover, // Высокое качество
                    url: s.beatmap.url,
                    status: s.beatmapset.status,
                    creator: s.beatmapset.creator,
                    cs: s.beatmap.cs,
                    ar: s.beatmap.ar,
                    od: s.beatmap.accuracy,
                    hp: s.beatmap.drain,
                    bpm: s.beatmap.bpm,
                    length: s.beatmap.total_length
                }
            };
        });

        return response.status(200).json(detailedScores);

    } catch (error) {
        console.error("API Error:", error);
        return response.status(500).json({ error: "Internal API Error" });
    }
}

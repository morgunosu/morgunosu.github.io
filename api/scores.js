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

        if (!tokenResponse.ok) throw new Error("Failed to get token");
        const tokenData = await tokenResponse.json();
        const headers = {
            "Authorization": `Bearer ${tokenData.access_token}`,
            "Content-Type": "application/json",
            "x-api-version": "20240130"
        };

        // --- ПРОФИЛЬ ---
        if (type === 'user') {
            const userRes = await fetch(`https://osu.ppy.sh/api/v2/users/${USER_ID}/osu`, { headers });
            if (!userRes.ok) throw new Error("User request failed");
            const user = await userRes.json();
            const totalScore = user.statistics.total_score || user.statistics.ranked_score || 0;

            return response.status(200).json({
                username: user.username,
                avatar_url: user.avatar_url,
                cover_url: user.cover?.url || "",
                global_rank: user.statistics.global_rank,
                country_rank: user.statistics.country_rank,
                pp: Math.round(user.statistics.pp),
                accuracy: user.statistics.hit_accuracy.toFixed(2),
                play_count: (user.statistics.play_count || 0).toLocaleString(),
                play_time: ((user.statistics.play_time || 0) / 3600).toFixed(0),
                total_score: totalScore.toLocaleString(),
                max_combo: user.statistics.maximum_combo,
                level: user.statistics.level.current,
                level_progress: user.statistics.level.progress,
                join_date: new Date(user.join_date).toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' }),
                country: user.country.code,
                country_name: user.country.name,
                medals: user.user_achievements.length
            });
        }

        // --- ТОП СКОРЫ (ДЕТАЛЬНО) ---
        const scoresRes = await fetch(`https://osu.ppy.sh/api/v2/users/${USER_ID}/scores/best?limit=20`, { headers });
        if (!scoresRes.ok) throw new Error("Scores request failed");
        const scores = await scoresRes.json();

        const detailedScores = scores.map(s => {
            const finalScore = s.classic_score || s.total_score || s.score || 0;
            
            // Расчет длительности в минутах:секундах
            const totalSeconds = s.beatmap.total_length;
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;
            const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;

            return {
                id: s.id,
                rank: s.rank, 
                pp: Math.round(s.pp),
                accuracy: (s.accuracy * 100).toFixed(2),
                score: finalScore.toLocaleString(),
                max_combo: s.max_combo,
                mods: s.mods && s.mods.length > 0 ? s.mods : ["NM"],
                date: new Date(s.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }),
                full_date: new Date(s.created_at).toLocaleString('ru-RU'),
                
                // Детальная статистика попаданий
                stats: {
                    great: s.statistics.count_300 + (s.statistics.count_geki || 0),
                    ok: s.statistics.count_100 + (s.statistics.count_katu || 0),
                    meh: s.statistics.count_50 || 0,
                    miss: s.statistics.count_miss || 0
                },
                // Инфо о карте
                beatmap: {
                    id: s.beatmap.id,
                    set_id: s.beatmapset.id,
                    title: s.beatmapset.title,
                    artist: s.beatmapset.artist,
                    version: s.beatmap.version,
                    stars: s.beatmap.difficulty_rating,
                    cover: s.beatmapset.covers.cover, // Широкая
                    list_cover: s.beatmapset.covers.list, // Узкая для списка
                    url: s.beatmap.url,
                    status: s.beatmapset.status,
                    creator: s.beatmapset.creator,
                    // Технические данные
                    cs: s.beatmap.cs,
                    ar: s.beatmap.ar,
                    od: s.beatmap.accuracy,
                    hp: s.beatmap.drain,
                    bpm: s.beatmap.bpm,
                    length: timeString,
                    max_combo: s.beatmap.count_spinners + s.beatmap.count_sliders + s.beatmap.count_circles // примерный макс комбо карты
                }
            };
        });

        return response.status(200).json(detailedScores);

    } catch (error) {
        console.error("API Error:", error);
        return response.status(500).json({ error: "Internal API Error" });
    }
}

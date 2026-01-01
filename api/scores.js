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
        const accessToken = tokenData.access_token;

        const headers = {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            "x-api-version": "20240130"
        };

        // --- 2. СТАТИСТИКА ПРОФИЛЯ ---
        if (type === 'user') {
            const userRes = await fetch(`https://osu.ppy.sh/api/v2/users/${USER_ID}/osu`, { headers });
            if (!userRes.ok) throw new Error("User request failed");
            const user = await userRes.json();

            return response.status(200).json({
                username: user.username,
                global_rank: user.statistics.global_rank,
                country_rank: user.statistics.country_rank || 0,
                pp: Math.round(user.statistics.pp),
                accuracy: user.statistics.hit_accuracy.toFixed(2),
                playcount: user.statistics.play_count.toLocaleString(),
                level: Math.floor(user.statistics.level.current),
                country: user.country_code
            });
        }

        // --- 3. ЛУЧШИЕ СКОРЫ ---
        const scoresRes = await fetch(`https://osu.ppy.sh/api/v2/users/${USER_ID}/scores/best?limit=3`, { headers });
        if (!scoresRes.ok) throw new Error("Scores request failed");
        const scores = await scoresRes.json();

        const detailedScores = scores.map(score => {
            // !!! ИСПРАВЛЕНИЕ: Ищем очки в разных полях (classic_score приоритетнее для v2)
            const scoreValue = score.classic_score || score.total_score || score.score || 0;

            return {
                pp: Math.round(score.pp),
                rank: score.rank,
                score: scoreValue.toLocaleString(), // Теперь точно не упадет
                title: score.beatmapset.title,
                artist: score.beatmapset.artist,
                version: score.beatmap.version,
                cover: score.beatmapset.covers.cover,
                link: score.beatmap.url
            };
        });

        return response.status(200).json(detailedScores);

    } catch (error) {
        console.error("API Error:", error);
        return response.status(500).json({ error: "Internal API Error" });
    }
}

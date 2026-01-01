export default async function handler(request, response) {
    const API_KEY = process.env.OSU_API_KEY; 
    const USER_ID = "47239";

    // Получаем тип запроса из URL (например, /api/scores?type=user)
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'best';

    if (!API_KEY) return response.status(500).json({ error: "API Key missing" });

    try {
        // --- ВАРИАНТ 1: ЗАПРОС СТАТИСТИКИ ПРОФИЛЯ ---
        if (type === 'user') {
            const userRes = await fetch(`https://osu.ppy.sh/api/get_user?k=${API_KEY}&u=${USER_ID}`);
            const userData = await userRes.json();
            const user = userData[0];

            return response.status(200).json({
                username: user.username,
                global_rank: user.pp_rank,
                country_rank: user.pp_country_rank,
                pp: parseFloat(user.pp_raw).toFixed(0),
                accuracy: parseFloat(user.accuracy).toFixed(2),
                playcount: parseInt(user.playcount).toLocaleString(),
                level: parseFloat(user.level).toFixed(0),
                country: user.country
            });
        }

        // --- ВАРИАНТ 2: ЗАПРОС ЛУЧШИХ СКОРОВ (ПО УМОЛЧАНИЮ) ---
        const scoresRes = await fetch(`https://osu.ppy.sh/api/get_user_best?k=${API_KEY}&u=${USER_ID}&limit=3`);
        const scores = await scoresRes.json();

        const detailedScores = await Promise.all(scores.map(async (score) => {
            const mapRes = await fetch(`https://osu.ppy.sh/api/get_beatmaps?k=${API_KEY}&b=${score.beatmap_id}`);
            const mapData = await mapRes.json();
            const map = mapData[0] || {};

            return {
                pp: parseFloat(score.pp).toFixed(0),
                rank: score.rank,
                score: parseInt(score.score).toLocaleString(),
                title: map.title || "Unknown",
                artist: map.artist || "Unknown",
                version: map.version || "Diff",
                cover: `https://assets.ppy.sh/beatmaps/${map.beatmapset_id}/covers/cover.jpg`,
                link: `https://osu.ppy.sh/b/${score.beatmap_id}`
            };
        }));

        return response.status(200).json(detailedScores);

    } catch (error) {
        return response.status(500).json({ error: "Osu API Error" });
    }

}

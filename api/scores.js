export default async function handler(request, response) {
    // Получаем ID и Секрет из переменных окружения
    const CLIENT_ID = process.env.OSU_CLIENT_ID;
    const CLIENT_SECRET = process.env.OSU_CLIENT_SECRET;
    const USER_ID = "13017880"; // Ваш ID

    // Исправление URL для Vercel (чтобы не было ошибки Invalid URL)
    const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
    const type = url.searchParams.get('type') || 'best';

    if (!CLIENT_ID || !CLIENT_SECRET) {
        console.error("Missing Client ID or Secret in Vercel env vars");
        return response.status(500).json({ error: "Server config missing" });
    }

    try {
        // 1. ПОЛУЧАЕМ ТОКЕН (Client Credentials Flow)
        // API v2 требует временный токен, который мы обмениваем на ID и Secret
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

        if (!tokenResponse.ok) {
            const err = await tokenResponse.text();
            throw new Error(`Failed to get token: ${err}`);
        }

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        // Заголовки для запросов к API v2
        const headers = {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            "x-api-version": "20240130" // Желательно указывать версию
        };

        // --- ВАРИАНТ 1: СТАТИСТИКА ПРОФИЛЯ (v2) ---
        if (type === 'user') {
            const userRes = await fetch(`https://osu.ppy.sh/api/v2/users/${USER_ID}/osu`, { headers });
            
            if (!userRes.ok) throw new Error("User request failed");
            
            const user = await userRes.json();

            // Формируем ответ в том же формате, что ждет ваш main.js
            return response.status(200).json({
                username: user.username,
                global_rank: user.statistics.global_rank,
                country_rank: user.statistics.country_rank || 0,
                pp: Math.round(user.statistics.pp), // В v2 это число, округляем
                accuracy: user.statistics.hit_accuracy.toFixed(2),
                playcount: user.statistics.play_count.toLocaleString(),
                level: Math.floor(user.statistics.level.current), // В v2 это объект
                country: user.country_code // "UA"
            });
        }

        // --- ВАРИАНТ 2: ЛУЧШИЕ СКОРЫ (v2) ---
        // В v2 карты приходят сразу, не нужно делать 100 запросов!
        const scoresRes = await fetch(`https://osu.ppy.sh/api/v2/users/${USER_ID}/scores/best?limit=3`, { headers });
        
        if (!scoresRes.ok) throw new Error("Scores request failed");

        const scores = await scoresRes.json();

        // Преобразуем данные v2 в формат для вашего сайта
        const detailedScores = scores.map(score => {
            return {
                pp: Math.round(score.pp),
                rank: score.rank, // SH, A, S и т.д.
                score: score.score.toLocaleString(), // В новых версиях API может быть score, legacy_score или classic_score
                title: score.beatmapset.title,
                artist: score.beatmapset.artist,
                version: score.beatmap.version,
                cover: score.beatmapset.covers.cover, // Картинка сразу есть!
                link: score.beatmap.url
            };
        });

        return response.status(200).json(detailedScores);

    } catch (error) {
        console.error("API v2 Error:", error);
        return response.status(500).json({ error: "Internal API Error" });
    }
}

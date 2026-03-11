const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();
const qs = require("qs");
const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors());
async function getAccessToken() {
    const response = await axios.post(
        "https://accounts.spotify.com/api/token",
        qs.stringify({
            grant_type: "refresh_token",
            refresh_token: process.env.SPOTIFY_REFRESH_TOKEN,
            client_id: process.env.SPOTIFY_CLIENT_ID,
            client_secret: process.env.SPOTIFY_CLIENT_SECRET,
        }),
        {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
        }
    );
    return response.data.access_token;
}
function formatTime(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
}
app.get("/api/now-playing", async (req, res) => {
    try {
        const accessToken = await getAccessToken();
        const response = await axios.get("https://api.spotify.com/v1/me/player/currently-playing?additional_types=episode", {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        if (response.status === 204 || !response.data || !response.data.item) {
            return res.json({ error: "galiba uyuyorum ya, veya öyle bir şey." });
        }
        const item = response.data.item;
        const progress = formatTime(response.data.progress_ms);
        const duration = formatTime(item.duration_ms);
        const trackLink = item.external_urls.spotify;
        
        if (item.type === "episode") {
            res.json({
                type: "podcast",
                name: item.name,
                artists: item.show.publisher || item.show.name,
                album: item.show.name,
                albumArt: item.images?.[0]?.url || item.show.images?.[0]?.url,
                progress,
                duration,
                trackLink,
            });
        } else {
            res.json({
                type: "track",
                name: item.name,
                artists: item.artists.map(artist => artist.name).join(", "),
                album: item.album.name,
                albumArt: item.album.images[0]?.url,
                progress,
                duration,
                trackLink,
            });
        }
    } catch (error) {
        res.status(500).json({ error: "spotify verilerime erişemedim." });
    }
});
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

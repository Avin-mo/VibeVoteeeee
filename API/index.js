import 'dotenv/config';
import express from 'express';
import SpotifyWebApi from 'spotify-web-api-node';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 3050;

app.use(cors());

const spotifyApi = new SpotifyWebApi({
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    redirectUri: process.env.REDIRECT_URL
});


app.get('/login', (req, res) => {
    const scopes = ['user-read-private', 'user-read-email', 'user-read-playback-state', 'user-modify-playback-state'];
    res.redirect(spotifyApi.createAuthorizeURL(scopes));
});


app.get('/callback', async (req, res) => {
    const code = req.query.code || null;
    try {
        const data = await spotifyApi.authorizationCodeGrant(code);
        spotifyApi.setAccessToken(data.body['access_token']);
        spotifyApi.setRefreshToken(data.body['refresh_token']);
        res.send('Login successful! You can now use the /search and /play endpoints.');
    } catch (error) {
        console.error('Error getting tokens:', error);
        res.status(500).send('Error getting tokens');
    }
});


app.get('/devices', async (req, res) => {
    try {
        const data = await spotifyApi.getMyDevices();
        res.json(data.body);
    } catch (error) {
        console.error('Error getting devices:', error);
        res.status(500).json({ error: "Failed to get devices" });
    }
});


app.get('/search', async (req, res) => {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: "Missing search query" });

    try {
        const searchData = await spotifyApi.searchTracks(q);
        res.json(searchData.body.tracks.items);
    } catch (error) {
        console.error('Search Error:', error);
        res.status(500).json({ error: "Search failed" });
    }
});


app.get('/play', async (req, res) => {
    const { uri, device_id } = req.query;
    if (!uri) return res.status(400).json({ error: "Missing song URI" });

    try {
      
        let deviceId = device_id;
        if (!deviceId) {
            const devices = await spotifyApi.getMyDevices();
            if (devices.body.devices.length > 0) {
                deviceId = devices.body.devices[0].id;
            } else {
                return res.status(400).json({ error: "No active devices found" });
            }
        }

      
        await spotifyApi.play({
            device_id: deviceId,
            uris: [uri]
        });

        res.json({ message: `Playback started on device ${deviceId}` });
    } catch (error) {
        console.error('Play Error:', error);
        res.status(500).json({ error: "Playback failed" });
    }
});

app.listen(port, () => {
    console.log(`Listening at http://localhost:${port}`);
});

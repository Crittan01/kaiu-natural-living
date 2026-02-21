import https from 'https';
import fs from 'fs';

const url = "https://drive.google.com/uc?export=download&id=1VfyK3Fx9AYRSwtO89IgugfO1LMxiPKSz";

https.get(url, (res) => {
    console.log("Status:", res.statusCode);
    console.log("Headers:", res.headers);
    if (res.statusCode === 303 || res.statusCode === 302) {
        console.log("Redirect URL:", res.headers.location);
    }
});

import fs from 'fs';

const TOKEN = "sbp_2c72da45da0c460b0ff06fb973d539362d7ad16f";
const PROJECT_REF = "ggohlcpajbumdfrqbwrp";

async function runQuery(sql) {
    const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/query`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: sql })
    });
    
    if (!res.ok) {
        console.error("Error status:", res.status);
        const text = await res.text();
        console.error("Error text:", text);
        return;
    }
    const data = await res.json();
    console.log("Success:", data);
}

runQuery("SELECT 1;");

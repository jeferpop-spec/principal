const URL = "https://ggohlcpajbumdfrqbwrp.supabase.co/rest/v1/medicos?select=*&limit=1";
const KEY = "sb_publishable_Io8PwEoIcGix_9UJPIeZuQ_tRngqhFl";

async function check() {
    const res = await fetch(URL, {
        headers: {
            'apikey': KEY,
            'Authorization': `Bearer ${KEY}`
        }
    });
    
    if (res.ok) {
        console.log("Table 'medicos' exists! Results:", await res.json());
    } else {
        console.log("Error or table does not exist:", res.status, await res.text());
    }
}
check();

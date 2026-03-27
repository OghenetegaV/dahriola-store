const apiKey = "sk_test_YOUR_KEY_HERE"; // Put your real key here temporarily
const url = "https://sandbox.api.terminal.africa/v1/health";

fetch(url, {
  headers: { "Authorization": `Bearer ${apiKey}` }
})
.then(res => res.json())
.then(data => console.log("CONNECTION SUCCESS:", data))
.catch(err => console.error("CONNECTION FAILED:", err));
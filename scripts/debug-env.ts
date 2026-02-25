
import "dotenv/config";

console.log("Checking API Key...");
const key = process.env.OPENAI_API_KEY;
if (key) {
    console.log("API Key found: " + key.substring(0, 10) + "...");
    console.log("Length: " + key.length);
} else {
    console.log("API Key NOT found");
console.log("DB URL: " + (process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 20) + "..." : "MISSING"));

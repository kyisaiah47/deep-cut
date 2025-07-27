// Test script for the Gemini API route
// Run this in your browser console or create a separate test file

async function testGeminiAPI() {
	try {
		console.log("🧪 Testing Gemini API...");

		const response = await fetch("/api/generate-theme", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				theme: "Horror Movies",
				roomCode: "TEST123",
			}),
		});

		console.log("📊 Response status:", response.status);
		console.log(
			"📊 Response headers:",
			Object.fromEntries(response.headers.entries())
		);

		const data = await response.json();
		console.log("📊 Response data:", data);

		if (response.ok) {
			console.log("✅ API test successful!");
		} else {
			console.log("❌ API test failed:", data.error);
		}

		return data;
	} catch (error) {
		console.error("💥 Test error:", error);
		return null;
	}
}

// Run the test
testGeminiAPI();

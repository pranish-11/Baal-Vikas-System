async function test() {
  try {
    const res = await fetch("http://localhost:8011/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "lena.kim@parent.edu",
        password: "password123"
      })
    });
    const data = await res.json();
    const token = data.token;
    
    console.log("Logged in as parent");

    // Try sending AI chat
    const chatRes = await fetch("http://localhost:8011/api/ai/chat", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}` 
      },
      body: JSON.stringify({
        message: "How is my child doing today?"
      })
    });
    
    const chatData = await chatRes.json();
    
    if (!chatRes.ok) throw new Error(JSON.stringify(chatData));

    console.log("AI Reply:", chatData);
  } catch (err) {
    console.error("Test failed:", err.message);
  }
}

test();

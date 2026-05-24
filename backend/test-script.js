async function test() {
  try {
    const res = await fetch("http://localhost:8011/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "anika.roy@axionschool.edu",
        password: "password123"
      })
    });
    const data = await res.json();
    const token = data.token;
    
    console.log("Logged in as teacher");
    
    // Get contacts to find a recipient
    const contactsRes = await fetch("http://localhost:8011/api/contacts", {
      headers: { Authorization: `Bearer ${token}` }
    });
    const contacts = await contactsRes.json();
    const parent = contacts.find(u => u.role === "PARENT");
    if (!parent) return console.log("No parent found");

    console.log(`Sending message to ${parent.name} (${parent.id})`);
    
    // Try sending a message
    const msgRes = await fetch("http://localhost:8011/api/messages/send", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}` 
      },
      body: JSON.stringify({
        recipientId: parent.id,
        content: "Hello from test script! If you see this, encryption is fixed!"
      })
    });
    
    const msgData = await msgRes.json();
    
    if (!msgRes.ok) throw new Error(JSON.stringify(msgData));

    console.log("Message sent:", msgData);
    console.log("TEST SUCCESS! Encryption is fixed!");
  } catch (err) {
    console.error("Test failed:", err.message);
  }
}

test();

async function run() {
  try {
    const response = await fetch("http://localhost:8080/adventure/new", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });
    console.log("Status:", response.status);
    const text = await response.text();
    console.log("Body:", text);
  } catch (err) {
    console.error("Error:", err);
  }
}

run();

const apiBaseUrl =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:3000/api";

export async function fetchEvents() {
  try {
    const response = await fetch(`${apiBaseUrl}/event`, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log("Response status:", response.status);
    console.log("Response headers:", response.headers);

    if (!response.ok) {
      throw new Error(`Failed to fetch events. Status: ${response.status}`);
    }

    // Ensure that the response is parsed as JSON
    return await response.json();
  } catch (error) {
    console.error("Error fetching events:", error);
    throw error;
  }
}

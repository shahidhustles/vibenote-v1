
/**
 * Action to interact with the Aryabhatta mathematical AI model
 * via the FastAPI server endpoints
 */

export interface AryabhattaRequest {
  prompt: string;
  max_tokens?: number;
  temperature?: number;
}

export interface AryabhattaResponse {
  response: string;
  status: string;
}

export interface AryabhattaError {
  error: string;
  status: string;
}

// The FastAPI server URL - adjust this based on your deployment
const ARYABHATTA_API_BASE =
  process.env.ARYABHATTA_API_URL || "http://localhost:8000";

/**
 * Send a query to the Aryabhatta model
 */
export async function queryAryabhatta(
  request: AryabhattaRequest
): Promise<AryabhattaResponse> {
  try {
    const response = await fetch(`${ARYABHATTA_API_BASE}/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: AryabhattaResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Error querying Aryabhatta:", error);
    throw new Error(
      `Failed to query Aryabhatta: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Solve a math or physics problem with Aryabhatta
 */
export async function solveWithAryabhatta(
  request: AryabhattaRequest
): Promise<AryabhattaResponse> {
  try {
    const response = await fetch(`${ARYABHATTA_API_BASE}/solve`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: AryabhattaResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Error solving with Aryabhatta:", error);
    throw new Error(
      `Failed to solve with Aryabhatta: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Get an explanation of a concept from Aryabhatta
 */
export async function explainWithAryabhatta(
  request: AryabhattaRequest
): Promise<AryabhattaResponse> {
  try {
    const response = await fetch(`${ARYABHATTA_API_BASE}/explain`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: AryabhattaResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Error explaining with Aryabhatta:", error);
    throw new Error(
      `Failed to explain with Aryabhatta: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Utility function to determine which Aryabhatta endpoint to use based on the query type
 */
export function determineAryabhattaEndpoint(
  query: string
): "solve" | "explain" | "query" {
  const lowerQuery = query.toLowerCase();

  // Keywords that suggest this is a problem to solve
  const solvingKeywords = [
    "solve",
    "calculate",
    "find",
    "compute",
    "determine",
    "what is",
    "how much",
    "evaluate",
    "simplify",
    "derive",
    "prove",
    "show that",
    "verify",
  ];

  // Keywords that suggest this is a concept to explain
  const explainKeywords = [
    "explain",
    "what does",
    "define",
    "describe",
    "how does",
    "why does",
    "what are",
    "meaning of",
    "concept of",
    "principle of",
    "theory of",
  ];

  const hasSolvingKeywords = solvingKeywords.some((keyword) =>
    lowerQuery.includes(keyword)
  );
  const hasExplainKeywords = explainKeywords.some((keyword) =>
    lowerQuery.includes(keyword)
  );

  if (hasSolvingKeywords) return "solve";
  if (hasExplainKeywords) return "explain";
  return "query"; // Default to general query
}

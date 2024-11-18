import express, { Request } from "express";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

const app = express();
app.use(express.json());
app.use(cookieParser());

interface CustomRequest extends Request {
  origin?: string;
}

app.use((req: CustomRequest, res, next) => {
  req.origin = req.headers["x-forwarded-proto"]
    ? `${req.headers["x-forwarded-proto"]}://${req.headers["x-forwarded-host"] || req.headers.host}`
    : `${req.protocol}://${req.headers.host}`;
  next();
});

app.get("/api/userinfo", async (req: CustomRequest, res) => {
  const { access_token, discovery_endpoint } = req.cookies;

  if (!access_token) return res.sendStatus(401);

  try {
    const configuration = (await (await fetch(discovery_endpoint)).json()) as {
      userinfo_endpoint: string;
    };
    const { userinfo_endpoint } = configuration;

    const userinfoRes = await fetch(userinfo_endpoint, {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!userinfoRes.ok) {
      return res
        .status(userinfoRes.status)
        .json({ error: "Failed to fetch user info" });
    }

    const userinfo = await userinfoRes.json();
    res.status(200).json(userinfo);
  } catch (error) {
    console.error("Error fetching user info:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/api/login", (req, res) => {
  const { access_token, discovery_endpoint } = req.body;
  res.cookie("access_token", access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });
  res.cookie("discovery_endpoint", discovery_endpoint, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });
  res.sendStatus(201);
});

app.get("/api/login/end_session", async (req, res) => {
  res.clearCookie("access_token");
  res.clearCookie("discovery_endpoint");
  res.redirect("/");
});

app.get("/api/login/google/start", async (req: CustomRequest, res) => {
  const discovery_endpoint =
    "https://accounts.google.com/.well-known/openid-configuration";
  const configuration = await fetch(discovery_endpoint);
  const { authorization_endpoint } = (await configuration.json()) as {
    authorization_endpoint: string;
  };

  const parameters: Record<string, string> = {
    response_type: "code",
    scope: "openid profile email",
    client_id: GOOGLE_CLIENT_ID!,
    redirect_uri:
      req.protocol + "://" + req.get("host") + "/login/google/callback",
  };

  const authorization_url = `${authorization_endpoint}?${new URLSearchParams(parameters)}`;

  res.redirect(authorization_url);
});

app.get("/api/login/google/callback", async (req: CustomRequest, res) => {
  const { error, error_description, code } = req.query;

  if (error) {
    return res.status(400).json({
      status: "error",
      error,
      error_description,
    });
  }

  if (code) {
    try {
      const discovery_endpoint =
        "https://accounts.google.com/.well-known/openid-configuration";
      const configuration = await fetch(discovery_endpoint);
      const { token_endpoint } = (await configuration.json()) as {
        token_endpoint: string;
      };

      const tokenResult = await fetch(token_endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          client_id: GOOGLE_CLIENT_ID!,
          client_secret: GOOGLE_CLIENT_SECRET!,
          code: code as string,
          redirect_uri: req.origin + "/api/login/google/callback",
        }),
      });

      if (tokenResult.ok) {
        const { access_token } = (await tokenResult.json()) as {
          access_token: string;
        };

        res.cookie("access_token", access_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
        });
        res.cookie("discovery_endpoint", discovery_endpoint, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
        });

        return res.redirect("/");
      } else {
        const errorJson = await tokenResult.json();
        return res.status(400).json({ status: "error", error: errorJson });
      }
    } catch (error) {
      console.error("Error fetching the token:", error);
      return res
        .status(500)
        .json({
          status: "error",
          error: "Failed to exchange authorization code for tokens",
        });
    }
  }

  return res
    .status(400)
    .json({ status: "error", error: "No authorization code received" });
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server running on port " + (process.env.PORT || 3000));
});

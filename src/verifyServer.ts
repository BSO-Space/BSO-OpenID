import express from "express";
import { Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { readFileSync } from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

// โหลด public key จากไฟล์
const publicKey = readFileSync(path.join(__dirname, "../public.pem"), "utf8");

// ฟังก์ชันตรวจสอบ token โดยใช้ public key
function verifyToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, publicKey, {
      algorithms: ["RS256"],
    }) as JwtPayload;
    return decoded;
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}

// Endpoint สำหรับตรวจสอบ Access Token
app.post("/verify-access-token", (req: Request, res: Response): any => {
  const { accessToken } = req.body;

  console.log("Access token:", accessToken);

  if (!accessToken) {
    return res.status(400).json({ message: "Access token is required" });
  }

  const decoded = verifyToken(accessToken);

  if (decoded) {
    res.json({ message: "Access token is valid", decoded });
  } else {
    res.status(401).json({ message: "Invalid or expired access token" });
  }
});

// Endpoint สำหรับตรวจสอบ Refresh Token
app.post("/verify-refresh-token", (req: Request, res: Response): any => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ message: "Refresh token is required" });
  }

  const decoded = verifyToken(refreshToken);

  if (decoded) {
    res.json({ message: "Refresh token is valid", decoded });
  } else {
    res.status(401).json({ message: "Invalid or expired refresh token" });
  }
});

const PORT = process.env.VERIFY_SERVER_PORT || 4000;
app.listen(PORT, () => {
  console.log(
    `Token Verification Server running on port http://localhost:${PORT}`
  );
});

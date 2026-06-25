import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "path";
import fs from "fs";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// Serve APK download — file must be placed at artifacts/api-server/public/app.apk
app.get("/app.apk", (_req, res) => {
  const apkPath = path.join(__dirname, "..", "public", "app.apk");
  if (!fs.existsSync(apkPath)) {
    res.status(404).json({ error: "APK no disponible aún. Súbelo a artifacts/api-server/public/app.apk" });
    return;
  }
  res.setHeader("Content-Type", "application/vnd.android.package-archive");
  res.setHeader("Content-Disposition", 'attachment; filename="MiBancolombia.apk"');
  res.sendFile(apkPath);
});

export default app;

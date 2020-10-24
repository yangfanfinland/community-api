import path from "path";

const MONGO_USERNAME = process.env.DB_USER || "fan";
const MONGO_PASSWORD = process.env.DB_PASS || "9rjaFvus";
const MONGO_HOSTNAME = process.env.DB_HOST || "127.0.0.1" || "40.85.119.8";
const MONGO_PORT = process.env.DB_PORT || "27017";
const DB_NAME = process.env.DB_NAME || "community";

// const DB_URL = `mongodb://${MONGO_USERNAME}:${MONGO_PASSWORD}@${MONGO_HOSTNAME}:${MONGO_PORT}/${DB_NAME}`;
const DB_URL = `mongodb://${MONGO_HOSTNAME}:${MONGO_PORT}/${DB_NAME}`;

// console.log('DB_URL', DB_URL)

const REDIS = {
  host: process.env.REDIS_HOST || "127.0.0.1" || "40.85.119.8",
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASS
};

const JWT_SECRET =
  "&Vi%33pG2mD51xMo%OUOTo$ZWOa3TYt328tcjXtW9&hn%AOb9quwaZaRMf#f&44c";

const baseUrl =
  process.env.NODE_ENV === "production"
    ? "http://40.85.119.8:8080"
    : "http://localhost:8080";

const uploadPath =
  process.env.NODE_ENV === "production"
    ? "/app/public"
    : path.join(path.resolve(__dirname), "../../public");

const adminEmail = ["yangfanfinland@gmail.com"];

const publicPath = [
  /^\/public/,
  /^\/login/,
  /^\/content/,
  /^\/user/,
  /^\/comments/,
];

const isDevMode = process.env.NODE_ENV !== "production";

const port = 3000;
const wsPort = 3001;

export default {
  DB_NAME,
  MONGO_HOSTNAME,
  DB_URL,
  REDIS,
  JWT_SECRET,
  baseUrl,
  uploadPath,
  adminEmail,
  publicPath,
  isDevMode,
  port,
  wsPort,
};

DROP TABLE IF EXISTS "OnCallSchedule";

CREATE TABLE "SupportCall" (
    "id"          TEXT NOT NULL PRIMARY KEY,
    "userId"      TEXT NOT NULL,
    "name"        TEXT NOT NULL,
    "email"       TEXT NOT NULL,
    "topic"       TEXT NOT NULL,
    "description" TEXT,
    "preferredAt" DATETIME NOT NULL,
    "timezone"    TEXT NOT NULL DEFAULT 'UTC',
    "status"      TEXT NOT NULL DEFAULT 'pending',
    "createdAt"   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SupportCall_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

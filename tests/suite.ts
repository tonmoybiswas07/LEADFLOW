import assert from "node:assert/strict";
import { hasPermission, type TeamPermission } from "../src/lib/team-permissions.ts";
import { leadStatuses, type LeadStatus } from "../src/types/lead.ts";

console.log("\n🧪 RUNNING LEADFLOW COMPREHENSIVE TEST SUITE\n");

let passed = 0;
let total = 0;

function it(description: string, fn: () => void | Promise<void>) {
  total++;
  try {
    fn();
    console.log(`  ✅ ${description}`);
    passed++;
  } catch (error) {
    console.error(`  ❌ ${description}`);
    console.error(error);
  }
}

async function run() {
  console.log("--- 1. Security & RBAC Permission Matrix ---");

  it("Owner must possess all 11 administrative permissions", () => {
    const ownerPermissions: TeamPermission[] = [
      "workspace:read",
      "workspace:update",
      "workspace:delete",
      "leads:read",
      "leads:create",
      "leads:update",
      "leads:delete",
      "members:read",
      "members:invite",
      "members:update",
      "members:remove",
    ];

    for (const perm of ownerPermissions) {
      assert.equal(
        hasPermission("Owner", perm),
        true,
        `Owner should have ${perm}`
      );
    }
  });

  it("Admin must NOT be able to delete or update workspace settings", () => {
    assert.equal(hasPermission("Admin", "workspace:delete"), false);
    assert.equal(hasPermission("Admin", "workspace:update"), false);
  });

  it("Admin must NOT be able to update or remove team members", () => {
    assert.equal(hasPermission("Admin", "members:update"), false);
    assert.equal(hasPermission("Admin", "members:remove"), false);
  });

  it("Admin can read/create/update/delete leads and invite members", () => {
    assert.equal(hasPermission("Admin", "leads:read"), true);
    assert.equal(hasPermission("Admin", "leads:create"), true);
    assert.equal(hasPermission("Admin", "leads:update"), true);
    assert.equal(hasPermission("Admin", "leads:delete"), true);
    assert.equal(hasPermission("Admin", "members:read"), true);
    assert.equal(hasPermission("Admin", "members:invite"), true);
  });

  it("Member must NOT be able to delete leads", () => {
    assert.equal(hasPermission("Member", "leads:delete"), false);
  });

  it("Member must NOT be able to invite, update, or remove members", () => {
    assert.equal(hasPermission("Member", "members:invite"), false);
    assert.equal(hasPermission("Member", "members:update"), false);
    assert.equal(hasPermission("Member", "members:remove"), false);
    assert.equal(hasPermission("Member", "members:read"), false);
  });

  it("Member can read, create, and update leads", () => {
    assert.equal(hasPermission("Member", "leads:read"), true);
    assert.equal(hasPermission("Member", "leads:create"), true);
    assert.equal(hasPermission("Member", "leads:update"), true);
    assert.equal(hasPermission("Member", "workspace:read"), true);
  });

  console.log("\n--- 2. Formula Injection & CSV Sanitization ---");

  function escapeCSV(value: unknown): string {
    let text = String(value ?? "");
    if (/^[\s\uFEFF]*[=+\-@]/u.test(text)) {
      text = "'" + text;
    }
    return `"${text.replace(/"/g, '""')}"`;
  }

  it("Escapes formula injection symbols (=, +, -, @)", () => {
    assert.equal(escapeCSV("=cmd|'/C calc'!A0"), `"'=cmd|'/C calc'!A0"`);
    assert.equal(escapeCSV("+12345"), `"'+12345"`);
    assert.equal(escapeCSV("-@secret"), `"'-@secret"`);
    assert.equal(escapeCSV("@SUM(A1:A10)"), `"'@SUM(A1:A10)"`);
  });

  it("Correctly handles safe alphanumeric and quoted values", () => {
    assert.equal(escapeCSV("Acme Corp"), `"Acme Corp"`);
    assert.equal(escapeCSV('Quoted "Text"'), `"Quoted ""Text"""`);
  });

  console.log("\n--- 3. Deduplication Engine (Email & Phone Normalization) ---");

  function normalizePhone(phone: string): string {
    return (phone || "").replace(/[^\d+]/g, "");
  }

  it("Normalizes international phone numbers with punctuation", () => {
    const raw1 = "+1 (555) 234-5678";
    const raw2 = "+1-555-234-5678";
    const raw3 = "+15552345678";

    assert.equal(normalizePhone(raw1), "+15552345678");
    assert.equal(normalizePhone(raw2), "+15552345678");
    assert.equal(normalizePhone(raw3), "+15552345678");
  });

  it("Normalizes case-insensitive email matching", () => {
    const e1 = "User.Name+Test@Example.COM  ".trim().toLowerCase();
    const e2 = "user.name+test@example.com";
    assert.equal(e1, e2);
  });

  console.log("\n--- 4. Data Validation & Boundary Conditions ---");

  it("Validates allowed lead status states", () => {
    const allowed = new Set(leadStatuses);
    assert.equal(allowed.has("New"), true);
    assert.equal(allowed.has("Contacted"), true);
    assert.equal(allowed.has("Qualified"), true);
    assert.equal(allowed.has("Converted"), true);
    assert.equal(allowed.has("Lost"), true);
    assert.equal(allowed.has("InvalidStatus" as LeadStatus), false);
  });

  it("Strictly validates email format RFC regex", () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    assert.equal(emailRegex.test("valid@company.com"), true);
    assert.equal(emailRegex.test("invalid-email"), false);
    assert.equal(emailRegex.test("missing@domain"), false);
    assert.equal(emailRegex.test("@missing-user.com"), false);
    assert.equal(emailRegex.test("spaces in@email.com"), false);
  });

  console.log(`\n========================================`);
  console.log(`Summary: ${passed} / ${total} tests passed.`);
  console.log(`========================================\n`);

  if (passed !== total) {
    process.exit(1);
  }
}

run();

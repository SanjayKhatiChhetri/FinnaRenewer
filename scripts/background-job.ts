import { renewAllUsers } from "@/server/jobs/renew-all";
import { syncAllUsersAndNotify } from "@/server/jobs/sync-all";

const jobs = {
  renew: async () => {
    const results = await renewAllUsers();
    return {
      results,
      failed: results.filter((r) => r.status === "error").length,
    };
  },
  sync: async () => {
    const results = await syncAllUsersAndNotify();
    return { results, failed: results.filter((r) => r.errors > 0).length };
  },
};

async function main() {
  const name = process.argv[2];
  if (name !== "renew" && name !== "sync") {
    console.error("Usage: background-job <renew|sync>");
    process.exit(2);
  }

  const { results, failed } = await jobs[name]();
  console.log(
    JSON.stringify({ job: name, at: new Date().toISOString(), results }),
  );
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

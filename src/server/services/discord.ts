import type { Loan, RenewalResult } from "@/server/finna/types";
import { truncate, formatFinnishDate, daysUntilDue } from "@/lib/utils";

const COLOR_GREEN = 0x57f287;
const COLOR_RED = 0xed4245;
const COLOR_YELLOW = 0xfee75c;
const COLOR_BLUE = 0x5865f2;

interface DiscordEmbed {
  title: string;
  description: string;
  color: number;
  footer?: { text: string };
}

export async function sendDiscordWebhook(
  webhookUrl: string,
  embed: DiscordEmbed
): Promise<void> {
  const resp = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ embeds: [embed] }),
  });

  if (resp.status !== 200 && resp.status !== 204) {
    throw new Error(`Discord webhook HTTP ${resp.status}`);
  }
}

export function buildRenewalEmbed(results: RenewalResult[]): DiscordEmbed {
  let renewed = 0;
  let failed = 0;
  for (const r of results) {
    if (r.success) renewed++;
    else failed++;
  }

  let color = COLOR_GREEN;
  let title = `Renewal complete — ${renewed}/${results.length} renewed`;
  if (failed > 0 && renewed === 0) {
    color = COLOR_RED;
    title = `Renewal failed — 0/${results.length} renewed`;
  } else if (failed > 0) {
    color = COLOR_YELLOW;
    title = `Renewal partial — ${renewed} renewed, ${failed} failed`;
  }

  const lines: string[] = [];
  for (const r of results) {
    if (r.success && r.newDueDate) {
      const delta = Math.floor(
        (r.newDueDate.getTime() - r.loan.dueDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      lines.push(
        `**${truncate(r.loan.title, 80)}**\n` +
          `Was due: ${formatFinnishDate(r.loan.dueDate)}\n` +
          `Now due: ${formatFinnishDate(r.newDueDate)}\n` +
          `Extended: ${delta} days`
      );
    } else {
      lines.push(
        `**${truncate(r.loan.title, 80)}**\n${r.errorMessage ?? "Unknown error"}`
      );
    }
  }

  return {
    title,
    description: lines.join("\n\n"),
    color,
    footer: { text: `Oula Finna · ${formatFinnishDate(new Date())}` },
  };
}

export function buildUpcomingEmbed(loans: Loan[], daysThreshold: number): DiscordEmbed {
  const lines = [`No loans due within **${daysThreshold} days**.`, `You have **${loans.length}** loans.`];

  return {
    title: "Finna check-in — nothing to renew",
    description: lines.join("\n"),
    color: COLOR_BLUE,
    footer: { text: `Oula Finna · ${formatFinnishDate(new Date())}` },
  };
}

export function buildErrorEmbed(error: string): DiscordEmbed {
  return {
    title: "Finna renewer error",
    description: `\`\`\`\n${error}\n\`\`\``,
    color: COLOR_RED,
    footer: { text: `Oula Finna · ${formatFinnishDate(new Date())}` },
  };
}

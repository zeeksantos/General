---
name: daily-meta-ads-sheet-update
description: Updates the daily Messages and Ads Spent columns in the Google Sheet "Vistaland Team VDO (Masterfile) 2026" from the Meta ad account VDO Vantage Ads (ID 1359615401789744). Use this whenever the user asks to update, refresh, sync or backfill the Vistaland / VDO daily ad numbers, Meta spend, or messaging conversations in the masterfile, or when a scheduled daily run fires for it, even if they don't name the sheet or the tabs.
---

# Daily Meta Ads to Vistaland Masterfile

Pull each day's Amount Spent and Messaging Conversations Started from Meta and write them into the month tab of the masterfile, so the team's dashboard numbers stay current without manual copying.

## Fixed references

- Sheet: "Vistaland Team VDO (Masterfile) 2026", spreadsheet ID `1t4oT0nQH4mJbSvlonDu9HUFtURc4hb_kCBGY0B_elDs`
- Meta ad account: VDO Vantage Ads, ID `1359615401789744`, currency PHP
- Tabs are named `<Month> 2026` (`August 2026`, `September 2026`, `October 2026`, ...). Read the Sheets-connector reference of the `anthropic-skills:google-workspace` skill before the first write.

## Sheet layout (do not change it)

| Column | Content | Who fills it |
|---|---|---|
| A | Month name (first row only) | already there |
| B | Day of month as text (1 to 31) | already there |
| **C** | **Messages** | **this skill** |
| **D** | **Ads Spent** | **this skill** |
| E:L | Zoom, viewing, lead and deal counts | the team, by hand. Never touch. |
| M, N, S | Formulas (cost per message, leads per agent, summary) | formulas. Never overwrite. |

The row for day `d` is `d + 1` (day 1 is row 2). Write only `C:D`. Overwriting the formula columns would reintroduce the `#DIV/0!` errors that were fixed on 2026-10-16 (they now use `=IF(C=0,0,D/C)`).

## Steps

1. **Pick the window.** Default is the last 7 complete days, ending yesterday (use today's date from the session; skip today, it is partial). Meta's 7-day attribution keeps adding conversations to recent days, so re-writing the trailing week keeps recent numbers correct. If the user gives a range, use that instead. A window can span two months; split it by tab.

2. **Pull spend.** Call `ads_get_ad_entities` at `level: ad_account`, `fields: ["id","name","amount_spent"]`, `time_range` for the window and `time_increment: "1"`. This gives one row per day, including days with zero spend. Use `advertiser_job: report_measure_or_look_up`.

3. **Pull messaging conversations.** The account level has no per-day messaging field, so call `ads_get_ad_entities` at `level: campaign` with `fields: ["id","amount_spent","results"]`, the same `time_range`, `time_increment: "1"`, `limit: 1000`.
   - Each row's `results.indicator` says what the campaign counts. Sum `results.values[0].value` per `date_start` only where the indicator contains `messaging_conversation_started`. Campaigns whose indicator is `reach` (the hiring awareness campaign) are not messages; leave them out of Messages but keep their spend in Ads Spent, because Ads Spent is the account total.
   - Do not add a spend filter such as `amount_spent > 0`. A campaign can show messages on a day with no spend (late attribution), and the filter would drop them.
   - Large results are saved to a file by the tool. Aggregate it with `jq`, guarding nulls with `// "0"`, rather than reading it into context.
   - Do not use Supermetrics. The team's trial expired and it errors.

4. **Check before writing.** Per-day spend from step 3 must match step 2. Confirm every day in the window has a row in both. If a Meta call fails or returns nothing, stop and report it. Never write zeros for a failed pull, because a zero looks like a real day with no ads.

5. **Write.** One `update_values` call per tab per contiguous range, for example `'October 2026'!C10:D16`, with `[[messages, spend], ...]` as numbers (not strings), spend rounded to 2 decimals. If a needed month tab does not exist, tell the user and skip that month; do not create tabs.

6. **Verify.** Read the written range back with `get_values`. Check that C and D match what you sent, and read `M` and the summary cells (`R1:S19`) for any `#DIV/0!`, `#REF!` or `#VALUE!`. Report any error rather than patching around it.

7. **Report briefly.** Say which dates were written, the window's total messages and spend, and anything odd: days with zero spend, days with messages but no spend, or an awareness campaign's spend included in the total. Link the sheet by its title.

## Known quirks to mention only when relevant

- The summary header on each tab still reads "Overall Summary (August 1 - 15)" and Average CPM in `S5` is `=SUM(M2:M15)/14`, so it only covers days 1 to 14. This is the user's existing design; flag it if they ask why the monthly CPM looks off, and offer to change it, but do not change it unprompted.
- Messages from before 2026-08-15 in the August tab were typed by hand and may not match Meta exactly. Do not overwrite them unless the user asks for a backfill.

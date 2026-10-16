---
name: daily-meta-ads-sheet-update
description: Updates the Google Sheet "Vistaland Team VDO (Masterfile) 2026" - daily Messages and Ads Spent from the Meta ad account VDO Vantage Ads (ID 1359615401789744), lead and deal counts (Zoom, Viewing, Dump, Warm, Hot, Closed) from Pancake conversation tags, and each month's Overall Summary block. Use this whenever the user asks to update, refresh, sync, fill or backfill the Vistaland / VDO masterfile, its daily ad numbers, lead columns, Pancake tags or monthly summary, or when a scheduled daily run fires for it, even if they don't name the sheet or the tabs.
---

# Vistaland VDO Masterfile Update

Keep the masterfile current: Messages and Ads Spent from Meta, lead and deal counts from Pancake tags, and a monthly Overall Summary that recalculates from the daily rows.

## Fixed references

- Sheet: "Vistaland Team VDO (Masterfile) 2026", spreadsheet ID `1t4oT0nQH4mJbSvlonDu9HUFtURc4hb_kCBGY0B_elDs`
- Meta ad account: VDO Vantage Ads, ID `1359615401789744`, currency PHP
- Pancake page: Property Uptrends, tag statistics at `https://pancake.ph/PropertyUptrends/statistic/tag`
- Tabs are named `<Month> 2026` (`July 2026`, `August 2026`, `September 2026`, `October 2026`, ...). Read the Sheets-connector reference of the `anthropic-skills:google-workspace` skill before the first write.

## Sheet layout

August 2026 onward:

| Column | Content | Source |
|---|---|---|
| A | Month name (first row only) | already there |
| B | Day of month (1 to 31) | already there |
| C | Messages | Meta (Part A) |
| D | Ads Spent | Meta (Part A) |
| E | Zoom Sched | Pancake tag `Zoom Sched` (Part B) |
| F | Zoom Done | Pancake tag `Zoom Done` |
| G | Viewing Sched | Pancake tag `Viewing Sched` |
| H | Viewing Done | Pancake tag `Viewing Done` |
| I | Dump Leads | Pancake tag `Dump Leads` |
| J | Warm | Pancake tag `WARM` |
| K | Hot | Pancake tag `HOT` |
| L | Closed Deal | Pancake tag `Closed Deal` |
| M, N | Formulas (cost per message, leads per agent) | never overwrite |
| R:S (rows 1-19) | Overall Summary block | Part C |

July 2026 is different: it has **no Dump Leads column** (I = Warm, J = Hot, K = Closed Deal, L = Average CPM) and its summary sits in **Q:R** instead of R:S. Only days 23-31 have data; rows for days 1-22 are greyed out.

The row for day `d` is `d + 1` (day 1 is row 2). Write numbers, not strings.

## Part A: Messages and Ads Spent (Meta)

1. **Pick the window.** Default is the last 7 complete days ending yesterday (Asia/Manila date; skip today, it is partial). Meta's 7-day attribution keeps adding conversations to recent days, so re-writing the trailing week keeps recent numbers correct. If the user gives a range, use that. A window can span two months; split it by tab.

2. **Pull spend.** `ads_get_ad_entities` at `level: ad_account`, `fields: ["amount_spent"]`, `time_range` for the window, `time_increment: "1"`, `advertiser_job: report_measure_or_look_up`. One row per day, including zero-spend days.

3. **Pull messaging conversations.** `ads_get_ad_entities` at `level: campaign`, `fields: ["id","name","amount_spent","results"]`, same `time_range`, `time_increment: "1"`, `limit: 1000`.
   - Sum `results.values[0].value` per `date_start` only where `results.indicator` contains `messaging_conversation_started`. The hiring awareness campaign's indicator is `reach`: leave it out of Messages but keep its spend (Ads Spent is the account total).
   - Do not filter out zero-spend campaigns. Late-attributed messages can land on days with no spend.
   - Large results are saved to a file. Aggregate them with a script (`python3 -I` or `jq`) rather than reading them into context.
   - Do not use Supermetrics (trial expired).

4. **Check before writing.** Per-day campaign spend must match the account totals, and every day in the window needs a row. If a Meta call fails or returns nothing, stop and report it. Never write zeros for a failed pull. Zeros from a successful pull are real (for example, ads were off Sep 10-24, 2026).

5. **Write** columns C:D only, one `update_values` call per tab, e.g. `'October 2026'!C11:D17`, spend rounded to 2 decimals.

## Part B: Lead and deal counts (Pancake)

Pancake has no connector. Read it through **Claude in Chrome** in the Chrome profile that is signed in to the right Pancake account.

- Use `list_connected_browsers` and pick the Chrome whose Pancake login can open Property Uptrends Analytics. The user's default Chrome profile is signed in to a different Google account that cannot. If several browsers are connected, ask with `AskUserQuestion` (one option per browser plus the "Open a confirmation screen..." option), then `select_browser`.
- The built-in browser pane could not load pancake.vn / pancake.ph; use Chrome.
- If Analytics shows "Error code 122 - Your subscription has expired", that login is the wrong account (or the plan lapsed). Stop and tell the user; never touch subscription or plan pages.
- A scheduled run in the cloud usually cannot reach the user's Chrome. If no Chrome is reachable, do Part A and Part C, skip Part B, and say so in the report.

Steps:

1. Open `https://pancake.ph/PropertyUptrends` and click **Analytics** in the top nav, then **Tags** in the left sidebar (direct URLs to `/statistic/tags` 404; the working route is `/statistic/tag`, reached by clicking).
2. Set the date range with the picker at the top (it shows "7 days ago" by default). Presets "This month" and "Last month" work; for older months click the `<` arrow, click day 1, click the last day, then **Select**. Confirm the header shows the full range (e.g. `1/8/2026 - 00:00 -> 31/8/2026 - 23:59`).
3. The "Detailed tag statistics" table is a virtual list; rows render only as you scroll. Collect it with this script via `javascript_tool`:

   ```js
   const holder = document.querySelector('.ant-table-tbody-virtual-holder');
   const hdr = [...document.querySelectorAll('th')].find(t => t.innerText.trim() === 'Tags').closest('tr');
   const H = [...hdr.querySelectorAll('th')].map(c => c.innerText.trim());
   const out = {};
   holder.scrollTop = 0; await new Promise(r => setTimeout(r, 400));
   for (let i = 0; i < 200; i++) {
     document.querySelectorAll('.ant-table-row.row_tag_data').forEach(r => {
       const cells = [...r.children].map(c => c.innerText.trim()); out[cells[0]] = cells; });
     const prev = holder.scrollTop; holder.scrollTop += 150;
     await new Promise(r => setTimeout(r, 250)); if (holder.scrollTop === prev) break;
   }
   JSON.stringify({H, d: ['Zoom Sched','Zoom Done','Viewing Sched','Viewing Done','Dump Leads','WARM','HOT','Closed Deal']
     .map(k => (out[k] || ['MISSING']).map((v, i) => v ? i + ':' + v : null).filter(Boolean))})
   ```

   Header `H` gives the dates (`DD/MM`); in each row, index `i` is the column for `H[i]`, and the last index is the Total. Blank cells mean 0.
4. **Counting rule.** Pancake's daily numbers are net tags (added minus removed), so some days are negative. Write **negative days as 0** (the day's new tags). This matches how the team filled Aug 1-14 by hand. Mention in the report how far the sheet total differs from Pancake's net total when a negative day was zeroed.
5. **Don't overwrite manual entries.** Only fill E:L cells that are empty, unless the user asks to re-pull. Aug 1-14, 2026 were entered by hand; leave them.
6. Write E:L for the days (`update_values`, e.g. `'October 2026'!E2:L17`). For July, map Warm/Hot/Closed to I/J/K and skip Dump Leads.
7. **Flag outliers** instead of silently writing them. Example: Zoom Sched showed 69 on Sep 30, 2026, against 0-1 on every other day, which looks like a bulk re-tag. It was written as-is and flagged to the user.

## Part C: Overall Summary block

Each month tab has a summary block (August onward: labels in R, values in S; July: labels in Q, values in R). It must stay formula-driven so it recalculates when the daily rows change. If the values column is empty or broken, write these formulas (August onward shown; for July shift to column R and use July's column letters, with `N/A` for both Dump rows):

| Row | Label | Formula |
|---|---|---|
| 1 | Overall Summary | (header) |
| 2 | Messages Received | `=SUM (C2:C32)` |
| 3 | Amount Spent | `=SUM (D2:D32)` |
| 5 | Average CPM | `=IFERROR(AVERAGEIF(M2:M32,">0"),0)` (format `"₱"#,##0.00`) |
| 6 | Average Viewing Sched | `=IFERROR(S11/COUNTIF(C2:C32,">0"),0)` (format `0.00`) |
| 7 | Warm Lead Rate | `=IFERROR(S14/S2,0)` |
| 8 | Hot Lead Rate | `=IFERROR(S15/S2,0)` |
| 9 | Dump Lead Rate | `=IFERROR(S13/S2,0)` |
| 11 | Viewing Schedule | `=SUM (G2:G32)` |
| 12 | Viewing Done | `=SUM (H2:H32)` |
| 13 | Dump Leads | `=SUM (I2:I32)` |
| 14 | Warm Leads | `=SUM (J2:J32)` |
| 15 | Hot Leads | `=SUM (K2:K32)` |
| 16 | Closed Deals | `=SUM (L2:L32)` |
| 18 | Gross Sales | typed by the user; never overwrite a value that is there |
| 19 | ROAS | `=IFERROR(S18/S3,0)` |

- Gross Sales is manual. If it is blank but was known before, restore it and say so (August 2026 = ₱7,000,000). Otherwise leave 0 and ask the user.
- July keeps the user's Average CPM formula `=SUM (L24:L32)/9`.
- For a new month tab, copy formatting from the August block (`copyPaste` with `PASTE_FORMAT`, August R1:S19) before writing formulas.
- Write the summary only when it is missing or broken, or the user asks. A normal daily run only checks it.

## Verify and report

1. Read back what you wrote with `get_values` and check it matches.
2. Read column M and the summary block for `#DIV/0!`, `#REF!` or `#VALUE!`. Report errors rather than patching around them.
3. Report briefly: dates written, the window's total messages and spend, lead counts added, and anything odd: zero-spend days, messages on days with no spend, negative Pancake days set to 0, outliers, skipped Part B, or Meta days that came back empty.

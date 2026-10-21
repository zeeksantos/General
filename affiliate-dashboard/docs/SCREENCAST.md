# App Review screencast script

One continuous recording (about 3 to 4 minutes) that shows every permission being requested and where its data appears.
Record the **live site** (not demo mode) with a **real test account** that has a Facebook Page, a linked Instagram
Business/Creator account, and a few videos from the last 90 days. Narrate in English (voice-over or on-screen captions).

## Before you record
- [ ] `DEMO_MODE` is deleted, the site is redeployed, and Vercel deployment protection is off for Production.
- [ ] The test account is added to the Meta app as Developer/Tester and has accepted the invite.
- [ ] Use a clean browser window (no other tabs, no bookmarks bar, notifications off). 1920×1080, browser zoom 100%.
- [ ] Log out of Facebook in that browser first, so the full login and permission dialog is shown.
- [ ] Sign out of the dashboard and make sure the test account has **no** connections yet (press Disconnect on any old ones).
- [ ] Never show: the Supabase or Vercel dashboards, DevTools, env vars, tokens, or your email inbox beyond the magic-link email.
- [ ] Do a dry run once. Press **Sync now** during the dry run so you know roughly how long it takes.

## Script

| Time | On screen | Say (voice-over / caption) |
|---|---|---|
| 0:00 | Browser at the site's login page | "This is the Z-Fast Affiliate Dashboard. Affiliates and UGC creators use it to see which of their own Facebook and Instagram videos perform best. Each user only ever sees their own data." |
| 0:15 | Type the email, press **Send magic link**. Open the email and click the link. | "Users sign in with a magic link sent to their email. No password is stored." |
| 0:30 | Dashboard, **Your accounts** card with nothing connected | "A new user has no accounts connected. To get started they press Connect Facebook and Instagram." |
| 0:40 | Click **Connect Facebook & Instagram**. The Facebook login and permission dialog opens. **Pause on it and scroll through every permission.** | "Facebook asks the user to approve exactly the permissions we need, and the user chooses which Page and Instagram account to share." |
| 1:00 | In the dialog, select the Page and the Instagram account, then continue. | "We request six permissions. I'll show where each one is used." |
| 1:10 | **Choose your Facebook Page** screen. Point at the Page name and the Instagram handle. | "**pages_show_list**: lists the Pages this user manages so they can choose which one to connect. **instagram_basic**: identifies the Instagram professional account linked to that Page, shown here." |
| 1:25 | Click **Connect**. Back on the dashboard, show both accounts in **Your accounts**. | "The Page and the Instagram account are now connected. Access tokens are stored encrypted on our server and are never shown in the browser." |
| 1:35 | Click **Sync now**. Wait for the result (cut the wait in editing if long). Show **Last synced**. | "We now fetch the videos from the last 90 days and their statistics. This also runs once a day." |
| 1:50 | Scroll to the **KPI cards**: Total views, Total reach, Link clicks. | "**read_insights**: reads views, reach and link clicks for the user's Facebook videos. These totals add up the user's own videos for the selected period." |
| 2:05 | Show the **trend charts**, then change the period (Last 7 days, then This month). | "The charts compare Facebook and Instagram, and the period selector changes all the numbers." |
| 2:20 | **Top videos** table. Click the **Facebook** tab, then **Instagram**, then toggle **This week / This month / All time** and **Sort by Reach**. | "**pages_read_engagement**: reads the user's Page posts and videos, their captions, dates and engagement. Here are the user's top Facebook videos. **instagram_manage_insights**: reads views, reach and engagement for the user's Instagram videos and Reels." |
| 2:45 | Expand **Why it worked** on one video. | "For each video we show the hook, length, format and posting time, so creators can learn what works. Link clicks exist per video on Facebook only. For Instagram we show account-level profile link taps and label it that way." |
| 3:00 | *(Only if you request it.)* Show the Page picker or **Your accounts** again. | "**business_management**: needed to read Pages and Instagram accounts that are owned through a Business portfolio. If it is not required for your account, remove it from the request." |
| 3:10 | Click **Disconnect** on one account and confirm it disappears. Reconnect it if you want to continue. | "A user can disconnect any account at any time. That removes its token and its statistics." |
| 3:20 | Scroll to **Delete my data**, expand it, type `DELETE`, press **Delete everything**. You land on the login page. | "Users can delete all of their data at any time. This removes their connected accounts, tokens, statistics and login." |
| 3:35 | Open `/data-deletion` and `/privacy` in the address bar for a few seconds each. | "Our privacy policy and data deletion instructions are public. Facebook can also send us a data deletion request, which we process automatically." |
| 3:45 | End on the privacy page. | "That is how the app uses each permission. Thank you." |

## Tips
- Do not speed up or cut the Facebook permission dialog. Reviewers need to see it in full.
- If a number looks empty, that video simply has no data for that metric yet. Pick videos with real views before recording.
- Record each permission's use clearly. A reviewer who can't see a permission being used will reject it, so drop `business_management` from the request if you can't show a real use.
- Do not delete the main test account while recording if you want to keep it. Create a second throwaway user (or a Meta test user) for the final **Delete my data** step.
- Export as MP4. Keep each file under the size limit shown in the submission form. Add the script's narration as captions if your voice-over is unclear.
- In the submission notes, include the site URL, the test login steps, and which permission is shown at which timestamp (use the table above).

# App Review: permission justifications

Paste each text into the matching permission's "How will your app use this permission?" box.
Timestamps refer to the screencast in `SCREENCAST.md`. Replace `<SITE>` with the production URL.

## Summary (use in the general "App details" / notes field)
The Z-Fast Affiliate Dashboard lets affiliates and UGC creators who work with Z-Fast Digital Marketing Agency see which
of their own Facebook and Instagram videos perform best. Each creator signs in, connects their own Facebook Page and
the Instagram professional account linked to it, and sees statistics for their own videos only. Z-Fast administrators can
see all affiliates' statistics to run the affiliate programme. We read data only; the app never posts, comments, messages
or changes anything on a user's accounts. We do not sell data, use it for advertising, or share it with third parties
other than our hosting providers (Supabase, Vercel). Users can disconnect an account or delete all their data at any time
in the app, and from Facebook's settings (data deletion callback). Privacy policy: <SITE>/privacy

## pages_show_list
**Text:** After the user logs in, we call `GET /me/accounts` to list the Facebook Pages they manage, and show those Page
names (and the linked Instagram handle) on a "Choose your Facebook Page" screen. The user picks the one Page they want to
connect. We need this permission because without it we cannot know which Pages the user manages or let them choose. We
only keep the ID and name of the Page the user selects. *(Screencast 1:10)*

## pages_read_engagement
**Text:** For the Page the user selected, we read its posts and videos (`/{page-id}/posts`, `/{page-id}/videos`): caption,
publish date, permalink, thumbnail, video length, and reaction, comment and share counts. We use this only to show the
creator a ranked list of their own videos ("Top videos") with the hook, length, format and posting time of each, so they can
learn what works. We only read content from the Page the user chose, for videos published in the last 90 days.
*(Screencast 2:20 and 2:45)*

## read_insights
**Text:** For each video on the user's Page we read Page post insights (`post_media_view`, `post_total_media_view_unique`,
`post_clicks_by_type`) to show the creator that video's views, reach and link clicks. We show these per video, add them up
for the chosen period (last 7 days, last 30 days, this month, custom) and chart them over time. The numbers are shown only
to the creator who owns the Page and to Z-Fast administrators. We do not use insights for any other purpose.
*(Screencast 1:50 and 2:05)*

## instagram_basic
**Text:** We use the Page's linked Instagram professional account (`instagram_business_account`) to identify the account
the user is connecting, show its username on the account-selection screen, and read the list of its video media
(`/{ig-user-id}/media`: caption, media type, permalink, thumbnail, timestamp) for the last 90 days. This is needed so we can
list the creator's own Instagram videos and Reels next to their statistics. We only read media from the account the user
chose. *(Screencast 1:10 and 2:20)*

## instagram_manage_insights
**Text:** For each of the user's Instagram videos and Reels we read media insights (views, reach, likes, comments, shares,
saves, total interactions, and average watch time for Reels) and, at account level, profile link taps. We show these to the
creator in the KPI cards, the trend charts and the Top videos table, and label account-level link taps clearly because
Instagram does not report link clicks per video. We use the data only to help the creator see which of their videos perform
best. We never use this permission to change anything on the account. *(Screencast 2:05 and 2:20)*

## business_management  (only request it if your testing shows it is needed)
**Text:** Some of our creators manage their Facebook Page and Instagram account through a Business portfolio. For those
accounts the Pages and the linked Instagram account are not returned by `/me/accounts` unless this permission is granted. We
use it only so these creators can see and select the Page they own and connect it. We do not read or change any other business
assets, ad accounts, or settings. *(Screencast 3:00)*
If the whole flow works for a Page owned through a Business portfolio without this permission, **do not request it**; Meta
rejects permissions it cannot see being used.

## Data handling (use if the form asks)
- **What we store:** email; selected Page and Instagram account IDs and names; Facebook user ID (to honour deletion
  requests); the Page access token (encrypted, server-side only); video captions, links, thumbnails, dates and statistics
  for the last 90 days.
- **Who can see it:** the creator (own data only) and Z-Fast administrators. Service providers: Supabase (database,
  authentication, encrypted secrets) and Vercel (hosting).
- **Retention and deletion:** kept while the account is active. Users can disconnect an account or use "Delete my data" in
  the app at any time. We also implement the data deletion callback `<SITE>/data-deletion/callback` and instructions at
  `<SITE>/data-deletion`.
- **We do not:** sell data, use it for advertising or profiling, transfer it to data brokers, or post on a user's behalf.

## Notes for reviewers (paste into the test instructions field)
1. Open <SITE> and sign in with the test email below (a magic link is sent to that inbox; the credentials are provided
   in the private field of the submission).
2. Press **Connect Facebook & Instagram**, approve the dialog, select the test Page, then press **Connect**.
3. Press **Sync now**. After it finishes the dashboard shows KPI cards, charts and the Top videos table.
4. Use **Disconnect** and **Delete my data** (type `DELETE`) in Settings to see data removal.
The test Page has a linked Instagram Business account and recent videos.

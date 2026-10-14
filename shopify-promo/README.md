# Mix & Match Activity Promo: Shopify Foundation

## Files
- `build_catalog.py`: source of truth. Edit the `R` list, then run `python3 -I build_catalog.py`.
- `catalog.json`: structured catalog (tier, duration, capacity, min pax, price).
- `shopify_products.csv`: import via **Products → Import**. 21 products, 30 variants.

## Catalog structure
| Sheet | Shopify |
|---|---|
| Activity Choices (Main / Secondary / Group) | **Collections** (3), driven by tags `tier:main`, `tier:secondary`, `tier:group` |
| Services | **Product** |
| Variations (Debora, Solo/Duo/Trio, 15/30 min...) | **Variant** (Option "Variation") |
| Duration, Capacity, Min pax, Notes | Product **metafields** (create the definitions first, then fill them in) |
| Joiner vs Per Pax | Tag `price-type:joiner` / `per_pax` / `per_booking` |

Variant inventory is left untracked and set to "continue selling", since these are services. If you need dates or time slots, add a booking app. Shopify has no native date or slot picker.

## Promo mechanic (recommended)
Tiered mix-and-match: the more *different* activities in the cart, the bigger the discount.

| Cart contains | Discount |
|---|---|
| 2 activities | 5% off |
| 3 activities | 10% off |
| 4+ activities | 15% off |

Rules to decide:
1. **Eligible:** all products tagged `promo-eligible`. Remove the tag from anything with thin margin, such as Red Whale at ₱3,000.
2. **Count distinct activities, not quantity.** Otherwise 3 pax on one tour triggers the 3-activity tier.
3. **Group activities** (Banana Boat, Hurricane, UFO and others) have a minimum pax. The cart can't enforce this natively. Add a line-item property "Number of guests" or use an app.
4. **Cap the discount at the cheapest item,** so margins stay predictable.

## How to build it in Shopify
- **Native option (simple):** Discounts → Create → *Buy X get Y*. Example: buy any 2 from the "Promo Eligible" collection, get 1 from the same collection at 10% off. It is limited to one rule per discount, with no true tiers.
- **Tiered option (recommended):** a Shopify Functions discount app (Shopify Discount Functions), or a bundle app such as Bundler, Fast Bundle or Mix & Match. Look for support for "tiered discounts by distinct product count" and "Shopify Functions" so the discount applies at checkout.
- **Storefront:** a "Build your adventure" page with the 3 collections as steps, a progress bar ("Add 1 more to unlock 10% off"), and an automatic discount applied at checkout.

## Sheet issues to confirm before import
1. **Parasailing / Jetski:** the Solo (₱2,500), Duo (₱3,600) and Trio (₱5,400) prices look like per-booking totals, not per pax. Jetski is similar. They are tagged `price-type:per_booking`. Confirm.
2. **Joiner vs per-pax mixing:** yacht, island hopping and Party Boat are joiner rates. Paraw Sailing is also entered as joiner (₱900). Confirm the price-type tags are right.
3. **Missing durations or capacities** on some yacht and ATV rows were left blank.
4. **ATV Mainland / Buggy Car:** I read these as Mega Paraw ATV and Mega Paraw Buggy variants, both ending with a zipline. Confirm the naming.
5. Spelling "Yatch" was corrected to "Yacht" in titles.

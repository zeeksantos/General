"""Generates catalog.json + shopify_products.csv from the activity sheet."""
import csv, json, re

# tier, product, option(variation), duration, capacity, min_pax, price, price_type, notes
R = [
 ("main","Island Hopping Joiners","Standard","4 hours","up to 50 pax",1,900,"joiner","4-6 hours of island hopping with sightseeing across multiple islands"),
 ("main","Party Yacht Experience","Debora","2 hours","70-80 pax",1,1500,"joiner",""),
 ("main","Party Yacht Experience","Diamond Cruise","2 hours","",1,1600,"joiner",""),
 ("main","Party Yacht Experience","Sally Yacht","3 hours","50 pax",1,1800,"joiner",""),
 ("main","Party Yacht Experience","Sundancer","3 hours","",1,1500,"joiner",""),
 ("main","Party Yacht Experience","Red Whale","4 hours","",1,3000,"joiner",""),
 ("main","Parasailing","Solo","10 minutes","1 pax",1,2500,"per_booking","Enjoy parasailing with 3-person capacity"),
 ("main","Parasailing","Duo","10 minutes","2 pax",1,3600,"per_booking","Enjoy parasailing with 3-person capacity"),
 ("main","Parasailing","Trio","10 minutes","3 pax",1,5400,"per_booking","Enjoy parasailing with 3-person capacity"),
 ("main","Jetski Ride","15 minutes","15 minutes","up to 2 pax",1,2500,"per_booking","Up to 2 pax per jetski"),
 ("main","Jetski Ride","30 minutes","30 minutes","2-4 pax",1,3800,"per_booking","Up to 4 pax, 2 pax per ride. Max 2 passengers per jetski at one time; the 4-pax package is subject to the operator's ride-sharing arrangement."),
 ("main","ATV Mainland Package","Mega Paraw ATV","2-3 hours","",1,1500,"per_pax","ATV ride followed by a zipline adventure"),
 ("main","Buggy Car Ride","Mega Paraw Buggy","2-3 hours","",1,1800,"per_pax","ATV ride followed by a zipline adventure"),
 ("main","ATV Adventure by Zetro","Zetro ATV (Boracay Newcoast)","2-3 hours","",1,1800,"per_pax","ATV only"),
 ("main","ATV Adventure by Zetro","Zetro ATV (Trail)","2-3 hours","",1,1200,"per_pax","ATV only"),
 ("secondary","Helmet Diving","Standard","15 minutes","",1,1500,"per_pax","Dive for 15 minutes with photos and videos included"),
 ("secondary","Party Boat","Debora","2 hours","50 pax",1,1000,"joiner",""),
 ("secondary","Crystal Kayak Pictorial","Standard","15 minutes","1 pax",1,300,"per_pax",""),
 ("secondary","Mermaid Tail Rental","Standard","1 hour","",1,300,"per_pax",""),
 ("secondary","Paraw Sailing","Standard","30 minutes","",1,900,"joiner",""),
 ("secondary","Freediving","Standard","2 hours","",1,3000,"per_pax",""),
 ("secondary","Scuba Diving","Standard","2 hours","",1,2500,"per_pax","With photos and videos"),
 ("secondary","Paddle Boarding Rental","Standard","1 hour","up to 2 pax",1,600,"per_pax",""),
 ("group","Banana Boat Ride","Standard","15 minutes","up to 20 pax",6,450,"per_pax","Minimum 6 participants. Maximum 20 per session."),
 ("group","Hurricane","Standard","15 minutes","up to 6 pax",4,750,"per_pax","Minimum 4 participants. Maximum 6 per session."),
 ("group","UFO Ride","Standard","15 minutes","up to 6 pax",4,700,"per_pax","Minimum 4 participants. Maximum 6 per session."),
 ("group","Bandwagon","Standard","15 minutes","6 pax",4,750,"per_pax","Minimum 4 participants. Maximum 6 per session."),
 ("group","Gladiator Boat","Milkys","15 minutes","up to 10 pax",6,750,"per_pax","Minimum 6 participants. Maximum 10 per session."),
 ("group","Land Tour","E-Trike","3 hours","up to 7 pax",5,3000,"per_pax","Minimum 5 participants."),
 ("group","Land Tour","Aircon Van","3 hours","up to 10 pax",5,5000,"per_pax","Minimum 5 participants."),
]
TIER = {"main":"Main Activity","secondary":"Secondary Activity","group":"Secondary - Group Activity"}
slug = lambda s: re.sub(r"[^a-z0-9]+","-",s.lower()).strip("-")

products = {}
for t,p,o,d,c,m,price,pt,n in R:
    products.setdefault(p,{"tier":t,"variants":[]})["variants"].append(
        dict(option=o,duration=d,capacity=c,min_pax=m,price=price,price_type=pt,notes=n))
json.dump(products, open("catalog.json","w"), indent=2)

hdr = ["Handle","Title","Body (HTML)","Vendor","Type","Tags","Published","Option1 Name","Option1 Value",
       "Variant SKU","Variant Inventory Tracker","Variant Inventory Policy","Variant Fulfillment Service",
       "Variant Price","Variant Requires Shipping","Variant Taxable","Status"]
with open("shopify_products.csv","w",newline="") as f:
    w = csv.writer(f); w.writerow(hdr)
    for title,info in products.items():
        h = slug(title); t = info["tier"]
        tags = [f"tier:{t}", "promo-eligible", f"price-type:{info['variants'][0]['price_type']}"]
        for i,v in enumerate(info["variants"]):
            body = ""
            if i==0:
                notes = info["variants"][0]["notes"]
                body = f"<p>{notes}</p>" if notes else ""
            w.writerow([h, title if i==0 else "", body, "Boracay Activities" if i==0 else "",
                        TIER[t] if i==0 else "", ",".join(tags) if i==0 else "", "TRUE" if i==0 else "",
                        "Variation", v["option"], f"{slug(title)}-{slug(v['option'])}".upper(),
                        "", "continue", "manual", v["price"], "FALSE", "FALSE", "active" if i==0 else ""])
print(len(products),"products,",len(R),"variants")

# #DIV/0! fixes (September 2026 and October 2026 tabs; same for August rows 18-32 if needed)

I could only read cell values, not the formula text, so these are written from the labels and the August tab's numbers (CPM = D/C; Avg lead per agent ~= C/8). Check them against the August formulas.

Daily columns (fill down rows 2-32):
- M2  Average CPM:            =IFERROR(D2/C2,"")
- N2  Avg lead per agent:     =IF(C2="","",ROUND(C2/8,0))   <- keep your existing divisor if it isn't 8

Overall Summary block (S column; row labels in R):
- Messages Received:   =SUM(C2:C32)
- Amount Spent:        =SUM(D2:D32)
- Average CPM:         =IFERROR(SUM(D2:D32)/SUM(C2:C32),"")
- Warm Lead Rate:      =IFERROR(SUM(J2:J32)/SUM(C2:C32),"")
- Hot Lead Rate:       =IFERROR(SUM(K2:K32)/SUM(C2:C32),"")
- Dump Lead Rate:      =IFERROR(SUM(I2:I32)/SUM(C2:C32),"")

Also: the summary header on Sept/Oct says "Overall Summary (August 1 - 15)" - looks copied from August.

# Fee & Expense Manager Pro v1

A GitHub Pages-ready, local-first finance management system designed for teachers, coaching centers and small education businesses.

## 100-feature coverage

1. Finance dashboard
2. Total fees collected
3. Total pending fees
4. Current month collection
5. Current month expense
6. Net income
7. Student count
8. Paid count
9. Unpaid/partial count
10. Student finance snapshot
11. Add student
12. Edit student
13. Archive student
14. Student ID
15. Class/section
16. Parent/guardian
17. Phone
18. Email
19. Monthly fee
20. Admission fee
21. Fixed discount
22. Percentage discount
23. Custom due day
24. Tags
25. Notes
26. Student search
27. Student payment status
28. Current-month due calculation
29. Lifetime outstanding estimate
30. Payment profile
31. Record payment
32. Payment date
33. Fee month
34. Amount
35. Cash
36. UPI
37. Bank transfer
38. Card
39. Other payment method
40. Full payment
41. Partial payment
42. Advance payment support
43. Payment note
44. Auto receipt number
45. Receipt generation
46. Receipt history
47. Receipt reprint
48. Receipt search
49. Current-month tracking
50. Month picker
51. Due day
52. Due list
53. Overdue identification
54. Partial-paid filter
55. Reminder copy
56. WhatsApp reminder helper
57. Reminder history
58. Add expense
59. Expense categories
60. Custom categories
61. Expense date
62. Expense amount
63. Expense method
64. Expense description
65. Expense history
66. Expense delete
67. Daily collection data
68. Weekly-ready transaction data
69. Monthly report
70. Yearly-ready stored data
71. Class-wise collection
72. Payment-method analysis
73. Net income report
74. Monthly print report
75. Six-month cashflow chart
76. Expense category analysis
77. Payment-method mix
78. Payment coverage %
79. Average monthly fee
80. All-time net income
81. Student CSV export
82. Payment CSV export
83. Expense CSV export
84. Full JSON backup
85. JSON restore
86. Storage usage indicator
87. Auto-save
88. Save on page hide
89. Save on exit
90. Dark mode
91. PIN lock
92. Mobile responsive navigation
93. Toast notifications
94. Form validation
95. Demo data loader
96. Application reset
97. Keyboard shortcuts
98. Printable student list
99. Printable due list
100. Printable receipts

## File structure

```text
index.html
manifest.webmanifest
sw.js
assets/
  css/
    style.css
  js/
    app.js
README.md
```

Keep these paths exactly. Do not flatten `style.css` or `app.js` into the root.

## Data

Data is stored under localStorage key `fem_pro_v1`. Export JSON backups regularly.

## GitHub Pages

Upload the exact structure above to the repository. If a previous service worker keeps an old version visible, clear the site's browser cache once after deployment.

## Notes

This is a browser-only system. It does not provide unattended online payment collection or background WhatsApp sending. It prepares records and opens normal WhatsApp links for the teacher.

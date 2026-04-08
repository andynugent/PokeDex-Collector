# PokeDex-Collector

I'd like an Android app for my 10 year old son, to record the Pokémon cards that he has. Should be able to search quickly and record variants of the same card / Pokémon. Ideally with some stats for how complete each series is.

6 Apr

Reading frontend design skill
Reading frontend design skill
Since this is for a 10-year-old Pokémon fan, I'll build a fun, vibrant React app with a Pokémon card collection tracker — playful and bold, with bright colors, card visuals, and smooth interactions. I'll use the Pokémon TCG API to get real card data.


Created a file, read a file
Created a file, read a file
Here's your son's PokéDex Collector app! 🎴⚡

What it does:

🔍 Browse tab — Search any Pokémon by name (e.g. "Pikachu", "Charizard") and filter by set. Real card images load from the Pokémon TCG API. Tap a card to add it to the collection — it gets a gold ✓ badge. Tap again to remove it.

📦 Sets tab — Shows every major set (Scarlet & Violet, Sword & Shield) with a coloured progress bar showing how many cards he owns out of the full set total. Tap any set to browse its cards. An overall stats block shows totals, sets started, and sets completed.

⭐ My Cards tab — His full collection, grouped by set, sorted by card number. Tap any card to remove it.

Features for your son:

Real card artwork fetched live
Gold glow on owned cards so it's instantly obvious what he has
Progress bars per set — the completionist itch! 🏆
Fast name search with debouncing
Data saved locally in the browser (persists between sessions)
Mobile-optimised layout (480px max, sticky header, big tap targets)
To run it on Android, you can drop this into any React environment (Vite, Create React App, or Expo Web). Let me know if you'd like me to package it as a full standalone HTML file instead — that would work directly in any mobile browser with zero setup!


Pokemon tracker
Code · JSX 

# Muninn - ᛗᚢᚾᛁᚾᚾ

A Linux desktop companion that remembers what you listen to, with synced lyrics and MPRIS integration.

Muninn (Old Norse for "memory" or "mind") is one of the two ravens, alongside Huginn ("thought" in English), that accompany the god Odin. They act as his messengers, flying across the world to gather information and returning to whisper news into his ears. 
Muninn represents memory, while Huginn represents thought/mind. In the same spirit, Muninn-the-project collects MPRIS data, remembers what you listen to, and gives that information back to you.

## Disclaimer

This project is a learning-driven implementation used to explore React and Tauri in a real-world desktop application.
The focus is on architecture, data flow, and maintainability rather than feature completeness.

## Features

### Current playing
The app shows what you are listening to, regardless of the player or browser you are using (excluding YouTube videos).
You can read song title, artist(s), album, song length, progress (as elapsed time, percentage and visual progress bar).

### Lyrics
Muninn automatically loads the lyrics of the song you're listening to, using lrclib API. If a sync'ed lyrics are available, the app highlights each line based on the song progression. If not, it shows the lyrics without times.

### Stats
All the song you're listening is tracked (locally, don't worry!). You can view:
- tracks sorted by total listening time
- artists sorted by total listening time


## TODO
- ~~Better mpris and track switchin/saving management~~
- ~~Add lyrics loading capability~~
- ~~Change stats UI, compressing data in a narrow column~~
- ~~Add time ranges (today, 7d, 30d, all)~~
- ~~Stats by album~~
- ~~Song length update when wrong in the first mpris event~~
- New layout (see below)
- Make filters resistent to stats type change
- Flush current song when closing app
- Add history graph for artists
- Exclude plays without an artist
- Limit stats refresh during music listening
- Add search feature (by title, by artist, etc.)
- ~~Add filter feature (by title, by artist, etc.)~~
- ~~Limit number of results shown in stats (top 10, top 25, top 50, something like that)~~
- Collapse songs belonging to multiple albums when reading statistics from the database?
- Add comparisons between different time ranges stats (current vs previous)? (partially replaced by history charts?)
- Add the ability to reset a song counter or ignore a song/artist
- Add the ability to merge one song listening time into another

### New layout (TODO)
- Tabs for mode selection: one view if using halfscreen, two views if using fullscreen
- Three available views: lyrics, rankings, history graphs

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

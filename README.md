# Muninn - ᛗᚢᚾᛁᚾᚾ

A Linux desktop companion that remembers what you listen to, with synced lyrics and MPRIS integration.

Muninn (Old Norse for "memory" or "mind") is one of the two ravens, alongside Huginn ("thought" in English), that accompany the god Odin. They act as his messengers, flying across the world to gather information and returning to whisper news into his ears. 
Muninn represents memory, while Huginn represents thought/mind. In the same spirit, Muninn-the-project collects MPRIS data, remembers what you listen to, and gives that information back to you.

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
- Change stats UI, compressing data in a narrow column
- Add time ranges (today, 7d, 30d, all)
- Add comparisons between different time ranges stats
- Limit number of results shown in stats
- Add the ability to reset a song counter or ignore a song/artist
- Add the ability to merge one song listening time into another

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

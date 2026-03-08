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

## Architecture Overview

The project has been re-engineered into a decoupled architecture to improve efficiency and allow for background data collection without a persistent graphical interface. It now consists of two main components:

- muninn-daemon: a lightweight, headless background process written in pure Rust. It monitors music playback via MPRIS, handles data persistence (SQLite), and manages lyrics fetching/caching. It runs silently in the background. It logs to file (/tmp/muninn_daemon.log)
- muninn-gui: a Tauri+React app that can be launched on demand. It connects to the daemon for playing and lyrics updates and provides listening statistics and charts.

### Why this split?
- resource efficiency: the daemon, always running, consumes approx. 3Mb of RAM and minimal CPU. The webkit-based GUI is active only when you want to interact with it
- flexibility: the daemon acts as a single source of truth and can serve data to multiple clients (atm, the main GUI)

## TODO
- ~~Better mpris and track switchin/saving management~~
- ~~Add lyrics loading capability~~
- ~~Change stats UI, compressing data in a narrow column~~
- ~~Add time ranges (today, 7d, 30d, all)~~
- ~~Stats by album~~
- ~~Song length update when wrong in the first mpris event~~
- ~~Add filter feature (by title, by artist, etc.)~~
- ~~Limit number of results shown in stats (top 10, top 25, top 50, something like that)~~
- ~~New layout~~
- RE-ENGINEERING: split the project into two parts: a daemon and a client/UI - Doing!
    - ~~Give to the daemon the responsability of listening to mpris events, tracking the playing time, saving stats data~~
    - ~~Give to the daemon the responsability for lyrics downloading and sending~~
    - ~~Send lyrics to gui on connection too~~
- Ignore whatsapp, telegram and every streaming without artist
- DAEMON: Flush current song when closing daemon?
- DAEMON: Wait 30s before lyrics downloading at the first time
- DAEMON: Wait 60s before lyrics writing on db at the first time
- DAEMON: Fix song length even after the first event of a song playing
- GUI: Make filters resistent to stats type change
- DAEMON: Exclude plays without an artist
- GUI: Add search feature (by title, by artist, etc.)
- GUI: Collapse songs belonging to multiple albums when reading statistics from the database?
- GUI: Add comparisons between different time ranges stats (current vs previous)? (partially replaced by history charts!)
- GUI: Add the ability to reset a song counter or ignore a song/artist
- GUI: Add the ability to merge one song listening time into another

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

## How to compile and run

### Daemon
In dev mode, you can exec `cargo run --bin muninn-daemon` from the project root or `cargo run` from the daemon folder.

In production mode, you can exec `cargo build --bin muninn-daemon` from the project root or `cargo build` from the daemon folder.

### GUI
In dev mode, you can exec `pnpm tauri dev` from the gui folder.

In production mode, you can exec `pnpm tauri build --no-bundle`.
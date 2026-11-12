# Song_Creatures_Project

This is the code for the project that won us 2nd place at the Bournemouth University Hackathon (March 2026).
Creature Feature turns your Spotify listening into a collection of 3D creatures. Log in with Spotify, and every song becomes a creature you can collect, with its look and stats based on the track itself. Then play music mini-games to win more creatures.


## Team
 
- **Emma Scott** ([@AmmeJane](https://github.com/AmmeJane)): Back end, Spotify integration, creature generation and environment
- **Alona Korniienko** ([@alenochkako](https://github.com/alenochkako)): Mini-games


## Tech stack
 
| Part | Tech |
|---|---|
| Front end | React 19, TypeScript, Vite, Tailwind CSS, React Router |
| 3D | Three.js |
| Audio | Web Audio API using Deezer's 30 second previews |
| Back end | Node.js, Express 5, TypeScript |
| Data | Spotify Web API, Deezer API, JSON file storage |

## Improvements

This was built in 4 days, and presented on the 5th, so there are many improvements I would make. It was made and tested only on the local machine.
These are some improvements we might have made with more time.
- Store users in a proper database instead of a JSON file
- Handle Spotify tokens per user and refresh them, instead of keeping one token in memory
- Move the hardcoded localhost URLs into config so it can be deployed
- Add more creature types and mini-games

# SlotQuest

SlotQuest is a dungeon crawling game that recommends online slots for players based on the games available in the Stake.json file. It's a fun way to track your slot game plays and visualize your journey through different games.

## Running the Game

### Play Online
The game is available online at: https://aurbanec.github.io/slotquest/

### Local Setup
1. Download or clone this repository
2. Open `index.html` in your web browser

### GitHub Codespaces
1. Push the code to a GitHub repository
2. Open the repository on GitHub
3. Click the "Code" button and select "Open with Codespaces"
4. Once the Codespace is ready, you have two options:
   - Run `node server.js` in the terminal and click the "Open in Browser" button
   - OR run `npx http-server` (this will install http-server if not already present)

### GitHub Pages Setup
1. Push the code to a GitHub repository
2. Go to your repository on GitHub
3. Click on "Settings"
4. Scroll down to the "GitHub Pages" section
5. Under "Source", select "main" branch
6. Click "Save"
7. Your site will be available at https://yourusername.github.io/slotquest/

## How to Play
1. Load the game in your browser
2. On the title screen, set your parameters:
   - **Total Play Amount**: How much money you're starting with
   - **Min/Max Buy Amount**: The range of bet sizes you want to play
   - **Number of Games**: How many different slots you want to play
   - **Game Providers**: Select which game providers you want to include

3. Click "Start Quest" to begin your adventure.

4. In each "room" (game):
   - You'll see a random slot from your selected providers
   - You can choose to "Re-roll" to get a different slot (if the site you're playing on doesn't have this particular slot)
   - Enter your buy amount and click "Play This Slot"
   - After playing the actual slot game on your preferred gaming site, return to SlotQuest and enter the amount you received

5. After completing all rooms, you'll see a results screen showing:
   - Your final balance
   - Total profit/loss
   - Results from each slot played
   - Your best and worst performing slots

## Game Features

- Track your slot game sessions in a fun dungeon crawler format
- Filter games by provider with quick options:
  - "Select Big 3" button to quickly select Pragmatic Play, Nolimit City, and Hacksaw Gaming
  - "Clear All" button to deselect all providers
- Random buy amounts for each slot (rounded to nearest 10)
- Visual "health bar" that represents your current balance
- Summary of your best and worst performing slots
- Responsive design that works on desktop and mobile

## Visual and Interactive Features

- **Animated Transitions**: Smooth transitions between game screens
- **Room Announcements**: Dramatic "Room X" announcements as you progress
- **Card Flip Animations**: Slot cards flip when showing a new slot
- **Coin Animations**: Coins fly from your wallet to the slot when you play
- **Win/Loss Effects**: Visual feedback with particles and effects when you win or lose
- **Sound Effects**: Audio cues for button clicks, wins, losses, and game events
- **Dynamic Result Screen**: The results screen changes based on whether you ended with a profit or loss
- **Confetti Celebration**: If you end with a profit, confetti rains down on your results
- **Trophy Indicators**: Your best/worst performing slots get special trophy and skull indicators

## Gaming Interface

The interface is designed like a dungeon crawler with:
- A dungeon background theme
- Slots presented as "monsters" to defeat
- Your balance represented as a health bar
- Room-to-room progression like moving through a dungeon
- Win/loss animations that show your battle results

## Technical Details

SlotQuest is built using plain HTML, CSS, and JavaScript. The game data is loaded from the stake.json file, which contains information about various slot games including their names, providers, and image URLs.

## New Slot Management Features

The application now includes a slot management interface accessible at `/admin.html`. This interface allows you to:

### Provider Bet Level Management
- Define default bet levels for each game provider
- Each provider has a set of predefined bet levels that will be used by default for its games
- Add or remove bet levels for any provider
- These provider defaults ensure consistent bet amounts across games from the same provider

### Slot Management
- Edit existing slots or add new ones
- Set custom bet levels for individual slots, overriding provider defaults
- Edit slot names, providers, and image URLs
- Filter and search through the slot library
- Create new slots with your own custom settings

### Bet Level Integration
- The game now uses these bet levels when determining available bet amounts
- When playing a slot, the available bet amounts will match either the slot's custom bet levels or its provider's default levels
- Bet levels are filtered based on the player's current balance and min/max bet settings
- This creates a more realistic and authentic slot experience

### How to Use Slot Management
1. Access the slot management interface at `/admin.html` or click the "Slot Management" button in the footer
2. Use the tabs to switch between Provider Settings and Slot Management
3. When creating or editing slots, you can:
   - Set custom bet levels that override provider defaults
   - Return to provider defaults by removing all custom bet levels
   - Save changes which will be stored in the stake.json file

## Disclaimer

SlotQuest is designed for entertainment and tracking purposes only. It does not allow actual gambling and is meant to be used alongside your regular slot gameplay on licensed gambling sites. Always gamble responsibly and set limits for yourself.

## Tip Jar

If you enjoy SlotQuest, feel free to send a tip to any of the cryptocurrency addresses listed in the footer of the application.

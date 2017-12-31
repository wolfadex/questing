# questing


### Install:
`yarn add questing` or `npm install --save questing`

### Use:
`gameData.json`
```JSON
{
  "title": "Brief",
  "author": "Wolfgang Schuster",
  "inventory": [],
  "location": "start",
  "items": {
    "pebble": "A tiny stone, not sure it could be used for anything"
  },
  "spaces": {
    "start": {
      "description": "A small white room with a red door and a steel gate.",
      "exits": {
        "red_door": {
          "destination": "end",
          "locked": "pebble"
        },
        "steel_gate": {
          "destination": "other",
          "locked": false
        }
      },
      "items": []
    },
    "other": {
      "description": "A circular room with a steel gate.",
      "exits": {
        "steel_gate": {
          "destination": "start",
          "locked": false
        }
      },
      "items": [
        "pebble"
      ]
    },
    "end": {
      "description": "A large open field, you've won the game!",
      "exits": {
        "red_door": {
          "destination": "start",
          "locked": false
        }
      },
      "items": []
    }
  }
}

```
`myGame.js`
```JavaScript
const questing = require('./index');
const gameData = require('./gameData.json');

questing(gameData);

```

Then just `node ./myGame` from a terminal!

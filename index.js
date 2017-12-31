const apiai = require('apiai');
const prompt = require('prompt');
const config = require('./config.json');

let devConfig = {};

try {
  devConfig = require('./config.dev.json');
} catch (e) {}

const options = { ...config, ...devConfig };
const projectId = 'questing-cd6bb';
const sessionId = 'quickstart-session-id';
const languageCode = 'en-US';
const app = apiai(options.API_KEY);

prompt.message = 'Next action';
prompt.delimiter = '';

function gameLoop(gameData, nextLine = '', prevResponse) {
  console.log('\x1Bc');
  console.log(`
${nextLine}

`);

  if (Object.keys(devConfig).length > 0) {
    // Dev mode
    console.log('Response:', prevResponse);
    console.log('Game Data:', gameData);
  }

  prompt.get('?', function(err, result) {
    if (result['?'] === 'quit') {
      return;
    }

    const request = app.textRequest(result['?'], { sessionId });

    request.on('response', (response) => {
      const {
        result: {
          parameters = {} ,
        } = {},
      } = response;
      const {
        receiver = '',
        action = '',
        usingItem = '',
      } = parameters;
      const receiverTrimmed = receiver.trim().replace(/\s/gi, '_');
      const usingItemTrimmed = usingItem.trim();
      const usingItemNoSpaces = usingItemTrimmed.replace(/\s/gi, '_');
      let nextDialog = `Sorry, I don't understand.`;
      let newGameData = { ...gameData };
      const spaceData = gameData.spaces[gameData.location];

      if (action) {
        switch(action.trim()) {
          case 'move':
            if (spaceData.exits[receiverTrimmed]) {
              if (spaceData.exits[receiverTrimmed].locked) {
                nextDialog = 'That way is locked.';
              } else {
                newGameData.location = spaceData.exits[receiverTrimmed].destination || newGameData.location;
                nextDialog = newGameData.spaces[newGameData.location].description;
              }
            } else {
              nextDialog = `Can't go that way.`;
            }
            break;
          case 'inspect': {
            if (receiverTrimmed === 'inventory') {
              if (gameData.inventory.length === 0) {
                nextDialog = `You have nothing on you.`;
              } else {
                nextDialog = `You have in your inventory:
${gameData.inventory.join('\n')}`;
              }
            } else if (receiverTrimmed === 'room') {
              nextDialog = `${spaceData.description}

Items:
${spaceData.items.join('\n')}`;
            }
            break;
          }
          case 'obtain': {
            if (spaceData.items.includes(receiverTrimmed)) {
              const newItems = spaceData.items.slice(0);
              const playerNewItems = newItems.splice(newItems.indexOf(receiverTrimmed), 1);

              newGameData.spaces[newGameData.location] = {
                ...spaceData,
                items: newItems
              };
              newGameData.inventory.push(...playerNewItems);
              nextDialog = `You now have '${playerNewItems}'`;
            }
            break;
          }
          case 'drop': {
            if (newGameData.inventory.includes(receiverTrimmed)) {
              const oldItems = newGameData.inventory.slice(0);
              const playerOldItems = oldItems.splice(oldItems.indexOf(receiverTrimmed), 1);

              newGameData.spaces[newGameData.location].items.push(...playerOldItems);
              newGameData.inventory = oldItems.slice(0);
            }
            break;
          }
          case 'use': {
            if (newGameData.inventory.includes(usingItemTrimmed)) {
              if (spaceData.exits[receiverTrimmed].locked === usingItemNoSpaces) {
                newGameData.spaces[newGameData.location].exits[receiverTrimmed].locked = false;
                nextDialog = 'You unlocked it!';
              } else {
                nextDialog = `That item doesn't work on that door`;
              }
            } else {
              nextDialog = `That item isn't in your inventory.`;
            }
            break;
          }
        }
      }

      gameLoop(newGameData, nextDialog, response);
    });
    request.on('error', (error) => {
      console.log(error);
    });
    request.end();
  });
}

module.exports = function newGame(gameData) {
  prompt.start();
  gameLoop(gameData, `${gameData.title}

${gameData.spaces[gameData.location].description}`);
};

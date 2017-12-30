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

function gameLoop(gameData, nextLine = '') {
  console.log('\x1Bc');
  console.log(`
${nextLine}

`);

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
        receiver,
        action,
      } = parameters;
      const receiverTrimmed = receiver.trim().replace(/\s/gi, '_');
      let nextDialog = `Sorry, I don't understand.`;
      let newGameData = { ...gameData };
      const spaceData = gameData.spaces[gameData.location];

      if (action) {
        switch(action.trim()) {
          case 'move':
            nextDialog = `
${spaceData.description}
`;
            newGameData.location = newGameData.spaces[newGameData.location].exits[receiverTrimmed] || newGameData.location;
            nextDialog = newGameData.spaces[newGameData.location].description;
            break;
          case 'inspect': {
            if (receiverTrimmed === 'inventory') {
              if (gameData.inventory.length === 0) {
                nextDialog = `You have nothing on you.`;
              } else {
                nextDialog = `You have in your inventory:
${gameData.inventory.join('\n')}.`;
              }
            } else if (receiverTrimmed === 'room') {
              nextDialog = spaceData.description;
            } else if (spaceData.items.includes(receiverTrimmed)) {
              nextDialog = `${newGameData.items[receiverTrimmed]}

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
            }
          }
          case 'drop': {
            if (newGameData.inventory.includes(receiverTrimmed)) {
              const oldItems = newGameData.inventory.slice(0);
              const playerOldItems = oldItems.splice(oldItems.indexOf(receiverTrimmed), 1);

              newGameData.spaces[newGameData.location].items.push(...playerOldItems);
              newGameData.inventory = oldItems.slice(0);
            }
          }
          default:
            console.log('carl', response)
            break;
        }
      }

      gameLoop(newGameData, nextDialog);
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

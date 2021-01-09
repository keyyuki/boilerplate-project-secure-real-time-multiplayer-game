const canvasWidth = 640;
const canvasHeight = 480;
const playerWidth = 30;
const playerHeight = 30;
const border = 5; // Between edge of canvas and play field
const infoBar = 45; 


const canvasCalcs = {
  canvasWidth: canvasWidth,
  canvasHeight: canvasHeight,
  playFieldMinX: (canvasWidth / 2) - (canvasWidth - 10) / 2,
  playFieldMinY: (canvasHeight / 2) - (canvasHeight - 100) / 2,
  playFieldWidth: canvasWidth - (border * 2),
  playFieldHeight: (canvasHeight - infoBar) - (border * 2),
  playFieldMaxX: (canvasWidth - playerWidth) - border,
  playFieldMaxY: (canvasHeight - playerHeight) - border,
}
function generateCoin() { 
    const x = Math.round(canvasCalcs.playFieldWidth * Math.random() )
    const y = Math.round(canvasCalcs.playFieldHeight * Math.random() ) + infoBar 
    return {
        x, y, w: 15, h: 15, value: 1, id: Date.now() + "-" + Math.round(Math.random() * 1000)
    }
 }
 function collision(player, item) {
    if (
      (player.x < item.x + item.w &&
        player.x + playerWidth > item.x &&
        player.y < item.y + item.h &&
        player.y + playerHeight > item.y)
    )
      return true;
  }
module.exports = function socketGateway(socket) {
    const playerList = [];
    let coin = generateCoin()
    

    socket.on("connection", (client) => {
        console.log("connect")
        const  playerId= Date.now() + "-" + Math.round(Math.random() * 1000);
        const player = {
            id: playerId,
            score: 0
        }
        client.emit("init", {
            id: playerId,
            players: [...playerList],
            coin: coin
        })
        
        
        client.on("new-player", ({x , y , w , h , score , main, id}) => {
            playerList.push({x , y , w: playerWidth , h: playerHeight , score , main, id});
            
            socket.emit('new-player', {x , y , w :playerWidth, h : playerHeight, score , main: false, id})
        })
        
        client.on("disconnect", () => {
            playerList.splice(playerList.findIndex(item => item.id == playerId), 1)
            socket.emit("remove-player", playerId)
        })
        
        client.on("move-player", (dir, {x, y}) => {
            socket.emit("move-player", {
                id: playerId,
                dir,
                posObj: {x, y}
            })
            if(collision({
                x, y
            }, coin)){
                player.score += coin.value;
                socket.emit("update-player", player)
                
                coin = generateCoin();
                socket.emit("new-coin", coin)
            }
        })
        client.on("stop-player", (dir, {x, y}) => {
            socket.emit("stop-player", {
                id: playerId,
                dir,
                posObj: {x, y}
            })
        })
    })
}


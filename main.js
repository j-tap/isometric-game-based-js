'use strict';

class Game {

	constructor () {
		this.canv = document.getElementById('canvas');
		this.ctx = this.canv.getContext('2d');

		this.width = 0;
		this.height = 0;

		this.recalcSize();
		this.set();

		window.addEventListener('resize', () => {
			this.recalcSize();
			this.set();
		}, false);
	};

	recalcSize () {
		this.canv.width = window.innerWidth || root.clientWidth || body.clientWidth;
		this.canv.height = window.innerHeight || root.clientHeight || body.clientHeight;

		this.width = this.canv.width;
		this.height = this.canv.height;
	};

	set () {
		this.ctx.fillStyle = '#000';
		this.ctx.fillRect(0, 0, this.width, this.height);
	}

	clear () {
		this.ctx.clearRect(0, 0, this.width, this.height);
	};

	play () {
		this.loop();
		window.requestAnimationFrame(this.play.bind(this));
	};

	loop () {
		this.clear();
		tiles.drawAllTiles();
	}
}

class Keys extends Game {

	constructor () {
		super();
		let self = this;

		this.mouse = {
			isDown: false,
			pos: {x: 0, y: 0},
			posDown: {x: 0, y: 0},
			posUp: {x: 0, y: 0}
		};

		this.canv.addEventListener('mousemove', (e) => {
			self.mouse.pos.x = e.layerX;
			self.mouse.pos.y = e.layerY;
		})
		this.canv.addEventListener('mousedown', (e) => {
			self.mouse.isDown = true;
			self.mouse.posDown = {x: e.pageX, y: e.pageY};
		})
		this.canv.addEventListener('mouseup', (e) => {
			self.mouse.isDown = false;
			self.mouse.posUp = {x: e.pageX, y: e.pageY};
		});
	};
}

class World extends Game {

	constructor () {
		super();

	};
}

class Tiles extends World {

	constructor () {
		super();

		this.showCoordinates = true;
		this.colorOutline = '#ddd';
		this.colorGround = '#47b02e';
		this.colorSelect = '#b02e33';

		this.zoomCurrent = 1;

		this.cntX = 10;
		this.cntY = 10;
		this.tileWidthDefault = 480;
		this.tileHeightDefault = 240;

		this.tilesCenterX = this.tileWidthDefault * this.cntX / 2;
		this.tilesCenterY = this.tileHeightDefault * this.cntY / 2;
		this.tileWidth = this.tileWidthDefault;
		this.tileHeight = this.tileHeightDefault;

		this.selectedTileX = -1;
		this.selectedTileY = -1;
		this.posDragStartX = 0;
		this.posDragStartY = 0;
		this.posDragStopX = 0;
		this.posDragStopY = 0;

		this.posX = this.width / 2 - this.tilesCenterX;
		this.posY = this.height / 2;

		this.updParams();

		window.addEventListener('resize', () => {
			this.updParams();
		}, false);

		window.addEventListener('mousemove', (e) => {
			let pageX = e.pageX - this.tileWidth / 2 - this.posX;
			let pageY = e.pageY - this.tileHeight / 2 - this.posY;

			if (keys.mouse.isDown) {
				this.posDragStopX = this.posX;
				this.posDragStopY = this.posY;

				this.moving(e.pageX, e.pageY);
			} else {
				this.selectedTileX = Math.round(pageX / this.tileWidth - pageY / this.tileHeight);
				this.selectedTileY = Math.round(pageX / this.tileWidth + pageY / this.tileHeight);
			}
		});

		window.addEventListener('wheel', (e) => {
			if (e.deltaY > 0 && this.zoomCurrent < 3) // zoom out
				this.zoomCurrent += 1 
			else if (e.deltaY < 0 && this.zoomCurrent > 1) // zoom in
				this.zoomCurrent -= 1;

			this.zooming();
		});

		this.canv.addEventListener('mousedown', (e) => {
			this.posDragStartX = this.posX;
			this.posDragStartY = this.posY;
		});

		this.canv.addEventListener('mouseup', (e) => {
			this.posDragStopX = this.posX;
			this.posDragStopY = this.posY;
		});
	};

	moving (x, y) {
		let downX = keys.mouse.posDown.x;
		let downY = keys.mouse.posDown.y;
		let absX = Math.abs(downX - x);
		let absY = Math.abs(downY - y);

		let posX;
		let posY;

		if (downX > x) posX = this.posDragStartX - absX; // left
		else posX = this.posDragStartX + absX; // right
		if (downY > y) posY = this.posDragStartY - absY; // top
		else posY = this.posDragStartY + absY; // bottom

		this.posX = posX;
		this.posY = posY;

		this.calcPos();
	};

	zooming () {
		this.posX = this.width / 2 - this.tileWidth * this.cntX / 2 - (this.posDragStartX - this.posDragStopX);
		this.posY = this.height / 2;

		this.calcPos();
	};

	calcPos () {
		this.updParams();
		
		let maxX = (this.tileWidth * this.cntX - this.width);
		let maxY = (this.tileHeight * this.cntY - this.height);
		let posYOffset = this.tilesCenterY - this.tileHeight + this.tileHeight / 2;

		if (this.posX >= 0) { // left
			this.posX = 0;
		}
		if (this.posX <= -maxX) { // right
			this.posX = -maxX;
		}
		if (this.posY >= posYOffset) { // top
			this.posY = posYOffset;
		}
		if (this.posY <= -maxY + posYOffset) { // bottom
			this.posY = -maxY + posYOffset;
		}

		this.updParams();
	};

	updParams () {
		this.tileWidth = this.tileWidthDefault / this.zoomCurrent;
		this.tileHeight = this.tileHeightDefault / this.zoomCurrent;
		this.tilesCenterX = this.tileWidth * this.cntX / 2;
		this.tilesCenterY = this.tileHeight * this.cntY / 2;
		this.tilesCenterPosX = this.tilesCenterX - Math.abs(this.posX);
		this.tilesCenterPosY = this.tilesCenterY - Math.abs(this.posY);
		//console.info(this.tilesCenterPosX, this.tilesCenterX);
	};

	drawAllTiles () {
		for (let iX = (this.cntX - 1); iX >= 0; iX--) {
			for (let iY = 0; iY < this.cntY; iY++) {
				this.drawTile(iX, iY);
				house.createHouse(iX, iY);
			}
		}
	};

	drawTile (iX, iY) {
		let offX = iX * this.tileWidth / 2 + iY * this.tileWidth / 2 + this.posX;
		let offY = iY * this.tileHeight / 2 - iX * this.tileHeight / 2 + this.posY;

		if (iX == this.selectedTileX && iY == this.selectedTileY) {
			this.ctx.fillStyle = this.colorSelect;
		} else {
			this.ctx.fillStyle = this.colorGround;
		}

		this.ctx.moveTo(offX, offY + this.tileHeight / 2);
		this.ctx.lineTo(offX + this.tileWidth / 2, offY, offX + this.tileWidth, offY + this.tileHeight / 2);
		this.ctx.lineTo(offX + this.tileWidth, offY + this.tileHeight / 2, offX + this.tileWidth / 2, offY + this.tileHeight);
		this.ctx.lineTo(offX + this.tileWidth / 2, offY + this.tileHeight, offX, offY + this.tileHeight / 2);
		this.ctx.stroke();
		this.ctx.fill();
		this.ctx.closePath();

		/* Draw tile outline */
		let color = this.colorOutline;
		this.drawLine(offX, offY + this.tileHeight / 2, offX + this.tileWidth / 2, offY, color);
		this.drawLine(offX + this.tileWidth / 2, offY, offX + this.tileWidth, offY + this.tileHeight / 2, color);
		this.drawLine(offX + this.tileWidth, offY + this.tileHeight / 2, offX + this.tileWidth / 2, offY + this.tileHeight, color);
		this.drawLine(offX + this.tileWidth / 2, offY + this.tileHeight, offX, offY + this.tileHeight / 2, color);

		if (this.showCoordinates) {
			this.ctx.fillStyle = this.colorOutline;
			this.ctx.fillText(iX +'.'+ iY, offX + this.tileWidth / 2 - 9, offY + this.tileHeight/2 + 3);
		}
	};

	drawLine (x1, y1, x2, y2, color) {
		color = typeof color !== 'undefined' ? color : 'white';
		this.ctx.strokeStyle = color;
		this.ctx.beginPath();
		this.ctx.lineWidth = 2;
		this.ctx.moveTo(x1, y1);
		this.ctx.lineTo(x2, y2);
		this.ctx.stroke();
	};
}

class House extends World {
	constructor () {
		super();
		this.isActive = false;
	};

	createHouse (iX, iY) {
		let offX = iX * tiles.tileWidth / 2 + iY * tiles.tileWidth / 2 + tiles.posX;
		let offY = iY * tiles.tileHeight / 2 - iX * tiles.tileHeight / 2 + tiles.posY;

		//dr
		//console.info(offX, offY);
	}
}

let game = new Game();
let keys = new Keys();
let world = new World();
let tiles = new Tiles();
let house = new House();

game.play();